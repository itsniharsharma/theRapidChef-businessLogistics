import api from './api'

export const authService = {
  register(payload) {
    return api.post('/auth/register', payload).then((response) => response.data)
  },
  login(payload) {
    return api.post('/auth/login', payload).then((response) => response.data)
  },
  me() {
    return api.get('/auth/me').then((response) => response.data)
  },
}
