import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Button from '../components/Button'
import CustomerBottomNav from '../components/CustomerBottomNav'
import { useCustomerCart } from '../hooks/useCustomerCart'
import { orderService } from '../services/orderService'
import { offerService } from '../services/offerService'
import { formatCurrencyINR } from '../utils/currency'

export default function CustomerCheckoutPage() {
  const navigate = useNavigate()
  const { restaurantSlug, tableNumber } = useParams()
  const { getSession, removeItem, addItem, setPaid, clearSession } = useCustomerCart()
  const [placing, setPlacing] = useState(false)
  const [message, setMessage] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [pricing, setPricing] = useState({ subtotalAmount: 0, discountTotal: 0, totalAmount: 0, appliedOffers: [] })

  const session = getSession(restaurantSlug, tableNumber)
  const cart = session.items
  const paid = session.paid

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [cart])

  useEffect(() => {
    if (!cart.length) {
      setPricing({ subtotalAmount: 0, discountTotal: 0, totalAmount: 0, appliedOffers: [] })
      return
    }

    offerService
      .preview(restaurantSlug, {
        items: cart.map((item) => ({ menuItemId: item.menuItemId, quantity: item.quantity })),
        couponCode,
      })
      .then((preview) => {
        setPricing(preview)
      })
      .catch(() => {
        setPricing({ subtotalAmount: subtotal, discountTotal: 0, totalAmount: subtotal, appliedOffers: [] })
      })
  }, [cart, couponCode, restaurantSlug, subtotal])

  const payWithDummy = () => {
    setMessage('Opening payment gateway...')
    setTimeout(() => {
      setPaid(restaurantSlug, tableNumber, true)
      setMessage('Payment successful')
    }, 700)
  }

  const placeOrder = async () => {
    if (!cart.length || !paid) return
    setPlacing(true)
    setMessage('')

    try {
      await orderService.create({
        restaurantSlug,
        tableNumber: Number(tableNumber),
        paymentStatus: 'Paid',
        couponCode,
        items: cart.map((item) => ({ menuItemId: item.menuItemId, quantity: item.quantity })),
      })

      clearSession(restaurantSlug, tableNumber)
      setMessage('Order placed successfully')
      setTimeout(() => {
        navigate(`/r/${restaurantSlug}/t/${tableNumber}/status`)
      }, 900)
    } catch (requestError) {
      setMessage(requestError?.response?.data?.message || 'Failed to place order')
    } finally {
      setPlacing(false)
    }
  }

  return (
    <div className="customer-shell p-4 pb-32">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="customer-page-title text-xs font-semibold uppercase text-[var(--primary)]">Secure Checkout</p>
          <h1 className="text-2xl font-bold text-slate-900">Complete Your Premium Order</h1>
        </div>
        <Button variant="secondary" onClick={() => navigate(`/r/${restaurantSlug}/t/${tableNumber}`)}>
          Back
        </Button>
      </header>

      <div className="lux-card p-4 md:p-5">
        <p className="text-sm text-slate-500">Table {tableNumber}</p>
        <h2 className="mt-1 text-lg font-semibold">Your Cart</h2>

        {!cart.length ? (
          <p className="mt-3 text-sm text-slate-500">Cart is empty.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {cart.map((item) => (
              <div key={item.menuItemId} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{item.name}</p>
                    <p className="text-sm text-slate-500">{formatCurrencyINR(item.price)} each</p>
                  </div>
                  <p className="font-semibold text-[var(--primary)]">{formatCurrencyINR(item.price * item.quantity)}</p>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    className="h-8 w-8 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                    onClick={() => removeItem(restaurantSlug, tableNumber, item.menuItemId)}
                  >
                    -
                  </button>
                  <span className="min-w-6 text-center text-sm font-semibold">{item.quantity}</span>
                  <button
                    className="h-8 w-8 rounded-lg bg-[var(--primary)] text-white hover:opacity-95"
                    onClick={() => addItem(restaurantSlug, tableNumber, { _id: item.menuItemId, ...item })}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="customer-glass mt-4 rounded-xl border border-red-100 bg-red-50/70 p-3">
          <p className="text-sm text-slate-600">Subtotal</p>
          <p className="text-base font-semibold text-slate-900">{formatCurrencyINR(pricing.subtotalAmount ?? subtotal)}</p>
          <p className="mt-1 text-sm text-slate-600">Discount</p>
          <p className="text-base font-semibold text-emerald-700">- {formatCurrencyINR(pricing.discountTotal || 0)}</p>
          <p className="mt-1 text-sm text-slate-600">Total</p>
          <p className="text-xl font-bold text-[var(--primary)]">{formatCurrencyINR(pricing.totalAmount ?? subtotal)}</p>
          <p className="mt-1 text-xs text-slate-500">Includes all selected items for table {tableNumber}</p>
        </div>

        <label className="mt-3 block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Coupon Code (optional)</span>
          <input
            className="input"
            value={couponCode}
            onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
            placeholder="Enter coupon code"
          />
        </label>

        {Array.isArray(pricing.appliedOffers) && pricing.appliedOffers.length ? (
          <div className="mt-3 space-y-2 rounded-lg border border-slate-200 bg-white p-3 text-sm">
            <p className="font-semibold text-slate-800">Applied Offers</p>
            {pricing.appliedOffers.map((offer) => (
              <p key={`${offer.offerId}-${offer.description}`} className="text-slate-600">
                {offer.description} • Saved {formatCurrencyINR(offer.discountAmount)}
              </p>
            ))}
          </div>
        ) : null}

        {message && <p className="mt-3 text-sm text-[var(--primary)]">{message}</p>}

        <div className="mt-4 space-y-2">
          <Button className="w-full" onClick={payWithDummy} disabled={!cart.length || paid}>
            {paid ? 'Payment Completed' : 'Pay Now'}
          </Button>
          <Button className="w-full" onClick={placeOrder} disabled={!cart.length || !paid || placing}>
            {placing ? 'Placing Order...' : 'Place Order'}
          </Button>
          <p className="pt-1 text-center text-xs text-slate-500">Simple demo checkout enabled</p>
        </div>
      </div>

      <CustomerBottomNav restaurantSlug={restaurantSlug} tableNumber={tableNumber} />
    </div>
  )
}
