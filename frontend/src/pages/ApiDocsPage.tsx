import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Terminal,
  Code2,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  Server,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Layers,
} from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

interface Endpoint {
  method: 'POST' | 'GET'
  path: string
  title: string
  description: string
  headers: Record<string, string>
  requestBody?: string
  responseBody: string
}

const ENDPOINTS: Endpoint[] = [
  {
    method: 'POST',
    path: '/api/analyses/analyze',
    title: 'Analyze Code for Vulnerabilities & Defects',
    description: 'Executes static AST scanning, rule checks (Bandit / Polyglot), and defect prediction. Returns quality score, CWE findings, and severity breakdown.',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer <YOUR_API_TOKEN>',
    },
    requestBody: JSON.stringify(
      {
        code: 'def query_user(id):\n    # Sensitive SQL query\n    cursor.execute(f"SELECT * FROM users WHERE id = \'{id}\'")',
        language: 'python',
        enable_ai: true,
      },
      null,
      2
    ),
    responseBody: JSON.stringify(
      {
        id: '9f21a48c-7f51-4091-bf91-314dfa77e02b',
        overall_score: 42,
        metrics: {
          cyclomatic_complexity: 2.1,
          maintainability_index: 68.4,
          lines_of_code: 4,
        },
        findings: [
          {
            id: 'find-01',
            title: 'SQL Injection via Dynamic Query Formatting',
            severity: 'Critical',
            category: 'Security',
            cwe: 'CWE-89',
            line_start: 3,
            line_end: 3,
            explanation: 'Direct string interpolation inside SQL query allows malicious attackers to bypass authentication.',
            recommended_fix: 'Use parameterized queries: cursor.execute("SELECT * FROM users WHERE id = ?", (id,))',
          },
        ],
        summary: '1 Critical finding detected. Risk level: High.',
      },
      null,
      2
    ),
  },
  {
    method: 'POST',
    path: '/api/analyses/fix/suggest',
    title: 'Generate AI Remediation Patch Diff',
    description: 'Generates a unified diff patch, safety evaluation, and test recommendations for a specific security finding.',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer <YOUR_API_TOKEN>',
    },
    requestBody: JSON.stringify(
      {
        code: 'def query_user(id):\n    cursor.execute(f"SELECT * FROM users WHERE id = \'{id}\'")',
        finding_id: 'find-01',
        language: 'python',
      },
      null,
      2
    ),
    responseBody: JSON.stringify(
      {
        patch_diff: '--- a/calculator.py\n+++ b/calculator.py\n@@ -3,1 +3,1 @@\n-    cursor.execute(f"SELECT * FROM users WHERE id = \'{id}\'")\n+    cursor.execute("SELECT * FROM users WHERE id = ?", (id,))',
        explanation: 'Replaced dynamic string formatting with parameterized DB-API cursor placeholder binding to prevent arbitrary SQL injection.',
        safety_assessment: 'Verified: No breaking API interface changes detected.',
        confidence: 0.98,
      },
      null,
      2
    ),
  },
  {
    method: 'POST',
    path: '/api/analyses/tests/generate',
    title: 'Synthesize Automated Unit Test Suites',
    description: 'Synthesizes targeted test suites covering normal happy-paths, boundary edge cases, security regressions, and invalid inputs.',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer <YOUR_API_TOKEN>',
    },
    requestBody: JSON.stringify(
      {
        code: 'def add(a: int, b: int) -> int:\n    return a + b',
        language: 'python',
        framework: 'pytest',
      },
      null,
      2
    ),
    responseBody: JSON.stringify(
      {
        framework: 'pytest',
        test_code: 'import pytest\nfrom app import add\n\ndef test_add_positive_numbers():\n    assert add(2, 3) == 5\n\ndef test_add_negative_numbers():\n    assert add(-5, -5) == -10\n\ndef test_add_zero_identity():\n    assert add(10, 0) == 10\n\ndef test_add_large_integers():\n    assert add(10**9, 10**9) == 2 * 10**9',
        scenarios_covered: ['Happy path', 'Negative numbers', 'Identity element (0)', 'Large numbers'],
      },
      null,
      2
    ),
  },
  {
    method: 'POST',
    path: '/api/execute',
    title: 'Run Code in Isolated Sandbox',
    description: 'Safely compiles and runs code in an ephemeral Judge0 or SQLite in-memory sandbox with strict timeouts.',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer <YOUR_API_TOKEN>',
    },
    requestBody: JSON.stringify(
      {
        code: 'print("Hello from CodeGuardian Sandbox!")',
        language: 'python',
      },
      null,
      2
    ),
    responseBody: JSON.stringify(
      {
        stdout: 'Hello from CodeGuardian Sandbox!\n',
        stderr: '',
        exit_code: 0,
        execution_time_ms: 18.4,
        status: 'Success',
      },
      null,
      2
    ),
  },
  {
    method: 'GET',
    path: '/api/health',
    title: 'System Health & Engine Diagnostics',
    description: 'Returns real-time healthcheck status for the AST parser, Judge0 sandbox gateway, and database connections.',
    headers: {
      Accept: 'application/json',
    },
    responseBody: JSON.stringify(
      {
        status: 'healthy',
        ast_parser: 'online',
        judge0_gateway: 'connected',
        version: '2.4.0',
        uptime_seconds: 362480,
      },
      null,
      2
    ),
  },
]

