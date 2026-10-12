import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ShieldCheck,
  Terminal,
  Bug,
  ShieldAlert,
  Flame,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Code2,
  Cpu,
  RefreshCw,
  Award,
  Layers,
  TestTube2,
  FileCode,
  Zap,
  Play,
  Check,
  Lock,
  ChevronRight,
  AlertTriangle,
  FileText,
  Sliders,
  Copy,
  Eye,
} from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { useAuth } from '@/features/auth/AuthContext'
import { useTheme } from '@/features/theme/ThemeContext'

interface CodeSample {
  id: string
  lang: string
  filename: string
  title: string
  rule: string
  vulnCode: string
  fixCode: string
  testCode: string
  vulnLine: number
  description: string
  cwe: string
  severity: 'Critical' | 'High' | 'Medium'
  initialScore: number
  fixedScore: number
  fixLineComment: string
}

const DEMO_SAMPLES: CodeSample[] = [
  {
    id: 'python',
    lang: 'Python',
    filename: 'auth_service.py',
    title: 'SQL Injection via String Formatting',
    rule: 'PY-SEC-CWE89-SQLI',
    cwe: 'CWE-89: Improper Neutralization of Special Elements',
    severity: 'Critical',
    initialScore: 42,
    fixedScore: 98,
    vulnLine: 4,
    description:
      'Untrusted input `user_id` is dynamically interpolated into a raw SQL query string without escaping or parameter binding.',
    fixLineComment: 'Parameterized SQL query using DB-API cursor placeholder binding',
    vulnCode: `import sqlite3

def get_user_profile(user_id: str):
    conn = sqlite3.connect("prod.db")
    cursor = conn.cursor()
    # ❌ VULNERABLE: Direct string interpolation into SQL query
    query = f"SELECT * FROM accounts WHERE id = '{user_id}'"
    cursor.execute(query)
    return cursor.fetchone()`,
    fixCode: `import sqlite3

def get_user_profile(user_id: str):
    conn = sqlite3.connect("prod.db")
    cursor = conn.cursor()
    # ✅ SECURE: Parameterized SQL placeholder prevents injection
    query = "SELECT * FROM accounts WHERE id = ?"
    cursor.execute(query, (user_id,))
    return cursor.fetchone()`,
    testCode: `import pytest
from auth_service import get_user_profile

def test_sql_injection_payload():
    # Boundary: Attacker injects tautology payload
    malicious_input = "' OR '1'='1"
    result = get_user_profile(malicious_input)
    # Must treat payload literally as ID, not executable SQL
    assert result is None, "SQL Injection vulnerability exploited!"

def test_legitimate_user_id():
    result = get_user_profile("usr_99812")
    assert result is None or isinstance(result, tuple)`,
  },
  {
    id: 'javascript',
    lang: 'JavaScript',
    filename: 'template_engine.js',
    title: 'Prototype Pollution & Unsafe eval()',
    rule: 'JS-SEC-CWE1321-POLLUTION',
    cwe: 'CWE-1321: Prototype Pollution / CWE-95: Eval Injection',
    severity: 'Critical',
    initialScore: 35,
    fixedScore: 96,
    vulnLine: 5,
    description:
      'Object keys are recursively merged without validating `__proto__` or `constructor`, enabling global prototype tampering.',
    fixLineComment: 'Object.hasOwn() guard and Object.create(null) clean dictionary',
    vulnCode: `function mergeConfigs(target, source) {
  for (let key in source) {
    // ❌ VULNERABLE: Prototype Pollution via unescaped key traversal
    if (typeof source[key] === 'object' && source[key] !== null) {
      target[key] = mergeConfigs(target[key] || {}, source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}`,
    fixCode: `function mergeConfigs(target, source) {
  const safeTarget = target || Object.create(null);
  for (const key of Object.keys(source)) {
    // ✅ SECURE: Prevent __proto__ or constructor traversal
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    if (typeof source[key] === 'object' && source[key] !== null) {
      safeTarget[key] = mergeConfigs(safeTarget[key] || {}, source[key]);
    } else {
      safeTarget[key] = source[key];
    }
  }
  return safeTarget;
}`,
    testCode: `describe('mergeConfigs prototype pollution protection', () => {
  it('should ignore malicious __proto__ payloads', () => {
    const payload = JSON.parse('{"__proto__": {"isAdmin": true}}');
    const result = mergeConfigs({}, payload);
    expect(({}).isAdmin).toBeUndefined();
    expect(result.isAdmin).toBeUndefined();
  });
});`,
  },
  {
    id: 'go',
    lang: 'Go',
    filename: 'worker_pool.go',
    title: 'Goroutine Leak & Hardcoded Credentials',
    rule: 'GO-CONC-LEAK-CWE404',
    cwe: 'CWE-404: Improper Resource Shutdown / CWE-798',
    severity: 'High',
    initialScore: 54,
    fixedScore: 94,
    vulnLine: 6,
    description:
      'Unbuffered channel read inside un-terminated goroutine causes permanent memory exhaustion on client cancellation.',
    fixLineComment: 'Context cancellation guard and buffered sync channel',
    vulnCode: `package worker

func ProcessBatch(items []string) <-chan string {
    out := make(chan string) // ❌ Unbuffered channel causes permanent leak
    go func() {
        for _, item := range items {
            out <- transform(item)
        }
        close(out)
    }()
    return out
}`,
    fixCode: `package worker

import "context"

func ProcessBatch(ctx context.Context, items []string) <-chan string {
    out := make(chan string, len(items)) // ✅ Buffered + Context-bound
    go func() {
        defer close(out)
        for _, item := range items {
            select {
            case <-ctx.Done():
                return // Safe exit on timeout/cancellation
            case out <- transform(item):
            }
        }
    }()
    return out
}`,
    testCode: `func TestProcessBatch_ContextCancellation(t *testing.T) {
    ctx, cancel := context.WithCancel(context.Background())
    cancel() // Immediate cancel

    ch := ProcessBatch(ctx, []string{"item1", "item2"})
    _, ok := <-ch
    if ok {
        t.Errorf("Expected closed channel immediately without goroutine hang")
    }
}`,
  },
]

