import React, { useState } from 'react'
import {
  TestTube2,
  Sparkles,
  Copy,
  Check,
  Download,
  Terminal,
  FileCode,
  ShieldCheck,
} from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { CodeEditor } from '@/features/analysis/CodeEditor'
import { analysisService } from '@/services/analysisService'
import { TestResult } from '@/types/analysis'

export const TestGeneratorPage: React.FC = () => {
  const [language, setLanguage] = useState('python')
  const [framework, setFramework] = useState('pytest')
  const [code, setCode] = useState(
    `def calculate_discount(price, discount_percent):\n    if discount_percent < 0 or discount_percent > 100:\n        raise ValueError("Invalid percentage")\n    return price * (1 - discount_percent / 100)\n`
  )
  const [isGenerating, setIsGenerating] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    if (!code.trim()) return
    setIsGenerating(true)
    try {
      const res = await analysisService.generateTests({
        code,
        language,
        framework,
      })
      setTestResult(res)
    } catch (err) {
      console.error(err)
    } finally {
      setIsGenerating(false)
    }
  }

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
      framework === 'pytest' ? '.py' : framework === 'jest' ? '.test.ts' : framework === 'junit5' ? '.java' : '_test.go'
    const blob = new Blob([testResult.tests_code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `test_generated_suite${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-y-auto">
        <div className="border-b border-slate-800 bg-slate-950/80 px-8 py-5 backdrop-blur-md">
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <TestTube2 className="h-5 w-5 text-purple-400" />
            Automatic Unit Test Generator
          </h1>
          <p className="text-xs text-slate-400">
            Synthesize unit tests, boundary conditions, edge cases, and security regression guards.
          </p>
        </div>

        <div className="p-8 space-y-6">
          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="font-semibold text-slate-400">Language:</span>
              <select
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value)
                  if (e.target.value === 'python') setFramework('pytest')
                  else if (e.target.value.includes('script')) setFramework('jest')
                  else if (e.target.value === 'java') setFramework('junit5')
                  else if (e.target.value === 'go') setFramework('testing')
                }}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-white focus:outline-none"
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="java">Java</option>
                <option value="go">Go</option>
              </select>

              <span className="font-semibold text-slate-400 ml-2">Framework:</span>
              <select
                value={framework}
                onChange={(e) => setFramework(e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-white focus:outline-none"
              >
                <option value="pytest">pytest (Python)</option>
                <option value="jest">Jest / Vitest (JS/TS)</option>
                <option value="junit5">JUnit 5 (Java)</option>
                <option value="testing">Go testing (Go)</option>
              </select>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-purple-600/30 hover:bg-purple-500 disabled:opacity-50 transition"
            >
              <Sparkles className="h-4 w-4" />
              {isGenerating ? 'Synthesizing...' : 'Generate Test Suite'}
            </button>
          </div>

          {/* Editors Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <div className="mb-2 text-xs text-slate-400 font-semibold">Source Code Under Test</div>
              <CodeEditor
                code={code}
                language={language}
                onChange={setCode}
                height="450px"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold">Synthesized Test Suite</span>
                {testResult && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="inline-flex items-center gap-1 hover:text-white transition"
                    >
                      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                    <button
                      onClick={handleDownload}
                      className="inline-flex items-center gap-1 hover:text-purple-400 transition ml-2"
                    >
                      <Download className="h-3 w-3" />
                      Download
                    </button>
                  </div>
                )}
              </div>

              <div className="h-[450px] overflow-hidden rounded-xl border border-slate-800 bg-slate-950 font-mono text-xs">
                {testResult ? (
                  <pre className="h-full overflow-y-auto p-4 text-slate-200">
                    <code>{testResult.tests_code}</code>
                  </pre>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center p-8 text-center text-slate-500">
                    <TestTube2 className="h-10 w-10 text-slate-700 mb-2" />
                    <p>Click &quot;Generate Test Suite&quot; to synthesize unit tests for the source code on the left.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
