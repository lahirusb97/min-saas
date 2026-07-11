import { useRef, type FormEvent } from 'react'
import { Check } from 'lucide-react'
import { useFixDesk } from '../context/FixDeskContext'
import { EmptyState } from '../components/EmptyState'
import { timeAgo } from '../utils'

export function CustomerPage() {
  const { db, addCustomer, showToast } = useFixDesk()
  const formRef = useRef<HTMLFormElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)
  const nicRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const addressRef = useRef<HTMLTextAreaElement>(null)
  const notesRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    addCustomer({
      name: nameRef.current!.value.trim(),
      phone: phoneRef.current!.value.trim(),
      nic: nicRef.current!.value.trim(),
      email: emailRef.current!.value.trim(),
      address: addressRef.current!.value.trim(),
      notes: notesRef.current!.value.trim(),
    })
    formRef.current?.reset()
    showToast('Customer saved')
  }

  const list = [...db.customers].sort((a, b) => b.createdAt - a.createdAt)

  return (
    <div className="grid-2">
      <div className="panel">
        <div className="panel-title" style={{ marginBottom: 16 }}>
          Add New Customer
        </div>
        <form ref={formRef} onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field">
              <label>Full Name *</label>
              <input required ref={nameRef} placeholder="e.g. Kasun Perera" />
            </div>
            <div className="field">
              <label>Phone Number *</label>
              <input required ref={phoneRef} placeholder="07X XXX XXXX" />
            </div>
            <div className="field">
              <label>NIC / ID (optional)</label>
              <input ref={nicRef} placeholder="e.g. 200012345678" />
            </div>
            <div className="field">
              <label>Email (optional)</label>
              <input type="email" ref={emailRef} placeholder="name@email.com" />
            </div>
            <div className="field full">
              <label>Address</label>
              <textarea ref={addressRef} placeholder="No, street, city" />
            </div>
            <div className="field full">
              <label>Notes</label>
              <input ref={notesRef} placeholder="Any note about this customer" />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-copper">
              <Check />
              Save Customer
            </button>
            <button type="reset" className="btn btn-ghost">
              Clear
            </button>
          </div>
        </form>
      </div>
      <div className="panel">
        <div className="panel-title" style={{ marginBottom: 10 }}>
          Customers <span className="n">({db.customers.length})</span>
        </div>
        <div className="list-mini">
          {list.length ? (
            list.map((c) => (
              <div className="mini-row" key={c.id}>
                <div>
                  <div className="mini-name">{c.name}</div>
                  <div className="mini-sub">
                    {c.phone}
                    {c.address ? ` · ${c.address}` : ''}
                  </div>
                </div>
                <span className="mini-sub">{timeAgo(c.createdAt)}</span>
              </div>
            ))
          ) : (
            <EmptyState title="No customers yet" sub="Add your first customer using the form." />
          )}
        </div>
      </div>
    </div>
  )
}
