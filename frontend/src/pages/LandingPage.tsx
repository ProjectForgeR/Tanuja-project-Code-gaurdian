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
  Pause,
  Check,
  Lock,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  FileText,
  Copy,
  Eye,
  Database,
  Globe,
  Palette,
  Server,
  Atom,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { useAuth } from '@/features/auth/AuthContext'
import { useTheme } from '@/features/theme/ThemeContext'
import { RobotFloatingWidget } from '@/features/robot/RobotFloatingWidget'

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

interface LanguageCardProps {
  lang: (typeof SUPPORTED_LANGUAGES)[0]
  onSelect: (code: string) => void
  isInteractive?: boolean
}

const LanguageCard: React.FC<LanguageCardProps> = ({ lang, onSelect, isInteractive = true }) => {
  return (
    <div
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : -1}
      onClick={() => onSelect(lang.code)}
      onKeyDown={(e) => {
        if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onSelect(lang.code)
        }
      }}
      aria-label={`Open ${lang.name} in Code Workspace`}
      className="cg-card-hover w-[280px] sm:w-[320px] shrink-0 rounded-2xl border border-slate-800 bg-[#0b1021]/90 p-5 shadow-lg flex flex-col justify-between cursor-pointer group hover:border-cyan-400/80 hover:shadow-cyan-500/15 select-none text-left backdrop-blur-md"
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl transition-transform duration-200 group-hover:scale-110">{lang.icon}</span>
          <span className="rounded-full bg-slate-800/80 border border-slate-700/80 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-cyan-400">
            {lang.category}
          </span>
        </div>
        <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center justify-between">
          <span>{lang.name}</span>
          <ArrowRight className="h-4 w-4 text-cyan-400 opacity-0 -translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0" />
        </h3>
        <p className="text-xs font-mono font-semibold text-blue-400 mt-1">{lang.version}</p>
        <p className="text-xs text-slate-300 mt-2.5 leading-relaxed font-normal">{lang.capability}</p>
      </div>

      <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-200 transition">Launch in Editor</span>
        <span className="inline-flex items-center gap-1 text-xs font-bold text-cyan-400 group-hover:text-cyan-300 transition">
          <span>Analyze {lang.name}</span>
          <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </div>
  )
}

