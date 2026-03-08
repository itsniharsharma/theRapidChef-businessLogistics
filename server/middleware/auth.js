import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'JWT secret is not configured' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (!decoded?.userId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const user = await User.findById(decoded.userId)
      .select('_id name email role emailVerified tokenVersion billing')
      .lean()

    if (!user) {
      return res.status(401).json({ message: 'Invalid token' })
    }

    const tokenVersion = Number(decoded?.tokenVersion || 0)
    const currentTokenVersion = Number(user?.tokenVersion || 0)
    if (tokenVersion !== currentTokenVersion) {
      return res.status(401).json({ message: 'Session expired. Please log in again.' })
    }

    req.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      billing: user.billing,
    }
    next()
  } catch {
    return res.status(401).json({ message: 'Unauthorized' })
  }
}
