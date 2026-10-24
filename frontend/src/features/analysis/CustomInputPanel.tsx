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
      className={`rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs transition-all ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/70 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 rounded-t-xl">
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-2 text-left cursor-pointer group"
          title={isCollapsed ? 'Expand Custom Input' : 'Collapse Custom Input'}
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 shadow-2xs">
            <Terminal className="h-3 w-3" />
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
            Custom Input (stdin)
          </span>
          <span className="rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
            Runtime Input
          </span>
          {isCollapsed ? (
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
          ) : (
            <ChevronUp className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
          )}
        </button>

        <div className="flex items-center gap-2">
          {value.trim() && (
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <Check className="h-3 w-3" />
              {lineCount} lines ready
            </span>
          )}

          {/* Clear Input Button */}
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled || !value}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:border-rose-300 dark:hover:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
            className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 font-mono text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 shadow-inner transition focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none disabled:opacity-50 leading-relaxed"
          />

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-0.5">
            <span className="font-mono text-[10px]">
              Lines: <strong className="text-slate-700 dark:text-slate-200">{lineCount}</strong> • Chars:{' '}
              <strong className="text-slate-700 dark:text-slate-200">{charCount}</strong>
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              Passed to stdin during program execution
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomInputPanel
