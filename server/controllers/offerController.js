import Offer from '../models/Offer.js'
import Restaurant from '../models/Restaurant.js'

async function getOwnerRestaurant(ownerId) {
  return Restaurant.findOne({ ownerId }).lean()
}

export async function getOffers(req, res, next) {
  try {
    const restaurant = await getOwnerRestaurant(req.user._id)
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' })
    }

    if (String(restaurant._id) !== req.params.restaurantId) {
      return res.status(403).json({ message: 'Forbidden' })
    }

    const offers = await Offer.find({ restaurantId: req.params.restaurantId }).sort({ createdAt: -1 }).lean()
    return res.json(offers)
  } catch (error) {
    next(error)
  }
}

export async function createOffer(req, res, next) {
  try {
    const restaurant = await getOwnerRestaurant(req.user._id)
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' })
    }

    const { name, type, discountValue, conditions, active, startTime, endTime } = req.body
    const offer = await Offer.create({
      restaurantId: restaurant._id,
      name,
      type,
      discountValue,
      conditions,
      active,
      startTime: startTime || null,
      endTime: endTime || null,
    })

    return res.status(201).json(offer)
  } catch (error) {
    next(error)
  }
}

export async function updateOffer(req, res, next) {
  try {
    const restaurant = await getOwnerRestaurant(req.user._id)
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' })
    }

    const offer = await Offer.findOne({ _id: req.params.id, restaurantId: restaurant._id })
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' })
    }

    const updates = ['name', 'type', 'discountValue', 'conditions', 'active', 'startTime', 'endTime']
    updates.forEach((field) => {
      if (field in req.body) {
        offer[field] = req.body[field]
      }
    })

    await offer.save()
    return res.json(offer)
  } catch (error) {
    next(error)
  }
}

export async function deleteOffer(req, res, next) {
  try {
    const restaurant = await getOwnerRestaurant(req.user._id)
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' })
    }

    const result = await Offer.deleteOne({ _id: req.params.id, restaurantId: restaurant._id })
    if (!result.deletedCount) {
      return res.status(404).json({ message: 'Offer not found' })
    }

    return res.json({ success: true })
  } catch (error) {
    next(error)
  }
}
