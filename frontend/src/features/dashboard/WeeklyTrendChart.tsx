import React from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useTheme } from '@/features/theme/ThemeContext'

interface TrendProps {
  data: { date: string; analyses: number; avgScore: number }[]
}

export const WeeklyTrendChart: React.FC<TrendProps> = ({ data }) => {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-xs dark:shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Weekly Analysis Trends</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Scan throughput and code quality progression</p>
        </div>
      </div>

      <div className="mt-4 h-64 w-full">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">
            No historical trend data yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAnalyses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={isDark ? 0.4 : 0.3} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} tickLine={false} />
              <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#0b0f19' : '#ffffff',
                  borderColor: isDark ? '#1e293b' : '#cbd5e1',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  color: isDark ? '#fff' : '#0f172a',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              />
              <Area
                type="monotone"
                dataKey="analyses"
                name="Analyses Run"
                stroke="#2563eb"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorAnalyses)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
