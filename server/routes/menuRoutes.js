import { Router } from 'express'
import {
  analyzeMenuWithAI,
  createCategory,
  createMenuItem,
  deleteMenuItem,
  getMenuBySlug,
  updateMenuItem,
} from '../controllers/menuController.js'
import { requireAuth } from '../middleware/auth.js'
import { cacheResponse } from '../services/responseCache.js'

const router = Router()

router.get(
  '/:restaurantSlug',
  cacheResponse({
    ttlSeconds: 45,
    keyBuilder: (req) => `menu:${req.params.restaurantSlug}`,
    tagsBuilder: (req) => [`menu:${req.params.restaurantSlug}`],
  }),
  getMenuBySlug,
)
router.post('/ai/analyze', requireAuth, analyzeMenuWithAI)
router.post('/category', requireAuth, createCategory)
router.post('/item', requireAuth, createMenuItem)
router.put('/item/:id', requireAuth, updateMenuItem)
router.delete('/item/:id', requireAuth, deleteMenuItem)

export default router
