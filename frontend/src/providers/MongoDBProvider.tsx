import { createContext, useContext, useCallback } from 'react'
import { useAuth } from './AuthProvider'
import { API_BASE, isMockMode } from '../config'

interface MongoDBContextValue {
  api: <T = unknown>(path: string, options?: RequestInit) => Promise<T>
  get: <T = unknown>(path: string) => Promise<T>
  post: <T = unknown>(path: string, body?: unknown) => Promise<T>
  put: <T = unknown>(path: string, body?: unknown) => Promise<T>
  del: <T = unknown>(path: string) => Promise<T>
}

const MongoDBContext = createContext<MongoDBContextValue | null>(null)

export function MongoDBProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth()

  const api = useCallback(
    async <T = unknown>(path: string, options?: RequestInit): Promise<T> => {
      if (isMockMode) {
        // Return mock data for common routes; reject for others
        if (path === '/health' || path.endsWith('/health')) {
          return { status: 'ok', mongodb: 'disconnected' } as T
        }
        return {} as T
      }
      const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options?.headers,
      }
      if (token) {
        ;(headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
      }
      const res = await fetch(url, { ...options, headers })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error ?? data.message ?? `Request failed: ${res.status}`)
      }
      return data as T
    },
    [token]
  )

  const get = useCallback(<T = unknown>(path: string) => api<T>(path, { method: 'GET' }), [api])
  const post = useCallback(
    <T = unknown>(path: string, body?: unknown) =>
      api<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
    [api]
  )
  const put = useCallback(
    <T = unknown>(path: string, body?: unknown) =>
      api<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
    [api]
  )
  const del = useCallback(
    <T = unknown>(path: string) => api<T>(path, { method: 'DELETE' }),
    [api]
  )

  const value: MongoDBContextValue = { api, get, post, put, del }

  return (
    <MongoDBContext.Provider value={value}>{children}</MongoDBContext.Provider>
  )
}

export function useMongoDB() {
  const ctx = useContext(MongoDBContext)
  if (!ctx) throw new Error('useMongoDB must be used within MongoDBProvider')
  return ctx
}
