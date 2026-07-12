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

  // Backend linkage (set once this order is persisted to the API)
  backendOrderId?: number
  backendCustomerId?: number
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
  brand?: string
  modelNumber?: string
  color?: string
  frameType?: string
  lensType?: string
  lensCoating?: string
  lensFactory?: string
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

export const INVENTORY_GROUPS = {
  frames: { slug: 'frames', label: 'Frames', categories: ['Frames'] },
  lenses: { slug: 'lenses', label: 'Lenses', categories: ['Lenses'] },
  accessories: {
    slug: 'accessories',
    label: 'Accessories',
    categories: ['Screens', 'Batteries', 'Chargers', 'Cases & Covers', 'Tempered Glass', 'Cables', 'Tools', 'Other'],
  },
} as const

export type InventoryGroupSlug = keyof typeof INVENTORY_GROUPS

export const FRAME_TYPES = ['Full Rim', 'Half Rim', 'Rimless']

export const LENS_TYPES = ['Single Vision', 'Bifocal', 'Progressive', 'Photochromic']

export const LENS_COATINGS = ['Anti-Glare', 'Blue Cut', 'UV Protection', 'Scratch Resistant']
