import React from 'react'

export type RobotMood = 'normal' | 'happy' | 'waving' | 'thinking'
export type RobotSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface CodeGuardianRobotProps {
  size?: RobotSize
  mood?: RobotMood
  isWaving?: boolean
  showParticles?: boolean
  className?: string
  onClick?: () => void
}

export const CodeGuardianRobot: React.FC<CodeGuardianRobotProps> = ({
  size = 'sm',
  mood = 'normal',
  isWaving = false,
  showParticles = false,
  className = '',
  onClick,
}) => {
  // Dimensions based on size (compact & refined)
  const sizeMap = {
    xs: { width: 50, height: 60 },
    sm: { width: 74, height: 89 },
    md: { width: 92, height: 110 },
    lg: { width: 135, height: 162 },
    xl: { width: 180, height: 216 },
  }

  const { width, height } = sizeMap[size]

  return (
    <div
      onClick={onClick}
      className={`relative inline-block select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{ width, height }}
      aria-label="CodeGuardian AI Animated Robot Assistant"
    >
      {/* Floating Ambient Aura */}
      <div
        className="absolute inset-0 rounded-full bg-cyan-500/20 dark:bg-cyan-400/25 blur-xl pointer-events-none animate-robot-glow"
        style={{ transform: 'scale(0.85)' }}
      />

      {/* Main SVG Vector Robot */}
      <svg
        viewBox="0 0 200 240"
        className="w-full h-full animate-robot-float drop-shadow-md"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Head & Body Glossy White Linear Gradient */}
          <linearGradient id="robotBodyGrad" x1="40" y1="20" x2="160" y2="200" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="45%" stopColor="#F8FAFC" />
            <stop offset="85%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>

          {/* Visor Glass Gradient */}
          <linearGradient id="robotVisorGrad" x1="50" y1="50" x2="150" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0B132B" />
            <stop offset="40%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>

          {/* Metallic Blue Accents Gradient */}
          <linearGradient id="metallicBlueGrad" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="50%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#1E40AF" />
          </linearGradient>

          {/* Cyan Glow Gradient for Thruster */}
          <radialGradient id="thrusterGlow" cx="100" cy="205" r="35" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.9" />
            <stop offset="45%" stopColor="#0284C7" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
          </radialGradient>

          {/* Specular Top Shine */}
          <linearGradient id="specularShine" x1="100" y1="25" x2="100" y2="65" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          {/* Cyan Eye Glow Filter */}
          <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Thruster Plasma Aura (Under robot) */}
        <g className="animate-robot-thruster">
          <ellipse cx="100" cy="216" rx="28" ry="9" fill="url(#thrusterGlow)" />
          <ellipse cx="100" cy="215" rx="16" ry="5" fill="#38BDF8" opacity="0.8" />
          <ellipse cx="100" cy="214" rx="8" ry="2.5" fill="#FFFFFF" />
        </g>

        {/* 2. Magnetic Hover Ring (Metallic floating base) */}
        <ellipse cx="100" cy="202" rx="34" ry="10" fill="url(#metallicBlueGrad)" />
        <ellipse cx="100" cy="201" rx="28" ry="7" fill="#0F172A" />
        <ellipse cx="100" cy="201" rx="22" ry="5" fill="#38BDF8" opacity="0.6" />

        {/* 3. Left Hand (Resting gracefully) */}
        <g transform="translate(14, 126)">
          {/* Shoulder joint */}
          <circle cx="22" cy="18" r="8" fill="url(#metallicBlueGrad)" />
          {/* Floating Arm segment */}
          <path
            d="M 22 22 C 16 34, 16 48, 22 58 C 24 62, 28 62, 29 58 C 25 48, 24 34, 28 24 Z"
            fill="url(#robotBodyGrad)"
            stroke="#94A3B8"
            strokeWidth="0.8"
          />
          {/* Hand Palm */}
          <ellipse cx="25" cy="62" rx="7" ry="9" fill="url(#robotBodyGrad)" />
          <circle cx="25" cy="63" r="3.5" fill="url(#metallicBlueGrad)" />
        </g>

        {/* 4. Torso / Body (Glossy White Capsule) */}
        <g>
          {/* Body Main Shell */}
          <path
            d="M 64 122 C 64 112, 74 104, 100 104 C 126 104, 136 112, 136 122 L 138 172 C 138 186, 124 196, 100 196 C 76 196, 62 186, 62 172 Z"
            fill="url(#robotBodyGrad)"
            stroke="#CBD5E1"
            strokeWidth="1.2"
          />

          {/* Chest Specular Highlight */}
          <path
            d="M 72 118 C 76 112, 88 109, 100 109 C 112 109, 124 112, 128 118 C 122 115, 112 113, 100 113 C 88 113, 78 115, 72 118 Z"
            fill="#FFFFFF"
            opacity="0.9"
          />

          {/* Chest Shield Emblem: CodeGuardian AI */}
          <g transform="translate(86, 132)">
            {/* Outer Shield Plate */}
            <path
              d="M 14 0 L 26 5 C 26 18, 14 26, 14 26 C 14 26, 2 18, 2 5 Z"
              fill="url(#metallicBlueGrad)"
              stroke="#38BDF8"
              strokeWidth="0.8"
            />
            {/* Inner Core Shield */}
            <path
              d="M 14 3 L 23 7 C 23 16, 14 23, 14 23 C 14 23, 5 16, 5 7 Z"
              fill="#0F172A"
            />
            {/* Center Glowing Pulse (Bug Guardian Zap) */}
            <path
              d="M 15 6 L 10 13 L 13.5 13 L 12.5 19 L 18 12 L 14.5 12 Z"
              fill="#38BDF8"
              filter="url(#cyanGlow)"
            />
          </g>

          {/* Belt / Waist Trim Line */}
          <path
            d="M 72 178 C 82 183, 118 183, 128 178"
            stroke="url(#metallicBlueGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>

        {/* 5. Neck Joint (Floating metallic ring) */}
        <ellipse cx="100" cy="106" rx="18" ry="5" fill="url(#metallicBlueGrad)" />

        {/* 6. Dual Antennas */}
        {/* Left Antenna */}
        <g transform="translate(62, 18)">
          <path d="M 12 24 L 2 6" stroke="url(#metallicBlueGrad)" strokeWidth="3" strokeLinecap="round" />
          <circle cx="2" cy="5" r="5" fill="#38BDF8" filter="url(#cyanGlow)" />
          <circle cx="2" cy="5" r="2.5" fill="#FFFFFF" />
        </g>
        {/* Right Antenna */}
        <g transform="translate(126, 18)">
          <path d="M 10 24 L 20 6" stroke="url(#metallicBlueGrad)" strokeWidth="3" strokeLinecap="round" />
          <circle cx="20" cy="5" r="5" fill="#38BDF8" filter="url(#cyanGlow)" />
          <circle cx="20" cy="5" r="2.5" fill="#FFFFFF" />
        </g>

        {/* 7. Head Chassis (Curved Futuristic Sphere) */}
        <g>
          {/* Main Head Base */}
          <rect
            x="44"
            y="26"
            width="112"
            height="84"
            rx="42"
            fill="url(#robotBodyGrad)"
            stroke="#CBD5E1"
            strokeWidth="1.2"
          />

          {/* Top Specular Dome Reflection */}
          <ellipse
            cx="100"
            cy="36"
            rx="40"
            ry="9"
            fill="url(#specularShine)"
          />

          {/* Metallic Cyan Headband Accent */}
          <path
            d="M 52 46 C 70 38, 130 38, 148 46"
            stroke="url(#metallicBlueGrad)"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.7"
          />

          {/* Head Ear Pads / Audio Sensors */}
          <rect x="38" y="52" width="8" height="32" rx="4" fill="url(#metallicBlueGrad)" />
          <rect x="40" y="56" width="4" height="24" rx="2" fill="#38BDF8" opacity="0.75" />

          <rect x="154" y="52" width="8" height="32" rx="4" fill="url(#metallicBlueGrad)" />
          <rect x="156" y="56" width="4" height="24" rx="2" fill="#38BDF8" opacity="0.75" />

          {/* 8. Visor Faceplate (Glossy Deep Navy Glass) */}
          <rect
            x="52"
            y="44"
            width="96"
            height="56"
            rx="26"
            fill="url(#robotVisorGrad)"
            stroke="#1E293B"
            strokeWidth="1.5"
          />

          {/* Visor Inner Rim Glow */}
          <rect
            x="53.5"
            y="45.5"
            width="93"
            height="53"
            rx="24.5"
            stroke="#0284C7"
            strokeWidth="0.8"
            opacity="0.4"
          />

          {/* Visor Curved Glass Specular Highlight */}
          <path
            d="M 58 54 C 74 48, 126 48, 142 54 C 132 50, 68 50, 58 54 Z"
            fill="#FFFFFF"
            opacity="0.25"
          />

          {/* 9. Expressive Facial Display (Eyes & Smile) */}
          {mood === 'thinking' ? (
            /* Thinking State: Scanning Cyber-Ray & Pulse Dots */
            <g>
              {/* Scan Beam */}
              <g className="animate-robot-thinking-scan">
                <rect x="85" y="66" width="30" height="4" rx="2" fill="#38BDF8" filter="url(#cyanGlow)" />
                <rect x="94" y="66.5" width="12" height="3" rx="1.5" fill="#FFFFFF" />
              </g>
              {/* Thinking Dots */}
              <circle cx="82" cy="74" r="3" fill="#38BDF8" opacity="0.5" className="animate-pulse" />
              <circle cx="100" cy="74" r="3" fill="#38BDF8" opacity="0.9" className="animate-pulse" />
              <circle cx="118" cy="74" r="3" fill="#38BDF8" opacity="0.5" className="animate-pulse" />
            </g>
          ) : mood === 'happy' || mood === 'waving' ? (
            /* Happy / Waving State: Crescent Smiling Eyes ^_^ */
            <g>
              {/* Left Happy Eye */}
              <path
                d="M 72 73 C 72 63, 88 63, 88 73"
                stroke="#38BDF8"
                strokeWidth="4.5"
                strokeLinecap="round"
                filter="url(#cyanGlow)"
              />
              <path
                d="M 74 72 C 74 65, 86 65, 86 72"
                stroke="#FFFFFF"
                strokeWidth="1.8"
                strokeLinecap="round"
              />

              {/* Right Happy Eye */}
              <path
                d="M 112 73 C 112 63, 128 63, 128 73"
                stroke="#38BDF8"
                strokeWidth="4.5"
                strokeLinecap="round"
                filter="url(#cyanGlow)"
              />
              <path
                d="M 114 72 C 114 65, 126 65, 126 72"
                stroke="#FFFFFF"
                strokeWidth="1.8"
                strokeLinecap="round"
              />

              {/* Friendly Cheerful Smile Arc */}
              <path
                d="M 92 84 C 95 88, 105 88, 108 84"
                stroke="#38BDF8"
                strokeWidth="2.5"
                strokeLinecap="round"
                filter="url(#cyanGlow)"
              />
            </g>
          ) : (
            /* Normal State: Large Glowing Cyan Oval Eyes with Blink */
            <g className="animate-robot-blink">
              {/* Left Eye */}
              <g>
                <ellipse cx="80" cy="70" rx="9" ry="11" fill="#38BDF8" filter="url(#cyanGlow)" />
                <ellipse cx="80" cy="70" rx="7" ry="8.5" fill="#0284C7" />
                <ellipse cx="80" cy="70" rx="4.5" ry="5.5" fill="#38BDF8" />
                {/* Specular Gleam */}
                <circle cx="77" cy="66" r="2.5" fill="#FFFFFF" />
                <circle cx="83" cy="73" r="1.2" fill="#FFFFFF" opacity="0.8" />
              </g>

              {/* Right Eye */}
              <g>
                <ellipse cx="120" cy="70" rx="9" ry="11" fill="#38BDF8" filter="url(#cyanGlow)" />
                <ellipse cx="120" cy="70" rx="7" ry="8.5" fill="#0284C7" />
                <ellipse cx="120" cy="70" rx="4.5" ry="5.5" fill="#38BDF8" />
                {/* Specular Gleam */}
                <circle cx="117" cy="66" r="2.5" fill="#FFFFFF" />
                <circle cx="123" cy="73" r="1.2" fill="#FFFFFF" opacity="0.8" />
              </g>

              {/* Cute LED Smile */}
              <path
                d="M 94 84 C 97 87, 103 87, 106 84"
                stroke="#38BDF8"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.9"
              />
            </g>
          )}

          {/* Cheek Blush (Soft Cyan/Purple) */}
          <ellipse cx="68" cy="81" rx="5" ry="2" fill="#38BDF8" opacity="0.25" />
          <ellipse cx="132" cy="81" rx="5" ry="2" fill="#38BDF8" opacity="0.25" />
        </g>

        {/* 10. Right Hand (Animated Wave!) */}
        <g
          className={isWaving || mood === 'waving' ? 'animate-robot-wave' : ''}
          style={{ transformOrigin: '158px 126px' }}
        >
          {/* Shoulder Pivot */}
          <circle cx="158" cy="126" r="8" fill="url(#metallicBlueGrad)" />

          {/* Forearm angled up in friendly wave posture */}
          <path
            d="M 158 126 C 168 116, 175 104, 178 92 C 182 92, 184 96, 182 101 C 178 114, 169 126, 162 132 Z"
            fill="url(#robotBodyGrad)"
            stroke="#94A3B8"
            strokeWidth="0.8"
          />

          {/* Hand Palm */}
          <g transform="translate(174, 76)">
            {/* Palm */}
            <ellipse cx="8" cy="12" rx="7.5" ry="8" fill="url(#robotBodyGrad)" stroke="#CBD5E1" strokeWidth="0.8" />
            <circle cx="8" cy="12" r="3" fill="url(#metallicBlueGrad)" />

            {/* Fingers waving */}
            {/* Thumb */}
            <rect x="0" y="8" width="3.5" height="6" rx="1.7" fill="url(#robotBodyGrad)" transform="rotate(-30 0 8)" />
            {/* Index */}
            <rect x="4" y="1" width="3.2" height="7.5" rx="1.6" fill="url(#robotBodyGrad)" />
            {/* Middle */}
            <rect x="8.5" y="0" width="3.2" height="8.5" rx="1.6" fill="url(#robotBodyGrad)" />
            {/* Ring */}
            <rect x="13" y="2" width="3" height="7.5" rx="1.5" fill="url(#robotBodyGrad)" />
            {/* Little */}
            <rect x="17" y="5" width="2.8" height="6.5" rx="1.4" fill="url(#robotBodyGrad)" />

            {/* Glowing Fingertips */}
            <circle cx="5.6" cy="1.5" r="1.2" fill="#38BDF8" />
            <circle cx="10.1" cy="0.6" r="1.2" fill="#38BDF8" />
            <circle cx="14.5" cy="2.5" r="1.2" fill="#38BDF8" />
          </g>
        </g>
      </svg>
    </div>
  )
}
