import { useCallback, useEffect, useMemo, useState } from 'react'
import Button from '../components/Button'
import { offerService } from '../services/offerService'
import { menuService } from '../services/menuService'
import { useAuth } from '../hooks/useAuth'

function prettyJson(value) {
  return JSON.stringify(value, null, 2)
}

export default function OffersPage() {
  const { restaurant } = useAuth()
  const [offers, setOffers] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [selectedItemIds, setSelectedItemIds] = useState([])
  const [prompt, setPrompt] = useState('')
  const [chat, setChat] = useState([])
  const [draftJson, setDraftJson] = useState('')
  const [validation, setValidation] = useState(null)
  const [busyAction, setBusyAction] = useState('')
  const [error, setError] = useState('')

  const selectedName = useMemo(() => {
    const selectedSet = new Set(selectedItemIds)
    return menuItems
      .filter((item) => selectedSet.has(item._id))
      .map((item) => item.name)
      .join(', ')
  }, [menuItems, selectedItemIds])

  const loadData = useCallback(async () => {
    if (!restaurant?._id || !restaurant?.slug) return

    const [offerList, menuData] = await Promise.all([
      offerService.list(restaurant._id),
      menuService.getBySlug(restaurant.slug),
    ])

    setOffers(offerList)
    setMenuItems((menuData.items || []).filter((item) => item.available))
  }, [restaurant?._id, restaurant?.slug])

  useEffect(() => {
    loadData()
      .then(() => setError(''))
      .catch((requestError) => setError(requestError?.response?.data?.message || 'Failed to load offers module data'))
  }, [loadData])

  const toggleSelected = (menuItemId) => {
    setSelectedItemIds((prev) => (prev.includes(menuItemId) ? prev.filter((id) => id !== menuItemId) : [...prev, menuItemId]))
  }

  const parseDraftJson = () => {
    try {
      const parsed = JSON.parse(draftJson)
      return parsed
    } catch {
      throw new Error('Draft JSON is invalid. Fix JSON syntax before validate/publish.')
    }
  }

  const generateDraft = async () => {
    if (!prompt.trim()) return

    setBusyAction('draft')
    setError('')
    setValidation(null)
    setChat((prev) => [...prev, { role: 'owner', text: prompt }])

    try {
      const result = await offerService.draftFromPrompt({
        prompt,
        selectedItemIds,
      })

      setDraftJson(prettyJson(result.draft))
      setValidation(result.validation)
      setChat((prev) => [
        ...prev,
        {
          role: 'agent',
          text: `${result.summary}${result.warnings?.length ? `\nWarnings: ${result.warnings.join(' | ')}` : ''}`,
        },
      ])
    } catch (requestError) {
      const message = requestError?.response?.data?.message || 'Unable to parse prompt into a supported offer draft'
      setError(message)
      setChat((prev) => [...prev, { role: 'agent', text: message }])
    } finally {
      setBusyAction('')
    }
  }

  const runValidation = async () => {
    setBusyAction('validate')
    setError('')

    try {
      const draft = parseDraftJson()
      const result = await offerService.validateDraft({ draft })
      setValidation(result)
      if (!result.valid) {
        setError('Validation failed. Resolve errors before publishing.')
      }
    } catch (requestError) {
      setError(requestError?.message || requestError?.response?.data?.message || 'Validation failed')
    } finally {
      setBusyAction('')
    }
  }

  const publishDraft = async () => {
    setBusyAction('publish')
    setError('')

    try {
      const draft = parseDraftJson()
      await offerService.publishDraft({ draft })
      await loadData()
      setPrompt('')
      setSelectedItemIds([])
      setDraftJson('')
      setValidation(null)
      setChat((prev) => [...prev, { role: 'agent', text: 'Offer published successfully and is now available in checkout.' }])
    } catch (requestError) {
      setError(requestError?.response?.data?.message || requestError?.message || 'Failed to publish offer')
    } finally {
      setBusyAction('')
    }
  }

  const toggleActive = async (offer) => {
    setBusyAction(`toggle-${offer._id}`)
    setError('')
    try {
      await offerService.update(offer._id, { active: !offer.active })
      await loadData()
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Failed to update offer status')
    } finally {
      setBusyAction('')
    }
  }

  const removeOffer = async (offerId) => {
    setBusyAction(`delete-${offerId}`)
    setError('')
    try {
      await offerService.delete(offerId)
      await loadData()
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Failed to delete offer')
    } finally {
      setBusyAction('')
    }
  }

  return (
    <div className="space-y-5">
      {error ? <p className="text-sm text-[var(--primary)]">{error}</p> : null}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="card space-y-4 p-4">
          <h2 className="text-lg font-semibold">Offer Prompt Agent (Phase 1 Prototype)</h2>
          <p className="text-sm text-slate-600">Describe your offer in natural language. Supported: % off by qty, flat cart discount, Buy X Get Y, coupon code.</p>

          <div className="rounded-lg border border-slate-200 p-3">
            <p className="mb-2 text-sm font-medium text-slate-700">Select Menu Items Context</p>
            <div className="max-h-44 space-y-2 overflow-auto pr-1">
              {menuItems.map((item) => (
                <label key={item._id} className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={selectedItemIds.includes(item._id)} onChange={() => toggleSelected(item._id)} />
                  <span>{item.name}</span>
                </label>
              ))}
              {!menuItems.length ? <p className="text-sm text-slate-500">No available menu items found.</p> : null}
            </div>
            <p className="mt-2 text-xs text-slate-500">Selected: {selectedName || 'none'}</p>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Prompt</span>
            <textarea
              className="input"
              rows={4}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Example: apply offer as 30% off for buying 2 Chicken burgers"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <Button onClick={generateDraft} disabled={busyAction !== '' || !prompt.trim()}>
              {busyAction === 'draft' ? 'Generating...' : 'Generate Draft'}
            </Button>
            <Button variant="secondary" onClick={runValidation} disabled={busyAction !== '' || !draftJson.trim()}>
              {busyAction === 'validate' ? 'Validating...' : 'Validate Draft'}
            </Button>
            <Button onClick={publishDraft} disabled={busyAction !== '' || !draftJson.trim()}>
              {busyAction === 'publish' ? 'Publishing...' : 'Publish Offer'}
            </Button>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="mb-2 text-sm font-medium text-slate-700">Conversation</p>
            <div className="max-h-44 space-y-2 overflow-auto text-sm">
              {chat.map((entry, index) => (
                <div key={`${index}-${entry.role}`} className={`rounded px-2 py-1 ${entry.role === 'owner' ? 'bg-white text-slate-700' : 'bg-red-50 text-slate-700'}`}>
                  <span className="mr-1 font-semibold">{entry.role === 'owner' ? 'You:' : 'Agent:'}</span>
                  {entry.text}
                </div>
              ))}
              {!chat.length ? <p className="text-slate-500">No prompt interactions yet.</p> : null}
            </div>
          </div>
        </div>

        <div className="card space-y-3 p-4">
          <h2 className="text-lg font-semibold">Draft Rule JSON</h2>
          <textarea
            className="input font-mono text-xs"
            rows={20}
            value={draftJson}
            onChange={(event) => setDraftJson(event.target.value)}
            placeholder="Generated draft will appear here"
          />

          {validation ? (
            <div className="space-y-2 rounded-lg border border-slate-200 p-3 text-sm">
              <p className={`font-semibold ${validation.valid ? 'text-emerald-700' : 'text-[var(--primary)]'}`}>
                Validation: {validation.valid ? 'Passed' : 'Failed'}
              </p>
              {Array.isArray(validation.errors) && validation.errors.length ? (
                <div>
                  <p className="font-medium text-slate-700">Errors</p>
                  {validation.errors.map((line) => (
                    <p key={line} className="text-[var(--primary)]">• {line}</p>
                  ))}
                </div>
              ) : null}
              {Array.isArray(validation.warnings) && validation.warnings.length ? (
                <div>
                  <p className="font-medium text-slate-700">Warnings</p>
                  {validation.warnings.map((line) => (
                    <p key={line} className="text-amber-700">• {line}</p>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Published Offers</h2>
        {offers.map((offer) => (
          <div key={offer._id} className="card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold text-slate-900">{offer.name}</h3>
                <p className="text-sm text-slate-600">
                  {offer.type} • {offer.ruleType || 'legacy'} • {offer.discountValue || '-'}
                </p>
                {offer.couponCode ? <p className="text-xs text-slate-500">Coupon: {offer.couponCode}</p> : null}
              </div>
              <span className={`rounded px-2 py-1 text-xs ${offer.active ? 'bg-red-50 text-[var(--primary)]' : 'bg-slate-100 text-slate-600'}`}>
                {offer.active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => toggleActive(offer)}
                disabled={busyAction === `toggle-${offer._id}`}
              >
                {offer.active ? 'Deactivate' : 'Activate'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => removeOffer(offer._id)}
                disabled={busyAction === `delete-${offer._id}`}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
        {!offers.length ? <p className="text-sm text-slate-500">No offers published yet.</p> : null}
      </div>
    </div>
  )
}
