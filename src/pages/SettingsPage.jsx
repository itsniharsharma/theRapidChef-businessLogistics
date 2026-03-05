import { useEffect, useState } from 'react'
import Button from '../components/Button'
import FormInput from '../components/FormInput'
import { useAuth } from '../hooks/useAuth'
import { restaurantService } from '../services/restaurantService'
import { uploadService } from '../services/uploadService'

export default function SettingsPage() {
  const { restaurant, setRestaurant } = useAuth()
  const [logo, setLogo] = useState('')
  const [form, setForm] = useState({
    restaurantName: '',
    address: '',
    phone: '',
    businessHours: '',
    upiVpa: '',
    upiPayeeName: '',
  })
  const [message, setMessage] = useState('')
  const [uploadingLogo, setUploadingLogo] = useState(false)

  useEffect(() => {
    if (!restaurant) return
    setForm({
      restaurantName: restaurant.name || '',
      address: restaurant.address || '',
      phone: restaurant.phone || '',
      businessHours: restaurant.businessHours || '',
      upiVpa: restaurant.upiVpa || '',
      upiPayeeName: restaurant.upiPayeeName || '',
    })
    setLogo(restaurant.logo || '')
  }, [restaurant])

  const onLogoUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    setMessage('Uploading logo to Cloudinary...')

    try {
      const uploaded = await uploadService.uploadImage(file)
      setLogo(uploaded.url)
      setMessage('Logo uploaded')
    } catch (requestError) {
      setMessage(requestError?.response?.data?.message || 'Failed to upload logo')
    } finally {
      setUploadingLogo(false)
    }
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
        upiVpa: form.upiVpa,
        upiPayeeName: form.upiPayeeName,
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
        <input type="file" className="input" accept="image/*" onChange={onLogoUpload} disabled={uploadingLogo} />
      </label>
      {logo && <img src={logo} alt="Logo" className="h-16 w-16 rounded border border-slate-200 object-cover" />}
      <FormInput label="Address" value={form.address} onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))} />
      <FormInput label="Phone" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
      <FormInput
        label="Business Hours"
        value={form.businessHours}
        onChange={(e) => setForm((prev) => ({ ...prev, businessHours: e.target.value }))}
      />
      <FormInput
        label="Owner UPI ID (example: owner@okaxis)"
        value={form.upiVpa}
        onChange={(e) => setForm((prev) => ({ ...prev, upiVpa: e.target.value }))}
      />
      <FormInput
        label="UPI Payee Name"
        value={form.upiPayeeName}
        onChange={(e) => setForm((prev) => ({ ...prev, upiPayeeName: e.target.value }))}
      />
      <Button type="submit">Save Changes</Button>
    </form>
  )
}