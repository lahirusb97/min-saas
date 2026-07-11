import { useRef, useState, type FormEvent } from 'react'
import { Check } from 'lucide-react'
import { useFixDesk } from '../context/FixDeskContext'
import { EmptyState } from '../components/EmptyState'
import { TicketCard } from '../components/TicketCard'
import { fmt } from '../utils'
import { JOB_STATUSES, type JobStatus } from '../types'

export function RepairPage() {
  const { db, addRepairJob, showToast } = useFixDesk()
  const [filter, setFilter] = useState<'All' | JobStatus>('All')
  const formRef = useRef<HTMLFormElement>(null)
  const customerRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)
  const deviceRef = useRef<HTMLInputElement>(null)
  const statusRef = useRef<HTMLSelectElement>(null)
  const issueRef = useRef<HTMLTextAreaElement>(null)
  const costRef = useRef<HTMLInputElement>(null)
  const advanceRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const job = addRepairJob({
      customer: customerRef.current!.value.trim(),
      phone: phoneRef.current!.value.trim(),
      device: deviceRef.current!.value.trim(),
      issue: issueRef.current!.value.trim(),
      status: statusRef.current!.value as JobStatus,
      cost: Number(costRef.current!.value || 0),
      advance: Number(advanceRef.current!.value || 0),
    })
    formRef.current?.reset()
    showToast(`Repair ticket ${job.ticketNo} created`)
  }

  const list = db.repairJobs.filter((j) => filter === 'All' || j.status === filter).sort((a, b) => b.createdAt - a.createdAt)

  return (
    <div className="grid-2">
      <div className="panel">
        <div className="panel-title" style={{ marginBottom: 16 }}>
          New Repair Job
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
              <label>Device *</label>
              <input required ref={deviceRef} placeholder="e.g. iPhone 13 Pro" />
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
              <label>Issue Description *</label>
              <textarea required ref={issueRef} placeholder="e.g. Screen cracked, battery draining fast" />
            </div>
            <div className="field">
              <label>Estimated Cost (Rs.)</label>
              <input type="number" min={0} ref={costRef} placeholder="0" />
            </div>
            <div className="field">
              <label>Advance Paid (Rs.)</label>
              <input type="number" min={0} ref={advanceRef} placeholder="0" />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-teal">
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
            Repair Tickets <span className="n">({list.length})</span>
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
                title={j.device}
                customer={j.customer}
                phone={j.phone}
                status={j.status}
                createdAt={j.createdAt}
                priceLabel={fmt(db.settings.currency, j.cost)}
              />
            ))
          ) : (
            <EmptyState title="No repair jobs" sub="Try a different filter or create a new job." />
          )}
        </div>
      </div>
    </div>
  )
}
