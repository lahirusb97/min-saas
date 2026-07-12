import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { AccJob, Customer, FixDeskDB, InventoryItem, Prescription, RepairJob, ShopSettings } from '../types'
import { seedDB } from './seed'

const STORE_KEY = 'fixdesk-data'

function loadDB(): FixDeskDB {
  try {
    const raw = window.localStorage.getItem(STORE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as FixDeskDB
      if (!parsed.expenses) parsed.expenses = []
      return parsed
    }
  } catch {
    /* storage unavailable or corrupt, fall back to seed */
  }
  const seeded = seedDB()
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(seeded))
  } catch {
    /* ignore, run in-memory only */
  }
  return seeded
}

interface FixDeskContextValue {
  db: FixDeskDB
  addCustomer: (input: Omit<Customer, 'id' | 'createdAt'>) => void
  addRepairJob: (input: Omit<RepairJob, 'id' | 'ticketNo' | 'createdAt'>) => RepairJob
  addAccJob: (input: Omit<AccJob, 'id' | 'ticketNo' | 'createdAt'>) => AccJob
  addInventoryItem: (input: Omit<InventoryItem, 'id'>) => void
  addPrescription: (input: Omit<Prescription, 'id' | 'serialNo' | 'createdAt'>) => Prescription
  updateSettings: (settings: ShopSettings) => void
  updateJobStatus: (type: 'Prescr.' | 'Repair' | 'Access.', id: number, nextStatus: 'Pending' | 'Delivered' | 'Cancelled') => void
  deleteJob: (type: 'Prescr.' | 'Repair' | 'Access.', id: number) => void
  recordRepayment: (type: 'Prescr.' | 'Repair' | 'Access.', id: number, amount: number) => void
  addExpense: (description: string, amount: number, dateStr?: string) => void
  editExpense: (id: number, description: string, amount: number) => void
  deleteExpense: (id: number) => void
  toast: string | null
  showToast: (msg: string) => void
  editingJob: { type: 'Order' | 'Repair' | 'Accessories', id: number } | null
  setEditingJob: (job: { type: 'Order' | 'Repair' | 'Accessories', id: number } | null) => void
  updatePrescription: (id: number, input: Omit<Prescription, 'id' | 'serialNo' | 'createdAt'>) => void
  updateRepairJob: (id: number, input: Omit<RepairJob, 'id' | 'ticketNo' | 'createdAt'>) => void
  updateAccJob: (id: number, input: Omit<AccJob, 'id' | 'ticketNo' | 'createdAt'>) => void
}

const FixDeskContext = createContext<FixDeskContextValue | null>(null)

