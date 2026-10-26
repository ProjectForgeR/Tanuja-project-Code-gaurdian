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
  ArrowLeft,
  Home,
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

  // Track scroll position to ensure flush top fitting on scroll down
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 4)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Generate initials from user's full name or email
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
      'from-blue-500 to-indigo-600',
      'from-violet-500 to-purple-600',
      'from-emerald-500 to-teal-600',
      'from-rose-500 to-pink-600',
      'from-amber-500 to-orange-600',
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
      className={`sticky top-0 left-0 right-0 z-50 w-full transition-all duration-200 ${
        isScrolled
          ? 'border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 shadow-sm backdrop-blur-xl'
          : 'border-b border-slate-200/80 dark:border-slate-800/40 bg-white/90 dark:bg-slate-950/70 backdrop-blur-md'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <a
          href="/"
          onClick={handleHomeClick}
          className="flex items-center gap-3 transition hover:opacity-95 group cursor-pointer"
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-[1px] shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-all">
            <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-white dark:bg-slate-950/90">
              <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-950 bg-emerald-400 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
              CodeGuardian<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-cyan-400 dark:to-blue-500">AI</span>
            </span>
            <span className="text-[10px] font-medium tracking-wider text-slate-500 dark:text-slate-400">
              Deterministic AST & Neural Security
            </span>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="navbar-pill-nav hidden items-center gap-1 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-900/80 p-1 md:flex select-none backdrop-blur-md">
          <button
            type="button"
            onClick={(e) => handleSectionClick(e, 'features')}
            className="nav-link-btn rounded-full px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors hover:text-blue-600 dark:hover:text-cyan-400 cursor-pointer"
          >
            Features
          </button>
          <button
            type="button"
            onClick={(e) => handleSectionClick(e, 'languages')}
            className="nav-link-btn rounded-full px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors hover:text-blue-600 dark:hover:text-cyan-400 cursor-pointer"
          >
            Solutions
          </button>
          <button
            type="button"
            onClick={(e) => handleSectionClick(e, 'how-it-works')}
            className="nav-link-btn rounded-full px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors hover:text-blue-600 dark:hover:text-cyan-400 cursor-pointer"
          >
            About
          </button>
          <a
            href="mailto:support@codeguardian.ai"
            className="nav-link-btn rounded-full px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors hover:text-blue-600 dark:hover:text-cyan-400 cursor-pointer"
          >
            Contact
          </a>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 text-slate-300 transition hover:border-slate-700 hover:bg-slate-800 hover:text-white cursor-pointer select-none shadow-sm"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400 transition-transform hover:rotate-45" />
            ) : (
              <Moon className="h-4 w-4 text-indigo-500 transition-transform hover:-rotate-12" />
            )}
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-2.5">
              {/* Dashboard button */}
              <Link
                to="/dashboard"
                className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-blue-600/90 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-blue-500/25 transition hover:bg-blue-500"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span>Dashboard</span>
              </Link>

              {/* User Avatar Circle with Dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  title={`Signed in as ${getDisplayName()}`}
                  className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${getAvatarGradient()} text-white font-bold text-xs shadow-lg ring-2 ring-offset-2 ring-offset-slate-950 transition hover:scale-105 ${userMenuOpen ? 'ring-white/40' : 'ring-transparent hover:ring-white/20'}`}
                >
                  {getInitials()}
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl shadow-black/40 overflow-hidden z-50">
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${getAvatarGradient()} text-white font-bold text-sm shrink-0`}>
                          {getInitials()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{user?.full_name || 'Developer'}</p>
                          <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                        </div>
                      </div>
                      {/* Online status indicator */}
                      <div className="mt-2.5 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] text-emerald-400 font-medium">Session Active</span>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="py-1.5">
                      <Link
                        to="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition"
                      >
                        <LayoutDashboard className="h-3.5 w-3.5 text-blue-400" />
                        Dashboard
                      </Link>
                      <Link
                        to="/history"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition"
                      >
                        <History className="h-3.5 w-3.5 text-violet-400" />
                        Analysis History
                      </Link>
                      <Link
                        to="/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition"
                      >
                        <Settings className="h-3.5 w-3.5 text-slate-400" />
                        Settings
                      </Link>
                    </div>

                    {/* Sign Out */}
                    <div className="border-t border-slate-800 py-1.5">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false)
                          logout()
                          navigate('/')
                        }}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition"
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
            <div className="flex items-center gap-2">
              <Link
                to="/signin"
                className="hidden sm:inline-flex rounded-xl border border-transparent px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-slate-800 hover:bg-slate-900 hover:text-white"
              >
                Sign In
              </Link>
              <Link
                to="/workspace"
                className="ui-button-lift inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/25 transition hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Get Started</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex md:hidden h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 text-slate-400 transition hover:text-white"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl px-4 py-4 space-y-2">
          <button
            type="button"
            onClick={(e) => {
              setMobileMenuOpen(false)
              handleSectionClick(e, 'features')
            }}
            className="w-full text-left rounded-xl px-3.5 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white"
          >
            Features
          </button>
          <button
            type="button"
            onClick={(e) => {
              setMobileMenuOpen(false)
              handleSectionClick(e, 'languages')
            }}
            className="w-full text-left rounded-xl px-3.5 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-900 hover:text-white"
          >
            Solutions
          </button>
          <button
            type="button"
            onClick={(e) => {
              setMobileMenuOpen(false)
              handleSectionClick(e, 'how-it-works')
            }}
            className="w-full text-left rounded-xl px-3.5 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-900 hover:text-white"
          >
            About
          </button>
          <a
            href="mailto:support@codeguardian.ai"
            onClick={() => setMobileMenuOpen(false)}
            className="block rounded-xl px-3.5 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-900 hover:text-white"
          >
            Contact
          </a>
          <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-2">
            <Link
              to="/workspace"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/25"
            >
              <span>Get Started</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              to="/signin"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-center rounded-xl px-3.5 py-2 text-xs font-medium text-cyan-400 transition hover:bg-slate-900"
            >
              Sign In
            </Link>
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between px-3.5 py-1">
            <span className="text-xs text-slate-400">Appearance</span>
            <button
              onClick={() => {
                toggleTheme()
                setMobileMenuOpen(false)
              }}
              className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium border border-slate-800 bg-slate-900/60 text-slate-300"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-3.5 w-3.5 text-amber-400" />
                  <span>Switch to Light</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Switch to Dark</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
