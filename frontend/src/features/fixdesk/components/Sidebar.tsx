import { NavLink } from 'react-router-dom'
import { Wrench, Search, Settings, LayoutDashboard as DashboardIcon } from 'lucide-react'
import { NAV_ITEMS } from './nav'
import { useFixDesk } from '../context/FixDeskContext'

export function Sidebar({ onSearchClick }: { onSearchClick: () => void }) {
  const { db } = useFixDesk()
  const activeRepairCount = db.repairJobs.filter((j) => j.status !== 'Delivered').length
  const activeAccCount = db.accJobs.filter((j) => j.status !== 'Delivered').length
  const counts: Record<string, number | undefined> = { repair: activeRepairCount, accessories: activeAccCount }

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <Wrench size={18} color="#14161c" />
        </div>
        <div className="brand-text">
          <span className="name">FixDesk</span>
          <span className="tag">shop console</span>
        </div>
      </div>

      <nav className="nav">
        <NavLink to="" end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <span className="nav-icon">
            <DashboardIcon />
          </span>
          Dashboard
        </NavLink>

        <div className="nav-label">Work</div>
        {NAV_ITEMS.slice(1, 5).map(({ view, path, label, icon: Icon }) => (
          <NavLink key={view} to={path} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <span className="nav-icon">
              <Icon />
            </span>
            {label}
            {counts[view] !== undefined && <span className="count">{counts[view]}</span>}
          </NavLink>
        ))}

        <div className="nav-divider" />

        <button type="button" className="nav-item" onClick={onSearchClick}>
          <span className="nav-icon">
            <Search />
          </span>
          Search
        </button>
        <NavLink to="settings" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
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
