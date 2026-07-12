import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { Check } from 'lucide-react'
import { useFixDesk } from '../context/FixDeskContext'
import { useInventoryGroup } from '../hooks/useInventoryGroup'
import { FRAME_TYPES, LENS_TYPES, LENS_COATINGS } from '../types'
import { frameService } from '../services/frameService'
import { lensService } from '../services/lensService'
import { accessoryService } from '../services/accessoryService'

/** Free-text input with a filtered dropdown of existing values, so users can quickly reuse an existing brand or add a new one. */
function AutocompleteInput({
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  value: string
  onChange: (val: string) => void
  options: string[]
  placeholder?: string
  disabled?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)

  const filtered = value.trim()
    ? options.filter((opt) => opt.toLowerCase().includes(value.trim().toLowerCase()))
    : options

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        placeholder={placeholder}
        autoComplete="off"
        disabled={disabled}
      />
      {isOpen && filtered.length > 0 && (
        <div className="custom-select-dropdown z-50 animate-fade-in" style={{ zIndex: 9999 }}>
          <div className="custom-select-options-list">
            {filtered.map((opt) => (
              <div
                key={opt}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(opt)
                  setIsOpen(false)
                }}
                className={`custom-select-option ${opt === value ? 'selected' : ''}`}
              >
                {opt}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

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
  const [brand, setBrand] = useState('')
  const [modelNumber, setModelNumber] = useState('')
  const [color, setColor] = useState('')
  const frameTypeRef = useRef<HTMLSelectElement>(null)
  const lensTypeRef = useRef<HTMLSelectElement>(null)
  const lensCoatingRef = useRef<HTMLSelectElement>(null)
  const lensFactoryRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [brandOptions, setBrandOptions] = useState<string[]>([])
  const [modelOptions, setModelOptions] = useState<string[]>([])
  const [colorOptions, setColorOptions] = useState<string[]>([])
  const [factoryOptions, setFactoryOptions] = useState<string[]>([])

  const isFrames = group?.slug === 'frames'
  const isLenses = group?.slug === 'lenses'
  const isAccessories = group?.slug === 'accessories'

  useEffect(() => {
    if (!isFrames) return
    frameService.listBrands().then(setBrandOptions)
    frameService.listColors().then(setColorOptions)
  }, [isFrames])

  // Model numbers belong to a brand: only suggest models already recorded under the brand being typed.
  useEffect(() => {
    if (!isFrames || !brand.trim()) {
      setModelOptions([])
      return
    }
    const timeout = setTimeout(() => {
      frameService.listModels(brand).then(setModelOptions)
    }, 200)
    return () => clearTimeout(timeout)
  }, [isFrames, brand])

  useEffect(() => {
    if (!isLenses) return
    lensService.listFactories().then(setFactoryOptions)
  }, [isLenses])

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
          brand: brand.trim(),
          modelNumber: modelNumber.trim(),
          color: color.trim(),
          frameType: frameTypeRef.current!.value,
          qty: Number(qtyRef.current!.value || 0),
          price: Number(priceRef.current!.value || 0),
        })
        formRef.current?.reset()
        setBrand('')
        setModelNumber('')
        setColor('')
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

    if (isAccessories) {
      setSaving(true)
      try {
        await accessoryService.create({
          name: nameRef.current!.value.trim(),
          qty: Number(qtyRef.current!.value || 0),
          price: Number(priceRef.current!.value || 0),
        })
        formRef.current?.reset()
        showToast(`Item added to ${label}`)
        navigate(`/dashboard/inventory/${slug}/list`)
      } catch (err) {
        const message = isAxiosError(err) ? err.response?.data?.message : null
        setError(message ?? 'Unable to save this accessory. Please try again.')
      } finally {
        setSaving(false)
      }
      return
    }

    if (isLenses) {
      setSaving(true)
      try {
        await lensService.create({
          name: nameRef.current!.value.trim(),
          type: lensTypeRef.current!.value,
          coating: lensCoatingRef.current!.value,
          factory: lensFactoryRef.current!.value.trim(),
          price: Number(priceRef.current!.value || 0),
        })
        formRef.current?.reset()
        showToast(`Item added to ${label}`)
        navigate(`/dashboard/inventory/${slug}/list`)
      } catch (err) {
        const message = isAxiosError(err) ? err.response?.data?.message : null
        setError(message ?? 'Unable to save this lens. Please try again.')
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
          {categories.length > 1 && !isAccessories && (
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
                <AutocompleteInput value={brand} onChange={setBrand} options={brandOptions} placeholder="e.g. Ray-Ban" />
              </div>
              <div className="field">
                <label>Model Number</label>
                <AutocompleteInput
                  value={modelNumber}
                  onChange={setModelNumber}
                  options={modelOptions}
                  placeholder={brand.trim() ? 'e.g. RB5024' : 'Enter a brand first'}
                  disabled={!brand.trim()}
                />
              </div>
              <div className="field">
                <label>Color</label>
                <AutocompleteInput value={color} onChange={setColor} options={colorOptions} placeholder="e.g. Black" />
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
          {isLenses && (
            <>
              <div className="field">
                <label>Type</label>
                <select ref={lensTypeRef} defaultValue={LENS_TYPES[0]}>
                  {LENS_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Coating</label>
                <select ref={lensCoatingRef} defaultValue={LENS_COATINGS[0]}>
                  {LENS_COATINGS.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Factory Name</label>
                <input ref={lensFactoryRef} list="factory-options" placeholder="e.g. Essilor" autoComplete="off" />
                <datalist id="factory-options">
                  {factoryOptions.map((f) => (
                    <option key={f} value={f} />
                  ))}
                </datalist>
              </div>
            </>
          )}
          {!isLenses && (
            <div className="field">
              <label>Quantity *</label>
              <input required type="number" min={0} ref={qtyRef} placeholder="0" />
            </div>
          )}
          <div className="field">
            <label>Unit Price (Rs.) *</label>
            <input required type="number" min={0} ref={priceRef} placeholder="0" />
          </div>
          {!isFrames && !isAccessories && !isLenses && (
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
