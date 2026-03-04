import { useCallback, useEffect, useMemo, useState } from 'react'
import Button from '../components/Button'
import FormInput from '../components/FormInput'
import Modal from '../components/Modal'
import { menuService } from '../services/menuService'
import { useAuth } from '../hooks/useAuth'

const initialForm = {
  name: '',
  description: '',
  price: '',
  categoryId: '',
  image: '',
  available: true,
  bestseller: false,
}

const newDraftItem = {
  name: '',
  description: '',
  price: '',
  available: true,
  bestseller: false,
}

export default function MenuPage() {
  const { restaurant } = useAuth()
  const [categories, setCategories] = useState([])
  const [categoryName, setCategoryName] = useState('')
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [items, setItems] = useState([])
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [aiText, setAiText] = useState('')
  const [aiImageDataUrl, setAiImageDataUrl] = useState('')
  const [aiSourceFile, setAiSourceFile] = useState('')
  const [aiDraftCategories, setAiDraftCategories] = useState([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiImporting, setAiImporting] = useState(false)

  const categoryMap = useMemo(() => {
    const map = new Map()
    for (const category of categories) {
      map.set(category._id, category.name)
    }
    return map
  }, [categories])

  const loadMenu = useCallback(async () => {
    if (!restaurant?.slug) return
    const data = await menuService.getBySlug(restaurant.slug)
    setCategories(data.categories)
    setItems(data.items)
    setForm((prev) => {
      if (prev.categoryId) return prev
      return { ...prev, categoryId: data.categories[0]?._id || '' }
    })
  }, [restaurant?.slug])

  useEffect(() => {
    loadMenu().catch(() => setError('Failed to load menu data'))
  }, [loadMenu])

  const onImageUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setForm((prev) => ({ ...prev, image: String(reader.result || '') }))
    reader.readAsDataURL(file)
  }

  const onSubmit = (event) => {
    event.preventDefault()
    setError('')
    const payload = {
      ...form,
      categoryId: form.categoryId,
      price: Number(form.price),
    }

    const request = editingId
      ? menuService.updateItem(editingId, payload)
      : menuService.createItem(payload)

    request
      .then(() => loadMenu())
      .then(() => {
        setEditingId(null)
        setForm((prev) => ({ ...initialForm, categoryId: categories[0]?._id || prev.categoryId }))
      })
      .catch((requestError) => {
        setError(requestError?.response?.data?.message || 'Failed to save menu item')
      })
  }

  const onEdit = (item) => {
    setEditingId(item._id)
    setForm({ ...item, price: String(item.price) })
  }

  const onDelete = (id) => {
    menuService
      .deleteItem(id)
      .then(() => loadMenu())
      .catch((requestError) => setError(requestError?.response?.data?.message || 'Failed to delete item'))
  }

  const addCategory = () => {
    if (!categoryName.trim()) return

    menuService
      .createCategory({ name: categoryName })
      .then(() => loadMenu())
      .then(() => {
        setCategoryName('')
        setShowCategoryModal(false)
      })
      .catch((requestError) => {
        setError(requestError?.response?.data?.message || 'Failed to add category')
      })
  }

  const onAiFileUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setAiSourceFile(file.name)

    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result || '')
      if (file.type.startsWith('image/')) {
        setAiImageDataUrl(result)
        setAiText('')
      } else {
        setAiText(result)
        setAiImageDataUrl('')
      }
    }

    if (file.type.startsWith('image/')) {
      reader.readAsDataURL(file)
      return
    }

    reader.readAsText(file)
  }

  const runAiAnalysis = async () => {
    setError('')
    setAiLoading(true)

    try {
      const payload = {
        menuText: aiText.trim() || undefined,
        menuImageDataUrl: aiImageDataUrl || undefined,
      }
      const data = await menuService.analyzeWithAI(payload)

      const normalized = (data.categories || []).map((category) => ({
        name: category.name || '',
        items: (category.items || []).map((item) => ({
          name: item.name || '',
          description: item.description || '',
          price: String(item.price ?? ''),
          available: item.available ?? true,
          bestseller: item.bestseller ?? false,
        })),
      }))

      setAiDraftCategories(normalized)
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'AI menu analysis failed')
    } finally {
      setAiLoading(false)
    }
  }

  const updateDraftCategory = (categoryIndex, value) => {
    setAiDraftCategories((prev) =>
      prev.map((category, index) => (index === categoryIndex ? { ...category, name: value } : category)),
    )
  }

  const removeDraftCategory = (categoryIndex) => {
    setAiDraftCategories((prev) => prev.filter((_, index) => index !== categoryIndex))
  }

  const addDraftCategory = () => {
    setAiDraftCategories((prev) => [...prev, { name: '', items: [{ ...newDraftItem }] }])
  }

  const updateDraftItem = (categoryIndex, itemIndex, field, value) => {
    setAiDraftCategories((prev) =>
      prev.map((category, currentCategoryIndex) => {
        if (currentCategoryIndex !== categoryIndex) return category

        return {
          ...category,
          items: category.items.map((item, currentItemIndex) =>
            currentItemIndex === itemIndex ? { ...item, [field]: value } : item,
          ),
        }
      }),
    )
  }

  const addDraftItem = (categoryIndex) => {
    setAiDraftCategories((prev) =>
      prev.map((category, index) =>
        index === categoryIndex ? { ...category, items: [...category.items, { ...newDraftItem }] } : category,
      ),
    )
  }

  const removeDraftItem = (categoryIndex, itemIndex) => {
    setAiDraftCategories((prev) =>
      prev.map((category, index) => {
        if (index !== categoryIndex) return category
        return {
          ...category,
          items: category.items.filter((_, currentItemIndex) => currentItemIndex !== itemIndex),
        }
      }),
    )
  }

  const importAiDraftToMenu = async () => {
    if (!restaurant?.slug || aiDraftCategories.length === 0) return

    setAiImporting(true)
    setError('')

    try {
      const existing = await menuService.getBySlug(restaurant.slug)
      const categoryLookup = new Map(
        (existing.categories || []).map((category) => [category.name.trim().toLowerCase(), category]),
      )

      for (const draftCategory of aiDraftCategories) {
        const categoryName = draftCategory.name.trim()
        if (!categoryName) continue

        let category = categoryLookup.get(categoryName.toLowerCase())

        if (!category) {
          try {
            category = await menuService.createCategory({ name: categoryName })
            categoryLookup.set(categoryName.toLowerCase(), category)
          } catch (requestError) {
            if (requestError?.response?.status === 409) {
              const refetched = await menuService.getBySlug(restaurant.slug)
              const matched = (refetched.categories || []).find(
                (current) => current.name.trim().toLowerCase() === categoryName.toLowerCase(),
              )
              if (matched) {
                category = matched
                categoryLookup.set(categoryName.toLowerCase(), matched)
              }
            } else {
              throw requestError
            }
          }
        }

        if (!category?._id) continue

        for (const draftItem of draftCategory.items || []) {
          const itemName = draftItem.name.trim()
          const price = Number(draftItem.price)

          if (!itemName || Number.isNaN(price) || price < 0) {
            continue
          }

          await menuService.createItem({
            name: itemName,
            description: draftItem.description?.trim() || '',
            price,
            categoryId: category._id,
            image: '',
            available: Boolean(draftItem.available),
            bestseller: Boolean(draftItem.bestseller),
          })
        }
      }

      await loadMenu()
      setAiDraftCategories([])
      setAiText('')
      setAiImageDataUrl('')
      setAiSourceFile('')
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Failed to import AI-generated menu')
    } finally {
      setAiImporting(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="card p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">AI Menu Import</h2>
            <p className="text-sm text-slate-600">Upload menu text/image and auto-generate categories with priced items.</p>
            <p className="text-xs text-slate-500">Text files work with free auto-parse fallback. Image parsing needs OpenAI credits.</p>
          </div>
          <Button variant="secondary" onClick={runAiAnalysis} disabled={aiLoading || (!aiText.trim() && !aiImageDataUrl)}>
            {aiLoading ? 'Analyzing...' : 'Analyze with AI'}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Upload Menu File</span>
            <input
              type="file"
              accept=".txt,.csv,.md,.json,image/*"
              className="input"
              onChange={onAiFileUpload}
            />
            {aiSourceFile && <p className="mt-1 text-xs text-slate-500">Loaded: {aiSourceFile}</p>}
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Paste Menu Text (optional)</span>
            <textarea
              className="input"
              rows={5}
              value={aiText}
              onChange={(e) => {
                setAiText(e.target.value)
                if (e.target.value.trim()) {
                  setAiImageDataUrl('')
                }
              }}
              placeholder="Example: Paneer Tikka - 220"
            />
          </label>
        </div>

        {aiDraftCategories.length > 0 && (
          <div className="mt-4 space-y-4 rounded-xl border border-slate-200 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold">Review & Edit AI Draft</h3>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={addDraftCategory}>
                  Add Category
                </Button>
                <Button onClick={importAiDraftToMenu} disabled={aiImporting}>
                  {aiImporting ? 'Importing...' : 'Import to Menu'}
                </Button>
              </div>
            </div>

            {aiDraftCategories.map((category, categoryIndex) => (
              <div key={`${categoryIndex}-${category.name}`} className="rounded-xl border border-slate-200 p-3">
                <div className="mb-3 flex items-center gap-2">
                  <input
                    className="input"
                    value={category.name}
                    onChange={(e) => updateDraftCategory(categoryIndex, e.target.value)}
                    placeholder="Category name"
                  />
                  <Button variant="secondary" onClick={() => addDraftItem(categoryIndex)}>
                    Add Item
                  </Button>
                  <Button variant="secondary" onClick={() => removeDraftCategory(categoryIndex)}>
                    Remove Category
                  </Button>
                </div>

                <div className="space-y-2">
                  {category.items.map((item, itemIndex) => (
                    <div key={`${itemIndex}-${item.name}`} className="grid grid-cols-1 gap-2 rounded-lg border border-slate-100 p-3 md:grid-cols-12">
                      <input
                        className="input md:col-span-3"
                        value={item.name}
                        onChange={(e) => updateDraftItem(categoryIndex, itemIndex, 'name', e.target.value)}
                        placeholder="Item name"
                      />
                      <input
                        className="input md:col-span-4"
                        value={item.description}
                        onChange={(e) => updateDraftItem(categoryIndex, itemIndex, 'description', e.target.value)}
                        placeholder="Description"
                      />
                      <input
                        type="number"
                        className="input md:col-span-2"
                        value={item.price}
                        onChange={(e) => updateDraftItem(categoryIndex, itemIndex, 'price', e.target.value)}
                        placeholder="Price"
                      />
                      <label className="md:col-span-1 flex items-center justify-center gap-1 text-xs text-slate-600">
                        <input
                          type="checkbox"
                          checked={item.available}
                          onChange={(e) => updateDraftItem(categoryIndex, itemIndex, 'available', e.target.checked)}
                        />
                        Avl
                      </label>
                      <label className="md:col-span-1 flex items-center justify-center gap-1 text-xs text-slate-600">
                        <input
                          type="checkbox"
                          checked={item.bestseller}
                          onChange={(e) => updateDraftItem(categoryIndex, itemIndex, 'bestseller', e.target.checked)}
                        />
                        Best
                      </label>
                      <Button variant="secondary" className="md:col-span-1" onClick={() => removeDraftItem(categoryIndex, itemIndex)}>
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add Menu Item</h2>
          <Button variant="secondary" onClick={() => setShowCategoryModal(true)}>
            Add Category
          </Button>
        </div>
        {error && <p className="mb-3 text-sm text-[var(--primary)]">{error}</p>}

        <form className="grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={onSubmit}>
          <FormInput
            label="Name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
          <FormInput
            label="Price"
            type="number"
            value={form.price}
            onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
            required
          />
          <label className="block md:col-span-2">
            <span className="mb-1 block text-sm font-medium text-slate-700">Description</span>
            <textarea
              className="input"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </label>
          <label>
            <span className="mb-1 block text-sm font-medium text-slate-700">Category</span>
            <select
              className="input"
              value={form.categoryId}
              onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
            >
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Image Upload</span>
            <input type="file" accept="image/*" className="input" onChange={onImageUpload} />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.available}
              onChange={(e) => setForm((prev) => ({ ...prev, available: e.target.checked }))}
            />
            Available
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.bestseller}
              onChange={(e) => setForm((prev) => ({ ...prev, bestseller: e.target.checked }))}
            />
            Bestseller
          </label>
          {form.image && (
            <img src={form.image} alt="Preview" className="h-24 w-24 rounded-lg border border-slate-200 object-cover" />
          )}
          <div className="md:col-span-2">
            <Button type="submit">{editingId ? 'Update Item' : 'Add Item'}</Button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <div key={item._id} className="card p-4">
            <div className="mb-2 flex items-start justify-between">
              <h3 className="font-semibold">{item.name}</h3>
              <p className="font-semibold text-[var(--primary)]">${item.price}</p>
            </div>
            <p className="text-sm text-slate-600">{item.description}</p>
            <p className="mt-2 text-sm text-slate-500">Category: {categoryMap.get(item.categoryId) || '-'}</p>
            <div className="mt-2 flex gap-2 text-xs">
              <span className="rounded bg-slate-100 px-2 py-1">{item.available ? 'Available' : 'Not Available'}</span>
              {item.bestseller && <span className="rounded bg-red-50 px-2 py-1 text-[var(--primary)]">Bestseller</span>}
            </div>
            <div className="mt-3 flex gap-2">
              <Button variant="secondary" onClick={() => onEdit(item)}>
                Edit
              </Button>
              <Button variant="secondary" onClick={() => onDelete(item._id)}>
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={showCategoryModal} title="Add Category" onClose={() => setShowCategoryModal(false)}>
        <div className="space-y-3">
          <FormInput
            label="Category Name"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
          />
          <Button onClick={addCategory}>Save Category</Button>
        </div>
      </Modal>
    </div>
  )
}
