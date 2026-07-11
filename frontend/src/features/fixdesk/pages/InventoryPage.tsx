import { useRef, useState, type FormEvent } from 'react'
import { Check } from 'lucide-react'
import { useFixDesk } from '../context/FixDeskContext'
import { EmptyState } from '../components/EmptyState'
import { fmt } from '../utils'
import { INVENTORY_CATEGORIES } from '../types'

export function InventoryPage() {
  const { db, addInventoryItem, showToast } = useFixDesk()
  const [filter, setFilter] = useState<'All' | 'low'>('All')
  const formRef = useRef<HTMLFormElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const categoryRef = useRef<HTMLSelectElement>(null)
  const qtyRef = useRef<HTMLInputElement>(null)
  const priceRef = useRef<HTMLInputElement>(null)
  const thresholdRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    addInventoryItem({
      name: nameRef.current!.value.trim(),
      category: categoryRef.current!.value,
      qty: Number(qtyRef.current!.value || 0),
      price: Number(priceRef.current!.value || 0),
      threshold: Number(thresholdRef.current!.value || 5),
    })
    formRef.current?.reset()
    if (thresholdRef.current) thresholdRef.current.value = '5'
    showToast('Item added to inventory')
  }

  const list = filter === 'low' ? db.inventory.filter((i) => i.qty <= i.threshold) : db.inventory

  return (
    <div className="grid-2">
      <div className="panel" style={{ gridColumn: '1/-1' }}>
        <div className="panel-title" style={{ marginBottom: 16 }}>
          Add Inventory Item
        </div>
        <form ref={formRef} onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field">
              <label>Item Name *</label>
              <input required ref={nameRef} placeholder="e.g. iPhone 13 Screen" />
            </div>
            <div className="field">
              <label>Category</label>
              <select ref={categoryRef} defaultValue="Screens">
                {INVENTORY_CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Quantity *</label>
              <input required type="number" min={0} ref={qtyRef} placeholder="0" />
            </div>
            <div className="field">
              <label>Unit Price (Rs.) *</label>
              <input required type="number" min={0} ref={priceRef} placeholder="0" />
            </div>
            <div className="field">
              <label>Low Stock Alert Below</label>
              <input type="number" min={0} ref={thresholdRef} defaultValue={5} />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-copper">
              <Check />
              Add to Inventory
            </button>
            <button type="reset" className="btn btn-ghost">
              Clear
            </button>
          </div>
        </form>
      </div>

      <div className="panel" style={{ gridColumn: '1/-1' }}>
        <div className="panel-head">
          <div className="panel-title">
            Stock List <span className="n">({list.length})</span>
          </div>
          <div className="filter-row" style={{ margin: 0 }}>
            <button type="button" className={`chip${filter === 'All' ? ' active' : ''}`} onClick={() => setFilter('All')}>
              All
            </button>
            <button type="button" className={`chip${filter === 'low' ? ' active' : ''}`} onClick={() => setFilter('low')}>
              Low stock only
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
                    <EmptyState title="No items found" sub="Add inventory items using the form above." />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
