import { useRef, type FormEvent } from 'react'
import { Check } from 'lucide-react'
import { useFixDesk } from '../context/FixDeskContext'

export function SettingsPage() {
  const { db, updateSettings, showToast } = useFixDesk()
  const nameRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)
  const whatsappRef = useRef<HTMLInputElement>(null)
  const addressRef = useRef<HTMLTextAreaElement>(null)
  const currencyRef = useRef<HTMLSelectElement>(null)
  const hoursRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    updateSettings({
      name: nameRef.current!.value.trim(),
      phone: phoneRef.current!.value.trim(),
      whatsapp: whatsappRef.current!.value.trim(),
      address: addressRef.current!.value.trim(),
      currency: currencyRef.current!.value,
      hours: hoursRef.current!.value.trim(),
    })
    showToast('Shop settings saved')
  }

  return (
    <div className="panel" style={{ maxWidth: 640 }}>
      <div className="panel-title" style={{ marginBottom: 16 }}>
        Shop Settings
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="field full">
            <label>Shop Name *</label>
            <input required ref={nameRef} defaultValue={db.settings.name} />
          </div>
          <div className="field">
            <label>Phone Number</label>
            <input ref={phoneRef} defaultValue={db.settings.phone} />
          </div>
          <div className="field">
            <label>WhatsApp Number</label>
            <input ref={whatsappRef} defaultValue={db.settings.whatsapp} />
          </div>
          <div className="field full">
            <label>Address</label>
            <textarea ref={addressRef} defaultValue={db.settings.address} />
          </div>
          <div className="field">
            <label>Currency</label>
            <select ref={currencyRef} defaultValue={db.settings.currency}>
              <option value="Rs.">Rs. (LKR)</option>
              <option value="$">$ (USD)</option>
            </select>
          </div>
          <div className="field">
            <label>Opening Hours</label>
            <input ref={hoursRef} defaultValue={db.settings.hours} placeholder="e.g. 9.00 AM - 8.00 PM" />
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-copper">
            <Check />
            Save Settings
          </button>
        </div>
      </form>
    </div>
  )
}
