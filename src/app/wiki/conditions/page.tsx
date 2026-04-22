'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShieldAlert, Footprints, Bug, Dna, Search as SearchIcon, ArrowRight, AlertCircle, RotateCcw } from 'lucide-react'
import { getCategories } from '@/lib/supabase'

const ICONS: Record<string, any> = {
  'shield-alert': ShieldAlert,
  'footprints': Footprints,
  'bug': Bug,
  'dna': Dna,
  'search': SearchIcon,
}

const COLORS = [
  'bg-tanzanite-50 border-tanzanite-200 text-tanzanite-700',
  'bg-red-50 border-red-200 text-red-700',
  'bg-amber-50 border-amber-200 text-amber-700',
  'bg-ice-50 border-ice-200 text-ice-700',
  'bg-green-50 border-green-200 text-green-700',
]

export default function ConditionsIndexPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  function load() {
    setLoading(true)
    setError(null)
    getCategories()
      .then(data => { setCategories(data ?? []); setLoading(false) })
      .catch(err => {
        console.error('Failed to load categories:', err)
        setError(err?.message || 'Failed to load conditions. Please try again.')
        setLoading(false)
      })
  }

  useEffect(() => { load() }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-tanzanite-800 mb-2">Conditions</h1>
      <p className="text-slate mb-8">Browse canine dermatology conditions by category.</p>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-32 bg-tanzanite-50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="card text-center py-12">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-body mb-1">Couldn&apos;t load conditions</p>
          <p className="text-sm text-slate mb-4 max-w-sm mx-auto">{error}</p>
          <button onClick={load} className="btn-primary inline-flex items-center gap-2">
            <RotateCcw className="w-4 h-4" /> Try again
          </button>
        </div>
      ) : categories.length === 0 ? (
        <div className="card text-center py-12">
          <ShieldAlert className="w-10 h-10 text-tanzanite-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-body mb-1">No categories yet</p>
          <p className="text-sm text-slate max-w-sm mx-auto">
            The condition knowledge base hasn&apos;t been populated yet.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {categories.map((cat, i) => {
            const Icon = ICONS[cat.icon] || ShieldAlert
            const color = COLORS[i % COLORS.length]
            return (
              <Link
                key={cat.id}
                href={`/wiki/conditions/${cat.slug}`}
                className={`card group border ${color} hover:scale-[1.02] transition-transform duration-200`}
              >
                <Icon className="w-8 h-8 mb-3 opacity-80" />
                <h2 className="font-semibold text-base mb-1">{cat.name}</h2>
                <p className="text-sm opacity-75">{cat.description}</p>
                <div className="flex items-center gap-1 mt-3 text-sm font-medium opacity-60 group-hover:opacity-100 transition-opacity">
                  Browse <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
