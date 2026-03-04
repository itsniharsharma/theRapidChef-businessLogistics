import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Button from '../components/Button'
import CustomerBottomNav from '../components/CustomerBottomNav'
import { menuService } from '../services/menuService'
import { useCustomerCart } from '../hooks/useCustomerCart'

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

  const visibleItems = (() => {
    if (!activeCategory) return []
    return menu.items.filter((item) => item.available && item.categoryId === activeCategory)
  })()

  const getQuantity = (itemId) => {
    return cart.find((entry) => entry.menuItemId === itemId)?.quantity || 0
  }

  const openCheckout = () => {
    navigate(`/r/${restaurantSlug}/t/${tableNumber}/checkout`)
  }

  const total = (() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  })()

  if (loading) {
    return <div className="min-h-screen bg-white p-4 text-sm text-slate-500">Loading menu...</div>
  }

  if (error) {
    return <div className="min-h-screen bg-white p-4 text-sm text-[var(--primary)]">{error}</div>
  }

  return (
    <div className="customer-shell pb-32">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 p-4 backdrop-blur">
        <div className="customer-hero p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">Hunger Dining</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Welcome to {menu.restaurant?.name}</h1>
          <p className="mt-1 text-sm text-slate-600">Fine dining experience • Table {tableNumber}</p>
        </div>
      </header>

      <div className="p-4">
        {menu.offers?.length > 0 && (
          <div className="mb-4 rounded-xl border border-red-100 bg-red-50/80 p-3 text-sm text-[var(--primary)] shadow-sm">
            {menu.offers.map((offer) => `✨ ${offer.name}`).join('   •   ')}
          </div>
        )}

        {!activeCategory ? (
          <div>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Explore Our Menu</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {menu.categories.map((category) => (
                <button
                  key={category._id}
                  onClick={() => setActiveCategory(category._id)}
                  className="lux-card min-h-32 px-3 py-4 text-center text-base font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:border-red-200 hover:text-[var(--primary)]"
                >
                  <p className="mb-2 text-2xl">🍽️</p>
                  {category.name}
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
                const quantity = getQuantity(item._id)
                return (
                  <div key={item._id} className="lux-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-red-100 bg-red-50 text-sm font-bold text-[var(--primary)]">
                          {item.name?.charAt(0) || 'M'}
                        </div>
                        <div>
                        <h3 className="font-semibold text-slate-900">{item.name}</h3>
                        <p className="text-sm text-slate-600">{item.description || 'A signature dish from our kitchen.'}</p>
                        </div>
                      </div>
                      <p className="rounded-full border border-red-100 bg-red-50 px-3 py-1 text-sm font-bold text-[var(--primary)]">
                        ${Number(item.price).toFixed(2)}
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
        <div className="fixed bottom-20 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 p-4 backdrop-blur">
          <Button className="w-full" onClick={openCheckout}>
            View Cart • ${total.toFixed(2)}
          </Button>
        </div>
      )}

      <CustomerBottomNav restaurantSlug={restaurantSlug} tableNumber={tableNumber} />
    </div>
  )
}
