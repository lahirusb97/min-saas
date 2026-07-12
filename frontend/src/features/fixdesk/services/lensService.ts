import { api } from '@/lib/axios'

export interface Lens {
  id: number
  name: string
  type?: string
  coating?: string
  factory?: string
  price: number
  organizationId: number
  createdAt: string
  updatedAt: string
}

export interface CreateLensInput {
  name: string
  type?: string
  coating?: string
  factory?: string
  price: number
}

export type UpdateLensInput = Partial<CreateLensInput>

export const lensService = {
  list: () => api.get<Lens[]>('/lenses').then((res) => res.data),
  get: (id: number) => api.get<Lens>(`/lenses/${id}`).then((res) => res.data),
  create: (input: CreateLensInput) => api.post<Lens>('/lenses', input).then((res) => res.data),
  update: (id: number, input: UpdateLensInput) => api.patch<Lens>(`/lenses/${id}`, input).then((res) => res.data),
  remove: (id: number) => api.delete<{ id: number }>(`/lenses/${id}`).then((res) => res.data),
  listFactories: () => api.get<string[]>('/lenses/factories').then((res) => res.data),
}
