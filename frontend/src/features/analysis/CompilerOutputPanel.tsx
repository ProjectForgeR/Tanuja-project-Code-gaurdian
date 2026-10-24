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
  ShieldCheck,
  ExternalLink,
} from 'lucide-react'
import {
  ExecuteResponse,
  TestCaseItem,
  TestCaseResultItem,
  RunTestsResponse,
} from '@/types/execution'
import { Finding, DuplicateGroup } from '@/types/analysis'
import { FindingsList } from './FindingsList'
import { DuplicateGroupsView } from './DuplicateGroupsView'

export type ResultsPanelTab = 'output' | 'errors' | 'tests' | 'logs' | 'audit' | 'preview'

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
  activeTabOverride?: ResultsPanelTab
  onTabChange?: (tab: ResultsPanelTab) => void
  // Security Audit integration
  findings?: Finding[]
  duplicateGroups?: DuplicateGroup[]
  onReviewFix?: (finding: Finding) => void
  onGenerateFindingTests?: (finding: Finding) => void
  // Web Live Preview integration
  previewDocument?: string
  isWebPreview?: boolean
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
  findings = [],
  duplicateGroups = [],
  onReviewFix,
  onGenerateFindingTests,
  previewDocument,
  isWebPreview = false,
}) => {
  const [internalTab, setInternalTab] = useState<ResultsPanelTab>('output')
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
  const setActiveTab = (tab: ResultsPanelTab) => {
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
        <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Execution Successful</span>
        </div>
      )
    }
    if (result.status === 'Time Limit Exceeded') {
      return (
        <div className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
          <Clock className="h-3.5 w-3.5" />
          <span>Time Limit Exceeded</span>
        </div>
      )
    }
    if (result.status === 'Compilation Error') {
      return (
        <div className="flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
          <XCircle className="h-3.5 w-3.5" />
          <span>Compilation Error</span>
        </div>
      )
    }
    if (result.status === 'Syntax Error') {
      return (
        <div className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>Syntax Error</span>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
        <XCircle className="h-3.5 w-3.5" />
        <span>{result.status || 'Runtime Error'}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      {/* Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 gap-2">
        {/* Navigation Tabs - Highlighted in Blue */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {/* Tab: Output */}
          <button
            type="button"
            onClick={() => setActiveTab('output')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              activeTab === 'output'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>Output</span>
          </button>

          {/* Tab: Errors */}
          <button
            type="button"
            onClick={() => setActiveTab('errors')}
            className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              activeTab === 'errors'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Errors</span>
            {result && !result.success && (
              <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>

          {/* Tab: Test Results */}
          <button
            type="button"
            onClick={() => setActiveTab('tests')}
            className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              activeTab === 'tests'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <TestTube2 className="h-3.5 w-3.5" />
            <span>Test Results</span>
            {testResults && (
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  activeTab === 'tests'
                    ? 'bg-blue-700 text-white'
                    : testResults.all_passed
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                {testResults.passed}/{testResults.total}
              </span>
            )}
          </button>

          {/* Tab: Build Logs */}
          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <FileCode2 className="h-3.5 w-3.5" />
            <span>Build Logs</span>
          </button>

          {/* Tab: Security Audit */}
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Security Audit</span>
            {findings.length > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  activeTab === 'audit'
                    ? 'bg-blue-700 text-white'
                    : 'bg-violet-100 text-violet-700'
                }`}
              >
                {findings.length}
              </span>
            )}
          </button>

          {/* Tab: Live Preview (Conditional for Web Languages) */}
          {isWebPreview && (
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Live Preview</span>
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {result && activeTab === 'output' && (
            <button
              type="button"
              onClick={handleCopyOutput}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50 cursor-pointer shadow-2xs"
              title="Copy output to clipboard"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-500" />
                  <span>Copy</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onClearOutput}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-rose-600 cursor-pointer shadow-2xs"
            title="Clear output console"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Status Bar */}
      {result && (activeTab === 'output' || activeTab === 'errors' || activeTab === 'logs') && (
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 bg-slate-50/50 px-4 py-2 text-xs">
          <div className="flex items-center gap-3">
            {getStatusBadge()}
            {result.exit_code !== undefined && result.exit_code !== null && (
              <span className="font-mono text-[11px] text-slate-600">
                Exit Code:{' '}
                <strong className={result.exit_code === 0 ? 'text-emerald-700' : 'text-rose-700'}>
                  {result.exit_code}
                </strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            {result.execution_time !== null && result.execution_time !== undefined && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>{result.execution_time.toFixed(3)}s</span>
              </span>
            )}
            {result.memory_usage_kb !== null && result.memory_usage_kb !== undefined && (
              <span className="flex items-center gap-1">
                <Cpu className="h-3.5 w-3.5 text-slate-400" />
                <span>{(result.memory_usage_kb / 1024).toFixed(1)} MB</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <div className="min-h-[440px] max-h-[580px] overflow-y-auto p-4 bg-white text-slate-900">
        {/* Loading State */}
        {isExecuting && (
          <div className="flex min-h-[380px] flex-col items-center justify-center text-center">
            <div className="h-9 w-9 animate-spin rounded-full border-3 border-emerald-600 border-t-transparent" />
            <p className="mt-3.5 text-sm font-bold text-slate-900">Running Program in Isolated Sandbox...</p>
            <p className="mt-1 text-xs text-slate-500">
              Executing in isolated Judge0 sandbox environment with strict memory and CPU boundaries.
            </p>
          </div>
        )}

        {/* Tab 1: Terminal Output */}
        {!isExecuting && activeTab === 'output' && (
          <>
            {result ? (
              <div className="space-y-3">
                {result.output ? (
                  <pre className="rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs text-slate-900 whitespace-pre-wrap leading-relaxed shadow-inner">
                    {result.output}
                  </pre>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 py-16 text-slate-500 text-xs">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600 mb-2" />
                    <span className="font-semibold text-slate-800">Program executed successfully with no output returned.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center text-slate-500">
                <Terminal className="h-10 w-10 text-slate-400 mb-2.5" />
                <p className="font-bold text-slate-800 text-sm">Sandbox Ready for Execution</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
                  Click <strong className="text-emerald-700">&quot;Run Code&quot;</strong> in the toolbar to execute your code in an isolated environment and view real stdout.
                </p>
              </div>
            )}
          </>
        )}

        {/* Tab 2: Errors & Diagnostics */}
        {!isExecuting && activeTab === 'errors' && (
          <>
            {result && !result.success ? (
              <div className="space-y-4">
                {/* Error Banner */}
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-800 flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-rose-600" />
                      {result.error_detail?.error_type || result.status}
                    </span>
                    {result.error_detail?.line_number && (
                      <button
                        type="button"
                        onClick={() => onJumpToLine && onJumpToLine(result.error_detail!.line_number!)}
                        className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-800 hover:bg-rose-200 transition cursor-pointer"
                      >
                        <span>Line {result.error_detail.line_number}</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <pre className="mt-2.5 overflow-x-auto rounded-lg bg-white/80 p-2.5 font-mono text-[11px] text-rose-950 whitespace-pre-wrap border border-rose-200">
                    {result.stderr || result.compile_output || result.output}
                  </pre>
                </div>

                {/* Educational Diagnosis Cards */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5">
                    <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                      What Went Wrong
                    </h4>
                    <p className="mt-1.5 text-slate-700 leading-relaxed">
                      {result.error_detail?.what_went_wrong ||
                        'The program encountered a compilation, syntax, or runtime error during execution.'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5">
                    <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                      Why It Happened
                    </h4>
                    <p className="mt-1.5 text-slate-700 leading-relaxed">
                      {result.error_detail?.why_it_happened ||
                        'The interpreter or compiler could not process this line due to an unexpected token or invalid instruction.'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 sm:col-span-2">
                    <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Wrench className="h-3.5 w-3.5 text-emerald-600" />
                      Recommended Solution
                    </h4>
                    <p className="mt-1.5 text-slate-700 leading-relaxed">
                      {result.error_detail?.how_to_fix ||
                        'Inspect the highlighted line above and apply the auto-corrected code below.'}
                    </p>
                  </div>

                  {/* Auto-remediation Apply Button */}
                  {effectiveFix && (
                    <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5">
                      <div className="text-xs">
                        <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                          AI Corrected Code Available
                        </span>
                        <span className="text-[11px] text-emerald-800">
                          Synthesized syntax repair is ready to apply.
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => onApplyFix(effectiveFix)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Apply Fix
                        </button>
                        {onRunCorrectedCode && (
                          <button
                            type="button"
                            onClick={() => onRunCorrectedCode(effectiveFix)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer"
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
              <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center text-slate-500">
                <CheckCircle2 className="h-10 w-10 text-emerald-600 mb-2" />
                <p className="font-bold text-slate-800 text-sm">No Execution Errors</p>
                <p className="text-xs text-slate-500 mt-1">Standard error stream is clean. Code executed without fatal errors.</p>
              </div>
            )}
          </>
        )}

        {/* Tab 3: Test Results */}
        {!isExecuting && activeTab === 'tests' && (
          <div className="space-y-4 font-sans">
            {/* Header / Summary */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <TestTube2 className="h-4 w-4 text-purple-600" />
                  Automated Test Verification Bench
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Verify runtime output against assertions across normal, edge, invalid, and branch coverage categories.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onGenerateTestCases}
                  disabled={isGeneratingTests}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 disabled:opacity-50 transition cursor-pointer"
                  title="Dynamically generate structured test suite using AI & AST analysis"
                >
                  {isGeneratingTests ? (
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  <span>Generate Test Cases</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Case</span>
                </button>

                {testCases.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={handleExportTests}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                      title="Export test suite as JSON"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Export</span>
                    </button>

                    {onClearTestCases && (
                      <button
                        type="button"
                        onClick={onClearTestCases}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 hover:text-rose-600 transition cursor-pointer shadow-2xs"
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
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 transition cursor-pointer"
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
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-bold flex items-center gap-1.5 ${
                        testResults.all_passed ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {testResults.all_passed ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          All Tests Passed ({testResults.passed}/{testResults.total})
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-rose-600" />
                          Test Failures Detected: {testResults.failed} failed, {testResults.errors} errors
                        </>
                      )}
                    </span>
                    {testResults.timeouts !== undefined && testResults.timeouts > 0 && (
                      <span className="flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                        <Clock className="h-3 w-3" />
                        {testResults.timeouts} Timed Out
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-slate-600 text-[11px]">
                    {testResults.duration_seconds !== undefined && (
                      <span className="flex items-center gap-1">
                        <Zap className="h-3 w-3 text-amber-600" />
                        {testResults.duration_seconds}s
                      </span>
                    )}
                    {testResults.estimated_coverage !== undefined && (
                      <span className="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 font-semibold text-indigo-700">
                        ~{testResults.estimated_coverage}% Est. Coverage
                      </span>
                    )}
                    <span className="font-semibold text-slate-900">
                      Pass Rate: {testResults.pass_percentage ?? Math.round((testResults.passed / testResults.total) * 100)}%
                    </span>
                  </div>
                </div>

                <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden flex">
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
                  const count =
                    cat === 'All'
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
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <span>{cat}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          isSelected ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Test Case Cards List */}
            {filteredTestCases.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center text-slate-500">
                <TestTube2 className="h-8 w-8 text-slate-400 mb-2" />
                <p className="font-semibold text-slate-800 text-xs">
                  {testCases.length === 0 ? 'No Test Cases Configured' : 'No Test Cases in This Category'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
                  {testCases.length === 0
                    ? 'Click "Generate Test Cases" or "Add Case" to define inputs and expected outputs.'
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
                          ? 'border-emerald-200 bg-emerald-50/40'
                          : status === 'failed'
                          ? 'border-rose-200 bg-rose-50/40'
                          : status === 'timeout'
                          ? 'border-amber-200 bg-amber-50/40'
                          : status === 'error'
                          ? 'border-amber-200 bg-amber-50/40'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-xs text-slate-900">
                            #{idx + 1} {tc.name}
                          </span>

                          {/* Status Badge */}
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                              status === 'passed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : status === 'failed'
                                ? 'bg-rose-100 text-rose-800'
                                : status === 'timeout'
                                ? 'bg-amber-100 text-amber-800'
                                : status === 'error'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {status === 'passed' && <Check className="h-3 w-3" />}
                            {status === 'failed' && <XCircle className="h-3 w-3" />}
                            {status === 'timeout' && <Clock className="h-3 w-3" />}
                            <span>{status === 'not_run' ? 'Not Run' : status}</span>
                          </span>

                          {/* Category Badge */}
                          {tc.category && (
                            <span className="rounded border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                              {tc.category}
                            </span>
                          )}

                          {tc.is_user_edited && (
                            <span className="rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-700">
                              Edited
                            </span>
                          )}

                          {tc.is_verified && (
                            <span
                              className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-700"
                              title="Output verified by runtime sandbox execution"
                            >
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
                              className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-blue-600 hover:text-white transition disabled:opacity-50 cursor-pointer shadow-2xs"
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
                            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100 transition cursor-pointer shadow-2xs"
                            title={isEditing ? 'Cancel Edit' : 'Edit Input & Expected Output'}
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteTestCase(tc.id)}
                            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:text-rose-600 hover:border-rose-300 transition cursor-pointer shadow-2xs"
                            title="Remove test case"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Reason / Target Hypothesis */}
                      {tc.reason && (
                        <p className="mt-1.5 text-[11px] text-slate-500 italic">Target: {tc.reason}</p>
                      )}

                      {/* Inline Editing Form */}
                      {isEditing ? (
                        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2.5">
                          <div>
                            <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                              Stdin Input:
                            </label>
                            <textarea
                              rows={2}
                              value={editInputVal}
                              onChange={(e) => setEditInputVal(e.target.value)}
                              className="w-full rounded-lg border border-slate-300 bg-white p-2 font-mono text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                              Expected Output:
                            </label>
                            <textarea
                              rows={2}
                              value={editExpectedVal}
                              onChange={(e) => setEditExpectedVal(e.target.value)}
                              className="w-full rounded-lg border border-slate-300 bg-white p-2 font-mono text-xs text-emerald-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingCaseId(null)}
                              className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100"
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
                              className="rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Stdin and Expected vs Actual Output Display */
                        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs font-mono">
                          {tc.input && (
                            <div className="sm:col-span-2 rounded-lg bg-slate-50 border border-slate-200 p-2 text-slate-800">
                              <span className="text-[10px] text-slate-500 uppercase block font-sans font-semibold">
                                Test Input (Stdin):
                              </span>
                              <pre className="mt-0.5 whitespace-pre-wrap">{tc.input}</pre>
                            </div>
                          )}

                          <div className="rounded-lg bg-slate-50 border border-slate-200 p-2 text-slate-800">
                            <span className="text-[10px] text-slate-500 uppercase block font-sans font-semibold">
                              Expected Output:
                            </span>
                            <pre className="mt-0.5 whitespace-pre-wrap text-emerald-800 font-semibold">
                              {tc.expected_output || '(Empty / Any)'}
                            </pre>
                          </div>

                          <div className="rounded-lg bg-slate-50 border border-slate-200 p-2 text-slate-800">
                            <span className="text-[10px] text-slate-500 uppercase block font-sans font-semibold">
                              Actual Output:
                            </span>
                            <pre
                              className={`mt-0.5 whitespace-pre-wrap ${
                                status === 'passed'
                                  ? 'text-emerald-800 font-semibold'
                                  : status === 'failed'
                                  ? 'text-rose-800 font-bold'
                                  : status === 'timeout'
                                  ? 'text-amber-800'
                                  : 'text-slate-600'
                              }`}
                            >
                              {resItem ? resItem.actual_output || '(No output)' : 'Pending test run...'}
                            </pre>
                          </div>
                        </div>
                      )}

                      {/* Mismatch Callout */}
                      {resItem?.mismatch_line && (
                        <div className="mt-2.5 rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs font-sans text-rose-800">
                          <strong>Failure Mismatch:</strong> {resItem.mismatch_line}
                        </div>
                      )}

                      {/* Error / Timeout details */}
                      {resItem?.error_message && (
                        <div className="mt-2.5 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs font-mono text-amber-900 whitespace-pre-wrap">
                          {resItem.error_message}
                        </div>
                      )}

                      {/* AI Explain Failure Button */}
                      {(status === 'failed' || status === 'error' || status === 'timeout') && (
                        <div className="mt-3 pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] text-slate-600">
                            Execution diverged from assertion. Diagnose root cause and generate a verified patch:
                          </span>
                          <button
                            type="button"
                            onClick={() => onExplainTestFailure && resItem && onExplainTestFailure(resItem)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-100 transition cursor-pointer shadow-2xs"
                          >
                            <Sparkles className="h-3.5 w-3.5 text-purple-600" />
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
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
                <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Plus className="h-4 w-4 text-purple-600" />
                    Create Custom Test Case
                  </h3>
                  <form onSubmit={handleCreateTestCase} className="mt-4 space-y-3 text-xs">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Test Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Test with Negative Integers"
                        value={newCaseName}
                        onChange={(e) => setNewCaseName(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Category</label>
                        <select
                          value={newCaseCategory}
                          onChange={(e) => setNewCaseCategory(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-slate-900 focus:border-blue-500 focus:outline-none"
                        >
                          <option value="Normal">Normal</option>
                          <option value="Boundary / Edge">Boundary / Edge</option>
                          <option value="Invalid Input">Invalid Input</option>
                          <option value="Branch Coverage">Branch Coverage</option>
                          <option value="Regression">Regression</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Reason / Purpose</label>
                        <input
                          type="text"
                          placeholder="e.g. Zero division guard"
                          value={newCaseReason}
                          onChange={(e) => setNewCaseReason(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">
                        Standard Input (Stdin) <span className="text-slate-400 font-normal">(optional)</span>
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Input data piped to program"
                        value={newCaseInput}
                        onChange={(e) => setNewCaseInput(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 font-mono text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">
                        Expected Output (Stdout)
                      </label>
                      <textarea
                        rows={3}
                        required
                        placeholder="Exact output expected from program"
                        value={newCaseExpected}
                        onChange={(e) => setNewCaseExpected(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 font-mono text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddModal(false)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-600 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded-lg bg-blue-600 px-4 py-1.5 font-bold text-white hover:bg-blue-700 shadow-xs"
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
              <div className="space-y-3">
                <div className="text-slate-600 border-b border-slate-200 pb-2">
                  <span className="font-sans font-bold text-slate-800">
                    Compiler Sandbox Diagnostic Logs & Environment Telemetry
                  </span>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-slate-800">
                  <div>
                    <span className="text-blue-700 font-bold">[Execution Target]</span>{' '}
                    Language: <span className="font-semibold">{result.language}</span>
                  </div>
                  <div>
                    <span className="text-blue-700 font-bold">[Status Code]</span>{' '}
                    Result:{' '}
                    <span className={result.success ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                      {result.status}
                    </span>
                  </div>
                  {result.compile_output && (
                    <div className="pt-2">
                      <div className="text-amber-800 font-bold mb-1">[Compiler Diagnostic Output]:</div>
                      <pre className="p-3 bg-white rounded-lg border border-amber-200 text-amber-900 whitespace-pre-wrap">
                        {result.compile_output}
                      </pre>
                    </div>
                  )}
                  {result.stderr && (
                    <div className="pt-2">
                      <div className="text-rose-800 font-bold mb-1">[Standard Error Stream]:</div>
                      <pre className="p-3 bg-white rounded-lg border border-rose-200 text-rose-900 whitespace-pre-wrap">
                        {result.stderr}
                      </pre>
                    </div>
                  )}
                  <div className="text-slate-500 text-[11px] pt-2 border-t border-slate-200/80">
                    Sandbox Engine: Judge0 CE Isolated Micro-VM / Safe SQLite In-Memory Database
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center text-slate-500">
                <FileCode2 className="h-10 w-10 text-slate-400 mb-2" />
                <p className="font-bold text-slate-800 text-sm">No Build Logs Available</p>
                <p className="text-xs text-slate-500 mt-1">Run code to capture compiler and linker outputs.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Security Audit Tab */}
        {!isExecuting && activeTab === 'audit' && (
          <div className="space-y-4">
            {duplicateGroups && duplicateGroups.length > 0 && (
              <DuplicateGroupsView groups={duplicateGroups} />
            )}

            <FindingsList
              findings={findings}
              onJumpToLine={onJumpToLine}
              onReviewFix={onReviewFix}
              onGenerateTests={onGenerateFindingTests}
            />
          </div>
        )}

        {/* Tab 6: Live Preview Tab (for Web Languages) */}
        {!isExecuting && activeTab === 'preview' && isWebPreview && previewDocument && (
          <div className="rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Interactive Browser Preview</span>
              </div>
              <span className="text-[11px] text-slate-500">Isolated Sandboxed Iframe</span>
            </div>
            <iframe
              title="Browser Live Preview"
              srcDoc={previewDocument}
              sandbox="allow-scripts allow-modals"
              className="w-full h-[500px] bg-white border-0"
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default CompilerOutputPanel
