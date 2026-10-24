import React, { useState } from 'react'
import { Terminal, Trash2, Check, ChevronDown, ChevronUp } from 'lucide-react'

interface CustomInputPanelProps {
  value: string
  onChange: (val: string) => void
  disabled?: boolean
  language?: string
  className?: string
  defaultCollapsed?: boolean
}

export const CustomInputPanel: React.FC<CustomInputPanelProps> = ({
  value,
  onChange,
  disabled = false,
  language = 'python',
  className = '',
  defaultCollapsed = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)

  const lineCount = value ? value.split('\n').length : 0
  const charCount = value ? value.length : 0

  const handleClear = () => {
    onChange('')
  }

  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white shadow-xs transition-all ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/70 border-b border-slate-200 rounded-t-xl">
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-2 text-left cursor-pointer group"
          title={isCollapsed ? 'Expand Custom Input' : 'Collapse Custom Input'}
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 shadow-2xs">
            <Terminal className="h-3 w-3" />
          </div>
          <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition">
            Custom Input (stdin)
          </span>
          <span className="rounded-md bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
            Runtime Input
          </span>
          {isCollapsed ? (
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600" />
          ) : (
            <ChevronUp className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600" />
          )}
        </button>

        <div className="flex items-center gap-2">
          {value.trim() && (
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <Check className="h-3 w-3" />
              {lineCount} lines ready
            </span>
          )}

          {/* Clear Input Button */}
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled || !value}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Clear the standard input buffer"
          >
            <Trash2 className="h-3 w-3" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      {!isCollapsed && (
        <div className="p-3 space-y-2">
          <textarea
            id="custom-stdin-input"
            name="custom-stdin-input"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            rows={3}
            placeholder={`Enter runtime standard input (stdin) for ${language.toUpperCase()}...\nSupports multiline, spaces, numbers, and strings`}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 font-mono text-xs text-slate-900 placeholder-slate-400 shadow-inner transition focus:border-blue-500 focus:bg-white focus:outline-none disabled:opacity-50 leading-relaxed"
          />

          <div className="flex items-center justify-between text-[11px] text-slate-500 px-0.5">
            <span className="font-mono text-[10px]">
              Lines: <strong className="text-slate-700">{lineCount}</strong> • Chars:{' '}
              <strong className="text-slate-700">{charCount}</strong>
            </span>
            <span className="text-[10px] text-slate-400">
              Passed to stdin during program execution
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomInputPanel
