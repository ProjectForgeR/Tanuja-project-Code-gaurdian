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
        badge: 'bg-red-500/15 text-red-400 border border-red-500/30',
        dot: 'bg-red-500',
      }
    case 'High':
      return {
        badge: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
        dot: 'bg-orange-500',
      }
    case 'Medium':
      return {
        badge: 'bg-yellow-500/15 text-yellow-500 border border-yellow-500/30',
        dot: 'bg-yellow-500',
      }
    case 'Low':
      return {
        badge: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
        dot: 'bg-blue-400',
      }
    default:
      return {
        badge: 'bg-slate-700/50 text-slate-400 border border-slate-600/30',
        dot: 'bg-slate-400',
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
      // Clipboard API unavailable — silent fail
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-[11px] font-semibold text-slate-300 transition hover:bg-slate-700 hover:text-white active:scale-95"
      title="Copy suggested fix to clipboard"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-emerald-400" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
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
      className={`rounded-xl border bg-slate-900/60 overflow-hidden transition-all duration-200 ${
        explanation.severity === 'Critical'
          ? 'border-red-500/20 hover:border-red-500/40'
          : explanation.severity === 'High'
          ? 'border-orange-500/15 hover:border-orange-500/35'
          : explanation.severity === 'Medium'
          ? 'border-yellow-500/15 hover:border-yellow-500/35'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Card Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-4 py-3 flex items-start justify-between gap-3 hover:bg-slate-800/30 transition"
      >
        <div className="flex items-start gap-3 min-w-0">
          {/* Severity dot */}
          <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${styles.dot}`} />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <span
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${styles.badge}`}
              >
                {explanation.severity}
              </span>
              {explanation.line > 0 && (
                <span className="rounded-md bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                  Line {explanation.line}
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-white leading-snug">{explanation.title}</p>
          </div>
        </div>

        <div className="shrink-0 mt-0.5">
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-slate-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-500" />
          )}
        </div>
      </button>

      {/* Expanded Body */}
      {expanded && (
        <div className="border-t border-slate-800/60 px-4 py-4 space-y-4">
          {/* What is the problem */}
          {explanation.what && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-red-400">
                  What is the problem?
                </span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed pl-5">{explanation.what}</p>
            </div>
          )}

          {/* Why does it happen */}
          {explanation.why && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Bug className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400">
                  Why does it happen?
                </span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed pl-5">{explanation.why}</p>
            </div>
          )}

          {/* Impact */}
          {explanation.impact && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-yellow-400 shrink-0" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-yellow-400">
                  What could go wrong?
                </span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed pl-5">{explanation.impact}</p>
            </div>
          )}

          {/* Recommended fix */}
          {explanation.fix && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Wrench className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  How to fix it?
                </span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed pl-5">{explanation.fix}</p>
            </div>
          )}

          {/* Corrected code */}
          {explanation.corrected_code && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                    Suggested fix
                  </span>
                </div>
                <CopyButton text={explanation.corrected_code} />
              </div>
              <pre className="overflow-x-auto rounded-lg border border-slate-700/60 bg-[#060b14] p-3 text-[12px] font-mono text-emerald-300/90 leading-relaxed whitespace-pre-wrap">
                {explanation.corrected_code}
              </pre>
            </div>
          )}

          {/* Prevention tip */}
          {explanation.prevention && (
            <div className="rounded-lg border border-indigo-500/15 bg-indigo-500/5 px-3 py-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Lightbulb className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                  Prevention tip
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{explanation.prevention}</p>
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
      <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 border border-violet-500/20">
            <Sparkles className="h-4 w-4 text-violet-400 animate-pulse" />
          </div>
          <div>
            <p className="text-sm font-semibold text-violet-300">Analyzing findings with AI...</p>
            <p className="text-[11px] text-violet-400/60">
              Generating plain-English explanations for each detected issue
            </p>
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-lg border border-slate-800 bg-slate-800/30 p-3">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-slate-700" />
                <div className="h-3 w-24 rounded bg-slate-700" />
                <div className="h-3 w-16 rounded bg-slate-700" />
              </div>
              <div className="mt-2 ml-5 h-3 w-3/4 rounded bg-slate-700/60" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-300 mb-1">Explanation failed</p>
            <p className="text-xs text-red-400/80 leading-relaxed mb-3">{error}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/20"
              >
                <RefreshCw className="h-3 w-3" />
                Retry
              </button>
              <button
                onClick={onDismiss}
                className="text-xs text-slate-500 hover:text-slate-300 transition"
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
    <div className="rounded-xl border border-violet-500/20 bg-slate-900/60 overflow-hidden">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-violet-500/10 bg-violet-500/5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/15 border border-violet-500/20">
            <Sparkles className="h-3.5 w-3.5 text-violet-400" />
          </div>
          <div>
            <span className="text-sm font-bold text-white">AI Error Explanations</span>
            {count > 0 && (
              <span className="ml-2 rounded-full bg-violet-500/20 border border-violet-500/30 px-2 py-0.5 text-[10px] font-bold text-violet-400">
                {count} finding{count !== 1 ? 's' : ''} explained
              </span>
            )}
          </div>
          {result.ai_used && (
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
              AI-powered
            </span>
          )}
          {!result.ai_used && (
            <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
              Rule-based
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRetry}
            title="Refresh explanations"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/60 text-slate-400 transition hover:bg-slate-700 hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setPanelExpanded(!panelExpanded)}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/60 text-slate-400 transition hover:bg-slate-700 hover:text-white"
          >
            {panelExpanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            onClick={onDismiss}
            className="text-[10px] font-medium text-slate-500 hover:text-slate-300 transition px-1"
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
            <div className="flex items-center gap-2 rounded-lg border border-slate-700/40 bg-slate-800/30 px-3 py-2">
              <Info className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="text-xs text-slate-400">{result.message}</span>
            </div>
          )}

          {/* No findings case */}
          {count === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 mb-3">
                <ShieldAlert className="h-6 w-6 text-emerald-400" />
              </div>
              <p className="text-sm font-semibold text-emerald-300 mb-1">No issues to explain</p>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
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
