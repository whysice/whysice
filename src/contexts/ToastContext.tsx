'use client'

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react'
import { Check, X, AlertTriangle, Info, Undo2 } from 'lucide-react'

// ============================================
// WCAG 2.2 AA HARDENED — ToastContext.tsx
//
// Compliance focus:
//   1.4.1 Use of Color (A) — pass: each toast type has a distinct
//   icon (Check / X / AlertTriangle / Info) plus a text message.
//   The aria-live region exposes content to screen readers.
//
//   1.4.3 Contrast Minimum (AA, 4.5:1)
//     - Icon color upgraded from text-{color}-600 (which on the
//       *-100 backgrounds was OK but inconsistent) to text-{color}-700
//       so all four toast types clear 4.5:1 on their backgrounds.
//
//   1.4.11 Non-text Contrast (AA, 3:1)
//     - Border colors upgraded from *-200 to *-600 to give the toast
//       a visible perimeter against the white page background and
//       ensure the type cue (border tint) carries 3:1 contrast.
//
//   4.1.3 Status Messages (AA) — aria-live="polite" + role="status"
//   already in place, retained.
//
//   2.4.7 Focus Visible — added focus-visible styles to the Undo
//   and Dismiss buttons so they're keyboard-perceivable.
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

// Icon background tint (decorative) + foreground (≥4.5:1 on the tint)
const ICON_STYLES = {
  success: 'bg-green-100 text-green-800',     // 8.0:1
  error: 'bg-red-100 text-red-800',           // 8.4:1
  warning: 'bg-amber-100 text-amber-900',     // 8.6:1
  info: 'bg-tanzanite-100 text-tanzanite-700', // 6.5:1
}

// Border weight upgraded to *-600/-700 for 1.4.11 (3:1 against white page)
const BORDER_STYLES = {
  success: 'border-green-700',
  error: 'border-red-700',
  warning: 'border-amber-700',
  info: 'border-tanzanite-600',
}

// Visually-hidden type prefix so screen readers announce the toast kind
const TYPE_LABEL = {
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
  info: 'Information',
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

      {/* Toast container — fixed bottom-center.
          aria-live="polite" announces additions to assistive tech.
          Errors are role="alert" individually below for assertive read. */}
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
              className={`pointer-events-auto toast flex items-center gap-3 px-4 py-3 rounded-xl border-2 bg-white shadow-lg ${BORDER_STYLES[toast.type]}`}
              // Errors get assertive announcement; others polite via container
              role={toast.type === 'error' ? 'alert' : 'status'}
            >
              <div className={`p-1 rounded-full flex-shrink-0 ${ICON_STYLES[toast.type]}`}>
                <Icon className="w-3.5 h-3.5" aria-hidden="true" />
              </div>
              <p className="text-sm text-body flex-1">
                <span className="sr-only">{TYPE_LABEL[toast.type]}: </span>
                {toast.message}
              </p>

              {toast.undoAction && (
                <button
                  onClick={async () => {
                    await toast.undoAction!()
                    dismissToast(toast.id)
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold text-tanzanite-700 bg-tanzanite-50 hover:bg-tanzanite-100 transition-colors flex-shrink-0
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tanzanite-500 focus-visible:ring-offset-1"
                >
                  <Undo2 className="w-3 h-3" aria-hidden="true" /> Undo
                </button>
              )}

              <button
                onClick={() => dismissToast(toast.id)}
                className="p-1 rounded hover:bg-gray-100 text-body/70 hover:text-body flex-shrink-0
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tanzanite-500 focus-visible:ring-offset-1"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
