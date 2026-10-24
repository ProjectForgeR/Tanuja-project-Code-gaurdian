import React, { useState } from 'react'
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  ShieldAlert,
  AlertCircle,
  Info,
  Lightbulb,
  Wrench,
  Bug,
  TrendingUp,
  Shield,
} from 'lucide-react'
import { ExplainResult, FindingExplanation, Severity } from '@/types/analysis'

// ---------------------------------------------------------------------------
// Severity utilities
// ---------------------------------------------------------------------------

function getSeverityStyles(severity: string): { badge: string; dot: string } {
  switch (severity) {
    case 'Critical':
      return {
        badge: 'bg-rose-50 text-rose-700 border border-rose-200',
        dot: 'bg-rose-600',
      }
    case 'High':
      return {
        badge: 'bg-amber-50 text-amber-800 border border-amber-200',
        dot: 'bg-amber-600',
      }
    case 'Medium':
      return {
        badge: 'bg-amber-50 text-amber-700 border border-amber-200',
        dot: 'bg-amber-500',
      }
    case 'Low':
      return {
        badge: 'bg-blue-50 text-blue-700 border border-blue-200',
        dot: 'bg-blue-600',
      }
    default:
      return {
        badge: 'bg-slate-100 text-slate-700 border border-slate-200',
        dot: 'bg-slate-500',
      }
  }
}

// ---------------------------------------------------------------------------
// CopyButton
// ---------------------------------------------------------------------------

const CopyButton: React.FC<{ text: string; label?: string }> = ({
  text,
  label = 'Copy Fix',
}) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 active:scale-95 shadow-2xs"
      title="Copy suggested fix to clipboard"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-emerald-600" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-3 w-3 text-slate-500" />
          {label}
        </>
      )}
    </button>
  )
}

// ---------------------------------------------------------------------------
// ExplanationCard — one card per finding
// ---------------------------------------------------------------------------

