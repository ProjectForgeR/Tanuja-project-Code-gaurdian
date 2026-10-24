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
  FileCode,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react'
import { Finding } from '@/types/analysis'
import { getSeverityBadge } from '@/lib/utils'

interface FindingCardProps {
  finding: Finding
  filename?: string
  onJumpToLine?: (line: number) => void
  onReviewFix?: (finding: Finding) => void
  onGenerateTests?: (finding: Finding) => void
}

export const FindingCard: React.FC<FindingCardProps> = ({
  finding,
  filename = 'source_code',
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

  const shortId = finding.rule_id || (finding.id ? finding.id.slice(0, 8).toUpperCase() : 'ERR')

  return (
    <div className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs">
      {/* Header Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Severity Badge */}
          <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${badge.bg}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
            {finding.severity}
          </span>

          {/* Error Type */}
          <span className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
            {finding.category || 'Vulnerability'}
          </span>

          {/* Error ID */}
          <span className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-500 dark:text-slate-400">
            ID: {shortId}
          </span>

          {/* Location Button */}
          <button
            type="button"
            onClick={() => onJumpToLine && onJumpToLine(finding.line_start)}
            className="inline-flex items-center gap-1 rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:text-blue-300 transition hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer"
            title="Go to exact error location in editor"
          >
            <span>Line {finding.line_start}:{finding.col_start || 1}</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* File and Tool Source */}
        <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1 font-mono">
            <FileCode className="h-3 w-3 text-slate-400" />
            {filename}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Cpu className="h-3 w-3" />
            {finding.detection_method}
          </span>
        </div>
      </div>

      {/* Error Title */}
      <h4 className="mt-3 text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
        {finding.title}
      </h4>

      {/* Plain-English Explanation */}
      <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
        {finding.explanation}
      </p>

      {/* Code Snippet preview */}
      {finding.snippet && (
        <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-[11px]">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/80 px-3 py-1 text-[10px] text-slate-600 dark:text-slate-400">
            <span>Location: Line {finding.line_start}</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              title="Copy snippet"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="overflow-x-auto p-2.5 text-slate-800 dark:text-slate-200">
            <code>{finding.snippet}</code>
          </pre>
        </div>
      )}

      {/* Recommended Correction Preview */}
      {finding.recommended_fix && (
        <div className="mt-3 rounded-lg border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/30 p-2.5 text-xs text-emerald-950 dark:text-emerald-200">
          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold text-[11px] mb-1">
            <Lightbulb className="h-3.5 w-3.5" />
            Recommended Correction:
          </div>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
            {finding.recommended_fix}
          </p>
        </div>
      )}

      {/* Collapsible Details */}
      {expanded && (
        <div className="mt-3 space-y-2.5 border-t border-slate-100 dark:border-slate-800 pt-3 text-xs">
          {finding.impact && (
            <div>
              <strong className="text-slate-600 dark:text-slate-400 flex items-center gap-1 text-[11px] mb-0.5">
                <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400" /> Why This Problem Occurs & Impact:
              </strong>
              <span className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed block pl-4">
                {finding.impact}
              </span>
            </div>
          )}

          {finding.rule_id && (
            <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
              Rule ID: <code className="text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">{finding.rule_id}</code> | Confidence: <strong>{finding.confidence}</strong>
            </div>
          )}
        </div>
      )}

      {/* Actions Toolbar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
        >
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {expanded ? 'Hide Details' : 'View Impact & Rule Details'}
        </button>

        <div className="flex items-center gap-2">
          {onJumpToLine && (
            <button
              type="button"
              onClick={() => onJumpToLine(finding.line_start)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white cursor-pointer shadow-2xs"
            >
              <ArrowRight className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              Go to Error
            </button>
          )}

          {onGenerateTests && (
            <button
              type="button"
              onClick={() => onGenerateTests(finding)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/50 px-2.5 py-1 text-xs font-semibold text-purple-700 dark:text-purple-300 transition hover:bg-purple-100 dark:hover:bg-purple-900/50 cursor-pointer shadow-2xs"
            >
              <TestTube2 className="h-3.5 w-3.5" />
              Tests
            </button>
          )}

          {onReviewFix && (
            <button
              type="button"
              onClick={() => onReviewFix(finding)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1 text-xs font-bold text-white shadow-xs transition hover:bg-blue-700 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Fix Error
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default FindingCard
