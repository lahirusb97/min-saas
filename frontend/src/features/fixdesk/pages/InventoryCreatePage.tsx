import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { Check } from 'lucide-react'
import { useFixDesk } from '../context/FixDeskContext'
import { useInventoryGroup } from '../hooks/useInventoryGroup'
import { FRAME_TYPES } from '../types'
import { frameService } from '../services/frameService'

export function InventoryCreatePage() {
  const group = useInventoryGroup()
  const { addInventoryItem, showToast } = useFixDesk()
  const navigate = useNavigate()
  const formRef = useRef<HTMLFormElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const categoryRef = useRef<HTMLSelectElement>(null)
  const qtyRef = useRef<HTMLInputElement>(null)
  const priceRef = useRef<HTMLInputElement>(null)
  const thresholdRef = useRef<HTMLInputElement>(null)
  const brandRef = useRef<HTMLInputElement>(null)
  const modelNumberRef = useRef<HTMLInputElement>(null)
  const colorRef = useRef<HTMLInputElement>(null)
  const frameTypeRef = useRef<HTMLSelectElement>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [brandOptions, setBrandOptions] = useState<string[]>([])
  const [modelOptions, setModelOptions] = useState<string[]>([])
  const [colorOptions, setColorOptions] = useState<string[]>([])

  const isFrames = group?.slug === 'frames'

  useEffect(() => {
    if (!isFrames) return
    frameService.listBrands().then(setBrandOptions)
    frameService.listModels().then(setModelOptions)
    frameService.listColors().then(setColorOptions)
  }, [isFrames])

  if (!group) {
    return <Navigate to="/dashboard/inventory" replace />
  }

  const categories = group.categories as readonly string[]
  const label = group.label
  const slug = group.slug

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (isFrames) {
      setSaving(true)
      try {
        await frameService.create({
          brand: brandRef.current!.value.trim(),
          modelNumber: modelNumberRef.current!.value.trim(),
          color: colorRef.current!.value.trim(),
          frameType: frameTypeRef.current!.value,
          qty: Number(qtyRef.current!.value || 0),
          price: Number(priceRef.current!.value || 0),
        })
        formRef.current?.reset()
        showToast(`Item added to ${label}`)
        navigate(`/dashboard/inventory/${slug}/list`)
      } catch (err) {
        const message = isAxiosError(err) ? err.response?.data?.message : null
        setError(message ?? 'Unable to save this frame. Please try again.')
      } finally {
        setSaving(false)
      }
      return
    }

    addInventoryItem({
      name: nameRef.current!.value.trim(),
      category: categoryRef.current ? categoryRef.current.value : categories[0],
      qty: Number(qtyRef.current!.value || 0),
      price: Number(priceRef.current!.value || 0),
      threshold: Number(thresholdRef.current!.value || 5),
    })
    formRef.current?.reset()
    if (thresholdRef.current) thresholdRef.current.value = '5'
    showToast(`Item added to ${label}`)
    navigate(`/dashboard/inventory/${slug}/list`)
  }

  return (
    <div className="panel">
      <div className="panel-title" style={{ marginBottom: 16 }}>
        Add {label} Item
      </div>
      <form ref={formRef} onSubmit={handleSubmit}>
        <div className="form-grid">
          {!isFrames && (
            <div className="field">
              <label>Item Name *</label>
              <input required ref={nameRef} placeholder={`e.g. ${label} item`} />
            </div>
          )}
          {categories.length > 1 && (
            <div className="field">
              <label>Category</label>
              <select ref={categoryRef} defaultValue={categories[0]}>
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          )}
          {isFrames && (
            <>
              <div className="field">
                <label>Brand</label>
                <input ref={brandRef} list="brand-options" placeholder="e.g. Ray-Ban" autoComplete="off" />
                <datalist id="brand-options">
                  {brandOptions.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>
              <div className="field">
                <label>Model Number</label>
                <input ref={modelNumberRef} list="model-options" placeholder="e.g. RB5024" autoComplete="off" />
                <datalist id="model-options">
                  {modelOptions.map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </div>
              <div className="field">
                <label>Color</label>
                <input ref={colorRef} list="color-options" placeholder="e.g. Black" autoComplete="off" />
                <datalist id="color-options">
                  {colorOptions.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div className="field">
                <label>Type</label>
                <select ref={frameTypeRef} defaultValue={FRAME_TYPES[0]}>
                  {FRAME_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
            </>
          )}
          <div className="field">
            <label>Quantity *</label>
            <input required type="number" min={0} ref={qtyRef} placeholder="0" />
          </div>
          <div className="field">
            <label>Unit Price (Rs.) *</label>
            <input required type="number" min={0} ref={priceRef} placeholder="0" />
          </div>
          {!isFrames && (
            <div className="field">
              <label>Low Stock Alert Below</label>
              <input type="number" min={0} ref={thresholdRef} defaultValue={5} />
            </div>
          )}
        </div>
        {error && <p className="text-sm text-destructive" style={{ marginTop: 12 }}>{error}</p>}
        <div className="form-actions">
          <button type="submit" className="btn btn-copper" disabled={saving}>
            <Check />
            {saving ? 'Saving...' : 'Add to Inventory'}
          </button>
          <button type="reset" className="btn btn-ghost" disabled={saving}>
            Clear
          </button>
        </div>
      </form>
    </div>
  )
}
