import React from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, ShieldAlert, Cpu } from 'lucide-react'

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-900 bg-slate-950 py-12 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <span className="text-base font-bold text-white">
                CodeGuardian<span className="text-blue-400">AI</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              Next-generation automated code review and bug prediction. Protecting software supply chains before deployment.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">Product</h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li><Link to="/workspace" className="transition hover:text-blue-400">Code Analysis</Link></li>
              <li><Link to="/vulnerabilities" className="transition hover:text-blue-400">Vulnerability Explorer</Link></li>
              <li><Link to="/test-generator" className="transition hover:text-blue-400">Unit Test Generator</Link></li>
              <li><Link to="/history" className="transition hover:text-blue-400">Audit History</Link></li>
            </ul>
          </div>

          {/* Technology */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">Intelligence</h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li><Link to="/docs" className="transition hover:text-blue-400">Python AST Parser</Link></li>
              <li><Link to="/docs" className="transition hover:text-blue-400">Bandit Security Checks</Link></li>
              <li><Link to="/docs" className="transition hover:text-blue-400">CodeBERT Embeddings</Link></li>
              <li><Link to="/docs" className="transition hover:text-blue-400">Explainable Severity Scoring</Link></li>
            </ul>
          </div>

          {/* Security Disclaimer */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">Security & Privacy</h4>
            <div className="mt-3 rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-[11px] text-slate-400">
              <div className="mb-1 flex items-center gap-1.5 font-semibold text-slate-200">
                <ShieldAlert className="h-3.5 w-3.5 text-blue-400" />
                Isolated Sandbox Execution
              </div>
              Code is executed in ephemeral, isolated Judge0 containers or safe in-memory SQLite sandboxes with strict resource limits and zero permanent code retention.
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between border-t border-slate-900 pt-6 text-xs sm:flex-row">
          <div>
            &copy; {new Date().getFullYear()} CodeGuardian AI. All rights reserved.
          </div>
          <div className="mt-2 flex gap-6 sm:mt-0">
            <Link to="/docs" className="hover:text-blue-400">Privacy Policy</Link>
            <Link to="/docs" className="hover:text-blue-400">Security Practices</Link>
            <Link to="/docs" className="hover:text-blue-400">API Documentation</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
