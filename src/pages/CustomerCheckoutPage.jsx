import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { QRCodeCanvas } from 'qrcode.react'
import Button from '../components/Button'
import CustomerBottomNav from '../components/CustomerBottomNav'
import { useCustomerCart } from '../hooks/useCustomerCart'
import { orderService } from '../services/orderService'
import { restaurantService } from '../services/restaurantService'
import { formatCurrencyINR } from '../utils/currency'

export default function CustomerCheckoutPage() {
  const navigate = useNavigate()
  const { restaurantSlug, tableNumber } = useParams()
  const { getSession, removeItem, addItem, setPaid, clearSession } = useCustomerCart()
  const [placing, setPlacing] = useState(false)
  const [openingUpi, setOpeningUpi] = useState(false)
  const [awaitingUpiReturn, setAwaitingUpiReturn] = useState(false)
  const [upiLaunchedAt, setUpiLaunchedAt] = useState(0)
  const [message, setMessage] = useState('')
  const [restaurantInfo, setRestaurantInfo] = useState(null)
  const [paymentDetailsLoading, setPaymentDetailsLoading] = useState(true)
  const [paymentDetailsError, setPaymentDetailsError] = useState('')

  const session = getSession(restaurantSlug, tableNumber)
  const cart = session.items
  const paid = session.paid

  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [cart])

  useEffect(() => {
    setPaymentDetailsLoading(true)
    setPaymentDetailsError('')

    restaurantService
      .getBySlug(restaurantSlug)
      .then((data) => setRestaurantInfo(data))
      .catch((requestError) => {
        setPaymentDetailsError(requestError?.response?.data?.message || 'Unable to load restaurant payment details')
      })
      .finally(() => setPaymentDetailsLoading(false))
  }, [restaurantSlug])

  const upiUrl = useMemo(() => {
    const upiVpa = restaurantInfo?.upiVpa
    if (!upiVpa || !total) return ''

    const params = new URLSearchParams({
      pa: upiVpa,
      pn: restaurantInfo?.upiPayeeName || restaurantInfo?.name || 'Restaurant',
      am: total.toFixed(2),
      cu: 'INR',
      tn: `Table ${tableNumber} order`,
    })

    return `upi://pay?${params.toString()}`
  }, [restaurantInfo?.name, restaurantInfo?.upiPayeeName, restaurantInfo?.upiVpa, tableNumber, total])

  const gpayUrl = useMemo(() => {
    if (!upiUrl.startsWith('upi://pay?')) return ''
    return `tez://upi/pay?${upiUrl.slice('upi://pay?'.length)}`
  }, [upiUrl])

  useEffect(() => {
    if (!awaitingUpiReturn) return

    const handlePossibleReturn = () => {
      if (document.visibilityState !== 'visible') return
      if (Date.now() - upiLaunchedAt < 1500) return

      setAwaitingUpiReturn(false)
      setOpeningUpi(false)
      setPaid(restaurantSlug, tableNumber, true)
      setMessage('Payment flow completed. You can now place order.')
    }

    window.addEventListener('focus', handlePossibleReturn)
    document.addEventListener('visibilitychange', handlePossibleReturn)

    return () => {
      window.removeEventListener('focus', handlePossibleReturn)
      document.removeEventListener('visibilitychange', handlePossibleReturn)
    }
  }, [awaitingUpiReturn, upiLaunchedAt, restaurantSlug, setPaid, tableNumber])

  const openUpiApp = () => {
    if (!gpayUrl) {
      setMessage('Owner UPI is not configured yet. Please pay at counter.')
      return
    }

    setOpeningUpi(true)
    setAwaitingUpiReturn(true)
    setUpiLaunchedAt(Date.now())
    window.location.href = gpayUrl
    setTimeout(() => {
      setMessage('Complete payment in Google Pay and return to this page.')
    }, 900)
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
          <p className="text-sm text-slate-600">Total</p>
          <p className="text-xl font-bold text-[var(--primary)]">{formatCurrencyINR(total)}</p>
          <p className="mt-1 text-xs text-slate-500">Includes all selected items for table {tableNumber}</p>
        </div>

        {paymentDetailsLoading ? (
          <p className="mt-4 text-sm text-slate-500">Loading owner payment details...</p>
        ) : paymentDetailsError ? (
          <p className="mt-4 text-sm text-[var(--primary)]">{paymentDetailsError}</p>
        ) : upiUrl ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 text-center">
            <p className="text-sm font-semibold text-slate-800">Scan to Pay with Any UPI App</p>
            <div className="mt-2 flex justify-center">
              <QRCodeCanvas value={upiUrl} size={170} />
            </div>
            <p className="mt-2 text-xs text-slate-500">UPI ID: {restaurantInfo?.upiVpa}</p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-[var(--primary)]">Owner UPI is not configured. Please pay at counter.</p>
        )}

        {message && <p className="mt-3 text-sm text-[var(--primary)]">{message}</p>}

        <div className="mt-4 space-y-2">
          <Button
            className="w-full"
            onClick={openUpiApp}
            disabled={!cart.length || paymentDetailsLoading || Boolean(paymentDetailsError) || !gpayUrl || openingUpi || paid}
          >
            {openingUpi ? 'Opening Google Pay...' : 'Pay on Google Pay'}
          </Button>
          {paid && (
            <Button className="w-full" onClick={placeOrder} disabled={!cart.length || placing}>
              {placing ? 'Placing Order...' : 'Place Order'}
            </Button>
          )}
          <p className="pt-1 text-center text-xs text-slate-500">UPI payment is customer-driven; app marks payment after user confirmation</p>
        </div>
      </div>

      <CustomerBottomNav restaurantSlug={restaurantSlug} tableNumber={tableNumber} />
    </div>
  )
}
