import { useEffect, useState, useCallback } from 'react'
import { apiFetch } from '../api/client'
import { Search, CheckCircle, XCircle } from 'lucide-react'

interface LogEntry {
  id: string; timestamp: string; person_id: string; first_name: string; last_name: string;
  access_point_id: string; point_name: string; direction: string; method_used: string;
  granted: boolean; deny_reason: string; device_id: string
}

export default function AuditPage() {
  const [data, setData] = useState<LogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [grantedFilter, setGrantedFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: '30' })
    if (q) params.set('q', q)
    if (grantedFilter !== '') params.set('granted', grantedFilter)
    if (dateFrom) params.set('from', dateFrom)
    if (dateTo) params.set('to', dateTo)
    const res = await apiFetch<{ data: LogEntry[]; total: number }>(`/access-logs?${params}`)
    setData(res.data); setTotal(res.total)
  }, [page, q, grantedFilter, dateFrom, dateTo])

  useEffect(() => { load() }, [load])

  const totalPages = Math.ceil(total / 30)

  return (
    <div>
      <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--vp-text-heading)' }}>Auditoria de Accesos</h2>

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-2.5" style={{ color: 'var(--vp-text-muted)' }} />
          <input placeholder="Buscar persona..." value={q} onChange={e => { setQ(e.target.value); setPage(1) }}
            className="w-full pl-8 pr-3 py-2 rounded-md border text-sm" style={{ background: 'var(--vp-bg-card)', borderColor: 'var(--vp-border-card)' }} />
        </div>
        <select value={grantedFilter} onChange={e => { setGrantedFilter(e.target.value); setPage(1) }}
          className="border rounded-md px-3 py-2 text-sm" style={{ background: 'var(--vp-bg-card)', borderColor: 'var(--vp-border-card)' }}>
          <option value="">Todos</option>
          <option value="true">Permitidos</option>
          <option value="false">Denegados</option>
        </select>
        <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1) }}
          className="border rounded-md px-3 py-2 text-sm" style={{ background: 'var(--vp-bg-card)', borderColor: 'var(--vp-border-card)' }} />
        <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1) }}
          className="border rounded-md px-3 py-2 text-sm" style={{ background: 'var(--vp-bg-card)', borderColor: 'var(--vp-border-card)' }} />
      </div>

      <div className="glass-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr style={{ background: 'var(--vp-table-header-bg)' }}>
            <th className="px-4 py-3 text-left text-xs uppercase" style={{ color: 'var(--vp-text-muted)' }}>Fecha/Hora</th>
            <th className="px-4 py-3 text-left text-xs uppercase" style={{ color: 'var(--vp-text-muted)' }}>Persona</th>
            <th className="px-4 py-3 text-left text-xs uppercase" style={{ color: 'var(--vp-text-muted)' }}>Punto</th>
            <th className="px-4 py-3 text-left text-xs uppercase" style={{ color: 'var(--vp-text-muted)' }}>Dir.</th>
            <th className="px-4 py-3 text-left text-xs uppercase" style={{ color: 'var(--vp-text-muted)' }}>Metodo</th>
            <th className="px-4 py-3 text-left text-xs uppercase" style={{ color: 'var(--vp-text-muted)' }}>Resultado</th>
            <th className="px-4 py-3 text-left text-xs uppercase" style={{ color: 'var(--vp-text-muted)' }}>Motivo</th>
          </tr></thead>
          <tbody>
            {data.map(l => (
              <tr key={l.id} className="border-t" style={{ borderColor: 'var(--vp-border-divider)' }}>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--vp-text-muted)' }}>{new Date(l.timestamp).toLocaleString()}</td>
                <td className="px-4 py-3" style={{ color: 'var(--vp-text-heading)' }}>{l.first_name} {l.last_name}</td>
                <td className="px-4 py-3" style={{ color: 'var(--vp-text-body)' }}>{l.point_name}</td>
                <td className="px-4 py-3" style={{ color: 'var(--vp-text-body)' }}>{l.direction}</td>
                <td className="px-4 py-3" style={{ color: 'var(--vp-text-body)' }}>{l.method_used}</td>
                <td className="px-4 py-3">
                  {l.granted ? (
                    <span className="badge-status in flex items-center gap-1"><CheckCircle size={12} /> Permitido</span>
                  ) : (
                    <span className="badge-status out flex items-center gap-1"><XCircle size={12} /> Denegado</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--vp-text-muted)' }}>{l.deny_reason || '—'}</td>
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center" style={{ color: 'var(--vp-text-muted)' }}>Sin registros</td></tr>}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => (
            <button key={i} onClick={() => setPage(i + 1)} className="px-3 py-1 rounded-md text-sm"
              style={{ background: page === i + 1 ? 'var(--vp-primary)' : 'var(--vp-gray-100)', color: page === i + 1 ? 'white' : 'var(--vp-text-body)' }}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
