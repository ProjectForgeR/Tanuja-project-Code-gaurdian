import React from 'react'
import { useLocation } from 'react-router-dom'

interface PageTransitionProps {
  children: React.ReactNode
  className?: string
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children, className = '' }) => {
  const location = useLocation()

  return (
    <div
      key={location.pathname}
      className={`page-transition w-full flex-1 flex flex-col ${className}`}
    >
      {children}
    </div>
  )
}
