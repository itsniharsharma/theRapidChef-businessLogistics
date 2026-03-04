import { createContext, useEffect, useMemo, useState } from 'react'
import { authService } from '../services/authService'

export const AuthContext = createContext(null)

const TOKEN_KEY = 'hunger_token'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(null)
  const [restaurant, setRestaurant] = useState(null)
  const [authLoading, setAuthLoading] = useState(Boolean(token))

  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
  }, [token])

  useEffect(() => {
    let mounted = true

    const bootstrap = async () => {
      if (!token) {
        setAuthLoading(false)
        return
      }

      try {
        const data = await authService.me()
        if (!mounted) return
        setUser(data.user)
        setRestaurant(data.restaurant)
      } catch {
        if (!mounted) return
        setToken(null)
        setUser(null)
        setRestaurant(null)
      } finally {
        if (mounted) {
          setAuthLoading(false)
        }
      }
    }

    bootstrap()
    return () => {
      mounted = false
    }
  }, [token])

  const login = async (payload) => {
    const result = await authService.login(payload)
    setToken(result.token)
    setUser(result.user)
    setRestaurant(result.restaurant)
  }

  const register = async (payload) => {
    const result = await authService.register(payload)
    setToken(result.token)
    setUser(result.user)
    setRestaurant(result.restaurant)
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    setRestaurant(null)
  }

  const value = useMemo(
    () => ({
      token,
      user,
      restaurant,
      authLoading,
      isAuthenticated: Boolean(token),
      login,
      register,
      logout,
      setRestaurant,
    }),
    [token, user, restaurant, authLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}