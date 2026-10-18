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
      className="language-card w-[280px] sm:w-[320px] shrink-0 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-sm flex flex-col justify-between cursor-pointer group hover:border-blue-500 hover:shadow-lg transition-all duration-200 select-none text-left"
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl transition-transform duration-200 group-hover:scale-110">{lang.icon}</span>
          <span className="rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-blue-700 dark:text-cyan-400">
            {lang.category}
          </span>
        </div>
        <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors flex items-center justify-between">
          <span>{lang.name}</span>
          <ArrowRight className="h-4 w-4 text-blue-600 dark:text-cyan-400 opacity-0 -translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0" />
        </h3>
        <p className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 mt-1">{lang.version}</p>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed font-normal">{lang.capability}</p>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition">Click to Open Editor</span>
        <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-cyan-400 group-hover:text-blue-700 dark:group-hover:text-cyan-300 transition">
          <span>Test {lang.name}</span>
          <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </div>
  )
}

export const LandingPage: React.FC = () => {
  const { activateDemoUser } = useAuth()
  const { theme } = useTheme()
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

  // Ensure enough items in each loop set so that wide screens never run out of cards
  const normalizedLanguages = React.useMemo(() => {
    let list = [...filteredLanguages]
    while (list.length < 8) {
      list = [...list, ...filteredLanguages]
    }
    return list
  }, [filteredLanguages])

  // Continuous smooth auto-scrolling (slow right-to-left marquee)
  useEffect(() => {
    const container = carouselRef.current
    if (!container) return

    // Respect reduced motion preference
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
            // Smooth, slow right-to-left crawl (0.75px per frame)
            container.scrollLeft += 0.75
          }
        }
      }
      animationFrameId = requestAnimationFrame(step)
    }

    animationFrameId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animationFrameId)
  }, [isPlaying, isHovered, normalizedLanguages])

  // Reset scroll when user selects a different category filter
  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = 0
    }
  }, [languageFilter])

  // Manual carousel navigation
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
    <div className="landing-page-root min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* 1. Navigation Bar with CodeGuardian AI Logo */}
      <Navbar />

      {/* 2. Full-Screen Cinematic Hero Section (~100vh on Desktop) */}
      <section className="hero-section relative w-full min-h-[calc(100vh-4rem)] lg:min-h-screen flex flex-col justify-center items-start overflow-hidden px-4 sm:px-6 lg:px-8 py-16 sm:py-24 bg-white dark:bg-slate-950">
        {/* Hero Background Image with Responsive Overlays */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <img
            src="/hero-bg.png"
            alt="Magnifying glass inspecting source code with glowing red cyber bug"
            className="h-full w-full object-cover object-[70%_center] md:object-[65%_center] scale-100 transition-all duration-700"
          />
          {/* Directional gradient overlay: covers only the left side for crisp text, leaving the magnifying glass & bug 100% visible on the right */}
          <div className="absolute inset-y-0 left-0 w-full md:w-[65%] lg:w-[58%] bg-gradient-to-r from-white via-white/85 to-transparent dark:from-slate-950 dark:via-slate-950/85 dark:to-transparent" />
          {/* Subtle top & bottom edge blend */}
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/70 to-transparent dark:from-slate-950/70 dark:to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent dark:from-slate-950 dark:to-transparent" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full z-10">
          <div className="max-w-2xl text-left flex flex-col items-start">
            {/* Master Heading: Build Smarter. Ship Faster. */}
            <h1 className="hero-animate-fade-in hero-delay-1 hero-bright-title mt-4 sm:mt-6 text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-slate-950 dark:text-white leading-[1.08]">
              Build Smarter.{' '}
              <br />
              <span className="hero-bright-gradient text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500">
                Ship Faster.
              </span>
            </h1>

            {/* Description */}
            <p className="hero-animate-fade-in hero-delay-2 hero-bright-desc mt-6 max-w-xl text-base sm:text-lg md:text-xl text-slate-700 dark:text-slate-300 font-normal leading-relaxed">
              Turn ambitious ideas into powerful digital experiences with modern tools, intelligent workflows, and technology built for what comes next.
            </p>

            {/* CTA Buttons on Left Side */}
            <div className="hero-animate-fade-in hero-delay-3 mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-start gap-4 w-full sm:w-auto">
              {/* Primary CTA: Get Started */}
              <Link
                to="/workspace"
                className="ui-button-lift group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              {/* Secondary CTA: Explore Features */}
              <button
                type="button"
                onClick={() => handleScrollToSection('features')}
                className="ui-button-lift w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/80 px-8 py-4 text-sm font-semibold text-slate-800 dark:text-slate-200 shadow-md transition-all duration-200 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-cyan-400 active:scale-[0.98] cursor-pointer"
              >
                <Sparkles className="h-4 w-4 text-blue-600 dark:text-cyan-400" />
                <span>Explore Features</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Live Product Preview */}
      <section className="relative border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Code-Editor-Inspired Product Preview */}
          <div className="text-left max-w-5xl mx-auto">
            <div className="relative rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
              {/* Window Title Bar */}
              <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/90 px-4 py-3 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-rose-400" />
                    <div className="h-3 w-3 rounded-full bg-amber-400" />
                    <div className="h-3 w-3 rounded-full bg-emerald-400" />
                  </div>
                  <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800" />
                  <div className="flex items-center gap-1.5 rounded-lg bg-white dark:bg-slate-900 px-3 py-1 font-mono text-xs font-semibold text-blue-600 dark:text-cyan-400 border border-slate-200 dark:border-slate-800 shadow-sm">
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
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {s.lang}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    Interactive Kernel
                  </span>
                </div>
              </div>

              {/* Status Header */}
              <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 px-4 py-2 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                  <span className="font-mono text-slate-700 dark:text-slate-300">Rule: {activeSample.rule}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded px-2 py-0.5 font-bold text-[10px] ${
                      activeTab === 'fix' || activeTab === 'output'
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    Quality Score: {activeTab === 'fix' || activeTab === 'output' ? `${activeSample.fixedScore}/100` : `${activeSample.initialScore}/100`}
                  </span>
                </div>
              </div>

              {/* Preview Body */}
              <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800/80 bg-white dark:bg-slate-950/50">
                {/* Code View (Left 7 Cols) */}
                <div className="lg:col-span-7 flex flex-col justify-between">
                  {/* Action Mode Tabs */}
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/40 px-4 py-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setActiveTab('vuln')}
                        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                          activeTab === 'vuln'
                            ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        <ShieldAlert className="h-3 w-3 text-rose-500 dark:text-rose-400" />
                        <span>Detected Vulnerability</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('fix')}
                        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                          activeTab === 'fix'
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        <Sparkles className="h-3 w-3 text-emerald-500 dark:text-emerald-400" />
                        <span>AI Auto-Fix Diff</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('output')}
                        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                          activeTab === 'output'
                            ? 'bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        <Terminal className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                        <span>Sandbox Output</span>
                      </button>
                    </div>

                    <button
                      onClick={handleCopyCode}
                      className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition"
                      title="Copy code"
                    >
                      {copied ? <Check className="h-3 w-3 text-emerald-500 dark:text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  {/* Code Block Container */}
                  <div className="p-4 sm:p-5 font-mono text-xs overflow-x-auto min-h-[280px]">
                    {activeTab === 'vuln' && (
                      <pre className="text-slate-800 dark:text-slate-200 leading-relaxed font-mono">
                        <code>{activeSample.vulnCode}</code>
                      </pre>
                    )}

                    {activeTab === 'fix' && (
                      <div className="space-y-2">
                        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-emerald-700 dark:text-emerald-300 text-[11px]">
                          <strong>AI Patch Remediation:</strong> {activeSample.fixLineComment}
                        </div>
                        <pre className="text-emerald-700 dark:text-emerald-300 leading-relaxed font-mono">
                          <code>{activeSample.fixCode}</code>
                        </pre>
                      </div>
                    )}

                    {activeTab === 'output' && (
                      <div className="space-y-2">
                        <div className="rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-500/30 p-2.5 text-blue-700 dark:text-blue-300 text-[11px]">
                          <strong>Verified Execution Engine:</strong> Real stdout output & test comparison.
                        </div>
                        <pre className="text-blue-700 dark:text-sky-300 leading-relaxed font-mono">
                          <code>{activeSample.outputPreview}</code>
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Editor Bottom Meta */}
                  <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/30 px-4 py-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Code2 className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                      <span>{activeSample.lang} Runtime Active</span>
                    </span>
                    <span className="text-slate-400 dark:text-slate-500">Monaco Kernel • Sandboxed</span>
                  </div>
                </div>

                {/* Finding & Diagnostic Panel (Right 5 Cols) */}
                <div className="lg:col-span-5 p-5 flex flex-col justify-between bg-slate-50/60 dark:bg-slate-900/30">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-rose-600 dark:text-rose-400">
                        <Flame className="h-3 w-3" />
                        <span>{activeSample.severity} Severity</span>
                      </div>
                      <span className="rounded bg-slate-200 dark:bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-700 dark:text-slate-400">
                        100% Deterministic Match
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                        {activeSample.title}
                      </h3>
                      <p className="font-mono text-[11px] text-blue-600 dark:text-cyan-400 mt-0.5">
                        {activeSample.cwe}
                      </p>
                    </div>

                    {/* Health Impact Gauge */}
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 p-3.5 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-medium text-slate-600 dark:text-slate-400">Code Health Index</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {activeTab === 'fix' || activeTab === 'output' ? `${activeSample.fixedScore}/100 (+56)` : `${activeSample.initialScore}/100 (-58)`}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
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
      <section id="languages" className="languages-section relative border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-20 sm:py-28 overflow-hidden">
        {/* Background Image with Transparent Overlays */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <img
            src="/languages-bg.png"
            alt="Developer coding on laptop with code on screen"
            className="h-full w-full object-cover object-center scale-100 opacity-25 dark:opacity-45 transition-all duration-700"
          />
          {/* Transparent Gradient Overlays for High Card Contrast & Visual Depth */}
          <div className="absolute inset-0 bg-white/75 dark:bg-slate-950/75" />
          <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white dark:from-slate-950 dark:via-transparent dark:to-slate-950" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10">
          {/* Section Header with Title & Carousel Controls at Top-Right */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl">
                Supported Programming Languages & Technologies
              </h2>
              <p className="mt-4 text-base text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                Native support for compiling, executing, and analyzing code across modern systems, web frontends, backend runtimes, and databases.
              </p>
            </div>

            {/* Carousel Controls (Pause/Play, Left Arrow, Right Arrow) */}
            <div className="carousel-controls-box flex items-center gap-2 self-start md:self-end shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-xl shadow-md">
              <button
                type="button"
                onClick={togglePlayPause}
                aria-label={isPlaying ? 'Pause automatic scrolling' : 'Resume automatic scrolling'}
                title={isPlaying ? 'Pause' : 'Play'}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-cyan-400 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-3.5 w-3.5 text-blue-600 dark:text-cyan-400" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 text-blue-600 dark:text-cyan-400 fill-blue-600 dark:fill-cyan-400" />
                    <span>Play</span>
                  </>
                )}
              </button>

              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

              <button
                type="button"
                onClick={handleScrollLeft}
                aria-label="Scroll carousel to the left"
                title="Scroll Left"
                className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-cyan-400 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4 text-blue-600 dark:text-cyan-400" />
              </button>

              <button
                type="button"
                onClick={handleScrollRight}
                aria-label="Scroll carousel to the right"
                title="Scroll Right"
                className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-cyan-400 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              >
                <ChevronRight className="h-4 w-4 text-blue-600 dark:text-cyan-400" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {(['All', 'Core', 'Web', 'Database'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setLanguageFilter(filter)}
                className={`rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer select-none ${
                  languageFilter === filter
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'filter-tab-inactive border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-cyan-400'
                }`}
              >
                {filter === 'All' ? 'All Languages (12)' : filter}
              </button>
            ))}
          </div>
        </div>

        {/* Single-Line Horizontal Carousel */}
        <div className="relative mt-8 w-full">
          {/* Edge fade overlays */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-white dark:from-slate-950 to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-white dark:from-slate-950 to-transparent z-10" />

          {/* Carousel Track Container */}
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

            {/* Set 3 (buffer for fast arrow navigation / wide viewports) */}
            <div className="flex gap-5 shrink-0 pr-5" aria-hidden="true">
              {normalizedLanguages.map((lang, idx) => (
                <LanguageCard
                  key={`set3-${lang.code}-${idx}`}
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
      {/* 4. FEATURES SECTION (Cards for error detection, AI fixes, etc.) */}
      {/* ============================================================== */}
      <section id="features" className="relative border-t border-slate-900 bg-slate-950 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
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


      {/* 7. Professional Footer with Working Navigation Links */}
      <Footer />
    </div>
  )
}

export default LandingPage
