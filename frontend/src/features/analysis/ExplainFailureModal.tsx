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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl my-8 rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Test Failure Diagnosis
                <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 uppercase">
                  {testCase.status}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                {testCase.name} ({testCase.category || 'Test'})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Input and Output Comparison */}
        <div className="p-6 space-y-4 text-xs">
          {testCase.input && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono">
              <span className="text-[10px] font-sans text-slate-500 uppercase font-semibold block mb-1">
                Standard Input (Stdin)
              </span>
              <pre className="text-slate-800 whitespace-pre-wrap">{testCase.input}</pre>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
              <span className="text-[10px] font-sans text-emerald-800 uppercase font-semibold block mb-1">
                Expected Output
              </span>
              <pre className="text-emerald-900 whitespace-pre-wrap font-semibold">
                {testCase.expected_output || '(No output expected)'}
              </pre>
            </div>

            <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3">
              <span className="text-[10px] font-sans text-rose-800 uppercase font-semibold block mb-1">
                Actual Output / Divergence
              </span>
              <pre className="text-rose-900 whitespace-pre-wrap font-bold">
                {testCase.actual_output || testCase.mismatch_line || testCase.error_message || '(Empty output)'}
              </pre>
            </div>
          </div>

          {/* AI Explanation / Loading */}
          {isLoading ? (
            <div className="flex items-center justify-center p-8 gap-3 rounded-xl border border-indigo-200 bg-indigo-50/50 text-indigo-700">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              <span className="font-semibold text-xs">Diagnosing failure divergence with AI...</span>
            </div>
          ) : diagnosis ? (
            <div className="space-y-3 font-sans">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-1.5">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <HelpCircle className="h-4 w-4 text-indigo-600" />
                  Why Did It Diverge?
                </h4>
                <p className="text-slate-700 leading-relaxed text-xs">{diagnosis.explanation}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-1.5">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <BookOpen className="h-4 w-4 text-amber-600" />
                  Root Cause
                </h4>
                <p className="text-slate-700 leading-relaxed text-xs">{diagnosis.root_cause}</p>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-1.5">
                <h4 className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs">
                  <Wrench className="h-4 w-4 text-emerald-600" />
                  Recommended Fix
                </h4>
                <p className="text-slate-700 leading-relaxed text-xs">{diagnosis.suggested_fix}</p>
              </div>

              {diagnosis.corrected_code && onApplyFix && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5">
                  <span className="text-xs text-emerald-900 font-semibold flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    Automated correction ready to apply
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onApplyFix(diagnosis.corrected_code!)
                      onClose()
                    }}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition cursor-pointer shadow-xs"
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
        <div className="flex items-center justify-end border-t border-slate-200 bg-slate-50 px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer shadow-2xs"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}
export default ExplainFailureModal
