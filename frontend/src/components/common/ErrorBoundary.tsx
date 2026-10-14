import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallbackTitle?: string
  fallbackMessage?: string
  onReset?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full min-h-[220px] w-full flex-col items-center justify-center rounded-xl border border-red-500/30 bg-slate-900/90 p-6 text-center text-slate-200 shadow-xl backdrop-blur-md">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15 text-red-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-white">
            {this.props.fallbackTitle || 'Component Rendering Error'}
          </h3>
          <p className="mt-1 max-w-md text-xs text-slate-400">
            {this.props.fallbackMessage ||
              'A rendering issue occurred in this panel. The rest of the application remains fully active.'}
          </p>
          {this.state.error?.message && (
            <div className="mt-3 max-w-md rounded-lg border border-red-900/40 bg-red-950/40 px-3 py-1.5 font-mono text-[11px] text-red-300">
              {this.state.error.message}
            </div>
          )}
          <button
            type="button"
            onClick={this.handleReset}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 hover:text-white cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Retry Component</span>
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
