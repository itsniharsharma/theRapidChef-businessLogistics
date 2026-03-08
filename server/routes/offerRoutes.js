import { Router } from 'express'
import {
	createOffer,
	deleteOffer,
	draftOfferFromPrompt,
	getOffers,
	previewOfferPricing,
	publishOfferDraft,
	updateOffer,
	validateOfferDraftPayload,
} from '../controllers/offerController.js'
import { requireAuth } from '../middleware/auth.js'
import { requireActiveBilling } from '../middleware/billing.js'

const router = Router()

router.post('/preview/:restaurantSlug', previewOfferPricing)
router.post('/ai/draft', requireAuth, requireActiveBilling, draftOfferFromPrompt)
router.post('/validate', requireAuth, requireActiveBilling, validateOfferDraftPayload)
router.post('/publish', requireAuth, requireActiveBilling, publishOfferDraft)
router.get('/:restaurantId', requireAuth, requireActiveBilling, getOffers)
router.post('/', requireAuth, requireActiveBilling, createOffer)
router.put('/:id', requireAuth, requireActiveBilling, updateOffer)
router.delete('/:id', requireAuth, requireActiveBilling, deleteOffer)

export default router
