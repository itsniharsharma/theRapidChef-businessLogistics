import { useEffect, useMemo, useState } from 'react'
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Card from '../components/Card'
import { analyticsService } from '../services/analyticsService'
import { useAuth } from '../hooks/useAuth'
import { formatCurrencyINR } from '../utils/currency'

export default function DashboardPage() {
  const { restaurant } = useAuth()
  const [data, setData] = useState(null)

  useEffect(() => {
    if (!restaurant?._id) return

    analyticsService.dashboard(restaurant._id).then(setData).catch(() => setData(null))
  }, [restaurant?._id])

  const cards = useMemo(() => {
    if (!data?.cards) {
      return [
        { title: "Today's Revenue", value: formatCurrencyINR(0) },
        { title: 'Total Orders Today', value: '0' },
        { title: 'Average Order Value', value: formatCurrencyINR(0) },
        { title: 'Active Tables', value: '0' },
      ]
    }

    return [
      { title: "Today's Revenue", value: formatCurrencyINR(data.cards.todayRevenue) },
      { title: 'Total Orders Today', value: String(data.cards.totalOrdersToday || 0) },
      { title: 'Average Order Value', value: formatCurrencyINR(data.cards.averageOrderValue) },
      { title: 'Active Tables', value: String(data.cards.activeTables || 0) },
    ]
  }, [data])

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((stat) => (
          <Card key={stat.title} title={stat.title} value={stat.value} accent />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="card p-4 xl:col-span-2">
          <h2 className="text-lg font-semibold">Recent Orders</h2>
          <div className="mt-3 space-y-2">
            {(data?.recentOrders || []).map((order) => (
              <div key={order._id} className="rounded-lg border border-slate-200 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <p className="max-w-[58%] truncate font-semibold">{order._id}</p>
                  <p className="text-xs text-slate-500 md:text-sm">{new Date(order.createdAt).toLocaleTimeString()}</p>
                </div>
                <p className="mt-1 text-slate-600">
                  Table {order.tableNumber} • {order.orderStatus}
                </p>
                <p className="font-semibold text-[var(--primary)]">{formatCurrencyINR(order.totalAmount)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <h2 className="text-lg font-semibold">Top Selling Items</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {(data?.topSellingItems || []).map((item) => (
              <li key={item} className="rounded-lg border border-slate-200 px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card h-64 p-4 md:h-72">
        <h2 className="mb-3 text-lg font-semibold">Revenue Trend</h2>
        <ResponsiveContainer width="100%" height="90%">
          <LineChart data={data?.revenueTrend || []}>
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" stroke="#E50914" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
