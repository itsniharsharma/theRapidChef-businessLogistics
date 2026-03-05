import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'

const titles = {
  '/dashboard': 'Dashboard',
  '/dashboard/orders': 'Orders',
  '/dashboard/menu': 'Menu Management',
  '/dashboard/tables': 'Table Management',
  '/dashboard/offers': 'Offers',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/settings': 'Settings',
}

export default function DashboardLayout() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="owner-shell">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="ml-0 p-3 pb-8 md:ml-64 md:p-6 lg:p-8">
        <button
          className="mb-4 rounded-xl border border-red-100 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm md:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          ☰ Workspace Menu
        </button>
        <Header title={titles[location.pathname] || 'Dashboard'} />
        <div className="premium-grid">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
