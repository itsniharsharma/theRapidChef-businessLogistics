import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Button from '../components/Button'
import CustomerBottomNav from '../components/CustomerBottomNav'
import { orderService } from '../services/orderService'

const steps = ['Pending', 'Preparing', 'Ready', 'Served', 'Completed']

export default function CustomerOrderTrackingPage() {
  const navigate = useNavigate()
  const { restaurantSlug, tableNumber, orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchStatus = () => {
      orderService
        .track(restaurantSlug, tableNumber, orderId)
        .then(setOrder)
        .catch((requestError) => {
          setError(requestError?.response?.data?.message || 'Unable to fetch order status')
        })
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
  }, [restaurantSlug, tableNumber, orderId])

  const currentIndex = order?.orderStatus ? Math.max(0, steps.indexOf(order.orderStatus)) : 0

  return (
    <div className="customer-shell p-4 pb-32">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="customer-page-title text-xs font-semibold uppercase text-[var(--primary)]">Live Status</p>
          <h1 className="text-2xl font-bold text-slate-900">Track Your Order</h1>
        </div>
        <Button variant="secondary" onClick={() => navigate(`/r/${restaurantSlug}/t/${tableNumber}/status`)}>
          Back to Status
        </Button>
      </header>

      <div className="lux-card p-4 md:p-5">
        <p className="text-sm text-slate-500">Order ID: {orderId}</p>
        <p className="text-sm text-slate-500">Table {tableNumber}</p>

        {error && <p className="mt-2 text-sm text-[var(--primary)]">{error}</p>}

        <div className="mt-4 grid gap-2">
          {steps.map((step, index) => {
            const active = index <= currentIndex
            return (
              <div
                key={step}
                className={`status-step px-3 py-2 text-sm ${active ? 'active' : ''}`}
              >
                {step}
              </div>
            )
          })}
        </div>

        {order && (
          <div className="customer-glass mt-4 rounded-xl border border-red-100 bg-red-50/80 p-3">
            <p className="text-sm text-slate-600">Current Status</p>
            <p className="text-lg font-semibold text-[var(--primary)]">{order.orderStatus}</p>
            <p className="mt-1 text-sm text-slate-600">Payment: {order.paymentStatus}</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">Total: ${Number(order.totalAmount).toFixed(2)}</p>
          </div>
        )}
      </div>

      <CustomerBottomNav restaurantSlug={restaurantSlug} tableNumber={tableNumber} />
    </div>
  )
}
