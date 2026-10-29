import React, { useState, useEffect } from 'react'
import { CodeGuardianRobot, RobotMood } from './CodeGuardianRobot'
import { RobotAssistantPanel } from './RobotAssistantPanel'
import { Sparkles } from 'lucide-react'

export const RobotFloatingWidget: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false)
  const [showAssistantPanel, setShowAssistantPanel] = useState<boolean>(false)
  const [isExpanded, setIsExpanded] = useState<boolean>(false)
  const [robotMood, setRobotMood] = useState<RobotMood>('waving')

  useEffect(() => {
    // 800ms entrance delay
    const timer = setTimeout(() => {
      setIsVisible(true)
      setRobotMood('waving')

      const waveTimer = setTimeout(() => {
        setRobotMood('normal')
      }, 3000)

      return () => clearTimeout(waveTimer)
    }, 800)

    return () => clearTimeout(timer)
  }, [])

  if (!isVisible) return null

  const handleToggleAssistant = () => {
    setShowAssistantPanel((prev) => !prev)
    setRobotMood((prev) => (prev === 'happy' ? 'normal' : 'happy'))
  }

  const handleCloseAssistant = () => {
    setShowAssistantPanel(false)
    setRobotMood('normal')
  }

  return (
    <div className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-40 select-none">
      {/* 1. Interactive Assistant Panel */}
      {showAssistantPanel && (
        <RobotAssistantPanel
          onClose={handleCloseAssistant}
          onMinimize={() => setShowAssistantPanel(false)}
          isExpanded={isExpanded}
          onToggleExpand={() => setIsExpanded(!isExpanded)}
        />
      )}

      {/* 2. Floating Robot Mascot Anchor & Small AI Assistant Pill */}
      {!showAssistantPanel && (
        <div className="flex items-end justify-end gap-2.5 animate-robot-entrance">
          {/* Small Sleek AI Assistant Pill */}
          <button
            type="button"
            onClick={handleToggleAssistant}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-cyan-500/30 bg-white/95 dark:bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-cyan-300 shadow-md shadow-slate-900/5 dark:shadow-cyan-950/40 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-cyan-400 transition cursor-pointer mb-5 backdrop-blur-md group"
            title="Open AI Assistant"
          >
            <Sparkles className="h-3 w-3 text-blue-600 dark:text-cyan-400 group-hover:rotate-12 transition-transform" />
            <span>AI Assistant</span>
          </button>

          {/* Interactive Floating Robot Mascot (Clean, no surrounding symbols) */}
          <div
            onClick={handleToggleAssistant}
            onMouseEnter={() => setRobotMood('waving')}
            onMouseLeave={() => setRobotMood(showAssistantPanel ? 'happy' : 'normal')}
            className="group relative cursor-pointer focus:outline-none"
            role="button"
            tabIndex={0}
            title="Click to talk with CodeGuardian AI Assistant"
            aria-label="Open CodeGuardian AI Assistant"
          >
            {/* Soft Ambient Pulsing Ring */}
            <div className="absolute -inset-1 rounded-full bg-cyan-400/20 blur-md group-hover:bg-cyan-400/35 transition-all duration-300" />

            {/* Pure Robot Floating (Particles / surrounding symbols removed) */}
            <div className="relative transform group-hover:scale-105 transition-transform duration-300">
              <CodeGuardianRobot
                size="md"
                mood={robotMood}
                isWaving={robotMood === 'waving'}
                showParticles={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
