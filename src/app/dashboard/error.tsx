'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle, RotateCcw, Home } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-tanzanite-800 mb-2">Dashboard error</h2>
      <p className="text-sm text-slate mb-6">
        Something went wrong loading your dashboard data. This could be a temporary connection issue.
      </p>
      <div className="flex justify-center gap-3">
        <button
          onClick={reset}
          className="btn-primary inline-flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" /> Try again
        </button>
        <Link href="/" className="btn-secondary inline-flex items-center gap-2">
          <Home className="w-4 h-4" /> Home
        </Link>
      </div>
    </div>
  )
}
