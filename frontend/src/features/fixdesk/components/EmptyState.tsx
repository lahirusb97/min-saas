import { FileStack } from 'lucide-react'

export function EmptyState({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="empty-state">
      <FileStack strokeWidth={1.3} />
      <p>
        <strong style={{ color: 'var(--text-muted)' }}>{title}</strong>
        <br />
        {sub}
      </p>
    </div>
  )
}
