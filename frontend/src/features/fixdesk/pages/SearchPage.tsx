import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Printer, Trash2, Search, ChevronDown, Check, Coins } from 'lucide-react'
import { useFixDesk } from '../context/FixDeskContext'

export function SearchPage() {
  const { db, updateJobStatus, deleteJob, recordRepayment, setEditingJob, showToast } = useFixDesk()
  const navigate = useNavigate()

  const handleEditClick = (item: any) => {
    const editType = item.type === 'Access.' ? 'Accessories' : (item.type === 'Order' ? 'Order' : 'Repair')
    setEditingJob({ type: editType, id: item.realId })
    showToast(`Loading ${item.type} details to edit...`)
    navigate(item.type === 'Order' ? '/dashboard/customer' : (item.type === 'Repair' ? '/dashboard/repair' : '/dashboard/accessories'))
  }

  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'All' | 'Order' | 'Repair' | 'Access.'>('All')
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Delivered' | 'Cancelled'>('All')
  const [balanceFilter, setBalanceFilter] = useState<'ALL' | 'REMAINING' | 'ZERO'>('ALL')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const statusOptions = [
    { value: 'All', label: 'All Statuses' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Delivered', label: 'Delivered' },
    { value: 'Cancelled', label: 'Cancelled' },
  ] as const

  const balanceOptions = [
    { value: 'ALL', label: 'ALL' },
    { value: 'REMAINING', label: 'Remaining Balance' },
    { value: 'ZERO', label: 'Zero balance' },
  ] as const

  // --- Map and Combine all items into a single list ---
  const prescriptionsUnified = (db.prescriptions || []).map(p => ({
    id: `pres-${p.id}`,
    realId: p.id,
    type: 'Order',
    status: p.status || 'Delivered',
    name: p.name,
    contact: p.phone,
    invoiceNo: `#${p.serialNo}`,
    balance: p.balance,
    total: p.total,
    date: p.createdAt,
    dueDate: p.dueDate || '',
    nic: p.nic || '',
    original: p
  }))

  const repairsUnified = (db.repairJobs || []).map(r => ({
    id: `repair-${r.id}`,
    realId: r.id,
    type: 'Repair',
    status: r.status || 'Pending',
    name: r.customer,
    contact: r.phone,
    invoiceNo: r.ticketNo,
    balance: Math.max(0, r.cost - r.advance),
    total: r.cost,
    date: r.createdAt,
    dueDate: r.dueDate || '',
    nic: '',
    original: r
  }))

  const accessoriesUnified = (db.accJobs || []).map(a => ({
    id: `acc-${a.id}`,
    realId: a.id,
    type: 'Access.',
    status: a.status || 'Pending',
    name: a.customer,
    contact: a.phone,
    invoiceNo: a.ticketNo,
    balance: Math.max(0, a.price - (a.advance || 0)),
    total: a.price,
    date: a.createdAt,
    dueDate: a.dueDate || '',
    nic: '',
    original: a
  }))

  const allItems = [...prescriptionsUnified, ...repairsUnified, ...accessoriesUnified]
    .sort((a, b) => b.date - a.date)

  // --- Filter items based on type, status, balance, and search query ---
  const filteredItems = allItems.filter(item => {
    // 1. Filter by type
    if (typeFilter !== 'All' && item.type !== typeFilter) return false

    // 2. Filter by status
    if (statusFilter !== 'All' && item.status !== statusFilter) return false

    // 3. Filter by balance
    if (balanceFilter === 'REMAINING' && item.balance <= 0) return false
    if (balanceFilter === 'ZERO' && item.balance !== 0) return false

    // 4. Filter by search query
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return (
      item.name.toLowerCase().includes(q) ||
      item.contact.includes(q) ||
      item.invoiceNo.toLowerCase().includes(q) ||
      item.nic.toLowerCase().includes(q)
    )
  })

  // --- Row Select Handlers ---
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredItems.map(item => item.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id])
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id))
    }
  }

  // Helper for soft colors for avatar badges
  const getAvatarColors = (name: string) => {
    const char = name.trim().charAt(0).toUpperCase()
    const code = char.charCodeAt(0) % 5
    const schemes = [
      { bg: 'rgba(79, 209, 197, 0.15)', text: 'var(--teal)' },
      { bg: 'rgba(232, 163, 61, 0.15)', text: 'var(--copper)' },
      { bg: 'rgba(240, 98, 95, 0.15)', text: 'var(--danger)' },
      { bg: 'rgba(107, 203, 119, 0.15)', text: 'var(--success)' },
      { bg: 'rgba(156, 124, 244, 0.15)', text: '#9C7CF4' }
    ]
    return schemes[code] || schemes[0]
  }

  const getStatusClass = (status: string) => {
    if (status === 'Delivered') return 'text-[var(--success)] bg-[var(--success-dim)] border-[var(--success)]'
    if (status === 'Pending') return 'text-[var(--copper)] bg-[var(--copper-dim)]/20 border-[var(--copper)]'
    return 'text-[var(--danger)] bg-[var(--danger-dim)] border-[var(--danger)]'
  }

  const getTypeBadgeClass = (type: string) => {
    if (type === 'Order') return 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/20'
    if (type === 'Repair') return 'text-[var(--teal)] bg-[var(--teal-dim)]/20 border-[var(--teal)]/20'
    return 'text-[#9c7cf4] bg-[#9c7cf4]/10 border-[#9c7cf4]/20'
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const formatDueDate = (dateStr: string) => {
    if (!dateStr) return '--'
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    } catch {
      return dateStr
    }
  }


  const handleDeleteItem = (type: string, realId: number, invoiceNo: string) => {
    if (confirm(`Are you sure you want to delete ${type} order ${invoiceNo}?`)) {
      deleteJob(type as any, realId)
      showToast(`Deleted ${type} order ${invoiceNo}`)
    }
  }

  const handleRepayment = (item: any) => {
    if (item.balance <= 0) {
      showToast("This order is already fully paid!")
      return
    }

    const amountStr = prompt(`Enter repayment amount for ${item.name} (${item.invoiceNo}):\nRemaining Balance: Rs. ${item.balance}`)
    if (amountStr === null) return // cancelled
    
    const amount = parseFloat(amountStr)
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid positive amount!")
      return
    }

    if (amount > item.balance) {
      alert(`Repayment amount cannot exceed the remaining balance of Rs. ${item.balance}!`)
      return
    }

    recordRepayment(item.type as any, item.realId, amount)
    showToast(`Recorded repayment of Rs. ${amount} for ${item.invoiceNo}`)
  }

  return (
    <div className="panel flex flex-col gap-4">
      <div className="flex justify-between items-center flex-wrap gap-4 border-b pb-3 border-[var(--border)]">
        <div className="panel-title font-bold text-[14px]">
          Invoices & Job Orders Search Table
        </div>
        
        {/* Global Search Input */}
        <div className="relative w-full md:w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-faint)] pointer-events-none" />
          <input
            id="dashboardSearchInput"
            type="text"
            className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg py-2 pl-9 pr-4 text-[13px] text-[var(--text)] outline-none focus:border-[var(--copper)] transition-colors"
            placeholder="Search Name, NIC, Contact, Invoice..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>
      </div>

      {/* Filter Options Row */}
      <div className="search-filters-row flex flex-wrap items-end gap-6 bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--border)]">
        {/* Radio Button Type Filters */}
        <div className="flex flex-col gap-1.5 order-type-filter-group">
          <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider ml-0.5">Order Type</span>
          <div className="flex items-center gap-3.5 text-[12.5px] bg-[var(--surface-3)] px-3 py-1.5 rounded-lg border border-[var(--border)]">
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-[var(--copper)] transition-colors">
              <input 
                type="radio" 
                name="typeFilter" 
                checked={typeFilter === 'All'} 
                onChange={() => setTypeFilter('All')} 
                className="accent-[var(--copper)] cursor-pointer"
              />
              All
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-[var(--copper)] transition-colors">
              <input 
                type="radio" 
                name="typeFilter" 
                checked={typeFilter === 'Order'} 
                onChange={() => setTypeFilter('Order')} 
                className="accent-[var(--copper)] cursor-pointer"
              />
              Orders
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-[var(--copper)] transition-colors">
              <input 
                type="radio" 
                name="typeFilter" 
                checked={typeFilter === 'Repair'} 
                onChange={() => setTypeFilter('Repair')} 
                className="accent-[var(--copper)] cursor-pointer"
              />
              Repairs
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-[var(--copper)] transition-colors">
              <input 
                type="radio" 
                name="typeFilter" 
                checked={typeFilter === 'Access.'} 
                onChange={() => setTypeFilter('Access.')} 
                className="accent-[var(--copper)] cursor-pointer"
              />
              Accessories
            </label>
          </div>
        </div>

        {/* Order Status Filter */}
        <CustomDropdownFilter
          label="Order Status"
          value={statusFilter}
          options={statusOptions as any}
          onChange={setStatusFilter as any}
          className="min-w-[140px]"
        />

        {/* Account Balance Filter */}
        <CustomDropdownFilter
          label="Account Balance"
          value={balanceFilter}
          options={balanceOptions as any}
          onChange={setBalanceFilter as any}
          className="min-w-[170px]"
        />
      </div>

      {/* Responsive Table Container (Desktop view) */}
      <div className="search-desktop-table overflow-x-auto w-full">
        <table className="w-full border-collapse text-left text-[12.5px]">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--text-muted)] font-bold text-[11px] uppercase tracking-wider">
              <th className="py-3 px-4 w-10">
                <input
                  type="checkbox"
                  checked={filteredItems.length > 0 && selectedIds.length === filteredItems.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="cursor-pointer accent-[var(--copper)]"
                />
              </th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Contact</th>
              <th className="py-3 px-4">Invoice No</th>
              <th className="py-3 px-4">Balance</th>
              <th className="py-3 px-4">Invoice Total</th>
              <th className="py-3 px-4">Invoice Date</th>
              <th className="py-3 px-4">Delivery Date</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length ? (
              filteredItems.map((item) => {
                const initials = item.name.trim().charAt(0).toUpperCase()
                const avatarColor = getAvatarColors(item.name)
                const isChecked = selectedIds.includes(item.id)

                return (
                  <tr key={item.id} className="border-b border-[var(--border)] hover:bg-[var(--surface-2)]/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => handleSelectRow(item.id, e.target.checked)}
                        className="cursor-pointer accent-[var(--copper)]"
                      />
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={item.status}
                        onChange={(e) => updateJobStatus(item.type as any, item.realId, e.target.value as any)}
                        className={`px-3 py-1.5 rounded-full border text-[11px] font-bold cursor-pointer outline-none transition-all ${getStatusClass(item.status)}`}
                        style={{ appearance: 'none', WebkitAppearance: 'none', textAlign: 'center' }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 font-semibold">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11.5px] font-display flex-shrink-0"
                          style={{ backgroundColor: avatarColor.bg, color: avatarColor.text }}
                        >
                          {initials}
                        </div>
                        <span>{item.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[var(--text-muted)] font-mono">{item.contact}</td>
                    <td className="py-3.5 px-4 font-bold text-[var(--text)] font-mono">{item.invoiceNo}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-md font-bold text-[11px] border ${
                        item.balance > 0
                          ? 'text-[var(--danger)] bg-[var(--danger-dim)]/10 border-[var(--danger)]/30'
                          : 'text-[var(--success)] bg-[var(--success-dim)]/10 border-[var(--success)]/30'
                      }`}>
                        {item.balance}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`font-semibold ${item.balance > 0 ? 'text-[var(--text)]' : 'text-[var(--success)]'}`}>
                        {item.total}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[var(--text-muted)]">{formatDate(item.date)}</td>
                    <td className="py-3.5 px-4 text-[var(--text-muted)]">{formatDueDate(item.dueDate)}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${getTypeBadgeClass(item.type)}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {item.balance > 0 && (
                          <button
                            type="button"
                            className="w-8 h-8 rounded-md flex items-center justify-center border border-[var(--border)] hover:bg-[var(--surface-3)] text-[var(--success)] transition-colors"
                            title="Record Repayment"
                            onClick={() => handleRepayment(item)}
                          >
                            <Coins size={13.5} />
                          </button>
                        )}
                        <button
                          type="button"
                          className="w-8 h-8 rounded-md flex items-center justify-center border border-[var(--border)] hover:bg-[var(--surface-3)] text-[#3b82f6] transition-colors"
                          title="Edit Details"
                          onClick={() => handleEditClick(item)}
                        >
                          <Eye size={13.5} />
                        </button>
                        <button
                          type="button"
                          className="w-8 h-8 rounded-md flex items-center justify-center border border-[var(--border)] hover:bg-[var(--surface-3)] text-[var(--copper)] transition-colors"
                          title="Print Invoice"
                          onClick={() => {
                            showToast(`Printing invoice ${item.invoiceNo}...`)
                            window.print()
                          }}
                        >
                          <Printer size={13.5} />
                        </button>
                        <button
                          type="button"
                          className="w-8 h-8 rounded-md flex items-center justify-center border border-[var(--border)] hover:bg-[var(--surface-3)] text-[var(--danger)] transition-colors"
                          title="Delete Order"
                          onClick={() => handleDeleteItem(item.type, item.realId, item.invoiceNo)}
                        >
                          <Trash2 size={13.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={11} className="py-8 text-center text-[var(--text-faint)]">
                  No orders or invoices match your search query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards Container (Mobile view) */}
      <div className="search-mobile-cards">
        {filteredItems.length ? (
          filteredItems.map((item) => {
            const initials = item.name.trim().charAt(0).toUpperCase()
            const avatarColor = getAvatarColors(item.name)
            const isChecked = selectedIds.includes(item.id)

            return (
              <div key={item.id} className="search-card">
                {/* Header: Checkbox, Type and Status dropdown */}
                <div className="search-card-header">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => handleSelectRow(item.id, e.target.checked)}
                      className="cursor-pointer accent-[var(--copper)]"
                    />
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getTypeBadgeClass(item.type)}`}>
                      {item.type}
                    </span>
                  </div>
                  <select
                    value={item.status}
                    onChange={(e) => updateJobStatus(item.type as any, item.realId, e.target.value as any)}
                    className={`px-3 py-1.5 rounded-full border text-[11px] font-bold cursor-pointer outline-none transition-all ${getStatusClass(item.status)}`}
                    style={{ appearance: 'none', WebkitAppearance: 'none', textAlign: 'center' }}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Body: profile name, contact, order details */}
                <div className="search-card-body">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11.5px] font-display flex-shrink-0"
                      style={{ backgroundColor: avatarColor.bg, color: avatarColor.text }}
                    >
                      {initials}
                    </div>
                    <span className="font-semibold text-[13.5px]">{item.name}</span>
                  </div>

                  <div className="search-card-row">
                    <span className="text-[var(--text-muted)] text-[12px]">Contact:</span>
                    <span className="font-mono text-[var(--text)] text-[12px]">{item.contact}</span>
                  </div>

                  <div className="search-card-row">
                    <span className="text-[var(--text-muted)] text-[12px]">Invoice No:</span>
                    <span className="font-bold text-[var(--text)] font-mono text-[12px]">{item.invoiceNo}</span>
                  </div>

                  <div className="search-card-row">
                    <span className="text-[var(--text-muted)] text-[12px]">Invoice Date:</span>
                    <span className="text-[12px]">{formatDate(item.date)}</span>
                  </div>

                  <div className="search-card-row">
                    <span className="text-[var(--text-muted)] text-[12px]">Delivery Date:</span>
                    <span className="text-[12px]">{formatDueDate(item.dueDate)}</span>
                  </div>

                  <div className="search-card-row">
                    <span className="text-[var(--text-muted)] text-[12px]">Invoice Total:</span>
                    <span className={`font-semibold text-[12px] ${item.balance > 0 ? 'text-[var(--text)]' : 'text-[var(--success)]'}`}>
                      {item.total}
                    </span>
                  </div>

                  <div className="search-card-row">
                    <span className="text-[var(--text-muted)] text-[12px]">Balance Due:</span>
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] border ${
                      item.balance > 0
                        ? 'text-[var(--danger)] bg-[var(--danger-dim)]/10 border-[var(--danger)]/30'
                        : 'text-[var(--success)] bg-[var(--success-dim)]/10 border-[var(--success)]/30'
                    }`}>
                      {item.balance}
                    </span>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="search-card-footer">
                  {item.balance > 0 && (
                    <button
                      type="button"
                      className="w-8 h-8 rounded-md flex items-center justify-center border border-[var(--border)] hover:bg-[var(--surface-3)] text-[var(--success)] transition-colors"
                      title="Record Repayment"
                      onClick={() => handleRepayment(item)}
                    >
                      <Coins size={13.5} />
                    </button>
                  )}
                  <button
                    type="button"
                    className="w-8 h-8 rounded-md flex items-center justify-center border border-[var(--border)] hover:bg-[var(--surface-3)] text-[#3b82f6] transition-colors"
                    title="Edit Details"
                    onClick={() => handleEditClick(item)}
                  >
                    <Eye size={13.5} />
                  </button>
                  <button
                    type="button"
                    className="w-8 h-8 rounded-md flex items-center justify-center border border-[var(--border)] hover:bg-[var(--surface-3)] text-[var(--copper)] transition-colors"
                    title="Print Invoice"
                    onClick={() => {
                      showToast(`Printing invoice ${item.invoiceNo}...`)
                      window.print()
                    }}
                  >
                    <Printer size={13.5} />
                  </button>
                  <button
                    type="button"
                    className="w-8 h-8 rounded-md flex items-center justify-center border border-[var(--border)] hover:bg-[var(--surface-3)] text-[var(--danger)] transition-colors"
                    title="Delete Order"
                    onClick={() => handleDeleteItem(item.type, item.realId, item.invoiceNo)}
                  >
                    <Trash2 size={13.5} />
                  </button>
                </div>
              </div>
            )
          })
        ) : (
          <div className="py-8 text-center text-[var(--text-faint)] bg-[var(--surface)] border border-[var(--border)] rounded-xl">
            No orders or invoices match your search query.
          </div>
        )}
      </div>
    </div>
  )
}

// Premium Custom Select Dropdown
function CustomDropdownFilter<T extends string>({
  label,
  value,
  options,
  onChange,
  className = ''
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (val: T) => void
  className?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const activeOption = options.find(opt => opt.value === value)

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return
    const handleOutsideClick = () => setIsOpen(false)
    window.addEventListener('click', handleOutsideClick)
    return () => window.removeEventListener('click', handleOutsideClick)
  }, [isOpen])

  return (
    <div className={`relative flex flex-col gap-1.5 ${className}`} onClick={e => e.stopPropagation()}>
      <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider ml-0.5">{label}</span>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between bg-[var(--surface-3)] hover:bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-[12.5px] text-[var(--text)] font-medium outline-none focus:border-[var(--copper)] transition-all text-left"
      >
        <span>{activeOption ? activeOption.label : value}</span>
        <ChevronDown size={14} className={`text-[var(--text-muted)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 z-50 min-w-full bg-[var(--surface-3)] border border-[var(--border)] rounded-lg shadow-xl p-1 animate-in fade-in slide-in-from-top-1 duration-150">
          {options.map((opt) => {
            const isSelected = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center justify-between text-left px-2.5 py-1.5 rounded-md text-[12.5px] transition-colors ${
                  isSelected 
                    ? 'bg-[var(--copper)]/10 text-[var(--copper)] font-semibold' 
                    : 'text-[var(--text)] hover:bg-[var(--surface-2)]'
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && <Check size={13} className="text-[var(--copper)]" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
