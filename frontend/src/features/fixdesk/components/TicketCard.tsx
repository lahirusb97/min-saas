import { stampClass, timeAgo } from '../utils'
import type { JobStatus } from '../types'

interface TicketCardProps {
  ticketNo: string
  title: string
  customer: string
  phone: string
  status: JobStatus
  createdAt: number
  priceLabel: string
}

export function TicketCard({ ticketNo, title, customer, phone, status, createdAt, priceLabel }: TicketCardProps) {
  return (
    <div className="ticket">
      <div className="ticket-id">{ticketNo}</div>
      <div className="ticket-body">
        <div className="ticket-top">
          <span className="ticket-device">{title}</span>
          <span className={`stamp ${stampClass(status)}`}>{status}</span>
        </div>
        <div className="ticket-cust">
          {customer} · {phone}
        </div>
        <div className="ticket-meta">
          <span>{timeAgo(createdAt)}</span>
        </div>
      </div>
      <div className="ticket-right">
        <span className="ticket-price">{priceLabel}</span>
      </div>
    </div>
  )
}
