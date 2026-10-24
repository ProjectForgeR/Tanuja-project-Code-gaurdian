import React, { useState, useMemo } from 'react'
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
  TestTube2,
  FileCode2,
  Play,
  Plus,
  RotateCcw,
  Layers,
  ChevronDown,
  ChevronUp,
  Download,
  Edit3,
  Filter,
  HelpCircle,
  Zap,
} from 'lucide-react'
import {
  ExecuteResponse,
  TestCaseItem,
  TestCaseResultItem,
  RunTestsResponse,
} from '@/types/execution'

interface CompilerOutputPanelProps {
  result: ExecuteResponse | null
  code?: string
  isExecuting: boolean
  stdin: string
  onStdinChange: (val: string) => void
  onApplyFix: (correctedCode: string) => void
  onRunCorrectedCode?: (correctedCode: string) => void
  onClearOutput: () => void
  onJumpToLine?: (line: number) => void
  // Test suite integration
  testCases: TestCaseItem[]
  testResults: RunTestsResponse | null
  isRunningTests: boolean
  isGeneratingTests: boolean
  onRunTests: () => void
  onRunSingleTest?: (item: TestCaseItem) => void
  onAddTestCase: (item: TestCaseItem) => void
  onUpdateTestCase?: (item: TestCaseItem) => void
  onDeleteTestCase: (id: string) => void
  onClearTestCases?: () => void
  onGenerateTestCases: () => void
  onExplainTestFailure?: (tc: TestCaseResultItem) => void
  activeTabOverride?: 'output' | 'errors' | 'tests' | 'logs' | 'stdin'
  onTabChange?: (tab: 'output' | 'errors' | 'tests' | 'logs' | 'stdin') => void
}

