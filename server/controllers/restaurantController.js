import Restaurant from '../models/Restaurant.js'
import { uniqueSlug } from '../utils/slugify.js'

export async function getMyRestaurant(req, res, next) {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user._id }).lean()
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' })
    }
    return res.json(restaurant)
  } catch (error) {
    next(error)
  }
}

export async function updateMyRestaurant(req, res, next) {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user._id })
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' })
    }

    const { name, address, phone } = req.body

    if (typeof name === 'string' && name.trim() && name.trim() !== restaurant.name) {
      restaurant.name = name.trim()
      restaurant.slug = await uniqueSlug(name, Restaurant)
    }

    if (typeof address === 'string') restaurant.address = address
    if (typeof phone === 'string') restaurant.phone = phone

    await restaurant.save()
    return res.json(restaurant)
  } catch (error) {
    next(error)
  }
}

export async function getRestaurantBySlug(req, res, next) {
  try {
    const restaurant = await Restaurant.findOne({ slug: req.params.restaurantSlug })
      .select('_id name slug address phone')
      .lean()
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' })
    }

    return res.json(restaurant)
  } catch (error) {
    next(error)
  }
}
