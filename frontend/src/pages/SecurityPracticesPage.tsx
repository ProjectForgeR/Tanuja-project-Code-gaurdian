import React from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Cpu,
  Server,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Mail,
  Key,
  Layers,
  Terminal,
} from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export const SecurityPracticesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      <Navbar />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        {/* Breadcrumb / Back Link */}
        <div className="mb-6 flex items-center gap-2 text-xs text-slate-400">
          <Link to="/" className="inline-flex items-center gap-1 hover:text-cyan-400 transition">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Home</span>
          </Link>
          <span>/</span>
          <span className="text-slate-200 font-medium">Security Practices</span>
        </div>

        {/* Page Header */}
        <div className="border-b border-slate-800 pb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 mb-4">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Enterprise Security Architecture</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
            Security Practices & Architecture
          </h1>
          <p className="mt-3 text-base text-slate-300 max-w-3xl leading-relaxed">
            CodeGuardian AI was designed from the ground up with defensive security principles. We isolate code execution, enforce strict cryptographic standards, and maintain zero persistence for analyzed source code.
          </p>
          <div className="mt-4 flex items-center gap-4 text-xs font-mono text-slate-400">
            <span>Security Rating: Grade A+</span>
            <span>•</span>
            <span>Audited: October 2026</span>
          </div>
        </div>

        {/* Core Pillars */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 mb-3 border border-blue-500/20">
              <Cpu className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Zero-Execution AST</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Static code analysis parses code structures safely in AST without ever running binary code on host servers.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 mb-3 border border-cyan-500/20">
              <Server className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">gVisor Sandboxes</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Judge0 runtime containers run in lightweight sandboxes with zero host kernel access and no outbound internet egress.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 mb-3 border border-purple-500/20">
              <Lock className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">TLS 1.3 In-Flight</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              All communications between your browser, the API gateway, and backends are encrypted with modern TLS 1.3 ciphers.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 mb-3 border border-emerald-500/20">
              <Key className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Zero Secret Leaks</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              JWTs use HMAC SHA-256 signatures; passwords are salted and hashed with bcrypt; credentials never touch logs.
            </p>
          </div>
        </div>

        {/* Detailed Security Pillars */}
        <div className="mt-12 space-y-10 text-sm leading-relaxed text-slate-300">
          {/* Pillar 1: Static AST Security */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Cpu className="h-5 w-5 text-blue-400" />
              1. Static AST Parsing vs. Unsafe Execution
            </h2>
            <p className="mb-4 text-slate-300">
              The primary engine of CodeGuardian AI operates purely via static lexical analysis and Abstract Syntax Trees. Unlike dynamic profiling tools that require compiling and executing untrusted user code, our engine inspects grammar tokens, control flow paths, and tainted variables without execution.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <span className="font-bold text-emerald-400 block mb-1">✓ Static AST & Polyglot Rules</span>
                <span className="text-slate-400">
                  Parses Python AST, JavaScript/TypeScript AST, and 12+ language grammars in isolated memory buffers without invoking binaries or shell runners.
                </span>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <span className="font-bold text-emerald-400 block mb-1">✓ Built-in Bandit AST Security</span>
                <span className="text-slate-400">
                  Integrated with industry-standard AST security rules (Bandit / Semgrep / ESLint security plugins) to catch CWE-89, CWE-78, CWE-79, and CWE-502.
                </span>
              </div>
            </div>
          </section>

          {/* Pillar 2: Ephemeral Sandbox Execution */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Server className="h-5 w-5 text-cyan-400" />
              2. Isolated Sandbox Execution Hardening
            </h2>
            <p className="mb-4 text-slate-300">
              When users choose to verify code output via the integrated Code Testing Sandbox:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-400">
              <li><strong className="text-slate-200">Network Cutoff (Zero Egress):</strong> Sandboxed containers have network interfaces completely disabled. Programs cannot download external payloads or make outbound HTTP requests.</li>
              <li><strong className="text-slate-200">Strict Resource Quotas:</strong> Hard execution timeouts (5.0 seconds max) and memory ceilings (512MB RAM) prevent denial of service (DoS), fork bombs, and CPU hogging.</li>
              <li><strong className="text-slate-200">Read-Only Root Filesystem:</strong> Temporary directories (`/tmp`) are mounted in RAM (`tmpfs`) and purged immediately upon container teardown.</li>
              <li><strong className="text-slate-200">In-Memory SQLite Sandbox:</strong> Database testing queries run against in-memory SQLite instances (`:memory:`) with zero disk footprint.</li>
            </ul>
          </section>

          {/* Pillar 3: Network & Transport Security */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Lock className="h-5 w-5 text-purple-400" />
              3. Transport Security & Gateway Protections
            </h2>
            <div className="space-y-3 text-slate-300">
              <p>
                Our infrastructure implements rigorous perimeter and transport safeguards:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
                <li><strong className="text-slate-200">TLS 1.3 Everywhere:</strong> Enforced HTTPS with HSTS (HTTP Strict Transport Security) headers.</li>
                <li><strong className="text-slate-200">Gateway Payload Filtering:</strong> All POST requests are limited to 2MB. Requests exceeding this threshold are terminated at the reverse proxy.</li>
                <li><strong className="text-slate-200">CORS Protection:</strong> Cross-Origin Resource Sharing is strictly constrained to authorized domain origins.</li>
                <li><strong className="text-slate-200">Rate Limiting:</strong> Endpoints are protected with token-bucket rate limiters to guard against automated abuse and brute-force attempts.</li>
              </ul>
            </div>
          </section>

          {/* Pillar 4: Vulnerability Disclosure */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-400" />
              4. Responsible Vulnerability Disclosure Program
            </h2>
            <p className="text-slate-400 mb-4">
              We welcome coordinated security vulnerability reports from researchers and our developer community. If you believe you have discovered a security flaw, please contact our security team immediately:
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <div className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white">
                <Mail className="h-4 w-4 text-blue-400" />
                <span>security@codeguardian.ai</span>
              </div>
              <span className="text-xs text-slate-400">PGP Key fingerprint available on request. SLA: Response within 24 hours.</span>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
