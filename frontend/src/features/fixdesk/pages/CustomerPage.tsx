import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { Check, Clock, RotateCcw, Calendar } from 'lucide-react'
import { useFixDesk } from '../context/FixDeskContext'
import { fmt } from '../utils'
import { frameService, type Frame } from '../services/frameService'
import { lensService, type Lens } from '../services/lensService'
import { customerService } from '../services/customerService'
import { visionTestService } from '../services/visionTestService'
import { orderService, type SourceType, type LensSide as OrderLensSide } from '../services/orderService'


const refractionOptions = (() => {
  const options: string[] = []
  for (let val = -24.00; val <= 24.00; val += 0.25) {
    const rounded = Math.round(val * 100) / 100
    let str = ''
    if (rounded > 0) {
      str = `+${rounded.toFixed(2)}`
    } else if (rounded === 0) {
      str = '0.00'
    } else {
      str = rounded.toFixed(2)
    }
    options.push(str)
  }
  return options
})()

interface CustomSelectOption {
  label: string
  value: string
}

interface CustomSelectProps {
  label: string
  value: string
  options: (string | CustomSelectOption)[]
  onChange: (val: string) => void
}

function CustomSelect({ label, value, options, onChange }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const normalizedOptions: CustomSelectOption[] = options.map((opt) => {
    if (typeof opt === 'string') {
      return { label: opt, value: opt }
    }
    return opt
  })

  const filteredOptions = searchQuery.trim()
    ? normalizedOptions.filter((opt) => opt.label.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : normalizedOptions

  const selectedOption = normalizedOptions.find((opt) => opt.value === value)

  return (
    <div className={`field ${label ? 'floating' : ''} relative ${value && label ? 'has-value' : ''}`}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="custom-select-trigger"
      >
        {selectedOption ? selectedOption.label : ' '}
      </div>
      {label && <label>{label}</label>}

      {isOpen && (
        <>
          <div 
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998 }}
            onClick={() => {
              setIsOpen(false)
              setSearchQuery('')
            }}
          />
          <div className="custom-select-dropdown z-50 animate-fade-in" style={{ zIndex: 9999 }}>
            {normalizedOptions.length > 0 && (
              <div className="p-2 border-b border-[var(--border)]">
                <input
                  type="text"
                  placeholder="Type to search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="custom-select-search"
                  autoFocus
                />
              </div>
            )}
            <div className="custom-select-options-list">
              {filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value)
                    setIsOpen(false)
                    setSearchQuery('')
                  }}
                  className={`custom-select-option ${value === opt.value ? 'selected' : ''}`}
                >
                  {opt.label}
                </div>
              ))}
              {filteredOptions.length === 0 && (
                <div className="p-3 text-center text-xs text-[var(--text-faint)]">
                  No matches found
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export function CustomerPage() {
  const { db, addPrescription, editingJob, setEditingJob, updatePrescription, showToast } = useFixDesk()
  const navigate = useNavigate()

  // --- Form State ---
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [nic, setNic] = useState('')
  const [address, setAddress] = useState('')
  const [customerNote, setCustomerNote] = useState('')
  const [dob, setDob] = useState('')
  const [age, setAge] = useState<number | ''>('')
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [dueDate, setDueDate] = useState(() => {
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  })

  // Vision / Eye Details Toggle
  const [hasVisionDetails, setHasVisionDetails] = useState(true)
  const [selectionTab, setSelectionTab] = useState<'frame' | 'lens'>('frame')

  // Vision Refraction Details
  const [rSph, setRSph] = useState('0.00')
  const [rCyl, setRCyl] = useState('0.00')
  const [rAxis, setRAxis] = useState('')
  const [rAdd, setRAdd] = useState('0.00')
  const [rVa, setRVa] = useState('')

  const [lSph, setLSph] = useState('0.00')
  const [lCyl, setLCyl] = useState('0.00')
  const [lAxis, setLAxis] = useState('')
  const [lAdd, setLAdd] = useState('0.00')
  const [lVa, setLVa] = useState('')

  // Shared details
  const [pd, setPd] = useState('')
  const [height, setHeight] = useState('')

  // Frame Selection
  const [frameType, setFrameType] = useState<'inventory' | 'manual'>('inventory')
  const [frameInventoryId, setFrameInventoryId] = useState('')
  const [manualFrameBrand, setManualFrameBrand] = useState('')
  const [manualFrameCode, setManualFrameCode] = useState('')
  const [manualFrameColor, setManualFrameColor] = useState('')
  const [manualFramePrice, setManualFramePrice] = useState(0)

  // Lens Selection
  const [lensType, setLensType] = useState<'inventory' | 'manual'>('inventory')
  const [lensSide, setLensSide] = useState<'Both' | 'Right' | 'Left'>('Both')
  const [lensInventoryId, setLensInventoryId] = useState('')
  const [manualLensFactory, setManualLensFactory] = useState('')
  const [manualLensTypeName, setManualLensTypeName] = useState('')
  const [manualLensCoating, setManualLensCoating] = useState('')
  const [manualLensPrice, setManualLensPrice] = useState(0) // price per lens

  const [prescriptionNote, setPrescriptionNote] = useState('')

  // Payment Details
  const [discount, setDiscount] = useState(0)
  const [payment, setPayment] = useState(0)

  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Live inventory pulled from the backend (Frames & Lenses services)
  const [frameStocks, setFrameStocks] = useState<Frame[]>([])
  const [lensList, setLensList] = useState<Lens[]>([])

  useEffect(() => {
    frameService.list().then(setFrameStocks).catch(() => {})
    lensService.list().then(setLensList).catch(() => {})
  }, [])

  // --- Dynamic Calculations ---



  // Age calculation from DOB (cross-browser robust parsing)
  useEffect(() => {
    if (!dob) {
      setAge('')
      return
    }
    
    try {
      // Split YYYY-MM-DD format safely
      const parts = dob.split('-')
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10)
        const month = parseInt(parts[1], 10) - 1 // 0-indexed in JS Date
        const day = parseInt(parts[2], 10)
        
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
          const birthDate = new Date(year, month, day)
          const today = new Date()
          
          let calculatedAge = today.getFullYear() - birthDate.getFullYear()
          const m = today.getMonth() - birthDate.getMonth()
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            calculatedAge--
          }
          
          setAge(calculatedAge >= 0 ? calculatedAge : '')
          return
        }
      }
      
      // Fallback
      const birthDate = new Date(dob)
      if (!isNaN(birthDate.getTime())) {
        const today = new Date()
        let calculatedAge = today.getFullYear() - birthDate.getFullYear()
        const m = today.getMonth() - birthDate.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          calculatedAge--
        }
        setAge(calculatedAge >= 0 ? calculatedAge : '')
      } else {
        setAge('')
      }
    } catch (e) {
      console.error("Error calculating age:", e)
      setAge('')
    }
  }, [dob])

  // Customer Search & Auto-fill logic
  const matchingCustomers = name.trim().length >= 2
    ? db.customers.filter(c => 
        c.name.toLowerCase().includes(name.toLowerCase()) ||
        c.phone.includes(name) ||
        (c.nic && c.nic.toLowerCase().includes(name.toLowerCase()))
      )
    : []

  function handleSelectCustomer(cust: typeof db.customers[0]) {
    setName(cust.name)
    setPhone(cust.phone)
    setNic(cust.nic || '')
    setAddress(cust.address || '')
    
    // Look up latest prescription for DOB & other info
    const latestPres = db.prescriptions?.find(p => p.phone === cust.phone)
    if (latestPres) {
      setDob(latestPres.dob || '')
      setDueDate(latestPres.dueDate || (() => {
        const today = new Date()
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      })())
      setAddress(latestPres.address || cust.address || '')
      setCustomerNote(latestPres.note || '')
    } else {
      setDob('')
      const today = new Date()
      setDueDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`)
    }
    setShowSearchDropdown(false)
  }

  // Frames & Lenses come from the backend (frameService / lensService)
  const frameItems = frameStocks
  const lensItems = lensList

  // Selected frame details
  let selectedFrameBrand = ''
  let selectedFrameCode = ''
  let selectedFrameColor = ''
  let selectedFramePrice = 0

  if (frameType === 'inventory') {
    const item = frameItems.find((f) => f.id === Number(frameInventoryId))
    if (item) {
      selectedFramePrice = item.price
      selectedFrameBrand = item.brand
      selectedFrameCode = item.modelNumber
      selectedFrameColor = item.color || ''
    }
  } else {
    selectedFrameBrand = manualFrameBrand
    selectedFrameCode = manualFrameCode
    selectedFrameColor = manualFrameColor
    selectedFramePrice = manualFramePrice
  }

  // Selected lens details
  let selectedLensFactory = ''
  let selectedLensType = ''
  let selectedLensCoating = ''
  let selectedLensPricePerUnit = 0

  if (lensType === 'inventory') {
    const item = lensItems.find((l) => l.id === Number(lensInventoryId))
    if (item) {
      selectedLensPricePerUnit = item.price
      selectedLensFactory = item.factory || ''
      selectedLensType = item.type || ''
      selectedLensCoating = item.coating || ''
    }
  } else {
    selectedLensFactory = manualLensFactory
    selectedLensType = manualLensTypeName
    selectedLensCoating = manualLensCoating
    selectedLensPricePerUnit = manualLensPrice
  }

  // Invoice calculations
  const totalFramePrice = selectedFramePrice
  const rightLensPrice = lensSide === 'Both' || lensSide === 'Right' ? selectedLensPricePerUnit : 0
  const leftLensPrice = lensSide === 'Both' || lensSide === 'Left' ? selectedLensPricePerUnit : 0
  const totalLensPrice = rightLensPrice + leftLensPrice
  const total = totalFramePrice + totalLensPrice
  const balance = Math.max(0, total - discount - payment)

  // Next Serial Number / Editing Indicator
  const isEditing = editingJob && editingJob.type === 'Order'
  const nextSerialStr = String((db.counters.prescription || 6) + 1).padStart(4, '0')
  const editingItem = isEditing ? db.prescriptions?.find(p => p.id === editingJob.id) : null

  const [prevEditingJob, setPrevEditingJob] = useState<{ type: string, id: number } | null>(null)

  // Load editing item if exists
  useEffect(() => {
    if (editingJob && editingJob.type === 'Order') {
      const job = db.prescriptions?.find(p => p.id === editingJob.id)
      if (job) {
        setName(job.name)
        setPhone(job.phone)
        setNic(job.nic || '')
        setAddress(job.address || '')
        setCustomerNote(job.note || '')
        setDob(job.dob || '')
        setAge(job.age || '')
        setHasVisionDetails(job.hasVisionDetails)
        setRSph(job.rightEye?.sph || '0.00')
        setRCyl(job.rightEye?.cyl || '0.00')
        setRAxis(job.rightEye?.axis || '')
        setRAdd(job.rightEye?.add || '0.00')
        setRVa(job.rightEye?.va || '')
        setLSph(job.leftEye?.sph || '0.00')
        setLCyl(job.leftEye?.cyl || '0.00')
        setLAxis(job.leftEye?.axis || '')
        setLAdd(job.leftEye?.add || '0.00')
        setLVa(job.leftEye?.va || '')
        setPd(job.pd || '')
        setHeight(job.height || '')
        
        setFrameType(job.frameType)
        if (job.frameType === 'manual') {
          setManualFrameBrand(job.frameBrand || '')
          setManualFrameCode(job.frameCode || '')
          setManualFrameColor(job.frameColor || '')
          setManualFramePrice(job.framePrice || 0)
        } else {
          const found = frameItems.find(f => f.brand === job.frameBrand && f.modelNumber === job.frameCode)
          if (found) {
            setFrameInventoryId(String(found.id))
          } else {
            setManualFrameBrand(job.frameBrand || '')
            setManualFrameCode(job.frameCode || '')
            setManualFrameColor(job.frameColor || '')
            setManualFramePrice(job.framePrice || 0)
            setFrameType('manual')
          }
        }

        setLensType(job.lensType)
        setLensSide(job.lensSide || 'Both')
        if (job.lensType === 'manual') {
          setManualLensFactory(job.lensFactory || '')
          setManualLensTypeName(job.lensTypeName || '')
          setManualLensCoating(job.lensCoating || '')
          setManualLensPrice(job.lensPrice || 0)
        } else {
          const found = lensItems.find(l => l.factory === job.lensFactory && l.type === job.lensTypeName)
          if (found) {
            setLensInventoryId(String(found.id))
          } else {
            setManualLensFactory(job.lensFactory || '')
            setManualLensTypeName(job.lensTypeName || '')
            setManualLensCoating(job.lensCoating || '')
            setManualLensPrice(job.lensPrice || 0)
            setLensType('manual')
          }
        }

        setPrescriptionNote(job.prescriptionNote || '')
        setDiscount(job.discount || 0)
        setPayment(job.payment || 0)
        setDueDate(job.dueDate || '')
        setPrevEditingJob(editingJob)
      }
    } else if (!editingJob && prevEditingJob) {
      handleReset()
      setPrevEditingJob(null)
    }
  }, [editingJob, db.prescriptions, prevEditingJob])

  // --- Handlers ---
  function handleReset() {
    setName('')
    setPhone('')
    setNic('')
    setAddress('')
    setCustomerNote('')
    setDob('')
    setAge('')
    setHasVisionDetails(true)
    setShowSearchDropdown(false)
    setRSph('0.00')
    setRCyl('0.00')
    setRAxis('')
    setRAdd('0.00')
    setRVa('')
    setLSph('0.00')
    setLCyl('0.00')
    setLAxis('')
    setLAdd('0.00')
    setLVa('')
    setPd('')
    setHeight('')
    setFrameType('inventory')
    setFrameInventoryId('')
    setManualFrameBrand('')
    setManualFrameCode('')
    setManualFrameColor('')
    setManualFramePrice(0)
    setLensType('inventory')
    setLensSide('Both')
    setLensInventoryId('')
    setManualLensFactory('')
    setManualLensTypeName('')
    setManualLensCoating('')
    setManualLensPrice(0)
    setPrescriptionNote('')
    setSelectionTab('frame')
    setDiscount(0)
    setPayment(0)
    const today = new Date()
    setDueDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`)
    if (isEditing) {
      setEditingJob(null)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (!name.trim() || !phone.trim()) {
      showToast('Name and Phone Number are required')
      return
    }

    setSubmitError(null)
    setSaving(true)
    try {
      // 1. Register / update the patient record in the backend
      const customer = await customerService.upsert({
        name: name.trim(),
        phone: phone.trim(),
        nic: nic.trim(),
        address: address.trim(),
        dob: dob || undefined,
        note: customerNote.trim(),
      })

      // 2. Store this visit's eye test (both sides vision, PD/height, refraction remark, medical remarks)
      let visionTestId: number | undefined
      if (hasVisionDetails) {
        const visionTest = await visionTestService.create({
          customerId: customer.id,
          hasVisionDetails,
          rSph, rCyl, rAxis, rAdd, rVa,
          lSph, lCyl, lAxis, lAdd, lVa,
          pd, height,
        })
        visionTestId = visionTest.id
      }

      // 3. Create/Update the invoice, linked to the frame (frames GET) and lens (lenses GET) endpoints
      const orderPayload = {
        customerId: customer.id,
        visionTestId,
        frameSourceType: frameType as SourceType,
        frameStockId: frameType === 'inventory' && frameInventoryId ? Number(frameInventoryId) : undefined,
        frameBrand: selectedFrameBrand,
        frameCode: selectedFrameCode,
        frameColor: selectedFrameColor,
        framePrice: selectedFramePrice,
        lensSourceType: lensType as SourceType,
        lensId: lensType === 'inventory' && lensInventoryId ? Number(lensInventoryId) : undefined,
        lensSide: lensSide as OrderLensSide,
        lensFactory: selectedLensFactory,
        lensTypeName: selectedLensType,
        lensCoating: selectedLensCoating,
        lensPrice: selectedLensPricePerUnit,
        prescriptionNote: prescriptionNote.trim(),
        discount,
        payment,
        dueDate,
      }

      const backendOrderId = isEditing && editingItem?.backendOrderId
        ? (await orderService.update(editingItem.backendOrderId, orderPayload)).id
        : (await orderService.create(orderPayload)).id

      // 4. Mirror into the local job list so Search/Accounts pages keep working
      const localInput = {
        name: name.trim(),
        phone: phone.trim(),
        nic: nic.trim(),
        address: address.trim(),
        note: customerNote.trim(),
        dob,
        age: Number(age || 0),

        hasVisionDetails,
        rightEye: { sph: rSph, cyl: rCyl, axis: rAxis, add: rAdd, va: rVa },
        leftEye: { sph: lSph, cyl: lCyl, axis: lAxis, add: lAdd, va: lVa },
        pd,
        height,

        frameType,
        frameBrand: selectedFrameBrand,
        frameCode: selectedFrameCode,
        frameColor: selectedFrameColor,
        framePrice: selectedFramePrice,

        lensType,
        lensSide,
        lensFactory: selectedLensFactory,
        lensTypeName: selectedLensType,
        lensCoating: selectedLensCoating,
        lensPrice: selectedLensPricePerUnit,

        prescriptionNote: prescriptionNote.trim(),

        total,
        discount,
        payment,
        balance,
        dueDate,

        backendOrderId,
        backendCustomerId: customer.id,
      }

      if (isEditing) {
        updatePrescription(editingJob.id, localInput)
        setEditingJob(null)
        showToast('Order updated successfully!')
        navigate('/dashboard/search')
      } else {
        addPrescription(localInput)
        showToast('Order saved successfully!')
      }

      handleReset()
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.message : null
      setSubmitError(Array.isArray(message) ? message.join(', ') : message ?? 'Unable to save this order. Please try again.')
      showToast('Failed to save order to the server')
    } finally {
      setSaving(false)
    }
  }



  return (
    <div className="prescription-module">
      <form onSubmit={handleSubmit} className="grid-2">
        
        {/* LEFT COLUMN: Customer info & Vision details */}
        <div className="panel flex flex-col gap-6">
          <div className="flex justify-between items-center border-b pb-3 border-[var(--border)]">
            <div className="panel-title flex items-center gap-2">
              {isEditing ? 'Edit Customer Order' : 'New Customer Order'}
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[var(--text-muted)] text-[12px] font-mono">
                <Clock size={13} />
                Order
              </span>
              <span className="bg-[var(--success-dim)] text-[var(--success)] font-mono text-[11.5px] font-bold px-3 py-1 rounded-full border border-[var(--success)]">
                {isEditing ? `📝 Invoice: #${editingItem?.serialNo || ''}` : `Serial: ${nextSerialStr}`}
              </span>
            </div>
          </div>

          {/* Personal Details */}
          <div className="form-grid">
            <div className={`field relative floating ${name ? 'has-value' : ''}`}>
              <input 
                required 
                value={name} 
                onChange={(e) => {
                  setName(e.target.value)
                  setShowSearchDropdown(true)
                }} 
                onFocus={() => setShowSearchDropdown(true)}
                onBlur={() => setTimeout(() => setShowSearchDropdown(false), 250)}
                placeholder=" " 
                autoComplete="off"
              />
              <label>Full Name *</label>
              
              {showSearchDropdown && matchingCustomers.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-[var(--surface-3)] border border-[var(--border)] rounded-md shadow-lg max-h-60 overflow-y-auto z-50">
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
            
            <div className={`field floating ${phone ? 'has-value' : ''}`}>
              <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder=" " />
              <label>Phone Number *</label>
            </div>
            
            <div className={`field floating ${nic ? 'has-value' : ''}`}>
              <input value={nic} onChange={(e) => setNic(e.target.value)} placeholder=" " />
              <label>NIC / ID (optional)</label>
            </div>
            
            <div className={`field floating ${address ? 'has-value' : ''}`}>
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder=" " />
              <label>Address</label>
            </div>

            <div className={`field floating ${dob ? 'has-value' : ''}`}>
              <input 
                type="date" 
                value={dob} 
                onChange={(e) => setDob(e.target.value)} 
                placeholder=" " 
              />
              <label>Date of Birth (DOB)</label>
            </div>

            <div className={`field floating ${age !== '' ? 'has-value' : ''}`}>
              <input 
                type="number" 
                readOnly 
                value={age} 
                placeholder=" " 
                className="bg-[var(--surface-3)] opacity-90 cursor-not-allowed"
              />
              <label>Age (Auto-calculated)</label>
            </div>
            
            <div className={`field full floating ${customerNote ? 'has-value' : ''}`}>
              <input value={customerNote} onChange={(e) => setCustomerNote(e.target.value)} placeholder=" " />
              <label>Note / Remarks</label>
            </div>
          </div>

          {/* Vision / Eye Details Toggle */}
          <div className="border border-[var(--border)] rounded-[var(--radius)] p-4 bg-[var(--surface-2)]">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-[13.5px]">Vision / Eye Details</span>
            </div>

            {hasVisionDetails && (
              <div className="flex flex-col gap-4 mt-4 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Right Eye (OD) */}
                  <div className="bg-[var(--surface)] p-4 rounded-lg border border-[var(--border)] relative">
                    <div className="flex items-center gap-2 mb-3 text-[var(--teal)] font-semibold text-[12.5px]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[var(--teal)]" />
                      Right Eye (OD)
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <CustomSelect 
                        label="SPH" 
                        value={rSph} 
                        options={refractionOptions} 
                        onChange={setRSph} 
                      />
                      <CustomSelect 
                        label="CYL" 
                        value={rCyl} 
                        options={refractionOptions} 
                        onChange={setRCyl} 
                      />
                      <div className={`field floating ${rAxis ? 'has-value' : ''}`}>
                        <input value={rAxis} onChange={(e) => setRAxis(e.target.value)} placeholder=" " />
                        <label className="text-[11px]">Axis</label>
                      </div>
                      <CustomSelect 
                        label="VA" 
                        value={rVa} 
                        options={['6/6', '6/12', '6/18', '6/24', '6/36', '6/60', 'CF', 'HM']} 
                        onChange={setRVa} 
                      />
                      <CustomSelect 
                        label="ADD" 
                        value={rAdd} 
                        options={refractionOptions} 
                        onChange={setRAdd} 
                      />
                      <div className="field opacity-0 pointer-events-none"></div>
                    </div>
                  </div>

                  {/* Left Eye (OS) */}
                  <div className="bg-[var(--surface)] p-4 rounded-lg border border-[var(--border)] relative">
                    <div className="flex items-center gap-2 mb-3 text-[var(--copper)] font-semibold text-[12.5px]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[var(--copper)]" />
                      Left Eye (OS)
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <CustomSelect 
                        label="SPH" 
                        value={lSph} 
                        options={refractionOptions} 
                        onChange={setLSph} 
                      />
                      <CustomSelect 
                        label="CYL" 
                        value={lCyl} 
                        options={refractionOptions} 
                        onChange={setLCyl} 
                      />
                      <div className={`field floating ${lAxis ? 'has-value' : ''}`}>
                        <input value={lAxis} onChange={(e) => setLAxis(e.target.value)} placeholder=" " />
                        <label className="text-[11px]">Axis</label>
                      </div>
                      <CustomSelect 
                        label="VA" 
                        value={lVa} 
                        options={['6/6', '6/12', '6/18', '6/24', '6/36', '6/60', 'CF', 'HM']} 
                        onChange={setLVa} 
                      />
                      <CustomSelect 
                        label="ADD" 
                        value={lAdd} 
                        options={refractionOptions} 
                        onChange={setLAdd} 
                      />
                      <div className="field opacity-0 pointer-events-none"></div>
                    </div>
                  </div>
                </div>

                {/* Shared PD & Height Inputs */}
                <div className="flex gap-4 pt-3 border-t border-[var(--border)]">
                  <div className={`field flex-1 floating ${pd ? 'has-value' : ''}`} style={{ margin: 0 }}>
                    <input value={pd} onChange={(e) => setPd(e.target.value)} placeholder=" " />
                    <label className="text-[12px] font-semibold">PD (Pupillary Distance)</label>
                  </div>
                  <div className={`field flex-1 floating ${height ? 'has-value' : ''}`} style={{ margin: 0 }}>
                    <input value={height} onChange={(e) => setHeight(e.target.value)} placeholder=" " />
                    <label className="text-[12px] font-semibold">Height</label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Frame, Lens & Payments */}
        <div className="panel flex flex-col gap-6">
          
          {/* Tabbed Selection Panel */}
          <div className="border border-[var(--border)] rounded-[var(--radius)] bg-[var(--surface)]">
            <div className="flex border-b border-[var(--border)] bg-[var(--surface-2)] rounded-t-[var(--radius)]">
              <button
                type="button"
                className={`flex-1 py-3 text-[13px] font-bold border-b-2 transition-all text-center ${
                  selectionTab === 'frame'
                    ? 'border-[var(--copper)] text-[var(--copper)] bg-[var(--surface)]'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
                onClick={() => setSelectionTab('frame')}
              >
                🕶️ FRAME SELECTION
              </button>
              <button
                type="button"
                className={`flex-1 py-3 text-[13px] font-bold border-b-2 transition-all text-center ${
                  selectionTab === 'lens'
                    ? 'border-[var(--copper)] text-[var(--copper)] bg-[var(--surface)]'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
                onClick={() => setSelectionTab('lens')}
              >
                🔍 LENS SELECTION
              </button>
            </div>

            <div className="p-4">
              {selectionTab === 'frame' ? (
                <div className="flex flex-col gap-3">
                  <div className="flex gap-4 mb-2">
                    <label className="flex items-center gap-2 text-[12.5px] cursor-pointer">
                      <input type="radio" checked={frameType === 'inventory'} onChange={() => setFrameType('inventory')} />
                      Search from Inventory
                    </label>
                    <label className="flex items-center gap-2 text-[12.5px] cursor-pointer">
                      <input type="radio" checked={frameType === 'manual'} onChange={() => setFrameType('manual')} />
                      Manual Custom Frame
                    </label>
                  </div>

                  {frameType === 'inventory' ? (
                    <CustomSelect
                      label="Select Frame from Stock"
                      value={frameInventoryId}
                      options={frameItems.map((f) => ({
                        label: `${f.brand} ${f.modelNumber}${f.color ? ' ' + f.color : ''} - (${fmt(db.settings.currency, f.price)})`,
                        value: String(f.id)
                      }))}
                      onChange={setFrameInventoryId}
                    />
                  ) : (
                    <div className="form-grid">
                      <div className={`field floating ${manualFrameBrand ? 'has-value' : ''}`}>
                        <input value={manualFrameBrand} onChange={(e) => setManualFrameBrand(e.target.value)} placeholder=" " />
                        <label>Brand</label>
                      </div>
                      <div className={`field floating ${manualFrameCode ? 'has-value' : ''}`}>
                        <input value={manualFrameCode} onChange={(e) => setManualFrameCode(e.target.value)} placeholder=" " />
                        <label>Code / Model</label>
                      </div>
                      <div className={`field floating ${manualFrameColor ? 'has-value' : ''}`}>
                        <input value={manualFrameColor} onChange={(e) => setManualFrameColor(e.target.value)} placeholder=" " />
                        <label>Color</label>
                      </div>
                      <div className={`field floating ${manualFramePrice ? 'has-value' : ''}`}>
                        <input type="number" min={0} value={manualFramePrice || ''} onChange={(e) => setManualFramePrice(Number(e.target.value))} placeholder=" " />
                        <label>Price</label>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-[12.5px] cursor-pointer">
                        <input type="radio" checked={lensType === 'inventory'} onChange={() => setLensType('inventory')} />
                        Search from Inventory
                      </label>
                      <label className="flex items-center gap-2 text-[12.5px] cursor-pointer">
                        <input type="radio" checked={lensType === 'manual'} onChange={() => setLensType('manual')} />
                        Manual Custom Lens
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-[12px] font-semibold text-[var(--text-muted)]">Side</label>
                      <div style={{ width: '130px' }}>
                        <CustomSelect
                          label=""
                          value={lensSide}
                          options={[
                            { label: 'Both', value: 'Both' },
                            { label: 'Right Only', value: 'Right' },
                            { label: 'Left Only', value: 'Left' }
                          ]}
                          onChange={(val) => setLensSide(val as any)}
                        />
                      </div>
                    </div>
                  </div>

                  {lensType === 'inventory' ? (
                    <CustomSelect
                      label="Select Lens from Stock"
                      value={lensInventoryId}
                      options={lensItems.map((l) => ({
                        label: `${l.name} - (${fmt(db.settings.currency, l.price)} each)`,
                        value: String(l.id)
                      }))}
                      onChange={setLensInventoryId}
                    />
                  ) : (
                    <div className="form-grid">
                      <div className={`field floating ${manualLensFactory ? 'has-value' : ''}`}>
                        <input value={manualLensFactory} onChange={(e) => setManualLensFactory(e.target.value)} placeholder=" " />
                        <label>Factory / Brand</label>
                      </div>
                      <div className={`field floating ${manualLensTypeName ? 'has-value' : ''}`}>
                        <input value={manualLensTypeName} onChange={(e) => setManualLensTypeName(e.target.value)} placeholder=" " />
                        <label>Lens Type</label>
                      </div>
                      <div className={`field floating ${manualLensCoating ? 'has-value' : ''}`}>
                        <input value={manualLensCoating} onChange={(e) => setManualLensCoating(e.target.value)} placeholder=" " />
                        <label>Coating</label>
                      </div>
                      <div className={`field floating ${manualLensPrice ? 'has-value' : ''}`}>
                        <input type="number" min={0} value={manualLensPrice || ''} onChange={(e) => setManualLensPrice(Number(e.target.value))} placeholder=" " />
                        <label>Price (Per Lens)</label>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Order Notes */}
          <div className={`field floating ${prescriptionNote ? 'has-value' : ''}`}>
            <input value={prescriptionNote} onChange={(e) => setPrescriptionNote(e.target.value)} placeholder=" " />
            <label>Order Note</label>
          </div>

          {/* Invoice Summary Box */}
          <div className="bg-[var(--surface-2)] p-4 rounded-lg border border-[var(--border)] font-mono text-[13px] flex flex-col gap-2 shadow-inner">
            <div className="flex justify-between items-center text-[var(--text-faint)] border-b pb-1 mb-1 font-bold">
              <span>Item Description</span>
              <span>Price ({db.settings.currency})</span>
            </div>
            
            {/* Frame summary */}
            <div className="flex justify-between">
              <span>Frame: {selectedFrameBrand || '--'} / {selectedFrameCode || '--'} / {selectedFrameColor || '--'}</span>
              <span className="font-bold">{totalFramePrice || '0.00'}</span>
            </div>

            {/* Right Lens summary */}
            {rightLensPrice > 0 && (
              <div className="flex justify-between">
                <span>Right Lens: {selectedLensFactory || '--'} / {selectedLensType || '--'} / {selectedLensCoating || '--'}</span>
                <span className="font-bold">{rightLensPrice || '0.00'}</span>
              </div>
            )}

            {/* Left Lens summary */}
            {leftLensPrice > 0 && (
              <div className="flex justify-between">
                <span>Left Lens: {selectedLensFactory || '--'} / {selectedLensType || '--'} / {selectedLensCoating || '--'}</span>
                <span className="font-bold">{leftLensPrice || '0.00'}</span>
              </div>
            )}
          </div>

          {/* Payment Details */}
          <div className="border border-[var(--border)] rounded-[var(--radius)] p-4 bg-[var(--surface)]">
            <div className="font-bold text-[14px] mb-3 text-[var(--text-muted)]">
              💸 Payment Details
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-center">
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-[var(--text-faint)] uppercase">Total</span>
                <span className="text-[20px] font-bold text-[var(--success)]">{fmt(db.settings.currency, total)}</span>
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label className="text-[11px]">Discount</label>
                <input type="number" min={0} value={discount || ''} onChange={(e) => setDiscount(Number(e.target.value))} placeholder="0" />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label className="text-[11px]">Payment</label>
                <input type="number" min={0} value={payment || ''} onChange={(e) => setPayment(Number(e.target.value))} placeholder="0" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-[var(--text-faint)] uppercase">Balance</span>
                <span className="text-[20px] font-bold text-[var(--danger)]">{fmt(db.settings.currency, balance)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 items-end">
            <button type="button" onClick={handleReset} className="btn btn-ghost flex-1 justify-center py-3.5" style={{ minHeight: '44px', borderRadius: '12px' }}>
              <RotateCcw size={15} />
              {isEditing ? 'Cancel' : 'Reset Form'}
            </button>
            
            <div className="flex-1 flex flex-col gap-1.5 relative" style={{ minWidth: '160px' }}>
              <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider ml-1">Due Date</span>
              <div className="repair-field-group">
                <Calendar size={15} />
                <input 
                  type="date" 
                  value={dueDate} 
                  onChange={(e) => setDueDate(e.target.value)} 
                />
              </div>
            </div>

            <button type="submit" disabled={saving} className="btn btn-dark-green flex-[1.5] justify-center py-3.5" style={{ minHeight: '44px', borderRadius: '12px' }}>
              <Check size={16} />
              {saving ? 'Saving...' : isEditing ? 'Update Order' : 'Save Order'}
            </button>
          </div>

          {submitError && (
            <p className="text-sm text-[var(--danger)]" style={{ marginTop: -8 }}>{submitError}</p>
          )}
        </div>
      </form>


    </div>
  )
}
