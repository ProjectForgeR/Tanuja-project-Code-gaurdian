import React, { useState, useMemo } from 'react'
import { Search, Filter, ShieldCheck } from 'lucide-react'
import { Finding, Severity, Category } from '@/types/analysis'
import { FindingCard } from './FindingCard'

interface FindingsListProps {
  findings: Finding[]
  filename?: string
  onJumpToLine?: (line: number) => void
  onReviewFix?: (finding: Finding) => void
  onGenerateTests?: (finding: Finding) => void
}

export const FindingsList: React.FC<FindingsListProps> = ({
  findings,
  filename,
  onJumpToLine,
  onReviewFix,
  onGenerateTests,
}) => {
  const [search, setSearch] = useState('')
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      const matchSearch =
        f.title.toLowerCase().includes(search.toLowerCase()) ||
        f.explanation.toLowerCase().includes(search.toLowerCase()) ||
        (f.snippet && f.snippet.toLowerCase().includes(search.toLowerCase())) ||
        (f.rule_id && f.rule_id.toLowerCase().includes(search.toLowerCase()))

      const matchSeverity =
        selectedSeverity === 'all' || f.severity.toLowerCase() === selectedSeverity.toLowerCase()

      const matchCategory =
        selectedCategory === 'all' || f.category.toLowerCase() === selectedCategory.toLowerCase()

      return matchSearch && matchSeverity && matchCategory
    })
  }, [findings, search, selectedSeverity, selectedCategory])

  const counts = useMemo(() => {
    return {
      critical: findings.filter((f) => f.severity === 'Critical').length,
      high: findings.filter((f) => f.severity === 'High').length,
      medium: findings.filter((f) => f.severity === 'Medium').length,
      low: findings.filter((f) => f.severity === 'Low').length,
    }
  }, [findings])

  return (
    <div className="space-y-4">
      {/* Search and Filters Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search findings by keyword, CWE, or rule..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Severity Quick Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedSeverity('all')}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              selectedSeverity === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            All ({findings.length})
          </button>
          <button
            onClick={() => setSelectedSeverity('critical')}
            className={`rounded-lg px-2 py-1 text-xs font-semibold transition ${
              selectedSeverity === 'critical'
                ? 'bg-red-600 text-white'
                : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
            }`}
          >
            Critical ({counts.critical})
          </button>
          <button
            onClick={() => setSelectedSeverity('high')}
            className={`rounded-lg px-2 py-1 text-xs font-semibold transition ${
              selectedSeverity === 'high'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
            }`}
          >
            High ({counts.high})
          </button>
          <button
            onClick={() => setSelectedSeverity('medium')}
            className={`rounded-lg px-2 py-1 text-xs font-semibold transition ${
              selectedSeverity === 'medium'
                ? 'bg-yellow-600 text-white'
                : 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20'
            }`}
          >
            Medium ({counts.medium})
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800/80 pb-2">
        {['all', 'Security', 'Bug', 'Code Smell', 'Maintainability'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition ${
              selectedCategory.toLowerCase() === cat.toLowerCase()
                ? 'bg-slate-700 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat === 'all' ? 'All Categories' : cat}
          </button>
        ))}
      </div>

      {/* Findings List or Empty State */}
      {filteredFindings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800/80 bg-slate-900/40 p-10 text-center">
          <ShieldCheck className="h-10 w-10 text-emerald-400 mb-2" />
          <h4 className="text-sm font-semibold text-white">No Matching Findings</h4>
          <p className="mt-1 text-xs text-slate-400 max-w-sm">
            {findings.length === 0
              ? 'No issues or vulnerabilities detected in this scan.'
              : 'No findings matched your current search filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFindings.map((finding, idx) => (
            <FindingCard
              key={finding.id || idx}
              finding={finding}
              filename={filename}
              onJumpToLine={onJumpToLine}
              onReviewFix={onReviewFix}
              onGenerateTests={onGenerateTests}
            />
          ))}
        </div>
      )}
    </div>
  )
}
