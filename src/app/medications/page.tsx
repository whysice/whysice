'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Pill, DollarSign, ChevronRight } from 'lucide-react'
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

  useEffect(() => {
    getMedications()
      .then(data => { setMedications(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

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
      <p className="text-slate mb-8">Drug reference for canine dermatology treatments, grouped by class.</p>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-tanzanite-50 rounded-xl animate-pulse" />)}
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
                    href={`/medications/${med.slug}`}
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
