import React, { useState } from 'react'
import {
  ShieldAlert,
  ShieldCheck,
  Info,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  TestTube2,
  Cpu,
  Clock,
} from 'lucide-react'
import { RiskBreakdown, ComplexityMetrics } from '@/types/analysis'
import { RunTestsResponse } from '@/types/execution'

interface ScoreCardProps {
  qualityScore?: number
  riskScore?: number
  durationMs?: number
  riskBreakdown?: RiskBreakdown
  codeSmellsCount?: number
  maintainabilityCount?: number
  performanceCount?: number
  securityCount?: number
  complexityMetrics?: ComplexityMetrics
  testResults?: RunTestsResponse | null
  totalTestCases?: number
}

export const ScoreCard: React.FC<ScoreCardProps> = ({
  qualityScore,
  riskScore = 0,
  durationMs = 0,
  riskBreakdown,
  codeSmellsCount = 0,
  maintainabilityCount = 0,
  performanceCount = 0,
  securityCount = 0,
  complexityMetrics,
  testResults,
  totalTestCases = 0,
}) => {
  const [showFactors, setShowFactors] = useState(false)

  // Status computation for Code Quality
  const hasQuality = qualityScore !== undefined && qualityScore !== null
  const qualityGrade = !hasQuality
    ? 'Pending Scan'
    : qualityScore >= 80
    ? 'Grade A · Optimal'
    : qualityScore >= 60
    ? 'Grade B · Fair'
    : 'Grade C · Technical Debt'

  const qualityBadgeClass = !hasQuality
    ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
    : qualityScore >= 80
    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
    : qualityScore >= 60
    ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
    : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'

  // Status computation for Security
  const hasSecurityIssues = (securityCount || 0) > 0 || riskScore > 35
  const securityBadgeClass = hasSecurityIssues
    ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
    : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'

  // Status computation for Code Smells
  const smellsBadgeClass = (codeSmellsCount || 0) > 0
    ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800'
    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'

  // Status computation for Test Results
  const testsPassed = testResults?.passed ?? 0
  const totalTests = testResults?.total ?? totalTestCases
  const allTestsPassed = testResults && testResults.total > 0 && testResults.failed === 0
  const testsBadgeClass = !testResults
    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
    : allTestsPassed
    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
    : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'

  return (
    <div className="space-y-3">
      {/* 4 Compact Quality Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Code Quality */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs transition hover:border-slate-300 dark:hover:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Code Quality
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {hasQuality ? `${qualityScore}` : '—'}
            </span>
            {hasQuality && (
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">/ 100</span>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold ${qualityBadgeClass}`}>
              {qualityGrade}
            </span>
            {durationMs > 0 && (
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {durationMs}ms
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Security & Risk */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs transition hover:border-slate-300 dark:hover:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Security
            </span>
            <div className={`flex h-7 w-7 items-center justify-center rounded-lg border ${
              hasSecurityIssues
                ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
            }`}>
              {hasSecurityIssues ? <ShieldAlert className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {hasQuality ? `${securityCount} Issues` : '—'}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold ${securityBadgeClass}`}>
              {hasQuality ? (riskScore > 35 ? `Risk Score: ${riskScore}%` : 'Safe & Guarded') : 'Clean AST'}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">150+ Bandit Rules</span>
          </div>
        </div>

        {/* Card 3: Code Smells */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs transition hover:border-slate-300 dark:hover:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Code Smells
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {hasQuality ? `${codeSmellsCount} Smells` : '—'}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold ${smellsBadgeClass}`}>
              {maintainabilityCount > 0 ? `${maintainabilityCount} Maintainability` : 'Clean Architecture'}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">AST Patterns</span>
          </div>
        </div>

        {/* Card 4: Test Results */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs transition hover:border-slate-300 dark:hover:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Test Results
            </span>
            <div className={`flex h-7 w-7 items-center justify-center rounded-lg border ${
              !testResults
                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                : allTestsPassed
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
            }`}>
              <TestTube2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {testResults
                ? `${testsPassed} / ${totalTests} Passed`
                : totalTests > 0
                ? `${totalTests} Test Cases`
                : '0 Tests'}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold ${testsBadgeClass}`}>
              {!testResults
                ? 'Ready to Run'
                : allTestsPassed
                ? '100% Pass Rate'
                : `${testResults.failed} Failed`}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">Sandbox Bench</span>
          </div>
        </div>
      </div>

      {/* Optional Transparent Breakdown & Telemetry Toggle */}
      {((riskBreakdown && riskBreakdown.factors.length > 0) || complexityMetrics) && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-2xs">
          <button
            type="button"
            onClick={() => setShowFactors(!showFactors)}
            className="flex w-full items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
          >
            <span className="flex items-center gap-2">
              <Info className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>Telemetry & Quality Deduction Breakdown</span>
            </span>
            {showFactors ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showFactors && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
              {/* Complexity Telemetry */}
              {complexityMetrics && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Cyclomatic</span>
                    <div className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">
                      {complexityMetrics.cyclomatic_complexity ?? complexityMetrics.cyclomatic_estimate ?? 1}
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Cognitive</span>
                    <div className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">
                      {complexityMetrics.cognitive_complexity ?? complexityMetrics.max_nesting_depth ?? 1}
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Halstead Vol</span>
                    <div className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">
                      {complexityMetrics.halstead_volume ?? '-'}
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Lines of Code</span>
                    <div className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">
                      {complexityMetrics.lines_of_code ?? complexityMetrics.loc ?? 0}
                    </div>
                  </div>
                </div>
              )}

              {/* Deductions factors */}
              {riskBreakdown && riskBreakdown.factors.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block">
                    Mathematical Deductions:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {riskBreakdown.factors.map((factor, i) => (
                      <div key={i} className="flex items-start gap-1.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 px-2.5 py-1.5 text-[11px] text-amber-900 dark:text-amber-200">
                        <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <span>{factor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ScoreCard
