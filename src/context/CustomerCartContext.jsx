import { createContext, useState } from 'react'

export const CustomerCartContext = createContext(null)

function getSessionKey(restaurantSlug, tableNumber) {
  return `${restaurantSlug}::${tableNumber}`
}

export function CustomerCartProvider({ children }) {
  const [sessions, setSessions] = useState({})

  const getSession = (restaurantSlug, tableNumber) => {
    const key = getSessionKey(restaurantSlug, tableNumber)
    return sessions[key] || { items: [], paid: false }
  }

  const addItem = (restaurantSlug, tableNumber, item) => {
    const key = getSessionKey(restaurantSlug, tableNumber)

    setSessions((prev) => {
      const current = prev[key] || { items: [], paid: false }
      const found = current.items.find((entry) => entry.menuItemId === item._id)

      const items = found
        ? current.items.map((entry) =>
            entry.menuItemId === item._id ? { ...entry, quantity: entry.quantity + 1 } : entry,
          )
        : [
            ...current.items,
            {
              menuItemId: item._id,
              name: item.name,
              price: item.price,
              quantity: 1,
            },
          ]

      return {
        ...prev,
        [key]: { ...current, items },
      }
    })
  }

  const removeItem = (restaurantSlug, tableNumber, menuItemId) => {
    const key = getSessionKey(restaurantSlug, tableNumber)

    setSessions((prev) => {
      const current = prev[key] || { items: [], paid: false }
      const target = current.items.find((entry) => entry.menuItemId === menuItemId)
      if (!target) return prev

      const items =
        target.quantity === 1
          ? current.items.filter((entry) => entry.menuItemId !== menuItemId)
          : current.items.map((entry) =>
              entry.menuItemId === menuItemId ? { ...entry, quantity: entry.quantity - 1 } : entry,
            )

      return {
        ...prev,
        [key]: { ...current, items },
      }
    })
  }

  const setPaid = (restaurantSlug, tableNumber, paid) => {
    const key = getSessionKey(restaurantSlug, tableNumber)
    setSessions((prev) => {
      const current = prev[key] || { items: [], paid: false }
      return {
        ...prev,
        [key]: { ...current, paid },
      }
    })
  }

  const clearSession = (restaurantSlug, tableNumber) => {
    const key = getSessionKey(restaurantSlug, tableNumber)
    setSessions((prev) => ({ ...prev, [key]: { items: [], paid: false } }))
  }

  const value = { getSession, addItem, removeItem, setPaid, clearSession }

  return <CustomerCartContext.Provider value={value}>{children}</CustomerCartContext.Provider>
}