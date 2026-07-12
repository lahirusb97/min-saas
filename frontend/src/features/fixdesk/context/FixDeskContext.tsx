import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { AccJob, Customer, FixDeskDB, InventoryItem, Prescription, RepairJob, ShopSettings } from '../types'
import { seedDB } from './seed'

const STORE_KEY = 'fixdesk-data'

function loadDB(): FixDeskDB {
  try {
    const raw = window.localStorage.getItem(STORE_KEY)
    if (raw) return JSON.parse(raw) as FixDeskDB
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
  toast: string | null
  showToast: (msg: string) => void
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

  const value = useMemo(
    () => ({ db, addCustomer, addRepairJob, addAccJob, addInventoryItem, addPrescription, updateSettings, updateJobStatus, deleteJob, toast, showToast }),
    [db, addCustomer, addRepairJob, addAccJob, addInventoryItem, addPrescription, updateSettings, updateJobStatus, deleteJob, toast, showToast],
  )

  return <FixDeskContext.Provider value={value}>{children}</FixDeskContext.Provider>
}

export function useFixDesk() {
  const ctx = useContext(FixDeskContext)
  if (!ctx) throw new Error('useFixDesk must be used within a FixDeskProvider')
  return ctx
}
