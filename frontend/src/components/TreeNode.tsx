import { useState } from 'react'
import { ChevronRight, ChevronDown, Plus, Pencil, Trash2, Folder } from 'lucide-react'

interface TreeNodeData {
  id: string
  name: string
  type_id?: string
  type_label?: string
  type_color?: string
  type_light_color?: string
  children: TreeNodeData[]
}

interface TreeNodeProps {
  node: TreeNodeData
  level: number
  onSelect: (node: TreeNodeData) => void
  selectedId?: string
  onCreateChild?: (parentId: string) => void
  onEdit?: (node: TreeNodeData) => void
  onDelete?: (node: TreeNodeData) => void
}

export default function TreeNode({ node, level, onSelect, selectedId, onCreateChild, onEdit, onDelete }: TreeNodeProps) {
  const [open, setOpen] = useState(level < 2)
  const hasChildren = node.children.length > 0
  const isSelected = selectedId === node.id

  return (
    <div>
      <div
        className="flex items-center gap-1 py-1 px-2 rounded-md cursor-pointer group text-sm"
        style={{
          paddingLeft: `${level * 16 + 8}px`,
          background: isSelected ? 'var(--vp-primary-lighter)' : 'transparent',
          color: 'var(--vp-text-body)',
        }}
        onClick={() => onSelect(node)}
      >
        <button onClick={(e) => { e.stopPropagation(); setOpen(!open) }} className="w-4 h-4 flex items-center justify-center">
          {hasChildren ? (open ? <ChevronDown size={12} /> : <ChevronRight size={12} />) : <span className="w-3" />}
        </button>
        <div className="w-5 h-5 rounded flex items-center justify-center shrink-0"
          style={{ background: node.type_color || 'var(--vp-gray-400)' }}>
          <Folder size={10} className="text-white" />
        </div>
        <span className="flex-1 truncate">{node.name}</span>
        {node.type_label && (
          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: node.type_light_color || 'var(--vp-gray-100)', color: node.type_color || 'var(--vp-gray-600)' }}>
            {node.type_label}
          </span>
        )}
        <div className="hidden group-hover:flex items-center gap-1 ml-1">
          {onCreateChild && <button onClick={(e) => { e.stopPropagation(); onCreateChild(node.id) }} className="p-0.5 rounded hover:bg-black/5"><Plus size={12} /></button>}
          {onEdit && <button onClick={(e) => { e.stopPropagation(); onEdit(node) }} className="p-0.5 rounded hover:bg-black/5"><Pencil size={12} /></button>}
          {onDelete && <button onClick={(e) => { e.stopPropagation(); onDelete(node) }} className="p-0.5 rounded hover:bg-red-100"><Trash2 size={12} className="text-red-500" /></button>}
        </div>
      </div>
      {open && hasChildren && node.children.map(child => (
        <TreeNode key={child.id} node={child} level={level + 1} onSelect={onSelect} selectedId={selectedId}
          onCreateChild={onCreateChild} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  )
}
