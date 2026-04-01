'use client'

import { useState, useRef, useEffect, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

// ============================================
// UCD Optimization #2: Inline Confirmation Dialog
// Replaces browser-native confirm() with an
// accessible, styled inline confirmation.
// ============================================

type ConfirmDialogProps = {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'neutral'
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

const VARIANT_STYLES = {
  danger: {
    confirmBtn: 'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-400',
    icon: 'text-red-500',
    border: 'border-red-100',
  },
  warning: {
    confirmBtn: 'bg-amber-500 text-white hover:bg-amber-600 focus-visible:ring-amber-400',
    icon: 'text-amber-500',
    border: 'border-amber-100',
  },
  neutral: {
    confirmBtn: 'bg-tanzanite-500 text-white hover:bg-tanzanite-600 focus-visible:ring-tanzanite-400',
    icon: 'text-tanzanite-500',
    border: 'border-tanzanite-100',
  },
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const styles = VARIANT_STYLES[variant]

  // Focus the cancel button on mount for safety
  useEffect(() => {
    cancelRef.current?.focus()
  }, [])

  async function handleConfirm() {
    setLoading(true)
    try {
      await onConfirm()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={`mt-3 p-3 rounded-lg border ${styles.border} bg-white`}
      role="alertdialog"
      aria-label={title || 'Confirm action'}
    >
      <div className="flex items-start gap-2 mb-3">
        <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${styles.icon}`} />
        <div>
          {title && <p className="text-sm font-medium text-body mb-0.5">{title}</p>}
          <p className="text-sm text-slate">{message}</p>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button
          ref={cancelRef}
          onClick={onCancel}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate bg-gray-50 hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tanzanite-400 focus-visible:ring-offset-1"
        >
          {cancelLabel}
        </button>
        <button
          onClick={handleConfirm}
          disabled={loading}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 ${styles.confirmBtn}`}
        >
          {loading ? 'Working...' : confirmLabel}
        </button>
      </div>
    </div>
  )
}

// Hook for managing inline confirm state
export function useConfirmDialog() {
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  return {
    confirmingId,
    requestConfirm: (id: string) => setConfirmingId(id),
    cancelConfirm: () => setConfirmingId(null),
    isConfirming: (id: string) => confirmingId === id,
  }
}
