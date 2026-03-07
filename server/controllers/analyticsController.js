import Order from '../models/Order.js'
import Restaurant from '../models/Restaurant.js'
import Table from '../models/Table.js'
import MenuItem from '../models/MenuItem.js'

async function ensureOwnerRestaurant(ownerId, restaurantId) {
  if (!restaurantId) return null
  return Restaurant.findOne({ _id: restaurantId, ownerId }).lean()
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

function safePct(part, whole) {
  if (!whole) return 0
  return (part / whole) * 100
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
      Order.find({ restaurantId: ownerRestaurant._id })
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

    const [
      overviewFacet,
      statusBreakdownRaw,
      paymentBreakdownRaw,
      revenueByDayRaw,
      salesByHourRaw,
      itemsStats,
      itemMomentumRaw,
      tableStats,
      weekdayRaw,
      openOrders,
      activeTables,
      totalTables,
      unpaidExposureRaw,
    ] =
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
              _id: {
                itemName: '$items.name',
                orderId: '$_id',
              },
              qty: { $sum: '$items.quantity' },
              revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
            },
          },
          {
            $group: {
              _id: '$_id.itemName',
              qty: { $sum: '$qty' },
              revenue: { $sum: '$revenue' },
              ordersWithItem: { $sum: 1 },
            },
          },
          { $sort: { qty: -1 } },
        ]),
        Order.aggregate([
          { $match: { restaurantId: ownerRestaurant._id, createdAt: { $gte: startPrev7 } } },
          { $unwind: '$items' },
          {
            $group: {
              _id: '$items.name',
              qtyLast7: {
                $sum: {
                  $cond: [{ $gte: ['$createdAt', startLast7] }, '$items.quantity', 0],
                },
              },
              qtyPrev7: {
                $sum: {
                  $cond: [{ $lt: ['$createdAt', startLast7] }, '$items.quantity', 0],
                },
              },
              revenueLast7: {
                $sum: {
                  $cond: [
                    { $gte: ['$createdAt', startLast7] },
                    { $multiply: ['$items.quantity', '$items.price'] },
                    0,
                  ],
                },
              },
              revenuePrev7: {
                $sum: {
                  $cond: [
                    { $lt: ['$createdAt', startLast7] },
                    { $multiply: ['$items.quantity', '$items.price'] },
                    0,
                  ],
                },
              },
            },
          },
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
        Table.countDocuments({ restaurantId: ownerRestaurant._id, active: true }),
        Table.countDocuments({ restaurantId: ownerRestaurant._id }),
        Order.aggregate([
          {
            $match: {
              restaurantId: ownerRestaurant._id,
              paymentStatus: 'Unpaid',
            },
          },
          {
            $group: {
              _id: null,
              unpaidRevenue: { $sum: '$totalAmount' },
              unpaidOrders: { $sum: 1 },
              unpaidOlderThan2h: {
                $sum: {
                  $cond: [{ $lte: ['$createdAt', new Date(now.getTime() - 2 * 60 * 60 * 1000)] }, 1, 0],
                },
              },
            },
          },
        ]),
      ])

    const topItemNames = itemsStats.slice(0, 12).map((item) => item._id)
    const menuItems = topItemNames.length
      ? await MenuItem.find({ restaurantId: ownerRestaurant._id, name: { $in: topItemNames } })
          .select('name bestseller available')
          .lean()
      : []

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
    const itemMomentumMap = new Map(
      itemMomentumRaw.map((item) => [
        item._id,
        {
          qtyLast7: item.qtyLast7 || 0,
          qtyPrev7: item.qtyPrev7 || 0,
          revenueLast7: item.revenueLast7 || 0,
          revenuePrev7: item.revenuePrev7 || 0,
        },
      ]),
    )
    const menuItemMap = new Map(
      menuItems.map((item) => [item.name, { bestseller: Boolean(item.bestseller), available: Boolean(item.available) }]),
    )

    const topItems = itemsStats.slice(0, 8).map((item) => ({
      name: item._id,
      qty: item.qty || 0,
      revenue: item.revenue || 0,
      ordersWithItem: item.ordersWithItem || 0,
      attachRatePct: safePct(item.ordersWithItem || 0, last30.orders),
      mixPct: totalItemQty ? ((item.qty || 0) / totalItemQty) * 100 : 0,
    }))

    const itemInsights = itemsStats.slice(0, 12).map((item) => {
      const momentum = itemMomentumMap.get(item._id) || {
        qtyLast7: 0,
        qtyPrev7: 0,
        revenueLast7: 0,
        revenuePrev7: 0,
      }
      const menuMeta = menuItemMap.get(item._id) || { bestseller: false, available: false }
      const momentumQtyPct = calcGrowth(momentum.qtyLast7, momentum.qtyPrev7)
      const revenueSharePct = safePct(item.revenue || 0, last30.revenue)
      const attachRatePct = safePct(item.ordersWithItem || 0, last30.orders)
      const bestsellerScore =
        revenueSharePct * 0.45 +
        attachRatePct * 0.3 +
        (momentumQtyPct > 0 ? Math.min(momentumQtyPct, 100) : 0) * 0.25

      return {
        name: item._id,
        qty30d: item.qty || 0,
        revenue30d: item.revenue || 0,
        ordersWithItem30d: item.ordersWithItem || 0,
        revenueSharePct,
        attachRatePct,
        qtyLast7: momentum.qtyLast7,
        qtyPrev7: momentum.qtyPrev7,
        momentumQtyPct,
        bestsellerScore,
        isMarkedBestseller: menuMeta.bestseller,
        isAvailable: menuMeta.available,
      }
    })

    const bestsellerRecommendations = itemInsights
      .filter((item) => item.isAvailable)
      .sort((a, b) => b.bestsellerScore - a.bestsellerScore)
      .slice(0, 5)
      .map((item, index) => {
        const shouldMark = !item.isMarkedBestseller && item.revenueSharePct >= 8 && item.momentumQtyPct > -10
        const recommendation = shouldMark ? 'Mark as Bestseller' : 'Keep as Featured Bestseller'

        return {
          rank: index + 1,
          name: item.name,
          recommendation,
          reason: `${item.revenueSharePct.toFixed(1)}% revenue share, ${item.attachRatePct.toFixed(1)}% attach rate, ${item.momentumQtyPct.toFixed(1)}% 7-day momentum.`,
          confidence: item.bestsellerScore >= 35 ? 'high' : item.bestsellerScore >= 20 ? 'medium' : 'low',
          metrics: {
            revenueSharePct: item.revenueSharePct,
            attachRatePct: item.attachRatePct,
            momentumQtyPct: item.momentumQtyPct,
          },
        }
      })

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

    const growth = {
      todayVsYesterdayRevenue: calcGrowth(today.revenue, yesterday.revenue),
      last7VsPrev7Revenue: calcGrowth(last7.revenue, prev7.revenue),
      last30VsPrev30Revenue: calcGrowth(last30.revenue, prev30.revenue),
      todayVsYesterdayOrders: calcGrowth(today.orders, yesterday.orders),
    }

    const unpaidExposure = {
      unpaidRevenue: unpaidExposureRaw?.[0]?.unpaidRevenue || 0,
      unpaidOrders: unpaidExposureRaw?.[0]?.unpaidOrders || 0,
      unpaidOlderThan2h: unpaidExposureRaw?.[0]?.unpaidOlderThan2h || 0,
    }

    const revenueByPayment = new Map(paymentBreakdownRaw.map((entry) => [entry._id, entry.revenue || 0]))
    const paidRevenueMonth = revenueByPayment.get('Paid') || 0
    const unpaidRevenueMonth = revenueByPayment.get('Unpaid') || 0

    const top5Revenue = topItems.slice(0, 5).reduce((sum, item) => sum + (item.revenue || 0), 0)
    const topItemRevenue = topItems[0]?.revenue || 0
    const tablesWithOrders = tableStats.length
    const repeatTables = tableStats.filter((table) => (table.orders || 0) >= 2).length
    const peakHoursRevenue = peakHours.reduce((sum, hour) => sum + (hour.sales || 0), 0)
    const weekdayRevenueMap = new Map(weekdayPerformance.map((entry) => [entry.day, entry.revenue || 0]))
    const weekendRevenue =
      (weekdayRevenueMap.get('Fri') || 0) + (weekdayRevenueMap.get('Sat') || 0) + (weekdayRevenueMap.get('Sun') || 0)

    const controlMetrics = {
      activeTableCount: activeTables || 0,
      totalTableCount: totalTables || 0,
      tablesWithOrders,
      tableUtilizationPct: safePct(tablesWithOrders, activeTables || 0),
      repeatTableRatePct: safePct(repeatTables, tablesWithOrders),
      ordersPerActiveTable30d: activeTables ? last30.orders / activeTables : 0,
      revenueConcentrationTop5Pct: safePct(top5Revenue, last30.revenue),
      topItemDependencyPct: safePct(topItemRevenue, last30.revenue),
      peakHoursRevenueSharePct: safePct(peakHoursRevenue, last30.revenue),
      weekendRevenueSharePct: safePct(weekendRevenue, last30.revenue),
      paidRevenueMonth,
      unpaidRevenueMonth,
      unpaidExposure,
    }

    const recommendations = []

    if (controlMetrics.tableUtilizationPct < 55) {
      recommendations.push({
        id: 'table-utilization-low',
        priority: 'high',
        title: 'Improve table utilization during low-demand windows',
        why: `Only ${controlMetrics.tableUtilizationPct.toFixed(1)}% of active tables generated orders in the last 30 days.`,
        action: 'Launch daypart-specific offers and upsell prompts for off-peak slots to activate idle tables.',
      })
    }

    if (controlMetrics.unpaidExposure.unpaidOlderThan2h > 0) {
      recommendations.push({
        id: 'unpaid-exposure',
        priority: 'high',
        title: 'Unpaid order exposure requires tighter close-out discipline',
        why: `${controlMetrics.unpaidExposure.unpaidOlderThan2h} unpaid orders are older than 2 hours.`,
        action: 'Enable payment-at-ready workflow and cashier reminders before marking orders as served.',
      })
    }

    if (controlMetrics.revenueConcentrationTop5Pct > 65) {
      recommendations.push({
        id: 'menu-concentration-risk',
        priority: 'medium',
        title: 'Revenue concentration risk is high',
        why: `Top 5 items contribute ${controlMetrics.revenueConcentrationTop5Pct.toFixed(1)}% of revenue.`,
        action: 'Promote high-margin secondary items via combos and menu placement to diversify revenue.',
      })
    }

    if (growth.last7VsPrev7Revenue < -8) {
      recommendations.push({
        id: 'momentum-drop',
        priority: 'high',
        title: 'Revenue momentum dropped vs previous week',
        why: `Last 7 days revenue is ${growth.last7VsPrev7Revenue.toFixed(1)}% vs previous 7 days.`,
        action: 'Run a 7-day recovery plan: peak-hour staffing alignment + high-conversion offer on weak dayparts.',
      })
    }

    if (controlMetrics.repeatTableRatePct < 35) {
      recommendations.push({
        id: 'repeat-engagement-low',
        priority: 'medium',
        title: 'Repeat table engagement can be improved',
        why: `Only ${controlMetrics.repeatTableRatePct.toFixed(1)}% of ordering tables placed 2+ orders in 30 days.`,
        action: 'Introduce post-meal dessert or beverage prompts at checkout to raise repeat ordering behavior.',
      })
    }

    if (!recommendations.length) {
      recommendations.push({
        id: 'healthy-trajectory',
        priority: 'info',
        title: 'Business trajectory looks healthy',
        why: 'Core metrics are stable with no major risk spikes detected.',
        action: 'Focus on incremental menu margin optimization and maintain current execution cadence.',
      })
    }

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
        growth,
      },
      projections: {
        monthRevenueProjection,
        forecastNext7Revenue,
        avgDailyRevenueLast7,
      },
      controlMetrics,
      recommendations,
      itemInsights,
      bestsellerRecommendations,
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