export const CompilerOutputPanel: React.FC<CompilerOutputPanelProps> = ({
  result,
  code,
  isExecuting,
  stdin,
  onStdinChange,
  onApplyFix,
  onRunCorrectedCode,
  onClearOutput,
  onJumpToLine,
  testCases,
  testResults,
  isRunningTests,
  isGeneratingTests,
  onRunTests,
  onRunSingleTest,
  onAddTestCase,
  onUpdateTestCase,
  onDeleteTestCase,
  onClearTestCases,
  onGenerateTestCases,
  onExplainTestFailure,
  activeTabOverride,
  onTabChange,
}) => {
  const [internalTab, setInternalTab] = useState<'output' | 'errors' | 'tests' | 'logs' | 'stdin'>('output')
  const [copied, setCopied] = useState<boolean>(false)
  const [showAddModal, setShowAddModal] = useState<boolean>(false)
  const [newCaseName, setNewCaseName] = useState<string>('')
  const [newCaseInput, setNewCaseInput] = useState<string>('')
  const [newCaseExpected, setNewCaseExpected] = useState<string>('')
  const [newCaseCategory, setNewCaseCategory] = useState<string>('Normal')
  const [newCaseReason, setNewCaseReason] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')

  // Inline editing state for test cases
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null)
  const [editInputVal, setEditInputVal] = useState<string>('')
  const [editExpectedVal, setEditExpectedVal] = useState<string>('')

  const activeTab = activeTabOverride || internalTab
  const setActiveTab = (tab: 'output' | 'errors' | 'tests' | 'logs' | 'stdin') => {
    if (onTabChange) onTabChange(tab)
    setInternalTab(tab)
  }

  const handleCopyOutput = () => {
    if (!result) return
    const textToCopy = result.stdout || result.output || result.stderr || ''
    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCreateTestCase = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCaseName.trim()) return
    onAddTestCase({
      id: `tc-${Date.now()}`,
      name: newCaseName.trim(),
      input: newCaseInput,
      expected_output: newCaseExpected,
      category: newCaseCategory,
      reason: newCaseReason.trim() || undefined,
      is_user_edited: true,
    })
    setNewCaseName('')
    setNewCaseInput('')
    setNewCaseExpected('')
    setNewCaseCategory('Normal')
    setNewCaseReason('')
    setShowAddModal(false)
  }

  const handleExportTests = () => {
    if (testCases.length === 0) return
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(testCases, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `test_cases_${Date.now()}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  const filteredTestCases = useMemo(() => {
    if (selectedCategory === 'All') return testCases
    return testCases.filter(
      (tc) => (tc.category || 'Normal').toLowerCase() === selectedCategory.toLowerCase()
    )
  }, [testCases, selectedCategory])

  // Helper to synthesize client-side fix if backend didn't provide one
  const getClientSynthesizedFix = (): string | null => {
    if (!code || !result || result.success) return null
    const lineNo = result.error_detail?.line_number || 1
    const lines = code.split('\n')
    const lineIdx = Math.max(0, lineNo - 1)
    if (lineIdx >= lines.length) return code
    const errLine = lines[lineIdx]
    const errText = (result.error_detail?.raw_message || result.stderr || result.compile_output || '').toLowerCase()
    const linesCopy = [...lines]

    // Missing colon in Python
    if (
      errText.includes("expected ':'") ||
      errText.includes("missing ':'") ||
      /^\s*(if|elif|else|for|while|def|class|try|except|finally|with)\b/.test(errLine)
    ) {
      if (!errLine.trimEnd().endsWith(':')) {
        linesCopy[lineIdx] = errLine.trimEnd() + ':'
        return linesCopy.join('\n')
      }
    }

    // Missing semicolon in C, C++, Java, JS, C#
    if (
      errText.includes("expected ';'") ||
      errText.includes("missing ';'") ||
      (!errLine.trimEnd().endsWith(';') && !errLine.trimEnd().endsWith('{') && !errLine.trimEnd().endsWith('}'))
    ) {
      linesCopy[lineIdx] = errLine.trimEnd() + ';'
      return linesCopy.join('\n')
    }

    // Unmatched parens
    const openP = (errLine.match(/\(/g) || []).length - (errLine.match(/\)/g) || []).length
    if (openP > 0) {
      linesCopy[lineIdx] = errLine.trimEnd() + ')'.repeat(openP)
      return linesCopy.join('\n')
    }

    return linesCopy.join('\n')
  }

  const effectiveFix = result?.error_detail?.corrected_code || getClientSynthesizedFix()

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
        <div className="flex items-center gap-1 overflow-x-auto">
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
            onClick={() => setActiveTab('tests')}
            className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'tests'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
            }`}
          >
            <TestTube2 className="h-3.5 w-3.5" />
            <span>Test Results</span>
            {testResults && (
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  testResults.all_passed
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/20 text-rose-400'
                }`}
              >
                {testResults.passed}/{testResults.total}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'logs'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
            }`}
          >
            <FileCode2 className="h-3.5 w-3.5" />
            <span>Build Logs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stdin')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'stdin'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
            }`}
          >
            <span>Stdin</span>
            {stdin.trim() && (
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            )}
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {result && (
            <button
              type="button"
              onClick={handleCopyOutput}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white"
              title="Copy output to clipboard"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onClearOutput}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-400 transition hover:bg-slate-700 hover:text-rose-400"
            title="Clear output console"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Status Bar */}
      {result && (
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800/60 bg-slate-900/40 px-4 py-2 text-xs">
          <div className="flex items-center gap-3">
            {getStatusBadge()}
            {result.exit_code !== undefined && result.exit_code !== null && (
              <span className="font-mono text-[11px] text-slate-400">
                Exit Code: <strong className={result.exit_code === 0 ? 'text-emerald-400' : 'text-rose-400'}>{result.exit_code}</strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            {result.execution_time !== null && result.execution_time !== undefined && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-500" />
                <span>{result.execution_time.toFixed(3)}s</span>
              </span>
            )}
            {result.memory_usage_kb !== null && result.memory_usage_kb !== undefined && (
              <span className="flex items-center gap-1">
                <Cpu className="h-3.5 w-3.5 text-slate-500" />
                <span>{(result.memory_usage_kb / 1024).toFixed(1)} MB</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <div className="h-[430px] overflow-y-auto p-4 font-mono text-xs text-slate-200">
        {/* Loading State */}
        {isExecuting && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            <p className="mt-3 text-sm font-semibold text-white">Running Program in Isolated Sandbox...</p>
            <p className="mt-1 text-xs text-slate-400">Executing within Judge0 secure sandbox with memory and CPU bounds.</p>
          </div>
        )}

        {/* Tab 1: Terminal Output */}
        {!isExecuting && activeTab === 'output' && (
          <>
            {result ? (
              <div className="space-y-3">
                {result.output ? (
                  <pre className="whitespace-pre-wrap leading-relaxed text-slate-100 font-mono selection:bg-blue-600">
                    {result.output}
                  </pre>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-xs">
                    <CheckCircle2 className="h-8 w-8 text-emerald-400 mb-2" />
                    <span>Program executed successfully with no output returned.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
                <Terminal className="h-10 w-10 text-slate-600 mb-2" />
                <p className="font-semibold text-slate-300">Sandbox Ready for Execution</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Click <strong>&quot;Run Code&quot;</strong> in the toolbar above to execute in isolated sandbox and see real stdout.
                </p>
              </div>
            )}
          </>
        )}

        {/* Tab 2: Errors & Diagnostics */}
        {!isExecuting && activeTab === 'errors' && (
          <>
            {result && !result.success ? (
              <div className="space-y-4 font-sans">
                {/* Error Banner */}
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-400 flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      {result.error_detail?.error_type || result.status}
                    </span>
                    {result.error_detail?.line_number && (
                      <button
                        type="button"
                        onClick={() => onJumpToLine && onJumpToLine(result.error_detail!.line_number!)}
                        className="inline-flex items-center gap-1 rounded-md bg-rose-900/60 px-2 py-0.5 text-[11px] font-semibold text-rose-200 hover:bg-rose-800 transition"
                      >
                        <span>Line {result.error_detail.line_number}</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <pre className="mt-2 overflow-x-auto font-mono text-[11px] text-rose-200/90 whitespace-pre-wrap">
                    {result.stderr || result.compile_output || result.output}
                  </pre>
                </div>

                {/* Educational Diagnosis Cards */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
                    <h4 className="font-bold text-slate-200 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                      What Went Wrong
                    </h4>
                    <p className="mt-1.5 text-slate-300 leading-relaxed">
                      {result.error_detail?.what_went_wrong ||
                        'The program encountered a compilation, syntax, or runtime error during execution.'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
                    <h4 className="font-bold text-slate-200 flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-blue-400" />
                      Why It Happened
                    </h4>
                    <p className="mt-1.5 text-slate-300 leading-relaxed">
                      {result.error_detail?.why_it_happened ||
                        'The interpreter or compiler could not process this line due to an unexpected token, grammar error, or invalid instruction.'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 sm:col-span-2">
                    <h4 className="font-bold text-slate-200 flex items-center gap-1.5">
                      <Wrench className="h-3.5 w-3.5 text-emerald-400" />
                      Recommended Solution
                    </h4>
                    <p className="mt-1.5 text-slate-300 leading-relaxed">
                      {result.error_detail?.how_to_fix ||
                        'Inspect the highlighted line above and apply the auto-corrected code below.'}
                    </p>
                  </div>

                  {/* Auto-remediation Apply Button: ALWAYS ENABLED FOR EVERY CODE ERROR */}
                  {effectiveFix && (
                    <div className="sm:col-span-2 flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
                      <div className="text-xs">
                        <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5" />
                          AI Corrected Code Available
                        </span>
                        <span className="text-[11px] text-slate-300">
                          Synthesized syntax repair is ready to apply.
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => onApplyFix(effectiveFix)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 transition cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Apply Fix
                        </button>
                        {onRunCorrectedCode && (
                          <button
                            type="button"
                            onClick={() => onRunCorrectedCode(effectiveFix)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition cursor-pointer"
                          >
                            <Play className="h-3.5 w-3.5 fill-white" />
                            Apply & Verify
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
                <CheckCircle2 className="h-10 w-10 text-emerald-400 mb-2" />
                <p className="font-semibold text-slate-300">No Execution Errors</p>
                <p className="text-xs text-slate-500 mt-1">Standard error stream is clean.</p>
              </div>
            )}
          </>
        )}

        {/* Tab 3: Test Results */}
        {!isExecuting && activeTab === 'tests' && (
          <div className="space-y-4 font-sans">
            {/* Header / Summary */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <TestTube2 className="h-4 w-4 text-purple-400" />
                  Automated Test Verification Bench
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Verify runtime output against assertions across normal, edge, invalid, and branch coverage categories.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onGenerateTestCases}
                  disabled={isGeneratingTests}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-500/10 px-3 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 disabled:opacity-50 transition cursor-pointer"
                  title="Dynamically generate structured test suite using AI & AST analysis"
                >
                  {isGeneratingTests ? (
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  <span>Generate Test Cases</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Case</span>
                </button>

                {testCases.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={handleExportTests}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition"
                      title="Export test suite as JSON"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Export</span>
                    </button>

                    {onClearTestCases && (
                      <button
                        type="button"
                        onClick={onClearTestCases}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 px-2.5 py-1.5 text-xs text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition"
                        title="Clear all test cases"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </>
                )}

                <button
                  type="button"
                  onClick={onRunTests}
                  disabled={isRunningTests || testCases.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-purple-600/20 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 transition cursor-pointer"
                >
                  {isRunningTests ? (
                    <>
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Executing Suite...</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5 fill-white" />
                      <span>Run All Tests</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Test Results Progress & Telemetry */}
            {testResults && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-3">
                    <span className={`font-bold flex items-center gap-1.5 ${testResults.all_passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {testResults.all_passed ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          All Tests Passed ({testResults.passed}/{testResults.total})
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-rose-400" />
                          Test Failures Detected: {testResults.failed} failed, {testResults.errors} errors
                        </>
                      )}
                    </span>
                    {testResults.timeouts !== undefined && testResults.timeouts > 0 && (
                      <span className="flex items-center gap-1 rounded bg-amber-500/20 px-2 py-0.5 text-[11px] font-bold text-amber-400">
                        <Clock className="h-3 w-3" />
                        {testResults.timeouts} Timed Out
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                    {testResults.duration_seconds !== undefined && (
                      <span className="flex items-center gap-1">
                        <Zap className="h-3 w-3 text-amber-400" />
                        {testResults.duration_seconds}s
                      </span>
                    )}
                    {testResults.estimated_coverage !== undefined && (
                      <span className="rounded-md border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 font-semibold text-indigo-300">
                        ~{testResults.estimated_coverage}% Est. Coverage
                      </span>
                    )}
                    <span className="font-semibold text-white">
                      Pass Rate: {testResults.pass_percentage ?? Math.round((testResults.passed / testResults.total) * 100)}%
                    </span>
                  </div>
                </div>

                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-500"
                    style={{ width: `${(testResults.passed / testResults.total) * 100}%` }}
                    title={`Passed: ${testResults.passed}`}
                  />
                  <div
                    className="bg-rose-500 h-full transition-all duration-500"
                    style={{ width: `${(testResults.failed / testResults.total) * 100}%` }}
                    title={`Failed: ${testResults.failed}`}
                  />
                  <div
                    className="bg-amber-500 h-full transition-all duration-500"
                    style={{ width: `${(testResults.errors / testResults.total) * 100}%` }}
                    title={`Errors: ${testResults.errors}`}
                  />
                </div>
              </div>
            )}

            {/* Category Filter Pills */}
            {testCases.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pb-1">
                <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1 mr-1">
                  <Filter className="h-3 w-3" /> Filter:
                </span>
                {['All', 'Normal', 'Boundary / Edge', 'Invalid Input', 'Branch Coverage', 'Regression'].map((cat) => {
                  const count = cat === 'All'
                    ? testCases.length
                    : testCases.filter((tc) => (tc.category || 'Normal').toLowerCase() === cat.toLowerCase()).length
                  if (cat !== 'All' && count === 0) return null
                  const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase()
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                        isSelected
                          ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                          : 'border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <span>{cat}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-purple-800 text-purple-200' : 'bg-slate-800 text-slate-400'}`}>
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Test Case Cards List */}
            {filteredTestCases.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800/80 bg-slate-900/40 p-8 text-center text-slate-400">
                <TestTube2 className="h-8 w-8 text-slate-600 mb-2" />
                <p className="font-semibold text-slate-300 text-xs">
                  {testCases.length === 0 ? 'No Test Cases Configured' : 'No Test Cases in This Category'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
                  {testCases.length === 0
                    ? 'Click "Generate Test Cases" or "Add Case" to define test inputs and expected outputs.'
                    : 'Select "All" to view test cases in other categories.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTestCases.map((tc, idx) => {
                  const resItem = testResults?.results.find((r) => r.id === tc.id)
                  const status = resItem ? resItem.status : 'not_run'
                  const isEditing = editingCaseId === tc.id

                  return (
                    <div
                      key={tc.id}
                      className={`rounded-xl border p-3.5 transition ${
                        status === 'passed'
                          ? 'border-emerald-500/30 bg-emerald-500/5'
                          : status === 'failed'
                          ? 'border-rose-500/30 bg-rose-500/5'
                          : status === 'timeout'
                          ? 'border-amber-500/40 bg-amber-500/10'
                          : status === 'error'
                          ? 'border-amber-500/30 bg-amber-500/5'
                          : 'border-slate-800 bg-slate-900/40'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-xs text-white">
                            #{idx + 1} {tc.name}
                          </span>

                          {/* Status Badge */}
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                              status === 'passed'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : status === 'failed'
                                ? 'bg-rose-500/20 text-rose-400'
                                : status === 'timeout'
                                ? 'bg-amber-500/20 text-amber-400'
                                : status === 'error'
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {status === 'passed' && <Check className="h-3 w-3" />}
                            {status === 'failed' && <XCircle className="h-3 w-3" />}
                            {status === 'timeout' && <Clock className="h-3 w-3" />}
                            <span>{status === 'not_run' ? 'Not Run' : status}</span>
                          </span>

                          {/* Category Badge */}
                          {tc.category && (
                            <span className="rounded border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-300">
                              {tc.category}
                            </span>
                          )}

                          {tc.is_user_edited && (
                            <span className="rounded border border-blue-500/30 bg-blue-500/10 px-1.5 py-0.5 text-[10px] text-blue-300">
                              Edited
                            </span>
                          )}

                          {tc.is_verified && (
                            <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-300" title="Output verified by runtime sandbox execution">
                              Verified Oracle
                            </span>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1">
                          {onRunSingleTest && (
                            <button
                              type="button"
                              onClick={() => onRunSingleTest(tc)}
                              disabled={isRunningTests}
                              className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-300 hover:bg-purple-600 hover:text-white transition disabled:opacity-50 cursor-pointer"
                              title="Run only this test case"
                            >
                              <Play className="h-3.5 w-3.5 fill-current" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              if (isEditing) {
                                setEditingCaseId(null)
                              } else {
                                setEditingCaseId(tc.id)
                                setEditInputVal(tc.input || '')
                                setEditExpectedVal(tc.expected_output || '')
                              }
                            }}
                            className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700 transition"
                            title={isEditing ? 'Cancel Edit' : 'Edit Input & Expected Output'}
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteTestCase(tc.id)}
                            className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition"
                            title="Remove test case"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Reason / Target Hypothesis */}
                      {tc.reason && (
                        <p className="mt-1.5 text-[11px] text-slate-400 italic">
                          Target: {tc.reason}
                        </p>
                      )}

                      {/* Inline Editing Form */}
                      {isEditing ? (
                        <div className="mt-3 rounded-lg border border-slate-700 bg-slate-950 p-3 space-y-2.5">
                          <div>
                            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                              Stdin Input:
                            </label>
                            <textarea
                              rows={2}
                              value={editInputVal}
                              onChange={(e) => setEditInputVal(e.target.value)}
                              className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 font-mono text-xs text-white placeholder-slate-600 focus:border-purple-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                              Expected Output:
                            </label>
                            <textarea
                              rows={2}
                              value={editExpectedVal}
                              onChange={(e) => setEditExpectedVal(e.target.value)}
                              className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 font-mono text-xs text-emerald-300 placeholder-slate-600 focus:border-purple-500 focus:outline-none"
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingCaseId(null)}
                              className="rounded-md border border-slate-800 px-2.5 py-1 text-xs text-slate-400 hover:bg-slate-900"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onUpdateTestCase?.({
                                  ...tc,
                                  input: editInputVal,
                                  expected_output: editExpectedVal,
                                  is_user_edited: true,
                                })
                                setEditingCaseId(null)
                              }}
                              className="rounded-md bg-purple-600 px-3 py-1 text-xs font-semibold text-white hover:bg-purple-500"
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Stdin and Expected vs Actual Output Display */
                        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs font-mono">
                          {tc.input && (
                            <div className="sm:col-span-2 rounded-lg bg-slate-950 p-2 text-slate-300">
                              <span className="text-[10px] text-slate-500 uppercase block font-sans font-semibold">
                                Test Input (Stdin):
                              </span>
                              <pre className="mt-0.5 whitespace-pre-wrap">{tc.input}</pre>
                            </div>
                          )}

                          <div className="rounded-lg bg-slate-950 p-2 text-slate-300">
                            <span className="text-[10px] text-slate-500 uppercase block font-sans font-semibold">
                              Expected Output:
                            </span>
                            <pre className="mt-0.5 whitespace-pre-wrap text-emerald-300">
                              {tc.expected_output || '(Empty / Any)'}
                            </pre>
                          </div>

                          <div className="rounded-lg bg-slate-950 p-2 text-slate-300">
                            <span className="text-[10px] text-slate-500 uppercase block font-sans font-semibold">
                              Actual Output:
                            </span>
                            <pre
                              className={`mt-0.5 whitespace-pre-wrap ${
                                status === 'passed'
                                  ? 'text-emerald-300'
                                  : status === 'failed'
                                  ? 'text-rose-300 font-semibold'
                                  : status === 'timeout'
                                  ? 'text-amber-300'
                                  : 'text-slate-400'
                              }`}
                            >
                              {resItem ? resItem.actual_output || '(No output)' : 'Pending test run...'}
                            </pre>
                          </div>
                        </div>
                      )}

                      {/* Mismatch Callout */}
                      {resItem?.mismatch_line && (
                        <div className="mt-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-xs font-sans text-rose-300">
                          <strong>Failure Mismatch:</strong> {resItem.mismatch_line}
                        </div>
                      )}

                      {/* Error / Timeout details */}
                      {resItem?.error_message && (
                        <div className="mt-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-xs font-mono text-amber-300 whitespace-pre-wrap">
                          {resItem.error_message}
                        </div>
                      )}

                      {/* AI Explain Failure Button (for failed / timeout / error results) */}
                      {(status === 'failed' || status === 'error' || status === 'timeout') && (
                        <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                          <span className="text-[11px] text-slate-400">
                            Execution diverged from assertion. Diagnose root cause and generate a verified patch:
                          </span>
                          <button
                            type="button"
                            onClick={() => onExplainTestFailure && resItem && onExplainTestFailure(resItem)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-500/10 px-3 py-1.5 text-xs font-bold text-purple-300 hover:bg-purple-500/20 transition cursor-pointer shadow-sm shadow-purple-900/30"
                          >
                            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                            <span>Explain Failure with AI</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Modal: Add Test Case */}
            {showAddModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Plus className="h-4 w-4 text-purple-400" />
                    Create Custom Test Case
                  </h3>
                  <form onSubmit={handleCreateTestCase} className="mt-4 space-y-3 text-xs">
                    <div>
                      <label className="font-semibold text-slate-300 block mb-1">Test Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Test with Negative Integers"
                        value={newCaseName}
                        onChange={(e) => setNewCaseName(e.target.value)}
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 px-3 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-semibold text-slate-300 block mb-1">Category</label>
                        <select
                          value={newCaseCategory}
                          onChange={(e) => setNewCaseCategory(e.target.value)}
                          className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 px-3 text-white focus:border-purple-500 focus:outline-none"
                        >
                          <option value="Normal">Normal</option>
                          <option value="Boundary / Edge">Boundary / Edge</option>
                          <option value="Invalid Input">Invalid Input</option>
                          <option value="Branch Coverage">Branch Coverage</option>
                          <option value="Regression">Regression</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-semibold text-slate-300 block mb-1">Reason / Purpose</label>
                        <input
                          type="text"
                          placeholder="e.g. Zero division guard"
                          value={newCaseReason}
                          onChange={(e) => setNewCaseReason(e.target.value)}
                          className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 px-3 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-300 block mb-1">
                        Standard Input (Stdin) <span className="text-slate-500 font-normal">(optional)</span>
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Input data piped to program"
                        value={newCaseInput}
                        onChange={(e) => setNewCaseInput(e.target.value)}
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 px-3 font-mono text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-300 block mb-1">
                        Expected Output (Stdout)
                      </label>
                      <textarea
                        rows={3}
                        required
                        placeholder="Exact output expected from program"
                        value={newCaseExpected}
                        onChange={(e) => setNewCaseExpected(e.target.value)}
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 px-3 font-mono text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddModal(false)}
                        className="rounded-lg border border-slate-700 px-3 py-1.5 text-slate-300 hover:bg-slate-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded-lg bg-purple-600 px-4 py-1.5 font-bold text-white hover:bg-purple-500"
                      >
                        Save Test Case
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Build Logs */}
        {!isExecuting && activeTab === 'logs' && (
          <div className="space-y-3 font-mono text-xs">
            {result ? (
              <div>
                <div className="text-slate-400 border-b border-slate-800 pb-2 mb-3">
                  <span>Compiler Sandbox Diagnostic Logs & Environment Telemetry</span>
                </div>
                <div className="space-y-2">
                  <div className="text-slate-300">
                    <span className="text-blue-400 font-bold">[Execution Target]</span>{' '}
                    Language: <span className="text-white">{result.language}</span>
                  </div>
                  <div className="text-slate-300">
                    <span className="text-blue-400 font-bold">[Status Code]</span>{' '}
                    Result: <span className={result.success ? 'text-emerald-400' : 'text-rose-400'}>{result.status}</span>
                  </div>
                  {result.compile_output && (
                    <div>
                      <div className="text-amber-400 font-bold mb-1">[Compiler Diagnostic Output]:</div>
                      <pre className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-amber-300 whitespace-pre-wrap">
                        {result.compile_output}
                      </pre>
                    </div>
                  )}
                  {result.stderr && (
                    <div>
                      <div className="text-rose-400 font-bold mb-1">[Standard Error Stream]:</div>
                      <pre className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-rose-300 whitespace-pre-wrap">
                        {result.stderr}
                      </pre>
                    </div>
                  )}
                  <div className="text-slate-400 text-[11px] pt-2">
                    Sandbox Engine: Judge0 CE Isolated Micro-VM / Safe SQLite In-Memory Database
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
                <FileCode2 className="h-10 w-10 text-slate-600 mb-2" />
                <p className="font-semibold text-slate-300">No Build Logs Available</p>
                <p className="text-xs text-slate-500 mt-1">Run code to capture compiler and linker outputs.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Stdin Input Controls */}
        {!isExecuting && activeTab === 'stdin' && (
          <div className="space-y-3 font-sans text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div>
                <h4 className="font-bold text-white">Interactive Program Standard Input (Stdin)</h4>
                <p className="text-[11px] text-slate-400">
                  Data supplied here will be piped into standard input when your program calls <code>input()</code>, <code>Scanner</code>, or <code>cin</code>.
                </p>
              </div>
              {stdin.trim() && (
                <button
                  type="button"
                  onClick={() => onStdinChange('')}
                  className="text-xs text-slate-400 hover:text-rose-400 transition"
                >
                  Clear Stdin
                </button>
              )}
            </div>

            <textarea
              rows={8}
              value={stdin}
              onChange={(e) => onStdinChange(e.target.value)}
              placeholder="Enter inputs line by line (e.g.&#10;10&#10;20&#10;Alice)..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-white placeholder-slate-600 focus:border-amber-500 focus:outline-none"
            />

            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className="text-slate-500 font-semibold py-1">Quick Presets:</span>
              <button
                type="button"
                onClick={() => onStdinChange('42\n')}
                className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-slate-300 hover:bg-slate-800"
              >
                Integer (42)
              </button>
              <button
                type="button"
                onClick={() => onStdinChange('15\n25\n')}
                className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-slate-300 hover:bg-slate-800"
              >
                Two Numbers (15, 25)
              </button>
              <button
                type="button"
                onClick={() => onStdinChange('Alice\n')}
                className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-slate-300 hover:bg-slate-800"
              >
                String (&apos;Alice&apos;)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CompilerOutputPanel
