import api from './api'

export const analyticsService = {
  dashboard(restaurantId) {
    return api.get(`/analytics/dashboard/${restaurantId}`).then((response) => response.data)
  },
  analytics(restaurantId) {
    return api.get(`/analytics/${restaurantId}`).then((response) => response.data)
  },
}
