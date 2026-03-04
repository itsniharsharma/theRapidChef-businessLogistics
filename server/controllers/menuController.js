import Category from '../models/Category.js'
import MenuItem from '../models/MenuItem.js'
import Restaurant from '../models/Restaurant.js'
import Offer from '../models/Offer.js'
import { parseMenuWithAI } from '../services/aiMenuParser.js'
import { invalidateCacheByTags } from '../services/responseCache.js'

async function getOwnerRestaurant(ownerId) {
  return Restaurant.findOne({ ownerId }).select('_id slug').lean()
}

export async function getMenuBySlug(req, res, next) {
  try {
    const restaurant = await Restaurant.findOne({ slug: req.params.restaurantSlug })
      .select('_id name slug logo address phone businessHours')
      .lean()
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' })
    }

    const [categories, items, offers] = await Promise.all([
      Category.find({ restaurantId: restaurant._id })
        .sort({ orderIndex: 1, name: 1 })
        .select('_id name orderIndex')
        .lean(),
      MenuItem.find({ restaurantId: restaurant._id })
        .sort({ createdAt: -1 })
        .select('_id categoryId name description price image available bestseller')
        .lean(),
      Offer.find({ restaurantId: restaurant._id, active: true })
        .sort({ createdAt: -1 })
        .select('_id name type discountValue conditions active startTime endTime')
        .lean(),
    ])

    return res.json({ restaurant, categories, items, offers })
  } catch (error) {
    next(error)
  }
}

export async function createCategory(req, res, next) {
  try {
    const restaurant = await getOwnerRestaurant(req.user._id)
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' })
    }

    const { name, orderIndex = 0 } = req.body
    if (!name?.trim()) {
      return res.status(400).json({ message: 'Category name is required' })
    }

    const category = await Category.create({
      restaurantId: restaurant._id,
      name: name.trim(),
      orderIndex,
    })

    invalidateCacheByTags([`menu:${restaurant.slug}`])

    return res.status(201).json(category)
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Category already exists' })
    }
    next(error)
  }
}

export async function createMenuItem(req, res, next) {
  try {
    const restaurant = await getOwnerRestaurant(req.user._id)
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' })
    }

    const { categoryId, name, description, price, image, available, bestseller } = req.body

    const category = await Category.findOne({ _id: categoryId, restaurantId: restaurant._id }).lean()
    if (!category) {
      return res.status(400).json({ message: 'Invalid category' })
    }

    const item = await MenuItem.create({
      restaurantId: restaurant._id,
      categoryId,
      name,
      description,
      price,
      image,
      available,
      bestseller,
    })

    invalidateCacheByTags([`menu:${restaurant.slug}`])

    return res.status(201).json(item)
  } catch (error) {
    next(error)
  }
}

export async function updateMenuItem(req, res, next) {
  try {
    const restaurant = await getOwnerRestaurant(req.user._id)
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' })
    }

    const item = await MenuItem.findOne({ _id: req.params.id, restaurantId: restaurant._id })
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' })
    }

    const updates = ['categoryId', 'name', 'description', 'price', 'image', 'available', 'bestseller']
    updates.forEach((field) => {
      if (field in req.body) {
        item[field] = req.body[field]
      }
    })

    await item.save()
    invalidateCacheByTags([`menu:${restaurant.slug}`])
    return res.json(item)
  } catch (error) {
    next(error)
  }
}

export async function deleteMenuItem(req, res, next) {
  try {
    const restaurant = await getOwnerRestaurant(req.user._id)
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' })
    }

    const result = await MenuItem.deleteOne({ _id: req.params.id, restaurantId: restaurant._id })
    if (!result.deletedCount) {
      return res.status(404).json({ message: 'Menu item not found' })
    }

    invalidateCacheByTags([`menu:${restaurant.slug}`])

    return res.json({ success: true })
  } catch (error) {
    next(error)
  }
}

export async function analyzeMenuWithAI(req, res, next) {
  try {
    const restaurant = await getOwnerRestaurant(req.user._id)
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' })
    }

    const menuText = typeof req.body?.menuText === 'string' ? req.body.menuText.trim() : ''
    const menuImageDataUrl = typeof req.body?.menuImageDataUrl === 'string' ? req.body.menuImageDataUrl : ''

    if (!menuText && !menuImageDataUrl) {
      return res.status(400).json({ message: 'Upload menu text or image for AI analysis' })
    }

    const parsedMenu = await parseMenuWithAI({ menuText, menuImageDataUrl })
    return res.json(parsedMenu)
  } catch (error) {
    next(error)
  }
}
