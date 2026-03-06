import { Router } from 'express'
import { body } from 'express-validator'
import { login, me, register } from '../controllers/authController.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('name is required'),
    body('email').isEmail().withMessage('valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('password must be at least 6 characters'),
    body('restaurantName').optional().isString(),
    body('gstin')
      .trim()
      .notEmpty()
      .withMessage('gstin is required')
      .customSanitizer((value) => String(value || '').toUpperCase().replace(/\s+/g, ''))
      .matches(GSTIN_REGEX)
      .withMessage('valid gstin is required'),
  ],
  register,
)

router.post(
  '/login',
  [body('email').isEmail().withMessage('valid email is required'), body('password').notEmpty()],
  login,
)

router.get('/me', requireAuth, me)

export default router
