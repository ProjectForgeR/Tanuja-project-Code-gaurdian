import React from 'react'
import { Layers, Sparkles } from 'lucide-react'
import { DuplicateGroup } from '@/types/analysis'

interface DuplicateGroupsViewProps {
  groups: DuplicateGroup[]
}

export const DuplicateGroupsView: React.FC<DuplicateGroupsViewProps> = ({ groups }) => {
  if (!groups || groups.length === 0) {
    return null
  }

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Layers className="h-4 w-4 text-indigo-600" />
        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
          Duplicate & Similar Issue Clusters ({groups.length})
        </h4>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {groups.map((g) => (
          <div
            key={g.id}
            className="rounded-lg border border-indigo-100 bg-white p-3 text-xs shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900">{g.title}</span>
              <span className="rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                {(g.similarity_score * 100).toFixed(0)}% Match
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">
              {g.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
