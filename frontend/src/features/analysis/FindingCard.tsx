import React, { useState } from 'react'
import {
  ShieldAlert,
  ArrowRight,
  Wrench,
  TestTube2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Cpu,
  Sparkles,
} from 'lucide-react'
import { Finding } from '@/types/analysis'
import { getSeverityBadge } from '@/lib/utils'

interface FindingCardProps {
  finding: Finding
  onJumpToLine?: (line: number) => void
  onReviewFix?: (finding: Finding) => void
  onGenerateTests?: (finding: Finding) => void
}

export const FindingCard: React.FC<FindingCardProps> = ({
  finding,
  onJumpToLine,
  onReviewFix,
  onGenerateTests,
}) => {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const badge = getSeverityBadge(finding.severity)

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    const content = finding.suggested_patch || finding.recommended_fix || finding.explanation
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="group rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-700/80 hover:bg-slate-900/90 shadow-md">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Severity Badge */}
          <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${badge.bg}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
            {finding.severity}
          </span>

          {/* Category */}
          <span className="rounded-md border border-slate-700/60 bg-slate-800/60 px-2 py-0.5 text-[11px] font-medium text-slate-300">
            {finding.category}
          </span>

          {/* Line location */}
          <button
            onClick={() => onJumpToLine && onJumpToLine(finding.line_start)}
            className="inline-flex items-center gap-1 rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-400 transition hover:bg-blue-500/20"
            title="Jump to code location"
          >
            Line {finding.line_start}
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Detection Method */}
        <span className="flex items-center gap-1 text-[10px] text-slate-500">
          <Cpu className="h-3 w-3" />
          {finding.detection_method}
        </span>
      </div>

      {/* Title */}
      <h4 className="mt-3 text-sm font-semibold text-white group-hover:text-blue-300 transition">
        {finding.title}
      </h4>

      {/* Explanation snippet */}
      <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
        {finding.explanation}
      </p>

      {/* Snippet preview */}
      {finding.snippet && (
        <div className="mt-3 overflow-hidden rounded-lg border border-slate-800 bg-slate-950 font-mono text-[11px]">
          <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/40 px-3 py-1 text-[10px] text-slate-400">
            <span>Affected Line {finding.line_start}</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 hover:text-white transition"
              title="Copy snippet"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="overflow-x-auto p-2.5 text-slate-300">
            <code>{finding.snippet}</code>
          </pre>
        </div>
      )}

      {/* Collapsible Details */}
      {expanded && (
        <div className="mt-3 space-y-2.5 border-t border-slate-800/60 pt-3 text-xs">
          {finding.impact && (
            <div>
              <strong className="text-slate-400">Potential Impact: </strong>
              <span className="text-slate-300">{finding.impact}</span>
            </div>
          )}

          {finding.recommended_fix && (
            <div>
              <strong className="text-slate-400">Remediation Guide: </strong>
              <span className="text-slate-300">{finding.recommended_fix}</span>
            </div>
          )}

          {finding.rule_id && (
            <div className="text-[11px] text-slate-500">
              Rule ID: <code className="text-slate-400">{finding.rule_id}</code> | Confidence: <strong>{finding.confidence}</strong>
            </div>
          )}
        </div>
      )}

      {/* Actions Toolbar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/60 pt-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-white transition"
        >
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {expanded ? 'Hide Details' : 'View Impact & Rule'}
        </button>

        <div className="flex items-center gap-2">
          {onGenerateTests && (
            <button
              onClick={() => onGenerateTests(finding)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-xs font-semibold text-slate-300 transition hover:bg-slate-700 hover:text-white"
            >
              <TestTube2 className="h-3.5 w-3.5 text-purple-400" />
              Generate Tests
            </button>
          )}

          {onReviewFix && (
            <button
              onClick={() => onReviewFix(finding)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-sm shadow-blue-600/30 transition hover:bg-blue-500"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Review AI Fix
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
