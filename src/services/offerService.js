import api from './api'

export const offerService = {
  preview(restaurantSlug, payload) {
    return api.post(`/offers/preview/${restaurantSlug}`, payload).then((response) => response.data)
  },
  draftFromPrompt(payload) {
    return api.post('/offers/ai/draft', payload).then((response) => response.data)
  },
  validateDraft(payload) {
    return api.post('/offers/validate', payload).then((response) => response.data)
  },
  publishDraft(payload) {
    return api.post('/offers/publish', payload).then((response) => response.data)
  },
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
