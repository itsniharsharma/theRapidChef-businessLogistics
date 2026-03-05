import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { importers, warmCriticalRoutes } from './utils/routePreload'

const DashboardLayout = lazy(importers.dashboardLayout)
const LandingPage = lazy(importers.landing)
const LoginPage = lazy(importers.login)
const RegisterPage = lazy(importers.register)
const DashboardPage = lazy(importers.dashboard)
const OrdersPage = lazy(importers.orders)
const MenuPage = lazy(importers.menu)
const TablesPage = lazy(importers.tables)
const OffersPage = lazy(importers.offers)
const AnalyticsPage = lazy(importers.analytics)
const BillingPage = lazy(importers.billing)
const SettingsPage = lazy(importers.settings)
const CustomerMenuPage = lazy(importers.customerMenu)
const CustomerCheckoutPage = lazy(importers.customerCheckout)
const CustomerStatusPage = lazy(importers.customerStatus)
const CustomerOrderTrackingPage = lazy(importers.customerTracking)

function App() {
  useEffect(() => {
    const idleCallback = window.requestIdleCallback || ((callback) => window.setTimeout(callback, 250))
    const cancelIdle = window.cancelIdleCallback || window.clearTimeout

    const id = idleCallback(() => {
      warmCriticalRoutes()
    })

    return () => cancelIdle(id)
  }, [])

  return (
    <BrowserRouter>
      <Suspense fallback={<div className="p-6 text-sm text-slate-500">Loading...</div>}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/r/:restaurantSlug/t/:tableNumber" element={<CustomerMenuPage />} />
          <Route path="/r/:restaurantSlug/t/:tableNumber/checkout" element={<CustomerCheckoutPage />} />
          <Route path="/r/:restaurantSlug/t/:tableNumber/status" element={<CustomerStatusPage />} />
          <Route
            path="/r/:restaurantSlug/t/:tableNumber/order/:orderId"
            element={<CustomerOrderTrackingPage />}
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="menu" element={<MenuPage />} />
            <Route path="tables" element={<TablesPage />} />
            <Route path="offers" element={<OffersPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="billing" element={<BillingPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
