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
  Database,
  Globe,
  Palette,
  Server,
  Atom,
  RotateCcw,
  CheckSquare,
  Wrench,
  ExternalLink,
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
  cwe: string
  severity: 'Critical' | 'High' | 'Medium'
  initialScore: number
  fixedScore: number
  fixLineComment: string
  vulnCode: string
  fixCode: string
  outputPreview: string
}

const DEMO_SAMPLES: CodeSample[] = [
  {
    id: 'python',
    lang: 'Python',
    filename: 'calculator.py',
    title: 'SQL Injection via Dynamic Query Formatting',
    rule: 'PY-SEC-CWE89-SQLI',
    cwe: 'CWE-89: Improper Neutralization of Special Elements',
    severity: 'Critical',
    initialScore: 42,
    fixedScore: 98,
    fixLineComment: 'Parameterized SQL query using DB-API cursor placeholder binding',
    vulnCode: `import sqlite3

def query_user(user_id: str):
    conn = sqlite3.connect("app.db")
    cursor = conn.cursor()
    # ❌ VULNERABLE: Direct string interpolation enables SQL injection
    query = f"SELECT * FROM accounts WHERE id = '{user_id}'"
    cursor.execute(query)
    return cursor.fetchone()`,
    fixCode: `import sqlite3

def query_user(user_id: str):
    conn = sqlite3.connect("app.db")
    cursor = conn.cursor()
    # ✅ SECURE: Parameterized placeholder prevents injection
    query = "SELECT * FROM accounts WHERE id = ?"
    cursor.execute(query, (user_id,))
    return cursor.fetchone()`,
    outputPreview: `=== Execution & Test Results ===
Status: Execution Successful (Judge0 Sandbox)
Execution Time: 0.04s | Memory: 3.2 MB | Exit Code: 0

[PASS] test_normal_lookup: OK (Returned record ID #104)
[PASS] test_sql_injection_guard: OK (Payload treated as literal ID)
Overall Test Suite: 2/2 Passed (100%)`,
  },
  {
    id: 'javascript',
    lang: 'JavaScript',
    filename: 'auth_middleware.js',
    title: 'Prototype Pollution & Unsafe Key Assignment',
    rule: 'JS-SEC-CWE1321-POLLUTION',
    cwe: 'CWE-1321: Prototype Pollution / Object Injection',
    severity: 'Critical',
    initialScore: 38,
    fixedScore: 96,
    fixLineComment: 'Object.hasOwn() key check & Object.create(null) clean dictionary',
    vulnCode: `function mergeConfigs(target, source) {
  for (let key in source) {
    // ❌ VULNERABLE: Prototype pollution via __proto__ traversal
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
    // ✅ SECURE: Reject __proto__, constructor, and prototype keys
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
    outputPreview: `=== Node.js 20 Sandbox Output ===
[PASS] should prevent prototype tampering: OK (({}).isAdmin === undefined)
[PASS] should merge standard config keys: OK
Exit Code: 0 (Node.js runtime exit clean)`,
  },
  {
    id: 'sql',
    lang: 'SQL',
    filename: 'query.sql',
    title: 'Destructive Query without Scope Restriction',
    rule: 'SQL-RISK-UNRESTRICTED-DELETE',
    cwe: 'CWE-20: Improper Input Validation',
    severity: 'High',
    initialScore: 48,
    fixedScore: 95,
    fixLineComment: 'Targeted WHERE clause and parameter validation',
    vulnCode: `-- ❌ RISK: UPDATE query without WHERE clause mutates all rows
UPDATE users
SET status = 'inactive';

-- High risk bulk operation without transaction safeguard`,
    fixCode: `-- ✅ SECURE: Scoped WHERE condition with specific tenant ID
UPDATE users
SET status = 'inactive'
WHERE tenant_id = 104 AND last_login < date('now', '-90 days');`,
    outputPreview: `+----+--------------+----------------+----------+
| id | name         | role           | salary   |
+----+--------------+----------------+----------+
| 1  | Alice Smith  | Admin          | 95000.0  |
| 2  | Bob Jones    | Developer      | 85000.0  |
| 4  | Diana Prince | Lead Architect | 120000.0 |
+----+--------------+----------------+----------+
(3 rows affected in Safe In-Memory SQLite Sandbox)`,
  },
  {
    id: 'cpp',
    lang: 'C++',
    filename: 'buffer_ops.cpp',
    title: 'Out-of-Bounds Vector Access',
    rule: 'CPP-MEM-BOUNDS-CWE119',
    cwe: 'CWE-119: Memory Buffer Overrun',
    severity: 'High',
    initialScore: 50,
    fixedScore: 94,
    fixLineComment: 'Safe std::vector::at() bounds check & range iterator',
    vulnCode: `#include <iostream>
#include <vector>

void process_data(const std::vector<int>& items) {
    // ❌ DANGEROUS: Unchecked subscript access can cause segfault
    for (size_t i = 0; i <= items.size(); ++i) {
        std::cout << "Value: " << items[i] << std::endl;
    }
}`,
    fixCode: `#include <iostream>
#include <vector>

void process_data(const std::vector<int>& items) {
    // ✅ SECURE: Range-based loop eliminates out-of-bounds access
    for (const auto& item : items) {
        std::cout << "Value: " << item << std::endl;
    }
}`,
    outputPreview: `=== GCC 14 C++20 Sandbox Output ===
Compiling buffer_ops.cpp: OK (0 warnings)
Executing binary:
Value: 10
Value: 20
Value: 30
Value: 40
Total Items Processed: 4 | Exit Code: 0`,
  },
]

// The 12 Supported Languages requested in Section 1
interface SupportedLanguage {
  name: string
  code: string
  category: 'Core' | 'Web' | 'Database'
  icon: string
  version: string
  capability: string
  color: string
}

const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  {
    name: 'Python',
    code: 'python',
    category: 'Core',
    icon: '🐍',
    version: 'Python 3.11 / 3.12',
    capability: 'AST Scanner + Judge0 Sandbox + AI Fixes',
    color: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-400',
  },
  {
    name: 'Java',
    code: 'java',
    category: 'Core',
    icon: '☕',
    version: 'OpenJDK 21',
    capability: 'Standard Main Sandbox + AST Security Analysis',
    color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400',
  },
  {
    name: 'C',
    code: 'c',
    category: 'Core',
    icon: '🔹',
    version: 'GCC 14 (C17)',
    capability: 'Compiler Sandbox + Pointer & Buffer Diagnostics',
    color: 'from-slate-500/20 to-slate-400/10 border-slate-500/30 text-slate-300',
  },
  {
    name: 'C++',
    code: 'cpp',
    category: 'Core',
    icon: '⚙️',
    version: 'G++ 14 (C++20/C++23)',
    capability: 'Real-Time Compilation + Vector Bounds Verification',
    color: 'from-blue-600/20 to-indigo-600/10 border-blue-600/30 text-blue-300',
  },
  {
    name: 'JavaScript',
    code: 'javascript',
    category: 'Web',
    icon: '⚡',
    version: 'Node.js 20 LTS',
    capability: 'Node.js Sandbox + Client Console Execution',
    color: 'from-yellow-500/20 to-amber-500/10 border-yellow-500/30 text-yellow-400',
  },
  {
    name: 'TypeScript',
    code: 'typescript',
    category: 'Web',
    icon: '🔷',
    version: 'TypeScript 5.7',
    capability: 'Type Checker + Node.js Execution + Interface Analysis',
    color: 'from-sky-500/20 to-blue-500/10 border-sky-500/30 text-sky-400',
  },
  {
    name: 'React JS',
    code: 'reactjs',
    category: 'Web',
    icon: '⚛️',
    version: 'React 18 (JSX)',
    capability: 'Babel Transpiler + Live Sandboxed Browser Iframe',
    color: 'from-cyan-500/20 to-teal-500/10 border-cyan-500/30 text-cyan-400',
  },
  {
    name: 'React TS',
    code: 'reactts',
    category: 'Web',
    icon: '⚛️',
    version: 'React 18 + TS (TSX)',
    capability: 'Typed Components + Live Interactive Viewport',
    color: 'from-cyan-600/20 to-blue-600/10 border-cyan-600/30 text-cyan-300',
  },
  {
    name: 'HTML',
    code: 'html',
    category: 'Web',
    icon: '🌐',
    version: 'HTML5 Semantic',
    capability: 'Live Browser Rendering + Embedded DOM Console',
    color: 'from-orange-500/20 to-red-500/10 border-orange-500/30 text-orange-400',
  },
  {
    name: 'CSS',
    code: 'css',
    category: 'Web',
    icon: '🎨',
    version: 'CSS3 / Modern Flexbox',
    capability: 'Live Component Preview + Syntax Validation',
    color: 'from-indigo-500/20 to-blue-500/10 border-indigo-500/30 text-indigo-400',
  },
  {
    name: 'Node.js',
    code: 'nodejs',
    category: 'Web',
    icon: '🟢',
    version: 'Node.js Runtime',
    capability: 'Server-side Sandbox + Async & API Handlers',
    color: 'from-emerald-500/20 to-green-500/10 border-emerald-500/30 text-emerald-400',
  },
  {
    name: 'SQL',
    code: 'sql',
    category: 'Database',
    icon: '🗄️',
    version: 'SQLite 3 / Relational',
    capability: 'In-Memory SQLite Sandbox + Pre-Seeded Relational Data',
    color: 'from-purple-500/20 to-indigo-500/10 border-purple-500/30 text-purple-400',
  },
]

export const LandingPage: React.FC = () => {
  const { activateDemoUser } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()

  // Interactive Code Preview state
  const [selectedSampleId, setSelectedSampleId] = useState<string>('python')
  const [activeTab, setActiveTab] = useState<'vuln' | 'fix' | 'output'>('vuln')
  const [copied, setCopied] = useState<boolean>(false)
  const [languageFilter, setLanguageFilter] = useState<'All' | 'Core' | 'Web' | 'Database'>('All')

  const activeSample = DEMO_SAMPLES.find((s) => s.id === selectedSampleId) || DEMO_SAMPLES[0]

  const handleCopyCode = () => {
    const text =
      activeTab === 'vuln'
        ? activeSample.vulnCode
        : activeTab === 'fix'
        ? activeSample.fixCode
        : activeSample.outputPreview
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleScrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleLanguageSelect = (langCode: string) => {
    navigate(`/workspace?lang=${encodeURIComponent(langCode)}`, {
      state: { selectedLanguage: langCode },
    })
  }

  const filteredLanguages =
    languageFilter === 'All'
      ? SUPPORTED_LANGUAGES
      : SUPPORTED_LANGUAGES.filter((l) => l.category === languageFilter)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* 1. Navigation Bar with CodeGuardian AI Logo */}
      <Navbar />

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-14 pb-20 md:pt-20 md:pb-28">
        {/* Ambient Dark Navy, Blue & Purple Glows */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-full max-w-6xl bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.15),transparent_70%)]" />
          <div className="absolute top-1/4 left-1/5 h-80 w-80 rounded-full bg-purple-600/10 blur-3xl" />
          <div className="absolute top-1/3 right-1/5 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Platform Status Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-300 shadow-sm backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Code Review, Auto-Fix & Output Verification Platform</span>
          </div>

          {/* Master Heading: "Write Better Code. Find Bugs Faster." */}
          <h1 className="mt-8 text-4xl font-extrabold tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl">
            Write Better Code.{' '}
            <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 drop-shadow-[0_0_35px_rgba(99,102,241,0.25)]">
              Find Bugs Faster.
            </span>
          </h1>

          {/* Master Supporting Description */}
          <p className="mx-auto mt-6 max-w-3xl text-base text-slate-300 sm:text-lg md:text-xl leading-relaxed">
            Analyze your code, detect errors, fix bugs, and verify program output with CodeGuardian AI.
          </p>

          {/* Two Primary Action Buttons: Start Coding & Explore Features */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {/* Start Coding -> Navigate to existing workspace */}
            <Link
              to="/workspace"
              className="ui-button-lift inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:from-blue-500 hover:to-purple-500 active:scale-95"
            >
              <Terminal className="h-4 w-4 text-blue-200" />
              <span>Start Coding</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            {/* Explore Features -> Smoothly scroll to features section */}
            <button
              type="button"
              onClick={() => handleScrollToSection('features')}
              className="ui-button-lift inline-flex items-center gap-2 rounded-2xl border border-slate-700/80 bg-slate-900/80 px-8 py-4 text-sm font-semibold text-slate-200 shadow-md backdrop-blur-md transition hover:border-slate-600 hover:bg-slate-800/80 hover:text-white active:scale-95 cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span>Explore Features</span>
            </button>
          </div>

          {/* Verified Capabilities Strip */}
          <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4 max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-800/80 bg-slate-900/40 py-2.5 px-3 backdrop-blur-sm">
              <ShieldCheck className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-semibold text-slate-300">150+ AST & Security Rules</span>
            </div>
            <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-800/80 bg-slate-900/40 py-2.5 px-3 backdrop-blur-sm">
              <Zap className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-semibold text-slate-300">&lt; 50ms Real-Time Analysis</span>
            </div>
            <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-800/80 bg-slate-900/40 py-2.5 px-3 backdrop-blur-sm">
              <Server className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-300">Judge0 & SQLite Sandboxes</span>
            </div>
            <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-800/80 bg-slate-900/40 py-2.5 px-3 backdrop-blur-sm">
              <Code2 className="h-4 w-4 text-purple-400" />
              <span className="text-xs font-semibold text-slate-300">12 Polyglot Runtimes</span>
            </div>
          </div>

          {/* Code-Editor-Inspired Product Preview */}
          <div className="mt-16 text-left max-w-5xl mx-auto">
            <div className="relative rounded-3xl border border-slate-800/90 bg-slate-950/90 shadow-2xl overflow-hidden backdrop-blur-xl">
              {/* Window Title Bar */}
              <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 bg-slate-900/70 px-4 py-3 sm:px-6">
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

                {/* Language Selectors */}
                <div className="flex items-center gap-1 overflow-x-auto py-1">
                  {DEMO_SAMPLES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSelectedSampleId(s.id)
                        setActiveTab('vuln')
                      }}
                      className={`rounded-lg px-3 py-1 text-xs font-medium transition cursor-pointer select-none ${
                        selectedSampleId === s.id
                          ? 'bg-blue-600 text-white shadow-sm font-semibold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      {s.lang}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Interactive Kernel
                  </span>
                </div>
              </div>

              {/* Status Header */}
              <div className="flex flex-wrap items-center justify-between border-b border-slate-800/60 bg-slate-950 px-4 py-2 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                  <span className="font-mono text-slate-300">Rule: {activeSample.rule}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded px-2 py-0.5 font-bold text-[10px] ${
                      activeTab === 'fix' || activeTab === 'output'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    Quality Score: {activeTab === 'fix' || activeTab === 'output' ? `${activeSample.fixedScore}/100` : `${activeSample.initialScore}/100`}
                  </span>
                </div>
              </div>

              {/* Preview Body */}
              <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800/80">
                {/* Code View (Left 7 Cols) */}
                <div className="lg:col-span-7 flex flex-col justify-between">
                  {/* Action Mode Tabs */}
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
                        <span>Detected Vulnerability</span>
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
                        <span>AI Auto-Fix Diff</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('output')}
                        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                          activeTab === 'output'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Terminal className="h-3 w-3 text-blue-400" />
                        <span>Sandbox Output</span>
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

                  {/* Code Block Container */}
                  <div className="p-4 sm:p-5 font-mono text-xs overflow-x-auto min-h-[280px]">
                    {activeTab === 'vuln' && (
                      <pre className="text-slate-200 leading-relaxed font-mono">
                        <code>{activeSample.vulnCode}</code>
                      </pre>
                    )}

                    {activeTab === 'fix' && (
                      <div className="space-y-2">
                        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-emerald-300 text-[11px]">
                          <strong>AI Patch Remediation:</strong> {activeSample.fixLineComment}
                        </div>
                        <pre className="text-emerald-300 leading-relaxed font-mono">
                          <code>{activeSample.fixCode}</code>
                        </pre>
                      </div>
                    )}

                    {activeTab === 'output' && (
                      <div className="space-y-2">
                        <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-2.5 text-blue-300 text-[11px]">
                          <strong>Verified Execution Engine:</strong> Real stdout output & test comparison.
                        </div>
                        <pre className="text-sky-300 leading-relaxed font-mono">
                          <code>{activeSample.outputPreview}</code>
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Editor Bottom Meta */}
                  <div className="flex items-center justify-between border-t border-slate-800/60 bg-slate-900/30 px-4 py-2 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Code2 className="h-3 w-3 text-blue-400" />
                      <span>{activeSample.lang} Runtime Active</span>
                    </span>
                    <span className="text-slate-500">Monaco Kernel • Sandboxed</span>
                  </div>
                </div>

                {/* Finding & Diagnostic Panel (Right 5 Cols) */}
                <div className="lg:col-span-5 p-5 flex flex-col justify-between bg-slate-900/30">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-rose-400">
                        <Flame className="h-3 w-3" />
                        <span>{activeSample.severity} Severity</span>
                      </div>
                      <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-400">
                        100% Deterministic Match
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight">
                        {activeSample.title}
                      </h3>
                      <p className="font-mono text-[11px] text-cyan-400 mt-0.5">
                        {activeSample.cwe}
                      </p>
                    </div>

                    {/* Health Impact Gauge */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-medium text-slate-400">Code Health Index</span>
                        <span className="font-bold text-emerald-400">
                          {activeTab === 'fix' || activeTab === 'output' ? `${activeSample.fixedScore}/100 (+56)` : `${activeSample.initialScore}/100 (-58)`}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${
                            activeTab === 'fix' || activeTab === 'output'
                              ? 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                              : 'bg-gradient-to-r from-rose-500 to-amber-500'
                          }`}
                          style={{
                            width: `${activeTab === 'fix' || activeTab === 'output' ? activeSample.fixedScore : activeSample.initialScore}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>Risk Impact: {activeTab === 'fix' || activeTab === 'output' ? '0 pts' : '-58 pts'}</span>
                        <span>Exploitability: {activeTab === 'fix' || activeTab === 'output' ? 'Mitigated' : 'Severe'}</span>
                      </div>
                    </div>

                    {/* Quick Action Button in Card */}
                    <div className="rounded-2xl border border-slate-800/90 bg-slate-950/60 p-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 mb-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                        <span>Remediation Workflow</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mb-3">
                        {activeTab === 'vuln'
                          ? 'Click below to review the AI auto-fix patch and compare side-by-side.'
                          : 'Patch validated against AST security specifications. Ready to test.'}
                      </p>
                      {activeTab === 'vuln' ? (
                        <button
                          onClick={() => setActiveTab('fix')}
                          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-purple-500/20 transition hover:from-purple-500 hover:to-blue-500 cursor-pointer"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>Review AI Auto-Fix Diff</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setActiveTab('output')}
                          className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-500 cursor-pointer"
                        >
                          <Play className="h-3.5 w-3.5 fill-white" />
                          <span>Verify Output in Sandbox</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Direct Link to full workspace */}
                  <div className="mt-5 pt-3 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => handleLanguageSelect(selectedSampleId)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white hover:bg-slate-800 py-2.5 px-4 text-xs font-bold transition shadow-sm group cursor-pointer"
                    >
                      <span>Open Full Code Testing Workspace</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 text-blue-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. SUPPORTED LANGUAGES SECTION */}
      {/* ============================================================== */}
      <section id="languages" className="relative border-t border-slate-900 bg-slate-950 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-semibold text-cyan-400 mb-4">
              <Globe className="h-3.5 w-3.5" />
              <span>Multi-Language Polyglot Ecosystem</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              Supported Programming Languages & Technologies
            </h2>
            <p className="mt-4 text-base text-slate-400">
              Native support for compiling, executing, and analyzing code across modern systems, web frontends, backend runtimes, and databases.
            </p>

            {/* Filter Tabs */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {(['All', 'Core', 'Web', 'Database'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setLanguageFilter(filter)}
                  className={`rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer select-none ${
                    languageFilter === filter
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                      : 'border border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {filter === 'All' ? 'All Languages (12)' : filter}
                </button>
              ))}
            </div>
          </div>

          {/* Languages Grid */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredLanguages.map((lang) => (
              <div
                key={lang.code}
                role="button"
                tabIndex={0}
                onClick={() => handleLanguageSelect(lang.code)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleLanguageSelect(lang.code)
                  }
                }}
                aria-label={`Open ${lang.name} in Code Workspace`}
                className="ui-hover-card rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 backdrop-blur-sm flex flex-col justify-between cursor-pointer group hover:border-blue-500/60 hover:bg-slate-900/80 hover:shadow-xl hover:shadow-blue-500/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl transition-transform duration-200 group-hover:scale-110">{lang.icon}</span>
                    <span className="rounded-full bg-slate-800/80 border border-slate-700/60 px-2 py-0.5 font-mono text-[10px] text-slate-400">
                      {lang.category}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors flex items-center justify-between">
                    <span>{lang.name}</span>
                    <ArrowRight className="h-4 w-4 text-blue-400 opacity-0 -translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0" />
                  </h3>
                  <p className="text-xs font-mono text-blue-400 mt-0.5">{lang.version}</p>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{lang.capability}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-500 group-hover:text-slate-400 transition">Click to Open Editor</span>
                  <span
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 group-hover:text-blue-300 transition"
                  >
                    <span>Test {lang.name}</span>
                    <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. FEATURES SECTION (Cards for error detection, AI fixes, etc.) */}
      {/* ============================================================== */}
      <section id="features" className="relative border-t border-slate-900 bg-slate-950 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-xs font-semibold text-purple-400 mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Full-Stack Code Testing & Debugging Suite</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              Engineered for Complete Code Verification
            </h2>
            <p className="mt-4 text-base text-slate-400">
              From syntax verification and real isolated compilation to AI auto-fix patches and output assertion test suites.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1: Accurate Error & Bug Detection */}
            <div className="ui-hover-card rounded-3xl border border-slate-800/80 bg-slate-900/50 p-7 flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mb-5">
                  <Bug className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Accurate Error & Bug Detection</h3>
                <p className="mt-2.5 text-xs text-slate-400 leading-relaxed">
                  Pinpoint syntax errors, runtime exceptions, logical bugs, and deprecations with exact line-and-column coordinates directly mapped onto Monaco editor markers.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-800/60 font-mono text-[11px] text-rose-400">
                ✓ AST Syntax + Runtime Exception Tracing
              </div>
            </div>

            {/* Feature 2: AI-Assisted Auto-Fixes */}
            <div className="ui-hover-card rounded-3xl border border-slate-800/80 bg-slate-900/50 p-7 flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 mb-5">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white">AI-Assisted Auto-Fixes & Diffs</h3>
                <p className="mt-2.5 text-xs text-slate-400 leading-relaxed">
                  Generate corrected versions of your code with 1-click. Review side-by-side color-coded diff comparisons with full multi-level Undo history backup.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-800/60 font-mono text-[11px] text-purple-400">
                ✓ Side-by-side diffs + Reversible undo stack
              </div>
            </div>

            {/* Feature 3: Real Sandboxed Code Execution */}
            <div className="ui-hover-card rounded-3xl border border-slate-800/80 bg-slate-900/50 p-7 flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-5">
                  <Play className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Sandboxed Code Execution</h3>
                <p className="mt-2.5 text-xs text-slate-400 leading-relaxed">
                  Execute code safely in isolated Judge0 containers or safe in-memory SQLite instances. View real stdout, stderr, execution time, and memory metrics.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-800/60 font-mono text-[11px] text-emerald-400">
                ✓ Isolated Judge0 & SQLite Sandboxes
              </div>
            </div>

            {/* Feature 4: Test Cases & Output Verification */}
            <div className="ui-hover-card rounded-3xl border border-slate-800/80 bg-slate-900/50 p-7 flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-5">
                  <TestTube2 className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Test Cases & Output Verification</h3>
                <p className="mt-2.5 text-xs text-slate-400 leading-relaxed">
                  Define custom test inputs and expected outputs. Automated runners compare program output line-by-line and flag the exact mismatch location.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-800/60 font-mono text-[11px] text-blue-400">
                ✓ Automated Pass/Fail & Line Mismatch Callouts
              </div>
            </div>

            {/* Feature 5: Security & Vulnerability Analysis */}
            <div className="ui-hover-card rounded-3xl border border-slate-800/80 bg-slate-900/50 p-7 flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mb-5">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Security Vulnerability Scanner</h3>
                <p className="mt-2.5 text-xs text-slate-400 leading-relaxed">
                  Detect SQL injection, command execution, path traversal, prototype pollution, and hardcoded secrets using 150+ deterministic Bandit and OWASP rules.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-800/60 font-mono text-[11px] text-cyan-400">
                ✓ 150+ Deterministic AST & Bandit Security Rules
              </div>
            </div>

            {/* Feature 6: Code Quality & Health Score */}
            <div className="ui-hover-card rounded-3xl border border-slate-800/80 bg-slate-900/50 p-7 flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-5">
                  <Award className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Transparent Health & Quality Score</h3>
                <p className="mt-2.5 text-xs text-slate-400 leading-relaxed">
                  No black-box mystery numbers. Scores start at 100 with clear mathematical point deductions for critical, high, and medium defects.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-800/60 font-mono text-[11px] text-indigo-400">
                ✓ Explainable Mathematical Deduction Formula
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 5. HOW IT WORKS SECTION (Write Code -> Analyze -> Fix -> Test) */}
      {/* ============================================================== */}
      <section id="how-it-works" className="relative border-t border-slate-900 bg-slate-950 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold text-blue-400 mb-4">
              <Layers className="h-3.5 w-3.5" />
              <span>Standardized 4-Step Pipeline</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              How CodeGuardian AI Works
            </h2>
            <p className="mt-4 text-base text-slate-400">
              A reliable workflow: Write Code &rarr; Analyze &rarr; Fix &rarr; Test.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Step 1: Write Code */}
            <div className="ui-hover-card rounded-3xl border border-slate-800/80 bg-slate-900/50 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                    <FileCode className="h-5 w-5" />
                  </div>
                  <span className="font-mono text-2xl font-black text-slate-700">01</span>
                </div>
                <h3 className="text-base font-bold text-white">Write or Paste Code</h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Select your language from the searchable selector and write or upload code in Monaco Editor with syntax highlighting.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] font-semibold text-cyan-400">
                Monaco Editor • 12+ Languages
              </div>
            </div>

            {/* Step 2: Analyze */}
            <div className="ui-hover-card rounded-3xl border border-slate-800/80 bg-slate-900/50 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    <Cpu className="h-5 w-5" />
                  </div>
                  <span className="font-mono text-2xl font-black text-slate-700">02</span>
                </div>
                <h3 className="text-base font-bold text-white">Analyze & Scan</h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Click <strong>Analyze Code</strong> to trigger AST parsing, Bandit security audits, syntax error detection, and quality metrics.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] font-semibold text-blue-400">
                Deterministic AST & Security
              </div>
            </div>

            {/* Step 3: Fix */}
            <div className="ui-hover-card rounded-3xl border border-slate-800/80 bg-slate-900/50 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <span className="font-mono text-2xl font-black text-slate-700">03</span>
                </div>
                <h3 className="text-base font-bold text-white">Fix Error with AI</h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Click <strong>Fix Error</strong> to generate corrected code. Review side-by-side diffs, apply them, and revert via Undo if needed.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] font-semibold text-purple-400">
                Unified Diffs • Undo Stack
              </div>
            </div>

            {/* Step 4: Test */}
            <div className="ui-hover-card rounded-3xl border border-slate-800/80 bg-slate-900/50 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <TestTube2 className="h-5 w-5" />
                  </div>
                  <span className="font-mono text-2xl font-black text-slate-700">04</span>
                </div>
                <h3 className="text-base font-bold text-white">Test & Verify Output</h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Click <strong>Run Code</strong> or <strong>Run Tests</strong> to execute in the sandbox and verify real outputs against assertions.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] font-semibold text-emerald-400">
                Sandbox Execution • Assertion Bench
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 6. CALL-TO-ACTION (CTA) SECTION */}
      {/* ============================================================== */}
      <section className="relative overflow-hidden border-t border-slate-900 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-blue-500/15 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Ready to Test and Secure Your Code?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300">
            Open the interactive workspace to write, analyze, execute, and verify your code in seconds.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/workspace"
              className="ui-button-lift inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition hover:from-blue-500 hover:to-purple-500 active:scale-95"
            >
              <Terminal className="h-4 w-4" />
              <span>Start Coding in Workspace</span>
            </Link>

            <Link
              to="/signup"
              className="ui-button-lift inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/90 px-8 py-4 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 hover:text-white active:scale-95"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Create Free Account</span>
            </Link>

            <Link
              to="/docs"
              className="ui-button-lift inline-flex items-center gap-2 rounded-2xl border border-transparent px-6 py-4 text-sm font-semibold text-slate-400 hover:text-slate-200 transition"
            >
              <span>Explore Docs</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Professional Footer with Working Navigation Links */}
      <Footer />
    </div>
  )
}

export default LandingPage
