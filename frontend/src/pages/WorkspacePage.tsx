import React, { useState, useEffect, useRef } from 'react'
import {
  Terminal,
  Play,
  RotateCcw,
  Upload,
  FileCode,
  Download,
  Share2,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  BrainCircuit,
  Sun,
  Moon,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { useTheme } from '@/features/theme/ThemeContext'
import { useAuth } from '@/features/auth/AuthContext'
import { CodeEditor } from '@/features/analysis/CodeEditor'
import { ScoreCard } from '@/features/analysis/ScoreCard'
import { FindingsList } from '@/features/analysis/FindingsList'
import { DuplicateGroupsView } from '@/features/analysis/DuplicateGroupsView'
import { AiFixModal } from '@/features/analysis/AiFixModal'
import { TestGeneratorModal } from '@/features/analysis/TestGeneratorModal'
import { AIExplanationPanel } from '@/features/analysis/AIExplanationPanel'
import { CompilerOutputPanel } from '@/features/analysis/CompilerOutputPanel'
import { LanguageSelector } from '@/features/analysis/LanguageSelector'
import { CODE_SAMPLES } from '@/lib/samples'
import { EXECUTABLE_SAMPLES } from '@/lib/compilerSamples'
import { analysisService } from '@/services/analysisService'
import { compilerService } from '@/services/compilerService'
import { AnalysisResult, ExplainResult, Finding, FixResult, TestResult } from '@/types/analysis'
import { ExecuteResponse } from '@/types/execution'

export const WorkspacePage: React.FC = () => {
  const { theme, toggleTheme } = useTheme()
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [language, setLanguage] = useState<string>('python')
  const [code, setCode] = useState<string>(CODE_SAMPLES.python.code)
  const [filename, setFilename] = useState<string>('auth_service.py')
  const [isRealtime, setIsRealtime] = useState<boolean>(true)
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [targetLine, setTargetLine] = useState<number | null>(null)
  const [analysisStep, setAnalysisStep] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [showAuthGateModal, setShowAuthGateModal] = useState<boolean>(false)
  // Language mismatch detection
  const [showLangMismatchModal, setShowLangMismatchModal] = useState<boolean>(false)
  const [mismatchDetectedLang, setMismatchDetectedLang] = useState<string>('')

  // Code Execution Engine state
  const [isExecuting, setIsExecuting] = useState<boolean>(false)
  const [executionResult, setExecutionResult] = useState<ExecuteResponse | null>(null)
  const [programStdin, setProgramStdin] = useState<string>('')
  const [activeWorkspaceMode, setActiveWorkspaceMode] = useState<'compiler' | 'audit'>('compiler')

  // Modals state
  const [selectedFindingForFix, setSelectedFindingForFix] = useState<Finding | null>(null)
  const [fixResult, setFixResult] = useState<FixResult | null>(null)
  const [isFixLoading, setIsFixLoading] = useState<boolean>(false)

  const [selectedFindingForTest, setSelectedFindingForTest] = useState<Finding | null>(null)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [isTestLoading, setIsTestLoading] = useState<boolean>(false)
  const [testFramework, setTestFramework] = useState<string>('pytest')

  // Explain Errors with AI state
  const [explainResult, setExplainResult] = useState<ExplainResult | null>(null)
  const [isExplaining, setIsExplaining] = useState<boolean>(false)
  const [explainError, setExplainError] = useState<string | null>(null)
  const [showExplanationPanel, setShowExplanationPanel] = useState<boolean>(false)
  // Track code snapshot at time of last analysis (to detect stale state)
  const codeAtLastAnalysis = useRef<string>('')

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initial analysis on mount - only run if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      runAnalysis(code, language, filename, false)
    }
    // Cleanup on unmount
    return () => {
      abortControllerRef.current?.abort()
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [isAuthenticated]) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced real-time analysis — only run if authenticated
  useEffect(() => {
    if (!isRealtime || !isAuthenticated) return

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)

    debounceTimerRef.current = setTimeout(() => {
      // Skip if code is too short to be meaningful
      const trimmed = code.trim()
      if (trimmed.split('\n').length < 2 || trimmed.length < 15) return
      runAnalysis(code, language, filename, false)
    }, 1200)

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [code, language, isRealtime, isAuthenticated]) // eslint-disable-line react-hooks/exhaustive-deps

  const runAnalysis = async (
    sourceCode: string,
    lang: string,
    fname: string,
    includeAi: boolean = false,
    bypassMismatch: boolean = false
  ) => {
    // SECURITY GATE: Code testing requires login
    if (!isAuthenticated) {
      setShowAuthGateModal(true)
      return
    }

    const trimmed = sourceCode.trim()
    if (!trimmed || trimmed.length < 5) return

    // LANGUAGE MISMATCH GATE: Detect if code belongs to a different language
    if (!bypassMismatch) {
      const mismatch = detectLangMismatch(trimmed, lang)
      if (mismatch) {
        setMismatchDetectedLang(mismatch)
        setShowLangMismatchModal(true)
        return
      }
    }

    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()

    setIsAnalyzing(true)
    setErrorMsg(null)
    setAnalysisStep('Parsing & Static Validation...')

    // Invalidate previous explanations when code changes
    codeAtLastAnalysis.current = trimmed
    setExplainResult(null)
    setExplainError(null)
    setShowExplanationPanel(false)

    // Show step 2 message after brief delay (non-blocking)
    const stepTimer = setTimeout(
      () => setAnalysisStep('Running Security Scanners...'),
      200
    )

    try {
      const res = await analysisService.analyzeCode({
        code: sourceCode,
        language: lang,
        filename: fname,
        run_ai: includeAi,
      })
      setAnalysisResult(res)
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return // Silently ignore cancelled requests
      console.error('Analysis failed:', err)
      const is401 = err instanceof Error && (err.message.includes('401') || err.message.toLowerCase().includes('unauthorized'))
      if (is401) {
        setShowAuthGateModal(true)
        setErrorMsg('Authentication session required. Please sign in to test code.')
      } else {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        setErrorMsg(`Analysis failed: ${msg}. If this code has syntax errors or unsupported constructs, check the error above.`)
      }
    } finally {
      clearTimeout(stepTimer)
      setIsAnalyzing(false)
      setAnalysisStep('')
    }
  }

  // Real Sandbox Execution Engine (Judge0)
  const runExecution = async () => {
    if (!isAuthenticated) {
      setShowAuthGateModal(true)
      return
    }

    const trimmed = code.trim()
    if (!trimmed) {
      setErrorMsg('Please enter code to execute.')
      return
    }

    setIsExecuting(true)
    setErrorMsg(null)

    // HTML-in-JavaScript guard: catch before hitting the sandbox
    const isJsSelected = language === 'javascript' || language === 'js'
    const htmlPattern = /<!doctype\s+html|<html[\s>]|<head[\s>]|<body[\s>]/i
    if (isJsSelected && htmlPattern.test(trimmed)) {
      setIsExecuting(false)
      setExecutionResult({
        status: 'Language Mismatch',
        success: false,
        output:
          'HTML code cannot be run in the JavaScript (Node.js) sandbox.\n\n' +
          'Node.js executes .js files only — not HTML pages.\n\n' +
          '👉 Write pure JavaScript (e.g. console.log("Hello")) or open your HTML file in a browser.',
        stdout: '',
        stderr: '',
        compile_output: '',
        language,
        error_detail: {
          error_type: 'Language Mismatch',
          raw_message: 'HTML markup detected while JavaScript language is selected',
          what_went_wrong:
            'Your editor contains HTML tags (<!DOCTYPE html>, <html>, <body>, etc.) but the selected language is JavaScript.',
          why_it_happened:
            'Node.js is a JavaScript runtime — it cannot parse or render HTML. HTML is a browser-rendered document format.',
          how_to_fix:
            'Replace the HTML with valid JavaScript, e.g. console.log("Hello World"), then click Run Code again.',
          concept_to_learn:
            'Execution Environments — browser renders HTML/CSS, Node.js executes JavaScript.',
        },
      })
      return
    }


    try {
      const res = await compilerService.executeCode({
        code,
        language,
        stdin: programStdin,
        generate_ai_fix: true,
      })
      setExecutionResult(res)

      // If an error line was identified, scroll/highlight it
      if (res.error_detail?.line_number) {
        setTargetLine(res.error_detail.line_number)
      }
    } catch (err: unknown) {
      console.error('Execution request failed:', err)
      const is401 = err instanceof Error && (err.message.includes('401') || err.message.toLowerCase().includes('unauthorized'))
      if (is401) {
        setShowAuthGateModal(true)
        setErrorMsg('Authentication session required. Please sign in to run code.')
      } else {
        const msg = err instanceof Error ? err.message : 'Execution service error'
        setErrorMsg(`Execution failed: ${msg}. Check sandbox server connection.`)
      }
    } finally {
      setIsExecuting(false)
    }
  }

  const handleApplyCompilerFix = (correctedCode: string) => {
    setCode(correctedCode)
    // Clear error result to indicate fix applied
    if (executionResult) {
      setExecutionResult({
        ...executionResult,
        output: 'Fix applied to editor! Click "Run Code" to verify.',
        status: 'Fix Applied',
        success: false,
      })
    }
  }

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang)
    const extMap: Record<string, string> = {
      python: 'py', javascript: 'js', typescript: 'ts', java: 'java',
      c: 'c', cpp: 'cpp', go: 'go', reactjs: 'jsx', reactts: 'tsx',
      html: 'html', css: 'css', sql: 'sql', mysql: 'sql', postgresql: 'sql',
      plsql: 'sql', bash: 'sh', json: 'json', yaml: 'yaml', xml: 'xml',
      markdown: 'md', csharp: 'cs', php: 'php', rust: 'rs', kotlin: 'kt',
      swift: 'swift', ruby: 'rb', nodejs: 'js',
    }
    // If in compiler mode, prefer clean runnable sample
    if (activeWorkspaceMode === 'compiler' && EXECUTABLE_SAMPLES[newLang]) {
      setCode(EXECUTABLE_SAMPLES[newLang].code)
      setFilename(`main.${extMap[newLang] || newLang}`)
    } else if (CODE_SAMPLES[newLang]) {
      setCode(CODE_SAMPLES[newLang].code)
      setFilename(`sample.${extMap[newLang] || newLang}`)
    }
  }

  // Returns detected language key or null
  const autoDetectLanguage = (src: string): string | null => {
    const s = src.trim()
    const sl = s.toLowerCase()
    // React JSX/TSX detection (must come before TS/JS)
    if (/import\s+React\b/.test(s) && /\bJSX\b|\breturn\s*\(?\s*<[A-Z]/.test(s)) return 'reactjs'
    if (/useState|useEffect|useRef|useCallback|useMemo/.test(s) && /<[A-Z][A-Za-z]/.test(s)) return 'reactjs'
    // HTML (route as 'html' not 'javascript' for proper analysis)
    if (/<!doctype\s+html|<html[\s>]|<body[\s>]|<head[\s>]/.test(sl)) return 'html'
    // CSS
    if (/^\s*[.#]?[\w-]+\s*\{/.test(s) && /color|margin|padding|display|font/.test(sl)) return 'css'
    // SQL
    if (/\b(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)\b.*\b(FROM|INTO|TABLE|WHERE)\b/i.test(s)) return 'sql'
    // Bash/Shell
    if (/^#!/.test(s) && /(bash|sh|zsh)/.test(s)) return 'bash'
    if (/^\s*(echo|export|chmod|grep|awk|sed|curl|wget)\b/.test(s)) return 'bash'
    // Go
    if (/^package\s+main\b/.test(s) || /\bfunc\s+\w+\s*\(/.test(s)) return 'go'
    // Java
    if (/^import\s+(java\.|android\.)/.test(s) || /\bpublic\s+class\b/.test(s)) return 'java'
    // Kotlin
    if (/\bfun\s+\w+\s*\(/.test(s) && /:\s*(String|Int|Boolean|List)\b/.test(s)) return 'kotlin'
    // C#
    if (/\busing\s+System/.test(s) || /\bnamespace\s+\w+/.test(s)) return 'csharp'
    // PHP
    if (/^\s*<\?php/.test(s) || /\$_GET|\$_POST|\$_REQUEST/.test(s)) return 'php'
    // Ruby
    if (/\bdef\s+\w+.*\bend\b/.test(s) || /\brequire\s+['"]/.test(s)) return 'ruby'
    // Rust
    if (/\bfn\s+main\s*\(\)/.test(s) || /\blet\s+mut\b/.test(s)) return 'rust'
    // C
    if (/#include\s*<stdio\.h>/.test(s) && !/std::|cout|cin/.test(s)) return 'c'
    // C++
    if (/#include\s*<(iostream|cstring|stdio|vector)>/.test(s) || /\bstd::\b/.test(s)) return 'cpp'
    // TypeScript
    if (/:\s*(string|number|boolean|React\.FC|void)\b/.test(s) && /\bimport\b/.test(s)) return 'typescript'
    // JavaScript
    if (/\bconst\s+\w+\s*=|function\s+\w+\s*\(|document\.|window\.|require\(/.test(s)) return 'javascript'
    // Python
    if (/\bdef\s+\w+\s*\(|import\s+\w+|from\s+\w+\s+import/.test(s)) return 'python'
    // JSON
    if (/^\s*[\[{]/.test(s) && /"\w+":\s*/.test(s)) return 'json'
    // YAML
    if (/^---/.test(s) || /^\w+:\s+.+$/m.test(s)) return 'yaml'
    return null
  }

  // Language display labels for messages
  const LANG_LABELS: Record<string, string> = {
    python: 'Python', javascript: 'JavaScript', typescript: 'TypeScript',
    java: 'Java', c: 'C', cpp: 'C++', go: 'Go', reactjs: 'React JS (JSX)',
    reactts: 'React JS (TSX)', html: 'HTML', css: 'CSS', sql: 'SQL',
    mysql: 'MySQL', postgresql: 'PostgreSQL', plsql: 'PL/SQL',
    bash: 'Bash/Shell', json: 'JSON', yaml: 'YAML', xml: 'XML',
    markdown: 'Markdown', csharp: 'C#', php: 'PHP', rust: 'Rust',
    kotlin: 'Kotlin', swift: 'Swift', ruby: 'Ruby', nodejs: 'Node.js',
  }

  // Check if typed code matches the selected language; returns detected lang if mismatch
  const detectLangMismatch = (src: string, selectedLang: string): string | null => {
    const detected = autoDetectLanguage(src)
    if (!detected) return null
    // Full web ecosystem compatibility: JS, TS, React JS/TSX, Node.js can intermix
    const webEcosystem = ['javascript', 'typescript', 'reactjs', 'reactts', 'nodejs']
    if (webEcosystem.includes(selectedLang) && webEcosystem.includes(detected)) {
      return null
    }
    // SQL variants are all compatible
    const sqlFamily = ['sql', 'mysql', 'postgresql', 'plsql']
    if (sqlFamily.includes(selectedLang) && sqlFamily.includes(detected)) {
      return null
    }
    if (detected === selectedLang) return null
    return detected
  }


  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const ext = file.name.split('.').pop()?.toLowerCase()
    const EXT_LANG: Record<string, string> = {
      py: 'python', js: 'javascript', ts: 'typescript', tsx: 'reactts', jsx: 'reactjs',
      html: 'html', htm: 'html', css: 'css', java: 'java',
      cpp: 'cpp', cc: 'cpp', cxx: 'cpp', c: 'c', go: 'go',
      cs: 'csharp', php: 'php', rs: 'rust', kt: 'kotlin', kts: 'kotlin',
      swift: 'swift', rb: 'ruby', sql: 'sql', sh: 'bash', bash: 'bash',
      json: 'json', yaml: 'yaml', yml: 'yaml', xml: 'xml', md: 'markdown',
    }
    const detectedLang = ext ? (EXT_LANG[ext] || 'python') : 'python'

    setFilename(file.name)
    setLanguage(detectedLang)

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      if (content) {
        setCode(content)
        // Refine detection from file content
        const refined = autoDetectLanguage(content)
        if (refined) setLanguage(refined)
      }
    }
    reader.readAsText(file)
  }

  const handleReviewFix = async (finding: Finding) => {
    setSelectedFindingForFix(finding)
    setIsFixLoading(true)
    setFixResult(null)

    try {
      const res = await analysisService.suggestFix({
        code,
        language,
        finding,
      })
      setFixResult(res)
    } catch (err) {
      console.error('Failed to generate fix:', err)
    } finally {
      setIsFixLoading(false)
    }
  }

  const handleGenerateTests = async (finding: Finding, fw?: string) => {
    setSelectedFindingForTest(finding)
    setIsTestLoading(true)
    setTestResult(null)

    const frameworkToUse = fw || (language === 'python' ? 'pytest' : language.includes('script') ? 'jest' : 'pytest')
    setTestFramework(frameworkToUse)

    try {
      const res = await analysisService.generateTests({
        code,
        language,
        finding,
        framework: frameworkToUse,
      })
      setTestResult(res)
    } catch (err) {
      console.error('Failed to generate tests:', err)
    } finally {
      setIsTestLoading(false)
    }
  }


  const handleExplainErrors = async () => {
    if (!analysisResult || isExplaining) return

    // Detect stale: code changed since last analysis
    const currentTrimmed = code.trim()
    if (currentTrimmed !== codeAtLastAnalysis.current) {
      setExplainError(
        'The code has changed since the last analysis. Run Analyze Code first to get up-to-date results, then explain.'
      )
      setShowExplanationPanel(true)
      return
    }

    setIsExplaining(true)
    setExplainError(null)
    setExplainResult(null)
    setShowExplanationPanel(true)

    try {
      const result = await analysisService.explainFindings({
        code,
        language,
        findings: analysisResult.findings,
      })
      setExplainResult(result)
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Explanation request failed. Please try again.'
      setExplainError(msg)
    } finally {
      setIsExplaining(false)
    }
  }

  const handleApplyFix = (correctedCode: string) => {
    setCode(correctedCode)
    setSelectedFindingForFix(null)
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-y-auto">
        {/* Header Bar */}
        <div className="border-b border-slate-800 bg-slate-950/80 px-6 py-4 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <Terminal className="h-5 w-5 text-blue-400" />
                Analysis Workspace
              </h1>
              <p className="text-xs text-slate-400">
                Interactive multi-language static analyzer and AI remediation assistant.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Main RUN CODE Button — Real Isolated Execution */}
              <button
                type="button"
                onClick={runExecution}
                disabled={isExecuting}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 cursor-pointer"
                title="Execute code in real sandboxed environment (Judge0)"
              >
                {isExecuting ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Executing...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-white text-white" />
                    <span>Run Code</span>
                  </>
                )}
              </button>

              {/* Security Audit Analysis Button */}
              <button
                type="button"
                onClick={() => runAnalysis(code, language, filename, true)}
                disabled={isAnalyzing}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
                title="Run deep security & code quality audit"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
                <span>{isAnalyzing ? 'Scanning...' : 'Security Audit'}</span>
              </button>

              {/* Explain Errors with AI Button */}
              <button
                onClick={handleExplainErrors}
                disabled={
                  !analysisResult ||
                  isAnalyzing ||
                  isExplaining ||
                  code.trim().length < 5
                }
                title={
                  !analysisResult
                    ? 'Run Analyze Code first to generate findings'
                    : 'Explain detected findings in plain English using AI'
                }
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  showExplanationPanel && !isExplaining
                    ? 'border border-violet-500/40 bg-violet-500/15 text-violet-300 hover:bg-violet-500/25 shadow-sm shadow-violet-500/10'
                    : 'border border-violet-500/30 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 hover:text-violet-300 shadow-sm shadow-violet-500/10'
                }`}
              >
                {isExplaining ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
                    Explaining...
                  </>
                ) : (
                  <>
                    <BrainCircuit className="h-3.5 w-3.5" />
                    Explain Errors with AI
                  </>
                )}
              </button>

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                type="button"
                aria-label="Toggle theme mode"
                title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4 text-amber-400" />
                ) : (
                  <Moon className="h-4 w-4 text-indigo-500" />
                )}
              </button>
            </div>

          </div>
        </div>

        {/* Workspace Body */}
        <div className="p-6 space-y-6">
          {/* Editor Controls Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs">
            {/* Language Selector — searchable categorized dropdown */}
            <div className="flex items-center gap-2.5">
              <span className="font-semibold text-slate-400 text-[11px] uppercase tracking-wider">Language:</span>
              <LanguageSelector value={language} onChange={handleLanguageChange} />

              {/* Sample Code Quick Picker */}
              <button
                type="button"
                onClick={() => {
                  if (EXECUTABLE_SAMPLES[language]) {
                    setCode(EXECUTABLE_SAMPLES[language].code)
                  } else if (CODE_SAMPLES[language]) {
                    setCode(CODE_SAMPLES[language].code)
                  }
                }}
                className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-700 transition"
              >
                Load Sample
              </button>
            </div>

            {/* File Actions */}
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                accept=".py,.js,.ts,.tsx,.jsx,.java,.cpp,.c,.go,.cs,.php,.rs,.kt,.swift,.rb,.sql,.sh,.bash,.html,.htm,.css,.json,.yaml,.yml,.xml,.md"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
              >
                <Upload className="h-3.5 w-3.5 text-blue-400" />
                Upload File
              </button>

              <button
                onClick={() => setCode('')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Clear
              </button>

              {analysisResult && (
                <>
                  <a
                    href={analysisService.getExportHtmlUrl(analysisResult.id)}
                    download
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                  >
                    <Download className="h-3.5 w-3.5 text-emerald-400" />
                    HTML Report
                  </a>
                  <a
                    href={analysisService.getExportJsonUrl(analysisResult.id)}
                    download
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                  >
                    <FileCode className="h-3.5 w-3.5 text-indigo-400" />
                    JSON
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Analysis Progress Banner */}
          {isAnalyzing && (
            <div className="flex items-center gap-3 rounded-xl border border-blue-500/30 bg-blue-500/8 px-4 py-2.5 text-xs text-blue-300">
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-400 border-t-transparent shrink-0" />
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold">{analysisStep || 'Analyzing source code...'}</span>
                <span className="text-blue-400/60 text-[10px]">Running {language.toUpperCase()} analyzers</span>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && !isAnalyzing && (
            <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/8 px-4 py-3 text-xs text-red-300">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-red-300">Analysis Error: </span>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {/* ScoreCard */}
          {analysisResult && (
            <ScoreCard
              qualityScore={analysisResult.quality_score}
              riskScore={analysisResult.risk_score}
              durationMs={analysisResult.duration_ms}
              riskBreakdown={analysisResult.risk_breakdown}
            />
          )}

          {/* Editor & Findings Layout */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left: Monaco Editor */}
            <div className="lg:col-span-7">
              <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono">{filename}</span>
                <span>{code.split('\n').length} lines</span>
              </div>
              <CodeEditor
                code={code}
                language={language}
                onChange={setCode}
                findings={analysisResult?.findings || []}
                targetLine={targetLine}
                height="560px"
              />
            </div>

            {/* Right: Mode Switcher & Dynamic Output Panel */}
            <div className="lg:col-span-5 space-y-4">
              {/* Workspace View Mode Switcher */}
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-1.5">
                <button
                  type="button"
                  onClick={() => setActiveWorkspaceMode('compiler')}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${
                    activeWorkspaceMode === 'compiler'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Terminal className="h-3.5 w-3.5" />
                  <span>Compiler & Output</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveWorkspaceMode('audit')}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${
                    activeWorkspaceMode === 'audit'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Security Audit ({analysisResult?.findings_count || 0})</span>
                </button>
              </div>

              {/* View 1: Real Sandboxed Compiler Output Panel */}
              {activeWorkspaceMode === 'compiler' && (
                <CompilerOutputPanel
                  result={executionResult}
                  isExecuting={isExecuting}
                  stdin={programStdin}
                  onStdinChange={setProgramStdin}
                  onApplyFix={handleApplyCompilerFix}
                  onClearOutput={() => {
                    setExecutionResult(null)
                    setProgramStdin('')
                  }}
                />
              )}

              {/* View 2: Security Findings & Duplicate Clusters */}
              {activeWorkspaceMode === 'audit' && (
                <>
                  {/* Duplicate Groups view if present */}
                  {analysisResult && analysisResult.duplicate_groups.length > 0 && (
                    <DuplicateGroupsView groups={analysisResult.duplicate_groups} />
                  )}

                  {/* Findings List */}
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white">Audit Findings</h3>
                      <span className="text-xs text-slate-400">
                        {analysisResult?.findings_count || 0} Issues Detected
                      </span>
                    </div>

                    <FindingsList
                      findings={analysisResult?.findings || []}
                      onJumpToLine={(line) => setTargetLine(line)}
                      onReviewFix={handleReviewFix}
                      onGenerateTests={(finding) => handleGenerateTests(finding)}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* AI Explanation Panel — full width, below the editor+findings grid */}
          {showExplanationPanel && (
            <AIExplanationPanel
              result={explainResult}
              isLoading={isExplaining}
              error={explainError}
              onRetry={handleExplainErrors}
              onDismiss={() => {
                setShowExplanationPanel(false)
                setExplainResult(null)
                setExplainError(null)
              }}
            />
          )}
        </div>


        {/* Modals */}
        {selectedFindingForFix && (
          <AiFixModal
            finding={selectedFindingForFix}
            fixResult={fixResult}
            isLoading={isFixLoading}
            onClose={() => setSelectedFindingForFix(null)}
            onApplyFix={handleApplyFix}
          />
        )}

        {selectedFindingForTest && (
          <TestGeneratorModal
            finding={selectedFindingForTest}
            testResult={testResult}
            isLoading={isTestLoading}
            language={language}
            onClose={() => setSelectedFindingForTest(null)}
            onFrameworkChange={(fw) => handleGenerateTests(selectedFindingForTest, fw)}
          />
        )}

        {/* Authentication Gate Modal (Requires Sign In to Test Code) */}
        {showAuthGateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-700/80 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 mx-auto">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Authentication Required
                </h3>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  To test code and generate AI security audits, you must be signed in. All your analyzed code and vulnerability reports are encrypted and tied securely to your user account.
                </p>
              </div>
              <div className="flex flex-col gap-2.5 pt-2">
                <button
                  onClick={() => navigate('/signin')}
                  className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/25 hover:from-blue-500 hover:to-indigo-500 transition"
                >
                  Sign In to Continue
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-750 transition"
                >
                  Create New Account
                </button>
                <button
                  onClick={() => setShowAuthGateModal(false)}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 py-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Language Mismatch Modal */}
        {showLangMismatchModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl border border-amber-500/30 bg-slate-900 p-6 shadow-2xl shadow-amber-500/10 space-y-5 animate-in fade-in slide-in-from-bottom-4">
              {/* Icon */}
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/30 mx-auto">
                <AlertTriangle className="h-7 w-7 text-amber-400" />
              </div>

              {/* Title + Description */}
              <div className="text-center space-y-2">
                <h3 className="text-base font-bold text-white">Wrong Language Detected</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  You selected{' '}
                  <span className="font-semibold text-white">{LANG_LABELS[language] ?? language}</span>,
                  but the code appears to be{' '}
                  <span className="font-semibold text-amber-400">{LANG_LABELS[mismatchDetectedLang] ?? mismatchDetectedLang}</span>.
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Code must be analyzed using its correct language for accurate security scanning.
                  Please switch the language selector or paste the correct code.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5">
                {/* Switch to detected language */}
                <button
                  onClick={() => {
                    handleLanguageChange(mismatchDetectedLang)
                    setShowLangMismatchModal(false)
                    // Re-run analysis with correct language (will use current code)
                    setTimeout(() => runAnalysis(code, mismatchDetectedLang, filename, false), 100)
                  }}
                  className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-2.5 text-xs font-semibold text-white shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-orange-400 transition"
                >
                  Switch to {LANG_LABELS[mismatchDetectedLang] ?? mismatchDetectedLang} & Analyze
                </button>
                {/* Load correct sample for selected language */}
                <button
                  onClick={() => {
                    if (CODE_SAMPLES[language]) setCode(CODE_SAMPLES[language].code)
                    setShowLangMismatchModal(false)
                  }}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
                >
                  Load {LANG_LABELS[language] ?? language} Sample Code Instead
                </button>
                {/* Analyze anyway with selected language */}
                <button
                  onClick={() => {
                    setShowLangMismatchModal(false)
                    runAnalysis(code, language, filename, false, true)
                  }}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/60 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition"
                >
                  Analyze Anyway as {LANG_LABELS[language] ?? language}
                </button>
                {/* Cancel */}
                <button
                  onClick={() => setShowLangMismatchModal(false)}
                  className="text-xs text-slate-500 hover:text-slate-300 py-1 transition"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
