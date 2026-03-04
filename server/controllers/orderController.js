import MenuItem from '../models/MenuItem.js'
import Order from '../models/Order.js'
import Restaurant from '../models/Restaurant.js'
import { invalidateCacheByTags } from '../services/responseCache.js'

async function getOwnerRestaurant(ownerId) {
  return Restaurant.findOne({ ownerId }).lean()
}

export async function getOrders(req, res, next) {
  try {
    const restaurant = await getOwnerRestaurant(req.user._id)
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' })
    }

    if (String(restaurant._id) !== req.params.restaurantId) {
      return res.status(403).json({ message: 'Forbidden' })
    }

    const query = { restaurantId: req.params.restaurantId }
    if (req.query.status && req.query.status !== 'All') {
      query.orderStatus = req.query.status
    }

    if (req.query.scope === 'today') {
      const start = new Date()
      start.setHours(0, 0, 0, 0)
      query.createdAt = { $gte: start }
    }

    const page = Math.max(1, Number(req.query.page || 1))
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 50)))
    const skip = (page - 1) * limit

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('_id tableNumber items totalAmount paymentStatus orderStatus createdAt')
      .lean()
    return res.json(orders)
  } catch (error) {
    next(error)
  }
}

export async function updateOrderStatus(req, res, next) {
  try {
    const restaurant = await getOwnerRestaurant(req.user._id)
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' })
    }

    const { orderStatus } = req.body
    const allowed = ['Pending', 'Preparing', 'Ready', 'Served', 'Completed']
    if (!allowed.includes(orderStatus)) {
      return res.status(400).json({ message: 'Invalid order status' })
    }

    const order = await Order.findOne({ _id: req.params.orderId, restaurantId: restaurant._id })
    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    order.orderStatus = orderStatus
    await order.save()
    invalidateCacheByTags([`analytics:${String(restaurant._id)}`])
    return res.json(order)
  } catch (error) {
    next(error)
  }
}

export async function deleteOrder(req, res, next) {
  try {
    const restaurant = await getOwnerRestaurant(req.user._id)
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' })
    }

    const order = await Order.findOne({ _id: req.params.orderId, restaurantId: restaurant._id })
      .select('_id orderStatus')
      .lean()

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    if (!['Served', 'Completed'].includes(order.orderStatus)) {
      return res.status(400).json({ message: 'Order can be deleted only after Served or Completed' })
    }

    await Order.deleteOne({ _id: req.params.orderId, restaurantId: restaurant._id })
    invalidateCacheByTags([`analytics:${String(restaurant._id)}`])
    return res.json({ success: true })
  } catch (error) {
    next(error)
  }
}

export async function createOrder(req, res, next) {
  try {
    const { restaurantSlug, tableNumber, items, paymentStatus = 'Unpaid' } = req.body

    const restaurant = await Restaurant.findOne({ slug: restaurantSlug }).lean()
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' })
    }

    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ message: 'Order items are required' })
    }

    const quantityById = new Map()
    for (const item of items) {
      const id = String(item.menuItemId)
      const quantity = Math.max(1, Number(item.quantity || 1))
      quantityById.set(id, (quantityById.get(id) || 0) + quantity)
    }

    const ids = [...quantityById.keys()]
    const menuItems = await MenuItem.find({ _id: { $in: ids }, restaurantId: restaurant._id, available: true })
      .select('_id name price')
      .lean()

    const menuMap = new Map(menuItems.map((item) => [String(item._id), item]))

    const orderItems = []
    for (const [menuItemId, quantity] of quantityById.entries()) {
      const menuItem = menuMap.get(menuItemId)
      if (!menuItem) continue
      orderItems.push({
        menuItemId: menuItem._id,
        name: menuItem.name,
        quantity,
        price: menuItem.price,
      })
    }

    if (!orderItems.length) {
      return res.status(400).json({ message: 'No valid menu items selected' })
    }

    const totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

    const order = await Order.create({
      restaurantId: restaurant._id,
      tableNumber: Number(tableNumber),
      items: orderItems,
      totalAmount,
      paymentStatus,
      orderStatus: 'Pending',
    })

    invalidateCacheByTags([`analytics:${String(restaurant._id)}`])

    return res.status(201).json(order)
  } catch (error) {
    next(error)
  }
}

export async function getPublicOrderStatus(req, res, next) {
  try {
    const { restaurantSlug, tableNumber, orderId } = req.params

    const restaurant = await Restaurant.findOne({ slug: restaurantSlug }).select('_id').lean()
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' })
    }

    const order = await Order.findOne({
      _id: orderId,
      restaurantId: restaurant._id,
      tableNumber: Number(tableNumber),
    })
      .select('_id tableNumber items totalAmount paymentStatus orderStatus createdAt')
      .lean()

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    return res.json(order)
  } catch (error) {
    next(error)
  }
}

export async function getPublicTableOrders(req, res, next) {
  try {
    const { restaurantSlug, tableNumber } = req.params

    const restaurant = await Restaurant.findOne({ slug: restaurantSlug }).select('_id').lean()
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' })
    }

    const orders = await Order.find({
      restaurantId: restaurant._id,
      tableNumber: Number(tableNumber),
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .select('_id tableNumber items totalAmount paymentStatus orderStatus createdAt')
      .lean()

    return res.json(orders)
  } catch (error) {
    next(error)
  }
}
