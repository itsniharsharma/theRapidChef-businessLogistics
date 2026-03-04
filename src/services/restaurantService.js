import api from './api'

export const restaurantService = {
  getMine() {
    return api.get('/restaurants/me').then((response) => response.data)
  },
  updateMine(payload) {
    return api.put('/restaurants/me', payload).then((response) => response.data)
  },
  getBySlug(slug) {
    return api.get(`/restaurants/slug/${slug}`).then((response) => response.data)
  },
}
