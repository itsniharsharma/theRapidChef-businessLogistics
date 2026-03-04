import { NavLink } from 'react-router-dom'

const baseItemClass = 'flex min-h-12 flex-col items-center justify-center rounded-xl px-3 py-2 text-xs font-semibold transition'

function navClassName({ isActive }) {
  return `${baseItemClass} ${
    isActive
      ? 'bg-red-50 text-[var(--primary)] border border-red-100'
      : 'text-slate-500 border border-transparent hover:text-slate-700 hover:bg-slate-50'
  }`
}

export default function CustomerBottomNav({ restaurantSlug, tableNumber }) {
  const menuPath = `/r/${restaurantSlug}/t/${tableNumber}`
  const ordersPath = `/r/${restaurantSlug}/t/${tableNumber}/checkout`
  const statusPath = `/r/${restaurantSlug}/t/${tableNumber}/status`

  return (
    <footer className="safe-bottom fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 px-3 pt-2 backdrop-blur">
      <nav className="mx-auto grid max-w-md grid-cols-3 gap-2">
        <NavLink to={menuPath} end className={navClassName}>
          <span className="text-sm">🍽️</span>
          <span>Menu</span>
        </NavLink>
        <NavLink to={ordersPath} className={navClassName}>
          <span className="text-sm">🧾</span>
          <span>Orders</span>
        </NavLink>
        <NavLink to={statusPath} className={navClassName}>
          <span className="text-sm">📍</span>
          <span>Status</span>
        </NavLink>
      </nav>
    </footer>
  )
}