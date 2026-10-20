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
  Trash2,
  ExternalLink,
  TestTube2,
  Copy,
  Check,
  Undo2,
  AlignLeft,
  Wrench,
  ArrowLeft,
  Home,
} from 'lucide-react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { useTheme } from '@/features/theme/ThemeContext'
import { useAuth } from '@/features/auth/AuthContext'
import { CodeEditor, CodeEditorHandle } from '@/features/analysis/CodeEditor'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { ScoreCard } from '@/features/analysis/ScoreCard'
import { FindingsList } from '@/features/analysis/FindingsList'
import { DuplicateGroupsView } from '@/features/analysis/DuplicateGroupsView'
import { AiFixModal } from '@/features/analysis/AiFixModal'
import { TestGeneratorModal } from '@/features/analysis/TestGeneratorModal'
import { AIExplanationPanel } from '@/features/analysis/AIExplanationPanel'
import { CompilerOutputPanel } from '@/features/analysis/CompilerOutputPanel'
import { CustomInputPanel } from '@/features/analysis/CustomInputPanel'
import { LanguageSelector } from '@/features/analysis/LanguageSelector'
import { CODE_SAMPLES } from '@/lib/samples'
import { EXECUTABLE_SAMPLES } from '@/lib/compilerSamples'
import { getDefaultTestCases } from '@/lib/defaultTestCases'
import { getStarterTemplate, STARTER_TEMPLATES } from '@/lib/starterTemplates'
import { LANGUAGE_CONFIG } from '@/lib/languages'
import { analysisService } from '@/services/analysisService'
import { compilerService } from '@/services/compilerService'
import { AnalysisResult, ExplainResult, Finding, FixResult, TestResult } from '@/types/analysis'
import { ExecuteResponse, TestCaseItem, RunTestsResponse } from '@/types/execution'

