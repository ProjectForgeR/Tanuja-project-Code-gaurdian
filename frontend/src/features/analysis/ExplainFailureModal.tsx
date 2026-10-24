import React, { useState } from 'react'
import {
  AlertTriangle,
  Sparkles,
  Check,
  X,
  ArrowRight,
  BookOpen,
  Wrench,
  HelpCircle,
  Copy,
} from 'lucide-react'
import { ExplainTestFailureResponse, TestCaseResultItem } from '@/types/execution'

interface ExplainFailureModalProps {
  testCase: TestCaseResultItem | null
  diagnosis: ExplainTestFailureResponse | null
  isLoading: boolean
  onClose: () => void
  onApplyFix?: (correctedCode: string) => void
}

export const ExplainFailureModal: React.FC<ExplainFailureModalProps> = ({
  testCase,
  diagnosis,
  isLoading,
  onClose,
  onApplyFix,
}) => {
  const [copied, setCopied] = useState<boolean>(false)

  if (!testCase) return null

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-2xl my-8 rounded-2xl border border-rose-500/30 bg-slate-950 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Test Failure Diagnosis
                <span className="rounded-md bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300 uppercase">
                  {testCase.status}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {testCase.name} ({testCase.category || 'Test'})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Input and Output Comparison */}
        <div className="p-6 space-y-4 text-xs">
          {testCase.input && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 font-mono">
              <span className="text-[10px] font-sans text-slate-400 uppercase font-semibold block mb-1">
                Standard Input (Stdin)
              </span>
              <pre className="text-slate-200 whitespace-pre-wrap">{testCase.input}</pre>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3">
              <span className="text-[10px] font-sans text-emerald-400 uppercase font-semibold block mb-1">
                Expected Output
              </span>
              <pre className="text-emerald-200 whitespace-pre-wrap">
                {testCase.expected_output || '(No output expected)'}
              </pre>
            </div>

            <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-3">
              <span className="text-[10px] font-sans text-rose-400 uppercase font-semibold block mb-1">
                Actual Output / Divergence
              </span>
              <pre className="text-rose-200 whitespace-pre-wrap">
                {testCase.actual_output || testCase.mismatch_line || testCase.error_message || '(Empty output)'}
              </pre>
            </div>
          </div>

          {/* AI Explanation / Loading */}
          {isLoading ? (
            <div className="flex items-center justify-center p-8 gap-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-indigo-300">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
              <span>Diagnosing failure divergence with AI...</span>
            </div>
          ) : diagnosis ? (
            <div className="space-y-3 font-sans">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-1.5">
                <h4 className="font-bold text-white flex items-center gap-1.5 text-xs">
                  <HelpCircle className="h-4 w-4 text-indigo-400" />
                  Why Did It Diverge?
                </h4>
                <p className="text-slate-300 leading-relaxed text-xs">{diagnosis.explanation}</p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-1.5">
                <h4 className="font-bold text-white flex items-center gap-1.5 text-xs">
                  <BookOpen className="h-4 w-4 text-amber-400" />
                  Root Cause
                </h4>
                <p className="text-slate-300 leading-relaxed text-xs">{diagnosis.root_cause}</p>
              </div>

              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-1.5">
                <h4 className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs">
                  <Wrench className="h-4 w-4 text-emerald-400" />
                  Recommended Fix
                </h4>
                <p className="text-slate-200 leading-relaxed text-xs">{diagnosis.suggested_fix}</p>
              </div>

              {diagnosis.corrected_code && onApplyFix && (
                <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3.5">
                  <span className="text-xs text-emerald-300 font-semibold flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-emerald-400" />
                    Automated correction ready to apply
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onApplyFix(diagnosis.corrected_code!)
                      onClose()
                    }}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Apply Fix to Code</span>
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-800 bg-slate-900/80 px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}
