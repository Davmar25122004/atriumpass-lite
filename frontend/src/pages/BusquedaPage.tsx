import { useState } from 'react'
import { apiFetch } from '../api/client'
import { Search, User } from 'lucide-react'

interface PersonResult {
  id: string; first_name: string; last_name: string; dni: string; email: string; node_name: string
}

function avatarClass(name: string) {
  let hash = 0
  for (const c of name) hash = (hash + c.charCodeAt(0)) % 10
  return `relleno${hash}`
}

export default function BusquedaPage() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<PersonResult[]>([])
  const [searched, setSearched] = useState(false)

  const handleSearch = async () => {
    if (!q.trim()) return
    const res = await apiFetch<{ data: PersonResult[] }>(`/persons?q=${encodeURIComponent(q)}&limit=50`)
    setResults(res.data); setSearched(true)
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--vp-text-heading)' }}>Busqueda Global</h2>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-2.5" style={{ color: 'var(--vp-text-muted)' }} />
          <input placeholder="Buscar por nombre, DNI o email..." value={q}
            onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="w-full pl-8 pr-3 py-2 rounded-md border text-sm" style={{ background: 'var(--vp-bg-card)', borderColor: 'var(--vp-border-card)' }} />
        </div>
        <button onClick={handleSearch} className="px-4 py-2 rounded-md text-white text-sm" style={{ background: 'var(--vp-primary)' }}>Buscar</button>
      </div>

      {searched && results.length === 0 && (
        <p className="text-center py-8" style={{ color: 'var(--vp-text-muted)' }}>Sin resultados para "{q}"</p>
      )}

      <div className="space-y-2">
        {results.map(p => {
          const name = `${p.first_name} ${p.last_name}`
          const initials = `${p.first_name[0]}${p.last_name[0]}`.toUpperCase()
          return (
            <div key={p.id} className="glass-card p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${avatarClass(name)}`}>{initials}</div>
              <div className="flex-1">
                <p className="font-medium" style={{ color: 'var(--vp-text-heading)' }}>{name}</p>
                <p className="text-xs" style={{ color: 'var(--vp-text-muted)' }}>{p.dni || ''} · {p.email || ''} · {p.node_name || ''}</p>
              </div>
              <User size={16} style={{ color: 'var(--vp-text-muted)' }} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
