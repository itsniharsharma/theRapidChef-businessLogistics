import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { validationResult } from 'express-validator'
import User from '../models/User.js'
import Restaurant from '../models/Restaurant.js'
import { uniqueSlug } from '../utils/slugify.js'

function normalizeGstin(value) {
  return String(value || '').toUpperCase().replace(/\s+/g, '').trim()
}

function signToken(user) {
  return jwt.sign(
    {
      userId: String(user._id || user.id),
      name: user.name,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' },
  )
}

async function getOwnerRestaurant(ownerId) {
  return Restaurant.findOne({ ownerId }).lean()
}

function serializeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    billing: user.billing,
  }
}

export async function register(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() })
    }

    const { name, email, password, restaurantName, address = '', phone = '', gstin } = req.body
    const normalizedGstin = normalizeGstin(gstin)

    const existing = await User.findOne({ email: String(email).toLowerCase() }).lean()
    if (existing) {
      return res.status(409).json({ message: 'Email is already in use' })
    }

    const existingGstin = await Restaurant.findOne({ gstin: normalizedGstin }).lean()
    if (existingGstin) {
      return res.status(409).json({ message: 'GSTIN is already registered' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await User.create({ name, email, password: hashedPassword, role: 'owner' })

    const slug = await uniqueSlug(restaurantName || `${name} restaurant`, Restaurant)
    const restaurant = await Restaurant.create({
      name: restaurantName || `${name}'s Restaurant`,
      slug,
      gstin: normalizedGstin,
      address,
      phone,
      ownerId: user._id,
    })

    const token = signToken(user)
    return res.status(201).json({
      token,
      user: serializeUser(user),
      restaurant,
    })
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.gstin) {
      return res.status(409).json({ message: 'GSTIN is already registered' })
    }
    next(error)
  }
}

export async function login(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() })
    }

    const { email, password } = req.body
    const user = await User.findOne({ email: String(email).toLowerCase() })
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const restaurant = await getOwnerRestaurant(user._id)
    const token = signToken(user)
    return res.json({
      token,
      user: serializeUser(user),
      restaurant,
    })
  } catch (error) {
    next(error)
  }
}

export async function me(req, res, next) {
  try {
    const currentUser = await User.findById(req.user._id).lean()
    if (!currentUser) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const restaurant = await getOwnerRestaurant(req.user._id)
    return res.json({
      user: serializeUser(currentUser),
      restaurant,
    })
  } catch (error) {
    next(error)
  }
}
