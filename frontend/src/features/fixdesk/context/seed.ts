import type { FixDeskDB } from '../types'

export function seedDB(): FixDeskDB {
  const now = Date.now()
  return {
    customers: [
      { id: 1, name: 'Kasun Perera', phone: '0771234567', nic: '', email: '', address: 'Negombo', notes: '', createdAt: now - 86400000 * 3 },
      { id: 2, name: 'Ishara Fernando', phone: '0759876543', nic: '', email: '', address: 'Wattala', notes: '', createdAt: now - 86400000 * 2 },
      { id: 3, name: 'Nadeesha Silva', phone: '0712345678', nic: '', email: '', address: 'Katunayake', notes: '', createdAt: now - 86400000 },
    ],
    repairJobs: [
      { id: 1, ticketNo: 'RJ-1001', customer: 'Kasun Perera', phone: '0771234567', device: 'iPhone 13 Pro', issue: 'Cracked screen replacement', status: 'In Progress', cost: 18500, advance: 5000, createdAt: now - 3600000 * 20 },
      { id: 2, ticketNo: 'RJ-1002', customer: 'Ishara Fernando', phone: '0759876543', device: 'Samsung A54', issue: 'Battery draining fast, needs replacement', status: 'Pending', cost: 6500, advance: 0, createdAt: now - 3600000 * 5 },
      { id: 3, ticketNo: 'RJ-1003', customer: 'Nadeesha Silva', phone: '0712345678', device: 'Redmi Note 12', issue: 'Charging port not working', status: 'Completed', cost: 3200, advance: 3200, createdAt: now - 3600000 * 40 },
    ],
    accJobs: [
      { id: 1, ticketNo: 'AC-2001', customer: 'Kasun Perera', phone: '0771234567', item: 'Tempered Glass', details: 'Fit tempered glass, edge to edge', price: 1200, status: 'Delivered', createdAt: now - 3600000 * 30 },
      { id: 2, ticketNo: 'AC-2002', customer: 'Nadeesha Silva', phone: '0712345678', item: 'Phone Case', details: 'Silicone case, black', price: 900, status: 'Pending', createdAt: now - 3600000 * 2 },
    ],
    inventory: [
      { id: 1, name: 'Rayban 47584T Black', category: 'Frames', qty: 5, price: 3000, threshold: 2 },
      { id: 2, name: 'Oakley OAK102 Gray', category: 'Frames', qty: 3, price: 4500, threshold: 1 },
      { id: 3, name: 'Solex Single vision Blu cut', category: 'Lenses', qty: 20, price: 1000, threshold: 5 },
      { id: 4, name: 'Essilor Progressive Crizal', category: 'Lenses', qty: 10, price: 2500, threshold: 2 },
      { id: 5, name: 'iPhone 13 Screen (OLED)', category: 'Screens', qty: 3, price: 16000, threshold: 2 },
      { id: 6, name: 'USB-C Charger 20W', category: 'Chargers', qty: 24, price: 1500, threshold: 5 },
      { id: 7, name: 'Tempered Glass (Universal)', category: 'Tempered Glass', qty: 2, price: 350, threshold: 10 },
    ],
    prescriptions: [],
    settings: {
      name: 'FixDesk Vision Care',
      phone: '077 123 4567',
      whatsapp: '077 123 4567',
      address: 'No. 45, Main Street, Negombo',
      currency: 'Rs.',
      hours: '9.00 AM - 8.00 PM',
    },
    counters: { repair: 1003, acc: 2002, prescription: 6 },
  }
}
