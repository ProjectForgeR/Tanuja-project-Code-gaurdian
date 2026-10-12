import React, { useState, useEffect } from 'react'
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
} from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { analysisService } from '@/services/analysisService'
import { Finding } from '@/types/analysis'
import { FindingCard } from '@/features/analysis/FindingCard'

export const VulnerabilitiesPage: React.FC = () => {
  const [allFindings, setAllFindings] = useState<Finding[]>([])
  const [search, setSearch] = useState('')
  const [selectedSev, setSelectedSev] = useState('all')

  useEffect(() => {
    async function load() {
      try {
        const analyses = await analysisService.listAnalyses(50)
        const vulns = analyses.flatMap((a) =>
          a.findings.filter((f) => f.category === 'Security' || f.severity === 'Critical')
        )
        setAllFindings(vulns)
      } catch (err) {
        console.error(err)
      }
    }
    load()
  }, [])

  const filtered = allFindings.filter((f) => {
    const matchSearch =
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      f.explanation.toLowerCase().includes(search.toLowerCase()) ||
      (f.rule_id && f.rule_id.toLowerCase().includes(search.toLowerCase()))
    const matchSev = selectedSev === 'all' || f.severity.toLowerCase() === selectedSev.toLowerCase()
    return matchSearch && matchSev
  })

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-y-auto">
        <div className="border-b border-slate-800 bg-slate-950/80 px-8 py-5 backdrop-blur-md">
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <ShieldAlert className="h-5 w-5 text-red-400" />
            Vulnerability Explorer & CWE Matrix
          </h1>
          <p className="text-xs text-slate-400">
            Dedicated security audit stream highlighting injection vulnerabilities, credential exposures, and CVE risks.
          </p>
        </div>

        <div className="p-8 space-y-6">
          {/* Top CWE Reference Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
              <span className="text-[10px] font-bold uppercase text-red-400">CWE-89</span>
              <h4 className="text-sm font-bold text-white mt-1">SQL Injection</h4>
              <p className="text-[11px] text-slate-400 mt-1">Dynamic query concatenation</p>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
              <span className="text-[10px] font-bold uppercase text-amber-400">CWE-79</span>
              <h4 className="text-sm font-bold text-white mt-1">Cross-Site Scripting</h4>
              <p className="text-[11px] text-slate-400 mt-1">DOM & template injection</p>
            </div>
            <div className="rounded-xl border border-purple-500/20 bg-purple-500/10 p-4">
              <span className="text-[10px] font-bold uppercase text-purple-400">CWE-78</span>
              <h4 className="text-sm font-bold text-white mt-1">Command Injection</h4>
              <p className="text-[11px] text-slate-400 mt-1">Shell execution from input</p>
            </div>
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
              <span className="text-[10px] font-bold uppercase text-blue-400">CWE-798</span>
              <h4 className="text-sm font-bold text-white mt-1">Hardcoded Secrets</h4>
              <p className="text-[11px] text-slate-400 mt-1">API keys & cloud tokens</p>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Filter vulnerabilities by rule, description, or keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              {['all', 'critical', 'high', 'medium'].map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSev(s)}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold uppercase transition ${
                    selectedSev === s ? 'bg-red-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Vulnerabilities List */}
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-500 rounded-xl border border-slate-800 bg-slate-900/40">
                No security vulnerabilities currently matching criteria.
              </div>
            ) : (
              filtered.map((f, idx) => (
                <FindingCard key={f.id || idx} finding={f} />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
