import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

type ToastType = 'success' | 'error' | 'default'

interface ToastOptions {
  type?: ToastType
  duration?: number
}

interface ToastContextValue {
  toast: (message: string, options?: ToastOptions) => void
  success: (message: string) => void
  error: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null)
  const [type, setType] = useState<ToastType>('default')

  const showToast = useCallback((msg: string, options?: ToastOptions) => {
    setMessage(msg)
    setType(options?.type ?? 'default')
    const duration = options?.duration ?? 4000
    setTimeout(() => setMessage(null), duration)
  }, [])

  const toast = useCallback(
    (msg: string, options?: ToastOptions) => showToast(msg, options),
    [showToast],
  )
  const success = useCallback((msg: string) => showToast(msg, { type: 'success' }), [showToast])
  const error = useCallback((msg: string) => showToast(msg, { type: 'error' }), [showToast])

  const toastEl = message ? (
    <div
      className="fixed bottom-4 right-4 z-[9999] px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium"
      style={{
        background:
          type === 'success'
            ? '#16a34a'
            : type === 'error'
              ? '#dc2626'
              : '#1e293b',
      }}
    >
      {message}
    </div>
  ) : null

  return (
    <ToastContext.Provider value={{ toast, success, error }}>
      {children}
      {message ? createPortal(toastEl, document.body) : null}
    </ToastContext.Provider>
  )
}
