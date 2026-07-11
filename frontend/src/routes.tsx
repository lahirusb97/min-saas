import { createBrowserRouter } from 'react-router-dom'
import App from './App'
import Home from './pages/Home'
import About from './pages/About'
import { DashboardLayout } from './features/fixdesk/layout/DashboardLayout'
import { DashboardHome } from './features/fixdesk/pages/DashboardHome'
import { CustomerPage } from './features/fixdesk/pages/CustomerPage'
import { RepairPage } from './features/fixdesk/pages/RepairPage'
import { AccessoriesPage } from './features/fixdesk/pages/AccessoriesPage'
import { InventoryPage } from './features/fixdesk/pages/InventoryPage'
import { SettingsPage } from './features/fixdesk/pages/SettingsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'about', element: <About /> },
    ],
  },
  {
    path: '/dashboard',
    element: <DashboardLayout />,
    children: [
      { index: true, element: <DashboardHome /> },
      { path: 'customer', element: <CustomerPage /> },
      { path: 'repair', element: <RepairPage /> },
      { path: 'accessories', element: <AccessoriesPage /> },
      { path: 'inventory', element: <InventoryPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
])
