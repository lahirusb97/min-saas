import { useRef, useState, type FormEvent } from 'react'
import { Check } from 'lucide-react'
import { useFixDesk } from '../context/FixDeskContext'
import { EmptyState } from '../components/EmptyState'
import { TicketCard } from '../components/TicketCard'
import { fmt } from '../utils'
import { JOB_STATUSES, type JobStatus } from '../types'

export function AccessoriesPage() {
  const { db, addAccJob, showToast } = useFixDesk()
  const [filter, setFilter] = useState<'All' | JobStatus>('All')
  const formRef = useRef<HTMLFormElement>(null)
  const customerRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)
  const itemRef = useRef<HTMLInputElement>(null)
  const statusRef = useRef<HTMLSelectElement>(null)
  const detailsRef = useRef<HTMLTextAreaElement>(null)
  const priceRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const job = addAccJob({
      customer: customerRef.current!.value.trim(),
      phone: phoneRef.current!.value.trim(),
      item: itemRef.current!.value.trim(),
      details: detailsRef.current!.value.trim(),
      status: statusRef.current!.value as JobStatus,
      price: Number(priceRef.current!.value || 0),
    })
    formRef.current?.reset()
    showToast(`Accessory ticket ${job.ticketNo} created`)
  }

  const list = db.accJobs.filter((j) => filter === 'All' || j.status === filter).sort((a, b) => b.createdAt - a.createdAt)

  return (
    <div className="grid-2">
      <div className="panel">
        <div className="panel-title" style={{ marginBottom: 16 }}>
          New Accessories Job
        </div>
        <form ref={formRef} onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field">
              <label>Customer Name *</label>
              <input required ref={customerRef} list="custDatalist" placeholder="Select or type name" />
            </div>
            <div className="field">
              <label>Phone Number *</label>
              <input required ref={phoneRef} placeholder="07X XXX XXXX" />
            </div>
            <div className="field">
              <label>Item / Accessory *</label>
              <input required ref={itemRef} placeholder="e.g. Tempered Glass, Case, Charger" />
            </div>
            <div className="field">
              <label>Status</label>
              <select ref={statusRef} defaultValue="Pending">
                {JOB_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="field full">
              <label>Details</label>
              <textarea ref={detailsRef} placeholder="e.g. Fit tempered glass for Samsung A54, install screen protector" />
            </div>
            <div className="field">
              <label>Price (Rs.)</label>
              <input type="number" min={0} ref={priceRef} placeholder="0" />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-copper">
              <Check />
              Create Job Ticket
            </button>
            <button type="reset" className="btn btn-ghost">
              Clear
            </button>
          </div>
        </form>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div className="panel-title">
            Accessories Tickets <span className="n">({list.length})</span>
          </div>
        </div>
        <div className="filter-row">
          {(['All', ...JOB_STATUSES] as const).map((s) => (
            <button key={s} type="button" className={`chip${filter === s ? ' active' : ''}`} onClick={() => setFilter(s)}>
              {s}
            </button>
          ))}
        </div>
        <div>
          {list.length ? (
            list.map((j) => (
              <TicketCard
                key={j.id}
                ticketNo={j.ticketNo}
                title={j.item}
                customer={j.customer}
                phone={j.phone}
                status={j.status}
                createdAt={j.createdAt}
                priceLabel={fmt(db.settings.currency, j.price)}
              />
            ))
          ) : (
            <EmptyState title="No accessory jobs" sub="Try a different filter or create a new job." />
          )}
        </div>
      </div>
    </div>
  )
}
