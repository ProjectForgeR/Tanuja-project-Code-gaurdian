import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Settings as SettingsIcon,
  User,
  Moon,
  Sun,
  Shield,
  Key,
  Database,
  Trash2,
  Check,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  Home,
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
  const [aiProvider, setAiProvider] = useState('gemini')
  const [aiModel, setAiModel] = useState('gemini-1.5-pro')
  const [geminiKey, setGeminiKey] = useState('')
  const [openaiKey, setOpenaiKey] = useState('')
  const [retentionDays, setRetentionDays] = useState(30)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const s = await settingsService.getSettings()
        setSettings(s)
        setDefaultLang(s.default_language)
        setRealtime(s.realtime_analysis)
        setDebounceDelay(s.debounce_delay_ms)
        setAiProvider(s.ai_provider)
        setAiModel(s.ai_model_name)
        setRetentionDays(s.data_retention_days)
      } catch (err) {
        console.error(err)
      }
    }
    load()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const updated = await settingsService.updateSettings({
        theme,
        default_language: defaultLang,
        realtime_analysis: realtime,
        debounce_delay_ms: debounceDelay,
        ai_provider: aiProvider,
        ai_model_name: aiModel,
        data_retention_days: retentionDays,
        gemini_api_key: geminiKey || undefined,
        openai_api_key: openaiKey || undefined,
      })
      setSettings(updated)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error('Failed to save settings:', err)
    }
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-y-auto">
        <div className="border-b border-slate-800 bg-slate-950/80 px-8 py-5 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Back & Home Navigation Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer shadow-sm"
                  title="Go back to previous page"
                >
                  <ArrowLeft className="h-3.5 w-3.5 text-blue-500" />
                  <span>Back</span>
                </button>
                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer shadow-sm"
                  title="Go to Home page"
                >
                  <Home className="h-3.5 w-3.5 text-blue-500" />
                  <span>Home</span>
                </Link>
              </div>

              <div>
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
                  <SettingsIcon className="h-5 w-5 text-blue-400" />
                  System & Engine Settings
                </h1>
                <p className="text-xs text-slate-400">
                  Configure analysis thresholds, theme, server-side AI provider credentials, and data retention.
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
                  value={user?.email || 'developer@codeguardian.ai'}
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-slate-400"
                />
              </div>
              <div>
                <label className="text-slate-400 font-semibold">Full Name / Alias</label>
                <input
                  type="text"
                  disabled
                  value={user?.full_name || 'Alex Mercer'}
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
                    className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 font-semibold text-slate-200 hover:bg-slate-800 transition"
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
                  <option value="go">Go</option>
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

          {/* AI Provider Configuration */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-400" />
                AI Provider Integration (Optional)
              </h3>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                settings?.ai_provider_configured
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {settings?.ai_provider_configured ? 'API Connected' : 'Static Fallback Mode'}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              When an AI API key is configured, CodeGuardian combines deterministic static analyzers (Python AST & Bandit) with LLM semantic reasoning and generates custom unit test suites.
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
              <div>
                <label className="text-slate-400 font-semibold">Active Provider</label>
                <select
                  value={aiProvider}
                  onChange={(e) => setAiProvider(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none"
                >
                  <option value="gemini">Google Gemini</option>
                  <option value="openai">OpenAI</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-semibold">Target Model</label>
                <input
                  type="text"
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  placeholder="gemini-1.5-pro or gpt-4o-mini"
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="col-span-full">
                <label className="text-slate-400 font-semibold flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5" />
                  {aiProvider === 'gemini' ? 'Gemini API Key' : 'OpenAI API Key'}
                </label>
                <input
                  type="password"
                  placeholder="Paste API Key here (securely processed on server)..."
                  value={aiProvider === 'gemini' ? geminiKey : openaiKey}
                  onChange={(e) =>
                    aiProvider === 'gemini'
                      ? setGeminiKey(e.target.value)
                      : setOpenaiKey(e.target.value)
                  }
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
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
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition"
            >
              Sign Out
            </button>

            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-7 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/25 hover:from-blue-500 hover:to-indigo-500 transition"
            >
              Save Changes
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
