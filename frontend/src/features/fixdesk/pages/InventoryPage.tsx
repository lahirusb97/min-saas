import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Glasses, ScanEye, Layers, Plus, List } from 'lucide-react'
import { useFixDesk } from '../context/FixDeskContext'
import { fmt } from '../utils'
import { INVENTORY_GROUPS } from '../types'
import { frameService, type Frame } from '../services/frameService'

const CARDS = [
  { slug: 'frames', icon: Glasses, color: '232,163,61', stroke: 'var(--copper)' },
  { slug: 'lenses', icon: ScanEye, color: '79,209,197', stroke: 'var(--teal)' },
  { slug: 'accessories', icon: Layers, color: '156,124,244', stroke: '#9C7CF4' },
] as const

export function InventoryPage() {
  const { db } = useFixDesk()
  const navigate = useNavigate()
  const [frames, setFrames] = useState<Frame[]>([])

  useEffect(() => {
    frameService.list().then(setFrames)
  }, [])

  return (
    <section>
      <div className="menu-intro">
        <div className="menu-title">Inventory</div>
        <div className="menu-sub">Pick a category to manage stock.</div>
      </div>
      <div className="menu-grid">
        {CARDS.map(({ slug, icon: Icon, color, stroke }) => {
          const group = INVENTORY_GROUPS[slug]
          const isFrames = slug === 'frames'
          const items = isFrames ? frames : db.inventory.filter((i) => (group.categories as readonly string[]).includes(i.category))
          const totalQty = items.reduce((sum, i) => sum + i.qty, 0)
          const totalValue = items.reduce((sum, i) => sum + i.qty * i.price, 0)

          return (
            <div key={slug} className="menu-tile" style={{ width: '100%' }}>
              <span className="menu-icon" style={{ background: `rgba(${color},0.14)` }}>
                <Icon stroke={stroke} strokeWidth={1.7} />
              </span>
              <span className="menu-label">{group.label}</span>
              <span className="menu-desc">
                {items.length} item{items.length === 1 ? '' : 's'} · {totalQty} in stock · {fmt(db.settings.currency, totalValue)}
              </span>
              <div style={{ display: 'flex', gap: 8, marginTop: 4, width: '100%' }}>
                <button
                  type="button"
                  className="btn btn-copper"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => navigate(`${slug}/create`)}
                >
                  <Plus />
                  Create New
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => navigate(`${slug}/list`)}
                >
                  <List />
                  View List
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
