import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Plus, Trash2, Search } from 'lucide-react'
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
                      <button type="button" className="icon-btn" title="Delete" onClick={() => handleDeleteFrame(f.id)}>
                        <Trash2 size={16} />
                      </button>
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
                    <button type="button" className="icon-btn text-destructive" title="Delete" onClick={() => handleDeleteFrame(f.id)}>
                      <Trash2 size={16} />
                    </button>
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
    )
  }

  if (isLenses) {
    return (
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
                      <button type="button" className="icon-btn" title="Delete" onClick={() => handleDeleteLens(l.id)}>
                        <Trash2 size={16} />
                      </button>
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
                    <button type="button" className="icon-btn text-destructive" title="Delete" onClick={() => handleDeleteLens(l.id)}>
                      <Trash2 size={16} />
                    </button>
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
                      <button type="button" className="icon-btn" title="Delete" onClick={() => handleDeleteAccessory(a.id)}>
                        <Trash2 size={16} />
                      </button>
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
                    <button type="button" className="icon-btn text-destructive" title="Delete" onClick={() => handleDeleteAccessory(a.id)}>
                      <Trash2 size={16} />
                    </button>
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
    )
  }

  const categories = group.categories as readonly string[]
  const items = db.inventory.filter((i) => categories.includes(i.category))
  const list = filter === 'low' ? items.filter((i) => i.qty <= i.threshold) : items

  return (
    <div className="panel">
      <div className="panel-head">
        <div className="panel-title">
          {group.label} Stock <span className="n">({list.length})</span>
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
