import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldCheck, Mail, Lock, User, AlertCircle, ArrowLeft, Loader2, CheckCircle2, Home } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'

export const SignUpPage: React.FC = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('Password must contain at least 6 characters.')
      return
    }

    setIsLoading(true)
    try {
      await register(email, password, name)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Registration failed.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-white dark:bg-slate-950 px-4 py-8 sm:py-12 overflow-y-auto text-slate-900 dark:text-slate-100">
      {/* Ambient background glow effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-36 left-1/2 -translate-x-1/2 h-[450px] w-[650px] rounded-full bg-gradient-to-tr from-blue-600/15 via-indigo-600/15 to-purple-600/15 blur-3xl" />
        <div className="absolute -bottom-36 right-1/4 h-[350px] w-[500px] rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      {/* Main Sign Up Card */}
      <div className="relative z-10 w-full max-w-[500px] rounded-[22px] border border-slate-200 dark:border-slate-800/90 bg-white dark:bg-slate-900/80 p-7 sm:p-9 shadow-2xl shadow-slate-200/50 dark:shadow-black/60 backdrop-blur-xl">
        {/* Top: Back and Home Buttons inside the card */}
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="group inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700/60 bg-slate-100 dark:bg-slate-800/40 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-white"
            title="Go back to previous page"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-blue-500 transition-transform group-hover:-translate-x-0.5" />
            <span>Back</span>
          </button>
          <Link
            to="/"
            className="group inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700/60 bg-slate-100 dark:bg-slate-800/40 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-white"
            title="Go to Home page"
          >
            <Home className="h-3.5 w-3.5 text-blue-500" />
            <span>Home</span>
          </Link>
        </div>

        {/* Brand Logo & Heading centered beneath the Back to Home button */}
        <div className="text-center">
          <Link to="/" className="inline-flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 shadow-lg shadow-blue-500/25 transition-transform duration-200 hover:scale-105">
              <ShieldCheck className="h-7 w-7 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              CodeGuardian<span className="text-blue-400">AI</span>
            </span>
          </Link>

          <h1 className="mt-5 text-2xl font-bold tracking-tight text-white">
            Create your account
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-400">
            Start testing code, fixing bugs, and securing your applications
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="mt-6 flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-400 animate-in fade-in duration-200"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Sign Up Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="signup-name"
              className="block text-xs font-semibold text-slate-300"
            >
              Full Name
            </label>
            <div className="relative mt-1.5">
              <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                id="signup-name"
                type="text"
                required
                placeholder="Ada Lovelace"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="signup-email"
              className="block text-xs font-semibold text-slate-300"
            >
              Email Address
            </label>
            <div className="relative mt-1.5">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                id="signup-email"
                type="email"
                required
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="signup-password"
              className="block text-xs font-semibold text-slate-300"
            >
              Password (min. 6 characters)
            </label>
            <div className="relative mt-1.5">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                id="signup-password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:from-blue-500 hover:to-purple-500 hover:shadow-blue-500/40 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link
            to="/signin"
            className="font-semibold text-blue-400 hover:text-blue-300 transition"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
export default SignUpPage