const ExplanationCard: React.FC<{ explanation: FindingExplanation; index: number }> = ({
  explanation,
  index,
}) => {
  const [expanded, setExpanded] = useState(index === 0)
  const styles = getSeverityStyles(explanation.severity)

  return (
    <div
      className={`rounded-xl border bg-white overflow-hidden transition-all duration-200 shadow-xs ${
        explanation.severity === 'Critical'
          ? 'border-rose-200 hover:border-rose-300'
          : explanation.severity === 'High'
          ? 'border-amber-200 hover:border-amber-300'
          : explanation.severity === 'Medium'
          ? 'border-amber-200 hover:border-amber-300'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Card Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-4 py-3 flex items-start justify-between gap-3 hover:bg-slate-50 transition cursor-pointer"
      >
        <div className="flex items-start gap-3 min-w-0">
          {/* Severity dot */}
          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${styles.dot}`} />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <span
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${styles.badge}`}
              >
                {explanation.severity}
              </span>
              {explanation.line > 0 && (
                <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-mono text-slate-600">
                  Line {explanation.line}
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-slate-900 leading-snug">{explanation.title}</p>
          </div>
        </div>

        <div className="shrink-0 mt-0.5">
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* Expanded Body */}
      {expanded && (
        <div className="border-t border-slate-100 px-4 py-4 space-y-4 bg-slate-50/40">
          {/* What is the problem */}
          {explanation.what && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">
                  What is the problem?
                </span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed pl-5">{explanation.what}</p>
            </div>
          )}

          {/* Why does it happen */}
          {explanation.why && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Bug className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                  Why does it happen?
                </span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed pl-5">{explanation.why}</p>
            </div>
          )}

          {/* Impact */}
          {explanation.impact && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                  What could go wrong?
                </span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed pl-5">{explanation.impact}</p>
            </div>
          )}

          {/* Recommended fix */}
          {explanation.fix && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Wrench className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  How to fix it?
                </span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed pl-5">{explanation.fix}</p>
            </div>
          )}

          {/* Corrected code */}
          {explanation.corrected_code && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                    Suggested fix
                  </span>
                </div>
                <CopyButton text={explanation.corrected_code} />
              </div>
              <pre className="overflow-x-auto rounded-lg border border-slate-200 bg-white p-3 text-[12px] font-mono text-emerald-800 leading-relaxed whitespace-pre-wrap shadow-inner">
                {explanation.corrected_code}
              </pre>
            </div>
          )}

          {/* Prevention tip */}
          {explanation.prevention && (
            <div className="rounded-lg border border-indigo-200 bg-indigo-50/60 px-3 py-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Lightbulb className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900">
                  Prevention tip
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">{explanation.prevention}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// AIExplanationPanel — main export
// ---------------------------------------------------------------------------

interface AIExplanationPanelProps {
  result: ExplainResult | null
  isLoading: boolean
  error: string | null
  onRetry: () => void
  onDismiss: () => void
}

export const AIExplanationPanel: React.FC<AIExplanationPanelProps> = ({
  result,
  isLoading,
  error,
  onRetry,
  onDismiss,
}) => {
  const [panelExpanded, setPanelExpanded] = useState(true)

  // Loading state
  if (isLoading) {
    return (
      <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-5 shadow-xs">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 border border-violet-200">
            <Sparkles className="h-4 w-4 text-violet-600 animate-pulse" />
          </div>
          <div>
            <p className="text-sm font-bold text-violet-900">Analyzing findings with AI...</p>
            <p className="text-[11px] text-violet-700">
              Generating plain-English explanations for each detected issue
            </p>
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-slate-300" />
                <div className="h-3 w-24 rounded bg-slate-200" />
                <div className="h-3 w-16 rounded bg-slate-200" />
              </div>
              <div className="mt-2 ml-5 h-3 w-3/4 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 shadow-xs">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-rose-900 mb-1">Explanation failed</p>
            <p className="text-xs text-rose-800 leading-relaxed mb-3">{error}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 cursor-pointer shadow-2xs"
              >
                <RefreshCw className="h-3 w-3" />
                Retry
              </button>
              <button
                onClick={onDismiss}
                className="text-xs text-slate-600 hover:text-slate-900 transition cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!result) return null

  const count = result.explanations.length

  return (
    <div className="rounded-xl border border-violet-200 bg-white overflow-hidden shadow-xs">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-violet-100 bg-violet-50/60">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 border border-violet-200">
            <Sparkles className="h-3.5 w-3.5 text-violet-600" />
          </div>
          <div>
            <span className="text-sm font-bold text-slate-900">AI Error Explanations</span>
            {count > 0 && (
              <span className="ml-2 rounded-full bg-violet-100 border border-violet-200 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                {count} finding{count !== 1 ? 's' : ''} explained
              </span>
            )}
          </div>
          {result.ai_used && (
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              AI-powered
            </span>
          )}
          {!result.ai_used && (
            <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
              Rule-based
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRetry}
            title="Refresh explanations"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 cursor-pointer shadow-2xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setPanelExpanded(!panelExpanded)}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 cursor-pointer shadow-2xs"
          >
            {panelExpanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            onClick={onDismiss}
            className="text-[11px] font-bold text-slate-400 hover:text-slate-700 transition px-1 cursor-pointer"
            title="Close panel"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Panel Body */}
      {panelExpanded && (
        <div className="p-4 space-y-3">
          {/* Status message */}
          {result.message && (
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <Info className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <span className="text-xs text-slate-700">{result.message}</span>
            </div>
          )}

          {/* No findings case */}
          {count === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 mb-3">
                <ShieldAlert className="h-6 w-6 text-emerald-600" />
              </div>
              <p className="text-sm font-bold text-slate-900 mb-1">No issues to explain</p>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                The analyzers found no issues in this code. Keep writing clean, secure code!
              </p>
            </div>
          )}

          {/* Explanation cards */}
          {result.explanations.map((explanation, i) => (
            <ExplanationCard key={explanation.finding_id || i} explanation={explanation} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
