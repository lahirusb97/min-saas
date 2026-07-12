import { useState } from 'react'
import { 
  Store, 
  ArrowDown, 
  ArrowUp, 
  Wallet, 
  Plus, 
  Calendar,
  AlignLeft,
  DollarSign,
  Pencil,
  Trash2,
  Printer
} from 'lucide-react'
import { useFixDesk } from '../context/FixDeskContext'

export function AccountsPage() {
  const { 
    db, 
    addExpense, 
    editExpense, 
    deleteExpense, 
    showToast 
  } = useFixDesk()

  // Selected date for accounting dashboard (default is today)
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  })

  // Get today's date in YYYY-MM-DD format for max limit
  const todayStr = (() => {
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  })()

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null)
  const [expenseDesc, setExpenseDesc] = useState('')
  const [expenseAmount, setExpenseAmount] = useState('')

  // Date matcher helper
  const isSameDay = (timestamp: number, filterDateStr: string) => {
    const dateA = new Date(timestamp).toLocaleDateString('en-CA') // YYYY-MM-DD format
    return dateA === filterDateStr
  }

  // Filter items for the selected date
  const prescriptionsToday = (db.prescriptions || []).filter(p => isSameDay(p.createdAt, selectedDate))
  const repairsToday = (db.repairJobs || []).filter(r => isSameDay(r.createdAt, selectedDate))
  const accToday = (db.accJobs || []).filter(a => isSameDay(a.createdAt, selectedDate))
  const expensesToday = (db.expenses || []).filter(e => isSameDay(e.createdAt, selectedDate))

  // Financial Calculations
  const totalSales = 
    prescriptionsToday.reduce((sum, p) => sum + p.total, 0) +
    repairsToday.reduce((sum, r) => sum + r.cost, 0) +
    accToday.reduce((sum, a) => sum + a.price, 0)

  const totalRevenue = 
    prescriptionsToday.reduce((sum, p) => sum + p.payment, 0) +
    repairsToday.reduce((sum, r) => sum + r.advance, 0) +
    accToday.reduce((sum, a) => sum + (a.advance || 0), 0)

  const totalExpenses = expensesToday.reduce((sum, e) => sum + e.amount, 0)
  const netCash = totalRevenue - totalExpenses

  // Counts Calculations
  const ordersCount = prescriptionsToday.length
  const repairsCount = repairsToday.length
  const accessoriesCount = accToday.length

  // Map and Combine all items into a single list of transactions for the table
  const ordersMapped = prescriptionsToday.map(p => ({
    id: `pres-${p.id}`,
    realId: p.id,
    name: p.name,
    contact: p.phone,
    invoiceNo: `#${p.serialNo}`,
    amount: p.payment, // cash-in
    balance: p.balance,
    total: p.total,
    timestamp: p.createdAt,
    type: 'Order',
    isOutflow: false,
  }))

  const repairsMapped = repairsToday.map(r => ({
    id: `repair-${r.id}`,
    realId: r.id,
    name: r.customer,
    contact: r.phone,
    invoiceNo: r.ticketNo,
    amount: r.advance, // cash-in
    balance: r.cost - r.advance,
    total: r.cost,
    timestamp: r.createdAt,
    type: 'Repair',
    isOutflow: false,
  }))

  const accMapped = accToday.map(a => ({
    id: `acc-${a.id}`,
    realId: a.id,
    name: a.customer,
    contact: a.phone,
    invoiceNo: a.ticketNo,
    amount: a.advance || 0, // cash-in
    balance: a.price - (a.advance || 0),
    total: a.price,
    timestamp: a.createdAt,
    type: 'Accessories',
    isOutflow: false,
  }))

  const expensesMapped = expensesToday.map(e => ({
    id: `exp-${e.id}`,
    realId: e.id,
    name: e.description,
    contact: '--',
    invoiceNo: '--',
    amount: e.amount, // cash-out
    balance: 0,
    total: e.amount,
    timestamp: e.createdAt,
    type: 'Expense',
    isOutflow: true,
  }))

  // Combine and sort by newest first
  const allTransactions = [
    ...ordersMapped,
    ...repairsMapped,
    ...accMapped,
    ...expensesMapped
  ].sort((a, b) => b.timestamp - a.timestamp)

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(expenseAmount)
    if (!expenseDesc.trim()) {
      alert("Please enter a valid description!")
      return
    }
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid positive amount!")
      return
    }

    if (editingExpenseId !== null) {
      editExpense(editingExpenseId, expenseDesc, amount)
      showToast(`Updated expense to Rs. ${amount.toLocaleString()} for "${expenseDesc}"`)
    } else {
      addExpense(expenseDesc, amount, selectedDate)
      showToast(`Added expense of Rs. ${amount.toLocaleString()} for "${expenseDesc}"`)
    }
    
    // Reset states and close
    setExpenseDesc('')
    setExpenseAmount('')
    setEditingExpenseId(null)
    setIsModalOpen(false)
  }

  const handleEditClick = (expense: any) => {
    setEditingExpenseId(expense.id)
    setExpenseDesc(expense.description)
    setExpenseAmount(expense.amount.toString())
    setIsModalOpen(true)
  }

  const handleDeleteClick = (id: number, desc: string) => {
    if (confirm(`Are you sure you want to delete the expense "${desc}"?`)) {
      deleteExpense(id)
      showToast(`Deleted expense "${desc}"`)
    }
  }

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })
    return `${dateStr}, ${timeStr}`
  }

  const getTypeBadgeClass = (type: string) => {
    if (type === 'Order') return 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/20'
    if (type === 'Repair') return 'text-[var(--teal)] bg-[var(--teal-dim)]/20 border-[var(--teal)]/20'
    if (type === 'Accessories') return 'text-[#9c7cf4] bg-[#9c7cf4]/10 border-[#9c7cf4]/20'
    return 'text-[var(--danger)] bg-[var(--danger-dim)]/10 border-[var(--danger)]/30'
  }

  return (
    <div className="panel flex flex-col gap-6 relative">
      
      {/* Page Header */}
      <div className="flex justify-between items-center flex-wrap gap-4 border-b pb-3 border-[var(--border)]">
        <div className="flex items-center gap-2">
          <span className="text-[17px]">📊</span>
          <div className="panel-title font-bold text-[14.5px]">Today's Accounts & Performance</div>
        </div>

        {/* Date Picker & Add Expense control */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setEditingExpenseId(null)
              setExpenseDesc('')
              setExpenseAmount('')
              setIsModalOpen(true)
            }}
            className="btn btn-sm btn-ghost hover:bg-[var(--danger-dim)]/10 hover:text-[var(--danger)] border border-[var(--border)] flex items-center gap-1 text-[12px] font-semibold transition-colors"
          >
            <Plus size={13.5} />
            Add Expense
          </button>
          
          <div className="relative flex items-center bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-2 py-1 text-[12.5px] font-medium gap-1 text-[var(--text-muted)] focus-within:border-[var(--copper)] transition-colors">
            <Calendar size={14} className="text-[var(--text-faint)]" />
            <input
              type="date"
              value={selectedDate}
              max={todayStr}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none text-[12.5px] text-[var(--text)] outline-none cursor-pointer"
              style={{ fontFamily: 'inherit' }}
            />
          </div>
        </div>
      </div>

      {/* Financial Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Sales */}
        <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-[var(--radius)] p-4 flex items-center gap-4 transition-all hover:border-[var(--border-hover)]">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[rgba(232,163,61,0.1)] text-[var(--copper)] flex-shrink-0">
            <Store size={18} />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[9.5px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Total Sales (Amount Sold)
            </span>
            <span className="text-[17px] font-extrabold text-[var(--text)]">
              LKR {totalSales.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Card 2: Total Revenue (Cash-In) */}
        <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-[var(--radius)] p-4 flex items-center gap-4 transition-all hover:border-[var(--border-hover)]">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[rgba(107,203,119,0.12)] text-[var(--success)] flex-shrink-0">
            <ArrowDown size={18} />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[9.5px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Total Revenue (Cash-In)
            </span>
            <span className="text-[17px] font-extrabold text-[var(--text)]">
              LKR {totalRevenue.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Card 3: Total Expenses (Cash-Out) */}
        <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-[var(--radius)] p-4 flex items-center gap-4 transition-all hover:border-[var(--border-hover)]">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[rgba(240,98,95,0.1)] text-[var(--danger)] flex-shrink-0">
            <ArrowUp size={18} />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[9.5px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Total Expenses (Cash-Out)
            </span>
            <span className="text-[17px] font-extrabold text-[var(--text)]">
              LKR {totalExpenses.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Card 4: Net Cash in Hand */}
        <div className="bg-[var(--surface-2)] border border-[#3b82f6]/40 rounded-[var(--radius)] p-4 flex items-center gap-4 transition-all shadow-sm" style={{ boxShadow: '0 0 10px rgba(59, 130, 246, 0.05)' }}>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#3b82f6]/10 text-[#3b82f6] flex-shrink-0">
            <Wallet size={18} />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[9.5px] font-bold text-[#3b82f6] uppercase tracking-wider">
              Net Cash in Hand
            </span>
            <span className="text-[17px] font-extrabold text-[#3b82f6]">
              LKR {netCash.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

      </div>

      {/* Counts Row */}
      <div className="grid grid-cols-3 gap-4 border-t pt-4 border-[var(--border)] text-center text-[12.5px] font-medium text-[var(--text-muted)]">
        <div className="flex items-center justify-center gap-2 bg-[var(--surface-3)] py-2.5 rounded-lg border border-[var(--border)]">
          <span className="w-2 h-2 rounded-full bg-[#3b82f6]"></span>
          <span>Orders: <strong className="text-[var(--text)] text-[13.5px]">{ordersCount}</strong></span>
        </div>
        <div className="flex items-center justify-center gap-2 bg-[var(--surface-3)] py-2.5 rounded-lg border border-[var(--border)]">
          <span className="w-2 h-2 rounded-full bg-[var(--teal)]"></span>
          <span>Repairs: <strong className="text-[var(--text)] text-[13.5px]">{repairsCount}</strong></span>
        </div>
        <div className="flex items-center justify-center gap-2 bg-[var(--surface-3)] py-2.5 rounded-lg border border-[var(--border)]">
          <span className="w-2 h-2 rounded-full bg-[#9c7cf4]"></span>
          <span>Accessories: <strong className="text-[var(--text)] text-[13.5px]">{accessoriesCount}</strong></span>
        </div>
      </div>

      {/* Unified Transactions Table (Cash Flow Log) */}
      <div className="border-t pt-4 border-[var(--border)] flex flex-col gap-3">
        <div className="text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-wider ml-0.5">
          Transactions & Expenses Log ({allTransactions.length})
        </div>
        
      {/* Unified Transactions Table (Cash Flow Log - Desktop view) */}
      <div className="search-desktop-table overflow-x-auto w-full">
        <table className="w-full border-collapse text-left text-[12.5px]">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--text-muted)] font-bold text-[11px] uppercase tracking-wider">
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Contact</th>
              <th className="py-3 px-4">Invoice No</th>
              <th className="py-3 px-4">Amount</th>
              <th className="py-3 px-4">Date And Time</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {allTransactions.length ? (
              allTransactions.map((tx) => {
                return (
                  <tr key={tx.id} className="border-b border-[var(--border)] hover:bg-[var(--surface-2)]/40 transition-colors">
                    {/* Name / Description */}
                    <td className="py-3 px-4 font-semibold text-[var(--text)]">
                      {tx.name}
                    </td>

                    {/* Contact */}
                    <td className="py-3 px-4 text-[var(--text-muted)] font-mono">
                      {tx.contact}
                    </td>

                    {/* Invoice Number */}
                    <td className="py-3 px-4 font-bold text-[var(--text)] font-mono">
                      {tx.invoiceNo}
                    </td>

                    {/* Amount Cash-in or Outflow */}
                    <td className="py-3 px-4 font-mono font-bold">
                      <span className={tx.isOutflow ? 'text-[var(--danger)]' : 'text-[var(--success)]'}>
                        {tx.isOutflow ? '-' : '+'} LKR {tx.amount.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>

                    {/* Date & Time */}
                    <td className="py-3 px-4 text-[var(--text-muted)]">
                      {formatDateTime(tx.timestamp)}
                    </td>

                    {/* Type Badge */}
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getTypeBadgeClass(tx.type)}`}>
                        {tx.type}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {tx.type === 'Expense' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleEditClick({ id: tx.realId, description: tx.name, amount: tx.amount })}
                              className="w-8 h-8 rounded-md flex items-center justify-center border border-[var(--border)] hover:bg-[var(--surface-3)] text-[#3b82f6] transition-colors"
                              title="Edit Expense"
                            >
                              <Pencil size={13.5} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteClick(tx.realId, tx.name)}
                              className="w-8 h-8 rounded-md flex items-center justify-center border border-[var(--border)] hover:bg-[var(--surface-3)] text-[var(--danger)] transition-colors"
                              title="Delete Expense"
                            >
                              <Trash2 size={13.5} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="w-8 h-8 rounded-md flex items-center justify-center border border-[var(--border)] hover:bg-[var(--surface-3)] text-[var(--copper)] transition-colors"
                              title="Print Invoice"
                              onClick={() => {
                                showToast(`Printing invoice ${tx.invoiceNo}...`)
                                window.print()
                              }}
                            >
                              <Printer size={13.5} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[var(--text-faint)]">
                  No transactions or expenses recorded for this date.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Unified Transactions List (Cash Flow Log - Mobile/Tablet view) */}
      <div className="search-mobile-cards">
        {allTransactions.length ? (
          allTransactions.map((tx) => {
            return (
              <div key={tx.id} className="search-card">
                {/* Header: Type and Timestamp */}
                <div className="search-card-header">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getTypeBadgeClass(tx.type)}`}>
                    {tx.type}
                  </span>
                  <span className="text-[11.5px] text-[var(--text-muted)] font-mono">
                    {formatDateTime(tx.timestamp)}
                  </span>
                </div>

                {/* Body */}
                <div className="search-card-body">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[var(--text-muted)] text-[10px] uppercase font-bold tracking-wider">
                      {tx.type === 'Expense' ? 'Description' : 'Customer Name'}
                    </span>
                    <span className="font-semibold text-[13.5px] text-[var(--text)]">{tx.name}</span>
                  </div>

                  {tx.type !== 'Expense' && (
                    <>
                      <div className="search-card-row">
                        <span className="text-[var(--text-muted)] text-[12px]">Contact:</span>
                        <span className="font-mono text-[var(--text)] text-[12px]">{tx.contact}</span>
                      </div>
                      <div className="search-card-row">
                        <span className="text-[var(--text-muted)] text-[12px]">Invoice No:</span>
                        <span className="font-bold text-[var(--text)] font-mono text-[12px]">{tx.invoiceNo}</span>
                      </div>
                    </>
                  )}

                  <div className="search-card-row">
                    <span className="text-[var(--text-muted)] text-[12px]">Amount:</span>
                    <span className={`font-mono font-bold text-[13px] ${tx.isOutflow ? 'text-[var(--danger)]' : 'text-[var(--success)]'}`}>
                      {tx.isOutflow ? '-' : '+'} LKR {tx.amount.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="search-card-footer">
                  {tx.type === 'Expense' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleEditClick({ id: tx.realId, description: tx.name, amount: tx.amount })}
                        className="w-8 h-8 rounded-md flex items-center justify-center border border-[var(--border)] hover:bg-[var(--surface-3)] text-[#3b82f6] transition-colors"
                        title="Edit Expense"
                      >
                        <Pencil size={13.5} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(tx.realId, tx.name)}
                        className="w-8 h-8 rounded-md flex items-center justify-center border border-[var(--border)] hover:bg-[var(--surface-3)] text-[var(--danger)] transition-colors"
                        title="Delete Expense"
                      >
                        <Trash2 size={13.5} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="w-8 h-8 rounded-md flex items-center justify-center border border-[var(--border)] hover:bg-[var(--surface-3)] text-[var(--copper)] transition-colors"
                        title="Print Invoice"
                        onClick={() => {
                          showToast(`Printing invoice ${tx.invoiceNo}...`)
                          window.print()
                        }}
                      >
                        <Printer size={13.5} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          <div className="py-8 text-center text-[var(--text-faint)] text-[12.5px] bg-[var(--surface-2)] border border-[var(--border)] border-dashed rounded-lg">
            No transactions or expenses recorded for this date.
          </div>
        )}
      </div>
      </div>

      {/* Record Shop Expense Custom Modal Popup */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-50 animate-fade-in">
          <div 
            className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-6 w-[92%] max-w-[480px] shadow-2xl flex flex-col gap-5 relative animate-zoom-in text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: custom soft red circle with diagonal dollar icon */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--danger-dim)]/20 text-[var(--danger)]">
                <DollarSign size={18} className="rotate-12" />
              </div>
              <h2 className="text-[17px] font-extrabold font-display tracking-tight" style={{ color: '#000000' }}>
                {editingExpenseId !== null ? 'Edit Expense' : 'Expense'}
              </h2>
            </div>
            
            <p className="text-[12.5px] text-[var(--text-muted)] leading-relaxed">
              Record all operational expenses here (e.g., Shop Rent, Electricity Bill, Tea, Courier, or Salaries).
            </p>

            <form onSubmit={handleSaveExpense} className="flex flex-col gap-4">
              
              {/* Description Input: list icon on left */}
              <div className="relative flex items-center">
                <span className="absolute left-3 text-[var(--text-faint)]">
                  <AlignLeft size={16} />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Expense Description / Reason"
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl py-3 pl-10 pr-4 text-[13px] text-[var(--text)] outline-none focus:border-[var(--copper)] transition-colors"
                />
              </div>

              {/* Amount Input: wallet icon, floating label and green border */}
              <div className="relative flex items-center border border-[var(--success)] rounded-xl pt-2 pb-0.5">
                <span className="absolute left-3 bottom-3 text-[var(--text-faint)]">
                  <Wallet size={16} />
                </span>
                <span className="absolute left-9 -top-2.5 bg-[var(--surface)] px-1.5 text-[10px] font-bold text-[var(--success)] select-none">
                  Amount Paid
                </span>
                <input
                  type="number"
                  required
                  step="any"
                  placeholder="0.00"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-full bg-transparent border-none py-2 pl-10 pr-4 text-[13.5px] text-[var(--text)] font-semibold outline-none"
                />
              </div>

              {/* Action Buttons: Cancel and Save Expense */}
              <div className="flex items-center justify-end gap-5 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setExpenseDesc('')
                    setExpenseAmount('')
                    setEditingExpenseId(null)
                    setIsModalOpen(false)
                  }}
                  className="text-[13px] font-semibold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[var(--success)] text-white text-[13px] font-bold hover:bg-[var(--success-hover)] transition-colors shadow-sm"
                  style={{ backgroundColor: 'var(--success)', borderRadius: '12px' }}
                >
                  {editingExpenseId !== null ? 'Save Changes' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
