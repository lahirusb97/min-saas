import { Check } from 'lucide-react'
import { useFixDesk } from '../context/FixDeskContext'

export function Toast() {
  const { toast } = useFixDesk()
  return (
    <div className={`toast${toast ? ' show' : ''}`}>
      <Check />
      <span>{toast}</span>
    </div>
  )
}
