import api from './api'

export const orderService = {
  list(restaurantId, params = {}) {
    return api.get(`/orders/${restaurantId}`, { params }).then((response) => response.data)
  },
  listBoard(restaurantId, params = {}) {
    return api
      .get(`/orders/${restaurantId}`, { params: { ...params, includeRecent: true } })
      .then((response) => response.data)
      .then((data) => {
        if (data && !Array.isArray(data) && Array.isArray(data.activeOrders) && Array.isArray(data.recentOrders)) {
          return data
        }

        // Backward-compatible fallback when backend hasn't restarted with includeRecent support.
        return Promise.all([
          api.get(`/orders/${restaurantId}`, { params: { ...params, view: 'active' } }).then((response) => response.data),
          api.get(`/orders/${restaurantId}`, { params: { ...params, view: 'recent', status: 'Completed' } }).then((response) => response.data),
        ]).then(([activeOrders, recentOrders]) => ({ activeOrders, recentOrders }))
      })
  },
  updateStatus(orderId, orderStatus) {
    return api.patch(`/orders/${orderId}/status`, { orderStatus }).then((response) => response.data)
  },
  delete(orderId) {
    return api.delete(`/orders/${orderId}`).then((response) => response.data)
  },
  create(payload) {
    return api.post('/orders', payload).then((response) => response.data)
  },
  track(restaurantSlug, tableNumber, orderId) {
    return api
      .get(`/orders/track/${restaurantSlug}/${tableNumber}/${orderId}`)
      .then((response) => response.data)
  },
  trackTable(restaurantSlug, tableNumber) {
    return api.get(`/orders/track/${restaurantSlug}/${tableNumber}`).then((response) => response.data)
  },
}
