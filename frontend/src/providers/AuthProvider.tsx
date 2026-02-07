import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { API_BASE, isMockMode } from '../config'

export interface User {
  id: string
  phone: string
}

interface AuthContextValue {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  sendOtp: (phone: string) => Promise<void>
  verifyOtp: (phone: string, code: string) => Promise<void>
  logout: () => void
  error: string | null
  clearError: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const TOKEN_KEY = 'aegis_token'
const USER_KEY = 'aegis_user'

// Mock: store pending OTP for verify (in-memory, dev only)
let mockOtp: string | null = null

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY)
    const storedUser = localStorage.getItem(USER_KEY)
    if (stored && storedUser) {
      setToken(stored)
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const sendOtp = useCallback(async (phone: string) => {
    setError(null)
    setIsLoading(true)
    try {
      if (isMockMode) {
        mockOtp = Math.floor(100000 + Math.random() * 900000).toString()
        await new Promise((r) => setTimeout(r, 500))
        console.log('[Mock] OTP:', mockOtp)
        return
      }
      const res = await fetch(`${API_BASE}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to send code')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send code')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const verifyOtp = useCallback(async (phone: string, code: string) => {
    setError(null)
    setIsLoading(true)
    try {
      if (isMockMode) {
        await new Promise((r) => setTimeout(r, 300))
        if (mockOtp && code === mockOtp) {
          mockOtp = null
          const mockUser: User = { id: 'mock-1', phone }
          const mockToken = 'mock-token'
          setToken(mockToken)
          setUser(mockUser)
          localStorage.setItem(TOKEN_KEY, mockToken)
          localStorage.setItem(USER_KEY, JSON.stringify(mockUser))
        } else {
          throw new Error('Invalid code')
        }
        return
      }
      const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Invalid code')
      setToken(data.token)
      setUser(data.user)
      localStorage.setItem(TOKEN_KEY, data.token)
      localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }, [])

  const clearError = useCallback(() => setError(null), [])

  const value: AuthContextValue = {
    user,
    token,
    isAuthenticated: !!token,
    isLoading,
    sendOtp,
    verifyOtp,
    logout,
    error,
    clearError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
