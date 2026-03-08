import { Router } from 'express'
import { getAnalytics, getDashboard } from '../controllers/analyticsController.js'
import { requireAuth } from '../middleware/auth.js'
import { requireActiveBilling } from '../middleware/billing.js'
import { cacheResponse } from '../services/responseCache.js'

const router = Router()

router.get(
	'/dashboard/:restaurantId',
	requireAuth,
	requireActiveBilling,
	cacheResponse({
		ttlSeconds: 60,
		keyBuilder: (req) => `analytics:dashboard:${req.user._id}:${req.params.restaurantId}`,
		tagsBuilder: (req) => [`analytics:${req.params.restaurantId}`],
	}),
	getDashboard,
)
router.get(
	'/:restaurantId',
	requireAuth,
	requireActiveBilling,
	cacheResponse({
		ttlSeconds: 60,
		keyBuilder: (req) => `analytics:detail:${req.user._id}:${req.params.restaurantId}`,
		tagsBuilder: (req) => [`analytics:${req.params.restaurantId}`],
	}),
	getAnalytics,
)

export default router
