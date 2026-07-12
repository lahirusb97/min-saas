import { useState, type FormEvent } from 'react'
import { User, Phone, AlignLeft, DollarSign, Banknote, Wallet, Calendar, RotateCcw, Box } from 'lucide-react'
import { useFixDesk } from '../context/FixDeskContext'
import { type JobStatus } from '../types'

export function AccessoriesPage() {
  const { db, addAccJob, showToast } = useFixDesk()

  // --- Controlled Form State ---
  const [customer, setCustomer] = useState('')
  const [phone, setPhone] = useState('')
  const [item, setItem] = useState('') // Item / Accessory Name
  const [details, setDetails] = useState('') // Details / Description
  const [price, setPrice] = useState(0) // Total Amount
  const [advance, setAdvance] = useState(0) // Payment
  const [dueDate, setDueDate] = useState(() => {
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  }) // Due Date
  const [status, setStatus] = useState<JobStatus>('Pending')
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)

  const matchingCustomers = customer.trim().length >= 2
    ? db.customers.filter(c => 
        c.name.toLowerCase().includes(customer.toLowerCase()) ||
        c.phone.includes(customer) ||
        (c.nic && c.nic.toLowerCase().includes(customer.toLowerCase()))
      )
    : []

  function handleSelectCustomer(cust: typeof db.customers[0]) {
    setCustomer(cust.name)
    setPhone(cust.phone)
    setShowSearchDropdown(false)
  }

  // Balance calculation
  const balance = Math.max(0, price - advance)

  // Next Serial Number
  const nextSerialStr = String((db.counters.acc || 0) + 1).padStart(4, '0')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const job = addAccJob({
      customer: customer.trim(),
      phone: phone.trim(),
      item: item.trim(),
      details: details.trim(),
      price: price,
      advance: advance,
      dueDate: dueDate || undefined,
      status: status
    })
    
    handleReset()
    showToast(`Accessory ticket ${job.ticketNo} created`)
  }

  function handleReset() {
    setCustomer('')
    setPhone('')
    setItem('')
    setDetails('')
    setPrice(0)
    setAdvance(0)
    const today = new Date()
    setDueDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`)
    setStatus('Pending')
    setShowSearchDropdown(false)
  }

  return (
    <div className="w-full flex justify-center py-2">
      {/* Centered Input Form Column */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full max-w-[650px]">
        
        {/* Customer Info Card */}
        <div className="panel">
          <div className="flex justify-between items-center border-b pb-3 border-[var(--border)] mb-5">
            <div className="panel-title font-bold text-[14px]">
              Customer & Item Info
            </div>
            <span className="bg-[var(--success-dim)] text-[var(--success)] font-mono text-[11.5px] font-bold px-3 py-1 rounded-full border border-[var(--success)]">
              🎫 Serial: A-{nextSerialStr}
            </span>
          </div>

          <div className="flex flex-col gap-4">
            <div className="repair-field-group" style={{ position: 'relative' }}>
              <User size={18} />
              <input 
                required 
                value={customer} 
                onChange={(e) => {
                  setCustomer(e.target.value)
                  setShowSearchDropdown(true)
                }} 
                onFocus={() => setShowSearchDropdown(true)}
                onBlur={() => setTimeout(() => setShowSearchDropdown(false), 250)}
                placeholder="Person Name" 
                autoComplete="off"
              />

              {showSearchDropdown && matchingCustomers.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-[var(--surface-3)] border border-[var(--border)] rounded-md shadow-lg max-h-60 overflow-y-auto z-50 text-left">
                  {matchingCustomers.map((cust) => (
                    <div
                      key={cust.id}
                      onClick={() => handleSelectCustomer(cust)}
                      className="p-3 hover:bg-[var(--surface-2)] cursor-pointer border-b border-[var(--border)] last:border-b-0 transition-colors"
                    >
                      <div className="font-semibold text-[13px] text-[var(--text)]">{cust.name}</div>
                      <div className="flex gap-3 text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
                        <span>📞 {cust.phone}</span>
                        {cust.nic && <span>🆔 {cust.nic}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="repair-field-group">
              <Phone size={18} />
              <input 
                required 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                placeholder="Mobile Number" 
              />
            </div>

            <div className="repair-field-group">
              <Box size={18} />
              <input 
                required 
                value={item} 
                onChange={(e) => setItem(e.target.value)} 
                placeholder="Item / Accessory" 
              />
            </div>

            <div className="repair-field-group">
              <AlignLeft size={18} style={{ alignSelf: 'flex-start', marginTop: '12px' }} />
              <textarea 
                required 
                value={details} 
                onChange={(e) => setDetails(e.target.value)} 
                placeholder="Description / Details" 
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>
        </div>

        {/* Payment Details Card */}
        <div className="panel">
          <div className="panel-title font-bold text-[14px] border-b pb-3 border-[var(--border)] mb-5">
            Payment Details
          </div>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="repair-field-group">
                <DollarSign size={18} />
                <input 
                  type="number" 
                  min={0}
                  value={price || ''} 
                  onChange={(e) => setPrice(Number(e.target.value))} 
                  placeholder="Total Amount" 
                />
              </div>

              <div className="repair-field-group">
                <Banknote size={18} />
                <input 
                  type="number" 
                  min={0}
                  value={advance || ''} 
                  onChange={(e) => setAdvance(Number(e.target.value))} 
                  placeholder="Payment" 
                />
              </div>
            </div>

            <div className="repair-field-group">
              <Wallet size={18} />
              <input 
                type="number" 
                readOnly 
                value={balance || ''} 
                placeholder="Balance" 
                className="bg-[var(--surface-3)] opacity-90 cursor-not-allowed"
              />
            </div>

            <div className="flex gap-4 items-end flex-wrap md:flex-nowrap">
              <div className="flex-1 flex flex-col gap-1.5 w-full">
                <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider ml-1">Due Date</span>
                <div className="repair-field-group">
                  <Calendar size={18} />
                  <input 
                    type="date" 
                    value={dueDate} 
                    onChange={(e) => setDueDate(e.target.value)} 
                  />
                </div>
              </div>

              <div className="flex gap-2 flex-1.5 w-full">
                <button type="button" onClick={handleReset} className="btn btn-ghost flex-1 justify-center py-3.5" style={{ borderRadius: '12px' }}>
                  <RotateCcw size={15} />
                  Reset
                </button>
                <button type="submit" className="btn btn-dark-green flex-2 justify-center py-3.5" style={{ borderRadius: '12px' }}>
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
