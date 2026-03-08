import { Router } from 'express'
import {
  analyzeMenuWithAI,
  createCategory,
  createMenuItem,
  deleteMenuItem,
  getMenuBySlug,
  importMenuDraft,
  updateMenuItem,
} from '../controllers/menuController.js'
import { requireAuth } from '../middleware/auth.js'
import { requireActiveBilling } from '../middleware/billing.js'
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
router.post('/ai/analyze', requireAuth, requireActiveBilling, analyzeMenuWithAI)
router.post('/import-draft', requireAuth, requireActiveBilling, importMenuDraft)
router.post('/category', requireAuth, requireActiveBilling, createCategory)
router.post('/item', requireAuth, requireActiveBilling, createMenuItem)
router.put('/item/:id', requireAuth, requireActiveBilling, updateMenuItem)
router.delete('/item/:id', requireAuth, requireActiveBilling, deleteMenuItem)

export default router
