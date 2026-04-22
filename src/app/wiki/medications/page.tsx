'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Pill, DollarSign, ChevronRight, AlertCircle, RotateCcw, Search, ArrowRight } from 'lucide-react'
import { getMedications } from '@/lib/supabase'

type MedCard = {
  id: string; name: string; slug: string; brand_names: string[] | null
  drug_class: string; summary_owner: string; cost_tier: string | null
}

function CostDots({ tier }: { tier: string | null }) {
  if (!tier) return null
  const n: Record<string, number> = { low: 1, moderate: 2, high: 3, premium: 4 }
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4].map(i => (
        <DollarSign key={i} className={`w-3 h-3 ${i <= (n[tier] || 0) ? 'text-tanzanite-500' : 'text-tanzanite-100'}`} />
      ))}
    </div>
  )
}

export default function MedicationsIndexPage() {
  const [medications, setMedications] = useState<MedCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  function load() {
    setLoading(true)
    setError(null)
    getMedications()
      .then(data => { setMedications((data ?? []) as MedCard[]); setLoading(false) })
      .catch(err => {
        console.error('Failed to load medications:', err)
        setError(err?.message || 'Failed to load medications. Please try again.')
        setLoading(false)
      })
  }

  useEffect(() => { load() }, [])

  // Group by drug class, preserving sort_order within groups
  const classOrder = ['Immunotherapy', 'Monoclonal antibody', 'Calcineurin inhibitor', 'Methylxanthine / Immunomodulator', 'JAK inhibitor', 'Second-generation antihistamine', 'First-generation cephalosporin']
  const grouped = medications.reduce<Record<string, MedCard[]>>((acc, med) => {
    const cls = med.drug_class
    if (!acc[cls]) acc[cls] = []
    acc[cls].push(med)
    return acc
  }, {})
  const sortedClasses = Object.keys(grouped).sort((a, b) => {
    const ai = classOrder.indexOf(a)
    const bi = classOrder.indexOf(b)
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
  })

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-tanzanite-800 mb-2">Medications</h1>
      <p className="text-slate mb-6">Drug reference for canine dermatology treatments, grouped by class.</p>

      {/* Full Drug Lookup CTA — lives at /vetmed (ships in Phase 2) */}
      <div
        aria-disabled="true"
        className="block mb-8 p-5 rounded-xl bg-gradient-to-r from-tanzanite-700/80 to-tanzanite-500/80 text-white shadow-md"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Search className="w-5 h-5 text-ice-200" />
              <h3 className="font-bold text-lg">Full Medication Lookup</h3>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-white/20">Coming soon</span>
            </div>
            <p className="text-sm text-tanzanite-100">
              Cross-specialty reference — 115+ drugs with dosing, interactions, safety flags, and monitoring. Will live at <span className="font-mono">/vetmed</span>.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-tanzanite-50 rounded-xl animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="card text-center py-12">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-body mb-1">Couldn&apos;t load medications</p>
          <p className="text-sm text-slate mb-4 max-w-sm mx-auto">{error}</p>
          <button onClick={load} className="btn-primary inline-flex items-center gap-2">
            <RotateCcw className="w-4 h-4" /> Try again
          </button>
        </div>
      ) : medications.length === 0 ? (
        <div className="card text-center py-12">
          <Pill className="w-10 h-10 text-tanzanite-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-body mb-1">No medications yet</p>
          <p className="text-sm text-slate max-w-sm mx-auto">
            The medication reference hasn&apos;t been populated yet.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedClasses.map(drugClass => {
            const meds = grouped[drugClass]
            return (
            <div key={drugClass}>
              <h2 className="text-lg font-semibold text-tanzanite-500 mb-3 flex items-center gap-2">
                <Pill className="w-4 h-4" />
                {drugClass}
              </h2>
              <div className="space-y-3">
                {meds.map(med => (
                  <Link
                    key={med.id}
                    href={`/wiki/medications/${med.slug}`}
                    className="card block group hover:border-tanzanite-200 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-tanzanite-800 group-hover:text-tanzanite-600 transition-colors">
                            {med.brand_names?.[0] || med.name}
                          </h3>
                          <CostDots tier={med.cost_tier} />
                        </div>
                        {med.brand_names && (
                          <p className="text-xs text-slate mb-1">
                            {med.name} {med.brand_names.length > 1 && `| ${med.brand_names.slice(1).join(', ')}`}
                          </p>
                        )}
                        <p className="text-sm text-slate line-clamp-2">{med.summary_owner}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-tanzanite-300 group-hover:text-tanzanite-500 transition-colors flex-shrink-0 mt-1" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
