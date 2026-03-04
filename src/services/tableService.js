import api from './api'

export const tableService = {
  create(payload) {
    return api.post('/tables', payload).then((response) => response.data)
  },
  list(restaurantId) {
    return api.get(`/tables/${restaurantId}`).then((response) => response.data)
  },
}
