import Order from '../models/Order.js'
import Restaurant from '../models/Restaurant.js'
import Table from '../models/Table.js'

async function ensureOwnerRestaurant(ownerId, restaurantId) {
  const restaurant = await Restaurant.findOne({ ownerId }).lean()
  if (!restaurant) return null
  if (String(restaurant._id) !== restaurantId) return false
  return restaurant
}

function safePeriod(period) {
  return {
    revenue: period?.revenue || 0,
    orders: period?.orders || 0,
    paidOrders: period?.paidOrders || 0,
    unpaidOrders: period?.unpaidOrders || 0,
    avgOrderValue: period?.avgOrderValue || 0,
  }
}

function calcGrowth(current, previous) {
  if (!previous) {
    return current > 0 ? 100 : 0
  }
  return ((current - previous) / previous) * 100
}

function buildDateKeys(startDate, endDate) {
  const cursor = new Date(startDate)
  cursor.setHours(0, 0, 0, 0)

  const last = new Date(endDate)
  last.setHours(0, 0, 0, 0)

  const keys = []
  while (cursor <= last) {
    keys.push(cursor.toISOString().slice(0, 10))
    cursor.setDate(cursor.getDate() + 1)
  }

  return keys
}

function formatShortDate(isoDate) {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export async function getDashboard(req, res, next) {
  try {
    const ownerRestaurant = await ensureOwnerRestaurant(req.user._id, req.params.restaurantId)
    if (!ownerRestaurant) return res.status(404).json({ message: 'Restaurant not found' })
    if (ownerRestaurant === false) return res.status(403).json({ message: 'Forbidden' })

    const now = new Date()
    const startDay = new Date(now)
    startDay.setHours(0, 0, 0, 0)

    const [todayStats, recentOrders, topItems, trend, activeTables] = await Promise.all([
      Order.aggregate([
        { $match: { restaurantId: ownerRestaurant._id, createdAt: { $gte: startDay } } },
        {
          $group: {
            _id: null,
            todayRevenue: { $sum: '$totalAmount' },
            totalOrdersToday: { $sum: 1 },
          },
        },
      ]),
      Order.find({ restaurantId: req.params.restaurantId })
        .sort({ createdAt: -1 })
        .limit(8)
        .select('_id tableNumber orderStatus totalAmount createdAt')
        .lean(),
      Order.aggregate([
        { $match: { restaurantId: ownerRestaurant._id } },
        { $unwind: '$items' },
        { $group: { _id: '$items.name', qty: { $sum: '$items.quantity' } } },
        { $sort: { qty: -1 } },
        { $limit: 5 },
      ]),
      Order.aggregate([
        { $match: { restaurantId: ownerRestaurant._id } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' },
            },
            revenue: { $sum: '$totalAmount' },
            date: { $first: '$createdAt' },
          },
        },
        { $sort: { date: -1 } },
        { $limit: 7 },
        { $sort: { date: 1 } },
      ]),
      Table.countDocuments({ restaurantId: ownerRestaurant._id, active: true }),
    ])

    const stats = todayStats[0] || { todayRevenue: 0, totalOrdersToday: 0 }
    const avgOrderValue = stats.totalOrdersToday ? stats.todayRevenue / stats.totalOrdersToday : 0

    return res.json({
      cards: {
        todayRevenue: stats.todayRevenue,
        totalOrdersToday: stats.totalOrdersToday,
        averageOrderValue: avgOrderValue,
        activeTables,
      },
      recentOrders,
      topSellingItems: topItems.map((item) => item._id),
      revenueTrend: trend.map((entry) => ({
        day: new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short' }),
        revenue: entry.revenue,
      })),
    })
  } catch (error) {
    next(error)
  }
}

