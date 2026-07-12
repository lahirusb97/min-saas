import { useEffect, useRef, useState, type RefObject } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Settings, Sun, Moon, LogOut } from 'lucide-react'
import { useFixDesk } from '../context/FixDeskContext'
import { clearToken } from '@/lib/auth'
import { fmt } from '../utils'
import { PAGE_TITLES } from './nav'

interface TopbarProps {
  view: string
  searchInputRef: RefObject<HTMLInputElement | null>
  theme: 'dark' | 'light'
  onToggleTheme: () => void
}

export function Topbar({ view, searchInputRef, theme, onToggleTheme }: TopbarProps) {
  const { db } = useFixDesk()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [title, sub] = PAGE_TITLES[view] ?? PAGE_TITLES.dashboard
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setShowResults(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  const q = query.trim().toLowerCase()
  const custMatches = q ? db.customers.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)).slice(0, 4) : []
  const repairMatches = q
    ? db.repairJobs.filter((j) => j.ticketNo.toLowerCase().includes(q) || j.device.toLowerCase().includes(q) || j.customer.toLowerCase().includes(q)).slice(0, 4)
    : []
  const accMatches = q
    ? db.accJobs.filter((j) => j.ticketNo.toLowerCase().includes(q) || j.item.toLowerCase().includes(q) || j.customer.toLowerCase().includes(q)).slice(0, 4)
    : []
  const invMatches = q ? db.inventory.filter((i) => i.name.toLowerCase().includes(q)).slice(0, 4) : []
  const hasAnyMatch = custMatches.length || repairMatches.length || accMatches.length || invMatches.length

  function go(path: string) {
    setShowResults(false)
    navigate(path)
  }

  function handleLogout() {
    clearToken()
    navigate('/login')
  }

  return (
    <div className="topbar">
      <div>
        <div className="page-title">{title}</div>
        <div className="page-sub">
          {sub} · <span>{today}</span>
        </div>
      </div>
      <div className="search-wrap" ref={wrapRef}>
        <Search className="search-icon" />
        <input
          ref={searchInputRef}
          className="search-input"
          placeholder="Search customer, ticket, device, item..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setShowResults(!!e.target.value.trim())
          }}
          onFocus={() => setShowResults(!!query.trim())}
        />
        <div className={`search-results${showResults ? ' show' : ''}`}>
          {!hasAnyMatch && <div className="sr-empty">No matches found</div>}
          {custMatches.length > 0 && (
            <>
              <div className="sr-group-label">Customers</div>
              {custMatches.map((c) => (
                <button key={c.id} type="button" className="sr-item" onClick={() => go('/dashboard/customer')}>
                  <span className="sr-title">{c.name}</span>
                  <span className="sr-meta">{c.phone}</span>
                </button>
              ))}
            </>
          )}
          {repairMatches.length > 0 && (
            <>
              <div className="sr-group-label">Repair Jobs</div>
              {repairMatches.map((j) => (
                <button key={j.id} type="button" className="sr-item" onClick={() => go('/dashboard/repair')}>
                  <span className="sr-title">
                    {j.ticketNo} · {j.device}
                  </span>
                  <span className="sr-meta">
                    {j.customer} · {j.status}
                  </span>
                </button>
              ))}
            </>
          )}
          {accMatches.length > 0 && (
            <>
              <div className="sr-group-label">Accessories invoice</div>
              {accMatches.map((j) => (
                <button key={j.id} type="button" className="sr-item" onClick={() => go('/dashboard/accessories')}>
                  <span className="sr-title">
                    {j.ticketNo} · {j.item}
                  </span>
                  <span className="sr-meta">
                    {j.customer} · {j.status}
                  </span>
                </button>
              ))}
            </>
          )}
          {invMatches.length > 0 && (
            <>
              <div className="sr-group-label">Inventory</div>
              {invMatches.map((i) => (
                <button key={i.id} type="button" className="sr-item" onClick={() => go('/dashboard/inventory')}>
                  <span className="sr-title">{i.name}</span>
                  <span className="sr-meta">
                    {i.qty} in stock · {fmt(db.settings.currency, i.price)}
                  </span>
                </button>
              ))}
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button 
          type="button" 
          className="icon-btn" 
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title={theme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"} 
          onClick={onToggleTheme}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <button type="button" className="icon-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Shop Settings" onClick={() => navigate('/dashboard/settings')}>
          <Settings size={18} />
        </button>
        <button type="button" className="icon-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Log out" onClick={handleLogout}>
          <LogOut size={18} />
        </button>
      </div>
    </div>
  )
}
