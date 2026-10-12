import React, { useState } from 'react'
import {
  BookOpen,
  Cpu,
  ShieldCheck,
  Award,
  Terminal,
  Database,
  Layers,
  Key,
  ShieldAlert,
  FileCode,
} from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export const DocumentationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview')

  const tabs = [
    { id: 'overview', label: '1. Overview & Architecture', icon: BookOpen },
    { id: 'static-vs-ai', label: '2. Static vs AI Analysis', icon: Cpu },
    { id: 'scoring', label: '3. Severity & Quality Scoring', icon: Award },
    { id: 'languages', label: '4. Languages & CWE Matrix', icon: FileCode },
    { id: 'ml-pipeline', label: '5. CodeBERT & Datasets', icon: Database },
    { id: 'security', label: '6. Privacy & Sandbox Policy', icon: ShieldCheck },
    { id: 'api', label: '7. REST API Reference', icon: Terminal },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <div className="border-b border-slate-800 pb-8">
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            Documentation & Technical Specifications
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Comprehensive reference manual for the CodeGuardian AI static analysis and defect prediction platform.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Navigation Tabs Sidebar */}
          <aside className="lg:col-span-3">
            <nav className="space-y-1.5 sticky top-24">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition text-left ${
                    activeTab === t.id
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <t.icon className="h-4 w-4 shrink-0" />
                  <span>{t.label}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Doc Content Panels */}
          <section className="lg:col-span-9 rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-xs leading-relaxed text-slate-300">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white">1. Platform Overview & Architecture</h2>
                <p>
                  <strong>CodeGuardian AI</strong> is a professional developer security platform that audits source code for security vulnerabilities, software defects, code smells, and performance bottlenecks prior to production release.
                </p>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-[11px] text-blue-300">
                  Developer Code &rarr; Python AST & Polyglot Rules &rarr; Bandit Engine &rarr; LLM Reasoning &rarr; Deduplication &rarr; Scoring Engine &rarr; Fix Assistant &amp; Unit Tests
                </div>
                <h3 className="text-sm font-bold text-white mt-4">Key Capabilities</h3>
                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                  <li><strong>Real-time Monaco Editor analysis:</strong> Debounced scanning updates syntax squigglies without lagging editor input.</li>
                  <li><strong>Multi-language static scanners:</strong> Native Python AST inspection, Bandit runner, and polyglot rule parsers for JS, TS, Java, C++, and Go.</li>
                  <li><strong>Explainable Quality Score:</strong> Mathematical, reproducible score computation (0-100) based on actual CWE impact penalties.</li>
                  <li><strong>Automated remediation diffs:</strong> Unified before/after diffs with side-effects warnings and test validation steps.</li>
                </ul>
              </div>
            )}

            {activeTab === 'static-vs-ai' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white">2. Static Analysis vs. AI Reasoning</h2>
                <p>
                  CodeGuardian AI operates on a hybrid architecture combining the determinism of static abstract syntax tree (AST) parsers with the semantic reasoning of large language models.
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <h3 className="text-sm font-bold text-blue-400">Static AST & Rule Engine</h3>
                    <ul className="mt-2 space-y-1 text-slate-400">
                      <li>&bull; 100% deterministic with 0 hallucination risk.</li>
                      <li>&bull; Zero latency: executes in sub-100ms.</li>
                      <li>&bull; High-precision detection of hardcoded keys, SQLi concatenations, and dangerous functions.</li>
                      <li>&bull; Operates fully offline without external API dependencies.</li>
                    </ul>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <h3 className="text-sm font-bold text-purple-400">AI Reasoning Engine</h3>
                    <ul className="mt-2 space-y-1 text-slate-400">
                      <li>&bull; Semantic context analysis and cross-function taint tracing.</li>
                      <li>&bull; Explains why code is dangerous in natural language.</li>
                      <li>&bull; Generates custom test cases covering subtle boundary logic.</li>
                      <li>&bull; Synthesizes minimal safe code diff replacements.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'scoring' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white">3. Bug Severity & Quality Scoring Formula</h2>
                <p>
                  The Code Quality Score is calculated transparently starting from a base index of 100 points, applying weighted deductions per unique finding:
                </p>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-[11px] text-emerald-400">
                  QualityScore = max(5.0, 100.0 - sum(SeverityWeight[i] * ConfidenceMultiplier[i]))
                  <br />
                  RiskScore = 100.0 - QualityScore
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border border-slate-800 rounded-lg">
                    <thead className="bg-slate-900 border-b border-slate-800">
                      <tr>
                        <th className="p-2 font-semibold">Severity</th>
                        <th className="p-2 font-semibold">Penalty</th>
                        <th className="p-2 font-semibold">Typical CWEs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      <tr>
                        <td className="p-2 font-bold text-red-400">Critical</td>
                        <td className="p-2">-25 pts</td>
                        <td className="p-2 text-slate-400">SQL Injection (CWE-89), eval RCE (CWE-95), Buffer Overflow (CWE-120)</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-amber-400">High</td>
                        <td className="p-2">-15 pts</td>
                        <td className="p-2 text-slate-400">XSS (CWE-79), Hardcoded API Secrets (CWE-798), Prototype Pollution (CWE-1321)</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-yellow-400">Medium</td>
                        <td className="p-2">-7 pts</td>
                        <td className="p-2 text-slate-400">Mutable Default Arguments, Weak Hashing (MD5/SHA1), Resource Leaks (CWE-775)</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-blue-400">Low</td>
                        <td className="p-2">-2 pts</td>
                        <td className="p-2 text-slate-400">Assert in production, Leftover console.log, Loose equality (==)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'languages' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white">4. Supported Programming Languages</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                    <strong className="text-blue-400 font-semibold">Python (py):</strong>
                    <p className="text-slate-400 mt-1">Full AST parser, Bandit static analyzer, f-string SQLi, eval RCE, mutable defaults, pickle deserialization.</p>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                    <strong className="text-amber-400 font-semibold">JavaScript & TypeScript (js, ts):</strong>
                    <p className="text-slate-400 mt-1">DOM XSS, dangerouslySetInnerHTML, prototype pollution, template literal SQL injection, loose equality.</p>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                    <strong className="text-red-400 font-semibold">Java (java):</strong>
                    <p className="text-slate-400 mt-1">JDBC statement concatenation SQLi, Runtime.exec command injection, unclosed FileInputStream leaks.</p>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                    <strong className="text-purple-400 font-semibold">C++ & C (cpp, c):</strong>
                    <p className="text-slate-400 mt-1">Buffer overflows via strcpy, unbounded gets, sprintf overflow, strcat boundary violations.</p>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                    <strong className="text-emerald-400 font-semibold">Go (go):</strong>
                    <p className="text-slate-400 mt-1">SQLi via fmt.Sprintf, sync.Mutex lock without defer unlock deadlocks, Goroutine leak patterns.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ml-pipeline' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white">5. Machine Learning Pipeline (CodeBERT, CodeXGLUE, Big-Vul)</h2>
                <p>
                  The machine learning module in <code>/ml</code> provides a complete training, evaluation, and inference pipeline using CodeBERT for defect detection on CodeXGLUE and Big-Vul benchmarks.
                </p>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-[11px] text-purple-300">
                  ml/data/dataset_loader.py &rarr; ml/preprocessing/preprocess.py &rarr; ml/training/train_classifier.py &rarr; ml/evaluation/evaluate.py &rarr; ml/inference/predictor.py
                </div>
                <p className="text-slate-400">
                  Data leakage checks compute canonical code hashes across train, validation, and test splits to strictly prevent memorization artifacts.
                </p>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white">6. Security, Sandbox & Privacy Policy</h2>
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-slate-300">
                  <h3 className="font-bold text-white flex items-center gap-2 mb-2">
                    <ShieldCheck className="h-4 w-4 text-blue-400" />
                    Zero Remote Execution Guarantee
                  </h3>
                  Code submitted to CodeGuardian AI is <strong>never executed</strong> on application or database servers. Analysis is performed strictly via static code parsing (Python AST, AST tokens, regex patterns).
                </div>
                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                  <li><strong>Payload Size Limits:</strong> Requests exceeding 2MB are automatically rejected at the gateway.</li>
                  <li><strong>Zero Secret Logging:</strong> API keys and database credentials are stored in environment variables and never logged to console or returned to clients.</li>
                  <li><strong>Data Purge:</strong> Analyses and saved code can be deleted at any time with one click in History or Settings.</li>
                </ul>
              </div>
            )}

            {activeTab === 'api' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white">7. REST API Reference</h2>
                <div className="space-y-3 font-mono text-[11px]">
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                    <span className="text-emerald-400 font-bold">POST</span> /api/analyses/analyze
                    <p className="text-slate-400 font-sans mt-1">Runs static AST analysis, Bandit scan, and optional AI reasoning. Returns quality score, risk breakdown, and deduplicated findings.</p>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                    <span className="text-emerald-400 font-bold">POST</span> /api/analyses/fix/suggest
                    <p className="text-slate-400 font-sans mt-1">Generates unified patch diff, explanation of safety, side effects, and recommended tests for a selected finding.</p>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                    <span className="text-emerald-400 font-bold">POST</span> /api/analyses/tests/generate
                    <p className="text-slate-400 font-sans mt-1">Synthesizes unit tests (pytest, Jest, JUnit 5, Go test) covering normal, boundary, malicious, and regression scenarios.</p>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                    <span className="text-blue-400 font-bold">GET</span> /api/health
                    <p className="text-slate-400 font-sans mt-1">Healthcheck endpoint verifying status of Bandit, Python AST parser, and database connection.</p>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
