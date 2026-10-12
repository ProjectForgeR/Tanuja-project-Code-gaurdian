import React, { useState } from 'react'
import {
  Terminal,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Cpu,
  Copy,
  Check,
  Trash2,
  Wrench,
  Sparkles,
  BookOpen,
  ArrowRight,
} from 'lucide-react'
import { ExecuteResponse } from '@/types/execution'

interface CompilerOutputPanelProps {
  result: ExecuteResponse | null
  isExecuting: boolean
  stdin: string
  onStdinChange: (val: string) => void
  onApplyFix: (correctedCode: string) => void
  onClearOutput: () => void
}

export const CompilerOutputPanel: React.FC<CompilerOutputPanelProps> = ({
  result,
  isExecuting,
  stdin,
  onStdinChange,
  onApplyFix,
  onClearOutput,
}) => {
  const [activeTab, setActiveTab] = useState<'output' | 'errors' | 'ai' | 'stdin'>('output')
  const [copied, setCopied] = useState<boolean>(false)

  const handleCopyOutput = () => {
    if (!result) return
    const textToCopy = result.stdout || result.output || result.stderr || ''
    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Determine badge color and icon based on status
  const getStatusBadge = () => {
    if (!result) return null
    if (result.success) {
      return (
        <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Execution Successful</span>
        </div>
      )
    }
    if (result.status === 'Time Limit Exceeded') {
      return (
        <div className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
          <Clock className="h-3.5 w-3.5" />
          <span>Time Limit Exceeded</span>
        </div>
      )
    }
    if (result.status === 'Compilation Error') {
      return (
        <div className="flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-400">
          <XCircle className="h-3.5 w-3.5" />
          <span>Compilation Error</span>
        </div>
      )
    }
    if (result.status === 'Syntax Error') {
      return (
        <div className="flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-400">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>Syntax Error</span>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400">
        <XCircle className="h-3.5 w-3.5" />
        <span>{result.status || 'Runtime Error'}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-950/80 shadow-2xl backdrop-blur-md overflow-hidden">
      {/* Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 bg-slate-900/70 px-4 py-2.5 gap-2">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('output')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'output'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>Output</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('errors')}
            className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'errors'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Errors</span>
            {result && !result.success && (
              <span className="flex h-2 w-2 rounded-full bg-rose-400 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'ai'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-violet-300" />
            <span>AI Fix & Guide</span>
            {result?.error_detail?.corrected_code && (
              <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] px-1.5 py-0.2 font-bold">
                Fix Ready
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stdin')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'stdin'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
            }`}
          >
            <span>Input (stdin)</span>
            {stdin.trim() && (
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            )}
          </button>
        </div>

        {/* Status and Action Buttons */}
        <div className="flex items-center gap-2">
          {getStatusBadge()}

          {result?.execution_time !== null && result?.execution_time !== undefined && (
            <div className="hidden sm:flex items-center gap-1 rounded-md bg-slate-900 border border-slate-800 px-2 py-0.8 text-[11px] text-slate-400">
              <Clock className="h-3 w-3 text-cyan-400" />
              <span>{(result.execution_time * 1000).toFixed(0)} ms</span>
            </div>
          )}

          {result?.memory_usage_kb !== null && result?.memory_usage_kb !== undefined && (
            <div className="hidden sm:flex items-center gap-1 rounded-md bg-slate-900 border border-slate-800 px-2 py-0.8 text-[11px] text-slate-400">
              <Cpu className="h-3 w-3 text-indigo-400" />
              <span>{(result.memory_usage_kb / 1024).toFixed(1)} MB</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleCopyOutput}
            disabled={!result}
            title="Copy Output"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 transition"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>

          <button
            type="button"
            onClick={onClearOutput}
            disabled={!result && !stdin}
            title="Clear Output"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-rose-400 disabled:opacity-30 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="min-h-[220px] max-h-[380px] overflow-y-auto p-4 text-xs font-mono">
        {isExecuting ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-500 border-t-transparent" />
            <p className="text-xs font-medium text-slate-300">
              Compiling and executing in isolated sandbox...
            </p>
            <span className="text-[11px] text-slate-500">
              Running isolated CPU/memory sandbox container
            </span>
          </div>
        ) : !result ? (
          activeTab === 'stdin' ? (
            <div className="space-y-2 font-sans">
              <label className="text-xs font-semibold text-slate-300">
                Standard Input (stdin)
              </label>
              <p className="text-[11px] text-slate-500">
                Provide multi-line inputs here if your program uses <code>input()</code>, <code>Scanner</code>, or <code>scanf</code>.
              </p>
              <textarea
                value={stdin}
                onChange={(e) => onStdinChange(e.target.value)}
                placeholder="Enter input values here..."
                rows={5}
                className="w-full rounded-xl border border-slate-800 bg-slate-900/90 p-3 text-xs font-mono text-slate-100 placeholder-slate-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-slate-500 font-sans text-center">
              <Terminal className="h-8 w-8 mb-2 text-slate-600 opacity-60" />
              <p className="text-xs font-medium text-slate-400">No Execution Result Yet</p>
              <p className="text-[11px] text-slate-600 mt-1">
                Click <span className="font-semibold text-blue-400">Run Code</span> above to compile and execute your source code in a real secure sandbox.
              </p>
            </div>
          )
        ) : (
          <>
            {/* Tab: OUTPUT */}
            {activeTab === 'output' && (
              <div className="space-y-3">
                {result.stdout ? (
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-sans">
                      Standard Output:
                    </div>
                    <pre className="whitespace-pre-wrap rounded-lg bg-slate-900/80 border border-slate-800/80 p-3 text-emerald-400 leading-relaxed font-mono">
                      {result.stdout}
                    </pre>
                  </div>
                ) : result.output ? (
                  <div>
                    <pre className={`whitespace-pre-wrap rounded-lg border p-3 leading-relaxed font-mono ${
                      result.success
                        ? 'bg-slate-900/80 border-slate-800/80 text-slate-200'
                        : 'bg-rose-950/20 border-rose-900/30 text-rose-300'
                    }`}>
                      {result.output}
                    </pre>
                  </div>
                ) : (
                  <p className="text-slate-500 italic font-sans">
                    Program executed successfully without producing any standard output.
                  </p>
                )}

                {/* If error occurred, show banner pointing to errors tab */}
                {!result.success && (
                  <div className="flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 font-sans">
                    <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>{result.status}: An error was captured during execution.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('ai')}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-rose-500 transition"
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>View AI Fix</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab: ERRORS */}
            {activeTab === 'errors' && (
              <div className="space-y-3 font-sans">
                {result.success ? (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-emerald-400">
                    <CheckCircle2 className="h-5 w-5" />
                    <div>
                      <p className="text-xs font-bold">Zero Errors</p>
                      <p className="text-[11px] text-emerald-500/80">
                        Code compiled and executed with exit code 0.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Diagnostic Summary */}
                    {result.error_detail && (
                      <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-3.5 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                            <AlertTriangle className="h-4 w-4 text-rose-400" />
                            {result.error_detail.error_type}
                          </span>
                          {result.error_detail.line_number && (
                            <span className="rounded-md bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 text-[11px] font-bold text-rose-300 font-mono">
                              Line {result.error_detail.line_number}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-rose-200 leading-relaxed">
                          {result.error_detail.what_went_wrong}
                        </p>
                      </div>
                    )}

                    {/* Raw Compiler / Stderr Dump */}
                    {(result.compile_output || result.stderr) && (
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                          Raw Compiler / Runtime Output:
                        </span>
                        <pre className="whitespace-pre-wrap rounded-lg bg-black/60 border border-slate-800 p-3 text-rose-400 text-[11px] font-mono leading-relaxed overflow-x-auto">
                          {result.compile_output || result.stderr}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Tab: AI RECOMMENDATIONS & FIX */}
            {activeTab === 'ai' && (
              <div className="space-y-4 font-sans">
                {result.success ? (
                  <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-slate-300">
                    <Sparkles className="h-5 w-5 text-violet-400" />
                    <div>
                      <p className="text-xs font-bold">Code is Executing Flawlessly</p>
                      <p className="text-[11px] text-slate-400">
                        No runtime errors or compiler failures detected.
                      </p>
                    </div>
                  </div>
                ) : result.error_detail ? (
                  <div className="space-y-3.5">
                    {/* Diagnosis Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>Why Did This Happen?</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          {result.error_detail.why_it_happened}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                          <Wrench className="h-3.5 w-3.5" />
                          <span>How to Fix It</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          {result.error_detail.how_to_fix}
                        </p>
                      </div>
                    </div>

                    {/* Educational Concept */}
                    {result.error_detail.concept_to_learn && (
                      <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3 flex items-start gap-2.5">
                        <BookOpen className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider block">
                            Key Concept to Learn:
                          </span>
                          <span className="text-xs text-slate-200">
                            {result.error_detail.concept_to_learn}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Corrected Code & Action Button */}
                    <div className="rounded-xl border border-emerald-500/30 bg-slate-900/90 p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                          <Check className="h-4 w-4" />
                          Recommended Solution:
                        </span>
                        {result.error_detail.corrected_code && (
                          <button
                            type="button"
                            onClick={() => onApplyFix(result.error_detail!.corrected_code!)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-500 transition cursor-pointer"
                          >
                            <Wrench className="h-3 w-3" />
                            <span>Fix Code</span>
                          </button>
                        )}
                      </div>
                      {result.error_detail.corrected_code ? (
                        <pre className="whitespace-pre-wrap rounded-lg bg-black/70 border border-slate-800 p-3 text-xs font-mono text-emerald-300 leading-relaxed overflow-x-auto">
                          {result.error_detail.corrected_code}
                        </pre>
                      ) : (
                        <div className="rounded-lg bg-black/40 border border-slate-800 p-3 text-[11px] text-slate-400 leading-relaxed">
                          Follow the instructions in <span className="text-emerald-400 font-semibold">How to Fix It</span> above to resolve this error on Line {result.error_detail.line_number || 1}.
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">
                    No automated recommendation available for this error.
                  </p>
                )}
              </div>
            )}

            {/* Tab: STDIN */}
            {activeTab === 'stdin' && (
              <div className="space-y-2 font-sans">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Program Input (stdin)
                  </label>
                  <span className="text-[10px] text-slate-500">
                    Passed to program during execution
                  </span>
                </div>
                <textarea
                  value={stdin}
                  onChange={(e) => onStdinChange(e.target.value)}
                  placeholder="Enter inputs (e.g. text or numbers on each line)..."
                  rows={6}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/90 p-3 text-xs font-mono text-slate-100 placeholder-slate-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
