import { api } from '@/lib/axios'

export interface Frame {
  id: string
  brand: string
  modelNumber: string
  color?: string
  frameType?: string
  qty: number
  price: number
  threshold: number
  branchId: string
  createdAt: string
  updatedAt: string
}

export interface CreateFrameInput {
  brand: string
  modelNumber: string
  color?: string
  frameType?: string
  qty: number
  price: number
  threshold?: number
}

export type UpdateFrameInput = Partial<CreateFrameInput>

export const frameService = {
  list: () => api.get<Frame[]>('/frames').then((res) => res.data),
  get: (id: string) => api.get<Frame>(`/frames/${id}`).then((res) => res.data),
  create: (input: CreateFrameInput) => api.post<Frame>('/frames', input).then((res) => res.data),
  update: (id: string, input: UpdateFrameInput) => api.patch<Frame>(`/frames/${id}`, input).then((res) => res.data),
  remove: (id: string) => api.delete<{ id: string }>(`/frames/${id}`).then((res) => res.data),
}
