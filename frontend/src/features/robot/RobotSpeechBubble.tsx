import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  MessageSquare,
  X,
  Zap,
  Volume2,
  VolumeX,
} from 'lucide-react'

interface RobotSpeechBubbleProps {
  onClose: () => void
  onOpenAssistant: () => void
  className?: string
}

const FULL_WELCOME_TEXT = `Hi! Welcome to CodeGuardian AI! 👋
Got code errors? I help detect bugs, identify security risks & fix your code.
Let's make your code cleaner, safer & smarter! 🚀`

export const RobotSpeechBubble: React.FC<RobotSpeechBubbleProps> = ({
  onClose,
  onOpenAssistant,
  className = '',
}) => {
  const navigate = useNavigate()
  const [displayedText, setDisplayedText] = useState<string>('')
  const [isTypingComplete, setIsTypingComplete] = useState<boolean>(false)
  const [isMuted, setIsMuted] = useState<boolean>(true)
  const typingIndexRef = useRef<number>(0)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    typingIndexRef.current = 0
    setDisplayedText('')
    setIsTypingComplete(false)

    const typeNextChar = () => {
      if (typingIndexRef.current < FULL_WELCOME_TEXT.length) {
        typingIndexRef.current += 1
        setDisplayedText(FULL_WELCOME_TEXT.slice(0, typingIndexRef.current))

        // Fast typing rhythm so message is fully visible in ~600ms
        const lastChar = FULL_WELCOME_TEXT[typingIndexRef.current - 1]
        let delay = 10
        if (lastChar === '\n') delay = 40
        else if (['.', '!', '?'].includes(lastChar)) delay = 35

        typingTimerRef.current = setTimeout(typeNextChar, delay)
      } else {
        setIsTypingComplete(true)
      }
    }

    typingTimerRef.current = setTimeout(typeNextChar, 50)

    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    }
  }, [])

  const handleSkipTyping = () => {
    if (!isTypingComplete) {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
      setDisplayedText(FULL_WELCOME_TEXT)
      setIsTypingComplete(true)
    }
  }

  const handleGetStarted = () => {
    navigate('/workspace')
  }

  const handleTryAudit = () => {
    navigate('/workspace?mode=audit')
  }

  return (
    <div
      className={`relative w-[280px] sm:w-[310px] md:w-[325px] max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-cyan-500/40 bg-white/95 dark:bg-slate-950/95 p-3 shadow-2xl shadow-slate-900/15 dark:shadow-cyan-950/60 backdrop-blur-xl animate-speech-bubble text-slate-800 dark:text-slate-100 no-scrollbar transition-colors ${className}`}
    >
      {/* 5-second countdown progress bar */}
      <div className="absolute top-0 inset-x-0 h-1 bg-slate-200/60 dark:bg-slate-800/80 overflow-hidden rounded-t-2xl">
        <div className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 animate-bubble-countdown" />
      </div>

      {/* Speech Bubble Arrow pointing toward bottom-right / robot */}
      <div
        className="absolute -bottom-2 right-8 sm:right-10 w-4 h-4 bg-white dark:bg-slate-950 border-r border-b border-slate-200 dark:border-cyan-500/40 transform rotate-45"
      />

      {/* Bubble Top Header */}
      <div className="flex items-center justify-between pb-1.5 pt-0.5 mb-2 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-1.5">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-xs">
            <Sparkles className="h-3 w-3" />
          </div>
          <div>
            <span className="text-[11px] sm:text-xs font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              GuardianBot AI
              <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 px-1.5 py-0.2 text-[8.5px] font-semibold text-blue-600 dark:text-cyan-300">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping inline-block" />
                Live
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          {/* Audio Mute/Unmute Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMuted((prev) => !prev)}
            className="rounded-lg p-1 text-slate-400 hover:text-blue-600 dark:hover:text-cyan-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title={isMuted ? 'Unmute voice' : 'Mute sound'}
            aria-label="Toggle sound"
          >
            {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5 text-blue-600 dark:text-cyan-400 animate-pulse" />}
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Dismiss welcome message"
            aria-label="Close message"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 3D Animated Robot Video in Right-Side Panel */}
      <div className="relative w-full h-28 sm:h-32 rounded-xl overflow-hidden border border-slate-200 dark:border-cyan-500/40 bg-slate-950 shadow-md mb-2 group">
        <video
          src="/robot-assistant.mp4"
          autoPlay
          loop
          muted={isMuted}
          playsInline
          className="w-full h-full object-cover object-center select-none"
        />

        {/* Ambient Overlay Inside Video */}
        <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent flex items-center justify-between pointer-events-none">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 border border-cyan-500/30 px-1.5 py-0.5 text-[9px] font-semibold text-cyan-300 backdrop-blur-xs">
            <span className="w-1 h-1 rounded-full bg-cyan-400 animate-ping inline-block" />
            3D Robot Mascot
          </span>

          <span className="text-[9px] font-mono text-slate-400">
            {isMuted ? '🔇 Muted' : '🔊 On'}
          </span>
        </div>
      </div>

      {/* Typed Welcome Message Body */}
      <div
        onClick={handleSkipTyping}
        className="text-[11px] sm:text-[11.5px] text-slate-600 dark:text-slate-300 leading-relaxed font-normal whitespace-pre-line min-h-[46px] cursor-pointer selection:bg-cyan-500/30 px-1 py-0.5"
        title={!isTypingComplete ? 'Click to show full message' : undefined}
      >
        {displayedText}
        {!isTypingComplete && (
          <span className="inline-block w-1.5 h-3 ml-0.5 bg-blue-600 dark:bg-cyan-400 animate-typing-cursor align-middle" />
        )}
      </div>

      {/* Quick Action Buttons */}
      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          {/* 1. Let's Get Started */}
          <button
            type="button"
            onClick={handleGetStarted}
            className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 px-2.5 py-1.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition cursor-pointer"
          >
            <Zap className="h-3 w-3" />
            <span>Let's Get Started</span>
            <ArrowRight className="h-2.5 w-2.5" />
          </button>

          {/* 2. Try Code Analysis */}
          <button
            type="button"
            onClick={handleTryAudit}
            className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 px-2 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white transition cursor-pointer"
            title="Open workspace in audit mode"
          >
            <ShieldCheck className="h-3 w-3 text-blue-600 dark:text-cyan-400" />
            <span>Audit</span>
          </button>
        </div>

        {/* 3. Ask Assistant Link */}
        <button
          type="button"
          onClick={onOpenAssistant}
          className="w-full inline-flex items-center justify-center gap-1 py-0.5 text-[10.5px] font-semibold text-blue-600 dark:text-cyan-400 hover:text-blue-700 dark:hover:text-cyan-300 transition cursor-pointer"
        >
          <MessageSquare className="h-2.5 w-2.5" />
          <span>Have questions? Chat with AI Assistant</span>
        </button>
      </div>
    </div>
  )
}
