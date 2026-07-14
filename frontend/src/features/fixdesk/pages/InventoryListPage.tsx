import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Plus, Trash2, Search, Edit2, PlusCircle, Check, Package } from 'lucide-react'
import { useFixDesk } from '../context/FixDeskContext'
import { EmptyState } from '../components/EmptyState'
import { fmt } from '../utils'
import { useInventoryGroup } from '../hooks/useInventoryGroup'
import { frameService, type Frame } from '../services/frameService'
import { lensService, type Lens } from '../services/lensService'
import { accessoryService, type Accessory } from '../services/accessoryService'

export function InventoryListPage() {
  const group = useInventoryGroup()
  const { db, showToast } = useFixDesk()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<'All' | 'low'>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const isFrames = group?.slug === 'frames'
  const isLenses = group?.slug === 'lenses'
  const isAccessories = group?.slug === 'accessories'

  const [frames, setFrames] = useState<Frame[]>([])
  const [framesLoading, setFramesLoading] = useState(isFrames)

  const [qtyModalFrame, setQtyModalFrame] = useState<Frame | null>(null)
  const [addQtyValue, setAddQtyValue] = useState<string>('')
  const [qtyModalError, setQtyModalError] = useState<string | null>(null)

  const [editModalFrame, setEditModalFrame] = useState<Frame | null>(null)
  const [editBrand, setEditBrand] = useState('')
  const [editModel, setEditModel] = useState('')
  const [editColor, setEditColor] = useState('')
  const [editType, setEditType] = useState('')
  const [editQty, setEditQty] = useState(0)
  const [editPrice, setEditPrice] = useState(0)
  const [editThreshold, setEditThreshold] = useState(5)
  const [editModalError, setEditModalError] = useState<string | null>(null)
  const [updatingFrame, setUpdatingFrame] = useState(false)

  const [qtyModalAcc, setQtyModalAcc] = useState<Accessory | null>(null)
  const [addQtyAccValue, setAddQtyAccValue] = useState<string>('')
  const [qtyModalAccError, setQtyModalAccError] = useState<string | null>(null)

  const [editModalAcc, setEditModalAcc] = useState<Accessory | null>(null)
  const [editAccName, setEditAccName] = useState('')
  const [editAccQty, setEditAccQty] = useState(0)
  const [editAccPrice, setEditAccPrice] = useState(0)
  const [editModalAccError, setEditModalAccError] = useState<string | null>(null)

  const [editModalLens, setEditModalLens] = useState<Lens | null>(null)
  const [editLensName, setEditLensName] = useState('')
  const [editLensType, setEditLensType] = useState('')
  const [editLensCoating, setEditLensCoating] = useState('')
  const [editLensFactory, setEditLensFactory] = useState('')
  const [editLensPrice, setEditLensPrice] = useState(0)
  const [editModalLensError, setEditModalLensError] = useState<string | null>(null)

  useEffect(() => {
    if (!isFrames) return
    setFramesLoading(true)
    frameService
      .list()
      .then(setFrames)
      .finally(() => setFramesLoading(false))
  }, [isFrames])

  const [lenses, setLenses] = useState<Lens[]>([])
  const [lensesLoading, setLensesLoading] = useState(isLenses)

  useEffect(() => {
    if (!isLenses) return
    setLensesLoading(true)
    lensService
      .list()
      .then(setLenses)
      .finally(() => setLensesLoading(false))
  }, [isLenses])

  const [accessories, setAccessories] = useState<Accessory[]>([])
  const [accessoriesLoading, setAccessoriesLoading] = useState(isAccessories)

  useEffect(() => {
    if (!isAccessories) return
    setAccessoriesLoading(true)
    accessoryService
      .list()
      .then(setAccessories)
      .finally(() => setAccessoriesLoading(false))
  }, [isAccessories])

  if (!group) {
    return <Navigate to="/dashboard/inventory" replace />
  }

  async function handleDeleteFrame(id: number) {
    if (!window.confirm('Are you sure you want to delete this frame?')) return
    await frameService.remove(id)
    setFrames((prev) => prev.filter((f) => f.id !== id))
    showToast('Frame removed')
  }

  async function handleDeleteLens(id: number) {
    if (!window.confirm('Are you sure you want to delete this lens?')) return
    await lensService.remove(id)
    setLenses((prev) => prev.filter((l) => l.id !== id))
    showToast('Lens removed')
  }

  async function handleDeleteAccessory(id: number) {
    if (!window.confirm('Are you sure you want to delete this accessory?')) return
    await accessoryService.remove(id)
    setAccessories((prev) => prev.filter((a) => a.id !== id))
    showToast('Accessory removed')
  }

  const handleOpenQtyModal = (frame: Frame) => {
    setQtyModalFrame(frame)
    setAddQtyValue('')
    setQtyModalError(null)
  }

  const handleConfirmAddQty = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!qtyModalFrame) return
    const added = parseInt(addQtyValue)
    if (isNaN(added) || added <= 0) {
      setQtyModalError('Please enter a valid positive quantity.')
      return
    }

    setUpdatingFrame(true)
    try {
      const nextQty = qtyModalFrame.qty + added
      await frameService.update(qtyModalFrame.id, { qty: nextQty })
      setFrames(prev => prev.map(f => f.id === qtyModalFrame.id ? { ...f, qty: nextQty } : f))
      showToast(`Updated stock quantity for ${qtyModalFrame.brand}`)
      setQtyModalFrame(null)
    } catch (err) {
      console.error('Failed to update quantity:', err)
      setQtyModalError('Failed to update quantity on server.')
    } finally {
      setUpdatingFrame(false)
    }
  }

  const handleOpenEditModal = (frame: Frame) => {
    setEditModalFrame(frame)
    setEditBrand(frame.brand)
    setEditModel(frame.modelNumber)
    setEditColor(frame.color || '')
    setEditType(frame.frameType || '')
    setEditQty(frame.qty)
    setEditPrice(frame.price)
    setEditThreshold(frame.threshold)
    setEditModalError(null)
  }

  const handleConfirmFullEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editModalFrame) return
    if (!editBrand.trim() || !editModel.trim()) {
      setEditModalError('Brand and Model Number are required.')
      return
    }

    setUpdatingFrame(true)
    try {
      const updated = await frameService.update(editModalFrame.id, {
        brand: editBrand.trim(),
        modelNumber: editModel.trim(),
        color: editColor.trim() || undefined,
        frameType: editType.trim() || undefined,
        qty: editQty,
        price: editPrice,
        threshold: editThreshold,
      })

      setFrames(prev => prev.map(f => f.id === editModalFrame.id ? updated : f))
      showToast(`Updated details for frame ${editBrand}`)
      setEditModalFrame(null)
    } catch (err) {
      console.error('Failed to update frame:', err)
      setEditModalError('Failed to save changes on server.')
    } finally {
      setUpdatingFrame(false)
    }
  }

  const handleOpenQtyModalAcc = (acc: Accessory) => {
    setQtyModalAcc(acc)
    setAddQtyAccValue('')
    setQtyModalAccError(null)
  }

  const handleConfirmAddQtyAcc = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!qtyModalAcc) return
    const added = parseInt(addQtyAccValue)
    if (isNaN(added) || added <= 0) {
      setQtyModalAccError('Please enter a valid positive quantity.')
      return
    }

    setUpdatingFrame(true)
    try {
      const nextQty = qtyModalAcc.qty + added
      await accessoryService.update(qtyModalAcc.id, { qty: nextQty })
      setAccessories(prev => prev.map(a => a.id === qtyModalAcc.id ? { ...a, qty: nextQty } : a))
      showToast(`Updated stock quantity for ${qtyModalAcc.name}`)
      setQtyModalAcc(null)
    } catch (err) {
      console.error('Failed to update quantity:', err)
      setQtyModalAccError('Failed to update quantity on server.')
    } finally {
      setUpdatingFrame(false)
    }
  }

  const handleOpenEditModalAcc = (acc: Accessory) => {
    setEditModalAcc(acc)
    setEditAccName(acc.name)
    setEditAccQty(acc.qty)
    setEditAccPrice(acc.price)
    setEditModalAccError(null)
  }

  const handleConfirmFullEditAcc = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editModalAcc) return
    if (!editAccName.trim()) {
      setEditModalAccError('Item name is required.')
      return
    }

    setUpdatingFrame(true)
    try {
      const updated = await accessoryService.update(editModalAcc.id, {
        name: editAccName.trim(),
        qty: editAccQty,
        price: editAccPrice,
      })

      setAccessories(prev => prev.map(a => a.id === editModalAcc.id ? updated : a))
      showToast(`Updated details for accessory ${editAccName}`)
      setEditModalAcc(null)
    } catch (err) {
      console.error('Failed to update accessory:', err)
      setEditModalAccError('Failed to save changes on server.')
    } finally {
      setUpdatingFrame(false)
    }
  }

  const handleOpenEditModalLens = (lens: Lens) => {
    setEditModalLens(lens)
    setEditLensName(lens.name || '')
    setEditLensType(lens.type || '')
    setEditLensCoating(lens.coating || '')
    setEditLensFactory(lens.factory || '')
    setEditLensPrice(lens.price)
    setEditModalLensError(null)
  }

  const handleConfirmFullEditLens = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editModalLens) return
    if (!editLensType.trim()) {
      setEditModalLensError('Type is required.')
      return
    }

    setUpdatingFrame(true)
    try {
      const updated = await lensService.update(editModalLens.id, {
        name: editLensName.trim() || undefined,
        type: editLensType.trim(),
        coating: editLensCoating.trim() || undefined,
        factory: editLensFactory.trim() || undefined,
        price: editLensPrice,
      })

      setLenses(prev => prev.map(l => l.id === editModalLens.id ? updated : l))
      showToast(`Updated details for lens ${editLensType}`)
      setEditModalLens(null)
    } catch (err) {
      console.error('Failed to update lens:', err)
      setEditModalLensError('Failed to save changes on server.')
    } finally {
      setUpdatingFrame(false)
    }
  }

  if (isFrames) {
    const list = filter === 'low' ? frames.filter((f) => f.qty <= f.threshold) : frames
    const filteredList = list.filter((f) => {
      const q = searchQuery.toLowerCase().trim()
      if (!q) return true
      return (
        f.brand?.toLowerCase().includes(q) ||
        f.modelNumber?.toLowerCase().includes(q) ||
        f.color?.toLowerCase().includes(q)
      )
    })

    return (
      <>
        <div className="panel">
        <div className="panel-head">
          <div className="panel-title">
            {group.label} Stock <span className="n">({filteredList.length})</span>
          </div>
          <div className="relative w-full md:w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-faint)] pointer-events-none" />
            <input
              type="text"
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg py-1.5 pl-9 pr-4 text-[13px] text-[var(--text)] outline-none focus:border-[var(--copper)] transition-colors"
              placeholder="Search brand, code, color..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="filter-row" style={{ margin: 0, gap: 8 }}>
            <button type="button" className={`chip${filter === 'All' ? ' active' : ''}`} onClick={() => setFilter('All')}>
              All
            </button>
            <button type="button" className={`chip${filter === 'low' ? ' active' : ''}`} onClick={() => setFilter('low')}>
              Low stock only
            </button>
            <button type="button" className="btn btn-copper" onClick={() => navigate(`/dashboard/inventory/${group.slug}/create`)}>
              <Plus />
              New {group.label} Item
            </button>
          </div>
        </div>
        {/* Desktop View */}
        <div className="table-wrap hidden md:block">
          <table>
            <thead>
              <tr>
                <th>Brand</th>
                <th>Model Number</th>
                <th>Color</th>
                <th>Type</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Value</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {framesLoading ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState title="Loading..." sub="Fetching frame stock." />
                  </td>
                </tr>
              ) : filteredList.length ? (
                filteredList.map((f) => (
                  <tr key={f.id}>
                    <td>{f.brand}</td>
                    <td>{f.modelNumber}</td>
                    <td>{f.color || '—'}</td>
                    <td>{f.frameType || '—'}</td>
                    <td>
                      <span className={`qty-pill ${f.qty <= f.threshold ? 'qty-low' : 'qty-ok'}`}>{f.qty}</span>
                    </td>
                    <td>{fmt(db.settings.currency, f.price)}</td>
                    <td>{fmt(db.settings.currency, f.qty * f.price)}</td>
                     <td>
                      <div className="flex gap-2 justify-end">
                        <button type="button" className="icon-btn text-[var(--success)]" title="Add Quantity" onClick={() => handleOpenQtyModal(f)}>
                          <PlusCircle size={16} />
                        </button>
                        <button type="button" className="icon-btn text-[#3b82f6]" title="Full Edit" onClick={() => handleOpenEditModal(f)}>
                          <Edit2 size={16} />
                        </button>
                        <button type="button" className="icon-btn text-[var(--danger)]" title="Delete" onClick={() => handleDeleteFrame(f.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8}>
                    <EmptyState title="No items found" sub="Add inventory items to see them here." />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="block md:hidden">
          {framesLoading ? (
            <div className="p-8">
              <EmptyState title="Loading..." sub="Fetching frame stock." />
            </div>
          ) : filteredList.length ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredList.map((f) => (
                <div key={f.id} className="bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--border)] relative flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-[14px] text-[var(--text)]">{f.brand}</div>
                      <div className="text-xs text-[var(--text-muted)] mt-0.5">Model: {f.modelNumber}</div>
                    </div>
                    <div className="flex gap-1.5 items-center">
                      <button type="button" className="icon-btn text-[var(--success)]" title="Add Quantity" onClick={() => handleOpenQtyModal(f)}>
                        <PlusCircle size={16} />
                      </button>
                      <button type="button" className="icon-btn text-[#3b82f6]" title="Full Edit" onClick={() => handleOpenEditModal(f)}>
                        <Edit2 size={16} />
                      </button>
                      <button type="button" className="icon-btn text-destructive" title="Delete" onClick={() => handleDeleteFrame(f.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mt-1 border-t pt-2 border-[var(--border)]">
                    <div><span className="text-[var(--text-muted)]">Color:</span> {f.color || '—'}</div>
                    <div><span className="text-[var(--text-muted)]">Type:</span> {f.frameType || '—'}</div>
                    <div><span className="text-[var(--text-muted)]">Price:</span> {fmt(db.settings.currency, f.price)}</div>
                    <div><span className="text-[var(--text-muted)]">Value:</span> {fmt(db.settings.currency, f.qty * f.price)}</div>
                  </div>
                  <div className="flex justify-between items-center mt-1 pt-2 border-t border-[var(--border)]">
                    <span className="text-xs text-[var(--text-muted)]">In Stock:</span>
                    <span className={`qty-pill ${f.qty <= f.threshold ? 'qty-low' : 'qty-ok'}`}>{f.qty}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8">
              <EmptyState title="No items found" sub="Add inventory items to see them here." />
            </div>
          )}
        </div>
      </div>

      {/* Quick Add Quantity Modal */}
      {qtyModalFrame && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-50 animate-fade-in" onClick={() => setQtyModalFrame(null)}>
          <div 
            className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-6 w-[92%] max-w-[420px] shadow-2xl flex flex-col gap-5 relative animate-zoom-in text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--success-dim)]/20 text-[var(--success)]">
                <PlusCircle size={18} />
              </div>
              <h2 className="text-[16px] font-extrabold font-display tracking-tight text-[var(--text)]">
                Add Stock Quantity
              </h2>
            </div>
            
            <div className="text-[12.5px] text-[var(--text-muted)] leading-relaxed">
              Add stock for <strong>{qtyModalFrame.brand}</strong> ({qtyModalFrame.modelNumber}).
              <div className="bg-[var(--surface-2)] p-3 rounded-lg border border-[var(--border)] font-mono text-[12px] mt-2 flex justify-between">
                <span>Current Qty:</span>
                <span className="font-bold">{qtyModalFrame.qty}</span>
              </div>
            </div>

            <form onSubmit={handleConfirmAddQty} className="flex flex-col gap-4">
              <div className="relative flex items-center border border-[var(--success)] rounded-xl pt-2.5 pb-1">
                <span className="absolute left-3 bottom-3 text-[var(--text-faint)]">
                  <Package size={16} />
                </span>
                <span className="absolute left-9 -top-2.5 bg-[var(--surface)] px-1.5 text-[10px] font-bold text-[var(--success)] select-none">
                  Quantity to Add
                </span>
                <input
                  type="number"
                  required
                  placeholder="0"
                  value={addQtyValue}
                  onChange={(e) => {
                    setAddQtyValue(e.target.value)
                    setQtyModalError(null)
                  }}
                  className="w-full bg-transparent border-none py-1.5 pl-10 pr-4 text-[13.5px] text-[var(--text)] font-semibold outline-none no-spinner"
                  autoFocus
                />
              </div>

              {qtyModalError && (
                <p className="text-[11.5px] text-[var(--danger)] font-medium -mt-2">{qtyModalError}</p>
              )}

              <div className="flex items-center justify-end gap-4 mt-1">
                <button
                  type="button"
                  onClick={() => setQtyModalFrame(null)}
                  disabled={updatingFrame}
                  className="text-[13px] font-semibold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingFrame}
                  className="px-5 py-2.5 rounded-xl bg-[var(--success)] text-white text-[13px] font-bold hover:bg-[var(--success-hover)] transition-colors shadow-sm flex items-center gap-1.5"
                  style={{ backgroundColor: 'var(--success)', borderRadius: '12px' }}
                >
                  <Check size={14} />
                  {updatingFrame ? 'Saving...' : 'Add Quantity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Edit Modal */}
      {editModalFrame && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-50 animate-fade-in" onClick={() => setEditModalFrame(null)}>
          <div 
            className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-6 w-[95%] max-w-[500px] shadow-2xl flex flex-col gap-5 relative animate-zoom-in text-left max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#3b82f6]/15 text-[#3b82f6]">
                <Edit2 size={18} />
              </div>
              <h2 className="text-[16px] font-extrabold font-display tracking-tight text-[var(--text)]">
                Edit Frame Details
              </h2>
            </div>

            <form onSubmit={handleConfirmFullEdit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                
                {/* Brand */}
                <div className="relative flex flex-col gap-1.5">
                  <span className="text-[10.5px] font-bold text-[var(--text-muted)] uppercase tracking-wider ml-0.5">Brand *</span>
                  <input
                    type="text"
                    required
                    value={editBrand}
                    onChange={(e) => setEditBrand(e.target.value)}
                    className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl py-2 px-3.5 text-[13px] text-[var(--text)] outline-none focus:border-[var(--copper)]"
                  />
                </div>

                {/* Model Number */}
                <div className="relative flex flex-col gap-1.5">
                  <span className="text-[10.5px] font-bold text-[var(--text-muted)] uppercase tracking-wider ml-0.5">Model Number *</span>
                  <input
                    type="text"
                    required
                    value={editModel}
                    onChange={(e) => setEditModel(e.target.value)}
                    className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl py-2 px-3.5 text-[13px] text-[var(--text)] outline-none focus:border-[var(--copper)]"
                  />
                </div>

                {/* Color */}
                <div className="relative flex flex-col gap-1.5">
                  <span className="text-[10.5px] font-bold text-[var(--text-muted)] uppercase tracking-wider ml-0.5">Color</span>
                  <input
                    type="text"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl py-2 px-3.5 text-[13px] text-[var(--text)] outline-none focus:border-[var(--copper)]"
                  />
                </div>

                {/* Frame Type */}
                <div className="relative flex flex-col gap-1.5">
                  <span className="text-[10.5px] font-bold text-[var(--text-muted)] uppercase tracking-wider ml-0.5">Frame Type</span>
                  <input
                    type="text"
                    value={editType}
                    placeholder="e.g. Full Rim, Rimless"
                    onChange={(e) => setEditType(e.target.value)}
                    className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl py-2 px-3.5 text-[13px] text-[var(--text)] outline-none focus:border-[var(--copper)]"
                  />
                </div>

                {/* Price */}
                <div className="relative flex flex-col gap-1.5">
                  <span className="text-[10.5px] font-bold text-[var(--text-muted)] uppercase tracking-wider ml-0.5">Unit Price</span>
                  <input
                    type="number"
                    min={0}
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                    className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl py-2 px-3.5 text-[13px] text-[var(--text)] outline-none focus:border-[var(--copper)] no-spinner"
                  />
                </div>

                {/* Quantity */}
                <div className="relative flex flex-col gap-1.5">
                  <span className="text-[10.5px] font-bold text-[var(--text-muted)] uppercase tracking-wider ml-0.5">Total Quantity</span>
                  <input
                    type="number"
                    min={0}
                    value={editQty}
                    onChange={(e) => setEditQty(Number(e.target.value))}
                    className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl py-2 px-3.5 text-[13px] text-[var(--text)] outline-none focus:border-[var(--copper)] no-spinner"
                  />
                </div>

                {/* Threshold */}
                <div className="relative flex flex-col gap-1.5 col-span-2">
                  <span className="text-[10.5px] font-bold text-[var(--text-muted)] uppercase tracking-wider ml-0.5">Low Stock Threshold</span>
                  <input
                    type="number"
                    min={1}
                    value={editThreshold}
                    onChange={(e) => setEditThreshold(Number(e.target.value))}
                    className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl py-2 px-3.5 text-[13px] text-[var(--text)] outline-none focus:border-[var(--copper)] no-spinner"
                  />
                </div>

              </div>

              {editModalError && (
                <p className="text-[11.5px] text-[var(--danger)] font-medium mt-1">{editModalError}</p>
              )}

              <div className="flex items-center justify-end gap-4 mt-3 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setEditModalFrame(null)}
                  disabled={updatingFrame}
                  className="text-[13px] font-semibold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingFrame}
                  className="px-5 py-2.5 rounded-xl text-white text-[13px] font-bold hover:opacity-95 transition-all flex items-center gap-1.5"
                  style={{ backgroundColor: 'var(--copper)', borderRadius: '12px' }}
                >
                  <Check size={14} />
                  {updatingFrame ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </>
    )
  }

  if (isLenses) {
    return (
      <>
        <div className="panel">
        <div className="panel-head">
          <div className="panel-title">
            {group.label} Stock <span className="n">({lenses.length})</span>
          </div>
          <div className="filter-row" style={{ margin: 0, gap: 8 }}>
            <button type="button" className="btn btn-copper" onClick={() => navigate(`/dashboard/inventory/${group.slug}/create`)}>
              <Plus />
              New {group.label} Item
            </button>
          </div>
        </div>
        {/* Desktop View */}
        <div className="table-wrap hidden md:block">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Coating</th>
                <th>Factory</th>
                <th>Price</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lensesLoading ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState title="Loading..." sub="Fetching lens stock." />
                  </td>
                </tr>
              ) : lenses.length ? (
                lenses.map((l) => (
                  <tr key={l.id}>
                    <td>{l.type || '—'}</td>
                    <td>{l.coating || '—'}</td>
                    <td>{l.factory || '—'}</td>
                    <td>{fmt(db.settings.currency, l.price)}</td>
                    <td>
                      <div className="flex gap-2 justify-end">
                        <button type="button" className="icon-btn text-[#3b82f6]" title="Full Edit" onClick={() => handleOpenEditModalLens(l)}>
                          <Edit2 size={16} />
                        </button>
                        <button type="button" className="icon-btn text-[var(--danger)]" title="Delete" onClick={() => handleDeleteLens(l.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5}>
                    <EmptyState title="No items found" sub="Add inventory items to see them here." />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="block md:hidden">
          {lensesLoading ? (
            <div className="p-8">
              <EmptyState title="Loading..." sub="Fetching lens stock." />
            </div>
          ) : lenses.length ? (
            <div className="grid grid-cols-1 gap-4">
              {lenses.map((l) => (
                <div key={l.id} className="bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--border)] relative flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-[14px] text-[var(--text)]">{l.name}</div>
                      <div className="text-xs text-[var(--text-muted)] mt-0.5">Factory: {l.factory || '—'}</div>
                    </div>
                    <div className="flex gap-1.5 items-center">
                      <button type="button" className="icon-btn text-[#3b82f6]" title="Full Edit" onClick={() => handleOpenEditModalLens(l)}>
                        <Edit2 size={16} />
                      </button>
                      <button type="button" className="icon-btn text-destructive" title="Delete" onClick={() => handleDeleteLens(l.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mt-1 border-t pt-2 border-[var(--border)]">
                    <div><span className="text-[var(--text-muted)]">Type:</span> {l.type || '—'}</div>
                    <div><span className="text-[var(--text-muted)]">Coating:</span> {l.coating || '—'}</div>
                    <div className="col-span-2 mt-1"><span className="text-[var(--text-muted)]">Price:</span> {fmt(db.settings.currency, l.price)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8">
              <EmptyState title="No items found" sub="Add inventory items to see them here." />
            </div>
          )}
        </div>
      </div>

      {/* Full Edit Modal */}
      {editModalLens && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-50 animate-fade-in" onClick={() => setEditModalLens(null)}>
          <div 
            className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-6 w-[95%] max-w-[500px] shadow-2xl flex flex-col gap-5 relative animate-zoom-in text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#3b82f6]/15 text-[#3b82f6]">
                <Edit2 size={18} />
              </div>
              <h2 className="text-[16px] font-extrabold font-display tracking-tight text-[var(--text)]">
                Edit Lens Details
              </h2>
            </div>

            <form onSubmit={handleConfirmFullEditLens} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                
                {/* Lens Type */}
                <div className="relative flex flex-col gap-1.5 col-span-2">
                  <span className="text-[10.5px] font-bold text-[var(--text-muted)] uppercase tracking-wider ml-0.5">Lens Type *</span>
                  <input
                    type="text"
                    required
                    value={editLensType}
                    onChange={(e) => setEditLensType(e.target.value)}
                    className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl py-2 px-3.5 text-[13px] text-[var(--text)] outline-none focus:border-[var(--copper)]"
                  />
                </div>

                {/* Coating */}
                <div className="relative flex flex-col gap-1.5">
                  <span className="text-[10.5px] font-bold text-[var(--text-muted)] uppercase tracking-wider ml-0.5">Coating</span>
                  <input
                    type="text"
                    value={editLensCoating}
                    onChange={(e) => setEditLensCoating(e.target.value)}
                    className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl py-2 px-3.5 text-[13px] text-[var(--text)] outline-none focus:border-[var(--copper)]"
                  />
                </div>

                {/* Factory */}
                <div className="relative flex flex-col gap-1.5">
                  <span className="text-[10.5px] font-bold text-[var(--text-muted)] uppercase tracking-wider ml-0.5">Factory</span>
                  <input
                    type="text"
                    value={editLensFactory}
                    onChange={(e) => setEditLensFactory(e.target.value)}
                    className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl py-2 px-3.5 text-[13px] text-[var(--text)] outline-none focus:border-[var(--copper)]"
                  />
                </div>

                {/* Price */}
                <div className="relative flex flex-col gap-1.5 col-span-2">
                  <span className="text-[10.5px] font-bold text-[var(--text-muted)] uppercase tracking-wider ml-0.5">Unit Price</span>
                  <input
                    type="number"
                    min={0}
                    value={editLensPrice}
                    onChange={(e) => setEditLensPrice(Number(e.target.value))}
                    className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl py-2 px-3.5 text-[13px] text-[var(--text)] outline-none focus:border-[var(--copper)] no-spinner"
                  />
                </div>

              </div>

              {editModalLensError && (
                <p className="text-[11.5px] text-[var(--danger)] font-medium mt-1">{editModalLensError}</p>
              )}

              <div className="flex items-center justify-end gap-4 mt-3 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setEditModalLens(null)}
                  disabled={updatingFrame}
                  className="text-[13px] font-semibold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingFrame}
                  className="px-5 py-2.5 rounded-xl text-white text-[13px] font-bold hover:opacity-95 transition-all flex items-center gap-1.5"
                  style={{ backgroundColor: 'var(--copper)', borderRadius: '12px' }}
                >
                  <Check size={14} />
                  {updatingFrame ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </>
    )
  }

  if (isAccessories) {
    const list = filter === 'low' ? accessories.filter((a) => a.qty <= 5) : accessories
    const filteredList = list.filter((a) => {
      const q = searchQuery.toLowerCase().trim()
      if (!q) return true
      return a.name.toLowerCase().includes(q)
    })

    return (
      <>
        <div className="panel">
        <div className="panel-head">
          <div className="panel-title">
            {group.label} Stock <span className="n">({filteredList.length})</span>
          </div>
          <div className="relative w-full md:w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-faint)] pointer-events-none" />
            <input
              type="text"
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg py-1.5 pl-9 pr-4 text-[13px] text-[var(--text)] outline-none focus:border-[var(--copper)] transition-colors"
              placeholder="Search accessories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="filter-row" style={{ margin: 0, gap: 8 }}>
            <button type="button" className={`chip${filter === 'All' ? ' active' : ''}`} onClick={() => setFilter('All')}>
              All
            </button>
            <button type="button" className={`chip${filter === 'low' ? ' active' : ''}`} onClick={() => setFilter('low')}>
              Low stock only
            </button>
            <button type="button" className="btn btn-copper" onClick={() => navigate(`/dashboard/inventory/${group.slug}/create`)}>
              <Plus />
              New {group.label} Item
            </button>
          </div>
        </div>

        {/* Desktop View */}
        <div className="table-wrap hidden md:block">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Value</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {accessoriesLoading ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState title="Loading..." sub="Fetching accessories stock." />
                  </td>
                </tr>
              ) : filteredList.length ? (
                filteredList.map((a) => (
                  <tr key={a.id}>
                    <td>{a.name}</td>
                    <td>
                      <span className={`qty-pill ${a.qty <= 5 ? 'qty-low' : 'qty-ok'}`}>{a.qty}</span>
                    </td>
                    <td>{fmt(db.settings.currency, a.price)}</td>
                    <td>{fmt(db.settings.currency, a.qty * a.price)}</td>
                    <td>
                      <div className="flex gap-2 justify-end">
                        <button type="button" className="icon-btn text-[var(--success)]" title="Add Quantity" onClick={() => handleOpenQtyModalAcc(a)}>
                          <PlusCircle size={16} />
                        </button>
                        <button type="button" className="icon-btn text-[#3b82f6]" title="Full Edit" onClick={() => handleOpenEditModalAcc(a)}>
                          <Edit2 size={16} />
                        </button>
                        <button type="button" className="icon-btn text-[var(--danger)]" title="Delete" onClick={() => handleDeleteAccessory(a.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5}>
                    <EmptyState title="No items found" sub="Add inventory items to see them here." />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="block md:hidden">
          {accessoriesLoading ? (
            <div className="p-8">
              <EmptyState title="Loading..." sub="Fetching accessories stock." />
            </div>
          ) : filteredList.length ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredList.map((a) => (
                <div key={a.id} className="bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--border)] relative flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div className="font-semibold text-[14px] text-[var(--text)]">{a.name}</div>
                    <div className="flex gap-1.5 items-center">
                      <button type="button" className="icon-btn text-[var(--success)]" title="Add Quantity" onClick={() => handleOpenQtyModalAcc(a)}>
                        <PlusCircle size={16} />
                      </button>
                      <button type="button" className="icon-btn text-[#3b82f6]" title="Full Edit" onClick={() => handleOpenEditModalAcc(a)}>
                        <Edit2 size={16} />
                      </button>
                      <button type="button" className="icon-btn text-destructive" title="Delete" onClick={() => handleDeleteAccessory(a.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mt-1 border-t pt-2 border-[var(--border)]">
                    <div><span className="text-[var(--text-muted)]">Price:</span> {fmt(db.settings.currency, a.price)}</div>
                    <div><span className="text-[var(--text-muted)]">Value:</span> {fmt(db.settings.currency, a.qty * a.price)}</div>
                  </div>
                  <div className="flex justify-between items-center mt-1 pt-2 border-t border-[var(--border)]">
                    <span className="text-xs text-[var(--text-muted)]">In Stock:</span>
                    <span className={`qty-pill ${a.qty <= 5 ? 'qty-low' : 'qty-ok'}`}>{a.qty}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8">
              <EmptyState title="No items found" sub="Add inventory items to see them here." />
            </div>
          )}
        </div>
      </div>

      {/* Quick Add Quantity Modal */}
      {qtyModalAcc && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-50 animate-fade-in" onClick={() => setQtyModalAcc(null)}>
          <div 
            className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-6 w-[92%] max-w-[420px] shadow-2xl flex flex-col gap-5 relative animate-zoom-in text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--success-dim)]/20 text-[var(--success)]">
                <PlusCircle size={18} />
              </div>
              <h2 className="text-[16px] font-extrabold font-display tracking-tight text-[var(--text)]">
                Add Stock Quantity
              </h2>
            </div>
            
            <div className="text-[12.5px] text-[var(--text-muted)] leading-relaxed">
              Add stock for accessory <strong>{qtyModalAcc.name}</strong>.
              <div className="bg-[var(--surface-2)] p-3 rounded-lg border border-[var(--border)] font-mono text-[12px] mt-2 flex justify-between">
                <span>Current Qty:</span>
                <span className="font-bold">{qtyModalAcc.qty}</span>
              </div>
            </div>

            <form onSubmit={handleConfirmAddQtyAcc} className="flex flex-col gap-4">
              <div className="relative flex items-center border border-[var(--success)] rounded-xl pt-2.5 pb-1">
                <span className="absolute left-3 bottom-3 text-[var(--text-faint)]">
                  <Package size={16} />
                </span>
                <span className="absolute left-9 -top-2.5 bg-[var(--surface)] px-1.5 text-[10px] font-bold text-[var(--success)] select-none">
                  Quantity to Add
                </span>
                <input
                  type="number"
                  required
                  placeholder="0"
                  value={addQtyAccValue}
                  onChange={(e) => {
                    setAddQtyAccValue(e.target.value)
                    setQtyModalAccError(null)
                  }}
                  className="w-full bg-transparent border-none py-1.5 pl-10 pr-4 text-[13.5px] text-[var(--text)] font-semibold outline-none no-spinner"
                  autoFocus
                />
              </div>

              {qtyModalAccError && (
                <p className="text-[11.5px] text-[var(--danger)] font-medium -mt-2">{qtyModalAccError}</p>
              )}

              <div className="flex items-center justify-end gap-4 mt-1">
                <button
                  type="button"
                  onClick={() => setQtyModalAcc(null)}
                  disabled={updatingFrame}
                  className="text-[13px] font-semibold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingFrame}
                  className="px-5 py-2.5 rounded-xl bg-[var(--success)] text-white text-[13px] font-bold hover:bg-[var(--success-hover)] transition-colors shadow-sm flex items-center gap-1.5"
                  style={{ backgroundColor: 'var(--success)', borderRadius: '12px' }}
                >
                  <Check size={14} />
                  {updatingFrame ? 'Saving...' : 'Add Quantity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Edit Modal */}
      {editModalAcc && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-50 animate-fade-in" onClick={() => setEditModalAcc(null)}>
          <div 
            className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-6 w-[95%] max-w-[480px] shadow-2xl flex flex-col gap-5 relative animate-zoom-in text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#3b82f6]/15 text-[#3b82f6]">
                <Edit2 size={18} />
              </div>
              <h2 className="text-[16px] font-extrabold font-display tracking-tight text-[var(--text)]">
                Edit Accessory Details
              </h2>
            </div>

            <form onSubmit={handleConfirmFullEditAcc} className="flex flex-col gap-4">
              <div className="flex flex-col gap-4">
                
                {/* Name */}
                <div className="relative flex flex-col gap-1.5">
                  <span className="text-[10.5px] font-bold text-[var(--text-muted)] uppercase tracking-wider ml-0.5">Item Name *</span>
                  <input
                    type="text"
                    required
                    value={editAccName}
                    onChange={(e) => setEditAccName(e.target.value)}
                    className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl py-2 px-3.5 text-[13px] text-[var(--text)] outline-none focus:border-[var(--copper)]"
                  />
                </div>

                {/* Price */}
                <div className="relative flex flex-col gap-1.5">
                  <span className="text-[10.5px] font-bold text-[var(--text-muted)] uppercase tracking-wider ml-0.5">Unit Price</span>
                  <input
                    type="number"
                    min={0}
                    value={editAccPrice}
                    onChange={(e) => setEditAccPrice(Number(e.target.value))}
                    className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl py-2 px-3.5 text-[13px] text-[var(--text)] outline-none focus:border-[var(--copper)] no-spinner"
                  />
                </div>

                {/* Quantity */}
                <div className="relative flex flex-col gap-1.5">
                  <span className="text-[10.5px] font-bold text-[var(--text-muted)] uppercase tracking-wider ml-0.5">Quantity</span>
                  <input
                    type="number"
                    min={0}
                    value={editAccQty}
                    onChange={(e) => setEditAccQty(Number(e.target.value))}
                    className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl py-2 px-3.5 text-[13px] text-[var(--text)] outline-none focus:border-[var(--copper)] no-spinner"
                  />
                </div>

              </div>

              {editModalAccError && (
                <p className="text-[11.5px] text-[var(--danger)] font-medium mt-1">{editModalAccError}</p>
              )}

              <div className="flex items-center justify-end gap-4 mt-3 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setEditModalAcc(null)}
                  disabled={updatingFrame}
                  className="text-[13px] font-semibold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingFrame}
                  className="px-5 py-2.5 rounded-xl text-white text-[13px] font-bold hover:opacity-95 transition-all flex items-center gap-1.5"
                  style={{ backgroundColor: 'var(--copper)', borderRadius: '12px' }}
                >
                  <Check size={14} />
                  {updatingFrame ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </>
    )
  }

  const categories = (group as any).categories as readonly string[]
  const items = db.inventory.filter((i) => categories.includes(i.category))
  const list = filter === 'low' ? items.filter((i) => i.qty <= i.threshold) : items

  return (
    <div className="panel">
      <div className="panel-head">
        <div className="panel-title">
          {(group as any).label} Stock <span className="n">({list.length})</span>
        </div>
        <div className="filter-row" style={{ margin: 0, gap: 8 }}>
          <button type="button" className={`chip${filter === 'All' ? ' active' : ''}`} onClick={() => setFilter('All')}>
            All
          </button>
          <button type="button" className={`chip${filter === 'low' ? ' active' : ''}`} onClick={() => setFilter('low')}>
            Low stock only
          </button>
          <button type="button" className="btn btn-copper" onClick={() => navigate(`/dashboard/inventory/${(group as any).slug}/create`)}>
            <Plus />
            New {(group as any).label} Item
          </button>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {list.length ? (
              list.map((i) => (
                <tr key={i.id}>
                  <td>{i.name}</td>
                  <td>
                    <span className="cat-pill">{i.category}</span>
                  </td>
                  <td>
                    <span className={`qty-pill ${i.qty <= i.threshold ? 'qty-low' : 'qty-ok'}`}>{i.qty}</span>
                  </td>
                  <td>{fmt(db.settings.currency, i.price)}</td>
                  <td>{fmt(db.settings.currency, i.qty * i.price)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>
                  <EmptyState title="No items found" sub="Add inventory items to see them here." />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
