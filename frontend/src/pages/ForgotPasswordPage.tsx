import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, Mail, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react'
import { authService } from '@/services/authService'

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await authService.forgotPassword(email)
      setSubmitted(true)
    } catch (err) {
      console.error(err)
      setSubmitted(true)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-slate-950 px-4 py-8 sm:py-12 overflow-y-auto text-slate-100">
      {/* Ambient background glow effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-36 left-1/2 -translate-x-1/2 h-[450px] w-[650px] rounded-full bg-gradient-to-tr from-blue-600/15 via-indigo-600/15 to-purple-600/15 blur-3xl" />
        <div className="absolute -bottom-36 right-1/4 h-[350px] w-[500px] rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-[500px] rounded-[22px] border border-slate-800/90 bg-slate-900/80 p-7 sm:p-9 shadow-2xl shadow-black/60 backdrop-blur-xl">
        {/* Top: Back to Home Button aligned to the left inside the card */}
        <div className="mb-6 flex items-center justify-start">
          <Link
            to="/"
            className="group inline-flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-1.5 text-xs font-medium text-slate-300 backdrop-blur-sm transition-all duration-200 hover:border-blue-500/50 hover:bg-slate-800/80 hover:text-white hover:shadow-sm hover:shadow-blue-500/10 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            title="Return to Home page"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-blue-400 transition-transform duration-200 group-hover:-translate-x-0.5" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Brand Logo & Heading */}
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
            Reset Password
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-400">
            Enter your email to receive password recovery instructions
          </p>
        </div>

        {submitted ? (
          <div className="mt-6 space-y-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center text-xs">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
            <p className="text-slate-200">
              If an account matches <strong>{email}</strong>, a password recovery link has been dispatched to your inbox.
            </p>
            <div className="pt-2">
              <Link
                to="/signin"
                className="inline-flex items-center gap-1.5 font-semibold text-blue-400 hover:text-blue-300 transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Return to Sign In</span>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="forgot-email"
                className="block text-xs font-semibold text-slate-300"
              >
                Email Address
              </label>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  id="forgot-email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  <span>Sending Instructions...</span>
                </>
              ) : (
                <span>Send Reset Link</span>
              )}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-xs text-slate-400">
          Remembered your password?{' '}
          <Link
            to="/signin"
            className="font-semibold text-blue-400 hover:text-blue-300 transition"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
export default ForgotPasswordPage
