import React from 'react'
import { Terminal, Trash2, Check } from 'lucide-react'

interface CustomInputPanelProps {
  value: string
  onChange: (val: string) => void
  disabled?: boolean
  language?: string
  className?: string
}

export const CustomInputPanel: React.FC<CustomInputPanelProps> = ({
  value,
  onChange,
  disabled = false,
  language = 'python',
  className = '',
}) => {
  const lineCount = value ? value.split('\n').length : 0
  const charCount = value ? value.length : 0

  const handleClear = () => {
    onChange('')
  }

  return (
    <div
      className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-3.5 shadow-lg dark:shadow-xl backdrop-blur-md transition-all ${className}`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-xs">
            <Terminal className="h-3 w-3" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 dark:text-white tracking-wide">
              Custom Input (stdin)
            </span>
            <span className="rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
              Runtime Stdin
            </span>
          </div>
        </div>

        {/* Clear Input Button */}
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled || !value}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
          title="Clear the standard input buffer"
        >
          <Trash2 className="h-3 w-3" />
          <span>Clear</span>
        </button>
      </div>

      {/* Input Textarea Area */}
      <div className="mt-2.5">
        <textarea
          id="custom-stdin-input"
          name="custom-stdin-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={3}
          placeholder={`Enter runtime standard input (stdin) for your program...\nSupports multiline, spaces, numbers, and strings`}
          className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 font-mono text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 shadow-inner transition focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-950 focus:ring-1 focus:ring-emerald-500/40 focus:outline-none disabled:opacity-50 leading-relaxed selection:bg-emerald-500/30"
        />
      </div>

      {/* Footer Info & Telemetry */}
      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2.5">
          <span className="font-mono">
            Lines: <strong className="text-slate-700 dark:text-slate-200">{lineCount}</strong>
          </span>
          <span className="text-slate-400 dark:text-slate-600">•</span>
          <span className="font-mono">
            Chars: <strong className="text-slate-700 dark:text-slate-200">{charCount}</strong>
          </span>
          {value.trim() && (
            <>
              <span className="text-slate-400 dark:text-slate-600">•</span>
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                <Check className="h-3 w-3" /> Ready
              </span>
            </>
          )}
        </div>

        <span className="text-[10px] text-slate-400 dark:text-slate-500">
          Passed to stdin on Run
        </span>
      </div>
    </div>
  )
}
