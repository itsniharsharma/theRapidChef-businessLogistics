import { useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Card from '../components/Card'
import { analyticsService } from '../services/analyticsService'
import { useAuth } from '../hooks/useAuth'

const PIE_COLORS = ['#E50914', '#f87171', '#fca5a5', '#fecaca', '#ffe4e6', '#ef4444']

function formatCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`
}

function formatPct(value) {
  return `${Number(value || 0).toFixed(1)}%`
}

function formatGrowth(value) {
  const numeric = Number(value || 0)
  const sign = numeric > 0 ? '+' : ''
  return `${sign}${numeric.toFixed(1)}%`
}

function growthClass(value) {
  if (value > 0) return 'text-emerald-600'
  if (value < 0) return 'text-[var(--primary)]'
  return 'text-slate-500'
}

export default function AnalyticsPage() {
  const { restaurant } = useAuth()
  const [analytics, setAnalytics] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!restaurant?._id) return

    analyticsService
      .analytics(restaurant._id)
      .then((data) => {
        setAnalytics(data)
        setError('')
      })
      .catch(() => {
        setAnalytics(null)
        setError('Unable to load analytics right now')
      })
  }, [restaurant?._id])

  const summary = analytics?.summary || {}
  const growth = summary.growth || {}

  return (
    <div className="space-y-5">
      {error && <p className="text-sm text-[var(--primary)]">{error}</p>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Revenue Today" value={formatCurrency(summary.today?.revenue)} accent>
          <p className={`mt-2 text-xs font-semibold ${growthClass(growth.todayVsYesterdayRevenue)}`}>
            vs yesterday: {formatGrowth(growth.todayVsYesterdayRevenue)}
          </p>
        </Card>
        <Card title="Orders Today" value={String(summary.today?.orders || 0)}>
          <p className={`mt-2 text-xs font-semibold ${growthClass(growth.todayVsYesterdayOrders)}`}>
            vs yesterday: {formatGrowth(growth.todayVsYesterdayOrders)}
          </p>
        </Card>
        <Card title="Revenue Last 7 Days" value={formatCurrency(summary.last7?.revenue)}>
          <p className={`mt-2 text-xs font-semibold ${growthClass(growth.last7VsPrev7Revenue)}`}>
            vs previous 7 days: {formatGrowth(growth.last7VsPrev7Revenue)}
          </p>
        </Card>
        <Card title="Revenue Last 30 Days" value={formatCurrency(summary.last30?.revenue)}>
          <p className={`mt-2 text-xs font-semibold ${growthClass(growth.last30VsPrev30Revenue)}`}>
            vs previous 30 days: {formatGrowth(growth.last30VsPrev30Revenue)}
          </p>
        </Card>
        <Card title="Month To Date" value={formatCurrency(summary.month?.revenue)} />
        <Card title="Projected Month Revenue" value={formatCurrency(analytics?.projections?.monthRevenueProjection)} />
        <Card title="Open Orders" value={String(summary.openOrders || 0)} />
        <Card title="Payment Capture Rate" value={formatPct(summary.paymentCaptureRateMonth)} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="card h-80 p-4 md:h-96 xl:col-span-2">
          <h2 className="mb-3 text-lg font-semibold">Revenue & Orders (Last 30 Days)</h2>
          <ResponsiveContainer width="100%" height="90%">
            <AreaChart data={analytics?.revenueByDay || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" minTickGap={22} tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#E50914" fill="#fecaca" name="Revenue" />
              <Bar yAxisId="right" dataKey="orders" fill="#f87171" name="Orders" radius={[6, 6, 0, 0]} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-4">
          <h2 className="text-lg font-semibold">Critical Signals</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs uppercase tracking-wider text-slate-500">Forecast (Next 7 Days)</p>
              <p className="mt-1 text-lg font-semibold text-[var(--primary)]">
                {formatCurrency(analytics?.projections?.forecastNext7Revenue)}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs uppercase tracking-wider text-slate-500">Daily Run Rate (Last 7)</p>
              <p className="mt-1 text-lg font-semibold">{formatCurrency(analytics?.projections?.avgDailyRevenueLast7)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs uppercase tracking-wider text-slate-500">Completion Rate (Month)</p>
              <p className="mt-1 text-lg font-semibold">{formatPct(summary.completionRateMonth)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs uppercase tracking-wider text-slate-500">Peak Hours</p>
              <p className="mt-1 font-semibold">
                {(analytics?.peakHours || []).map((slot) => slot.hour).join(', ') || 'No peak hour data yet'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="card h-72 p-4 md:h-80 xl:col-span-2">
          <h2 className="mb-3 text-lg font-semibold">Sales by Hour (Last 30 Days)</h2>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={analytics?.salesByHour || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="shortHour" minTickGap={12} tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sales" fill="#E50914" radius={[6, 6, 0, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card h-72 p-4 md:h-80">
          <h2 className="mb-3 text-lg font-semibold">Weekday Performance</h2>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={analytics?.weekdayPerformance || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="#f87171" radius={[6, 6, 0, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="card h-72 p-4 md:h-80">
          <h2 className="mb-3 text-lg font-semibold">Order Status Mix (Month)</h2>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie
                data={analytics?.statusBreakdown || []}
                dataKey="orders"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={78}
                label
              >
                {(analytics?.statusBreakdown || []).map((entry, index) => (
                  <Cell key={entry.status} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card h-72 p-4 md:h-80">
          <h2 className="mb-3 text-lg font-semibold">Payment Mix (Month)</h2>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie
                data={analytics?.paymentBreakdown || []}
                dataKey="orders"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={78}
                label
              >
                {(analytics?.paymentBreakdown || []).map((entry, index) => (
                  <Cell key={entry.status} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="card p-4">
          <h2 className="mb-3 text-lg font-semibold">Top Selling Items (Last 30 Days)</h2>
          <div className="space-y-2">
            {(analytics?.topItems || []).map((item) => (
              <div key={item.name} className="rounded-lg border border-slate-200 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900">{item.name}</p>
                  <p className="font-semibold text-[var(--primary)]">{item.qty} sold</p>
                </div>
                <div className="mt-1 flex items-center justify-between text-slate-600">
                  <span>Revenue: {formatCurrency(item.revenue)}</span>
                  <span>Mix: {formatPct(item.mixPct)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <h2 className="mb-3 text-lg font-semibold">Top Tables by Revenue (Last 30 Days)</h2>
          <div className="space-y-2">
            {(analytics?.tablePerformance || []).slice(0, 8).map((table) => (
              <div key={table.tableNumber} className="rounded-lg border border-slate-200 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900">Table {table.tableNumber}</p>
                  <p className="font-semibold text-[var(--primary)]">{formatCurrency(table.revenue)}</p>
                </div>
                <p className="mt-1 text-slate-600">
                  Orders: {table.orders} • Avg Order: {formatCurrency(table.avgOrderValue)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-4">
        <h2 className="mb-3 text-lg font-semibold">Low Movers (Last 30 Days)</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          {(analytics?.leastSellingItems || []).map((item) => (
            <div key={item.name} className="rounded-lg border border-slate-200 p-3 text-sm">
              <p className="font-semibold text-slate-900">{item.name}</p>
              <p className="mt-1 text-slate-600">Qty: {item.qty}</p>
              <p className="text-slate-600">Revenue: {formatCurrency(item.revenue)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