export async function getAnalytics(req, res, next) {
  try {
    const ownerRestaurant = await ensureOwnerRestaurant(req.user._id, req.params.restaurantId)
    if (!ownerRestaurant) return res.status(404).json({ message: 'Restaurant not found' })
    if (ownerRestaurant === false) return res.status(403).json({ message: 'Forbidden' })

    const now = new Date()
    const startToday = new Date(now)
    startToday.setHours(0, 0, 0, 0)

    const startYesterday = new Date(startToday)
    startYesterday.setDate(startYesterday.getDate() - 1)

    const startLast7 = new Date(startToday)
    startLast7.setDate(startLast7.getDate() - 6)

    const startPrev7 = new Date(startLast7)
    startPrev7.setDate(startPrev7.getDate() - 7)

    const startLast30 = new Date(startToday)
    startLast30.setDate(startLast30.getDate() - 29)

    const startPrev30 = new Date(startLast30)
    startPrev30.setDate(startPrev30.getDate() - 30)

    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const elapsedDaysInMonth = now.getDate()

    const [overviewFacet, statusBreakdownRaw, paymentBreakdownRaw, revenueByDayRaw, salesByHourRaw, itemsStats, tableStats, weekdayRaw, openOrders] =
      await Promise.all([
        Order.aggregate([
          { $match: { restaurantId: ownerRestaurant._id } },
          {
            $facet: {
              today: [
                { $match: { createdAt: { $gte: startToday } } },
                {
                  $group: {
                    _id: null,
                    revenue: { $sum: '$totalAmount' },
                    orders: { $sum: 1 },
                    paidOrders: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'Paid'] }, 1, 0] } },
                    unpaidOrders: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'Unpaid'] }, 1, 0] } },
                    avgOrderValue: { $avg: '$totalAmount' },
                  },
                },
              ],
              yesterday: [
                { $match: { createdAt: { $gte: startYesterday, $lt: startToday } } },
                {
                  $group: {
                    _id: null,
                    revenue: { $sum: '$totalAmount' },
                    orders: { $sum: 1 },
                    paidOrders: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'Paid'] }, 1, 0] } },
                    unpaidOrders: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'Unpaid'] }, 1, 0] } },
                    avgOrderValue: { $avg: '$totalAmount' },
                  },
                },
              ],
              last7: [
                { $match: { createdAt: { $gte: startLast7 } } },
                {
                  $group: {
                    _id: null,
                    revenue: { $sum: '$totalAmount' },
                    orders: { $sum: 1 },
                    paidOrders: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'Paid'] }, 1, 0] } },
                    unpaidOrders: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'Unpaid'] }, 1, 0] } },
                    avgOrderValue: { $avg: '$totalAmount' },
                  },
                },
              ],
              prev7: [
                { $match: { createdAt: { $gte: startPrev7, $lt: startLast7 } } },
                {
                  $group: {
                    _id: null,
                    revenue: { $sum: '$totalAmount' },
                    orders: { $sum: 1 },
                    paidOrders: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'Paid'] }, 1, 0] } },
                    unpaidOrders: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'Unpaid'] }, 1, 0] } },
                    avgOrderValue: { $avg: '$totalAmount' },
                  },
                },
              ],
              month: [
                { $match: { createdAt: { $gte: startMonth } } },
                {
                  $group: {
                    _id: null,
                    revenue: { $sum: '$totalAmount' },
                    orders: { $sum: 1 },
                    paidOrders: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'Paid'] }, 1, 0] } },
                    unpaidOrders: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'Unpaid'] }, 1, 0] } },
                    avgOrderValue: { $avg: '$totalAmount' },
                  },
                },
              ],
              last30: [
                { $match: { createdAt: { $gte: startLast30 } } },
                {
                  $group: {
                    _id: null,
                    revenue: { $sum: '$totalAmount' },
                    orders: { $sum: 1 },
                    paidOrders: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'Paid'] }, 1, 0] } },
                    unpaidOrders: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'Unpaid'] }, 1, 0] } },
                    avgOrderValue: { $avg: '$totalAmount' },
                  },
                },
              ],
              prev30: [
                { $match: { createdAt: { $gte: startPrev30, $lt: startLast30 } } },
                {
                  $group: {
                    _id: null,
                    revenue: { $sum: '$totalAmount' },
                    orders: { $sum: 1 },
                    paidOrders: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'Paid'] }, 1, 0] } },
                    unpaidOrders: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'Unpaid'] }, 1, 0] } },
                    avgOrderValue: { $avg: '$totalAmount' },
                  },
                },
              ],
              lifetime: [
                {
                  $group: {
                    _id: null,
                    revenue: { $sum: '$totalAmount' },
                    orders: { $sum: 1 },
                    paidOrders: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'Paid'] }, 1, 0] } },
                    unpaidOrders: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'Unpaid'] }, 1, 0] } },
                    avgOrderValue: { $avg: '$totalAmount' },
                  },
                },
              ],
            },
          },
        ]),
        Order.aggregate([
          { $match: { restaurantId: ownerRestaurant._id, createdAt: { $gte: startMonth } } },
          {
            $group: {
              _id: '$orderStatus',
              orders: { $sum: 1 },
              revenue: { $sum: '$totalAmount' },
            },
          },
          { $sort: { orders: -1 } },
        ]),
        Order.aggregate([
          { $match: { restaurantId: ownerRestaurant._id, createdAt: { $gte: startMonth } } },
          {
            $group: {
              _id: '$paymentStatus',
              orders: { $sum: 1 },
              revenue: { $sum: '$totalAmount' },
            },
          },
          { $sort: { orders: -1 } },
        ]),
        Order.aggregate([
          { $match: { restaurantId: ownerRestaurant._id, createdAt: { $gte: startLast30 } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              revenue: { $sum: '$totalAmount' },
              orders: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        Order.aggregate([
          { $match: { restaurantId: ownerRestaurant._id, createdAt: { $gte: startLast30 } } },
          {
            $group: {
              _id: { $hour: '$createdAt' },
              revenue: { $sum: '$totalAmount' },
              orders: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        Order.aggregate([
          { $match: { restaurantId: ownerRestaurant._id, createdAt: { $gte: startLast30 } } },
          { $unwind: '$items' },
          {
            $group: {
              _id: '$items.name',
              qty: { $sum: '$items.quantity' },
              revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
            },
          },
          { $sort: { qty: -1 } },
        ]),
        Order.aggregate([
          { $match: { restaurantId: ownerRestaurant._id, createdAt: { $gte: startLast30 } } },
          {
            $group: {
              _id: '$tableNumber',
              orders: { $sum: 1 },
              revenue: { $sum: '$totalAmount' },
              avgOrderValue: { $avg: '$totalAmount' },
            },
          },
          { $sort: { revenue: -1 } },
          { $limit: 10 },
        ]),
        Order.aggregate([
          { $match: { restaurantId: ownerRestaurant._id, createdAt: { $gte: startLast30 } } },
          {
            $group: {
              _id: { $dayOfWeek: '$createdAt' },
              revenue: { $sum: '$totalAmount' },
              orders: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        Order.countDocuments({
          restaurantId: ownerRestaurant._id,
          orderStatus: { $in: ['Pending', 'Preparing', 'Ready'] },
        }),
      ])

    const overview = overviewFacet[0] || {}
    const today = safePeriod(overview.today?.[0])
    const yesterday = safePeriod(overview.yesterday?.[0])
    const last7 = safePeriod(overview.last7?.[0])
    const prev7 = safePeriod(overview.prev7?.[0])
    const month = safePeriod(overview.month?.[0])
    const last30 = safePeriod(overview.last30?.[0])
    const prev30 = safePeriod(overview.prev30?.[0])
    const lifetime = safePeriod(overview.lifetime?.[0])

    const revenueByDayMap = new Map(revenueByDayRaw.map((entry) => [entry._id, entry]))
    const revenueByDay = buildDateKeys(startLast30, now).map((dateKey) => {
      const entry = revenueByDayMap.get(dateKey)
      const orders = entry?.orders || 0
      const revenue = entry?.revenue || 0

      return {
        date: dateKey,
        label: formatShortDate(dateKey),
        orders,
        revenue,
        avgOrderValue: orders ? revenue / orders : 0,
      }
    })

    const hourMap = new Map(salesByHourRaw.map((entry) => [entry._id, entry]))
    const salesByHour = Array.from({ length: 24 }, (_, hour) => {
      const entry = hourMap.get(hour)
      return {
        hour: `${hour.toString().padStart(2, '0')}:00`,
        shortHour: `${hour.toString().padStart(2, '0')}`,
        sales: entry?.revenue || 0,
        orders: entry?.orders || 0,
      }
    })

    const weekdayNameByMongoDay = {
      1: 'Sun',
      2: 'Mon',
      3: 'Tue',
      4: 'Wed',
      5: 'Thu',
      6: 'Fri',
      7: 'Sat',
    }

    const weekdayMap = new Map(weekdayRaw.map((entry) => [entry._id, entry]))
    const weekdayOrder = [2, 3, 4, 5, 6, 7, 1]
    const weekdayPerformance = weekdayOrder.map((dayNo) => {
      const entry = weekdayMap.get(dayNo)
      return {
        day: weekdayNameByMongoDay[dayNo],
        revenue: entry?.revenue || 0,
        orders: entry?.orders || 0,
      }
    })

    const totalItemQty = itemsStats.reduce((sum, item) => sum + (item.qty || 0), 0)
    const topItems = itemsStats.slice(0, 8).map((item) => ({
      name: item._id,
      qty: item.qty || 0,
      revenue: item.revenue || 0,
      mixPct: totalItemQty ? ((item.qty || 0) / totalItemQty) * 100 : 0,
    }))

    const leastSellingItems = [...itemsStats]
      .filter((item) => (item.qty || 0) > 0)
      .slice(-5)
      .reverse()
      .map((item) => ({
        name: item._id,
        qty: item.qty || 0,
        revenue: item.revenue || 0,
      }))

    const tablePerformance = tableStats.map((table) => ({
      tableNumber: table._id,
      orders: table.orders || 0,
      revenue: table.revenue || 0,
      avgOrderValue: table.avgOrderValue || 0,
    }))

    const peakHours = [...salesByHour]
      .filter((hour) => hour.sales > 0)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 3)

    const monthRevenueProjection = elapsedDaysInMonth ? (month.revenue / elapsedDaysInMonth) * daysInMonth : 0
    const avgDailyRevenueLast7 = last7.revenue / 7
    const forecastNext7Revenue = avgDailyRevenueLast7 * 7

    const monthStatusMap = new Map(statusBreakdownRaw.map((entry) => [entry._id, entry.orders || 0]))
    const completedLike = (monthStatusMap.get('Served') || 0) + (monthStatusMap.get('Completed') || 0)
    const completionRateMonth = month.orders ? (completedLike / month.orders) * 100 : 0
    const paymentCaptureRateMonth = month.orders ? (month.paidOrders / month.orders) * 100 : 0

    return res.json({
      todayRevenue: today.revenue,
      weekRevenue: last7.revenue,
      monthRevenue: month.revenue,
      avgOrderValue: today.avgOrderValue,
      mostSoldItem: itemsStats[0]?._id || '-',
      leastSoldItem: itemsStats.length ? itemsStats[itemsStats.length - 1]._id : '-',
      salesByHour,
      summary: {
        today,
        yesterday,
        last7,
        prev7,
        month,
        last30,
        prev30,
        lifetime,
        openOrders,
        completionRateMonth,
        paymentCaptureRateMonth,
        growth: {
          todayVsYesterdayRevenue: calcGrowth(today.revenue, yesterday.revenue),
          last7VsPrev7Revenue: calcGrowth(last7.revenue, prev7.revenue),
          last30VsPrev30Revenue: calcGrowth(last30.revenue, prev30.revenue),
          todayVsYesterdayOrders: calcGrowth(today.orders, yesterday.orders),
        },
      },
      projections: {
        monthRevenueProjection,
        forecastNext7Revenue,
        avgDailyRevenueLast7,
      },
      statusBreakdown: statusBreakdownRaw.map((entry) => ({
        status: entry._id,
        orders: entry.orders,
        revenue: entry.revenue,
      })),
      paymentBreakdown: paymentBreakdownRaw.map((entry) => ({
        status: entry._id,
        orders: entry.orders,
        revenue: entry.revenue,
      })),
      revenueByDay,
      weekdayPerformance,
      topItems,
      leastSellingItems,
      tablePerformance,
      peakHours,
    })
  } catch (error) {
    next(error)
  }
}
