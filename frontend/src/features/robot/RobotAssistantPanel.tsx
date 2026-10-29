import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  Send,
  X,
  Minimize2,
  Maximize2,
  HelpCircle,
  ArrowRight,
} from 'lucide-react'
import { RobotMood } from './CodeGuardianRobot'

interface Message {
  id: string
  sender: 'robot' | 'user'
  text: string
  action?: {
    label: string
    route: string
  }
}

interface RobotAssistantPanelProps {
  onClose: () => void
  onMinimize: () => void
  isExpanded?: boolean
  onToggleExpand?: () => void
}

const FAQ_QUESTIONS = [
  'How can I find bugs in my code?',
  'How do I fix a Python error?',
  'Can I check my code for security issues?',
  'How does CodeGuardian AI work?',
]

const KNOWLEDGE_BASE: Record<
  string,
  {
    answer: string
    action?: { label: string; route: string }
  }
> = {
  'How can I find bugs in my code?': {
    answer:
      `You can find bugs instantly using CodeGuardian's multi-layered AST static analysis! Here is how:\n\n` +
      `1. Open the **Code Workspace** in your browser.\n` +
      `2. Select your programming language (Python, JavaScript, TypeScript, Java, C++, Go, etc.).\n` +
      `3. Paste or type your code into the Monaco Editor.\n` +
      `4. Real-time background analysis highlights bugs with editor markers, or click **Analyze Code** for a complete report with cyclomatic complexity, code smells, and quality scores (0–100).`,
    action: { label: 'Open Workspace', route: '/workspace' },
  },
  'How do I fix a Python error?': {
    answer:
      `CodeGuardian features an automated **AI-Powered Fix Assistant**:\n\n` +
      `1. When an issue or finding is detected in the workspace, click **Fix with AI** or **Apply Fix**.\n` +
      `2. CodeGuardian generates a unified before/after patch, explains the root cause (e.g., CWE-89 SQL injection, unhandled exceptions, or memory leaks), and details any safety implications.\n` +
      `3. Review the diff and apply it directly to the editor with one click — plus an unlimited Undo history stack!`,
    action: { label: 'Try in Workspace', route: '/workspace' },
  },
  'Can I check my code for security issues?': {
    answer:
      `Yes! CodeGuardian AI includes enterprise-grade static security scanning:\n\n` +
      `• **Bandit Security Analyzer**: Deep inspection for Python vulnerabilities.\n` +
      `• **Polyglot Security Rule Matrix**: Scans Python, JS, TS, Java, C++, and Go for CWE-89 (SQL Injection), CWE-79 (XSS), CWE-78 (Command Injection), and CWE-798 (Hardcoded API keys/passwords).\n` +
      `• **Risk Severity Scoring**: Classifies findings into Critical, High, Medium, and Low with exploitability impact.`,
    action: { label: 'View Vulnerabilities', route: '/vulnerabilities' },
  },
  'How does CodeGuardian AI work?': {
    answer:
      `CodeGuardian combines deterministic static analyzers with intelligent AI reasoning:\n\n` +
      `1. **Static Analysis**: Python AST parser + Bandit + Polyglot Regex Matrix for zero-false-positive speed.\n` +
      `2. **Judge0 Sandboxed Compiler**: Real-time sandboxed code execution across 30+ languages without executing untrusted code on your host.\n` +
      `3. **Explainable Scoring Engine**: Transparent 0–100 Quality Score and Risk Index based on actual weighted penalties per finding.\n` +
      `4. **Synthesis & Testing**: Auto-generates unit tests in pytest, Jest, JUnit 5, or Go test.`,
    action: { label: 'Explore Documentation', route: '/documentation' },
  },
}

