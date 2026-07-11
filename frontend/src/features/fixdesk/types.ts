export type JobStatus = 'Pending' | 'In Progress' | 'Completed' | 'Delivered'

export const JOB_STATUSES: JobStatus[] = ['Pending', 'In Progress', 'Completed', 'Delivered']

export interface Customer {
  id: number
  name: string
  phone: string
  nic: string
  email: string
  address: string
  notes: string
  createdAt: number
}

export interface RepairJob {
  id: number
  ticketNo: string
  customer: string
  phone: string
  device: string
  issue: string
  status: JobStatus
  cost: number
  advance: number
  createdAt: number
}

export interface AccJob {
  id: number
  ticketNo: string
  customer: string
  phone: string
  item: string
  details: string
  price: number
  status: JobStatus
  createdAt: number
}

export interface InventoryItem {
  id: number
  name: string
  category: string
  qty: number
  price: number
  threshold: number
}

export interface ShopSettings {
  name: string
  phone: string
  whatsapp: string
  address: string
  currency: string
  hours: string
}

export interface FixDeskDB {
  customers: Customer[]
  repairJobs: RepairJob[]
  accJobs: AccJob[]
  inventory: InventoryItem[]
  settings: ShopSettings
  counters: { repair: number; acc: number }
}

export const INVENTORY_CATEGORIES = [
  'Screens',
  'Batteries',
  'Chargers',
  'Cases & Covers',
  'Tempered Glass',
  'Cables',
  'Tools',
  'Other',
]
