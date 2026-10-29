import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  ShieldCheck,
  Moon,
  Sun,
  LayoutDashboard,
  LogOut,
  Terminal,
  Menu,
  X,
  Settings,
  History,
  ArrowRight,
  Code2,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'
import { useTheme } from '@/features/theme/ThemeContext'

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getInitials = (): string => {
    if (!user) return '?'
    if (user.full_name) {
      const parts = user.full_name.trim().split(/\s+/)
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
      return parts[0].slice(0, 2).toUpperCase()
    }
    return user.email.slice(0, 2).toUpperCase()
  }

  const getDisplayName = (): string => {
    if (!user) return ''
    return user.full_name || user.email
  }

  const getAvatarGradient = (): string => {
    const initials = getInitials()
    const gradients = [
      'from-blue-600 to-cyan-500',
      'from-indigo-600 to-purple-600',
      'from-emerald-500 to-teal-500',
      'from-rose-500 to-pink-600',
      'from-cyan-500 to-blue-600',
    ]
    const idx = initials.charCodeAt(0) % gradients.length
    return gradients[idx]
  }

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setMobileMenuOpen(false)
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      navigate('/')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleSectionClick = (e: React.MouseEvent, targetId: string) => {
    e.preventDefault()
    setMobileMenuOpen(false)
    if (location.pathname === '/') {
      const el = document.getElementById(targetId)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
      }
    } else {
      navigate(`/#${targetId}`)
    }
  }

  return (
    <header
      className={`sticky top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? 'border-b border-slate-800/80 bg-[#030712]/90 backdrop-blur-xl shadow-xl shadow-black/30'
          : 'border-b border-slate-800/40 bg-[#030712]/75 backdrop-blur-md'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Name */}
        <a
          href="/"
          onClick={handleHomeClick}
          className="flex items-center gap-3 group cursor-pointer transition select-none"
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-cyan-500 to-indigo-600 p-[1.5px] shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 group-hover:scale-105 transition-all duration-200">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#0a0f1e]">
              <ShieldCheck className="h-5 w-5 text-cyan-400 group-hover:text-white transition-colors" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0a0f1e] bg-cyan-400 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                CodeGuardian
              </span>
              <span className="rounded-md bg-gradient-to-r from-blue-600 to-cyan-500 px-1.5 py-0.2 text-[10px] font-extrabold text-white tracking-wider shadow-sm">
                AI
              </span>
            </div>
            <span className="text-[10.5px] font-medium tracking-wide text-slate-400 font-mono">
              Intelligent Code Security
            </span>
          </div>
        </a>

        {/* Center Navigation Links (Pill Style) */}
        <nav className="hidden md:flex items-center gap-1 rounded-full border border-slate-800/80 bg-slate-900/60 p-1 backdrop-blur-xl select-none shadow-inner">
          <button
            type="button"
            onClick={(e) => handleSectionClick(e, 'features')}
            className="rounded-full px-4 py-1.5 text-xs font-semibold text-slate-300 hover:text-cyan-300 hover:bg-slate-800/80 transition-all cursor-pointer"
          >
            Features
          </button>
          <button
            type="button"
            onClick={(e) => handleSectionClick(e, 'languages')}
            className="rounded-full px-4 py-1.5 text-xs font-semibold text-slate-300 hover:text-cyan-300 hover:bg-slate-800/80 transition-all cursor-pointer"
          >
            Languages
          </button>
          <button
            type="button"
            onClick={(e) => handleSectionClick(e, 'how-it-works')}
            className="rounded-full px-4 py-1.5 text-xs font-semibold text-slate-300 hover:text-cyan-300 hover:bg-slate-800/80 transition-all cursor-pointer"
          >
            Workflow
          </button>
          <Link
            to="/workspace"
            className="rounded-full px-4 py-1.5 text-xs font-semibold text-slate-300 hover:text-cyan-300 hover:bg-slate-800/80 transition-all cursor-pointer flex items-center gap-1"
          >
            <Code2 className="h-3 w-3 text-cyan-400" />
            <span>Workspace</span>
          </Link>
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle visual theme"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/70 text-slate-300 transition hover:border-cyan-500/40 hover:bg-slate-800 hover:text-cyan-400 cursor-pointer shadow-sm"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400 transition-transform hover:rotate-45" />
            ) : (
              <Moon className="h-4 w-4 text-cyan-400 transition-transform hover:-rotate-12" />
            )}
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-2.5">
              {/* Dashboard Link Button */}
              <Link
                to="/dashboard"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 px-3.5 py-2 text-xs font-semibold text-blue-300 transition shadow-sm"
              >
                <LayoutDashboard className="h-3.5 w-3.5 text-cyan-400" />
                <span>Dashboard</span>
              </Link>

              {/* User Avatar Circle with Dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  title={`Signed in as ${getDisplayName()}`}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${getAvatarGradient()} text-white font-bold text-xs shadow-md ring-2 ring-offset-2 ring-offset-[#030712] transition hover:scale-105 cursor-pointer ${
                    userMenuOpen ? 'ring-cyan-400/80' : 'ring-transparent hover:ring-cyan-500/40'
                  }`}
                >
                  {getInitials()}
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-slate-800 bg-[#0c1222] shadow-2xl shadow-black/80 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-900/40">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${getAvatarGradient()} text-white font-bold text-sm shrink-0 shadow-sm`}>
                          {getInitials()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{user?.full_name || 'Developer'}</p>
                          <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                        </div>
                      </div>
                      <div className="mt-2.5 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        <span className="text-[10px] text-cyan-400 font-mono font-medium">Session Authenticated</span>
                      </div>
                    </div>

                    <div className="py-1.5">
                      <Link
                        to="/workspace"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-800/80 hover:text-cyan-300 transition"
                      >
                        <Code2 className="h-3.5 w-3.5 text-cyan-400" />
                        Code Workspace
                      </Link>
                      <Link
                        to="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-800/80 hover:text-cyan-300 transition"
                      >
                        <LayoutDashboard className="h-3.5 w-3.5 text-blue-400" />
                        Dashboard
                      </Link>
                      <Link
                        to="/history"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-800/80 hover:text-cyan-300 transition"
                      >
                        <History className="h-3.5 w-3.5 text-purple-400" />
                        Analysis History
                      </Link>
                      <Link
                        to="/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-800/80 hover:text-cyan-300 transition"
                      >
                        <Settings className="h-3.5 w-3.5 text-slate-400" />
                        Settings
                      </Link>
                    </div>

                    <div className="border-t border-slate-800/80 py-1.5 bg-slate-900/20">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false)
                          logout()
                          navigate('/')
                        }}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                to="/signin"
                className="hidden sm:inline-flex rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white transition"
              >
                Sign In
              </Link>
              <Link
                to="/workspace"
                className="cg-btn-primary px-4 py-2 text-xs font-bold"
              >
                <span>Launch Workspace</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex md:hidden h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white transition cursor-pointer"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-[#080d1a]/95 backdrop-blur-2xl px-4 py-4 space-y-2 shadow-2xl">
          <button
            type="button"
            onClick={(e) => {
              setMobileMenuOpen(false)
              handleSectionClick(e, 'features')
            }}
            className="w-full text-left rounded-xl px-3.5 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            Features
          </button>
          <button
            type="button"
            onClick={(e) => {
              setMobileMenuOpen(false)
              handleSectionClick(e, 'languages')
            }}
            className="w-full text-left rounded-xl px-3.5 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            Languages
          </button>
          <button
            type="button"
            onClick={(e) => {
              setMobileMenuOpen(false)
              handleSectionClick(e, 'how-it-works')
            }}
            className="w-full text-left rounded-xl px-3.5 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            Workflow
          </button>
          <Link
            to="/workspace"
            onClick={() => setMobileMenuOpen(false)}
            className="block rounded-xl px-3.5 py-2 text-sm font-medium text-cyan-400 hover:bg-slate-800 transition"
          >
            Open Code Workspace
          </Link>
          <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-2">
            <Link
              to="/workspace"
              onClick={() => setMobileMenuOpen(false)}
              className="cg-btn-primary w-full py-2.5 text-xs text-center"
            >
              <span>Launch Workspace</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            {!isAuthenticated && (
              <Link
                to="/signin"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center rounded-xl px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
