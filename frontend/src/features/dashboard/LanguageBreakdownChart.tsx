import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { useTheme } from '@/features/theme/ThemeContext'

interface LanguageBreakdownProps {
  data: { language: string; count: number }[]
}

export const LanguageBreakdownChart: React.FC<LanguageBreakdownProps> = ({ data }) => {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const colors = ['#2563eb', '#0284c7', '#7c3aed', '#f43f5e', '#10b981', '#f59e0b']

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-xs dark:shadow-xl backdrop-blur-md">
      <div className="border-b border-slate-200 dark:border-slate-800/80 pb-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Language Breakdown</h3>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">Analyses categorized by source programming language</p>
      </div>

      <div className="mt-4 h-64 w-full">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">
            No language statistics available yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="language"
                stroke={isDark ? '#64748b' : '#94a3b8'}
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                stroke={isDark ? '#64748b' : '#94a3b8'}
                fontSize={11}
                tickLine={false}
                allowDecimals={false}
              />
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
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
