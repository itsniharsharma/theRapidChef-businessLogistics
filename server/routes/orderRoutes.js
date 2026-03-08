import { Router } from 'express'
import {
	createOrder,
	deleteOrder,
	getOrders,
	getPublicTableOrders,
	getPublicOrderStatus,
	updateOrderStatus,
} from '../controllers/orderController.js'
import { requireAuth } from '../middleware/auth.js'
import { requireActiveBilling } from '../middleware/billing.js'

const router = Router()

router.post('/', createOrder)
router.get('/track/:restaurantSlug/:tableNumber', getPublicTableOrders)
router.get('/track/:restaurantSlug/:tableNumber/:orderId', getPublicOrderStatus)
router.get('/:restaurantId', requireAuth, requireActiveBilling, getOrders)
router.patch('/:orderId/status', requireAuth, requireActiveBilling, updateOrderStatus)
router.delete('/:orderId', requireAuth, requireActiveBilling, deleteOrder)

export default router
