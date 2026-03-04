import { Router } from 'express'
import { body } from 'express-validator'
import { login, me, register } from '../controllers/authController.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('name is required'),
    body('email').isEmail().withMessage('valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('password must be at least 6 characters'),
    body('restaurantName').optional().isString(),
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
