import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Search, ChevronDown, Check } from 'lucide-react'
import { LANGUAGE_CONFIG, LANGUAGE_GROUPS, LanguageConfig } from '@/lib/languages'

export interface LanguageSelectorProps {
  value: string
  onChange: (lang: string) => void
  className?: string
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const currentLang: LanguageConfig | undefined = LANGUAGE_CONFIG[value] || {
    id: value,
    label: value.toUpperCase(),
    icon: '📄',
    monacoLang: value,
    extensions: [],
    color: '#64748B',
    group: 'Other',
  }

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      // Delay slightly for render animation / layout
      const timer = setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    } else {
      setSearchQuery('')
    }
  }, [isOpen])

  // Filter languages by search query
  const filteredGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return LANGUAGE_GROUPS

    return LANGUAGE_GROUPS.map((group) => {
      const filtered = group.languages.filter(
        (lang) =>
          lang.label.toLowerCase().includes(query) ||
          lang.id.toLowerCase().includes(query) ||
          lang.extensions.some((ext) => ext.toLowerCase().includes(query))
      )
      return {
        ...group,
        languages: filtered,
      }
    }).filter((group) => group.languages.length > 0)
  }, [searchQuery])

  const handleSelect = (langId: string) => {
    onChange(langId)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex min-w-[170px] items-center justify-between gap-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs transition hover:border-slate-300 dark:hover:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
      >
        <span className="flex items-center gap-2 truncate">
          <span className="text-sm leading-none" role="img" aria-hidden="true">
            {currentLang.icon}
          </span>
          <span className="truncate">{currentLang.label}</span>
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-64 origin-top-left rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-xl ring-1 ring-slate-900/5 dark:ring-white/10">
          {/* Search Input */}
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter languages..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 py-1.5 pl-8 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Languages grouped list */}
          <div className="max-h-64 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-slate-300">
            {filteredGroups.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">
                No languages found
              </div>
            ) : (
              filteredGroups.map((group) => (
                <div key={group.name} className="space-y-1">
                  <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {group.name}
                  </div>
                  <div className="space-y-0.5">
                    {group.languages.map((lang) => {
                      const isSelected = lang.id === value
                      return (
                        <button
                          key={lang.id}
                          type="button"
                          onClick={() => handleSelect(lang.id)}
                          className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs font-medium transition cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <span className="flex items-center gap-2 truncate">
                            <span className="text-sm leading-none" role="img" aria-hidden="true">
                              {lang.icon}
                            </span>
                            <span className="truncate">{lang.label}</span>
                          </span>
                          {isSelected && (
                            <Check className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
export default LanguageSelector
