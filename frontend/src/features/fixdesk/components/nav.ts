import { LayoutDashboard, UserPlus, Wrench, Layers, Boxes, Settings } from 'lucide-react'

export const NAV_ITEMS = [
  { view: 'dashboard', path: '', label: 'Dashboard', icon: LayoutDashboard, bottomLabel: 'Home' },
  { view: 'customer', path: 'customer', label: 'New Customer', icon: UserPlus, bottomLabel: 'Customer' },
  { view: 'repair', path: 'repair', label: 'Repair Job', icon: Wrench, bottomLabel: 'Repair' },
  { view: 'accessories', path: 'accessories', label: 'Accessories invoice', icon: Layers, bottomLabel: 'Access.' },
  { view: 'inventory', path: 'inventory', label: 'Inventory', icon: Boxes, bottomLabel: 'Stock' },
  { view: 'settings', path: 'settings', label: 'Shop Settings', icon: Settings, bottomLabel: 'Settings' },
] as const

export const PAGE_TITLES: Record<string, [string, string]> = {
  dashboard: ['Dashboard', 'OVERVIEW'],
  customer: ['New Customer', 'CUSTOMER MANAGEMENT'],
  repair: ['Repair Jobs', 'PHONE & DEVICE REPAIRS'],
  accessories: ['Accessories invoice', 'ACCESSORY FITTING & SALES'],
  inventory: ['Inventory', 'STOCK MANAGEMENT'],
  settings: ['Shop Settings', 'SHOP PROFILE'],
}
