import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from './nav'

export function BottomNav() {
  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ view, path, icon: Icon, bottomLabel }) => (
        <NavLink
          key={view}
          to={path}
          end={view === 'dashboard'}
          className={({ isActive }) => `bn-item${isActive ? ' active' : ''}`}
        >
          <Icon />
          {bottomLabel}
        </NavLink>
      ))}
    </nav>
  )
}
