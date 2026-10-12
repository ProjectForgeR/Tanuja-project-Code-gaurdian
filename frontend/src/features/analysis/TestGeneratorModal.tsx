import React, { useState } from 'react'
import {
  X,
  TestTube2,
  Copy,
  Check,
  Download,
  Terminal,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react'
import { Finding, TestResult } from '@/types/analysis'

interface TestGeneratorModalProps {
  finding?: Finding | null
  testResult: TestResult | null
  isLoading: boolean
  language: string
  onClose: () => void
  onFrameworkChange: (fw: string) => void
}

export const TestGeneratorModal: React.FC<TestGeneratorModalProps> = ({
  finding,
  testResult,
  isLoading,
  language,
  onClose,
  onFrameworkChange,
}) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (testResult?.tests_code) {
      navigator.clipboard.writeText(testResult.tests_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownload = () => {
    if (!testResult?.tests_code) return
    const ext =
      testResult.framework === 'pytest'
        ? '.py'
        : testResult.framework === 'jest'
        ? '.test.ts'
        : testResult.framework === 'junit5'
        ? '.java'
        : '_test.go'

    const blob = new Blob([testResult.tests_code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `test_security_regression${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm overflow-y-auto py-8 px-4">
      <div className="relative w-full max-w-4xl rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl flex flex-col my-auto">

        {/* Sticky Header */}
        <div className="flex items-start justify-between border-b border-slate-800 p-5 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 shrink-0">
              <TestTube2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white">Automated Unit Test Generator</h3>
                <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-purple-400 border border-purple-500/20 shrink-0">
                  {testResult?.framework || 'pytest'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                {finding
                  ? `Targeting regression guard for: ${finding.title}`
                  : `Generating test cases for ${language.toUpperCase()} module`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition ml-4 shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto p-5 max-h-[calc(100vh-12rem)]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
              <p className="mt-4 text-sm font-semibold text-white">Generating Test Suite...</p>
              <p className="mt-1 text-xs text-slate-400">
                Synthesizing boundary checks, malicious injection payloads, and regression guards.
              </p>
            </div>
          ) : testResult ? (
            <div className="space-y-4">

              {/* Framework Switcher & Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-slate-400">Framework:</span>
                  {['pytest', 'jest', 'junit5', 'testing'].map((fw) => (
                    <button
                      key={fw}
                      onClick={() => onFrameworkChange(fw)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        testResult.framework === fw
                          ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {fw}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copied!' : 'Copy Test'}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-purple-600/30 hover:bg-purple-500 transition"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download File
                  </button>
                </div>
              </div>

              {/* Test Code Viewer */}
              <div className="rounded-xl border border-slate-800 bg-[#0d0d14] overflow-hidden font-mono text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-4 py-2.5 text-[11px]">
                  <span className="text-slate-300 font-medium">test_security_regression</span>
                  <span className="flex items-center gap-1.5 text-purple-400">
                    <Terminal className="h-3 w-3" />
                    {testResult.run_command_hint}
                  </span>
                </div>
                {/* Fixed height code block - always shows ~14 lines */}
                <pre className="h-52 overflow-y-auto p-4 text-slate-200 leading-relaxed">
                  <code>{testResult.tests_code}</code>
                </pre>
              </div>

              {/* Test cases breakdown checklist */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-xs">
                <h5 className="font-bold text-slate-200 mb-3 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  Test Suite Coverage Breakdown:
                </h5>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {testResult.test_cases_breakdown.map((tc, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-slate-400">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{tc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Safety Sandbox Disclaimer */}
              <div className="flex items-start gap-2.5 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 text-[11px] text-slate-400">
                <ShieldCheck className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-300">Sandbox Policy:</strong> Tests are synthesized for review. Untrusted code is never executed directly on the host server. Run these tests locally in an isolated container or virtualenv.
                </span>
              </div>

            </div>
          ) : (
            <div className="py-10 text-center text-slate-400 text-sm">
              Failed to generate test cases. Please try again.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
