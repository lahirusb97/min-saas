import { api } from '@/lib/axios'

export type SourceType = 'inventory' | 'manual'
export type LensSide = 'Both' | 'Right' | 'Left'
export type OrderStatus = 'Pending' | 'Delivered' | 'Cancelled'

export type OrderItemType = 'frame' | 'lens'

export interface OrderItem {
  id: number
  itemType: OrderItemType
  sourceType: SourceType
  frameStockId?: number
  lensId?: number
  side?: LensSide
  brand?: string
  code?: string
  color?: string
  price: number
  qty: number
  lineTotal: number
}

export interface Order {
  id: number
  invoiceNo: string
  customerId: number
  visionTestId?: number
  items: OrderItem[]
  prescriptionNote?: string
  subTotal: number
  discount: number
  total: number
  payment: number
  balance: number
  dueDate?: string
  status: OrderStatus
  organizationId: number
  branchId: number
  createdAt: string
  updatedAt: string
  customerName?: string
  customerPhone?: string
}

export interface CreateOrderInput {
  customerId: number
  visionTestId?: number
  frameSourceType: SourceType
  frameStockId?: number
  frameBrand?: string
  frameCode?: string
  frameColor?: string
  framePrice: number
  lensSourceType: SourceType
  lensId?: number
  lensSide: LensSide
  lensFactory?: string
  lensTypeName?: string
  lensCoating?: string
  lensPrice: number
  prescriptionNote?: string
  discount?: number
  payment?: number
  dueDate?: string
  status?: OrderStatus
}

export type UpdateOrderInput = Partial<CreateOrderInput>

export const orderService = {
  list: () => api.get<Order[]>('/orders').then((res) => res.data),
  get: (id: number) => api.get<Order>(`/orders/${id}`).then((res) => res.data),
  create: (input: CreateOrderInput) => api.post<Order>('/orders', input).then((res) => res.data),
  update: (id: number, input: UpdateOrderInput) => api.patch<Order>(`/orders/${id}`, input).then((res) => res.data),
  remove: (id: number) => api.delete<{ id: number }>(`/orders/${id}`).then((res) => res.data),
}
