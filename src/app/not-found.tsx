import Link from 'next/link'
import { PawPrint, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <PawPrint className="w-12 h-12 text-tanzanite-200 mx-auto mb-4" />
      <h1 className="text-2xl font-bold text-tanzanite-800 mb-2">Page not found</h1>
      <p className="text-sm text-slate mb-6">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <div className="flex justify-center gap-3">
        <Link href="/wiki/conditions" className="btn-primary">Browse Conditions</Link>
        <Link href="/wiki/search" className="btn-secondary inline-flex items-center gap-1">
          <Search className="w-4 h-4" /> Search
        </Link>
      </div>
    </div>
  )
}