export const LandingPage: React.FC = () => {
  const navigate = useNavigate()

  // Interactive Code Preview state
  const [selectedSampleId, setSelectedSampleId] = useState<string>('python')
  const [activeTab, setActiveTab] = useState<'vuln' | 'fix' | 'output'>('vuln')
  const [copied, setCopied] = useState<boolean>(false)
  const [languageFilter, setLanguageFilter] = useState<'All' | 'Core' | 'Web' | 'Database'>('All')

  // Language Carousel state and refs
  const [isPlaying, setIsPlaying] = useState<boolean>(true)
  const [isHovered, setIsHovered] = useState<boolean>(false)
  const carouselRef = useRef<HTMLDivElement>(null)
  const set1Ref = useRef<HTMLDivElement>(null)
  const set2Ref = useRef<HTMLDivElement>(null)

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

  const normalizedLanguages = React.useMemo(() => {
    let list = [...filteredLanguages]
    while (list.length < 8) {
      list = [...list, ...filteredLanguages]
    }
    return list
  }, [filteredLanguages])

  useEffect(() => {
    const container = carouselRef.current
    if (!container) return

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mediaQuery.matches) return

    let animationFrameId: number

    const step = () => {
      if (isPlaying && !isHovered && container && set1Ref.current && set2Ref.current) {
        const loopDistance = set2Ref.current.offsetLeft - set1Ref.current.offsetLeft
        if (loopDistance > 0) {
          if (container.scrollLeft >= loopDistance * 2) {
            container.scrollLeft -= loopDistance
          } else {
            container.scrollLeft += 0.75
          }
        }
      }
      animationFrameId = requestAnimationFrame(step)
    }

    animationFrameId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animationFrameId)
  }, [isPlaying, isHovered, normalizedLanguages])

  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = 0
    }
  }, [languageFilter])

  const handleScrollLeft = () => {
    const container = carouselRef.current
    if (!container || !set1Ref.current || !set2Ref.current) return
    const loopDistance = set2Ref.current.offsetLeft - set1Ref.current.offsetLeft
    if (loopDistance > 0 && container.scrollLeft <= 40) {
      container.scrollLeft += loopDistance
    }
    container.scrollBy({ left: -340, behavior: 'smooth' })
  }

  const handleScrollRight = () => {
    const container = carouselRef.current
    if (!container || !set1Ref.current || !set2Ref.current) return
    const loopDistance = set2Ref.current.offsetLeft - set1Ref.current.offsetLeft
    if (loopDistance > 0 && container.scrollLeft >= loopDistance * 2 - 400) {
      container.scrollLeft -= loopDistance
    }
    container.scrollBy({ left: 340, behavior: 'smooth' })
  }

  const togglePlayPause = () => {
    setIsPlaying((prev) => !prev)
  }

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col relative overflow-hidden selection:bg-cyan-500 selection:text-slate-950">
      {/* ============================================================== */}
      {/* 0. CODING BACKGROUND: AMBIENT GLOWS, CYBER MESH & CODE TOKENS  */}
      {/* ============================================================== */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" aria-hidden="true">
        {/* Subtle Cyber Grid Pattern */}
        <div className="absolute inset-0 cyber-grid-pattern opacity-60" />

        {/* Ambient Radial Lights */}
        <div className="absolute -top-32 left-1/4 h-[550px] w-[550px] rounded-full radial-glow-blue blur-3xl opacity-50" />
        <div className="absolute top-1/3 -right-20 h-[600px] w-[600px] rounded-full radial-glow-cyan blur-3xl opacity-40" />
        <div className="absolute top-2/3 left-10 h-[500px] w-[500px] rounded-full radial-glow-purple blur-3xl opacity-30" />

        {/* Floating Code & Syntax Fragments */}
        <div className="absolute top-24 left-[8%] font-mono text-xs font-bold text-cyan-400/15 animate-syntax-1 select-none">
          {`const audit = analyze(AST);`}
        </div>
        <div className="absolute top-36 right-[12%] font-mono text-sm font-bold text-blue-400/20 animate-syntax-2 select-none">
          {`{ CWE-89: "SQL_INJECTION" }`}
        </div>
        <div className="absolute top-96 left-[18%] font-mono text-xs text-purple-400/20 animate-syntax-3 select-none">
          {`try { sandbox.run(); } catch (err)`}
        </div>
        <div className="absolute top-[480px] right-[6%] font-mono text-xs text-cyan-300/15 animate-syntax-1 select-none">
          {`function patch(diff) => CleanCode`}
        </div>
        <div className="absolute top-[800px] left-[5%] font-mono text-xs text-blue-300/15 animate-syntax-2 select-none">
          {`[PASS] 21/21 security assertions ok`}
        </div>
        <div className="absolute top-[1200px] right-[15%] font-mono text-sm text-cyan-500/15 animate-syntax-3 select-none">
          {`</> deterministic-ast-scanner`}
        </div>
      </div>

      {/* 1. Modern Glassmorphic Navigation Bar */}
      <Navbar />

      {/* ============================================================== */}
      {/* 2. HERO SECTION: CODING CYBERSECURITY REDESIGN                  */}
      {/* ============================================================== */}
      <section className="relative z-10 w-full min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
            {/* Left Column: Headline, Description & Interactive CTAs */}
            <div className="lg:col-span-6 flex flex-col items-start text-left">
              {/* Badge: AI-Powered Code Security */}
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3.5 py-1.5 text-xs font-bold text-cyan-300 mb-6 backdrop-blur-xl shadow-lg shadow-cyan-950/50">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400" />
                </span>
                <span className="font-mono tracking-wider uppercase text-[11px]">
                  AI-Powered Code Security
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-300 font-sans font-medium">GuardianBot Active</span>
              </div>

              {/* Main Heading: Write Better Code. Ship With Confidence. */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1] max-w-2xl">
                Write{' '}
                <span className="gradient-text-cyan-blue">Better Code.</span>
                <br />
                Ship With{' '}
                <span className="gradient-text-cyan-blue">Confidence.</span>
              </h1>

              {/* Subtitle / Description */}
              <p className="mt-6 text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-xl">
                CodeGuardian AI detects bugs, explains runtime errors, audits security vulnerabilities (OWASP &amp; CWE), and applies verified one-click patches across 12+ polyglot languages.
              </p>

              {/* Primary & Secondary Action Buttons with Floating Hover */}
              <div className="mt-8 sm:mt-10 flex flex-wrap items-center gap-4 w-full sm:w-auto">
                {/* Primary CTA: Start Analyzing Code */}
                <button
                  type="button"
                  onClick={() => navigate('/workspace')}
                  className="cg-btn-primary px-7 py-3.5 text-sm sm:text-base group"
                >
                  <span>Start Analyzing Code</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>

                {/* Secondary CTA: Explore Features */}
                <button
                  type="button"
                  onClick={() => handleScrollToSection('features')}
                  className="cg-btn-secondary px-6 py-3.5 text-sm sm:text-base group"
                >
                  <Sparkles className="h-4 w-4 text-cyan-400 group-hover:rotate-12 transition-transform" />
                  <span>Explore Features</span>
                </button>
              </div>

              {/* Trust Indicators / Verified Capability Badges */}
              <div className="mt-10 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-xl">
                <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
                  <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span>12+ Runtimes</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
                  <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span>150+ AST Rules</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
                  <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span>Judge0 Sandbox</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
                  <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span>Neural Fixes</span>
                </div>
              </div>
            </div>

            {/* Right Column: Terminal Window with GuardianBot 3D Video & Code Diagnostics */}
            <div className="lg:col-span-6 w-full flex items-center justify-center">
              <div className="relative w-full max-w-lg lg:max-w-none">
                {/* Ambient drop shadow & cyan glow */}
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-600/30 via-cyan-500/30 to-purple-600/30 blur-2xl opacity-70" />

                {/* Window Mock Container */}
                <div className="relative rounded-3xl border border-cyan-500/25 bg-[#0a0f1e]/95 shadow-2xl overflow-hidden backdrop-blur-2xl">
                  {/* Top Window Bar */}
                  <div className="flex items-center justify-between px-4 py-3 bg-[#0d1428] border-b border-slate-800/90 gap-2">
                    {/* Traffic light control dots */}
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-rose-500/90 shadow-sm" />
                      <div className="h-3 w-3 rounded-full bg-amber-400/90 shadow-sm" />
                      <div className="h-3 w-3 rounded-full bg-emerald-500/90 shadow-sm" />
                    </div>

                    {/* Window Center Title */}
                    <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-[#060b18] border border-slate-800 text-xs font-mono text-slate-300">
                      <Terminal className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Code Inspection &amp; Bug Predictor</span>
                    </div>

                    {/* Right Live Status Badge */}
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="hidden sm:inline">Active Scanner</span>
                    </div>
                  </div>

                  {/* Window Content: 2nd Image (Magnifying Glass Inspecting Code Error) */}
                  <div className="relative aspect-[4/3] sm:aspect-[16/11] bg-[#020612] overflow-hidden flex items-center justify-center group">
                    <img
                      src="/hero-preview.jpg"
                      alt="Code debugging failure test suite under magnifying glass inspection"
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 select-none"
                    />

                    {/* Moving Scanline effect */}
                    <div className="pointer-events-none absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent animate-scanline" />

                    {/* Ambient Bottom Overlay */}
                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-[#02050e] via-[#02050e]/80 to-transparent flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                        </span>
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-2 font-mono">
                            <span>FAIL src/utils/eq</span>
                            <span className="rounded bg-rose-500/20 border border-rose-500/40 px-2 py-0.2 text-[9px] font-bold text-rose-300">
                              Assertion Mismatch
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-300">
                            Neural bug detector flagging logic regression under magnification
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => navigate('/workspace')}
                        className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-3.5 py-1.5 text-xs font-bold shadow-md shadow-cyan-500/30 transition cursor-pointer"
                      >
                        <span>Try Live</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. INTERACTIVE CODE SCANNER & DIFF COMPARISON SECTION           */}
      {/* ============================================================== */}
      <section className="relative z-10 border-t border-slate-800/80 bg-[#040916]/80 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
              Instant Vulnerability Pinpointing &amp; Auto-Fix
            </h2>
            <p className="mt-4 text-base text-slate-300 leading-relaxed">
              Compare vulnerable source code with verified AI-generated patches and real sandboxed stdout execution outputs.
            </p>
          </div>

          {/* Interactive Code Preview Window */}
          <div className="max-w-5xl mx-auto rounded-3xl border border-slate-800 bg-[#080e1e]/90 shadow-2xl overflow-hidden backdrop-blur-xl">
            {/* Window Title Bar */}
            <div className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-[#0a1124] px-4 py-3 sm:px-6 gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                  <div className="h-3 w-3 rounded-full bg-amber-400/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="h-4 w-px bg-slate-800" />
                <div className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1 font-mono text-xs font-semibold text-cyan-400 border border-slate-800">
                  <FileCode className="h-3.5 w-3.5" />
                  <span>{activeSample.filename}</span>
                </div>
              </div>

              {/* Language Switchers */}
              <div className="flex items-center gap-1 bg-[#050914] p-1 rounded-xl border border-slate-800 overflow-x-auto">
                {DEMO_SAMPLES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedSampleId(s.id)
                      setActiveTab('vuln')
                    }}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold transition cursor-pointer select-none ${
                      selectedSampleId === s.id
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    {s.lang}
                  </button>
                ))}
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                <span>Deterministic Match</span>
              </span>
            </div>

            {/* Sub-header with Rule & Severity */}
            <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 bg-[#060b18] px-4 py-2.5 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="font-mono text-slate-300">Security Rule: {activeSample.rule}</span>
              </div>
              <span
                className={`rounded-lg px-2.5 py-0.5 font-bold text-xs ${
                  activeTab === 'fix' || activeTab === 'output'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                Quality Score: {activeTab === 'fix' || activeTab === 'output' ? `${activeSample.fixedScore}/100 (+56)` : `${activeSample.initialScore}/100`}
              </span>
            </div>

            {/* Preview Body */}
            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800 bg-[#070c1a]">
              {/* Code View (Left 7 Cols) */}
              <div className="lg:col-span-7 flex flex-col justify-between">
                {/* Action Mode Tabs */}
                <div className="flex items-center justify-between border-b border-slate-800/80 bg-[#090f20] px-4 py-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setActiveTab('vuln')}
                      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                        activeTab === 'vuln'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
                      <span>Detected Vulnerability</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('fix')}
                      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                        activeTab === 'fix'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                      <span>AI Auto-Fix Diff</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('output')}
                      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                        activeTab === 'output'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Terminal className="h-3.5 w-3.5 text-blue-400" />
                      <span>Sandbox Output</span>
                    </button>
                  </div>

                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition cursor-pointer"
                    title="Copy code"
                  >
                    {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* Code Block Container */}
                <div className="p-4 sm:p-5 font-mono text-xs overflow-x-auto min-h-[300px]">
                  {activeTab === 'vuln' && (
                    <pre className="text-slate-200 leading-relaxed font-mono">
                      <code>{activeSample.vulnCode}</code>
                    </pre>
                  )}

                  {activeTab === 'fix' && (
                    <div className="space-y-2.5">
                      <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-emerald-300 text-[11px]">
                        <strong>AI Patch Remediation:</strong> {activeSample.fixLineComment}
                      </div>
                      <pre className="text-emerald-300 leading-relaxed font-mono">
                        <code>{activeSample.fixCode}</code>
                      </pre>
                    </div>
                  )}

                  {activeTab === 'output' && (
                    <div className="space-y-2.5">
                      <div className="rounded-xl bg-blue-500/10 border border-blue-500/30 p-2.5 text-blue-300 text-[11px]">
                        <strong>Verified Execution Engine:</strong> Real Judge0 stdout output &amp; assertion check.
                      </div>
                      <pre className="text-sky-300 leading-relaxed font-mono">
                        <code>{activeSample.outputPreview}</code>
                      </pre>
                    </div>
                  )}
                </div>

                {/* Editor Bottom Status Bar */}
                <div className="flex items-center justify-between border-t border-slate-800 bg-[#060a16] px-4 py-2 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Code2 className="h-3.5 w-3.5 text-cyan-400" />
                    <span>{activeSample.lang} Runtime Active</span>
                  </span>
                  <span className="font-mono text-slate-400">Isolated Sandbox • Zero Retention</span>
                </div>
              </div>

              {/* Finding & Diagnostic Panel (Right 5 Cols) */}
              <div className="lg:col-span-5 p-5 sm:p-6 flex flex-col justify-between bg-[#080d1c]">
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/15 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-rose-400">
                      <Flame className="h-3.5 w-3.5" />
                      <span>{activeSample.severity} Severity</span>
                    </div>
                    <span className="rounded bg-slate-800/80 border border-slate-700/80 px-2 py-0.5 font-mono text-[10px] text-slate-300">
                      CWE Identified
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      {activeSample.title}
                    </h3>
                    <p className="font-mono text-[11px] text-cyan-400 mt-1">
                      {activeSample.cwe}
                    </p>
                  </div>

                  {/* Health Impact Gauge */}
                  <div className="rounded-2xl border border-slate-800 bg-[#040814] p-4 space-y-2.5 shadow-inner">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-300">Code Health Index</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {activeTab === 'fix' || activeTab === 'output' ? `${activeSample.fixedScore}/100 (+56)` : `${activeSample.initialScore}/100`}
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
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>Status: {activeTab === 'fix' || activeTab === 'output' ? 'Remediated' : 'Exploitable'}</span>
                      <span>Security: {activeTab === 'fix' || activeTab === 'output' ? 'Passed' : 'Action Required'}</span>
                    </div>
                  </div>

                  {/* Quick Action Button */}
                  <div className="rounded-2xl border border-slate-800 bg-[#050a17] p-3.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 mb-1">
                      <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                      <span>AI Patch Remediation</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mb-3">
                      {activeTab === 'vuln'
                        ? 'Click below to review side-by-side patch diff generated by CodeGuardian AI.'
                        : 'Patch validated against AST security specifications. Ready to test.'}
                    </p>
                    {activeTab === 'vuln' ? (
                      <button
                        onClick={() => setActiveTab('fix')}
                        className="cg-btn-ai w-full py-2.5 text-xs"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Review AI Auto-Fix Diff</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setActiveTab('output')}
                        className="cg-btn-primary w-full py-2.5 text-xs"
                      >
                        <Play className="h-3.5 w-3.5 fill-white" />
                        <span>Verify Output in Sandbox</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Direct Link to full workspace */}
                <div className="mt-5 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleLanguageSelect(selectedSampleId)}
                    className="w-full cg-btn-secondary py-2.5 px-4 text-xs font-bold"
                  >
                    <span>Open in Full Code Testing Workspace</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. SUPPORTED PROGRAMMING LANGUAGES SECTION                     */}
      {/* ============================================================== */}
      <section id="languages" className="relative z-10 border-t border-slate-800/80 bg-[#030712] py-20 sm:py-28 overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-10">
            <div className="max-w-2xl">
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
                12+ Supported Programming Languages &amp; Frameworks
              </h2>
              <p className="mt-4 text-base text-slate-300 font-normal leading-relaxed">
                Native support for compiling, executing, and diagnosing code across modern systems, web frontends, backend microservices, and databases.
              </p>

              {/* Filter Tabs */}
              <div className="mt-6 flex flex-wrap items-center gap-2">
                {(['All', 'Core', 'Web', 'Database'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setLanguageFilter(filter)}
                    className={`rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer select-none ${
                      languageFilter === filter
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-cyan-500/20'
                        : 'border border-slate-800 bg-[#080d1a] text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300'
                    }`}
                  >
                    {filter === 'All' ? 'All Languages (12)' : filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Inset Image Card & Carousel Controls */}
            <div className="flex flex-col items-start lg:items-end gap-3 shrink-0 w-full lg:w-auto">
              <div className="group relative overflow-hidden rounded-3xl border border-slate-800 bg-[#0a0f1e] shadow-xl w-full sm:w-[460px] md:w-[500px] lg:w-[520px] h-56 sm:h-64">
                <img
                  src="/languages-preview.jpg"
                  alt="Code execution and compiler diagnostics preview"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 select-none"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-transparent" />
                <div className="absolute bottom-3.5 left-4 right-4 flex items-center justify-between text-xs font-semibold text-white">
                  <span className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-cyan-500/30 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                    Live Compiler Engine
                  </span>
                  <span className="bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 px-3 py-1.5 rounded-xl font-mono">
                    12 Polyglot Runtimes
                  </span>
                </div>
              </div>

              {/* Carousel Controls */}
              <div className="flex items-center gap-2 bg-[#080d1a] border border-slate-800 p-2 rounded-2xl shadow-sm">
                <button
                  type="button"
                  onClick={togglePlayPause}
                  aria-label={isPlaying ? 'Pause auto-scroll' : 'Resume auto-scroll'}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-cyan-400 bg-slate-900 border border-slate-700/80 transition cursor-pointer"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5 text-cyan-400 fill-cyan-400" />
                      <span>Play</span>
                    </>
                  )}
                </button>

                <div className="h-4 w-px bg-slate-800" />

                <button
                  type="button"
                  onClick={handleScrollLeft}
                  aria-label="Scroll left"
                  className="p-1.5 rounded-xl text-slate-300 hover:text-cyan-400 bg-slate-900 border border-slate-700/80 transition cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={handleScrollRight}
                  aria-label="Scroll right"
                  className="p-1.5 rounded-xl text-slate-300 hover:text-cyan-400 bg-slate-900 border border-slate-700/80 transition cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Continuous Horizontal Carousel */}
        <div className="relative mt-4 w-full">
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-20 bg-gradient-to-r from-[#030712] to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-20 bg-gradient-to-l from-[#030712] to-transparent z-10" />

          <div
            ref={carouselRef}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={() => setIsHovered(true)}
            onTouchEnd={() => setIsHovered(false)}
            tabIndex={0}
            role="region"
            aria-label="Supported programming languages carousel"
            className="flex overflow-x-auto scrollbar-none py-4 px-4 sm:px-6 focus:outline-none"
          >
            {/* Set 1 */}
            <div ref={set1Ref} className="flex gap-5 shrink-0 pr-5">
              {normalizedLanguages.map((lang, idx) => (
                <LanguageCard
                  key={`set1-${lang.code}-${idx}`}
                  lang={lang}
                  onSelect={handleLanguageSelect}
                />
              ))}
            </div>

            {/* Set 2 (for continuous seamless looping) */}
            <div ref={set2Ref} className="flex gap-5 shrink-0 pr-5" aria-hidden="true">
              {normalizedLanguages.map((lang, idx) => (
                <LanguageCard
                  key={`set2-${lang.code}-${idx}`}
                  lang={lang}
                  onSelect={handleLanguageSelect}
                  isInteractive={false}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 5. SECURITY FEATURES & VISUAL ERROR DEMOS (PROMPT 4 & 10)       */}
      {/* ============================================================== */}
      <section id="features" className="relative z-10 border-t border-slate-800/80 bg-[#040815]/90 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
              From Vulnerability Detection to Production Peace of Mind
            </h2>
            <p className="mt-4 text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Explore how CodeGuardian AI inspects your code, flags hidden threats, and verifies clean execution before you commit.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1: Real-Time Security Threat Alerts */}
            <div className="cg-card-hover rounded-3xl border border-slate-800 bg-[#090f20]/80 p-6 flex flex-col justify-between backdrop-blur-xl">
              <div>
                <div className="overflow-hidden rounded-2xl bg-[#030612] aspect-[16/10] border border-slate-800/80 relative group">
                  <img
                    src="/security-threats.jpg"
                    alt="Real-Time Security Threat Alerts"
                    className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#090f20] via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 bg-rose-500/90 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-md">
                    CWE-89 / OWASP TOP 10
                  </div>
                </div>
                <div className="mt-6">
                  <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                    Real-Time Security Threat Alerts
                  </h3>
                  <p className="mt-2.5 text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Identify injection vectors, weak cryptographic ciphers, and unvalidated inputs directly within your active workspace before commit.
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold">
                <span className="border border-rose-500/30 bg-rose-500/10 text-rose-300 px-2.5 py-1 rounded-lg">
                  150+ Bandit &amp; OWASP Rules
                </span>
                <span className="border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 px-2.5 py-1 rounded-lg">
                  Zero Server Retained
                </span>
              </div>
            </div>

            {/* Card 2: Multi-Language AST Diagnostics */}
            <div className="cg-card-hover rounded-3xl border border-slate-800 bg-[#090f20]/80 p-6 flex flex-col justify-between backdrop-blur-xl">
              <div>
                <div className="overflow-hidden rounded-2xl bg-[#030612] aspect-[16/10] border border-slate-800/80 relative group">
                  <img
                    src="/ast-diagnostics.jpg"
                    alt="Multi-Language AST Diagnostics"
                    className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#090f20] via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 bg-blue-600/90 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-md">
                    SUB-SECOND PARSING
                  </div>
                </div>
                <div className="mt-6">
                  <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                    Multi-Language AST Diagnostics
                  </h3>
                  <p className="mt-2.5 text-xs sm:text-sm text-slate-300 leading-relaxed">
                    High-performance static parsing across Python, JavaScript, TypeScript, Java, C, C++, and SQL with instant editor squiggly markers.
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold">
                <span className="border border-blue-500/30 bg-blue-500/10 text-blue-300 px-2.5 py-1 rounded-lg">
                  Deterministic AST
                </span>
                <span className="border border-purple-500/30 bg-purple-500/10 text-purple-300 px-2.5 py-1 rounded-lg">
                  Polyglot Engine
                </span>
              </div>
            </div>

            {/* Card 3: Prevent Costly Outages & 404s */}
            <div className="cg-card-hover rounded-3xl border border-slate-800 bg-[#090f20]/80 p-6 flex flex-col justify-between backdrop-blur-xl">
              <div>
                <div className="overflow-hidden rounded-2xl bg-[#030612] aspect-[16/10] border border-slate-800/80 relative group">
                  <img
                    src="/prevent-outages.jpg"
                    alt="Prevent Costly Outages & 404s"
                    className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#090f20] via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 bg-emerald-600/90 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-md">
                    REGRESSION GUARD
                  </div>
                </div>
                <div className="mt-6">
                  <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                    Automated Test Generation &amp; Guard
                  </h3>
                  <p className="mt-2.5 text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Automated unit test generation (pytest, Jest, JUnit) covers malicious inputs, edge cases, and type violations to eliminate surprises.
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold">
                <span className="border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 px-2.5 py-1 rounded-lg">
                  Automated Test Suites
                </span>
                <span className="border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 px-2.5 py-1 rounded-lg">
                  Sandbox Verified
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 6. HOW IT WORKS SECTION (Write Code -> Analyze -> Fix -> Test)  */}
      {/* ============================================================== */}
      <section id="how-it-works" className="relative z-10 border-t border-slate-800/80 bg-[#030712] py-20 sm:py-28 overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
              How CodeGuardian AI Works
            </h2>
            <p className="mt-4 text-base text-slate-300 leading-relaxed">
              A seamless, developer-friendly 4-step workflow: Write Code &rarr; Analyze &rarr; Fix &rarr; Test.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Step 1: Write Code */}
            <div className="cg-card-hover rounded-3xl border border-slate-800 bg-[#090f20]/90 p-6 flex flex-col justify-between backdrop-blur-xl group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shadow-md shadow-cyan-500/10 group-hover:scale-105 transition-transform">
                    <FileCode className="h-6 w-6" />
                  </div>
                  <span className="font-mono text-3xl font-black text-slate-700 group-hover:text-cyan-400 transition-colors">01</span>
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">Write or Paste Code</h3>
                <p className="mt-2.5 text-xs text-slate-300 leading-relaxed font-normal">
                  Select your runtime from 12+ supported languages. Upload or edit code with Monaco Editor and syntax highlighting.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-800 text-[11px] font-semibold text-cyan-400 flex items-center justify-between">
                <span>Monaco Editor</span>
                <span className="text-slate-400">12+ Runtimes</span>
              </div>
            </div>

            {/* Step 2: Analyze */}
            <div className="cg-card-hover rounded-3xl border border-slate-800 bg-[#090f20]/90 p-6 flex flex-col justify-between backdrop-blur-xl group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-400 shadow-md shadow-blue-500/10 group-hover:scale-105 transition-transform">
                    <Cpu className="h-6 w-6" />
                  </div>
                  <span className="font-mono text-3xl font-black text-slate-700 group-hover:text-blue-400 transition-colors">02</span>
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">Analyze &amp; Scan</h3>
                <p className="mt-2.5 text-xs text-slate-300 leading-relaxed font-normal">
                  Click <strong className="text-white font-semibold">Analyze Code</strong> to trigger deterministic AST parsing, Bandit security audits, and quality scoring.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-800 text-[11px] font-semibold text-blue-400 flex items-center justify-between">
                <span>Deterministic AST</span>
                <span className="text-slate-400">Security &amp; Bugs</span>
              </div>
            </div>

            {/* Step 3: Fix */}
            <div className="cg-card-hover rounded-3xl border border-slate-800 bg-[#090f20]/90 p-6 flex flex-col justify-between backdrop-blur-xl group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 shadow-md shadow-purple-500/10 group-hover:scale-105 transition-transform">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <span className="font-mono text-3xl font-black text-slate-700 group-hover:text-purple-400 transition-colors">03</span>
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">Fix Error with AI</h3>
                <p className="mt-2.5 text-xs text-slate-300 leading-relaxed font-normal">
                  Click <strong className="text-white font-semibold">Fix Error</strong> to generate corrected patches. Review side-by-side diffs and revert via Undo if needed.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-800 text-[11px] font-semibold text-purple-400 flex items-center justify-between">
                <span>Unified Diffs</span>
                <span className="text-slate-400">Undo Stack</span>
              </div>
            </div>

            {/* Step 4: Test */}
            <div className="cg-card-hover rounded-3xl border border-slate-800 bg-[#090f20]/90 p-6 flex flex-col justify-between backdrop-blur-xl group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-md shadow-emerald-500/10 group-hover:scale-105 transition-transform">
                    <TestTube2 className="h-6 w-6" />
                  </div>
                  <span className="font-mono text-3xl font-black text-slate-700 group-hover:text-emerald-400 transition-colors">04</span>
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">Test &amp; Verify Output</h3>
                <p className="mt-2.5 text-xs text-slate-300 leading-relaxed font-normal">
                  Click <strong className="text-white font-semibold">Run Code</strong> or <strong className="text-white font-semibold">Run Tests</strong> to execute in Judge0 sandboxes and verify stdout against assertions.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-800 text-[11px] font-semibold text-emerald-400 flex items-center justify-between">
                <span>Judge0 Sandbox</span>
                <span className="text-slate-400">Assertion Bench</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Cybersecurity Footer */}
      <Footer />

      {/* 9. CodeGuardian AI Animated Robot Assistant Mascot & Speech Bubble */}
      <RobotFloatingWidget />
    </div>
  )
}

export default LandingPage
