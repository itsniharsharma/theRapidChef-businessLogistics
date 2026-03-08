import { Router } from 'express'
import { createTables, getTables } from '../controllers/tableController.js'
import { requireAuth } from '../middleware/auth.js'
import { requireActiveBilling } from '../middleware/billing.js'

const router = Router()

router.post('/', requireAuth, requireActiveBilling, createTables)
router.get('/:restaurantId', requireAuth, requireActiveBilling, getTables)

export default router