export const RobotAssistantPanel: React.FC<RobotAssistantPanelProps> = ({
  onClose,
  onMinimize,
  isExpanded = false,
  onToggleExpand,
}) => {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'robot',
      text:
        `Hello there! I'm your CodeGuardian AI assistant. 🛡️🤖\n\n` +
        `Ask me anything about code review, security vulnerabilities (CWE/CVE), fixing errors, or how to use our platform!`,
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [, setRobotMood] = useState<RobotMood>('happy')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  const handleAskQuestion = (question: string) => {
    if (!question.trim() || isThinking) return

    const userMsg: Message = {
      id: String(Date.now()),
      sender: 'user',
      text: question.trim(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInputValue('')
    setIsThinking(true)
    setRobotMood('thinking')

    setTimeout(() => {
      const matchedFaq = Object.keys(KNOWLEDGE_BASE).find(
        (k) => k.toLowerCase() === question.toLowerCase()
      )

      let replyText = ''
      let replyAction: { label: string; route: string } | undefined

      if (matchedFaq) {
        replyText = KNOWLEDGE_BASE[matchedFaq].answer
        replyAction = KNOWLEDGE_BASE[matchedFaq].action
      } else {
        const qLower = question.toLowerCase()
        if (qLower.includes('python') || qLower.includes('error') || qLower.includes('fix')) {
          replyText =
            `To diagnose and fix your Python code:\n\n` +
            `1. Navigate to the **Workspace**.\n` +
            `2. Select **Python** and paste your snippet.\n` +
            `3. CodeGuardian's AST analyzer will flag syntax faults and dangerous calls immediately.\n` +
            `4. Use the **Fix with AI** button to preview side-by-side unified diffs and apply corrections!`
          replyAction = { label: 'Open Workspace', route: '/workspace' }
        } else if (qLower.includes('security') || qLower.includes('vulnerab') || qLower.includes('hack') || qLower.includes('injection')) {
          replyText =
            `CodeGuardian scans for top OWASP and CWE vulnerabilities including SQL Injection (CWE-89), XSS (CWE-79), Command Injection (CWE-78), and credential leaks.\n\n` +
            `Every scan assigns a transparent Quality Score from 0 to 100 with clear remediation guidance.`
          replyAction = { label: 'View Vulnerability Catalog', route: '/vulnerabilities' }
        } else if (qLower.includes('test') || qLower.includes('unit test') || qLower.includes('pytest')) {
          replyText =
            `CodeGuardian includes an automatic **Unit Test Synthesis Engine**! It generates comprehensive test suites covering normal execution, edge cases, boundary conditions, and malicious injection payloads for pytest, Jest, JUnit 5, and Go.`
          replyAction = { label: 'Test Generator', route: '/test-generator' }
        } else if (qLower.includes('history') || qLower.includes('diff') || qLower.includes('compare')) {
          replyText =
            `In the **Analysis History & Diff Comparison** tab, you can inspect your past audit runs, track score trends over time, compare regression diffs between two versions of your code, and export standalone PDF/HTML reports.`
          replyAction = { label: 'View History', route: '/history' }
        } else {
          replyText =
            `That's a great question! CodeGuardian AI is specifically tuned to analyze code quality, security vulnerabilities, AST static structures, and generate verified fixes.\n\n` +
            `You can test this directly in our interactive Workspace by pasting your snippet — our analyzers will inspect it in real-time!`
          replyAction = { label: 'Launch Workspace', route: '/workspace' }
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: 'robot',
          text: replyText,
          action: replyAction,
        },
      ])
      setIsThinking(false)
      setRobotMood('happy')
    }, 600)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleAskQuestion(inputValue)
  }

  return (
    <div
      className={`fixed z-50 flex flex-col rounded-3xl border border-slate-200 dark:border-cyan-500/40 bg-white/95 dark:bg-slate-950/95 shadow-2xl backdrop-blur-2xl transition-all duration-300 ${
        isExpanded
          ? 'inset-4 sm:inset-12 md:inset-20'
          : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[350px] sm:w-[410px] h-[560px] max-h-[85vh]'
      }`}
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4 py-3 bg-slate-50/90 dark:bg-slate-950/70 rounded-t-3xl">
        <div className="flex items-center gap-2.5">
          <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-blue-500 dark:border-cyan-400 shadow-xs shrink-0 bg-slate-950">
            <video
              src="/robot-assistant.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-950" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              CodeGuardian AI Assistant
              <Sparkles className="h-3 w-3 text-blue-600 dark:text-cyan-400" />
            </h3>
            <p className="text-[10px] text-blue-600 dark:text-cyan-400/90 font-medium">
              {isThinking ? 'Analyzing query...' : 'Ready to help with your code'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
          {onToggleExpand && (
            <button
              type="button"
              onClick={onToggleExpand}
              className="rounded-lg p-1.5 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title={isExpanded ? 'Restore size' : 'Expand panel'}
            >
              {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
          )}
          <button
            type="button"
            onClick={onMinimize}
            className="rounded-lg p-1.5 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Minimize"
          >
            <span className="block w-3 h-0.5 bg-slate-500 dark:bg-slate-400" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll View */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-3 leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-br-xs shadow-md shadow-blue-600/20'
                  : 'bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 rounded-bl-xs whitespace-pre-line'
              }`}
            >
              {m.text}
            </div>

            {/* Optional Interactive CTA Button inside robot response */}
            {m.action && (
              <button
                type="button"
                onClick={() => navigate(m.action!.route)}
                className="mt-1.5 inline-flex items-center gap-1.5 rounded-xl border border-blue-500/30 dark:border-cyan-500/40 bg-blue-500/10 dark:bg-cyan-500/10 px-3 py-1.5 text-[11px] font-bold text-blue-600 dark:text-cyan-300 hover:bg-blue-500/20 dark:hover:bg-cyan-500/20 transition cursor-pointer shadow-2xs"
              >
                <span>{m.action.label}</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}

        {/* Thinking Indicator */}
        {isThinking && (
          <div className="flex items-center gap-2 text-blue-600 dark:text-cyan-400 bg-blue-50 dark:bg-slate-800/80 border border-blue-200 dark:border-cyan-500/30 rounded-2xl px-3.5 py-2.5 w-fit">
            <Sparkles className="h-3.5 w-3.5 animate-spin" />
            <span className="text-xs font-semibold">GuardianBot is thinking...</span>
            <div className="flex items-center gap-1 ml-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-cyan-400 animate-ping" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-cyan-400 animate-ping delay-150" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-cyan-400 animate-ping delay-300" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Questions */}
      <div className="px-3 pt-2 pb-1 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/50">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
          <HelpCircle className="h-3 w-3 text-blue-600 dark:text-cyan-400" />
          <span>Suggested Questions:</span>
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto no-scrollbar">
          {FAQ_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => handleAskQuestion(q)}
              disabled={isThinking}
              className="rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 px-2 py-1 text-[11px] text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white hover:border-blue-400 dark:hover:border-cyan-500/50 hover:bg-slate-50 dark:hover:bg-slate-700 transition text-left cursor-pointer disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input Field Form */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-slate-50 dark:bg-slate-950/80 rounded-b-3xl">
        <input
          type="text"
          placeholder="Ask a question about CodeGuardian AI..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isThinking}
          className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-cyan-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isThinking}
          className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 p-2 text-white hover:from-blue-500 hover:to-cyan-500 disabled:opacity-40 transition cursor-pointer shadow-md shadow-blue-600/20"
          title="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}
