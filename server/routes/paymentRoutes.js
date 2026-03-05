import { Router } from 'express'
import { body } from 'express-validator'
import { requireAuth } from '../middleware/auth.js'
import {
  createCheckout,
  createHybridSubscription,
  verifyHybridSubscription,
  verifyOrder,
} from '../controllers/paymentController.js'

const router = Router()

router.post(
  '/checkout',
  requireAuth,
  [body('plan').isIn(['lifetime', 'hybrid']).withMessage('plan must be lifetime or hybrid')],
  createCheckout,
)

router.post(
  '/checkout/verify',
  requireAuth,
  [
    body('plan').isIn(['lifetime', 'hybrid']).withMessage('plan must be lifetime or hybrid'),
    body('razorpay_order_id').notEmpty().withMessage('razorpay_order_id is required'),
    body('razorpay_payment_id').notEmpty().withMessage('razorpay_payment_id is required'),
    body('razorpay_signature').notEmpty().withMessage('razorpay_signature is required'),
  ],
  verifyOrder,
)

router.post('/subscription/hybrid', requireAuth, createHybridSubscription)

router.post(
  '/subscription/hybrid/verify',
  requireAuth,
  [
    body('razorpay_payment_id').notEmpty().withMessage('razorpay_payment_id is required'),
    body('razorpay_subscription_id').notEmpty().withMessage('razorpay_subscription_id is required'),
    body('razorpay_signature').notEmpty().withMessage('razorpay_signature is required'),
  ],
  verifyHybridSubscription,
)

export default router
