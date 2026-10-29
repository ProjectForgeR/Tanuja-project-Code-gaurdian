import React, { useState, useEffect } from 'react'
import { CodeGuardianRobot, RobotMood } from './CodeGuardianRobot'
import { RobotSpeechBubble } from './RobotSpeechBubble'
import { RobotAssistantPanel } from './RobotAssistantPanel'
import { Sparkles, MessageSquare } from 'lucide-react'

export const RobotFloatingWidget: React.FC = () => {
  // States:
  // 1. isVisible: whether the widget has appeared after the initial 800ms delay
  // 2. showSpeechBubble: whether the welcoming speech bubble is shown
  // 3. showAssistantPanel: whether the interactive chat/FAQ panel is open
  // 4. isExpanded: whether the chat panel is expanded/fullscreen
  const [isVisible, setIsVisible] = useState<boolean>(false)
  const [showSpeechBubble, setShowSpeechBubble] = useState<boolean>(false)
  const [showAssistantPanel, setShowAssistantPanel] = useState<boolean>(false)
  const [isExpanded, setIsExpanded] = useState<boolean>(false)
  const [robotMood, setRobotMood] = useState<RobotMood>('waving')
  const [hasInteracted, setHasInteracted] = useState<boolean>(false)
  const [bubbleKey, setBubbleKey] = useState<number>(0)

  useEffect(() => {
    // 800ms entrance delay
    const timer = setTimeout(() => {
      setIsVisible(true)
      setShowSpeechBubble(true)
      setBubbleKey((k) => k + 1)
      setRobotMood('waving')

      // Transition waving to happy
      const waveTimer = setTimeout(() => {
        setRobotMood('happy')
      }, 3000)

      return () => clearTimeout(waveTimer)
    }, 800)

    return () => clearTimeout(timer)
  }, [])

  // Auto-close speech bubble after exactly 5 seconds whenever it opens
  useEffect(() => {
    if (!showSpeechBubble) return

    const autoCloseTimer = setTimeout(() => {
      setShowSpeechBubble(false)
      setRobotMood('normal')
    }, 5000)

    return () => clearTimeout(autoCloseTimer)
  }, [showSpeechBubble, bubbleKey])

  if (!isVisible) return null

  const handleCloseSpeechBubble = () => {
    setShowSpeechBubble(false)
    setRobotMood('normal')
    setHasInteracted(true)
  }

  const handleOpenAssistant = () => {
    setShowSpeechBubble(false)
    setShowAssistantPanel(true)
    setRobotMood('happy')
    setHasInteracted(true)
  }

  const handleCloseAssistant = () => {
    setShowAssistantPanel(false)
    setRobotMood('normal')
  }

  const handleToggleWidget = () => {
    if (showAssistantPanel) {
      setShowAssistantPanel(false)
      setRobotMood('normal')
    } else if (showSpeechBubble) {
      setShowSpeechBubble(false)
      setRobotMood('normal')
    } else {
      setShowSpeechBubble(true)
      setBubbleKey((k) => k + 1)
      setRobotMood('waving')
    }
  }

  return (
    <div className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-40 select-none">
      {/* 1. Welcoming Speech Bubble (Shown on entry or when active) */}
      {showSpeechBubble && !showAssistantPanel && (
        <div key={bubbleKey} className="mb-2 flex justify-end">
          <RobotSpeechBubble
            onClose={handleCloseSpeechBubble}
            onOpenAssistant={handleOpenAssistant}
          />
        </div>
      )}

      {/* 2. Interactive Assistant Panel */}
      {showAssistantPanel && (
        <RobotAssistantPanel
          onClose={handleCloseAssistant}
          onMinimize={() => setShowAssistantPanel(false)}
          isExpanded={isExpanded}
          onToggleExpand={() => setIsExpanded(!isExpanded)}
        />
      )}

      {/* 3. Floating Robot Mascot Anchor */}
      {!showAssistantPanel && (
        <div className="flex items-end justify-end gap-3 animate-robot-entrance">
          {/* Quick Helper Pill when bubble is dismissed */}
          {!showSpeechBubble && !hasInteracted && (
            <button
              type="button"
              onClick={handleOpenAssistant}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-slate-300 dark:border-cyan-500/40 bg-white/95 dark:bg-slate-950/90 px-3.5 py-1.5 text-xs font-bold text-slate-800 dark:text-cyan-300 shadow-lg shadow-slate-900/10 dark:shadow-cyan-950/50 hover:bg-slate-50 dark:hover:bg-slate-850 transition cursor-pointer mb-6 animate-pulse backdrop-blur-md"
            >
              <Sparkles className="h-3 w-3 text-blue-600 dark:text-cyan-400" />
              <span>Ask AI Assistant</span>
            </button>
          )}

          {/* Interactive Robot Mascot Button */}
          <div
            onClick={handleToggleWidget}
            onMouseEnter={() => setRobotMood('waving')}
            onMouseLeave={() => setRobotMood(showSpeechBubble ? 'happy' : 'normal')}
            className="group relative cursor-pointer focus:outline-none"
            role="button"
            tabIndex={0}
            title="Click to talk with CodeGuardian AI Assistant"
            aria-label="Open CodeGuardian AI Assistant"
          >
            {/* Soft Ambient Pulsing Ring */}
            <div className="absolute -inset-1 rounded-full bg-cyan-400/20 blur-md group-hover:bg-cyan-400/35 transition-all duration-300" />

            {/* Mascot Container */}
            <div className="relative transform group-hover:scale-105 transition-transform duration-300">
              <CodeGuardianRobot
                size="md"
                mood={robotMood}
                isWaving={robotMood === 'waving'}
                showParticles={true}
              />
            </div>

            {/* Notification Badge */}
            {!showSpeechBubble && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500 border-2 border-slate-950 items-center justify-center">
                  <MessageSquare className="h-2 w-2 text-white" />
                </span>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
