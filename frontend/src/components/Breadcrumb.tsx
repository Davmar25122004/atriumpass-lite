import { ChevronRight } from 'lucide-react'

interface BreadcrumbProps {
  pathId: string
  onNavigate?: (nodeId: string) => void
}

export default function Breadcrumb({ pathId, onNavigate }: BreadcrumbProps) {
  const parts = pathId ? pathId.split('.') : []

  return (
    <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--vp-text-muted)' }}>
      {parts.map((part, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight size={12} />}
          <button
            onClick={() => onNavigate?.(parts.slice(0, i + 1).join('.'))}
            className="hover:underline"
            style={{ color: i === parts.length - 1 ? 'var(--vp-text-heading)' : 'var(--vp-text-muted)' }}
          >
            {part}
          </button>
        </span>
      ))}
    </div>
  )
}
