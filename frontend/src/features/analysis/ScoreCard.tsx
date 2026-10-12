import React, { useState } from 'react'
import {
  ShieldAlert,
  Info,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { RiskBreakdown } from '@/types/analysis'
import { getScoreColor } from '@/lib/utils'

interface ScoreCardProps {
  qualityScore: number
  riskScore: number
  durationMs: number
  riskBreakdown?: RiskBreakdown
}

export const ScoreCard: React.FC<ScoreCardProps> = ({
  qualityScore,
  riskScore,
  durationMs,
  riskBreakdown,
}) => {
  const [showFactors, setShowFactors] = useState(false)

  const scoreColor = getScoreColor(qualityScore)

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur-md">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
        {/* Quality Score Gauge */}
        <div className="flex items-center gap-5">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-2 border-slate-700/60 bg-slate-950/80 shadow-inner">
            <div className={`text-2xl font-black tracking-tight ${scoreColor}`}>
              {qualityScore}
            </div>
            <div className="absolute -bottom-2 rounded-full bg-slate-800 px-1.5 py-0.5 text-[9px] font-bold text-slate-300">
              / 100
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Code Quality Score</h3>
              <span className="rounded-md border border-slate-700 bg-slate-800/60 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                {qualityScore >= 80 ? 'Grade A (Secure)' : qualityScore >= 60 ? 'Grade B (Moderate)' : 'Grade C (High Risk)'}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {riskBreakdown?.summary || 'Calculated using static analysis, AST rules, and vulnerability weighting.'}
            </p>
          </div>
        </div>

        {/* Risk & Scan Time Metrics */}
        <div className="flex flex-wrap items-center gap-4 sm:justify-end">
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 px-4 py-2.5 text-center">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Calculated Risk
            </div>
            <div className={`text-lg font-bold ${riskScore > 40 ? 'text-red-400' : 'text-emerald-400'}`}>
              {riskScore}%
            </div>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 px-4 py-2.5 text-center">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Scan Latency
            </div>
            <div className="text-lg font-bold text-purple-400">
              {durationMs}ms
            </div>
          </div>
        </div>
      </div>

      {/* Factor Breakdown Accordion Toggle */}
      {riskBreakdown && riskBreakdown.factors.length > 0 && (
        <div className="mt-4 border-t border-slate-800/60 pt-3">
          <button
            onClick={() => setShowFactors(!showFactors)}
            className="flex w-full items-center justify-between text-xs font-semibold text-slate-300 transition hover:text-blue-400"
          >
            <span className="flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-blue-400" />
              Transparent Scoring Breakdown ({riskBreakdown.factors.length} factors)
            </span>
            {showFactors ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showFactors && (
            <div className="mt-3 grid grid-cols-1 gap-2.5 rounded-lg border border-slate-800 bg-slate-950/60 p-3 sm:grid-cols-2">
              {riskBreakdown.factors.map((factor, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px] text-slate-300">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                  <span>{factor}</span>
                </div>
              ))}
              <div className="col-span-full mt-2 flex flex-wrap gap-4 border-t border-slate-800/60 pt-2 text-[11px] text-slate-400">
                <span>Impact: <strong className="text-white">{riskBreakdown.impact_score}/100</strong></span>
                <span>Exploitability: <strong className="text-white">{riskBreakdown.exploitability_score}/100</strong></span>
                <span>Detection Confidence: <strong className="text-white">{riskBreakdown.confidence_score}%</strong></span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
