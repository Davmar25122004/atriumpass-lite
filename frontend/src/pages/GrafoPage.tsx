import { useEffect, useState, useCallback } from 'react'
import { apiFetch } from '../api/client'

interface Node { id: string; name: string; parent_id?: string; type_color?: string; type_label?: string; path_id?: string }

export default function GrafoPage() {
  const [nodes, setNodes] = useState<Node[]>([])

  const load = useCallback(async () => {
    const data = await apiFetch<Node[]>('/instances')
    setNodes(data)
  }, [])

  useEffect(() => { load() }, [load])

  // Simple SVG graph layout — tree levels by depth
  const nodesByDepth = new Map<number, Node[]>()
  for (const n of nodes) {
    const depth = n.path_id ? n.path_id.split('.').length - 1 : 0
    if (!nodesByDepth.has(depth)) nodesByDepth.set(depth, [])
    nodesByDepth.get(depth)!.push(n)
  }

  const levelHeight = 100
  const nodeWidth = 140
  const positions = new Map<string, { x: number; y: number }>()
  const maxDepth = Math.max(...Array.from(nodesByDepth.keys()), 0)

  for (let d = 0; d <= maxDepth; d++) {
    const levelNodes = nodesByDepth.get(d) || []
    const totalWidth = levelNodes.length * (nodeWidth + 20)
    const startX = (900 - totalWidth) / 2
    levelNodes.forEach((n, i) => {
      positions.set(n.id, { x: startX + i * (nodeWidth + 20) + nodeWidth / 2, y: 40 + d * levelHeight })
    })
  }

  const svgHeight = (maxDepth + 1) * levelHeight + 60

  return (
    <div>
      <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--vp-text-heading)' }}>Zonas — Grafo</h2>
      <div className="glass-card p-4 overflow-auto">
        <svg width="900" height={svgHeight} viewBox={`0 0 900 ${svgHeight}`}>
          {/* Edges */}
          {nodes.filter(n => n.parent_id).map(n => {
            const from = positions.get(n.parent_id!)
            const to = positions.get(n.id)
            if (!from || !to) return null
            return <line key={`e-${n.id}`} x1={from.x} y1={from.y + 16} x2={to.x} y2={to.y - 16} stroke="var(--vp-gray-300)" strokeWidth={1.5} />
          })}
          {/* Nodes */}
          {nodes.map(n => {
            const pos = positions.get(n.id)
            if (!pos) return null
            return (
              <g key={n.id}>
                <rect x={pos.x - 60} y={pos.y - 16} width={120} height={32} rx={6}
                  fill={n.type_color || 'var(--vp-gray-400)'} opacity={0.15} stroke={n.type_color || 'var(--vp-gray-400)'} strokeWidth={1.5} />
                <text x={pos.x} y={pos.y + 4} textAnchor="middle" fontSize={11} fontWeight={500}
                  fill="var(--vp-text-heading)" fontFamily="var(--vp-font-family)">
                  {n.name.length > 16 ? n.name.slice(0, 14) + '...' : n.name}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
