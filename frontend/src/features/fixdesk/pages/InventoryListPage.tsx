import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { useFixDesk } from '../context/FixDeskContext'
import { EmptyState } from '../components/EmptyState'
import { fmt } from '../utils'
import { useInventoryGroup } from '../hooks/useInventoryGroup'
import { frameService, type Frame } from '../services/frameService'

export function InventoryListPage() {
  const group = useInventoryGroup()
  const { db, showToast } = useFixDesk()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<'All' | 'low'>('All')
  const isFrames = group?.slug === 'frames'

  const [frames, setFrames] = useState<Frame[]>([])
  const [loading, setLoading] = useState(isFrames)

  useEffect(() => {
    if (!isFrames) return
    setLoading(true)
    frameService
      .list()
      .then(setFrames)
      .finally(() => setLoading(false))
  }, [isFrames])

  if (!group) {
    return <Navigate to="/dashboard/inventory" replace />
  }

  async function handleDeleteFrame(id: number) {
    await frameService.remove(id)
    setFrames((prev) => prev.filter((f) => f.id !== id))
    showToast('Frame removed')
  }

  if (isFrames) {
    const list = filter === 'low' ? frames.filter((f) => f.qty <= f.threshold) : frames

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
                <th>Details</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Value</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState title="Loading..." sub="Fetching frame stock." />
                  </td>
                </tr>
              ) : list.length ? (
                list.map((f) => (
                  <tr key={f.id}>
                    <td>{[f.brand, f.modelNumber].filter(Boolean).join(' ')}</td>
                    <td>
                      <span className="text-muted-foreground text-xs">
                        {[f.brand, f.modelNumber, f.color, f.frameType].filter(Boolean).join(' · ') || '—'}
                      </span>
                    </td>
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
                  <td colSpan={6}>
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

  const categories = group.categories as readonly string[]
  const items = db.inventory.filter((i) => categories.includes(i.category))
  const list = filter === 'low' ? items.filter((i) => i.qty <= i.threshold) : items
  const isLenses = group.slug === 'lenses'

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
              {isLenses ? <th>Details</th> : <th>Category</th>}
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
                  {isLenses ? (
                    <td>
                      <span className="text-muted-foreground text-xs">
                        {[i.lensType, i.lensCoating, i.lensFactory].filter(Boolean).join(' · ') || '—'}
                      </span>
                    </td>
                  ) : (
                    <td>
                      <span className="cat-pill">{i.category}</span>
                    </td>
                  )}
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
