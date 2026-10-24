import React, { useState } from 'react'
import {
  Sparkles,
  Check,
  X,
  ArrowRight,
  ShieldCheck,
  FileCode,
  Copy,
  AlertTriangle,
  RotateCcw,
  Zap,
  TrendingUp,
  Sliders,
} from 'lucide-react'
import { RefactorResult } from '@/types/analysis'

interface AiRefactorModalProps {
  result: RefactorResult | null
  isLoading: boolean
  onClose: () => void
  onApplyRefactoring: (refactoredCode: string) => void
}

export const AiRefactorModal: React.FC<AiRefactorModalProps> = ({
  result,
  isLoading,
  onClose,
  onApplyRefactoring,
}) => {
  const [viewMode, setViewMode] = useState<'sideBySide' | 'diff' | 'improvements'>('sideBySide')
  const [copied, setCopied] = useState<boolean>(false)

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
        <div className="w-full max-w-lg rounded-2xl border border-indigo-500/30 bg-slate-950 p-8 shadow-2xl text-center space-y-4">
          <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400">
            <div className="absolute inset-0 animate-ping rounded-2xl bg-indigo-500/20" />
            <Sparkles className="h-8 w-8 text-indigo-400 animate-pulse" />
          </div>
          <h3 className="text-lg font-bold text-white">AI Code Refactoring Engine Active</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Eliminating detected code smells, extracting named constants, simplifying nested conditionals, and validating runtime behavioral equivalence...
          </p>
          <div className="w-48 h-1.5 mx-auto rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 animate-pulse w-3/4" />
          </div>
        </div>
      </div>
    )
  }

  if (!result) return null

  const scoreDelta = Math.round(result.refactored_quality_score - result.original_quality_score)
  const isBetter = scoreDelta >= 0

  const handleCopy = () => {
    navigator.clipboard.writeText(result.refactored_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-5xl my-8 rounded-2xl border border-slate-700/80 bg-slate-950 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-slate-900/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                AI Code Refactoring Review
                <span className="rounded-md bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                  Behavior Preserved
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Review proposed architectural cleanups before applying them to the editor.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex rounded-lg border border-slate-800 bg-slate-900 p-1 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('sideBySide')}
                className={`rounded-md px-3 py-1 font-semibold transition ${
                  viewMode === 'sideBySide' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Side-by-Side
              </button>
              <button
                type="button"
                onClick={() => setViewMode('diff')}
                className={`rounded-md px-3 py-1 font-semibold transition ${
                  viewMode === 'diff' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Unified Diff
              </button>
              <button
                type="button"
                onClick={() => setViewMode('improvements')}
                className={`rounded-md px-3 py-1 font-semibold transition ${
                  viewMode === 'improvements' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Improvements ({result.improvements.length})
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Quality Score Delta Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 border-b border-slate-800 bg-slate-900/40 p-4 text-xs">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <span className="text-slate-400 font-medium">Original Quality Score</span>
            <div className="mt-1 text-lg font-bold text-amber-400">
              {Math.round(result.original_quality_score)} / 100
            </div>
          </div>

          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
            <span className="text-emerald-400 font-medium flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              Refactored Quality Score
            </span>
            <div className="mt-1 text-lg font-bold text-emerald-400">
              {Math.round(result.refactored_quality_score)} / 100{' '}
              <span className="text-xs font-semibold text-emerald-300">
                ({scoreDelta >= 0 ? `+${scoreDelta}` : scoreDelta} pts)
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <span className="text-slate-400 font-medium">Code Smells Resolved</span>
            <div className="mt-1 text-lg font-bold text-white">
              {result.smells_resolved.length} Resolved
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <span className="text-slate-400 font-medium">Validation Status</span>
            <div className="mt-1 flex items-center gap-1 text-emerald-400 font-semibold text-sm">
              <ShieldCheck className="h-4 w-4" />
              <span>{result.syntax_valid ? 'Syntax Verified' : 'Check Syntax'}</span>
            </div>
          </div>
        </div>

        {/* Modal Main Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Resolved Code Smells Badges */}
          {result.smells_resolved.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Smells Addressed:</span>
              {result.smells_resolved.map((smell, i) => (
                <span
                  key={i}
                  className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-[11px] font-semibold text-indigo-300"
                >
                  ✓ {smell}
                </span>
              ))}
            </div>
          )}

          {/* View 1: Side by Side Comparison */}
          {viewMode === 'sideBySide' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Original Code */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
                <div className="border-b border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-400 flex items-center justify-between">
                  <span>Original Source Code</span>
                  <span className="text-[11px] text-amber-400">Has Code Smells</span>
                </div>
                <pre className="p-4 font-mono text-xs text-slate-300 overflow-x-auto max-h-[420px] whitespace-pre">
                  {result.original_code}
                </pre>
              </div>

              {/* Refactored Code */}
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/10 overflow-hidden shadow-lg shadow-emerald-500/5">
                <div className="border-b border-emerald-500/30 bg-emerald-900/30 px-4 py-2 text-xs font-semibold text-emerald-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                    AI Refactored Code
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 transition"
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-4 font-mono text-xs text-emerald-200/90 overflow-x-auto max-h-[420px] whitespace-pre">
                  {result.refactored_code}
                </pre>
              </div>
            </div>
          )}

          {/* View 2: Unified Diff */}
          {viewMode === 'diff' && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 overflow-hidden">
              <div className="border-b border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-400">
                Unified Diff Inspection
              </div>
              <div className="p-4 font-mono text-xs max-h-[420px] overflow-x-auto overflow-y-auto space-y-0.5">
                {result.diff ? (
                  result.diff.split('\n').map((line, idx) => {
                    const isAdd = line.startsWith('+') && !line.startsWith('+++')
                    const isDel = line.startsWith('-') && !line.startsWith('---')
                    const isHeader = line.startsWith('@@') || line.startsWith('---') || line.startsWith('+++')
                    return (
                      <div
                        key={idx}
                        className={`px-2 py-0.5 whitespace-pre ${
                          isAdd
                            ? 'bg-emerald-500/15 text-emerald-300 font-semibold'
                            : isDel
                            ? 'bg-rose-500/15 text-rose-300 line-through'
                            : isHeader
                            ? 'text-cyan-400 font-bold'
                            : 'text-slate-400'
                        }`}
                      >
                        {line || ' '}
                      </div>
                    )
                  })
                ) : (
                  <p className="text-slate-400 italic">No textual modifications found.</p>
                )}
              </div>
            </div>
          )}

          {/* View 3: Key Improvements List */}
          {viewMode === 'improvements' && (
            <div className="space-y-3">
              {result.improvements.length === 0 ? (
                <p className="text-xs text-slate-400">Code is already clean and follows best practices.</p>
              ) : (
                result.improvements.map((imp, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-[10px]">
                          {idx + 1}
                        </span>
                        {imp.title}
                      </h4>
                      <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                        {imp.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{imp.description}</p>
                    <span className="text-[11px] text-indigo-400 font-mono block">
                      Resolved Smell: {imp.code_smell}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex flex-wrap items-center justify-between border-t border-slate-800 bg-slate-900/90 px-6 py-4 gap-3">
          <p className="text-xs text-slate-400 max-w-md">
            Applying this refactoring updates the code editor and allows you to undo anytime using the editor history.
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer"
            >
              Cancel / Keep Original
            </button>
            <button
              type="button"
              onClick={() => {
                onApplyRefactoring(result.refactored_code)
                onClose()
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-500 hover:to-teal-500 transition cursor-pointer"
            >
              <Check className="h-4 w-4" />
              <span>Apply Refactored Code</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
