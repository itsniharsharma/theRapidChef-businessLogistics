import { useEffect, useMemo, useState } from 'react'
import Button from '../components/Button'
import { useAuth } from '../hooks/useAuth'
import { orderService } from '../services/orderService'
import { formatCurrencyINR } from '../utils/currency'

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildBillHtml(order, restaurantName) {
  const rows = (order.items || [])
    .map((item) => {
      const qty = Number(item.quantity || 0)
      const price = Number(item.price || 0)
      const subtotal = qty * price
      return `
        <tr>
          <td>${escapeHtml(item.name)}</td>
          <td style="text-align:center;">${qty}</td>
          <td style="text-align:right;">${escapeHtml(formatCurrencyINR(price))}</td>
          <td style="text-align:right;">${escapeHtml(formatCurrencyINR(subtotal))}</td>
        </tr>
      `
    })
    .join('')

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Bill ${escapeHtml(order._id)}</title>
    <style>
      body { font-family: 'Century Gothic', Arial, sans-serif; margin: 24px; color: #0f172a; }
      .head { display: flex; justify-content: space-between; margin-bottom: 16px; }
      h1 { margin: 0; font-size: 24px; }
      p { margin: 4px 0; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; }
      th, td { border: 1px solid #e2e8f0; padding: 8px; font-size: 14px; }
      th { background: #f8fafc; text-align: left; }
      .total { margin-top: 12px; text-align: right; font-size: 18px; font-weight: 700; }
      .meta { color: #475569; font-size: 13px; }
    </style>
  </head>
  <body>
    <div class="head">
      <div>
        <h1>${escapeHtml(restaurantName || "Chef's Bud")}</h1>
        <p class="meta">Order Bill</p>
      </div>
      <div style="text-align:right;">
        <p><strong>Order:</strong> ${escapeHtml(order._id)}</p>
        <p><strong>Table:</strong> ${escapeHtml(order.tableNumber)}</p>
        <p><strong>Date:</strong> ${escapeHtml(new Date(order.createdAt).toLocaleString())}</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th style="text-align:center;">Qty</th>
          <th style="text-align:right;">Price</th>
          <th style="text-align:right;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <p class="total">Total: ${escapeHtml(formatCurrencyINR(order.totalAmount))}</p>
    <p class="meta">Payment: ${escapeHtml(order.paymentStatus)} | Status: ${escapeHtml(order.orderStatus)}</p>
  </body>
</html>`
}

export default function BillingPage() {
  const { restaurant } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingOrderId, setDeletingOrderId] = useState('')
  const [error, setError] = useState('')
  const [readyToDeleteOrderIds, setReadyToDeleteOrderIds] = useState([])

  useEffect(() => {
    if (!restaurant?._id) return
    setLoading(true)
    orderService
      .list(restaurant._id, { scope: 'all', limit: 200 })
      .then((data) => {
        setOrders(data)
        setError('')
      })
      .catch((requestError) => {
        setError(requestError?.response?.data?.message || 'Unable to load billing orders')
      })
      .finally(() => setLoading(false))
  }, [restaurant?._id])

  const totals = useMemo(() => {
    const count = orders.length
    const revenue = orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0)
    return { count, revenue }
  }, [orders])

  const removeBilledOrder = async (order) => {
    setDeletingOrderId(order._id)
    try {
      if (!['Served', 'Completed'].includes(order.orderStatus)) {
        await orderService.updateStatus(order._id, 'Completed')
      }
      await orderService.delete(order._id)
      setOrders((prev) => prev.filter((entry) => entry._id !== order._id))
      setReadyToDeleteOrderIds((prev) => prev.filter((id) => id !== order._id))
      setError('')
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Failed to delete order')
    } finally {
      setDeletingOrderId('')
    }
  }

  const markReadyToDelete = (orderId) => {
    setReadyToDeleteOrderIds((prev) => (prev.includes(orderId) ? prev : [...prev, orderId]))
  }

  const downloadBill = async (order) => {
    const html = buildBillHtml(order, restaurant?.name)
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `bill-${order._id}.html`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    markReadyToDelete(order._id)
  }

  const printBill = async (order) => {
    const html = buildBillHtml(order, restaurant?.name)
    const printWindow = window.open('', '_blank', 'width=900,height=700')
    if (!printWindow) return
    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    markReadyToDelete(order._id)
  }

  return (
    <div className="space-y-5">
      {error && <p className="text-sm text-[var(--primary)]">{error}</p>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="card p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Orders In Billing</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{totals.count}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total Bill Amount</p>
          <p className="mt-1 text-2xl font-bold text-[var(--primary)]">{formatCurrencyINR(totals.revenue)}</p>
        </div>
      </div>

      <div className="card p-4">
        <h2 className="mb-3 text-lg font-semibold">Billing Orders</h2>
        {loading ? (
          <p className="text-sm text-slate-500">Loading billing data...</p>
        ) : orders.length === 0 ? (
          <p className="text-sm text-slate-500">No orders available for billing yet.</p>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order._id} className="rounded-xl border border-slate-200 p-3 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">Order #{order._id.slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleString()}</p>
                    <p className="mt-1 text-slate-600">Table {order.tableNumber} • {order.paymentStatus} • {order.orderStatus}</p>
                  </div>
                  <p className="text-base font-bold text-[var(--primary)]">{formatCurrencyINR(order.totalAmount)}</p>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => downloadBill(order)}
                    disabled={deletingOrderId === order._id}
                  >
                    Download Bill
                  </Button>
                  <Button onClick={() => printBill(order)} disabled={deletingOrderId === order._id}>
                    Print Bill
                  </Button>
                  {readyToDeleteOrderIds.includes(order._id) ? (
                    <Button variant="secondary" onClick={() => removeBilledOrder(order)} disabled={deletingOrderId === order._id}>
                      {deletingOrderId === order._id ? 'Deleting...' : 'Delete Order'}
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
