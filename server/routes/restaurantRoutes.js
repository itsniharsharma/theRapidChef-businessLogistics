import { Router } from 'express'
import {
  getMyRestaurant,
  getRestaurantBySlug,
  updateMyRestaurant,
} from '../controllers/restaurantController.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/me', requireAuth, getMyRestaurant)
router.put('/me', requireAuth, updateMyRestaurant)
router.get('/slug/:restaurantSlug', getRestaurantBySlug)

export default router
