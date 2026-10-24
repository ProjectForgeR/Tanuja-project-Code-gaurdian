import React from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import {
  ShieldCheck,
  LayoutDashboard,
  Terminal,
  History,
  ShieldAlert,
  TestTube2,
  Settings,
  BookOpen,
  LogOut,
  Sparkles,
  Home,
  ArrowLeft,
} from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'
import { cn } from '@/lib/utils'

export const Sidebar: React.FC = () => {
  const { user, isDemoUser, logout } = useAuth()
  const navigate = useNavigate()

  const navItems = [
    { name: 'Home', to: '/', icon: Home },
    { name: 'Overview', to: '/dashboard', icon: LayoutDashboard },
    { name: 'New Analysis', to: '/workspace', icon: Terminal, highlight: true },
    { name: 'Analysis History', to: '/history', icon: History },
    { name: 'Vulnerabilities', to: '/vulnerabilities', icon: ShieldAlert },
    { name: 'Test Generator', to: '/test-generator', icon: TestTube2 },
    { name: 'Settings', to: '/settings', icon: Settings },
    { name: 'Help & Docs', to: '/docs', icon: BookOpen },
  ]

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-5 shrink-0 transition-colors">
      {/* Brand */}
      <Link to="/" className="mb-4 flex items-center gap-3 px-2 transition hover:opacity-90">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 shadow-md shadow-blue-500/20">
          <ShieldCheck className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
            CodeGuardian<span className="text-blue-600 dark:text-blue-400">AI</span>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">Enterprise Audit</div>
        </div>
      </Link>

      {/* Quick Navigation: Back & Home */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-2xs cursor-pointer"
          title="Go back to previous page"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-blue-600" />
          <span>Back</span>
        </button>
        <Link
          to="/"
          className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-2xs cursor-pointer"
          title="Go to Home page"
        >
          <Home className="h-3.5 w-3.5 text-blue-600" />
          <span>Home</span>
        </Link>
      </div>

      {/* Quick Analyze Button */}
      <Link
        to="/workspace"
        className="mb-6 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
      >
        <Sparkles className="h-4 w-4" />
        Quick Analyze
      </Link>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium transition cursor-pointer select-none',
                isActive
                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200'
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0 transition group-hover:text-blue-600" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* User profile & Sign out */}
      <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
        {isDemoUser && (
          <div className="mb-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-center text-[11px] font-medium text-amber-700">
            Guest Demo Mode
          </div>
        )}
        <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-900/60 p-2.5 border border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-600 border border-indigo-200">
              {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden">
              <div className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                {user?.full_name || 'Developer'}
              </div>
              <div className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                {user?.email || 'user@codeguardian.ai'}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              logout()
              navigate('/')
            }}
            title="Sign out"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
