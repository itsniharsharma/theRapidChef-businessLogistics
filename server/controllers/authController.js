import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { validationResult } from 'express-validator'
import User from '../models/User.js'
import Restaurant from '../models/Restaurant.js'
import { uniqueSlug } from '../utils/slugify.js'

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

async function getOwnerRestaurant(ownerId) {
  return Restaurant.findOne({ ownerId }).lean()
}

export async function register(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() })
    }

    const { name, email, password, restaurantName, address = '', phone = '' } = req.body
    const existing = await User.findOne({ email: String(email).toLowerCase() }).lean()
    if (existing) {
      return res.status(409).json({ message: 'Email is already in use' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await User.create({ name, email, password: hashedPassword, role: 'owner' })

    const slug = await uniqueSlug(restaurantName || `${name} restaurant`, Restaurant)
    const restaurant = await Restaurant.create({
      name: restaurantName || `${name}'s Restaurant`,
      slug,
      address,
      phone,
      ownerId: user._id,
    })

    const token = signToken(user._id)
    return res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      restaurant,
    })
  } catch (error) {
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
    const token = signToken(user._id)
    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      restaurant,
    })
  } catch (error) {
    next(error)
  }
}

export async function me(req, res, next) {
  try {
    const restaurant = await getOwnerRestaurant(req.user._id)
    return res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
      restaurant,
    })
  } catch (error) {
    next(error)
  }
}