export const WorkspacePage: React.FC = () => {
  const { theme, toggleTheme } = useTheme()
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Helper to extract language requested via navigation state or URL query
  const getNavLanguage = (): string | null => {
    const fromState = (location.state as { selectedLanguage?: string } | null)?.selectedLanguage
    const fromQuery = new URLSearchParams(location.search).get('lang')
    const candidate = fromState || fromQuery
    return candidate ? candidate.toLowerCase().trim() : null
  }

  const initialLang = getNavLanguage() || 'python'
  const initialTemplate = getStarterTemplate(initialLang)

  const [language, setLanguage] = useState<string>(initialLang)
  const [code, setCode] = useState<string>(initialTemplate.code)
  const [filename, setFilename] = useState<string>(initialTemplate.filename)
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
  const [activeWorkspaceMode, setActiveWorkspaceMode] = useState<'compiler' | 'audit' | 'preview'>(() => {
    return ['html', 'css', 'reactjs', 'reactts'].includes(initialLang) ? 'preview' : 'compiler'
  })
  const [compilerTab, setCompilerTab] = useState<'output' | 'errors' | 'tests' | 'logs' | 'stdin'>('output')

  // Test Suite Bench state
  const [testCases, setTestCases] = useState<TestCaseItem[]>(() => getDefaultTestCases(initialLang))
  const [testResults, setTestResults] = useState<RunTestsResponse | null>(null)
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false)
  const [isGeneratingTests, setIsGeneratingTests] = useState<boolean>(false)

  // Editor history & formatting
  const editorRef = useRef<CodeEditorHandle>(null)
  const [codeHistory, setCodeHistory] = useState<string[]>([])
  const [lastSavedCode, setLastSavedCode] = useState<string>(code)
  const [copiedCode, setCopiedCode] = useState<boolean>(false)

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
    if (isExecuting) return

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

    // Web Preview for HTML, CSS, React JS & React TS: switch to preview immediately
    if (['html', 'css', 'reactjs', 'reactts'].includes(language.toLowerCase())) {
      setIsExecuting(false)
      setActiveWorkspaceMode('preview')
      const labels: Record<string, string> = {
        html: 'HTML & Embedded Scripts',
        css: 'CSS Stylesheet',
        reactjs: 'React JS Component',
        reactts: 'React TypeScript Component',
      }
      setExecutionResult({
        status: 'Execution Successful',
        success: true,
        output: `${labels[language.toLowerCase()] || language.toUpperCase()} rendered directly in the Live Browser Preview viewport.`,
        stdout: `${labels[language.toLowerCase()] || language.toUpperCase()} active in sandboxed preview.`,
        stderr: '',
        compile_output: '',
        language,
        execution_time: 0.01,
        memory_usage_kb: 0,
        exit_code: 0,
      })
      // Trigger background analysis to update real-time dashboard for web languages
      analysisService.analyzeCode({ code, language, filename, run_ai: false })
        .then(() => {
          window.dispatchEvent(new CustomEvent('codeguardian_analysis_updated', { detail: { language } }))
          localStorage.setItem('cg_last_analysis_ts', Date.now().toString())
        })
        .catch(() => {})
      return
    }

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
          '👉 Write pure JavaScript (e.g. console.log("Hello")) or switch Language to HTML to use Live Preview.',
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
            'Switch language to HTML or replace the HTML with valid JavaScript, e.g. console.log("Hello World").',
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
      setActiveWorkspaceMode('compiler')
      setExecutionResult(res)

      if (!res.success) {
        setCompilerTab('errors')
      } else {
        setCompilerTab('output')
      }

      // If an error line was identified, scroll/highlight it
      if (res.error_detail?.line_number) {
        setTargetLine(res.error_detail.line_number)
      }

      // Notify dashboard across all tabs in real-time
      window.dispatchEvent(new CustomEvent('codeguardian_analysis_updated', { detail: { language, status: res.status } }))
      localStorage.setItem('cg_last_analysis_ts', Date.now().toString())

      // Also refresh static findings in the background for complete telemetry
      analysisService.analyzeCode({ code, language, filename, run_ai: false })
        .then((analysisRes) => {
          setAnalysisResult(analysisRes)
          window.dispatchEvent(new CustomEvent('codeguardian_analysis_updated', { detail: { language } }))
          localStorage.setItem('cg_last_analysis_ts', Date.now().toString())
        })
        .catch(() => {})

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
    setCodeHistory((prev) => [...prev, code])
    setCode(correctedCode)
    // Clear error result to indicate fix applied
    if (executionResult) {
      setExecutionResult({
        ...executionResult,
        output: 'Fix applied to editor! Click "Run Code" or "Run Tests" to verify.',
        status: 'Fix Applied',
        success: false,
      })
    }
    // Auto-reanalyze static checks after fix
    setTimeout(() => {
      runAnalysis(correctedCode, language, filename, false)
    }, 250)
  }

  const handleRunCorrectedCode = async (correctedCode: string) => {
    setCodeHistory((prev) => [...prev, code])
    setCode(correctedCode)
    setIsExecuting(true)
    setErrorMsg(null)

    try {
      const res = await compilerService.executeCode({
        code: correctedCode,
        language,
        stdin: programStdin,
        generate_ai_fix: true,
      })
      setExecutionResult(res)
      if (res.error_detail?.line_number) {
        setTargetLine(res.error_detail.line_number)
      }
    } catch (err: unknown) {
      console.error('Execution request failed for corrected code:', err)
      const msg = err instanceof Error ? err.message : 'Execution service error'
      setErrorMsg(`Execution of corrected code failed: ${msg}`)
    } finally {
      setIsExecuting(false)
    }
  }

  // Test Suite Runner
  const handleRunTests = async () => {
    if (!isAuthenticated) {
      setShowAuthGateModal(true)
      return
    }

    const trimmed = code.trim()
    if (!trimmed) {
      setErrorMsg('Please enter code before running test suite.')
      return
    }

    let casesToRun = testCases
    if (!casesToRun || casesToRun.length === 0) {
      setIsGeneratingTests(true)
      try {
        const genRes = await compilerService.generateTestCases({
          code,
          language,
          count: 3,
        })
        if (genRes.test_cases && genRes.test_cases.length > 0) {
          setTestCases(genRes.test_cases)
          casesToRun = genRes.test_cases
        }
      } catch (e) {
        console.warn('Auto test generation fallback:', e)
      } finally {
        setIsGeneratingTests(false)
      }
    }

    setActiveWorkspaceMode('compiler')
    setCompilerTab('tests')
    setIsRunningTests(true)
    setErrorMsg(null)

    try {
      const res = await compilerService.runTestCases({
        code,
        language,
        test_cases: casesToRun,
      })
      setTestResults(res)
    } catch (err: unknown) {
      console.error('Run tests failed:', err)
      const msg = err instanceof Error ? err.message : 'Test runner error'
      setErrorMsg(`Test execution failed: ${msg}`)
    } finally {
      setIsRunningTests(false)
    }
  }

  // AI-Assisted Test Case Generator
  const handleGenerateTestCases = async () => {
    if (!isAuthenticated) {
      setShowAuthGateModal(true)
      return
    }
    setIsGeneratingTests(true)
    try {
      const res = await compilerService.generateTestCases({
        code,
        language,
        count: 4,
      })
      if (res.test_cases && res.test_cases.length > 0) {
        setTestCases(res.test_cases)
        setActiveWorkspaceMode('compiler')
        setCompilerTab('tests')
      }
    } catch (err: unknown) {
      console.error('Generate test cases failed:', err)
      const msg = err instanceof Error ? err.message : 'AI generation error'
      setErrorMsg(`Failed to generate test cases: ${msg}`)
    } finally {
      setIsGeneratingTests(false)
    }
  }

  const handleAddTestCase = (tc: TestCaseItem) => {
    setTestCases((prev) => [...prev, tc])
  }

  const handleDeleteTestCase = (id: string) => {
    setTestCases((prev) => prev.filter((t) => t.id !== id))
  }

  // Format Code via Monaco
  const handleFormatCode = () => {
    editorRef.current?.formatDocument()
  }

  // Copy Code to Clipboard
  const handleCopyCode = () => {
    navigator.clipboard.writeText(code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  // Undo Fix
  const handleUndoFix = () => {
    if (codeHistory.length === 0) return
    const prevCode = codeHistory[codeHistory.length - 1]
    setCodeHistory((h) => h.slice(0, -1))
    setCode(prevCode)
  }

  // Fix First Error / AI Quick-Fix
  const handleFixFirstError = async () => {
    // 1. If sandbox execution failed with an AI fix suggestion
    if (executionResult?.error_detail?.corrected_code) {
      handleApplyCompilerFix(executionResult.error_detail.corrected_code)
      return
    }

    // 2. If static audit detected findings
    if (analysisResult?.findings && analysisResult.findings.length > 0) {
      const critical = analysisResult.findings.find((f) => f.severity === 'Critical')
      const high = analysisResult.findings.find((f) => f.severity === 'High')
      const target = critical || high || analysisResult.findings[0]
      handleReviewFix(target)
      return
    }

    // 3. Otherwise run analysis to uncover any hidden issues
    if (!analysisResult) {
      await runAnalysis(code, language, filename, true)
      return
    }

    setErrorMsg('No errors or warnings currently detected to fix. Great job!')
  }

  // Synchronize language when navigation state or URL query changes (e.g. from Home page cards)
  const lastNavProcessedRef = useRef<string>(initialLang)
  useEffect(() => {
    const navLang = getNavLanguage()
    if (navLang && navLang !== lastNavProcessedRef.current) {
      lastNavProcessedRef.current = navLang
      handleLanguageChange(navLang, true)
    }
  }, [location.state, location.search])

  const handleLanguageChange = (newLang: string, fromNav: boolean = false) => {
    // Abort any pending analysis request immediately
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = new AbortController()
    }
    setIsAnalyzing(false)
    setAnalysisStep('')

    const cleanLang = (newLang || 'python').toLowerCase().trim()
    setLanguage(cleanLang)
    const template = getStarterTemplate(cleanLang)
    setFilename(template.filename)

    // Auto-switch to Live Preview for visual Web languages; switch back to compiler for all other languages
    if (['html', 'css', 'reactjs', 'reactts'].includes(cleanLang)) {
      setActiveWorkspaceMode('preview')
    } else {
      setActiveWorkspaceMode('compiler')
    }

    // Load default test cases for the new language
    setTestCases(getDefaultTestCases(cleanLang))
    setTestResults(null)

    // Do not clear the user's code when switching languages.
    // Load starter code if:
    // 1. Editor is currently empty or whitespace
    // 2. Or navigating from Home page language card
    // 3. Or current code matches a known starter template or sample (unmodified)
    const isKnownStarterOrEmpty =
      !code ||
      code.trim() === '' ||
      fromNav ||
      Object.values(STARTER_TEMPLATES).some((t) => t.code.trim() === code.trim()) ||
      Object.values(CODE_SAMPLES).some((s) => s.code.trim() === code.trim()) ||
      Object.values(EXECUTABLE_SAMPLES).some((e) => e.code.trim() === code.trim())

    if (isKnownStarterOrEmpty) {
      setCode(template.code)
      setLastSavedCode(template.code)
    }

    // Invalidate stale execution and analysis results from the previous language
    setExecutionResult(null)
    setAnalysisResult(null)
    setErrorMsg(null)
    setTargetLine(null)
  }

  const handleResetCode = () => {
    const template = getStarterTemplate(language)
    setCode(template.code)
    setLastSavedCode(template.code)
    setCodeHistory([])
    setExecutionResult(null)
    setAnalysisResult(null)
    setTestResults(null)
    setProgramStdin('')
    setErrorMsg(null)
    setTargetLine(null)
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
    setCodeHistory((prev) => [...prev, code])
    setCode(correctedCode)
    setSelectedFindingForFix(null)
    setTimeout(() => {
      runAnalysis(correctedCode, language, filename, false)
    }, 250)
  }

  const isWebPreviewLang = ['html', 'css', 'javascript', 'js', 'typescript', 'ts', 'reactjs', 'reactts', 'react', 'nodejs'].includes(language.toLowerCase())
  const currentMode = (activeWorkspaceMode === 'preview' && !isWebPreviewLang) ? 'compiler' : activeWorkspaceMode

  const getPreviewDocument = () => {
    const l = language.toLowerCase()

    if (l === 'html' || l === 'htm') {
      const consoleScript = `
        <script>
          (function() {
            var oldLog = console.log, oldErr = console.error;
            var box = null;
            function getBox() {
              if (!box) {
                box = document.createElement('div');
                box.id = '__cg_console__';
                box.style.cssText = 'position:fixed;bottom:10px;left:10px;right:10px;max-height:100px;overflow-y:auto;background:rgba(15,23,42,0.95);border:1px solid #334155;border-radius:8px;padding:8px 12px;font-family:monospace;font-size:11px;color:#38bdf8;z-index:999999;box-shadow:0 4px 12px rgba(0,0,0,0.5);';
                var title = document.createElement('div');
                title.style.cssText = 'font-weight:bold;color:#94a3b8;margin-bottom:4px;border-bottom:1px solid #1e293b;padding-bottom:2px;';
                title.innerText = 'Browser Console:';
                box.appendChild(title);
                document.body.appendChild(box);
              }
              return box;
            }
            console.log = function() {
              oldLog.apply(console, arguments);
              try {
                var b = getBox();
                var p = document.createElement('div');
                p.style.cssText = 'color:#4ade80;margin:2px 0;white-space:pre-wrap;';
                p.innerText = '> ' + Array.from(arguments).map(function(a){ return typeof a === 'object' ? JSON.stringify(a) : String(a); }).join(' ');
                b.appendChild(p);
                b.scrollTop = b.scrollHeight;
              } catch(e){}
            };
            console.error = function() {
              oldErr.apply(console, arguments);
              try {
                var b = getBox();
                var p = document.createElement('div');
                p.style.cssText = 'color:#f87171;margin:2px 0;white-space:pre-wrap;';
                p.innerText = '[Error] ' + Array.from(arguments).join(' ');
                b.appendChild(p);
                b.scrollTop = b.scrollHeight;
              } catch(e){}
            };
          })();
        </script>
      `
      if (/<!doctype\s+html|<html[\s>]/i.test(code)) {
        return code.replace(/(<\/body>|$)/i, `${consoleScript}</body>`)
      }
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:system-ui,sans-serif;background:#0f172a;color:#f8fafc;padding:24px;margin:0;}</style></head><body>${code}${consoleScript}</body></html>`
    }

    if (l === 'css') {
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; padding: 24px; margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 85vh; }
    ${code}
  </style>
</head>
<body>
  <div class="preview-card card">
    <span class="badge glow-badge">CSS Active</span>
    <h2>Interactive Component Preview</h2>
    <p>Applying your custom styles from the editor in real-time.</p>
    <button class="btn button primary-button">Click Preview Button</button>
  </div>
</body>
</html>`
    }

    if (l === 'reactjs' || l === 'reactts' || l === 'react') {
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; padding: 24px; margin: 0; }
    .comment-card, .comment-box, .card, .container { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin: 12px 0; max-width: 500px; }
    button { background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; }
    button:hover { background: #2563eb; }
    #console-box { position:fixed;bottom:10px;left:10px;right:10px;max-height:90px;overflow-y:auto;background:rgba(15,23,42,0.95);border:1px solid #334155;border-radius:8px;padding:8px 12px;font-family:monospace;font-size:11px;color:#38bdf8; }
  </style>
</head>
<body>
  <div id="root"></div>
  <div id="console-box"><strong style="color:#94a3b8">React Console:</strong></div>
  <script type="text/babel">
    const oldLog = console.log;
    console.log = function(...args) {
      oldLog.apply(console, args);
      const c = document.getElementById('console-box');
      if (c) {
        const line = document.createElement('div');
        line.style.color = '#4ade80';
        line.innerText = '> ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
        c.appendChild(line);
        c.scrollTop = c.scrollHeight;
      }
    };

    try {
      let clean = ${JSON.stringify(code)}
        .replace(/import\\s+React\\b[^;]*;?/g, '')
        .replace(/import\\s+{[^}]*}\\s+from\\s+['"][^'"]*['"];?/g, '')
        .replace(/export\\s+default\\s+/g, '')
        .replace(/export\\s+const\\s+/g, 'const ')
        .replace(/export\\s+function\\s+/g, 'function ');

      eval(Babel.transform(clean, { presets: ['react', 'typescript'] }).code);

      const candidates = [typeof App !== 'undefined' ? App : null,
                          typeof RichComment !== 'undefined' ? RichComment : null,
                          typeof UserComment !== 'undefined' ? UserComment : null,
                          typeof CounterDemo !== 'undefined' ? CounterDemo : null,
                          typeof CounterApp !== 'undefined' ? CounterApp : null];
      const Comp = candidates.find(c => Boolean(c));
      if (Comp) {
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(Comp, {
          rawHtml: '<p style="color:#38bdf8">Interactive component rendered</p>',
          comment: { content: 'Sample user comment' },
          metadata: { author: 'Developer' }
        }));
      }
    } catch(err) {
      console.error(err);
      document.getElementById('root').innerHTML = '<div style="color:#f87171;padding:16px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:8px;"><strong>React Notice:</strong> ' + err.message + '</div>';
    }
  </script>
</body>
</html>`
    }

    // Default JS / TS / Node.js
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; padding: 20px; margin: 0; }
    #console { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 16px; font-family: monospace; font-size: 12px; min-height: 160px; max-height: 380px; overflow-y: auto; }
    .header { font-size: 12px; font-weight: bold; color: #94a3b8; margin-bottom: 8px; border-bottom: 1px solid #334155; padding-bottom: 6px; display: flex; justify-content: space-between; }
    .log-line { color: #4ade80; margin: 4px 0; white-space: pre-wrap; }
    .err-line { color: #f87171; margin: 4px 0; white-space: pre-wrap; }
  </style>
</head>
<body>
  <div class="header">
    <span>Live JavaScript / Client Console</span>
    <span style="color:#38bdf8;">Interactive Runtime</span>
  </div>
  <div id="console"></div>
  <div id="app" style="margin-top:16px;"></div>
  <script>
    (function() {
      var consoleEl = document.getElementById('console');
      function log(msg, isErr) {
        var line = document.createElement('div');
        line.className = isErr ? 'err-line' : 'log-line';
        line.innerText = (isErr ? '[Error] ' : '> ') + msg;
        consoleEl.appendChild(line);
      }
      var oldLog = console.log;
      console.log = function() {
        oldLog.apply(console, arguments);
        var str = Array.from(arguments).map(function(a) {
          return typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a);
        }).join(' ');
        log(str, false);
      };
      var oldErr = console.error;
      console.error = function() {
        oldErr.apply(console, arguments);
        log(Array.from(arguments).join(' '), true);
      };
      window.onerror = function(msg, url, line) {
        log(msg + ' (line ' + line + ')', true);
      };
      try {
        ${code.replace(/import\s+.*from\s+['"].*['"];?/g, '')}
      } catch(e) {
        log(e.message, true);
      }
    })();
  </script>
</body>
</html>`
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-y-auto">
        {/* Header Bar */}
        <div className="border-b border-slate-800 bg-slate-950/80 px-6 py-4 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Back & Home Navigation Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer shadow-sm"
                  title="Go back to previous page"
                >
                  <ArrowLeft className="h-3.5 w-3.5 text-blue-500" />
                  <span>Back</span>
                </button>
                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer shadow-sm"
                  title="Go to Home page"
                >
                  <Home className="h-3.5 w-3.5 text-blue-500" />
                  <span>Home</span>
                </Link>
              </div>

              <div>
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <Terminal className="h-5 w-5 text-blue-400" />
                  Analysis Workspace
                </h1>
                <p className="text-xs text-slate-400">
                  Interactive multi-language static analyzer and AI remediation assistant.
                </p>
              </div>
            </div>

            {/* 5 Primary Top Actions Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              {/* 1. ANALYZE CODE Button */}
              <button
                type="button"
                onClick={() => runAnalysis(code, language, filename, true)}
                disabled={isAnalyzing}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 cursor-pointer"
                title="Analyze code for bugs, syntax errors, and security issues"
              >
                {isAnalyzing ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Analyze Code</span>
                  </>
                )}
              </button>

              {/* 2. RUN CODE Button — Real Isolated Execution */}
              <button
                type="button"
                onClick={runExecution}
                disabled={isExecuting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-500/20 transition hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 cursor-pointer"
                title="Execute code in real sandboxed environment (Judge0 / SQLite)"
              >
                {isExecuting ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Running...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-white text-white" />
                    <span>Run Code</span>
                  </>
                )}
              </button>

              {/* 3. FIX ERROR Button — AI Remediation */}
              <button
                type="button"
                onClick={handleFixFirstError}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-amber-500/20 transition hover:from-amber-500 hover:to-orange-500 cursor-pointer"
                title="Suggest or apply fixes for identified issues using AI"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Fix Error</span>
              </button>

              {/* 4. RUN TESTS Button */}
              <button
                type="button"
                onClick={handleRunTests}
                disabled={isRunningTests}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-violet-600 to-purple-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-purple-500/20 transition hover:from-purple-500 hover:to-violet-500 disabled:opacity-50 cursor-pointer"
                title="Run automated test suite and verify outputs"
              >
                {isRunningTests ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Testing...</span>
                  </>
                ) : (
                  <>
                    <TestTube2 className="h-3.5 w-3.5" />
                    <span>Run Tests</span>
                  </>
                )}
              </button>

              {/* 5. RESET CODE Button */}
              <button
                type="button"
                onClick={handleResetCode}
                title="Restore default or initial code and clear errors"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5 text-amber-400" />
                <span>Reset Code</span>
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
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  showExplanationPanel && !isExplaining
                    ? 'border border-violet-500/40 bg-violet-500/15 text-violet-300 hover:bg-violet-500/25 shadow-sm shadow-violet-500/10'
                    : 'border border-violet-500/30 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 hover:text-violet-300 shadow-sm shadow-violet-500/10'
                }`}
              >
                {isExplaining ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
                    <span>Explaining...</span>
                  </>
                ) : (
                  <>
                    <BrainCircuit className="h-3.5 w-3.5" />
                    <span>Explain with AI</span>
                  </>
                )}
              </button>

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                type="button"
                aria-label="Toggle theme mode"
                title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
                className="flex h-8.5 w-8.5 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 text-slate-300 transition hover:bg-slate-800 hover:text-white"
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
            {/* Left: Language Selector & Unsaved Changes Status */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-semibold text-slate-400 text-[11px] uppercase tracking-wider">Language:</span>
              <LanguageSelector value={language} onChange={handleLanguageChange} />

              {/* Starter Template button */}
              <button
                type="button"
                onClick={handleResetCode}
                title={`Load clean ${LANGUAGE_CONFIG[language.toLowerCase()]?.label || language} starter template`}
                className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-700 transition"
              >
                Starter Template
              </button>

              {/* Vulnerability Audit Sample button */}
              {CODE_SAMPLES[language.toLowerCase()] && (
                <button
                  type="button"
                  onClick={() => {
                    const sample = CODE_SAMPLES[language.toLowerCase()].code
                    setCodeHistory((prev) => [...prev, code])
                    setCode(sample)
                    setLastSavedCode(sample)
                    setExecutionResult(null)
                    setAnalysisResult(null)
                    setErrorMsg(null)
                    setTargetLine(null)
                  }}
                  title="Load vulnerability audit sample with known security defects"
                  className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-2.5 py-1.5 text-xs text-purple-300 hover:bg-purple-500/20 transition"
                >
                  Load Audit Sample
                </button>
              )}

              {/* Interactive Stdin Sample Button */}
              {EXECUTABLE_SAMPLES[language.toLowerCase()]?.sampleStdin && (
                <button
                  type="button"
                  onClick={() => {
                    const execSample = EXECUTABLE_SAMPLES[language.toLowerCase()]
                    setCodeHistory((prev) => [...prev, code])
                    setCode(execSample.code)
                    setLastSavedCode(execSample.code)
                    if (execSample.sampleStdin) {
                      setProgramStdin(execSample.sampleStdin)
                    }
                    setExecutionResult(null)
                    setErrorMsg(null)
                    setTargetLine(null)
                  }}
                  title="Load interactive standard input (stdin) program and sample input"
                  className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition cursor-pointer"
                >
                  Load Input Program
                </button>
              )}

              {/* Unsaved Changes Indicator */}
              {code !== lastSavedCode ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-300" title="Editor has unsaved code modifications">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Unsaved Changes
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400" title="All edits are up-to-date">
                  <CheckCircle2 className="h-3 w-3" />
                  Code Saved
                </span>
              )}
            </div>

            {/* Right: Format, Copy, Undo, Upload, Clear, Export Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Format Code */}
              <button
                type="button"
                onClick={handleFormatCode}
                title="Format source code using Monaco beautifier"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
              >
                <AlignLeft className="h-3.5 w-3.5 text-sky-400" />
                <span>Format</span>
              </button>

              {/* Copy Code */}
              <button
                type="button"
                onClick={handleCopyCode}
                title="Copy editor code to clipboard"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
              >
                {copiedCode ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-slate-400" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              {/* Undo Fix */}
              <button
                type="button"
                onClick={handleUndoFix}
                disabled={codeHistory.length === 0}
                title={codeHistory.length > 0 ? `Revert to previous code before AI fix (${codeHistory.length} state available)` : 'No applied fixes to undo'}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Undo2 className="h-3.5 w-3.5 text-indigo-400" />
                <span>Undo Fix {codeHistory.length > 0 ? `(${codeHistory.length})` : ''}</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                accept=".py,.js,.ts,.tsx,.jsx,.java,.cpp,.c,.go,.cs,.php,.rs,.kt,.swift,.rb,.sql,.sh,.bash,.html,.htm,.css,.json,.yaml,.yml,.xml,.md"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
              >
                <Upload className="h-3.5 w-3.5 text-blue-400" />
                <span>Upload</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCodeHistory((prev) => [...prev, code])
                  setCode('')
                }}
                title="Clear code editor"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear</span>
              </button>

              {analysisResult && (
                <>
                  <a
                    href={analysisService.getExportHtmlUrl(analysisResult.id)}
                    download
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                  >
                    <Download className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Report</span>
                  </a>
                  <a
                    href={analysisService.getExportJsonUrl(analysisResult.id)}
                    download
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                  >
                    <FileCode className="h-3.5 w-3.5 text-indigo-400" />
                    <span>JSON</span>
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
              <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-slate-200 font-semibold">{filename}</span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 px-2.5 py-1 text-xs font-semibold text-blue-400 shadow-sm shadow-blue-500/10">
                    <span>{LANGUAGE_CONFIG[language.toLowerCase()]?.icon || '🔹'}</span>
                    <span>{LANGUAGE_CONFIG[language.toLowerCase()]?.label || language.toUpperCase()}</span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {language.toLowerCase() === 'reactjs'
                      ? 'JSX mode'
                      : language.toLowerCase() === 'reactts'
                      ? 'TSX mode'
                      : language.toLowerCase() === 'nodejs'
                      ? 'Node.js mode'
                      : `${LANGUAGE_CONFIG[language.toLowerCase()]?.monacoLang || language} mode`}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-500 font-mono">{code.split('\n').length} lines</span>
                </div>
              </div>
              <CodeEditor
                ref={editorRef}
                code={code}
                language={language}
                onChange={setCode}
                findings={analysisResult?.findings || []}
                targetLine={targetLine}
                executionErrorLine={executionResult?.error_detail?.line_number || null}
                executionErrorMessage={executionResult?.error_detail?.raw_message || executionResult?.error_detail?.what_went_wrong || null}
                height="460px"
              />

              {/* Custom Input (stdin) Panel for Runtime User Input */}
              <div className="mt-4">
                <CustomInputPanel
                  value={programStdin}
                  onChange={setProgramStdin}
                  disabled={isExecuting}
                  language={language}
                />
              </div>

            </div>

            {/* Right: Mode Switcher & Dynamic Output Panel */}
            <div className="lg:col-span-5 space-y-4">
              {/* Workspace View Mode Switcher */}
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-1.5 gap-1">
                <button
                  type="button"
                  onClick={() => setActiveWorkspaceMode('compiler')}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${
                    currentMode === 'compiler'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Terminal className="h-3.5 w-3.5" />
                  <span>Compiler & Output</span>
                </button>

                {isWebPreviewLang && (
                  <button
                    type="button"
                    onClick={() => setActiveWorkspaceMode('preview')}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${
                      currentMode === 'preview'
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Live Preview</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActiveWorkspaceMode('audit')}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${
                    currentMode === 'audit'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Security Audit ({analysisResult?.findings_count || 0})</span>
                </button>
              </div>

              {/* View 0: Browser Live Preview for HTML/CSS/JS */}
              {currentMode === 'preview' && isWebPreviewLang && (
                <ErrorBoundary
                  fallbackTitle="Live Preview Notice"
                  fallbackMessage="A rendering issue occurred in the preview container. Click below to reset."
                >
                  <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-950/80 shadow-2xl backdrop-blur-md overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/70 px-4 py-2.5">
                      <div className="flex items-center gap-2 text-xs font-semibold text-white">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Interactive Browser Preview</span>
                      </div>
                      <span className="text-[11px] text-slate-400">Sandbox Iframe</span>
                    </div>
                    <div className="p-2 bg-slate-900/40">
                      <iframe
                        title="Browser Live Preview"
                        srcDoc={getPreviewDocument()}
                        sandbox="allow-scripts allow-modals"
                        className="w-full h-[480px] rounded-lg bg-white border border-slate-700 shadow-inner"
                      />
                    </div>
                  </div>
                </ErrorBoundary>
              )}

              {/* View 1: Real Sandboxed Compiler Output Panel */}
              {currentMode === 'compiler' && (
                <CompilerOutputPanel
                  result={executionResult}
                  code={code}
                  isExecuting={isExecuting}
                  stdin={programStdin}
                  onStdinChange={setProgramStdin}
                  onApplyFix={handleApplyCompilerFix}
                  onRunCorrectedCode={handleRunCorrectedCode}
                  onClearOutput={() => {
                    setExecutionResult(null)
                  }}
                  onJumpToLine={(line) => setTargetLine(line)}
                  testCases={testCases}
                  testResults={testResults}
                  isRunningTests={isRunningTests}
                  isGeneratingTests={isGeneratingTests}
                  onRunTests={handleRunTests}
                  onAddTestCase={handleAddTestCase}
                  onDeleteTestCase={handleDeleteTestCase}
                  onGenerateTestCases={handleGenerateTestCases}
                  activeTabOverride={compilerTab}
                  onTabChange={setCompilerTab}
                />
              )}



              {/* View 2: Security Findings & Duplicate Clusters */}
              {currentMode === 'audit' && (
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


      </main>
    </div>
  )
}
