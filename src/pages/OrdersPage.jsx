import { useEffect, useState } from 'react'
import OrderCard from '../components/OrderCard'
import Button from '../components/Button'
import { orderService } from '../services/orderService'
import { useAuth } from '../hooks/useAuth'

const statusFilters = ['All', 'Pending', 'Preparing', 'Ready', 'Served', 'Completed']

function buildOrderBoardParams(statusFilter, scope) {
  return {
    status: statusFilter,
    scope: scope === 'Today' ? 'today' : 'all',
  }
}

export default function OrdersPage() {
  const { restaurant } = useAuth()
  const [activeOrders, setActiveOrders] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [statusFilter, setStatusFilter] = useState('All')
  const [scope, setScope] = useState('All')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!restaurant?._id) return undefined

    const loadOrders = () => {
      orderService
        .listBoard(restaurant._id, buildOrderBoardParams(statusFilter, scope))
        .then(({ activeOrders: active = [], recentOrders: recent = [] }) => {
          setActiveOrders(active)
          setRecentOrders(recent)
          setError('')
        })
        .catch((requestError) => setError(requestError?.response?.data?.message || 'Failed to load orders'))
    }

    loadOrders()
    if (!restaurant?._id) return undefined

    const interval = setInterval(loadOrders, 5000)
    return () => clearInterval(interval)
  }, [restaurant, statusFilter, scope])

  const onStatusChange = (id, status) => {
    if (!restaurant?._id) return

    orderService
      .updateStatus(id, status)
      .then(() => orderService.listBoard(restaurant._id, buildOrderBoardParams(statusFilter, scope)))
      .then(({ activeOrders: active = [], recentOrders: recent = [] }) => {
        setActiveOrders(active)
        setRecentOrders(recent)
        setError('')
      })
      .catch((requestError) => setError(requestError?.response?.data?.message || 'Failed to update status'))
  }

  const onDeleteOrder = (id) => {
    if (!restaurant?._id) return

    orderService
      .delete(id)
      .then(() => orderService.listBoard(restaurant._id, buildOrderBoardParams(statusFilter, scope)))
      .then(({ activeOrders: active = [], recentOrders: recent = [] }) => {
        setActiveOrders(active)
        setRecentOrders(recent)
        setError('')
      })
      .catch((requestError) => setError(requestError?.response?.data?.message || 'Failed to delete order'))
  }

  return (
    <div className="space-y-5">
      {error && <p className="text-sm text-[var(--primary)]">{error}</p>}
      <div className="card flex flex-wrap gap-2 p-4">
        {statusFilters.map((filter) => (
          <Button
            key={filter}
            variant={statusFilter === filter ? 'primary' : 'secondary'}
            onClick={() => setStatusFilter(filter)}
          >
            {filter}
          </Button>
        ))}
        <Button variant={scope === 'Today' ? 'primary' : 'secondary'} onClick={() => setScope('Today')}>
          Today
        </Button>
        <Button variant={scope === 'All' ? 'primary' : 'secondary'} onClick={() => setScope('All')}>
          All
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="space-y-3 rounded-2xl border border-red-100 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800">Active Orders</h2>
          <div className="grid grid-cols-1 gap-4">
            {activeOrders.map((order) => (
              <OrderCard
                key={order._id || order.id}
                order={order}
                onStatusChange={onStatusChange}
                onDelete={onDeleteOrder}
                deleteLabel="Move to Recent"
              />
            ))}
            {!activeOrders.length && <p className="text-sm text-slate-500">No active orders in this view.</p>}
          </div>
        </section>

        <section className="space-y-3 rounded-2xl border border-red-100 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800">Recent Orders</h2>
          <div className="grid grid-cols-1 gap-4">
            {recentOrders.map((order) => (
              <OrderCard
                key={order._id || order.id}
                order={order}
                onStatusChange={onStatusChange}
                onDelete={onDeleteOrder}
                deleteLabel="Hide"
                showStatusActions={false}
              />
            ))}
            {!recentOrders.length && <p className="text-sm text-slate-500">No recent orders in this view.</p>}
          </div>
        </section>
      </div>
    </div>
  )
}
