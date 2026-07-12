import { useNavigate } from 'react-router-dom'
import { UserPlus, Wrench, Layers, Boxes, Search, Settings } from 'lucide-react'

const TILES = [
  { path: 'customer', label: 'New Customer', desc: 'Add a customer record', icon: UserPlus, color: '232,163,61', stroke: 'var(--copper)' },
  { path: 'repair', label: 'Repair Job', desc: 'Create or view repair tickets', icon: Wrench, color: '79,209,197', stroke: 'var(--teal)' },
  { path: 'accessories', label: 'Accessories invoice', desc: 'Create or view accessory tickets', icon: Layers, color: '156,124,244', stroke: '#9C7CF4' },
  { path: 'inventory', label: 'Inventory', desc: 'Manage stock levels', icon: Boxes, color: '240,98,95', stroke: 'var(--danger)' },
]

export function DashboardHome() {
  const navigate = useNavigate()

  return (
    <section>
      <div className="menu-intro">
        <div className="menu-title">What do you want to do?</div>
        <div className="menu-sub">Pick an option below to get started.</div>
      </div>
      <div className="menu-grid">
        {TILES.map(({ path, label, desc, icon: Icon, color, stroke }) => (
          <button key={path} type="button" className="menu-tile" onClick={() => navigate(path)}>
            <span className="menu-icon" style={{ background: `rgba(${color},0.14)` }}>
              <Icon stroke={stroke} strokeWidth={1.7} />
            </span>
            <span className="menu-label">{label}</span>
            <span className="menu-desc">{desc}</span>
          </button>
        ))}

        <button type="button" className="menu-tile" onClick={() => navigate('search')}>
          <span className="menu-icon" style={{ background: 'rgba(107,203,119,0.14)' }}>
            <Search stroke="var(--success)" strokeWidth={1.7} />
          </span>
          <span className="menu-label">Search</span>
          <span className="menu-desc">Find customer, ticket or item</span>
        </button>

        <button type="button" className="menu-tile" onClick={() => navigate('settings')}>
          <span className="menu-icon" style={{ background: 'rgba(139,144,163,0.16)' }}>
            <Settings stroke="var(--text-muted)" strokeWidth={1.7} />
          </span>
          <span className="menu-label">Shop Settings</span>
          <span className="menu-desc">Update shop profile</span>
        </button>
      </div>
    </section>
  )
}
