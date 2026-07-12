import { NavLink } from 'react-router-dom'
import { Search, Settings, LayoutDashboard as DashboardIcon, TrendingUp } from 'lucide-react'
import { NAV_ITEMS } from './nav'
import { useFixDesk } from '../context/FixDeskContext'

export function Sidebar() {
  const { db, setEditingJob } = useFixDesk()
  const activeRepairCount = db.repairJobs.filter((j) => j.status !== 'Delivered').length
  const activeAccCount = db.accJobs.filter((j) => j.status !== 'Delivered').length
  const counts: Record<string, number | undefined> = { repair: activeRepairCount, accessories: activeAccCount }

  return (
    <aside className="sidebar flex flex-col justify-between">
      <div>
        <div className="sidebar-head">
          <div className="flex items-center gap-2">
            <div className="logo-sq">fd</div>
            <div className="logo-text">FixDesk</div>
          </div>
          <span className="tag">shop console</span>
        </div>
      </div>

      <nav className="nav">
        <NavLink to="" end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={() => setEditingJob(null)}>
          <span className="nav-icon">
            <DashboardIcon />
          </span>
          Dashboard
        </NavLink>

        <div className="nav-label">Work</div>
        {NAV_ITEMS.slice(1, 5).map(({ view, path, label, icon: Icon }) => (
          <NavLink key={view} to={path} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={() => setEditingJob(null)}>
            <span className="nav-icon">
              <Icon />
            </span>
            {label}
            {counts[view] !== undefined && <span className="count">{counts[view]}</span>}
          </NavLink>
        ))}

        <div className="nav-divider" />

        <NavLink to="search" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={() => setEditingJob(null)}>
          <span className="nav-icon">
            <Search />
          </span>
          Search
        </NavLink>
        <NavLink to="accounts" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={() => setEditingJob(null)}>
          <span className="nav-icon">
            <TrendingUp />
          </span>
          Accounts
        </NavLink>
        <NavLink to="settings" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={() => setEditingJob(null)}>
          <span className="nav-icon">
            <Settings />
          </span>
          Shop Settings
        </NavLink>
      </nav>

      <div className="sidebar-foot">
        <div className="shop-avatar">{(db.settings.name || 'S').trim().charAt(0).toUpperCase()}</div>
        <div className="sidebar-foot-text">
          <span className="fname">{db.settings.name}</span>
          <span className="fstatus">
            <span className="shop-dot" />
            Open now
          </span>
        </div>
      </div>
    </aside>
  )
}
