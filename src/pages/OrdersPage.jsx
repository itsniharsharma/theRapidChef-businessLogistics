import { useEffect, useState } from 'react'
import OrderCard from '../components/OrderCard'
import Button from '../components/Button'
import { orderService } from '../services/orderService'
import { useAuth } from '../hooks/useAuth'

const statusFilters = ['All', 'Pending', 'Preparing', 'Ready', 'Served', 'Completed']

export default function OrdersPage() {
  const { restaurant } = useAuth()
  const [orders, setOrders] = useState([])
  const [statusFilter, setStatusFilter] = useState('All')
  const [scope, setScope] = useState('All')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!restaurant?._id) return undefined

    const loadOrders = () => {
      const params = {
        status: statusFilter,
        scope: scope === 'Today' ? 'today' : 'all',
      }

      orderService
        .list(restaurant._id, params)
        .then(setOrders)
        .catch((requestError) => setError(requestError?.response?.data?.message || 'Failed to load orders'))
    }

    loadOrders()
    if (!restaurant?._id) return undefined

    const interval = setInterval(loadOrders, 5000)
    return () => clearInterval(interval)
  }, [restaurant, statusFilter, scope])

  const onStatusChange = (id, status) => {
    if (!restaurant?._id) return
    const params = {
      status: statusFilter,
      scope: scope === 'Today' ? 'today' : 'all',
    }

    orderService
      .updateStatus(id, status)
      .then(() => orderService.list(restaurant._id, params))
      .then(setOrders)
      .catch((requestError) => setError(requestError?.response?.data?.message || 'Failed to update status'))
  }

  const onDeleteOrder = (id) => {
    if (!restaurant?._id) return
    const params = {
      status: statusFilter,
      scope: scope === 'Today' ? 'today' : 'all',
    }

    orderService
      .delete(id)
      .then(() => orderService.list(restaurant._id, params))
      .then(setOrders)
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

      <div className="grid grid-cols-1 gap-4">
        {orders.map((order) => (
          <OrderCard
            key={order._id || order.id}
            order={order}
            onStatusChange={onStatusChange}
            onDelete={onDeleteOrder}
          />
        ))}
      </div>
    </div>
  )
}