export function FixDeskProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<FixDeskDB>(loadDB)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(db))
    } catch {
      /* storage unavailable, running in-memory only */
    }
  }, [db])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2200)
  }, [])

  const addCustomer = useCallback((input: Omit<Customer, 'id' | 'createdAt'>) => {
    setDb((prev) => ({
      ...prev,
      customers: [{ ...input, id: Date.now(), createdAt: Date.now() }, ...prev.customers],
    }))
  }, [])

  const addRepairJob = useCallback((input: Omit<RepairJob, 'id' | 'ticketNo' | 'createdAt'>) => {
    const job = { ...input } as RepairJob
    setDb((prev) => {
      const nextCounter = prev.counters.repair + 1
      job.id = Date.now()
      job.ticketNo = 'RJ-' + nextCounter
      job.createdAt = Date.now()
      return {
        ...prev,
        repairJobs: [job, ...prev.repairJobs],
        counters: { ...prev.counters, repair: nextCounter },
      }
    })
    return job
  }, [])

  const addAccJob = useCallback((input: Omit<AccJob, 'id' | 'ticketNo' | 'createdAt'>) => {
    const job = { ...input } as AccJob
    setDb((prev) => {
      const nextCounter = prev.counters.acc + 1
      job.id = Date.now()
      job.ticketNo = 'AC-' + nextCounter
      job.createdAt = Date.now()
      return {
        ...prev,
        accJobs: [job, ...prev.accJobs],
        counters: { ...prev.counters, acc: nextCounter },
      }
    })
    return job
  }, [])

  const addInventoryItem = useCallback((input: Omit<InventoryItem, 'id'>) => {
    setDb((prev) => ({
      ...prev,
      inventory: [{ ...input, id: Date.now() }, ...prev.inventory],
    }))
  }, [])

  const addPrescription = useCallback((input: Omit<Prescription, 'id' | 'serialNo' | 'createdAt'>) => {
    const prescription = { ...input } as Prescription
    setDb((prev) => {
      const nextCounter = (prev.counters.prescription || 6) + 1
      prescription.id = Date.now()
      prescription.serialNo = String(nextCounter).padStart(4, '0')
      prescription.createdAt = Date.now()

      // Ensure the customer is saved to customers list
      const customerExists = prev.customers.some(
        (c) => c.phone.trim() === input.phone.trim()
      )
      const updatedCustomers = customerExists
        ? prev.customers
        : [
            {
              id: Date.now() - 1,
              name: input.name,
              phone: input.phone,
              nic: input.nic,
              email: '',
              address: input.address,
              notes: input.note,
              createdAt: Date.now(),
            },
            ...prev.customers,
          ]

      return {
        ...prev,
        customers: updatedCustomers,
        prescriptions: [prescription, ...(prev.prescriptions || [])],
        counters: { ...prev.counters, prescription: nextCounter },
      }
    })
    return prescription
  }, [])

  const updateSettings = useCallback((settings: ShopSettings) => {
    setDb((prev) => ({ ...prev, settings }))
  }, [])

  const updateJobStatus = useCallback((type: 'Prescr.' | 'Repair' | 'Access.', id: number, nextStatus: 'Pending' | 'Delivered' | 'Cancelled') => {
    setDb((prev) => {
      if (type === 'Prescr.') {
        return {
          ...prev,
          prescriptions: prev.prescriptions.map(p => p.id === id ? { ...p, status: nextStatus } : p)
        }
      } else if (type === 'Repair') {
        return {
          ...prev,
          repairJobs: prev.repairJobs.map(r => r.id === id ? { ...r, status: nextStatus } : r)
        }
      } else {
        return {
          ...prev,
          accJobs: prev.accJobs.map(a => a.id === id ? { ...a, status: nextStatus } : a)
        }
      }
    })
  }, [])

  const deleteJob = useCallback((type: 'Prescr.' | 'Repair' | 'Access.', id: number) => {
    setDb((prev) => {
      if (type === 'Prescr.') {
        return {
          ...prev,
          prescriptions: prev.prescriptions.filter(p => p.id !== id)
        }
      } else if (type === 'Repair') {
        return {
          ...prev,
          repairJobs: prev.repairJobs.filter(r => r.id !== id)
        }
      } else {
        return {
          ...prev,
          accJobs: prev.accJobs.filter(a => a.id !== id)
        }
      }
    })
  }, [])

  const recordRepayment = useCallback((type: 'Prescr.' | 'Repair' | 'Access.', id: number, amount: number) => {
    setDb((prev) => {
      if (type === 'Prescr.') {
        return {
          ...prev,
          prescriptions: prev.prescriptions.map(p => {
            if (p.id === id) {
              const nextPayment = p.payment + amount
              const nextBalance = Math.max(0, p.total - p.discount - nextPayment)
              return { ...p, payment: nextPayment, balance: nextBalance }
            }
            return p
          })
        }
      } else if (type === 'Repair') {
        return {
          ...prev,
          repairJobs: prev.repairJobs.map(r => {
            if (r.id === id) {
              const nextAdvance = r.advance + amount
              return { ...r, advance: nextAdvance }
            }
            return r
          })
        }
      } else {
        return {
          ...prev,
          accJobs: prev.accJobs.map(a => {
            if (a.id === id) {
              const nextAdvance = (a.advance || 0) + amount
              return { ...a, advance: nextAdvance }
            }
            return a
          })
        }
      }
    })
  }, [])

  const addExpense = useCallback((description: string, amount: number, dateStr?: string) => {
    setDb((prev) => {
      let createdAt = Date.now()
      if (dateStr) {
        const selected = new Date(dateStr)
        const now = new Date()
        selected.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds())
        createdAt = selected.getTime()
      }
      const nextExpense = {
        id: Date.now(),
        description: description.trim(),
        amount,
        createdAt
      }
      return {
        ...prev,
        expenses: [nextExpense, ...(prev.expenses || [])]
      }
    })
  }, [])

  const editExpense = useCallback((id: number, description: string, amount: number) => {
    setDb((prev) => ({
      ...prev,
      expenses: (prev.expenses || []).map(e => e.id === id ? { ...e, description: description.trim(), amount } : e)
    }))
  }, [])

  const deleteExpense = useCallback((id: number) => {
    setDb((prev) => ({
      ...prev,
      expenses: (prev.expenses || []).filter(e => e.id !== id)
    }))
  }, [])

  const [editingJob, setEditingJob] = useState<{ type: 'Order' | 'Repair' | 'Accessories', id: number } | null>(null)

  const updatePrescription = useCallback((id: number, input: Omit<Prescription, 'id' | 'serialNo' | 'createdAt'>) => {
    setDb((prev) => ({
      ...prev,
      prescriptions: (prev.prescriptions || []).map(p => p.id === id ? { ...p, ...input } : p)
    }))
  }, [])

  const updateRepairJob = useCallback((id: number, input: Omit<RepairJob, 'id' | 'ticketNo' | 'createdAt'>) => {
    setDb((prev) => ({
      ...prev,
      repairJobs: (prev.repairJobs || []).map(r => r.id === id ? { ...r, ...input } : r)
    }))
  }, [])

  const updateAccJob = useCallback((id: number, input: Omit<AccJob, 'id' | 'ticketNo' | 'createdAt'>) => {
    setDb((prev) => ({
      ...prev,
      accJobs: (prev.accJobs || []).map(a => a.id === id ? { ...a, ...input } : a)
    }))
  }, [])

  const value = useMemo(
    () => ({ 
      db, 
      addCustomer, 
      addRepairJob, 
      addAccJob, 
      addInventoryItem, 
      addPrescription, 
      updateSettings, 
      updateJobStatus, 
      deleteJob, 
      recordRepayment, 
      addExpense, 
      editExpense, 
      deleteExpense, 
      toast, 
      showToast,
      editingJob,
      setEditingJob,
      updatePrescription,
      updateRepairJob,
      updateAccJob
    }),
    [
      db, 
      addCustomer, 
      addRepairJob, 
      addAccJob, 
      addInventoryItem, 
      addPrescription, 
      updateSettings, 
      updateJobStatus, 
      deleteJob, 
      recordRepayment, 
      addExpense, 
      editExpense, 
      deleteExpense, 
      toast, 
      showToast,
      editingJob,
      updatePrescription,
      updateRepairJob,
      updateAccJob
    ],
  )

  return <FixDeskContext.Provider value={value}>{children}</FixDeskContext.Provider>
}

export function useFixDesk() {
  const ctx = useContext(FixDeskContext)
  if (!ctx) throw new Error('useFixDesk must be used within a FixDeskProvider')
  return ctx
}
