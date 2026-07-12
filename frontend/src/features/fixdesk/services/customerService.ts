import { api } from '@/lib/axios'

export interface Customer {
  id: number
  name: string
  phone: string
  nic?: string
  address?: string
  dob?: string
  note?: string
  organizationId: number
  createdAt: string
  updatedAt: string
}

export interface UpsertCustomerInput {
  name: string
  phone: string
  nic?: string
  address?: string
  dob?: string
  note?: string
}

export const customerService = {
  list: (search?: string) =>
    api.get<Customer[]>('/customers', { params: search ? { search } : undefined }).then((res) => res.data),
  get: (id: number) => api.get<Customer>(`/customers/${id}`).then((res) => res.data),
  upsert: (input: UpsertCustomerInput) => api.post<Customer>('/customers', input).then((res) => res.data),
  update: (id: number, input: Partial<UpsertCustomerInput>) =>
    api.patch<Customer>(`/customers/${id}`, input).then((res) => res.data),
}
