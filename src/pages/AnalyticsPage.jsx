import { useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Card from '../components/Card'
import { analyticsService } from '../services/analyticsService'
import { useAuth } from '../hooks/useAuth'
import { formatCurrencyINR } from '../utils/currency'

function formatCurrency(value) {
  return formatCurrencyINR(value)
}

function formatPct(value) {
  return `${Number(value || 0).toFixed(1)}%`
}

function formatGrowth(value) {
  const numeric = Number(value || 0)
  const sign = numeric > 0 ? '+' : ''
  return `${sign}${numeric.toFixed(1)}%`
}

function formatNumber(value, digits = 1) {
  return Number(value || 0).toFixed(digits)
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
  const control = analytics?.controlMetrics || {}
  const recommendations = analytics?.recommendations || []
  const bestsellerRecommendations = analytics?.bestsellerRecommendations || []

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

      <div className="card p-4">
        <h2 className="mb-4 text-lg font-semibold">Business Control Panel</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-slate-200 p-3 text-sm">
            <p className="text-xs uppercase tracking-wider text-slate-500">Table Utilization</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{formatPct(control.tableUtilizationPct)}</p>
            <p className="text-xs text-slate-500">{control.tablesWithOrders || 0} / {control.activeTableCount || 0} active tables ordered</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3 text-sm">
            <p className="text-xs uppercase tracking-wider text-slate-500">Orders / Active Table (30d)</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{formatNumber(control.ordersPerActiveTable30d)}</p>
            <p className="text-xs text-slate-500">Throughput intensity per active table</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3 text-sm">
            <p className="text-xs uppercase tracking-wider text-slate-500">Top 5 Revenue Concentration</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{formatPct(control.revenueConcentrationTop5Pct)}</p>
            <p className="text-xs text-slate-500">Risk of overdependence on few items</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3 text-sm">
            <p className="text-xs uppercase tracking-wider text-slate-500">Top Item Dependency</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{formatPct(control.topItemDependencyPct)}</p>
            <p className="text-xs text-slate-500">Share contributed by #1 item</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3 text-sm">
            <p className="text-xs uppercase tracking-wider text-slate-500">Peak-Hour Revenue Share</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{formatPct(control.peakHoursRevenueSharePct)}</p>
            <p className="text-xs text-slate-500">Revenue concentrated in top 3 hours</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3 text-sm">
            <p className="text-xs uppercase tracking-wider text-slate-500">Weekend Revenue Share</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{formatPct(control.weekendRevenueSharePct)}</p>
            <p className="text-xs text-slate-500">Fri-Sun contribution in last 30 days</p>
          </div>
          <div className="rounded-lg border border-red-100 bg-red-50/60 p-3 text-sm">
            <p className="text-xs uppercase tracking-wider text-slate-500">Unpaid Exposure</p>
            <p className="mt-1 text-xl font-bold text-[var(--primary)]">{formatCurrency(control.unpaidExposure?.unpaidRevenue)}</p>
            <p className="text-xs text-slate-500">{control.unpaidExposure?.unpaidOlderThan2h || 0} orders older than 2h</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3 text-sm">
            <p className="text-xs uppercase tracking-wider text-slate-500">Repeat Table Rate</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{formatPct(control.repeatTableRatePct)}</p>
            <p className="text-xs text-slate-500">Tables placing 2+ orders in 30 days</p>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <h2 className="mb-3 text-lg font-semibold">Owner Action Feed</h2>
        <div className="space-y-3">
          {recommendations.map((item) => (
            <div key={item.id} className="rounded-lg border border-slate-200 p-3 text-sm">
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="font-semibold text-slate-900">{item.title}</p>
                <span
                  className={`rounded px-2 py-1 text-xs font-semibold uppercase ${
                    item.priority === 'high'
                      ? 'bg-red-100 text-[var(--primary)]'
                      : item.priority === 'medium'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {item.priority}
                </span>
              </div>
              <p className="text-slate-600">{item.why}</p>
              <p className="mt-1 font-medium text-slate-800">Action: {item.action}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Item-Wise Bestseller Recommendations</h2>
          <p className="text-xs text-slate-500">Based on revenue share, attach rate, and 7-day momentum</p>
        </div>
        <div className="space-y-2">
          {bestsellerRecommendations.map((item) => (
            <div key={item.name} className="rounded-lg border border-slate-200 p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-slate-900">
                  #{item.rank} {item.name}
                </p>
                <span
                  className={`rounded px-2 py-1 text-xs font-semibold uppercase ${
                    item.confidence === 'high'
                      ? 'bg-emerald-100 text-emerald-700'
                      : item.confidence === 'medium'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {item.confidence} confidence
                </span>
              </div>
              <p className="mt-1 text-slate-700">{item.recommendation}</p>
              <p className="text-xs text-slate-500">{item.reason}</p>
            </div>
          ))}
          {!bestsellerRecommendations.length && (
            <p className="rounded-lg border border-slate-200 p-3 text-sm text-slate-500">
              Not enough item data yet to generate bestseller recommendations.
            </p>
          )}
        </div>
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
                <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                  <span>Attach rate: {formatPct(item.attachRatePct)}</span>
                  <span>Orders: {item.ordersWithItem || 0}</span>
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
