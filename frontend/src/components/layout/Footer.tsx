import React from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, ShieldAlert, Mail, LifeBuoy, Terminal, Lock } from 'lucide-react'

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-slate-100/90 dark:bg-[#02050e] py-14 text-slate-600 dark:text-slate-400 relative overflow-hidden transition-colors">
      {/* Subtle background ambient line */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(14,165,233,0.06),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(6,182,212,0.08),transparent)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-cyan-500 to-indigo-600 p-[1.5px] shadow-lg shadow-blue-500/20">
                <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
                  <ShieldCheck className="h-4 w-4 text-cyan-400" />
                </div>
              </div>
              <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                CodeGuardian<span className="text-blue-600 dark:text-cyan-400">AI</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              Deterministic AST static analysis and neural code remediation. Detect bugs, prevent outages, and verify outputs across polyglot runtimes.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-blue-600 dark:text-cyan-400 font-mono font-medium">
              <Lock className="h-3 w-3 text-blue-600 dark:text-cyan-400" />
              <span>Zero Permanent Retention</span>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">Product &amp; Tools</h4>
            <ul className="mt-3.5 space-y-2.5 text-xs">
              <li>
                <Link to="/workspace" className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                  <Terminal className="h-3 w-3 text-blue-600 dark:text-cyan-400" />
                  <span>Interactive Workspace</span>
                </Link>
              </li>
              <li>
                <Link to="/vulnerabilities" className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-cyan-300 transition-colors">
                  Vulnerability Explorer
                </Link>
              </li>
              <li>
                <Link to="/test-generator" className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-cyan-300 transition-colors">
                  Unit Test Generator
                </Link>
              </li>
              <li>
                <Link to="/history" className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-cyan-300 transition-colors">
                  Analysis History
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Contact */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">Contact &amp; Support</h4>
            <ul className="mt-3.5 space-y-2.5 text-xs">
              <li>
                <a
                  href="mailto:support@codeguardian.ai"
                  className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-cyan-300 transition-colors"
                >
                  <Mail className="h-3.5 w-3.5 text-blue-600 dark:text-cyan-400" />
                  <span>support@codeguardian.ai</span>
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/ProjectForgeR/Tanuja-project-Code-gaurdian/issues"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-cyan-300 transition-colors"
                >
                  <LifeBuoy className="h-3.5 w-3.5 text-blue-600 dark:text-cyan-400" />
                  <span>Help Center &amp; Issues</span>
                </a>
              </li>
              <li className="pt-1">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10.5px] font-medium text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                  <span>Engine: 100% Operational</span>
                </span>
              </li>
            </ul>
          </div>

          {/* Security & Sandbox */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">Security &amp; Sandboxing</h4>
            <div className="mt-3.5 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 p-3.5 text-[11px] text-slate-600 dark:text-slate-400 backdrop-blur-md shadow-xs">
              <div className="mb-1.5 flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-200">
                <ShieldAlert className="h-3.5 w-3.5 text-blue-600 dark:text-cyan-400" />
                <span>Isolated Execution Sandbox</span>
              </div>
              Code is executed in ephemeral Judge0 containers or safe in-memory environments with strict timeouts, zero network egress, and sanitized memory buffers.
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between border-t border-slate-200 dark:border-slate-800/80 pt-6 text-xs text-slate-500 sm:flex-row">
          <div>
            &copy; {new Date().getFullYear()} CodeGuardian AI. All rights reserved.
          </div>
          <div className="mt-3 flex gap-6 sm:mt-0 font-medium">
            <Link to="/privacy" className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-cyan-300 transition-colors">Privacy Policy</Link>
            <Link to="/security" className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-cyan-300 transition-colors">Security Practices</Link>
            <Link to="/api-docs" className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-cyan-300 transition-colors">API Documentation</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
