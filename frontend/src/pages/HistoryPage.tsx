import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  History,
  Search,
  Download,
  FileCode,
  Trash2,
  GitCompare,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  X,
  Terminal,
} from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { analysisService } from '@/services/analysisService'
import { AnalysisResult, CompareResult } from '@/types/analysis'
import { formatDate, getScoreColor } from '@/lib/utils'

export const HistoryPage: React.FC = () => {
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([])
  const [search, setSearch] = useState('')
  const [selectedLang, setSelectedLang] = useState('all')
  const [compareId1, setCompareId1] = useState<string>('')
  const [compareId2, setCompareId2] = useState<string>('')
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null)
  const [isComparing, setIsComparing] = useState(false)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      const data = await analysisService.listAnalyses(100)
      setAnalyses(data)
    } catch (err) {
      console.error('Failed to load history:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this report?')) return
    try {
      await analysisService.deleteAnalysis(id)
      setAnalyses(analyses.filter((a) => a.id !== id))
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  const handleRunCompare = async () => {
    if (!compareId1 || !compareId2) return
    setIsComparing(true)
    try {
      const res = await analysisService.compareAnalyses(compareId1, compareId2)
      setCompareResult(res)
    } catch (err) {
      console.error('Compare failed:', err)
    } finally {
      setIsComparing(false)
    }
  }

  const filtered = useMemo(() => {
    return analyses.filter((a) => {
      const matchesSearch =
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.language.toLowerCase().includes(search.toLowerCase())
      const matchesLang = selectedLang === 'all' || a.language.toLowerCase() === selectedLang.toLowerCase()
      return matchesSearch && matchesLang
    })
  }, [analyses, search, selectedLang])

  const getLanguageBadge = (lang: string) => {
    const l = (lang || '').toLowerCase()
    const LANG_COLORS: Record<string, string> = {
      python: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
      py: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
      javascript: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      js: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      typescript: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
      ts: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
      reactjs: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
      reactts: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
      nodejs: 'bg-green-500/15 text-green-300 border-green-500/30',
      go: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
      golang: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
      java: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
      cpp: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      'c++': 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      c: 'bg-blue-600/15 text-blue-300 border-blue-600/30',
      csharp: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
      'c#': 'bg-violet-500/15 text-violet-300 border-violet-500/30',
      php: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
      rust: 'bg-orange-700/15 text-orange-300 border-orange-700/30',
      kotlin: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30',
      swift: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      ruby: 'bg-red-500/15 text-red-300 border-red-500/30',
      html: 'bg-orange-400/15 text-orange-300 border-orange-400/30',
      css: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
      sql: 'bg-blue-400/15 text-blue-300 border-blue-400/30',
      mysql: 'bg-blue-400/15 text-blue-300 border-blue-400/30',
      postgresql: 'bg-blue-400/15 text-blue-300 border-blue-400/30',
      plsql: 'bg-blue-400/15 text-blue-300 border-blue-400/30',
      bash: 'bg-emerald-600/15 text-emerald-300 border-emerald-600/30',
      shell: 'bg-emerald-600/15 text-emerald-300 border-emerald-600/30',
      json: 'bg-slate-400/15 text-slate-300 border-slate-400/30',
      yaml: 'bg-slate-400/15 text-slate-300 border-slate-400/30',
      xml: 'bg-slate-400/15 text-slate-300 border-slate-400/30',
      markdown: 'bg-slate-400/15 text-slate-300 border-slate-400/30',
    }
    return LANG_COLORS[l] || 'bg-slate-800 text-slate-200 border-slate-700'
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-y-auto">
        <div className="border-b border-slate-800 bg-slate-950/80 px-8 py-5 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
                <History className="h-5 w-5 text-blue-400" />
                Analysis History & Diff Comparison
              </h1>
              <p className="text-xs text-slate-400">
                Inspect past scans, export archived reports, and compare regression diffs.
              </p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Compare Toolbar */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5 mb-3">
              <GitCompare className="h-4 w-4" /> Compare Two Scans
            </h3>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <select
                value={compareId1}
                onChange={(e) => setCompareId1(e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none flex-1 min-w-[200px]"
              >
                <option value="">Select Baseline Scan (v1)...</option>
                {analyses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title} ({a.quality_score} pts - {formatDate(a.created_at)})
                  </option>
                ))}
              </select>

              <span className="text-slate-500 font-bold">vs</span>

              <select
                value={compareId2}
                onChange={(e) => setCompareId2(e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none flex-1 min-w-[200px]"
              >
                <option value="">Select Target Scan (v2)...</option>
                {analyses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title} ({a.quality_score} pts - {formatDate(a.created_at)})
                  </option>
                ))}
              </select>

              <button
                onClick={handleRunCompare}
                disabled={!compareId1 || !compareId2 || isComparing}
                className="rounded-xl bg-purple-600 px-5 py-2 font-semibold text-white shadow-md shadow-purple-600/30 hover:bg-purple-500 disabled:opacity-50 transition"
              >
                {isComparing ? 'Comparing...' : 'Run Diff Compare'}
              </button>
            </div>

            {/* Compare Result Modal / Card */}
            {compareResult && (
              <div className="mt-5 rounded-xl border border-purple-800/40 bg-purple-950/20 p-4">
                <div className="flex items-center justify-between border-b border-purple-800/40 pb-2 mb-3">
                  <h4 className="font-bold text-white text-sm">Scan Comparison Summary</h4>
                  <button onClick={() => setCompareResult(null)} className="text-slate-400 hover:text-white">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 mb-4 text-center">
                  <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Score Delta</div>
                    <div className={`text-lg font-bold ${compareResult.quality_score_delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {compareResult.quality_score_delta >= 0 ? `+${compareResult.quality_score_delta}` : compareResult.quality_score_delta} pts
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Resolved Defects</div>
                    <div className="text-lg font-bold text-emerald-400">
                      {compareResult.resolved_findings.length} fixed
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-800">
                    <div className="text-[10px] text-slate-400">New Issues Introduced</div>
                    <div className="text-lg font-bold text-red-400">
                      {compareResult.new_findings.length} new
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search history by title or language..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">Language:</span>
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="all">All Languages</option>
                <optgroup label="─── Core Languages">
                  <option value="python">🐍 Python</option>
                  <option value="java">☕ Java</option>
                  <option value="c">🔹 C</option>
                  <option value="cpp">⚙️ C++</option>
                  <option value="csharp">🔷 C#</option>
                  <option value="php">🐘 PHP</option>
                  <option value="go">🐹 Go</option>
                  <option value="rust">🦀 Rust</option>
                  <option value="kotlin">🟣 Kotlin</option>
                  <option value="swift">🍎 Swift</option>
                  <option value="ruby">💎 Ruby</option>
                </optgroup>
                <optgroup label="─── Web Development">
                  <option value="javascript">⚡ JavaScript</option>
                  <option value="typescript">🔷 TypeScript</option>
                  <option value="reactjs">⚛️ React JS (JSX)</option>
                  <option value="reactts">⚛️ React JS (TSX)</option>
                  <option value="nodejs">🟩 Node.js</option>
                  <option value="html">🌐 HTML</option>
                  <option value="css">🎨 CSS</option>
                </optgroup>
                <optgroup label="─── Database & Query">
                  <option value="sql">🗄️ SQL</option>
                  <option value="mysql">🗄️ MySQL</option>
                  <option value="postgresql">🐘 PostgreSQL</option>
                  <option value="plsql">🗄️ PL/SQL</option>
                </optgroup>
                <optgroup label="─── Other">
                  <option value="bash">🐚 Bash/Shell</option>
                  <option value="json">📋 JSON</option>
                  <option value="yaml">📄 YAML</option>
                  <option value="xml">📝 XML</option>
                  <option value="markdown">📖 Markdown</option>
                </optgroup>
              </select>
            </div>
          </div>

          {/* History Records Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-md">
            {filtered.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mx-auto">
                  <History className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-white">No Analysis Records Found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  {search || selectedLang !== 'all'
                    ? 'No analysis runs match your search filters. Try adjusting your query or resetting language filters.'
                    : 'You have not run any code reviews yet. Analyze code in the workspace to track vulnerabilities, test runs, and quality scores here.'}
                </p>
                <div className="pt-2">
                  <Link
                    to="/workspace"
                    className="ui-button-lift inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 transition hover:from-blue-500 hover:to-indigo-500"
                  >
                    <Terminal className="h-3.5 w-3.5" />
                    <span>Start New Code Analysis</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-3 font-semibold">Audit Title</th>
                      <th className="pb-3 font-semibold">Language</th>
                      <th className="pb-3 font-semibold">Quality Score</th>
                      <th className="pb-3 font-semibold">Findings</th>
                      <th className="pb-3 font-semibold">Critical</th>
                      <th className="pb-3 font-semibold">Scan Duration</th>
                      <th className="pb-3 font-semibold">Date</th>
                      <th className="pb-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filtered.map((a) => (
                      <tr key={a.id} className="transition hover:bg-slate-800/40">
                        <td className="py-3.5 font-semibold text-white">
                          {a.title}
                        </td>
                        <td className="py-3.5">
                          <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getLanguageBadge(a.language)}`}>
                            {a.language}
                          </span>
                        </td>
                        <td className={`py-3.5 font-bold ${getScoreColor(a.quality_score)}`}>
                          {a.quality_score} / 100
                        </td>
                        <td className="py-3.5 text-slate-300">{a.findings_count}</td>
                        <td className="py-3.5">
                          {a.critical_count > 0 ? (
                            <span className="rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400">
                              {a.critical_count}
                            </span>
                          ) : (
                            <span className="text-slate-500">0</span>
                          )}
                        </td>
                        <td className="py-3.5 text-purple-400 font-mono">{a.duration_ms}ms</td>
                        <td className="py-3.5 text-slate-400">{formatDate(a.created_at)}</td>
                        <td className="py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={analysisService.getExportHtmlUrl(a.id)}
                              download
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-emerald-400 transition"
                              title="Download HTML Report"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </a>
                            <a
                              href={analysisService.getExportJsonUrl(a.id)}
                              download
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-indigo-400 transition"
                              title="Export JSON"
                            >
                              <FileCode className="h-3.5 w-3.5" />
                            </a>
                            <button
                              onClick={() => handleDelete(a.id)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
