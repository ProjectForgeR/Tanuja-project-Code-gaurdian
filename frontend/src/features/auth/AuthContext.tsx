import React, { createContext, useContext, useEffect, useState } from 'react'
import { authService } from '@/services/authService'
import { User } from '@/types/auth'

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isDemoUser: boolean
  login: (email: string, pass: string) => Promise<void>
  register: (email: string, pass: string, name?: string) => Promise<void>
  logout: () => void
  activateDemoUser: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('codeguardian_token'))
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isDemoUser, setIsDemoUser] = useState<boolean>(false)

  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem('codeguardian_token')
      if (storedToken) {
        try {
          const me = await authService.getMe()
          setUser(me)
        } catch {
          // Token expired or invalid
          localStorage.removeItem('codeguardian_token')
          setToken(null)
          setUser(null)
        }
      }
      setIsLoading(false)
    }
    loadUser()
  }, [])

  const login = async (email: string, pass: string) => {
    const res = await authService.login({ email, password: pass })
    localStorage.setItem('codeguardian_token', res.access_token)
    setToken(res.access_token)
    setUser(res.user)
    setIsDemoUser(false)
  }

  const register = async (email: string, pass: string, name?: string) => {
    const res = await authService.register({ email, password: pass, full_name: name })
    localStorage.setItem('codeguardian_token', res.access_token)
    setToken(res.access_token)
    setUser(res.user)
    setIsDemoUser(false)
  }

  const logout = () => {
    localStorage.removeItem('codeguardian_token')
    setToken(null)
    setUser(null)
    setIsDemoUser(false)
  }

  const activateDemoUser = () => {
    setUser({
      id: 'guest-demo-user',
      email: 'guest@codeguardian.ai',
      full_name: 'Guest Developer',
      role: 'guest',
      is_active: true,
    })
    setIsDemoUser(true)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        isDemoUser: false,
        login,
        register,
        logout,
        activateDemoUser: () => {},
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
