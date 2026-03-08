import { Router } from 'express'
import {
  getMyRestaurant,
  getRestaurantBySlug,
  updateMyRestaurant,
} from '../controllers/restaurantController.js'
import { requireAuth } from '../middleware/auth.js'
import { requireActiveBilling } from '../middleware/billing.js'

const router = Router()

router.get('/me', requireAuth, requireActiveBilling, getMyRestaurant)
router.put('/me', requireAuth, requireActiveBilling, updateMyRestaurant)
router.get('/slug/:restaurantSlug', getRestaurantBySlug)

export default router
