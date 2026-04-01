'use client'

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react'
import { Check, X, AlertTriangle, Info, Undo2 } from 'lucide-react'

// ============================================
// UCD Optimizations #1 (Toast System) + #4 (Undo)
// ============================================

type ToastType = 'success' | 'error' | 'warning' | 'info'

type Toast = {
  id: string
  message: string
  type: ToastType
  undoAction?: () => void | Promise<void>
  duration?: number
}

type ToastContextType = {
  showToast: (message: string, type?: ToastType) => void
  showUndoToast: (message: string, undoAction: () => void | Promise<void>, duration?: number) => void
  dismissToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

const ICONS = {
  success: Check,
  error: X,
  warning: AlertTriangle,
  info: Info,
}

const ICON_STYLES = {
  success: 'bg-green-100 text-green-600',
  error: 'bg-red-100 text-red-600',
  warning: 'bg-amber-100 text-amber-600',
  info: 'bg-tanzanite-100 text-tanzanite-600',
}

const BORDER_STYLES = {
  success: 'border-green-200',
  error: 'border-red-200',
  warning: 'border-amber-200',
  info: 'border-tanzanite-200',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Record<string, NodeJS.Timeout>>({})

  const dismissToast = useCallback((id: string) => {
    if (timers.current[id]) {
      clearTimeout(timers.current[id])
      delete timers.current[id]
    }
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const addToast = useCallback((toast: Toast) => {
    setToasts(prev => [...prev.slice(-4), toast]) // Max 5 toasts
    const duration = toast.duration || (toast.undoAction ? 6000 : 3500)
    timers.current[toast.id] = setTimeout(() => dismissToast(toast.id), duration)
  }, [dismissToast])

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    addToast({ id: `toast-${Date.now()}-${Math.random()}`, message, type })
  }, [addToast])

  const showUndoToast = useCallback((
    message: string,
    undoAction: () => void | Promise<void>,
    duration = 6000
  ) => {
    addToast({
      id: `toast-${Date.now()}-${Math.random()}`,
      message,
      type: 'info',
      undoAction,
      duration,
    })
  }, [addToast])

  return (
    <ToastContext.Provider value={{ showToast, showUndoToast, dismissToast }}>
      {children}

      {/* Toast container - fixed bottom-center */}
      <div
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[90vw] max-w-sm pointer-events-none"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map(toast => {
          const Icon = ICONS[toast.type]
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto toast flex items-center gap-3 px-4 py-3 rounded-xl border bg-white shadow-lg ${BORDER_STYLES[toast.type]}`}
              role="status"
            >
              <div className={`p-1 rounded-full flex-shrink-0 ${ICON_STYLES[toast.type]}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <p className="text-sm text-body flex-1">{toast.message}</p>

              {toast.undoAction && (
                <button
                  onClick={async () => {
                    await toast.undoAction!()
                    dismissToast(toast.id)
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-tanzanite-600 bg-tanzanite-50 hover:bg-tanzanite-100 transition-colors flex-shrink-0"
                >
                  <Undo2 className="w-3 h-3" /> Undo
                </button>
              )}

              <button
                onClick={() => dismissToast(toast.id)}
                className="p-1 rounded hover:bg-gray-100 text-slate flex-shrink-0"
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
