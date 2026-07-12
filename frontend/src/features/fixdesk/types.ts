export type JobStatus = 'Pending' | 'In Progress' | 'Completed' | 'Delivered' | 'Cancelled'

export const JOB_STATUSES: JobStatus[] = ['Pending', 'In Progress', 'Completed', 'Delivered', 'Cancelled']

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

export interface EyeDetails {
  sph: string
  cyl: string
  axis: string
  add: string
  va: string
}

export interface Prescription {
  id: number
  serialNo: string
  createdAt: number
  
  // Customer Details
  name: string
  phone: string
  nic: string
  address: string
  note: string
  dob: string
  age: number

  // Vision Details
  hasVisionDetails: boolean
  rightEye: EyeDetails
  leftEye: EyeDetails
  pd: string
  height: string

  // Frame Selection
  frameType: 'inventory' | 'manual'
  frameBrand: string
  frameCode: string
  frameColor: string
  framePrice: number

  // Lens Selection
  lensType: 'inventory' | 'manual'
  lensSide: 'Both' | 'Right' | 'Left'
  lensFactory: string
  lensTypeName: string
  lensCoating: string
  lensPrice: number

  prescriptionNote: string

  // Payment Details
  total: number
  discount: number
  payment: number
  balance: number
  dueDate?: string
  status?: 'Pending' | 'Delivered' | 'Cancelled'
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
  dueDate?: string
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
  advance?: number
  dueDate?: string
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

export interface Expense {
  id: number
  description: string
  amount: number
  createdAt: number
}

export interface FixDeskDB {
  customers: Customer[]
  repairJobs: RepairJob[]
  accJobs: AccJob[]
  inventory: InventoryItem[]
  prescriptions: Prescription[]
  expenses?: Expense[]
  settings: ShopSettings
  counters: { repair: number; acc: number; prescription: number }
}

export const INVENTORY_CATEGORIES = [
  'Frames',
  'Lenses',
  'Screens',
  'Batteries',
  'Chargers',
  'Cases & Covers',
  'Tempered Glass',
  'Cables',
  'Tools',
  'Other',
]
