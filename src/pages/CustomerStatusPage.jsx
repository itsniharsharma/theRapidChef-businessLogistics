import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Button from '../components/Button'
import CustomerBottomNav from '../components/CustomerBottomNav'
import { orderService } from '../services/orderService'
import { formatCurrencyINR } from '../utils/currency'

const statusTone = {
  Pending: 'border-amber-200 bg-amber-50 text-amber-700',
  Preparing: 'border-blue-200 bg-blue-50 text-blue-700',
  Ready: 'border-purple-200 bg-purple-50 text-purple-700',
  Served: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Completed: 'border-slate-200 bg-slate-100 text-slate-700',
}

export default function CustomerStatusPage() {
  const navigate = useNavigate()
  const { restaurantSlug, tableNumber } = useParams()
  const [orders, setOrders] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchOrders = () => {
      orderService
        .trackTable(restaurantSlug, tableNumber)
        .then((data) => {
          setOrders(data)
          setError('')
        })
        .catch((requestError) => {
          setError(requestError?.response?.data?.message || 'Unable to load order statuses')
        })
    }

    fetchOrders()
    const interval = setInterval(fetchOrders, 5000)
    return () => clearInterval(interval)
  }, [restaurantSlug, tableNumber])

  const activeOrders = useMemo(
    () => orders.filter((order) => !['Served', 'Completed'].includes(order.orderStatus)),
    [orders],
  )

  return (
    <div className="customer-shell p-4 pb-32">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="customer-page-title text-xs font-semibold uppercase text-[var(--primary)]">Order Status Board</p>
          <h1 className="text-2xl font-bold text-slate-900">Your Orders</h1>
          <p className="text-sm text-slate-500">Table {tableNumber} • Live updates every 5s</p>
        </div>
        <Button variant="secondary" onClick={() => navigate(`/r/${restaurantSlug}/t/${tableNumber}`)}>
          Back to Menu
        </Button>
      </header>

      {error && <p className="mb-3 text-sm text-[var(--primary)]">{error}</p>}

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="customer-kpi p-3">
          <p className="text-xs uppercase tracking-wider text-slate-500">Total Orders</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{orders.length}</p>
        </div>
        <div className="customer-kpi border-red-100 bg-red-50/75 p-3">
          <p className="text-xs uppercase tracking-wider text-slate-500">Active Orders</p>
          <p className="mt-1 text-2xl font-bold text-[var(--primary)]">{activeOrders.length}</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="lux-card p-4 text-sm text-slate-500">No orders found for this table yet.</div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order._id} className="lux-card border-red-100 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Order #{order._id.slice(-6).toUpperCase()}</p>
                  <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    statusTone[order.orderStatus] || 'border-slate-200 bg-slate-100 text-slate-700'
                  }`}
                >
                  {order.orderStatus}
                </span>
              </div>

              <div className="mt-3 rounded-lg border border-slate-100 bg-white/70 p-2 text-sm text-slate-700">
                {order.items.map((item) => (
                  <p key={`${order._id}-${item.menuItemId}`}>{item.name} x{item.quantity}</p>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">Total: {formatCurrencyINR(order.totalAmount)}</p>
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/r/${restaurantSlug}/t/${tableNumber}/order/${order._id}`)}
                >
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CustomerBottomNav restaurantSlug={restaurantSlug} tableNumber={tableNumber} />
    </div>
  )
}