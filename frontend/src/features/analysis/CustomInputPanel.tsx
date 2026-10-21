import React from 'react'
import { Terminal, Trash2, RotateCcw, Keyboard, Check, Sparkles } from 'lucide-react'

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

  const applyPreset = (presetText: string) => {
    onChange(presetText)
  }

  return (
    <div
      className={`rounded-2xl border border-slate-800/90 bg-slate-900/70 p-4 shadow-xl backdrop-blur-md transition-colors ${className}`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-sm shadow-emerald-500/10">
            <Terminal className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide">Custom Input (stdin)</span>
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                Runtime Stdin
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Piped directly into standard input for <code>Scanner</code>, <code>input()</code>, <code>cin</code>, and <code>scanf</code>.
            </p>
          </div>
        </div>

        {/* Action Controls & Presets */}
        <div className="flex items-center gap-2">
          {/* Preset Buttons for Quick Testing */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px]">
            <span className="text-slate-500 font-medium mr-0.5">Presets:</span>
            <button
              type="button"
              onClick={() => applyPreset('Krishna\n21')}
              disabled={disabled}
              className="rounded-lg border border-slate-700/80 bg-slate-800/70 px-2 py-1 text-slate-300 hover:border-emerald-500/40 hover:bg-slate-700 hover:text-white transition disabled:opacity-50 cursor-pointer shadow-xs"
              title="Preset: Name 'Krishna' on line 1, Age '21' on line 2 (Python input() / Java Scanner)"
            >
              Krishna / 21
            </button>
            <button
              type="button"
              onClick={() => applyPreset('10 20')}
              disabled={disabled}
              className="rounded-lg border border-slate-700/80 bg-slate-800/70 px-2 py-1 text-slate-300 hover:border-emerald-500/40 hover:bg-slate-700 hover:text-white transition disabled:opacity-50 cursor-pointer shadow-xs"
              title="Preset: Two space-separated integers (10 20 for C/C++ scanf/cin)"
            >
              10 20
            </button>
            <button
              type="button"
              onClick={() => applyPreset('5 7')}
              disabled={disabled}
              className="rounded-lg border border-slate-700/80 bg-slate-800/70 px-2 py-1 text-slate-300 hover:border-emerald-500/40 hover:bg-slate-700 hover:text-white transition disabled:opacity-50 cursor-pointer shadow-xs"
              title="Preset: Two space-separated integers (5 7 for Java/C++ addition)"
            >
              5 7
            </button>
            <button
              type="button"
              onClick={() => applyPreset('5\n10 20 30 40 50')}
              disabled={disabled}
              className="rounded-lg border border-slate-700/80 bg-slate-800/70 px-2 py-1 text-slate-300 hover:border-emerald-500/40 hover:bg-slate-700 hover:text-white transition disabled:opacity-50 cursor-pointer shadow-xs"
              title="Preset: Array size 5 on line 1, followed by 5 numbers (Array Sum)"
            >
              Array (10-50)
            </button>
          </div>

          {/* Clear Input Button */}
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled || !value}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-300 hover:border-rose-500/40 hover:bg-slate-800 hover:text-rose-400 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
            title="Clear the standard input buffer"
          >
            <Trash2 className="h-3 w-3" />
            <span>Clear Input</span>
          </button>
        </div>
      </div>

      {/* Input Textarea Area */}
      <div className="mt-3">
        <textarea
          id="custom-stdin-input"
          name="custom-stdin-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={4}
          placeholder={`Enter runtime standard input (stdin) for your program...\n• Multiline: Enter values on separate lines (e.g. Krishna\\n21 for Python/Java)\n• Space-separated: Enter values on a single line (e.g. 10 20 for C scanf or C++ cin)\n• Array: Size on line 1, elements on line 2 (e.g. 5\\n10 20 30 40 50)`}
          className="w-full rounded-xl border border-slate-800 bg-slate-950/90 p-3 font-mono text-xs text-slate-100 placeholder-slate-600 shadow-inner transition focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 focus:outline-none disabled:opacity-50 leading-relaxed selection:bg-emerald-600/40"
        />
      </div>

      {/* Footer Info & Telemetry */}
      <div className="mt-2 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-3">
          <span className="font-mono">
            Lines: <strong className="text-slate-200">{lineCount}</strong>
          </span>
          <span className="text-slate-600">•</span>
          <span className="font-mono">
            Characters: <strong className="text-slate-200">{charCount}</strong>
          </span>
          {value.trim() && (
            <>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 flex items-center gap-1 font-medium">
                <Check className="h-3 w-3" /> Input Ready
              </span>
            </>
          )}
        </div>

        <div className="text-[11px] text-slate-500 italic">
          Input is preserved across runs. Click &quot;Run Code&quot; to execute with this input.
        </div>
      </div>
    </div>
  )
}
