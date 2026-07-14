import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Printer, Trash2, Search, ChevronDown, Check, Coins } from 'lucide-react'
import { useFixDesk } from '../context/FixDeskContext'
import { orderService } from '../services/orderService'
import { fmt } from '../utils'

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
  const [repaymentModalItem, setRepaymentModalItem] = useState<any | null>(null)
  const [repaymentAmount, setRepaymentAmount] = useState<string>('')
  const [repaymentError, setRepaymentError] = useState<string | null>(null)

  const [printModalItem, setPrintModalItem] = useState<any | null>(null)
  const [paperSize, setPaperSize] = useState<'roll' | 'a5' | 'a4'>('roll')

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


  const handleStatusChange = async (item: any, newStatus: any) => {
    updateJobStatus(item.type === 'Order' ? 'Prescr.' : item.type, item.realId, newStatus)
    
    if (item.type === 'Order' && item.original?.backendOrderId) {
      try {
        await orderService.update(item.original.backendOrderId, { status: newStatus })
      } catch (err) {
        console.error('Failed to update status on server:', err)
      }
    }
  }

  const handleDeleteItem = async (item: any) => {
    if (confirm(`Are you sure you want to delete ${item.type} order ${item.invoiceNo}?`)) {
      deleteJob(item.type === 'Order' ? 'Prescr.' : item.type, item.realId)
      
      if (item.type === 'Order' && item.original?.backendOrderId) {
        try {
          await orderService.remove(item.original.backendOrderId)
        } catch (err) {
          console.error('Failed to delete order on server:', err)
        }
      }
      showToast(`Deleted ${item.type} order ${item.invoiceNo}`)
    }
  }

  const handleRepaymentClick = (item: any) => {
    if (item.balance <= 0) {
      showToast("This order is already fully paid!")
      return
    }
    setRepaymentModalItem(item)
    setRepaymentAmount('')
    setRepaymentError(null)
  }

  const handleConfirmRepayment = async () => {
    if (!repaymentModalItem) return
    
    const amount = parseFloat(repaymentAmount)
    if (isNaN(amount) || amount <= 0) {
      setRepaymentError("Please enter a valid positive amount.")
      return
    }

    if (amount > repaymentModalItem.balance) {
      setRepaymentError(`Amount cannot exceed the remaining balance of Rs. ${repaymentModalItem.balance}.`)
      return
    }

    setRepaymentError(null)
    const item = repaymentModalItem

    try {
      recordRepayment(item.type === 'Order' ? 'Prescr.' : item.type, item.realId, amount)

      if (item.type === 'Order' && item.original?.backendOrderId) {
        const nextPayment = (item.original.payment || 0) + amount
        await orderService.update(item.original.backendOrderId, { payment: nextPayment })
      }
      
      showToast(`Recorded repayment of Rs. ${amount} for ${item.invoiceNo}`)
      setRepaymentModalItem(null)
    } catch (err) {
      console.error('Failed to record repayment on server:', err)
      setRepaymentError("Failed to record payment on the server.")
    }
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
                      <StatusDropdown
                        value={item.status as any}
                        onChange={(newStatus) => handleStatusChange(item, newStatus)}
                      />
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
                            onClick={() => handleRepaymentClick(item)}
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
                          onClick={() => setPrintModalItem(item)}
                        >
                          <Printer size={13.5} />
                        </button>
                        <button
                          type="button"
                          className="w-8 h-8 rounded-md flex items-center justify-center border border-[var(--border)] hover:bg-[var(--surface-3)] text-[var(--danger)] transition-colors"
                          title="Delete Order"
                          onClick={() => handleDeleteItem(item)}
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
                  <StatusDropdown
                    value={item.status as any}
                    onChange={(newStatus) => handleStatusChange(item, newStatus)}
                  />
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
                      onClick={() => handleRepaymentClick(item)}
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
                      onClick={() => setPrintModalItem(item)}
                    >
                      <Printer size={13.5} />
                    </button>
                  <button
                    type="button"
                    className="w-8 h-8 rounded-md flex items-center justify-center border border-[var(--border)] hover:bg-[var(--surface-3)] text-[var(--danger)] transition-colors"
                    title="Delete Order"
                    onClick={() => handleDeleteItem(item)}
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

      {/* Record Repayment Custom Modal Popup */}
      {repaymentModalItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-50 animate-fade-in" onClick={() => setRepaymentModalItem(null)}>
          <div 
            className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-6 w-[92%] max-w-[480px] shadow-2xl flex flex-col gap-5 relative animate-zoom-in text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--success-dim)]/20 text-[var(--success)]">
                <Coins size={18} className="rotate-12" />
              </div>
              <h2 className="text-[17px] font-extrabold font-display tracking-tight text-[var(--text)]">
                Record Repayment
              </h2>
            </div>
            
            <p className="text-[12.5px] text-[var(--text-muted)] leading-relaxed">
              Enter the repayment amount for <strong>{repaymentModalItem.name}</strong> ({repaymentModalItem.invoiceNo}).
            </p>

            {/* Financial Details Box */}
            <div className="bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--border)] flex flex-col gap-2.5 font-mono text-[12.5px]">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Invoice Total:</span>
                <span className="font-bold text-[var(--text)]">Rs. {repaymentModalItem.total}</span>
              </div>
              <div className="flex justify-between border-t border-[var(--border)] pt-2">
                <span className="text-[var(--text-muted)]">Remaining Balance:</span>
                <span className="font-bold text-[var(--danger)] text-[14px]">
                  Rs. {Math.max(0, repaymentModalItem.balance - (parseFloat(repaymentAmount) || 0))}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              
              {/* Amount Input */}
              <div className="relative flex items-center border border-[var(--success)] rounded-xl pt-2.5 pb-1">
                <span className="absolute left-3 bottom-3.5 text-[var(--text-faint)]">
                  <Coins size={16} />
                </span>
                <span className="absolute left-9 -top-2.5 bg-[var(--surface)] px-1.5 text-[10px] font-bold text-[var(--success)] select-none">
                  Repayment Amount
                </span>
                <input
                  type="number"
                  required
                  placeholder="0.00"
                  value={repaymentAmount}
                  onChange={(e) => {
                    setRepaymentAmount(e.target.value)
                    setRepaymentError(null)
                  }}
                  className="w-full bg-transparent border-none py-1.5 pl-10 pr-16 text-[13.5px] text-[var(--text)] font-semibold outline-none no-spinner"
                  autoFocus
                />
                
                {/* Pay Full Balance Quick Select */}
                <button
                  type="button"
                  onClick={() => {
                    setRepaymentAmount(String(repaymentModalItem.balance))
                    setRepaymentError(null)
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-extrabold text-[var(--success)] hover:underline bg-[var(--success-dim)]/15 px-2 py-1 rounded-md"
                >
                  Pay Full
                </button>
              </div>

              {repaymentError && (
                <p className="text-[11.5px] text-[var(--danger)] font-medium -mt-2">{repaymentError}</p>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-5 mt-2">
                <button
                  type="button"
                  onClick={() => setRepaymentModalItem(null)}
                  className="text-[13px] font-semibold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRepayment}
                  className="px-5 py-2.5 rounded-xl bg-[var(--success)] text-white text-[13px] font-bold hover:bg-[var(--success-hover)] transition-colors shadow-sm flex items-center gap-1.5"
                  style={{ backgroundColor: 'var(--success)', borderRadius: '12px' }}
                >
                  <Check size={14} />
                  Record Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Preview Modal */}
      {printModalItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-50 animate-fade-in print-backdrop" onClick={() => setPrintModalItem(null)}>
          <div 
            className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-6 w-[95%] max-w-[800px] shadow-2xl flex flex-col gap-5 relative animate-zoom-in text-left max-h-[92vh] overflow-y-auto print-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="no-print flex items-center justify-between border-b border-[var(--border)] pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--copper-dim)]/20 text-[var(--copper)]">
                  <Printer size={18} />
                </div>
                <div>
                  <h2 className="text-[16px] font-extrabold font-display tracking-tight text-[var(--text)]">
                    Receipt Content Preview
                  </h2>
                  <p className="text-[11.5px] text-[var(--text-muted)] mt-0.5">Customize layout parameters and print</p>
                </div>
              </div>
              
              <button 
                type="button" 
                onClick={() => setPrintModalItem(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors text-[24px]"
              >
                &times;
              </button>
            </div>

            {/* Paper Size selector (no-print) */}
            <div className="no-print flex justify-between items-center gap-4 mb-1">
              <label className="text-[12.5px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Paper Format / Size</label>
              <select 
                value={paperSize} 
                onChange={(e) => setPaperSize(e.target.value as any)}
                className="bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-4 py-2 text-[13px] text-[var(--text)] outline-none cursor-pointer focus:border-[var(--copper)]"
              >
                <option value="roll">80x80mm Thermal Roll</option>
                <option value="a5">A5 Sheet Layout</option>
                <option value="a4">A4 Sheet Layout</option>
              </select>
            </div>

            {/* Preview Sheet Container */}
            <div className="flex-1 py-4 overflow-y-auto max-h-[50vh] border border-[var(--border)] rounded-2xl bg-[var(--surface-3)]/30 no-print">
              <div id="printable-receipt" className={`text-[var(--text)] font-sans ${paperSize === 'roll' ? 'preview-roll' : paperSize === 'a5' ? 'preview-a5' : 'preview-a4'}`}>
                {/* Header */}
                <div className="text-center mb-6">
                  <h1 className="font-extrabold text-[20px] font-display text-[var(--text)] uppercase tracking-wide">
                    {db.settings.name || 'FIXDESK'}
                  </h1>
                  <p className="text-[11px] text-[var(--text-muted)] font-mono mt-1">
                    INVOICE / RECEIPT
                  </p>
                  <p className="text-[11px] text-[var(--text-faint)] font-mono">
                    Invoice No: {printModalItem.invoiceNo} | Date: {new Date(printModalItem.date).toLocaleDateString()}
                  </p>
                </div>

                {/* Customer & Order Info */}
                <div className="mb-6 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-3)]/30">
                  <h3 className="text-[12.5px] font-bold mb-3 uppercase tracking-wider text-[var(--copper)] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--copper)]" />
                    Customer & Order Info
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-4 text-[12px]">
                    <div>
                      <span className="text-[var(--text-muted)] block text-[11px]">Customer Name</span>
                      <span className="font-semibold text-[var(--text)]">{printModalItem.name}</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] block text-[11px]">Contact Number</span>
                      <span className="font-semibold text-[var(--text)]">{printModalItem.contact}</span>
                    </div>
                    {printModalItem.type === 'Order' && (
                      <>
                        <div>
                          <span className="text-[var(--text-muted)] block text-[11px]">NIC / ID</span>
                          <span className="font-semibold text-[var(--text)]">{printModalItem.nic || '—'}</span>
                        </div>
                        <div>
                          <span className="text-[var(--text-muted)] block text-[11px]">Address</span>
                          <span className="font-semibold text-[var(--text)]">{printModalItem.original.address || '—'}</span>
                        </div>
                      </>
                    )}
                    {printModalItem.dueDate && (
                      <div>
                        <span className="text-[var(--text-muted)] block text-[11px]">Delivery Due</span>
                        <span className="font-semibold text-[var(--text)]">{new Date(printModalItem.dueDate).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Conditional Sections based on item type */}
                {printModalItem.type === 'Order' && (
                  <>
                    {/* Frame & Lens Specification */}
                    <div className="mb-6 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-3)]/30">
                      <h3 className="text-[12.5px] font-bold mb-3 uppercase tracking-wider text-[var(--teal)] flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--teal)]" />
                        Frame & Lens Specification
                      </h3>
                      <div className="flex flex-col gap-3 text-[12px]">
                        <div>
                          <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold tracking-wider">Frame Model Mapping</span>
                          <span className="font-semibold text-[var(--text)]">
                            {printModalItem.original.frameBrand || '—'} / {printModalItem.original.frameColor || '—'} / {printModalItem.original.frameCode || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold tracking-wider">Lens Material Profile</span>
                          <div className="pl-2 border-l-2 border-[var(--border)] mt-1 flex flex-col gap-1 text-[11px]">
                            <span><strong>Side:</strong> {printModalItem.original.lensSide || 'Both'}</span>
                            <span><strong>Factory:</strong> {printModalItem.original.lensFactory || '—'}</span>
                            <span><strong>Type/Name:</strong> {printModalItem.original.lensTypeName || '—'}</span>
                            <span><strong>Coating:</strong> {printModalItem.original.lensCoating || '—'}</span>
                          </div>
                        </div>
                        {printModalItem.original.prescriptionNote && (
                          <div>
                            <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold tracking-wider">Global Bill Remarks</span>
                            <p className="text-[var(--text)] italic mt-0.5">{printModalItem.original.prescriptionNote}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Eye Examination Details */}
                    {printModalItem.original.hasVisionDetails && (
                      <div className="mb-6">
                        <h3 className="text-[12.5px] font-bold mb-3 uppercase tracking-wider text-[var(--copper)] flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--copper)]" />
                          Eye Examination Details
                        </h3>
                        <div className="table-wrap">
                          <table className="w-full border-collapse border border-[var(--border)] text-[12px] text-center">
                            <thead>
                              <tr className="bg-[var(--surface-3)] text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                                <th className="border border-[var(--border)] p-2">Side</th>
                                <th className="border border-[var(--border)] p-2">SPH</th>
                                <th className="border border-[var(--border)] p-2">CYL</th>
                                <th className="border border-[var(--border)] p-2">AXS</th>
                                <th className="border border-[var(--border)] p-2">VA</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="border border-[var(--border)] p-2 font-semibold text-left">Right Eye</td>
                                <td className="border border-[var(--border)] p-2 font-mono">{printModalItem.original.rightEye?.sph || '—'}</td>
                                <td className="border border-[var(--border)] p-2 font-mono">{printModalItem.original.rightEye?.cyl || '—'}</td>
                                <td className="border border-[var(--border)] p-2 font-mono">{printModalItem.original.rightEye?.axis || '—'}</td>
                                <td className="border border-[var(--border)] p-2 font-mono">{printModalItem.original.rightEye?.va || '—'}</td>
                              </tr>
                              <tr>
                                <td className="border border-[var(--border)] p-2 font-semibold text-left">Left Eye</td>
                                <td className="border border-[var(--border)] p-2 font-mono">{printModalItem.original.leftEye?.sph || '—'}</td>
                                <td className="border border-[var(--border)] p-2 font-mono">{printModalItem.original.leftEye?.cyl || '—'}</td>
                                <td className="border border-[var(--border)] p-2 font-mono">{printModalItem.original.leftEye?.axis || '—'}</td>
                                <td className="border border-[var(--border)] p-2 font-mono">{printModalItem.original.leftEye?.va || '—'}</td>
                              </tr>
                              <tr>
                                <td className="border border-[var(--border)] p-2 font-semibold text-left">ADD</td>
                                <td className="border border-[var(--border)] p-2 font-mono" colSpan={2}>
                                  {printModalItem.original.rightEye?.add || '0.00'} (Right)
                                </td>
                                <td className="border border-[var(--border)] p-2 font-mono" colSpan={2}>
                                  {printModalItem.original.leftEye?.add || '0.00'} (Left)
                                </td>
                              </tr>
                              <tr>
                                <td className="border border-[var(--border)] p-2 font-semibold text-left">IPD / PD</td>
                                <td className="border border-[var(--border)] p-2 font-mono text-left" colSpan={4}>
                                  {printModalItem.original.pd || '—'} mm
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {printModalItem.type === 'Repair' && (
                  <div className="mb-6 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-3)]/30 text-[12.5px] flex flex-col gap-3">
                    <h3 className="text-[12.5px] font-bold uppercase tracking-wider text-[var(--teal)] flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--teal)]" />
                      Repair Service Details
                    </h3>
                    <div>
                      <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold tracking-wider">Device / Item</span>
                      <span className="font-semibold text-[var(--text)]">{printModalItem.original.device}</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold tracking-wider">Issue Description</span>
                      <p className="text-[var(--text)]">{printModalItem.original.issue}</p>
                    </div>
                    {printModalItem.original.notes && (
                      <div>
                        <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold tracking-wider">Remarks / Notes</span>
                        <p className="text-[var(--text)] italic mt-0.5">{printModalItem.original.notes}</p>
                      </div>
                    )}
                  </div>
                )}

                {printModalItem.type === 'Access.' && (
                  <div className="mb-6 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-3)]/30 text-[12.5px] flex flex-col gap-3">
                    <h3 className="text-[12.5px] font-bold uppercase tracking-wider text-[var(--teal)] flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--teal)]" />
                      Accessories Sales Details
                    </h3>
                    <div>
                      <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold tracking-wider">Item Purchased</span>
                      <span className="font-semibold text-[var(--text)]">{printModalItem.original.item}</span>
                    </div>
                    {printModalItem.original.details && (
                      <div>
                        <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold tracking-wider">Additional Details</span>
                        <p className="text-[var(--text)]">{printModalItem.original.details}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Pricing Totals Section */}
                <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] mt-4">
                  <div className="flex flex-col gap-2.5 text-[13px]">
                    <div className="flex justify-between items-center text-[var(--text-muted)]">
                      <span>Actual Total:</span>
                      <span className="font-mono font-bold text-[var(--text)]">{fmt(db.settings.currency, printModalItem.total)}</span>
                    </div>
                    
                    {printModalItem.original.discount > 0 && (
                      <div className="flex justify-between items-center text-[var(--danger)]">
                        <span className="flex items-center gap-1.5">
                          Discount Price:
                          <span className="px-1.5 py-0.5 rounded-md bg-[var(--danger-dim)] text-white text-[9.5px] font-bold uppercase tracking-wider">
                            {Math.round((printModalItem.original.discount / printModalItem.total) * 100)}% OFF
                          </span>
                        </span>
                        <span className="font-mono font-bold">
                          {fmt(db.settings.currency, printModalItem.total - printModalItem.original.discount)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-[var(--success)]">
                      <span>Advance Paid:</span>
                      <span className="font-mono font-bold">
                        {fmt(db.settings.currency, printModalItem.original.payment || printModalItem.original.advance || 0)}
                      </span>
                    </div>

                    <div className="border-t border-[var(--border)] pt-2 mt-1 flex justify-between items-center text-[14.5px] font-bold">
                      <span className="text-[var(--text)]">Balance Due:</span>
                      <span className="font-mono text-[var(--copper)]">{fmt(db.settings.currency, printModalItem.balance)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Print Confirmation Actions */}
            <div className="no-print flex items-center justify-end gap-4 mt-3 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setPrintModalItem(null)}
                className="text-[13px] font-semibold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => {
                  showToast(`Sending invoice ${printModalItem.invoiceNo} to printer...`)
                  window.print()
                }}
                className="px-5 py-2.5 rounded-xl bg-[var(--success)] text-white text-[13px] font-bold hover:bg-[var(--success-hover)] transition-colors shadow-sm flex items-center gap-1.5"
                style={{ backgroundColor: 'var(--success)', borderRadius: '12px' }}
              >
                <Printer size={14} />
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
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

// Premium Inline Status Dropdown for table rows & cards
function StatusDropdown({
  value,
  onChange
}: {
  value: 'Pending' | 'Delivered' | 'Cancelled'
  onChange: (val: 'Pending' | 'Delivered' | 'Cancelled') => void
}) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    const handleOutsideClick = () => setIsOpen(false)
    window.addEventListener('click', handleOutsideClick)
    return () => window.removeEventListener('click', handleOutsideClick)
  }, [isOpen])

  const getStatusClass = (status: string) => {
    if (status === 'Delivered') return 'text-[var(--success)] bg-[var(--success-dim)] border-[var(--success)] hover:bg-[var(--success-dim)]/80'
    if (status === 'Pending') return 'text-[var(--copper)] bg-[var(--copper-dim)]/20 border-[var(--copper)] hover:bg-[var(--copper-dim)]/30'
    return 'text-[var(--danger)] bg-[var(--danger-dim)] border-[var(--danger)] hover:bg-[var(--danger-dim)]/80'
  }

  const options = ['Pending', 'Delivered', 'Cancelled'] as const

  return (
    <div className="relative inline-block text-left" onClick={e => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold cursor-pointer outline-none transition-all ${getStatusClass(value)}`}
        style={{ minWidth: '95px', justifyContent: 'center' }}
      >
        <span>{value}</span>
        <ChevronDown size={11} className="opacity-80" />
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-1/2 -translate-x-1/2 z-50 min-w-[110px] bg-[var(--surface-3)] border border-[var(--border)] rounded-lg shadow-xl p-1 animate-in fade-in slide-in-from-top-1 duration-150">
          {options.map((opt) => {
            const isSelected = opt === value
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center justify-between text-left px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-colors ${
                  isSelected 
                    ? 'bg-[var(--copper)]/10 text-[var(--copper)] font-semibold' 
                    : 'text-[var(--text)] hover:bg-[var(--surface-2)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                    opt === 'Delivered' ? 'bg-[var(--success)]' : opt === 'Pending' ? 'bg-[var(--copper)]' : 'bg-[var(--danger)]'
                  }`} />
                  <span>{opt}</span>
                </div>
                {isSelected && <Check size={11} className="text-[var(--copper)]" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