export const LandingPage: React.FC = () => {
  const { activateDemoUser } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()

  // Sandbox interactive state
  const [selectedSampleId, setSelectedSampleId] = useState<string>('python')
  const [activeTab, setActiveTab] = useState<'vuln' | 'fix' | 'tests'>('vuln')
  const [isScanning, setIsScanning] = useState<boolean>(false)
  const [scanProgress, setScanProgress] = useState<number>(100)
  const [scanStatusText, setScanStatusText] = useState<string>('Analysis Complete')
  const [hasScanned, setHasScanned] = useState<boolean>(true)
  const [copied, setCopied] = useState<boolean>(false)
  const scanTimersRef = useRef<number[]>([])

  const activeSample = DEMO_SAMPLES.find((s) => s.id === selectedSampleId) || DEMO_SAMPLES[0]

  const clearAllScanTimers = () => {
    scanTimersRef.current.forEach((t) => window.clearTimeout(t))
    scanTimersRef.current = []
  }

  useEffect(() => {
    return () => clearAllScanTimers()
  }, [])

  const handleTryDemo = () => {
    activateDemoUser()
    navigate('/workspace')
  }

  const handleSelectLanguage = (langId: string) => {
    clearAllScanTimers()
    setIsScanning(false)
    setScanProgress(100)
    setScanStatusText('Analysis Complete')
    setSelectedSampleId(langId)
    setActiveTab('vuln')
  }

  const triggerSimulatedScan = () => {
    clearAllScanTimers()
    setIsScanning(true)
    setScanProgress(20)
    setScanStatusText('Parsing AST grammar...')

    const t1 = window.setTimeout(() => {
      setScanProgress(55)
      setScanStatusText('Evaluating Bandit & Semgrep rules...')
    }, 200)

    const t2 = window.setTimeout(() => {
      setScanProgress(85)
      setScanStatusText('Calculating cyclomatic metrics...')
    }, 400)

    const t3 = window.setTimeout(() => {
      setScanProgress(100)
      setScanStatusText('Analysis Complete — 1 Critical CWE detected')
      setIsScanning(false)
      setHasScanned(true)
    }, 600)

    scanTimersRef.current = [t1, t2, t3]
  }

  const handleCopyCode = () => {
    const code =
      activeTab === 'vuln'
        ? activeSample.vulnCode
        : activeTab === 'fix'
        ? activeSample.fixCode
        : activeSample.testCode
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32 bg-cyber-grid">
        {/* Ambient Aurora Glows - GPU optimized without heavy Gaussian blur thrashing */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-96 w-full max-w-4xl bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.14),transparent_70%)] pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-purple-600/10 blur-3xl pointer-events-none transform-gpu" />
        <div className="absolute top-1/3 right-1/4 h-64 w-64 rounded-full bg-cyan-600/10 blur-3xl pointer-events-none transform-gpu" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Headline */}
          <h1 className="mt-8 text-4xl font-black tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl">
            Catch Bugs <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 drop-shadow-[0_0_35px_rgba(56,189,248,0.3)]">
              Before They Catch You.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-6 max-w-3xl text-base text-slate-300 sm:text-lg md:text-xl leading-relaxed font-normal">
            Deterministic AST parsing meets LLM neural reasoning. Uncover security vulnerabilities,
            predict high-risk code failures, deduplicate noisy alerts, and apply instant verified patches.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/workspace"
              className="group relative inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-7 py-4 text-sm font-bold text-white shadow-[0_0_35px_rgba(59,130,246,0.4)] transition-all duration-200 hover:scale-105 hover:shadow-[0_0_50px_rgba(59,130,246,0.6)] active:scale-95"
            >
              <Terminal className="h-4 w-4 transition-transform group-hover:rotate-6 text-cyan-200" />
              <span>Analyze Your Code</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <button
              onClick={handleTryDemo}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-700/80 bg-slate-900/80 px-7 py-4 text-sm font-semibold text-slate-200 shadow-lg backdrop-blur-md transition hover:border-slate-600 hover:bg-slate-800/80 hover:text-white active:scale-95"
            >
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span>Try Instant Demo Scan</span>
            </button>
          </div>

          {/* Trust Metrics Bar */}
          <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4 max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-800/80 bg-slate-900/40 py-2.5 px-3 backdrop-blur-sm">
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-semibold text-slate-300">150+ AST & Bandit Rules</span>
            </div>
            <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-800/80 bg-slate-900/40 py-2.5 px-3 backdrop-blur-sm">
              <Zap className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-semibold text-slate-300">&lt; 45ms Scan Latency</span>
            </div>
            <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-800/80 bg-slate-900/40 py-2.5 px-3 backdrop-blur-sm">
              <Lock className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-300">Zero Code Retention</span>
            </div>
            <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-800/80 bg-slate-900/40 py-2.5 px-3 backdrop-blur-sm">
              <Code2 className="h-4 w-4 text-purple-400" />
              <span className="text-xs font-semibold text-slate-300">6 Polyglot Engines</span>
            </div>
          </div>

          {/* ============================================================== */}
          {/* INTERACTIVE LIVE CODE SANDBOX SHOWCASE */}
          {/* ============================================================== */}
          <div id="hero-showcase" className="mt-16 text-left">
            <div className="relative rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden cyber-glow-card">
              {/* Top Sandbox Navigation Bar */}
              <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 bg-slate-900/60 px-4 py-3 sm:px-6">
                {/* Left: Window Controls + File Tab */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                    <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                    <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="h-4 w-[1px] bg-slate-800" />
                  <div className="flex items-center gap-1.5 rounded-lg bg-slate-950 px-3 py-1 font-mono text-xs font-medium text-cyan-400 border border-slate-800">
                    <FileCode className="h-3.5 w-3.5" />
                    <span>{activeSample.filename}</span>
                  </div>
                </div>

                {/* Center: Language Switcher Tabs */}
                <div className="my-2 sm:my-0 flex items-center rounded-xl border border-slate-800 bg-slate-950/80 p-1">
                  {DEMO_SAMPLES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSelectLanguage(s.id)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition cursor-pointer select-none ${
                        selectedSampleId === s.id
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      <span>{s.lang}</span>
                    </button>
                  ))}
                </div>

                {/* Right: Scan Action + Progress Indicator */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={triggerSimulatedScan}
                    disabled={isScanning}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 px-3 py-1.5 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500/20 active:scale-95 disabled:opacity-50"
                  >
                    <Play className={`h-3 w-3 ${isScanning ? 'animate-spin' : ''}`} />
                    <span>{isScanning ? 'Scanning AST...' : 'Simulate AST Scan'}</span>
                  </button>
                </div>
              </div>

              {/* Progress bar during scan */}
              {isScanning && (
                <div className="h-1 w-full bg-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 transition-all duration-300"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              )}

              {/* Status bar */}
              <div className="flex items-center justify-between border-b border-slate-800/60 bg-slate-950 px-4 py-2 text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-cyan-400" />
                  <span className="font-mono text-slate-300">{scanStatusText}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-slate-400">Rule: {activeSample.rule}</span>
                  <span
                    className={`rounded px-1.5 py-0.2 font-bold text-[10px] ${
                      activeTab === 'fix'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    Quality: {activeTab === 'fix' ? activeSample.fixedScore : activeSample.initialScore}/100
                  </span>
                </div>
              </div>

              {/* Workspace Main Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800/80 bg-slate-950">
                {/* Code Window (Left 7 Cols) */}
                <div className="lg:col-span-7 flex flex-col justify-between">
                  {/* Mode switcher tabs */}
                  <div className="flex items-center justify-between border-b border-slate-800/60 bg-slate-900/40 px-4 py-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setActiveTab('vuln')}
                        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                          activeTab === 'vuln'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <ShieldAlert className="h-3 w-3 text-rose-400" />
                        <span>Vulnerable AST</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('fix')}
                        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                          activeTab === 'fix'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Sparkles className="h-3 w-3 text-emerald-400" />
                        <span>AI Remediation Diff</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('tests')}
                        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                          activeTab === 'tests'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <TestTube2 className="h-3 w-3 text-cyan-400" />
                        <span>Auto Unit Tests</span>
                      </button>
                    </div>

                    <button
                      onClick={handleCopyCode}
                      className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition"
                      title="Copy code"
                    >
                      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  {/* Code Editor Preview Box */}
                  <div className="relative p-4 sm:p-5 font-mono text-xs overflow-x-auto min-h-[300px]">
                    {/* Laser Scan Beam Animation when scanning */}
                    {isScanning && (
                      <div className="pointer-events-none absolute left-0 right-0 h-10 bg-gradient-to-b from-transparent via-cyan-400/25 to-cyan-500/5 border-b border-cyan-400 animate-scan-beam" />
                    )}

                    {activeTab === 'vuln' && (
                      <pre className="text-slate-900 dark:text-slate-200 leading-relaxed font-mono">
                        <code>{activeSample.vulnCode}</code>
                      </pre>
                    )}

                    {activeTab === 'fix' && (
                      <div className="space-y-1">
                        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2.5 mb-3 text-emerald-800 dark:text-emerald-300 text-[11px]">
                          <strong>AI Patch Synthesized:</strong> {activeSample.fixLineComment}
                        </div>
                        <pre className="text-emerald-800 dark:text-emerald-300 leading-relaxed font-mono">
                          <code>{activeSample.fixCode}</code>
                        </pre>
                      </div>
                    )}

                    {activeTab === 'tests' && (
                      <div className="space-y-1">
                        <div className="rounded-lg bg-cyan-500/10 border border-cyan-500/30 p-2.5 mb-3 text-cyan-800 dark:text-cyan-300 text-[11px]">
                          <strong>Unit Test Suite:</strong> Synthesized regression & boundary payloads.
                        </div>
                        <pre className="text-slate-900 dark:text-cyan-200 leading-relaxed font-mono">
                          <code>{activeSample.testCode}</code>
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Editor Bottom Bar */}
                  <div className="flex items-center justify-between border-t border-slate-800/60 bg-slate-900/30 px-4 py-2.5 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Code2 className="h-3 w-3 text-blue-400" />
                      <span>Syntax: {activeSample.lang}</span>
                    </span>
                    <span className="text-slate-500">UTF-8 • Monaco Kernel</span>
                  </div>
                </div>

                {/* Finding Analysis Panel (Right 5 Cols) */}
                <div className="lg:col-span-5 p-5 flex flex-col justify-between bg-slate-900/30">
                  <div className="space-y-4">
                    {/* Severity Header */}
                    <div className="flex items-center justify-between">
                      <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-rose-400">
                        <Flame className="h-3 w-3" />
                        <span>{activeSample.severity} Severity</span>
                      </div>
                      <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-400">
                        Confidence 99%
                      </span>
                    </div>

                    {/* Title & CWE */}
                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight">
                        {activeSample.title}
                      </h3>
                      <p className="font-mono text-[11px] text-cyan-400 mt-0.5">
                        {activeSample.cwe}
                      </p>
                    </div>

                    {/* Explanation */}
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {activeSample.description}
                    </p>

                    {/* Score Impact Gauge */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-medium text-slate-400">Code Health Index</span>
                        <span className="font-bold text-rose-400">
                          {activeTab === 'fix' ? `${activeSample.fixedScore}/100 (+56)` : `${activeSample.initialScore}/100 (-58)`}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${
                            activeTab === 'fix'
                              ? 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                              : 'bg-gradient-to-r from-rose-500 to-amber-500'
                          }`}
                          style={{
                            width: `${activeTab === 'fix' ? activeSample.fixedScore : activeSample.initialScore}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>Risk Penalty: {activeTab === 'fix' ? '0 pts' : '-58 pts'}</span>
                        <span>Exploitability: {activeTab === 'fix' ? 'Mitigated' : 'Severe'}</span>
                      </div>
                    </div>

                    {/* Quick AI Fix Action */}
                    <div className="rounded-2xl border border-slate-800/90 bg-slate-950/60 p-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 mb-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                        <span>Recommended Remediation</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mb-3">
                        {activeTab === 'fix'
                          ? 'Patch verified against AST security rule. Zero side-effects detected.'
                          : 'Synthesize parameterized bindings to eliminate untrusted execution.'}
                      </p>
                      {activeTab !== 'fix' ? (
                        <button
                          onClick={() => setActiveTab('fix')}
                          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-purple-500/20 transition hover:from-purple-500 hover:to-blue-500"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>Preview AI Unified Patch</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setActiveTab('tests')}
                          className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-cyan-500/20 transition hover:bg-cyan-500"
                        >
                          <TestTube2 className="h-3.5 w-3.5" />
                          <span>Generate Boundary Unit Tests</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Action Link to Full Workspace */}
                  <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800/80">
                    <Link
                      to="/workspace"
                      className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white dark:text-cyan-300 hover:bg-blue-600 dark:hover:bg-slate-700 py-2.5 px-4 text-xs font-bold transition shadow-sm group"
                    >
                      <span>🚀 Open & Analyze Your Own Code in Full Workspace</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* ASYMMETRIC BENTO GRID: FEATURE SUITE */}
      {/* ============================================================== */}
      <section id="features" className="relative border-t border-slate-900 bg-slate-950 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold text-blue-400 mb-4">
              <Cpu className="h-3.5 w-3.5" />
              <span>Architected for Enterprise Security</span>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
              Precision Intelligence.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                Zero Fluff.
              </span>
            </h2>
            <p className="mt-4 text-base text-slate-400">
              Unlike generic LLM wrappers, CodeGuardian AI combines deterministic AST parsing,
              proven security rulesets, and neural synthesis to guarantee zero false positives.
            </p>
          </div>

          {/* Bento Grid Layout */}
          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-12">
            {/* Bento Card 1: Dual-Engine Hybrid (8 Cols) */}
            <div className="relative rounded-3xl border border-slate-800/80 bg-slate-900/60 p-8 lg:col-span-8 overflow-hidden group hover:border-slate-700 transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mb-6">
                <Cpu className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-black text-white">
                Dual-Engine Hybrid Intelligence
              </h3>
              <p className="mt-2 text-sm text-slate-400 max-w-xl leading-relaxed">
                Deterministic AST rules (Bandit, Semgrep, Python AST) enforce guaranteed correctness,
                while optional LLM neural reasoning explains complex context, multi-file side-effects, and generates verified diffs.
              </p>

              {/* Visual Pipeline Graphic inside Card */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-center">
                  <div className="text-cyan-400 font-bold mb-1">AST Tree Engine</div>
                  <div className="text-[11px] text-slate-400">Grammar & Control Flow</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-center">
                  <div className="text-blue-400 font-bold mb-1">Bandit Security</div>
                  <div className="text-[11px] text-slate-400">CWE / OWASP Patterns</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-center">
                  <div className="text-purple-400 font-bold mb-1">Neural Synthesis</div>
                  <div className="text-[11px] text-slate-400">Safe Auto-Patches</div>
                </div>
              </div>
            </div>

            {/* Bento Card 2: Transparent Explainable Scoring (4 Cols) */}
            <div className="relative rounded-3xl border border-slate-800/80 bg-slate-900/60 p-8 lg:col-span-4 overflow-hidden group hover:border-slate-700 transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-6">
                <Award className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-black text-white">
                Explainable Health Score
              </h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                No black-box mystery numbers. Scores start at 100 with clear, mathematical point deductions:
              </p>
              <div className="mt-5 space-y-2 text-xs font-mono">
                <div className="flex justify-between items-center rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 p-2.5 text-red-700 dark:text-red-300 font-semibold shadow-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    Critical Vulnerability
                  </span>
                  <span className="font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50 px-2 py-0.5 rounded-md">-25 pts</span>
                </div>
                <div className="flex justify-between items-center rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-2.5 text-amber-800 dark:text-amber-300 font-semibold shadow-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    High Impact Bug
                  </span>
                  <span className="font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded-md">-15 pts</span>
                </div>
                <div className="flex justify-between items-center rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 p-2.5 text-blue-800 dark:text-blue-300 font-semibold shadow-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    Code Smell & Complexity
                  </span>
                  <span className="font-bold text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded-md">-5 pts</span>
                </div>
              </div>
            </div>

            {/* Bento Card 3: Deduplication Engine (4 Cols) */}
            <div className="relative rounded-3xl border border-slate-800/80 bg-slate-900/60 p-8 lg:col-span-4 overflow-hidden group hover:border-slate-700 transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mb-6">
                <RefreshCw className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-black text-white">
                Normalized Duplicate Grouping
              </h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                AST pattern normalization and CodeBERT contextual embeddings suppress alert fatigue by clustering identical root causes into single actionable groups.
              </p>
              <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs font-mono text-slate-300">
                <span className="text-cyan-400 font-bold">14 Raw Findings</span> &rarr; <span className="text-emerald-400 font-bold">1 Canonical Alert</span>
              </div>
            </div>

            {/* Bento Card 4: Automated Unit Tests (4 Cols) */}
            <div className="relative rounded-3xl border border-slate-800/80 bg-slate-900/60 p-8 lg:col-span-4 overflow-hidden group hover:border-slate-700 transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-6">
                <TestTube2 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-black text-white">
                Unit Test Generator
              </h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Synthesizes boundary edge tests, malicious attack payloads, and regression guards ready for `pytest`, `Jest`, or `testing` in Go.
              </p>
              <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs font-mono text-emerald-300">
                <span>def test_regression_guard():</span>
                <span className="block text-slate-500 pl-2"># verified patch immunity</span>
              </div>
            </div>

            {/* Bento Card 5: Real-Time Monaco Squigglies (4 Cols) */}
            <div className="relative rounded-3xl border border-slate-800/80 bg-slate-900/60 p-8 lg:col-span-4 overflow-hidden group hover:border-slate-700 transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-6">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-black text-white">
                Real-Time Monaco Markers
              </h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Debounced typing listener updates red squiggly markers and hover tooltips directly inside Monaco Editor in under 50ms.
              </p>
              <div className="mt-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 p-3.5 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-800 dark:text-slate-200 font-semibold">
                  <span>cursor.execute(query)</span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800">Flagged</span>
                </div>
                <span className="block text-[11px] text-slate-600 dark:text-slate-400 mt-1.5 font-sans">AST verified: Safe parameter binding recommended</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4-STEP PIPELINE: HOW IT WORKS */}
      {/* ============================================================== */}
      <section id="how-it-works" className="relative border-t border-slate-200 dark:border-slate-900 bg-white/80 dark:bg-slate-950/80 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
              Interactive Execution Pipeline
            </h2>
            <p className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl">
              From Untrusted Code to Verified Patch
            </p>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
              How CodeGuardian AI processes your code securely without retaining data.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-4 relative">
            {[
              {
                step: '01',
                title: 'Code Ingestion',
                description: 'Paste raw code or upload source files in Python, JS, TS, Java, C++, or Go into Monaco.',
                icon: FileCode,
                color: 'text-cyan-600 dark:text-cyan-400',
                border: 'border-cyan-500/40',
                iconBg: 'bg-cyan-50 dark:bg-slate-950',
                numColor: 'text-cyan-200 dark:text-slate-700',
              },
              {
                step: '02',
                title: 'AST Static Analysis',
                description: 'Deterministic abstract syntax tree parsers extract tokens, calls, and control-flow graphs.',
                icon: Cpu,
                color: 'text-blue-600 dark:text-blue-400',
                border: 'border-blue-500/40',
                iconBg: 'bg-blue-50 dark:bg-slate-950',
                numColor: 'text-blue-200 dark:text-slate-700',
              },
              {
                step: '03',
                title: 'Risk Deduplication',
                description: 'Security rules and pattern embeddings eliminate false alerts and calculate the 0-100 score.',
                icon: ShieldCheck,
                color: 'text-indigo-600 dark:text-indigo-400',
                border: 'border-indigo-500/40',
                iconBg: 'bg-indigo-50 dark:bg-slate-950',
                numColor: 'text-indigo-200 dark:text-slate-700',
              },
              {
                step: '04',
                title: 'Diff & Test Synthesis',
                description: 'Review side-by-side patch diffs, apply fixes safely, and download auto-generated unit test files.',
                icon: Sparkles,
                color: 'text-purple-600 dark:text-purple-400',
                border: 'border-purple-500/40',
                iconBg: 'bg-purple-50 dark:bg-slate-950',
                numColor: 'text-purple-200 dark:text-slate-700',
              },
            ].map((s, idx) => (
              <div
                key={idx}
                className="relative rounded-3xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 p-7 shadow-sm dark:shadow-none hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${s.iconBg} border ${s.border} ${s.color}`}>
                    <s.icon className="h-6 w-6" />
                  </div>
                  <span className={`font-mono text-2xl font-black ${s.numColor}`}>
                    {s.step}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{s.title}</h3>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* COMPARISON: CODEGUARDIAN VS TRADITIONAL LINTERS */}
      {/* ============================================================== */}
      <section className="border-t border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950 py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Why CodeGuardian AI Outperforms Traditional Linters
            </h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              Standard tools only check style. CodeGuardian understands semantics, security, and remediation.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm overflow-hidden">
            <div className="grid grid-cols-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <div>Capability</div>
              <div className="text-slate-400 dark:text-slate-500">Traditional Linters (ESLint / Flake8)</div>
              <div className="text-cyan-600 dark:text-cyan-400">CodeGuardian AI</div>
            </div>

            {[
              {
                feature: 'Security Vulnerability Detection (SQLi, XSS, Deserialization)',
                legacy: 'Rule-limited or Requires plugins',
                guardian: 'Native 150+ AST & Bandit rules',
              },
              {
                feature: 'AI-Generated Unified Fix Diffs',
                legacy: 'None (Manual developer fix)',
                guardian: '1-Click Contextual Patches',
              },
              {
                feature: 'Automated Unit Test & Boundary Generation',
                legacy: 'None',
                guardian: 'Automated Pytest & Jest suites',
              },
              {
                feature: 'Transparent 0–100 Health Scoring',
                legacy: 'Arbitrary error counts',
                guardian: 'Explainable deduction formula',
              },
              {
                feature: 'Duplicate Bug Deduplication',
                legacy: 'Noisy identical alerts',
                guardian: 'Normalized AST clustering',
              },
              {
                feature: 'Multi-Language Polyglot Support',
                legacy: 'Separate tool for each language',
                guardian: 'Unified in 1 workspace',
              },
            ].map((row, idx) => (
              <div
                key={idx}
                className="grid grid-cols-3 border-b border-slate-100 dark:border-slate-800/60 px-6 py-4 text-xs transition hover:bg-slate-50 dark:hover:bg-slate-900/80"
              >
                <div className="font-semibold text-slate-800 dark:text-slate-200">{row.feature}</div>
                <div className="text-slate-500 dark:text-slate-400">{row.legacy}</div>
                <div className="flex items-center gap-1.5 font-bold text-cyan-700 dark:text-cyan-300">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>{row.guardian}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* FINAL CALL TO ACTION BANNER */}
      {/* ============================================================== */}
      <section className="relative overflow-hidden border-t border-slate-200 dark:border-slate-900 bg-gradient-to-br from-cyan-50 via-white to-indigo-50 dark:from-cyan-950/40 dark:via-slate-950 dark:to-indigo-950/40 py-24">
        {/* Glow orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-cyan-400/10 dark:bg-cyan-500/15 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            Start Reviewing Code in Seconds.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 dark:text-slate-300">
            No mandatory account creation. Run an instant demo scan or sign in to save your audit history.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              to="/workspace"
              className="rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-8 py-4 text-sm font-bold text-white shadow-[0_0_35px_rgba(59,130,246,0.4)] transition hover:scale-105 active:scale-95"
            >
              Open Analysis Workspace
            </Link>
            <button
              onClick={handleTryDemo}
              className="rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 px-8 py-4 text-sm font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white active:scale-95"
            >
              Launch Demo Mode
            </button>
            <Link
              to="/docs"
              className="rounded-2xl border border-transparent px-6 py-4 text-sm font-semibold text-slate-500 dark:text-slate-400 transition hover:text-slate-800 dark:hover:text-slate-200"
            >
              Explore API Docs
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
