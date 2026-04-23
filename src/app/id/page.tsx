'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Fingerprint, PawPrint, Plus, ArrowRight, AlertCircle } from 'lucide-react'
import { supabase, getDogs } from '@/lib/supabase'
import { LoginPrompt } from '@/components/LoginPrompt'

type Dog = {
  id: string; name: string; breed: string | null; dob: string | null
  weight_lbs: number | null; photo_url: string | null
}

function ageYears(dob: string | null) {
  if (!dob) return null
  const y = (Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  return Math.floor(y)
}

export default function IdLandingPage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [dogs, setDogs] = useState<Dog[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let resolved = false
    supabase.auth.getSession()
      .then(({ data: { session } }) => { resolved = true; setUser(session?.user || null); setAuthLoading(false) })
      .catch(() => { resolved = true; setUser(null); setAuthLoading(false) })
    const fallback = setTimeout(() => { if (!resolved) setAuthLoading(false) }, 5000)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setUser(s?.user || null); setAuthLoading(false)
    })
    return () => { clearTimeout(fallback); subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    if (!user) return
    setLoadError(null)
    getDogs()
      .then(data => setDogs((data ?? []) as Dog[]))
      .catch(err => setLoadError(err?.message || 'Failed to load your pets.'))
  }, [user])

  if (authLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-tanzanite-50 rounded w-1/3" />
          <div className="h-48 bg-tanzanite-50 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div>
        <section className="bg-gradient-to-b from-slate-800 to-slate-900 text-white py-16 sm:py-20 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-bold tracking-wider uppercase mb-6">
              <Fingerprint className="w-3.5 h-3.5" /> Whysice ID
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">One ID, every animal</h1>
            <p className="text-slate-300 text-lg max-w-xl mx-auto leading-relaxed">
              A portable universal animal ID — one record across clinic, boarder, and border. Sign in to set up your pet&apos;s ID card.
            </p>
          </div>
        </section>
        <LoginPrompt
          title="Sign in to set up an ID"
          description="Create a free account to generate a portable ID card for your pet — presentable at the clinic, boarder, or border."
          redirectTo="/id"
          browseLink={{ href: '/wiki/conditions', label: 'Browse the wiki' }}
        />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-tanzanite-500 mb-2">
        <Fingerprint className="w-3.5 h-3.5" /> Whysice ID
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-tanzanite-800 mb-1">Your pets</h1>
      <p className="text-sm text-slate mb-6">Pick a pet to view or share their ID card.</p>

      {loadError && (
        <div className="card border-l-4 border-l-red-400 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-body">Couldn&apos;t load your pets</p>
            <p className="text-xs text-slate mt-0.5">{loadError}</p>
          </div>
        </div>
      )}

      {!loadError && dogs.length === 0 && (
        <div className="card text-center py-16">
          <PawPrint className="w-12 h-12 text-tanzanite-200 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-tanzanite-800 mb-2">Add your first pet</h2>
          <p className="text-slate mb-6 max-w-sm mx-auto">
            Create a profile in the tracker, then come back here to generate an ID card.
          </p>
          <Link href="/dashboard/dogs/new" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add a pet
          </Link>
        </div>
      )}

      {dogs.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4">
          {dogs.map(dog => {
            const age = ageYears(dog.dob)
            return (
              <Link
                key={dog.id}
                href={`/id/${dog.id}`}
                className="card group hover:border-tanzanite-200 hover:shadow-md transition-all flex items-center gap-4"
              >
                <div className="w-16 h-16 rounded-full bg-tanzanite-50 flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-tanzanite-100">
                  {dog.photo_url ? (
                    <Image src={dog.photo_url} alt={dog.name} width={64} height={64} className="w-full h-full object-cover" />
                  ) : (
                    <PawPrint className="w-7 h-7 text-tanzanite-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-tanzanite-800 group-hover:text-tanzanite-600 transition-colors">{dog.name}</h3>
                  <p className="text-xs text-slate mt-0.5">
                    {[dog.breed, age != null && `${age} yr`, dog.weight_lbs && `${dog.weight_lbs} lbs`].filter(Boolean).join(' · ') || 'No details yet'}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-tanzanite-300 group-hover:text-tanzanite-500 transition-colors flex-shrink-0" />
              </Link>
            )
          })}
        </div>
      )}

      {dogs.length > 0 && (
        <div className="mt-8 text-center">
          <Link href="/dashboard/dogs/new" className="text-sm text-tanzanite-500 hover:text-tanzanite-700 inline-flex items-center gap-1">
            <Plus className="w-4 h-4" /> Add another pet
          </Link>
        </div>
      )}
    </div>
  )
}
