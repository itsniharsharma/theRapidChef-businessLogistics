import { Router } from 'express'
import { createTables, getTables } from '../controllers/tableController.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.post('/', requireAuth, createTables)
router.get('/:restaurantId', requireAuth, getTables)

export default router
