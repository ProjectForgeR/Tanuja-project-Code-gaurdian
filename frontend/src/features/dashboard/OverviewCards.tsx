import React from 'react'
import {
  Activity,
  Bug,
  ShieldAlert,
  Flame,
  Award,
  TrendingUp,
} from 'lucide-react'

interface OverviewCardsProps {
  totalAnalyses: number
  bugsDetected: number
  securityIssues: number
  criticalFindings: number
  averageQualityScore: number
}

export const OverviewCards: React.FC<OverviewCardsProps> = ({
  totalAnalyses,
  bugsDetected,
  securityIssues,
  criticalFindings,
  averageQualityScore,
}) => {
  const cards = [
    {
      title: 'Total Analyses',
      value: totalAnalyses,
      subtext: 'Scans executed across codebase',
      icon: Activity,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
    },
    {
      title: 'Bugs Detected',
      value: bugsDetected,
      subtext: 'Runtime errors & logic defects',
      icon: Bug,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
    },
    {
      title: 'Security Issues',
      value: securityIssues,
      subtext: 'CWEs, injections & leaks',
      icon: ShieldAlert,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
    },
    {
      title: 'Critical Findings',
      value: criticalFindings,
      subtext: 'Urgent production blockers',
      icon: Flame,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
    },
    {
      title: 'Avg Quality Score',
      value: `${averageQualityScore.toFixed(1)}/100`,
      subtext: 'Weighted health index',
      icon: Award,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((c, idx) => (
        <div
          key={idx}
          className={`rounded-2xl border border-slate-200 dark:${c.borderColor} bg-white dark:bg-slate-900/60 p-5 shadow-xs dark:shadow-lg backdrop-blur-md transition hover:scale-[1.02]`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{c.title}</span>
            <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${c.bgColor} ${c.color}`}>
              <c.icon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {c.value}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
            <TrendingUp className="h-3 w-3 text-blue-600 dark:text-blue-400" />
            <span>{c.subtext}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
