import { useEffect, useState } from 'react'
import Button from '../components/Button'
import FormInput from '../components/FormInput'
import { offerService } from '../services/offerService'
import { useAuth } from '../hooks/useAuth'

const offerTypes = ['Percentage Discount', 'Flat Discount', 'Combo Offer', 'Buy X Get Y']

const initialForm = {
  name: '',
  type: offerTypes[0],
  items: '',
  discount: '',
  start: '',
  end: '',
  active: true,
}

export default function OffersPage() {
  const { restaurant } = useAuth()
  const [form, setForm] = useState(initialForm)
  const [offers, setOffers] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!restaurant?._id) return

    offerService
      .list(restaurant._id)
      .then(setOffers)
      .catch((requestError) => setError(requestError?.response?.data?.message || 'Failed to load offers'))
  }, [restaurant])

  const onSubmit = (event) => {
    event.preventDefault()
    setError('')
    const payload = {
      name: form.name,
      type: form.type,
      discountValue: form.discount,
      conditions: form.items,
      active: form.active,
      startTime: form.start || null,
      endTime: form.end || null,
    }

    const request = editingId ? offerService.update(editingId, payload) : offerService.create(payload)
    request
      .then(() => offerService.list(restaurant._id))
      .then(setOffers)
      .then(() => {
        setEditingId(null)
        setForm(initialForm)
      })
      .catch((requestError) => setError(requestError?.response?.data?.message || 'Failed to save offer'))
  }

  const onEdit = (offer) => {
    setEditingId(offer._id)
    setForm({
      name: offer.name,
      type: offer.type,
      items: offer.conditions,
      discount: offer.discountValue,
      start: offer.startTime ? offer.startTime.slice(0, 16) : '',
      end: offer.endTime ? offer.endTime.slice(0, 16) : '',
      active: offer.active,
    })
  }

  const toggleActive = (offer) => {
    offerService
      .update(offer._id, { active: !offer.active })
      .then(() => offerService.list(restaurant._id))
      .then(setOffers)
      .catch((requestError) => setError(requestError?.response?.data?.message || 'Failed to update offer'))
  }

  const onDelete = (id) => {
    offerService
      .delete(id)
      .then(() => offerService.list(restaurant._id))
      .then(setOffers)
      .catch((requestError) => setError(requestError?.response?.data?.message || 'Failed to delete offer'))
  }

  return (
    <div className="space-y-5">
      <form className="card grid grid-cols-1 gap-3 p-4 md:grid-cols-2" onSubmit={onSubmit}>
        <h2 className="md:col-span-2 text-lg font-semibold">Create Offer</h2>
        {error && <p className="md:col-span-2 text-sm text-[var(--primary)]">{error}</p>}
        <FormInput
          label="Offer Name"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          required
        />
        <label>
          <span className="mb-1 block text-sm font-medium text-slate-700">Offer Type</span>
          <select
            className="input"
            value={form.type}
            onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
          >
            {offerTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
        <FormInput
          label="Applicable Items"
          value={form.items}
          onChange={(e) => setForm((prev) => ({ ...prev, items: e.target.value }))}
          placeholder="Comma-separated items"
        />
        <FormInput
          label="Discount Value"
          value={form.discount}
          onChange={(e) => setForm((prev) => ({ ...prev, discount: e.target.value }))}
        />
        <FormInput
          label="Start Time"
          type="datetime-local"
          value={form.start}
          onChange={(e) => setForm((prev) => ({ ...prev, start: e.target.value }))}
        />
        <FormInput
          label="End Time"
          type="datetime-local"
          value={form.end}
          onChange={(e) => setForm((prev) => ({ ...prev, end: e.target.value }))}
        />
        <label className="md:col-span-2 flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
          />
          Active
        </label>
        <div className="md:col-span-2">
          <Button type="submit">{editingId ? 'Update Offer' : 'Create Offer'}</Button>
        </div>
      </form>

      <div className="space-y-3">
        {offers.map((offer) => (
          <div key={offer._id} className="card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold">{offer.name}</h3>
                <p className="text-sm text-slate-600">
                  {offer.type} • {offer.discountValue}
                </p>
                <p className="text-sm text-slate-500">Items: {offer.conditions || '-'}</p>
              </div>
              <span className={`rounded px-2 py-1 text-xs ${offer.active ? 'bg-red-50 text-[var(--primary)]' : 'bg-slate-100 text-slate-600'}`}>
                {offer.active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="mt-3 flex gap-2">
              <Button variant="secondary" onClick={() => onEdit(offer)}>
                Edit
              </Button>
              <Button variant="secondary" onClick={() => toggleActive(offer)}>
                {offer.active ? 'Deactivate' : 'Activate'}
              </Button>
              <Button variant="secondary" onClick={() => onDelete(offer._id)}>
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
