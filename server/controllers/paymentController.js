import User from '../models/User.js'
import { validationResult } from 'express-validator'
import {
  createCustomer,
  createOrder,
  createSubscription,
  getRazorpayKeyId,
  verifySignature,
} from '../services/razorpayService.js'

const LIFETIME_AMOUNT_PAISE = 2500000
const HYBRID_SETUP_AMOUNT_PAISE = 1000000

function buildReceipt(userId, type) {
  return `${type}_${String(userId).slice(-8)}_${Date.now()}`
}

async function getUserOrThrow(userId) {
  const user = await User.findById(userId)
  if (!user) {
    const error = new Error('User not found')
    error.statusCode = 404
    throw error
  }
  return user
}

export async function createCheckout(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() })
    }

    const { plan } = req.body
    if (!['lifetime', 'hybrid'].includes(plan)) {
      return res.status(400).json({ message: 'Invalid plan selected' })
    }

    const amount = plan === 'lifetime' ? LIFETIME_AMOUNT_PAISE : HYBRID_SETUP_AMOUNT_PAISE
    const order = await createOrder({
      amount,
      currency: 'INR',
      receipt: buildReceipt(req.user._id, plan),
      notes: {
        userId: String(req.user._id),
        plan,
      },
    })

    return res.status(201).json({
      keyId: getRazorpayKeyId(),
      plan,
      amount,
      currency: 'INR',
      orderId: order.id,
    })
  } catch (error) {
    next(error)
  }
}

export async function verifyOrder(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() })
    }

    const { plan, razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body

    if (!['lifetime', 'hybrid'].includes(plan) || !orderId || !paymentId || !signature) {
      return res.status(400).json({ message: 'Payment verification payload is incomplete' })
    }

    const valid = verifySignature({
      body: `${orderId}|${paymentId}`,
      signature,
    })

    if (!valid) {
      return res.status(400).json({ message: 'Invalid payment signature' })
    }

    const user = await getUserOrThrow(req.user._id)
    if (plan === 'lifetime') {
      user.billing = {
        ...user.billing,
        planType: 'lifetime',
        status: 'active',
        lifetimePaymentId: paymentId,
        activatedAt: new Date(),
      }
    } else {
      user.billing = {
        ...user.billing,
        planType: 'hybrid',
        status: 'setup_paid',
        setupPaymentId: paymentId,
      }
    }

    await user.save()

    return res.json({
      message: 'Payment verified',
      billing: user.billing,
    })
  } catch (error) {
    next(error)
  }
}

export async function createHybridSubscription(req, res, next) {
  try {
    const hybridPlanId = process.env.RAZORPAY_HYBRID_MONTHLY_PLAN_ID
    if (!hybridPlanId) {
      return res.status(500).json({
        message: 'RAZORPAY_HYBRID_MONTHLY_PLAN_ID is missing in server environment',
      })
    }

    const user = await getUserOrThrow(req.user._id)

    if (user.billing?.planType !== 'hybrid' || user.billing?.status !== 'setup_paid') {
      return res.status(400).json({
        message: 'Pay setup amount before starting auto-payment subscription',
      })
    }

    let customerId = user.billing?.razorpayCustomerId
    if (!customerId) {
      const customer = await createCustomer({
        name: user.name,
        email: user.email,
        notes: {
          userId: String(user._id),
        },
      })
      customerId = customer.id
    }

    const subscription = await createSubscription({
      plan_id: hybridPlanId,
      customer_notify: 1,
      total_count: 120,
      customer_id: customerId,
      notes: {
        userId: String(user._id),
        plan: 'hybrid',
      },
    })

    user.billing = {
      ...user.billing,
      planType: 'hybrid',
      razorpayCustomerId: customerId,
      razorpaySubscriptionId: subscription.id,
    }
    await user.save()

    return res.status(201).json({
      keyId: getRazorpayKeyId(),
      subscriptionId: subscription.id,
      customerId,
    })
  } catch (error) {
    next(error)
  }
}

export async function verifyHybridSubscription(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() })
    }

    const {
      razorpay_payment_id: paymentId,
      razorpay_subscription_id: subscriptionId,
      razorpay_signature: signature,
    } = req.body

    if (!paymentId || !subscriptionId || !signature) {
      return res.status(400).json({ message: 'Subscription verification payload is incomplete' })
    }

    const valid = verifySignature({
      body: `${paymentId}|${subscriptionId}`,
      signature,
    })

    if (!valid) {
      return res.status(400).json({ message: 'Invalid subscription signature' })
    }

    const user = await getUserOrThrow(req.user._id)
    user.billing = {
      ...user.billing,
      planType: 'hybrid',
      status: 'active',
      razorpaySubscriptionId: subscriptionId,
      activatedAt: new Date(),
    }

    await user.save()

    return res.json({
      message: 'Subscription verified',
      billing: user.billing,
    })
  } catch (error) {
    next(error)
  }
}
