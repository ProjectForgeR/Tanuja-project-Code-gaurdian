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
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 backdrop-blur-xs overflow-y-auto py-8 px-4">
      <div className="relative w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col my-auto">
        {/* Sticky Header */}
        <div className="flex items-start justify-between border-b border-slate-200 p-5 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-200 shrink-0">
              <TestTube2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900">Automated Unit Test Generator</h3>
                <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-[10px] font-semibold text-purple-700 border border-purple-200 shrink-0">
                  {testResult?.framework || 'pytest'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                {finding
                  ? `Targeting regression guard for: ${finding.title}`
                  : `Generating test cases for ${language.toUpperCase()} module`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition ml-4 shrink-0 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto p-5 max-h-[calc(100vh-12rem)]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-10 w-10 animate-spin rounded-full border-3 border-purple-600 border-t-transparent" />
              <p className="mt-4 text-sm font-bold text-slate-900">Generating Test Suite...</p>
              <p className="mt-1 text-xs text-slate-500">
                Synthesizing boundary checks, malicious injection payloads, and regression guards.
              </p>
            </div>
          ) : testResult ? (
            <div className="space-y-4">
              {/* Framework Switcher & Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Framework:</span>
                  {['pytest', 'jest', 'junit5', 'testing'].map((fw) => (
                    <button
                      key={fw}
                      onClick={() => onFrameworkChange(fw)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                        testResult.framework === fw
                          ? 'bg-purple-600 text-white shadow-2xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      {fw}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
                    {copied ? 'Copied!' : 'Copy Test'}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-purple-700 transition cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download File
                  </button>
                </div>
              </div>

              {/* Test Code Viewer */}
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden font-mono text-xs shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-[11px]">
                  <span className="text-slate-700 font-semibold">test_security_regression</span>
                  <span className="flex items-center gap-1.5 text-purple-700 font-medium">
                    <Terminal className="h-3 w-3" />
                    {testResult.run_command_hint}
                  </span>
                </div>
                <pre className="h-52 overflow-y-auto p-4 text-slate-800 leading-relaxed bg-slate-50/50">
                  <code>{testResult.tests_code}</code>
                </pre>
              </div>

              {/* Test cases breakdown checklist */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs">
                <h5 className="font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Test Suite Coverage Breakdown:
                </h5>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {testResult.test_cases_breakdown.map((tc, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-slate-700">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{tc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Safety Sandbox Disclaimer */}
              <div className="flex items-start gap-2.5 rounded-lg border border-blue-200 bg-blue-50/70 p-3 text-[11px] text-slate-600">
                <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-800">Sandbox Policy:</strong> Tests are synthesized for review. Untrusted code is never executed directly on the host server. Run these tests locally in an isolated container or virtualenv.
                </span>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-slate-500 text-sm">
              Failed to generate test cases. Please try again.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
export default TestGeneratorModal
