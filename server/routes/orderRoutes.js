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

const router = Router()

router.post('/', createOrder)
router.get('/track/:restaurantSlug/:tableNumber', getPublicTableOrders)
router.get('/track/:restaurantSlug/:tableNumber/:orderId', getPublicOrderStatus)
router.get('/:restaurantId', requireAuth, getOrders)
router.patch('/:orderId/status', requireAuth, updateOrderStatus)
router.delete('/:orderId', requireAuth, deleteOrder)

export default router
