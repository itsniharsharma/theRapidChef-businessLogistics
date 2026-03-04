import { Router } from 'express'
import { createOffer, deleteOffer, getOffers, updateOffer } from '../controllers/offerController.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/:restaurantId', requireAuth, getOffers)
router.post('/', requireAuth, createOffer)
router.put('/:id', requireAuth, updateOffer)
router.delete('/:id', requireAuth, deleteOffer)

export default router
