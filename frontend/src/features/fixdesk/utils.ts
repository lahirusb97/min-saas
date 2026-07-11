import type { JobStatus } from './types'

export function fmt(currency: string, n: number) {
  return (currency || 'Rs.') + ' ' + Number(n || 0).toLocaleString('en-LK')
}

export function timeAgo(ts: number) {
  const diff = Date.now() - ts
  const h = Math.floor(diff / 3600000)
  if (h < 1) return Math.floor(diff / 60000) + 'm ago'
  if (h < 24) return h + 'h ago'
  return Math.floor(h / 24) + 'd ago'
}

const STAMP_CLASS: Record<JobStatus, string> = {
  Pending: 'stamp-pending',
  'In Progress': 'stamp-progress',
  Completed: 'stamp-completed',
  Delivered: 'stamp-delivered',
}

export function stampClass(status: JobStatus) {
  return STAMP_CLASS[status] ?? 'stamp-pending'
}
