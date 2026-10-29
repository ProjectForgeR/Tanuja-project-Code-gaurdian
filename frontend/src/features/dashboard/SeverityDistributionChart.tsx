import React from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import { useTheme } from '@/features/theme/ThemeContext'

interface SeverityChartProps {
  critical: number
  high: number
  medium: number
  low: number
}

export const SeverityDistributionChart: React.FC<SeverityChartProps> = ({
  critical,
  high,
  medium,
  low,
}) => {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const data = [
    { name: 'Critical', value: critical, color: '#ef4444' },
    { name: 'High', value: high, color: '#f97316' },
    { name: 'Medium', value: medium, color: '#eab308' },
    { name: 'Low', value: low, color: '#3b82f6' },
  ].filter((d) => d.value > 0)

  const total = critical + high + medium + low

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-xs dark:shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Severity Breakdown</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Distribution of defects by risk category</p>
        </div>
        <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
          {total} Total
        </span>
      </div>

      <div className="mt-4 h-64 w-full">
        {total === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">
            No defect findings recorded.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke={isDark ? '#0f172a' : '#ffffff'}
                    strokeWidth={2}
                  />
                ))}
              </Pie>
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
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b' }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
