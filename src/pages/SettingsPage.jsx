import { useEffect, useState } from 'react'
import Button from '../components/Button'
import FormInput from '../components/FormInput'
import { useAuth } from '../hooks/useAuth'
import { restaurantService } from '../services/restaurantService'

export default function SettingsPage() {
  const { restaurant, setRestaurant } = useAuth()
  const [form, setForm] = useState({
    restaurantName: '',
    address: '',
    phone: '',
  })
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!restaurant) return
    setForm({
      restaurantName: restaurant.name || '',
      address: restaurant.address || '',
      phone: restaurant.phone || '',
    })
  }, [restaurant])

  const onSave = (event) => {
    event.preventDefault()
    setMessage('')

    restaurantService
      .updateMine({
        name: form.restaurantName,
        address: form.address,
        phone: form.phone,
      })
      .then((updated) => {
        setRestaurant(updated)
        setMessage('Saved successfully')
      })
      .catch((requestError) => {
        setMessage(requestError?.response?.data?.message || 'Failed to save settings')
      })
  }

  return (
    <form className="card max-w-3xl space-y-3 p-4" onSubmit={onSave}>
      {message && <p className="text-sm text-[var(--primary)]">{message}</p>}
      <FormInput
        label="Restaurant Name"
        value={form.restaurantName}
        onChange={(e) => setForm((prev) => ({ ...prev, restaurantName: e.target.value }))}
      />
      <FormInput label="Address" value={form.address} onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))} />
      <FormInput label="Phone" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
      <Button type="submit">Save Changes</Button>
    </form>
  )
}