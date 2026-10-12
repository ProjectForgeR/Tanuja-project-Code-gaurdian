import React from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'

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
  const data = [
    { name: 'Critical', value: critical, color: '#ef4444' },
    { name: 'High', value: high, color: '#f97316' },
    { name: 'Medium', value: medium, color: '#eab308' },
    { name: 'Low', value: low, color: '#3b82f6' },
  ].filter((d) => d.value > 0)

  const total = critical + high + medium + low

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div>
          <h3 className="text-sm font-bold text-white">Severity Breakdown</h3>
          <p className="text-[11px] text-slate-400">Distribution of defects by risk category</p>
        </div>
        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-300">
          {total} Total
        </span>
      </div>

      <div className="mt-4 h-64 w-full">
        {total === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-slate-500">
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
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0b0f19',
                  borderColor: '#1e293b',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  color: '#fff',
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
