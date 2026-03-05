import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Fast path: tokens now carry user context, avoiding a DB read on every request.
    if (decoded?.userId && decoded?.name && decoded?.email && decoded?.role) {
      req.user = {
        _id: decoded.userId,
        name: decoded.name,
        email: decoded.email,
        role: decoded.role,
      }
      return next()
    }

    // Backward compatibility for older tokens that only have userId.
    const user = await User.findById(decoded.userId).lean()
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' })
    }

    req.user = user
    next()
  } catch {
    return res.status(401).json({ message: 'Unauthorized' })
  }
}
