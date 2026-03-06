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

const router = Router()

router.post('/preview/:restaurantSlug', previewOfferPricing)
router.post('/ai/draft', requireAuth, draftOfferFromPrompt)
router.post('/validate', requireAuth, validateOfferDraftPayload)
router.post('/publish', requireAuth, publishOfferDraft)
router.get('/:restaurantId', requireAuth, getOffers)
router.post('/', requireAuth, createOffer)
router.put('/:id', requireAuth, updateOffer)
router.delete('/:id', requireAuth, deleteOffer)

export default router
