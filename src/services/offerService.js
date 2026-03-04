import api from './api'

export const offerService = {
  list(restaurantId) {
    return api.get(`/offers/${restaurantId}`).then((response) => response.data)
  },
  create(payload) {
    return api.post('/offers', payload).then((response) => response.data)
  },
  update(id, payload) {
    return api.put(`/offers/${id}`, payload).then((response) => response.data)
  },
  delete(id) {
    return api.delete(`/offers/${id}`).then((response) => response.data)
  },
}
