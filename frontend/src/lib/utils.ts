import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Severity } from '@/types/analysis'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getSeverityBadge(severity: Severity) {
  switch (severity) {
    case 'Critical':
      return {
        bg: 'bg-red-500/10 text-red-400 border-red-500/30',
        dot: 'bg-red-500',
        text: 'text-red-400',
      }
    case 'High':
      return {
        bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        dot: 'bg-amber-500',
        text: 'text-amber-400',
      }
    case 'Medium':
      return {
        bg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
        dot: 'bg-yellow-400',
        text: 'text-yellow-400',
      }
    case 'Low':
      return {
        bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        dot: 'bg-blue-400',
        text: 'text-blue-400',
      }
    default:
      return {
        bg: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
        dot: 'bg-slate-400',
        text: 'text-slate-400',
      }
  }
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400'
  if (score >= 60) return 'text-amber-400'
  return 'text-red-400'
}

export function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return 'Recent'
  try {
    let normalized = dateStr
    if (!normalized.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(normalized)) {
      normalized += 'Z'
    }
    const d = new Date(normalized)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
  } catch {
    return dateStr
  }
}
