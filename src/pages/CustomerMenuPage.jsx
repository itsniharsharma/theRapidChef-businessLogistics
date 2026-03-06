import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Button from '../components/Button'
import CustomerBottomNav from '../components/CustomerBottomNav'
import { menuService } from '../services/menuService'
import { useCustomerCart } from '../hooks/useCustomerCart'
import { formatCurrencyINR } from '../utils/currency'

export default function CustomerMenuPage() {
  const navigate = useNavigate()
  const { restaurantSlug, tableNumber } = useParams()
  const { getSession, addItem, removeItem } = useCustomerCart()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [menu, setMenu] = useState({ restaurant: null, categories: [], items: [], offers: [] })
  const [activeCategory, setActiveCategory] = useState(null)

  const session = getSession(restaurantSlug, tableNumber)
  const cart = session.items

  useEffect(() => {
    setLoading(true)
    menuService
      .getBySlug(restaurantSlug)
      .then((data) => {
        setMenu(data)
        setActiveCategory(null)
      })
      .catch((requestError) => {
        setError(requestError?.response?.data?.message || 'Unable to load menu')
      })
      .finally(() => setLoading(false))
  }, [restaurantSlug])

  const visibleItems = useMemo(() => {
    if (!activeCategory) return []
    return menu.items.filter((item) => item.available && item.categoryId === activeCategory)
  }, [activeCategory, menu.items])

  const cartQuantityByItemId = useMemo(() => {
    const quantityMap = new Map()
    for (const entry of cart) {
      quantityMap.set(entry.menuItemId, entry.quantity)
    }
    return quantityMap
  }, [cart])

  const openCheckout = () => {
    navigate(`/r/${restaurantSlug}/t/${tableNumber}/checkout`)
  }

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart])

  const totalItemCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart])

  if (loading) {
    return <div className="min-h-screen bg-white p-4 text-sm text-slate-500">Loading luxury menu...</div>
  }

  if (error) {
    return <div className="min-h-screen bg-white p-4 text-sm text-[var(--primary)]">{error}</div>
  }

  return (
    <div className="customer-shell pb-32">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 p-4 backdrop-blur">
        <div className="customer-hero p-4 md:p-5">
          <p className="customer-page-title text-xs font-semibold uppercase text-[var(--primary)]">Chef's Bud Guest Lounge</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">Welcome to {menu.restaurant?.name}</h1>
          <p className="mt-1 text-sm text-slate-600">Table {tableNumber} • Curated dining crafted for comfort</p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg border border-red-100 bg-white/80 px-2 py-2">
              <p className="font-bold text-slate-900">{menu.categories.length}</p>
              <p className="text-slate-500">Categories</p>
            </div>
            <div className="rounded-lg border border-red-100 bg-white/80 px-2 py-2">
              <p className="font-bold text-slate-900">{menu.items.length}</p>
              <p className="text-slate-500">Dishes</p>
            </div>
            <div className="rounded-lg border border-red-100 bg-white/80 px-2 py-2">
              <p className="font-bold text-[var(--primary)]">{totalItemCount}</p>
              <p className="text-slate-500">In Cart</p>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4">
        {menu.offers?.length > 0 && (
          <div className="customer-glass mb-4 rounded-xl border border-red-100 bg-red-50/80 p-3 text-sm text-[var(--primary)] shadow-sm">
            {menu.offers.map((offer) => `✨ ${offer.name}`).join('   •   ')}
          </div>
        )}

        {!activeCategory ? (
          <div>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Explore Signature Categories</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {menu.categories.map((category) => (
                <button
                  key={category._id}
                  onClick={() => setActiveCategory(category._id)}
                  className="lux-card min-h-32 overflow-hidden px-3 py-4 text-center text-base font-semibold text-slate-800 transition hover:-translate-y-1 hover:border-red-200 hover:text-[var(--primary)]"
                >
                  <div className="mb-2 rounded-lg bg-gradient-to-br from-red-50 to-white p-2 text-2xl">🍽️</div>
                  <p>{category.name}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <Button variant="secondary" onClick={() => setActiveCategory(null)}>
                ← Back to Categories
              </Button>
              <p className="text-sm font-medium text-slate-500">Chef Selection</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {visibleItems.map((item) => {
                const quantity = cartQuantityByItemId.get(item._id) || 0
                return (
                  <div key={item._id} className="lux-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-red-100 bg-gradient-to-br from-red-50 to-white text-sm font-bold text-[var(--primary)]">
                          {item.name?.charAt(0) || 'D'}
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-slate-900">{item.name}</h3>
                        <p className="text-sm text-slate-600">{item.description || 'A signature dish from our kitchen.'}</p>
                        </div>
                      </div>
                      <p className="dish-badge rounded-full px-3 py-1 text-sm font-bold">
                        {formatCurrencyINR(item.price)}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">
                        {item.bestseller ? '⭐ Bestseller' : 'Popular in this section'}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          className="h-8 w-8 rounded-lg border border-slate-300 text-slate-700"
                          onClick={() => removeItem(restaurantSlug, tableNumber, item._id)}
                        >
                          -
                        </button>
                        <span className="min-w-6 text-center text-sm font-semibold">{quantity}</span>
                        <button
                          className="h-8 w-8 rounded-lg bg-[var(--primary)] text-white"
                          onClick={() => addItem(restaurantSlug, tableNumber, item)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {cart.length > 0 && (
        <div className="customer-floating-cta fixed bottom-20 left-0 right-0 z-30 p-4">
          <Button className="w-full" onClick={openCheckout}>
            View Cart • {formatCurrencyINR(total)}
          </Button>
        </div>
      )}

      <CustomerBottomNav restaurantSlug={restaurantSlug} tableNumber={tableNumber} />
    </div>
  )
}
