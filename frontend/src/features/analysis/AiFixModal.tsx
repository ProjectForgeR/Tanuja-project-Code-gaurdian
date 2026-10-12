import React, { useState } from 'react'
import {
  X,
  Sparkles,
  Check,
  Copy,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileCode,
} from 'lucide-react'
import { Finding, FixResult } from '@/types/analysis'

interface AiFixModalProps {
  finding: Finding
  fixResult: FixResult | null
  isLoading: boolean
  onClose: () => void
  onApplyFix: (correctedCode: string) => void
}

export const AiFixModal: React.FC<AiFixModalProps> = ({
  finding,
  fixResult,
  isLoading,
  onClose,
  onApplyFix,
}) => {
  const [activeTab, setActiveTab] = useState<'diff' | 'code'>('diff')
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (fixResult?.corrected_code) {
      navigator.clipboard.writeText(fixResult.corrected_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">AI Fix Assistant</h3>
                {fixResult && (
                  <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-blue-400 border border-blue-500/20">
                    {fixResult.is_ai_generated ? 'Live AI Generated' : 'Automated Secure Patch'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">{finding.title} (Line {finding.line_start})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            <p className="mt-4 text-sm font-semibold text-white">Synthesizing Secure Patch...</p>
            <p className="mt-1 text-xs text-slate-400">
              Analyzing AST structure, control-flow risks, and generating regression validations.
            </p>
          </div>
        ) : fixResult ? (
          <div className="mt-5 space-y-5">
            {/* Explanations Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-400">
                  <AlertTriangle className="h-4 w-4" /> Why Original Code is Unsafe
                </h4>
                <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                  {fixResult.why_unsafe}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
                  <ShieldCheck className="h-4 w-4" /> Explanation of Remediation
                </h4>
                <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                  {fixResult.explanation}
                </p>
              </div>
            </div>

            {/* Code Diff Tabs */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/30 overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('diff')}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                      activeTab === 'diff'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Unified Diff
                  </button>
                  <button
                    onClick={() => setActiveTab('code')}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                      activeTab === 'code'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Remediated Code
                  </button>
                </div>

                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto p-4 font-mono text-xs">
                {activeTab === 'diff' ? (
                  <pre className="text-slate-300 leading-relaxed">
                    {fixResult.diff.split('\n').map((line, idx) => {
                      const isAdded = line.startsWith('+') && !line.startsWith('+++')
                      const isRemoved = line.startsWith('-') && !line.startsWith('---')
                      const isHeader = line.startsWith('@@') || line.startsWith('---') || line.startsWith('+++')
                      return (
                        <div
                          key={idx}
                          className={`${
                            isAdded
                              ? 'bg-emerald-950/60 text-emerald-300'
                              : isRemoved
                              ? 'bg-rose-950/60 text-rose-300 line-through'
                              : isHeader
                              ? 'text-blue-400 font-semibold'
                              : 'text-slate-400'
                          } px-2 py-0.5 rounded-sm`}
                        >
                          {line}
                        </div>
                      )
                    })}
                  </pre>
                ) : (
                  <pre className="text-slate-200">
                    <code>{fixResult.corrected_code}</code>
                  </pre>
                )}
              </div>
            </div>

            {/* Side-effects & Validation Tests */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
              <div className="rounded-lg border border-slate-800/80 bg-slate-900/30 p-3">
                <span className="font-semibold text-slate-300">Side Effects & Migration:</span>
                <p className="mt-1 text-slate-400">{fixResult.side_effects}</p>
              </div>

              <div className="rounded-lg border border-slate-800/80 bg-slate-900/30 p-3">
                <span className="font-semibold text-slate-300">Recommended Tests to Validate:</span>
                <ul className="mt-1 space-y-1 text-slate-400">
                  {fixResult.recommended_tests.map((t, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                onClick={onClose}
                className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800"
              >
                Close Without Applying
              </button>
              <button
                onClick={() => {
                  onApplyFix(fixResult.corrected_code)
                  onClose()
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:from-blue-500 hover:to-indigo-500"
              >
                <Check className="h-4 w-4" />
                Apply Fix to Editor
              </button>
            </div>
          </div>
        ) : (
          <div className="py-10 text-center text-slate-400">
            Failed to generate fix recommendations.
          </div>
        )}
      </div>
    </div>
  )
}
