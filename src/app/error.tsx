'use client'

import { useEffect } from 'react'
import { AlertCircle, RotateCcw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App error:', error)
  }, [error])

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-tanzanite-800 mb-2">Something went wrong</h2>
      <p className="text-sm text-slate mb-6">
        An unexpected error occurred. This has been logged and we&apos;ll look into it.
      </p>
      <button
        onClick={reset}
        className="btn-primary inline-flex items-center gap-2"
      >
        <RotateCcw className="w-4 h-4" /> Try again
      </button>
    </div>
  )
}
