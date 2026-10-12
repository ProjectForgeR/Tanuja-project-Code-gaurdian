import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Terminal,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Download,
  Eye,
  Trash2,
  Calendar,
  Sun,
  Moon,
} from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { useTheme } from '@/features/theme/ThemeContext'
import { OverviewCards } from '@/features/dashboard/OverviewCards'
import { SeverityDistributionChart } from '@/features/dashboard/SeverityDistributionChart'
import { LanguageBreakdownChart } from '@/features/dashboard/LanguageBreakdownChart'
import { WeeklyTrendChart } from '@/features/dashboard/WeeklyTrendChart'
import { analysisService } from '@/services/analysisService'
import { AnalysisResult } from '@/types/analysis'
import { formatDate, getScoreColor } from '@/lib/utils'

export const DashboardPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme()
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadAnalyses()
  }, [])

  const loadAnalyses = async () => {
    try {
      const data = await analysisService.listAnalyses(50)
      setAnalyses(data)
    } catch (err) {
      console.error('Failed to load analyses:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate aggregates
  const totalAnalyses = analyses.length
  const criticalFindings = analyses.reduce((acc, a) => acc + a.critical_count, 0)
  const highFindings = analyses.reduce((acc, a) => acc + a.high_count, 0)
  const mediumFindings = analyses.reduce((acc, a) => acc + a.medium_count, 0)
  const lowFindings = analyses.reduce((acc, a) => acc + a.low_count, 0)

  const bugsDetected = analyses.reduce(
    (acc, a) => acc + a.findings.filter((f) => f.category === 'Bug').length,
    0
  )
  const securityIssues = analyses.reduce(
    (acc, a) => acc + a.findings.filter((f) => f.category === 'Security').length,
    0
  )

  const avgQualityScore =
    totalAnalyses > 0
      ? analyses.reduce((acc, a) => acc + a.quality_score, 0) / totalAnalyses
      : 100.0

  // Language counts
  const langMap: Record<string, number> = {}
  analyses.forEach((a) => {
    langMap[a.language] = (langMap[a.language] || 0) + 1
  })
  const languageData = Object.entries(langMap).map(([lang, count]) => ({
    language: lang.toUpperCase(),
    count,
  }))

  // Weekly Trend mock/historical calculation
  const trendData = [
    { date: 'Mon', analyses: 2, avgScore: 85 },
    { date: 'Tue', analyses: 5, avgScore: 78 },
    { date: 'Wed', analyses: 8, avgScore: 74 },
    { date: 'Thu', analyses: 4, avgScore: 82 },
    { date: 'Fri', analyses: 9, avgScore: 68 },
    { date: 'Sat', analyses: 3, avgScore: 90 },
    { date: 'Sun', analyses: Math.max(1, totalAnalyses), avgScore: Math.round(avgQualityScore) },
  ]

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this analysis report?')) return
    try {
      await analysisService.deleteAnalysis(id)
      setAnalyses(analyses.filter((a) => a.id !== id))
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-y-auto">
        {/* Header */}
        <div className="border-b border-slate-800 bg-slate-950/80 px-8 py-5 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
                <LayoutDashboard className="h-5 w-5 text-blue-400" />
                Security & Code Health Dashboard
              </h1>
              <p className="text-xs text-slate-400">
                Live metrics, bug distributions, and security posture monitoring.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                type="button"
                aria-label="Toggle theme mode"
                title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4 text-amber-400" />
                ) : (
                  <Moon className="h-4 w-4 text-indigo-500" />
                )}
              </button>

              <Link
                to="/workspace"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:from-blue-500 hover:to-indigo-500"
              >
                <Sparkles className="h-4 w-4" />
                Quick Analyze
              </Link>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-8 space-y-8">
          {/* KPI Overview Cards */}
          <OverviewCards
            totalAnalyses={totalAnalyses}
            bugsDetected={bugsDetected}
            securityIssues={securityIssues}
            criticalFindings={criticalFindings}
            averageQualityScore={avgQualityScore}
          />

          {/* Charts Row */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <SeverityDistributionChart
              critical={criticalFindings}
              high={highFindings}
              medium={mediumFindings}
              low={lowFindings}
            />
            <LanguageBreakdownChart data={languageData} />
            <WeeklyTrendChart data={trendData} />
          </div>

          {/* Recent Analyses Activity Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div>
                <h3 className="text-base font-bold text-white">Recent Analysis Activity</h3>
                <p className="text-xs text-slate-400">
                  Latest executed scans and security scores
                </p>
              </div>

              <Link
                to="/history"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition"
              >
                View Full History
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-4 overflow-x-auto">
              {analyses.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  No analysis records found. Click Quick Analyze to run your first code scan.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-3 font-semibold">Title</th>
                      <th className="pb-3 font-semibold">Language</th>
                      <th className="pb-3 font-semibold">Quality Score</th>
                      <th className="pb-3 font-semibold">Total Defects</th>
                      <th className="pb-3 font-semibold">Critical</th>
                      <th className="pb-3 font-semibold">Timestamp</th>
                      <th className="pb-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {analyses.slice(0, 8).map((a) => (
                      <tr
                        key={a.id}
                        className="transition hover:bg-slate-800/40 cursor-pointer"
                        onClick={() => navigate('/workspace')}
                      >
                        <td className="py-3.5 font-semibold text-white">
                          {a.title}
                        </td>
                        <td className="py-3.5">
                          <span className="rounded-md border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-300">
                            {a.language}
                          </span>
                        </td>
                        <td className={`py-3.5 font-bold ${getScoreColor(a.quality_score)}`}>
                          {a.quality_score} / 100
                        </td>
                        <td className="py-3.5 text-slate-300">
                          {a.findings_count}
                        </td>
                        <td className="py-3.5">
                          {a.critical_count > 0 ? (
                            <span className="rounded bg-red-500/20 px-2 py-0.5 text-[11px] font-bold text-red-400">
                              {a.critical_count}
                            </span>
                          ) : (
                            <span className="text-slate-500">0</span>
                          )}
                        </td>
                        <td className="py-3.5 text-slate-400">
                          {formatDate(a.created_at)}
                        </td>
                        <td className="py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={analysisService.getExportHtmlUrl(a.id)}
                              download
                              onClick={(e) => e.stopPropagation()}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-emerald-400 transition"
                              title="Download HTML Report"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </a>
                            <button
                              onClick={(e) => handleDelete(a.id, e)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition"
                              title="Delete record"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
