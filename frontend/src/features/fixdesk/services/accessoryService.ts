import { api } from '@/lib/axios'

export interface Accessory {
  id: number
  name: string
  qty: number
  price: number
  createdAt: string
  updatedAt: string
}

export interface CreateAccessoryInput {
  name: string
  qty: number
  price: number
}

export type UpdateAccessoryInput = Partial<CreateAccessoryInput>

export const accessoryService = {
  list: () => api.get<Accessory[]>('/accessories').then((res) => res.data),
  get: (id: number) => api.get<Accessory>(`/accessories/${id}`).then((res) => res.data),
  create: (input: CreateAccessoryInput) => api.post<Accessory>('/accessories', input).then((res) => res.data),
  update: (id: number, input: UpdateAccessoryInput) => api.patch<Accessory>(`/accessories/${id}`, input).then((res) => res.data),
  remove: (id: number) => api.delete<{ id: number }>(`/accessories/${id}`).then((res) => res.data),
}