export const ApiDocsPage: React.FC = () => {
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedSnippet(id)
    setTimeout(() => setCopiedSnippet(null), 2000)
  }

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
          <span className="text-slate-200 font-medium">API Documentation</span>
        </div>

        {/* Page Header */}
        <div className="border-b border-slate-800 pb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400 mb-4">
            <Terminal className="h-3.5 w-3.5" />
            <span>REST API Reference • v1</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
            API Documentation
          </h1>
          <p className="mt-3 text-base text-slate-300 max-w-3xl leading-relaxed">
            Integrate automated AST code analysis, vulnerability scanning, AI remediation diffs, and unit test generation directly into your CI/CD pipelines, GitHub Actions, and custom IDE extensions.
          </p>

          {/* Base URL Box */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-mono">
              <span className="text-slate-400">Base URL:</span>
              <span className="font-bold text-cyan-400">http://localhost:8000</span>
            </div>
            <button
              onClick={() => copyToClipboard('http://localhost:8000', 'base-url')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:border-cyan-400 transition cursor-pointer"
            >
              {copiedSnippet === 'base-url' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedSnippet === 'base-url' ? 'Copied' : 'Copy URL'}</span>
            </button>
          </div>
        </div>

        {/* Authentication Guide */}
        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-2 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-cyan-400" />
            Authentication
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed mb-4">
            All API requests must include a valid Bearer Token in the HTTP <code className="rounded bg-slate-800 px-1.5 py-0.5 text-cyan-300 font-mono">Authorization</code> header. Generate API keys from your authenticated <Link to="/settings" className="text-cyan-400 underline hover:text-cyan-300">Settings</Link> page.
          </p>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-slate-300 flex items-center justify-between">
            <code>Authorization: Bearer cg_live_8f3a9e10d29bc48e...</code>
            <button
              onClick={() => copyToClipboard('Authorization: Bearer <YOUR_API_TOKEN>', 'auth-header')}
              className="text-slate-400 hover:text-white transition"
              title="Copy header"
            >
              {copiedSnippet === 'auth-header' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </section>

        {/* Endpoints List */}
        <div className="mt-12 space-y-12">
          {ENDPOINTS.map((ep, idx) => (
            <section key={ep.path} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8">
              {/* Method & Path Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-lg px-2.5 py-1 font-mono text-xs font-black uppercase ${
                      ep.method === 'POST'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}
                  >
                    {ep.method}
                  </span>
                  <span className="font-mono text-sm sm:text-base font-bold text-white">{ep.path}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(`curl -X ${ep.method} "http://localhost:8000${ep.path}"`, `curl-${idx}`)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white transition cursor-pointer"
                >
                  {copiedSnippet === `curl-${idx}` ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>Copy cURL</span>
                </button>
              </div>

              {/* Title & Description */}
              <div className="mt-4">
                <h3 className="text-base font-bold text-white">{ep.title}</h3>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed">{ep.description}</p>
              </div>

              {/* Request & Response Schemas */}
              <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Request Body */}
                {ep.requestBody && (
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1.5">
                      <span>Request JSON</span>
                      <button
                        onClick={() => copyToClipboard(ep.requestBody || '', `req-${idx}`)}
                        className="hover:text-white transition"
                        title="Copy Request JSON"
                      >
                        {copiedSnippet === `req-${idx}` ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>
                    <pre className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-[11px] leading-relaxed text-slate-300">
                      <code>{ep.requestBody}</code>
                    </pre>
                  </div>
                )}

                {/* Response Body */}
                <div className={ep.requestBody ? '' : 'lg:col-span-2'}>
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1.5">
                    <span className="text-emerald-400">Response 200 OK</span>
                    <button
                      onClick={() => copyToClipboard(ep.responseBody, `res-${idx}`)}
                      className="hover:text-white transition"
                      title="Copy Response JSON"
                    >
                      {copiedSnippet === `res-${idx}` ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                  <pre className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-[11px] leading-relaxed text-slate-300">
                    <code>{ep.responseBody}</code>
                  </pre>
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* HTTP Status Code Reference */}
        <section className="mt-12 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8">
          <h2 className="text-base font-bold text-white mb-4">HTTP Status Codes Reference</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-2 font-semibold">Status</th>
                  <th className="pb-2 font-semibold">Meaning</th>
                  <th className="pb-2 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-slate-300">
                <tr>
                  <td className="py-2.5 text-emerald-400 font-bold">200 OK</td>
                  <td className="py-2.5 text-white">Success</td>
                  <td className="py-2.5 text-slate-400">Request parsed and completed successfully.</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-amber-400 font-bold">400 Bad Request</td>
                  <td className="py-2.5 text-white">Syntax / Payload Error</td>
                  <td className="py-2.5 text-slate-400">Missing required fields or invalid JSON format.</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-rose-400 font-bold">401 Unauthorized</td>
                  <td className="py-2.5 text-white">Authentication Failed</td>
                  <td className="py-2.5 text-slate-400">Missing or invalid Bearer token header.</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-amber-400 font-bold">422 Unprocessable</td>
                  <td className="py-2.5 text-white">Validation Error</td>
                  <td className="py-2.5 text-slate-400">Unsupported programming language code or syntax.</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-purple-400 font-bold">429 Too Many Requests</td>
                  <td className="py-2.5 text-white">Rate Limit Exceeded</td>
                  <td className="py-2.5 text-slate-400">API quota reached. Exponential backoff recommended.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
