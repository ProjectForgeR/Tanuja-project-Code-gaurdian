import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Settings as SettingsIcon,
  User,
  Moon,
  Database,
  Check,
  AlertCircle,
} from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { useAuth } from '@/features/auth/AuthContext'
import { useTheme } from '@/features/theme/ThemeContext'
import { settingsService } from '@/services/settingsService'
import { AppSettings } from '@/types/settings'

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [defaultLang, setDefaultLang] = useState('python')
  const [realtime, setRealtime] = useState(true)
  const [debounceDelay, setDebounceDelay] = useState(800)
  const [retentionDays, setRetentionDays] = useState(30)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    async function load() {
      // 1. Load from localStorage if present
      const savedLang = localStorage.getItem('cg_default_lang')
      const savedDebounce = localStorage.getItem('cg_debounce_delay')
      const savedRetention = localStorage.getItem('cg_retention_days')
      if (savedLang) setDefaultLang(savedLang)
      if (savedDebounce) setDebounceDelay(Number(savedDebounce))
      if (savedRetention) setRetentionDays(Number(savedRetention))

      // 2. Fetch from backend if available
      try {
        const s = await settingsService.getSettings()
        setSettings(s)
        if (s.default_language) setDefaultLang(s.default_language)
        if (s.realtime_analysis !== undefined) setRealtime(s.realtime_analysis)
        if (s.debounce_delay_ms) setDebounceDelay(s.debounce_delay_ms)
        if (s.data_retention_days) setRetentionDays(s.data_retention_days)
      } catch (err) {
        console.warn('Settings load fallback to local values:', err)
      }
    }
    load()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSaveSuccess(false)

    // 1. Immediately persist user preferences locally so changes never fail
    try {
      localStorage.setItem('cg_default_lang', defaultLang)
      localStorage.setItem('cg_debounce_delay', String(debounceDelay))
      localStorage.setItem('cg_retention_days', String(retentionDays))
    } catch (err) {
      console.warn('LocalStorage save failed:', err)
    }

    // 2. Synchronize with backend API
    try {
      const updated = await settingsService.updateSettings({
        theme,
        default_language: defaultLang,
        realtime_analysis: realtime,
        debounce_delay_ms: debounceDelay,
        data_retention_days: retentionDays,
      })
      if (updated) {
        setSettings(updated)
      }
    } catch (err) {
      console.warn('Settings API sync warning (saved locally):', err)
    } finally {
      setIsSaving(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3500)
    }
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-y-auto">
        <div className="border-b border-slate-800 bg-slate-950/80 px-8 py-5 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
                  <SettingsIcon className="h-5 w-5 text-blue-400" />
                  System & Engine Settings
                </h1>
                <p className="text-xs text-slate-400">
                  Configure analysis thresholds, theme, default language, and data retention.
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-8 max-w-4xl space-y-6">
          {saveSuccess && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-400">
              <Check className="h-4 w-4" />
              Settings updated successfully!
            </div>
          )}

          {/* User Profile */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-md">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
              <User className="h-4 w-4 text-blue-400" />
              User Profile
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
              <div>
                <label className="text-slate-400 font-semibold">Email Address</label>
                <input
                  type="text"
                  disabled
                  value={user?.email || 'Not signed in'}
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-slate-400"
                />
              </div>
              <div>
                <label className="text-slate-400 font-semibold">Full Name / Alias</label>
                <input
                  type="text"
                  disabled
                  value={user?.full_name || 'Guest'}
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-md space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Moon className="h-4 w-4 text-purple-400" />
              Interface & Editor Preferences
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
              <div>
                <label className="text-slate-400 font-semibold">Theme Mode</label>
                <div className="mt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 font-semibold text-slate-200 hover:bg-slate-800 transition cursor-pointer"
                  >
                    Current: {theme === 'dark' ? 'Dark Navy' : 'Light Clean'} (Click to toggle)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-semibold">Default Workspace Language</label>
                <select
                  value={defaultLang}
                  onChange={(e) => setDefaultLang(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none"
                >
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                  <option value="c">C</option>
                  <option value="go">Go</option>
                  <option value="rust">Rust</option>
                  <option value="csharp">C#</option>
                  <option value="php">PHP</option>
                  <option value="html">HTML</option>
                  <option value="css">CSS</option>
                  <option value="sql">SQL</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-semibold">Real-Time Debounce Delay</label>
                <div className="mt-1 flex items-center gap-3">
                  <input
                    type="range"
                    min="400"
                    max="2000"
                    step="100"
                    value={debounceDelay}
                    onChange={(e) => setDebounceDelay(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="font-mono text-blue-400">{debounceDelay}ms</span>
                </div>
              </div>
            </div>
          </div>

          {/* Data Retention & Privacy */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-md space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-400" />
              Data Retention & Privacy
            </h3>
            <div className="text-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-300">Retention Horizon</span>
                  <p className="text-slate-500">Auto-purge analysis reports after specified days</p>
                </div>
                <select
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(Number(e.target.value))}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-white focus:outline-none"
                >
                  <option value={7}>7 Days</option>
                  <option value={30}>30 Days</option>
                  <option value={90}>90 Days</option>
                  <option value={365}>1 Year</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={logout}
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition cursor-pointer"
            >
              Sign Out
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-7 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/25 hover:from-blue-500 hover:to-indigo-500 transition disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Saving...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="h-4 w-4 text-white" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

export default SettingsPage
