import { useEffect, useState } from 'react'
import Button from '../components/Button'
import FormInput from '../components/FormInput'
import { useAuth } from '../hooks/useAuth'
import { restaurantService } from '../services/restaurantService'

export default function SettingsPage() {
  const { restaurant, setRestaurant } = useAuth()
  const [logo, setLogo] = useState('')
  const [form, setForm] = useState({
    restaurantName: '',
    address: '',
    phone: '',
    businessHours: '',
  })
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!restaurant) return
    setForm({
      restaurantName: restaurant.name || '',
      address: restaurant.address || '',
      phone: restaurant.phone || '',
      businessHours: restaurant.businessHours || '',
    })
    setLogo(restaurant.logo || '')
  }, [restaurant])

  const onLogoUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setLogo(String(reader.result || ''))
    reader.readAsDataURL(file)
  }

  const onSave = (event) => {
    event.preventDefault()
    setMessage('')

    restaurantService
      .updateMine({
        name: form.restaurantName,
        logo,
        address: form.address,
        phone: form.phone,
        businessHours: form.businessHours,
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
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">Logo Upload</span>
        <input type="file" className="input" accept="image/*" onChange={onLogoUpload} />
      </label>
      {logo && <img src={logo} alt="Logo" className="h-16 w-16 rounded border border-slate-200 object-cover" />}
      <FormInput label="Address" value={form.address} onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))} />
      <FormInput label="Phone" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
      <FormInput
        label="Business Hours"
        value={form.businessHours}
        onChange={(e) => setForm((prev) => ({ ...prev, businessHours: e.target.value }))}
      />
      <Button type="submit">Save Changes</Button>
    </form>
  )
}