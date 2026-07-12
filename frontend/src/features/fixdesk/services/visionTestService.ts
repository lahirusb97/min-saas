import { api } from '@/lib/axios'

export interface VisionTest {
  id: number
  customerId: number
  hasVisionDetails: boolean
  rSph?: string
  rCyl?: string
  rAxis?: string
  rAdd?: string
  rVa?: string
  lSph?: string
  lCyl?: string
  lAxis?: string
  lAdd?: string
  lVa?: string
  pd?: string
  height?: string
  rightPd?: string
  leftPd?: string
  rightHeight?: string
  leftHeight?: string
  refractionRemark?: string
  sugar: boolean
  cataract: boolean
  abnormalities?: string
  organizationId: number
  branchId: number
  createdAt: string
}

export interface CreateVisionTestInput {
  customerId: number
  hasVisionDetails?: boolean
  rSph?: string
  rCyl?: string
  rAxis?: string
  rAdd?: string
  rVa?: string
  lSph?: string
  lCyl?: string
  lAxis?: string
  lAdd?: string
  lVa?: string
  pd?: string
  height?: string
  rightPd?: string
  leftPd?: string
  rightHeight?: string
  leftHeight?: string
  refractionRemark?: string
  sugar?: boolean
  cataract?: boolean
  abnormalities?: string
}

export const visionTestService = {
  create: (input: CreateVisionTestInput) => api.post<VisionTest>('/vision-tests', input).then((res) => res.data),
  listByCustomer: (customerId: number) =>
    api.get<VisionTest[]>(`/vision-tests/customer/${customerId}`).then((res) => res.data),
  get: (id: number) => api.get<VisionTest>(`/vision-tests/${id}`).then((res) => res.data),
  update: (id: number, input: Partial<CreateVisionTestInput>) =>
    api.patch<VisionTest>(`/vision-tests/${id}`, input).then((res) => res.data),
}
