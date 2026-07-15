import { api } from '@/lib/axios'

export interface Frame {
  id: number
  brand: string
  modelNumber: string
  color?: string
  frameType?: string
  qty: number
  price: number
  threshold: number
  branchId: number
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

export interface FrameBrowseResult {
  brands: string[]
  codes: string[]
  colors: string[]
  items: Frame[]
}

export const frameService = {
  list: () => api.get<Frame[]>('/frames').then((res) => res.data),
  get: (id: number) => api.get<Frame>(`/frames/${id}`).then((res) => res.data),
  create: (input: CreateFrameInput) => api.post<Frame>('/frames', input).then((res) => res.data),
  update: (id: number, input: UpdateFrameInput) => api.patch<Frame>(`/frames/${id}`, input).then((res) => res.data),
  remove: (id: number) => api.delete<{ id: number }>(`/frames/${id}`).then((res) => res.data),
  listBrands: () => api.get<string[]>('/frames/brands').then((res) => res.data),
  listModels: (brand?: string) =>
    api.get<string[]>('/frames/models', { params: brand ? { brand } : undefined }).then((res) => res.data),
  listColors: () => api.get<string[]>('/frames/colors').then((res) => res.data),
  browse: (params: { brand?: string; code?: string; color?: string } = {}) =>
    api
      .get<FrameBrowseResult>('/frames/browse', {
        params: {
          brand: params.brand || undefined,
          code: params.code || undefined,
          color: params.color || undefined,
        },
      })
      .then((res) => res.data),
}
