'use client'

import { useState, useEffect } from 'react'
import { useParams, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Pill, AlertTriangle, BookOpen, Stethoscope, Shield, DollarSign } from 'lucide-react'
import { getMedication } from '@/lib/supabase'

type Medication = {
  id: string; name: string; slug: string; brand_names: string[] | null
  drug_class: string; summary_owner: string; detail_vet: Record<string, any> | null
  side_effects: { common: string[]; uncommon: string[]; serious: string[] }
  contraindications: Record<string, string> | null; cost_tier: string | null
  sources: any[] | null
  condition_medications: {
    is_first_line: boolean; notes: string
    conditions: { id: string; name: string; slug: string; severity_range: string }
  }[]
}

function CostDisplay({ tier }: { tier: string | null }) {
  if (!tier) return null
  const info: Record<string, { label: string; dots: number }> = {
    low: { label: 'Low cost', dots: 1 },
    moderate: { label: 'Moderate cost', dots: 2 },
    high: { label: 'High cost', dots: 3 },
    premium: { label: 'Premium cost', dots: 4 },
  }
  const t = info[tier] || { label: tier, dots: 0 }
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1,2,3,4].map(i => (
          <DollarSign key={i} className={`w-3.5 h-3.5 ${i <= t.dots ? 'text-tanzanite-500' : 'text-tanzanite-100'}`} />
        ))}
      </div>
      <span className="text-xs text-slate">{t.label}</span>
    </div>
  )
}

function formatKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    .replace('Otc', 'OTC').replace('Asit', 'ASIT')
}

export default function MedicationPage() {
  const params = useParams()
  const slug = params?.slug as string
  const [med, setMed] = useState<Medication | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'owner' | 'vet'>('owner')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    getMedication(slug)
      .then(data => { setMed(data); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [slug])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-tanzanite-50 rounded w-1/3" />
          <div className="h-4 bg-tanzanite-50 rounded w-2/3" />
          <div className="h-48 bg-tanzanite-50 rounded" />
        </div>
      </div>
    )
  }

  if (error || !med) {
    notFound()
  }

  const firstLine = med.condition_medications?.filter(cm => cm.is_first_line) || []
  const secondLine = med.condition_medications?.filter(cm => !cm.is_first_line) || []

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate mb-6">
        <Link href="/wiki/medications" className="hover:text-tanzanite-500 transition-colors">Medications</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-body font-medium">{med.brand_names?.[0] || med.name}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-tanzanite-800 mb-1">
            {med.brand_names?.[0] || med.name}
          </h1>
          {med.brand_names && med.brand_names.length > 0 && (
            <p className="text-slate text-sm mb-2">
              {med.name} {med.brand_names.length > 1 && `(also: ${med.brand_names.slice(1).join(', ')})`}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <span className="badge badge-medication">{med.drug_class}</span>
            <CostDisplay tier={med.cost_tier} />
          </div>
        </div>

        {/* View Toggle */}
        {med.detail_vet && (
          <div className="flex items-center bg-tanzanite-50 rounded-lg p-1 self-start">
            <button
              onClick={() => setViewMode('owner')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'owner' ? 'toggle-owner shadow-sm' : 'text-slate hover:text-body'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> Owner
            </button>
            <button
              onClick={() => setViewMode('vet')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'vet' ? 'toggle-vet shadow-sm' : 'text-slate hover:text-body'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" /> Vet Detail
            </button>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="card mb-8">
        <p className="text-body leading-relaxed">{med.summary_owner}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">

          {/* Vet Detail */}
          {viewMode === 'vet' && med.detail_vet && (
            <div className="card border-ice-200">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-ice-100">
                <Stethoscope className="w-4 h-4 text-ice-600" />
                <h2 className="font-semibold text-tanzanite-800">Clinical Detail</h2>
                <span className="badge bg-ice-50 text-ice-700 text-xs">Professional</span>
              </div>
              {Object.entries(med.detail_vet).map(([key, value]) => (
                <div key={key} className="mb-5">
                  <h3 className="text-sm font-semibold text-ice-600 uppercase tracking-wide mb-2">{formatKey(key)}</h3>
                  <p className="text-sm text-body leading-relaxed">{String(value)}</p>
                </div>
              ))}
            </div>
          )}

          {/* Side Effects */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-tanzanite-50">
              <AlertTriangle className="w-4 h-4 text-tanzanite-500" />
              <h2 className="font-semibold text-tanzanite-800">Side Effects</h2>
            </div>

            {med.side_effects.common?.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-slate uppercase tracking-wide mb-2">Common</h4>
                <div className="flex flex-wrap gap-2">
                  {med.side_effects.common.map(se => (
                    <span key={se} className="badge bg-amber-50 text-amber-700">{se}</span>
                  ))}
                </div>
              </div>
            )}

            {med.side_effects.uncommon?.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-slate uppercase tracking-wide mb-2">Uncommon</h4>
                <div className="flex flex-wrap gap-2">
                  {med.side_effects.uncommon.map(se => (
                    <span key={se} className="badge bg-orange-50 text-orange-700">{se}</span>
                  ))}
                </div>
              </div>
            )}

            {med.side_effects.serious?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">Serious (Rare)</h4>
                <div className="flex flex-wrap gap-2">
                  {med.side_effects.serious.map(se => (
                    <span key={se} className="badge bg-red-50 text-red-700">{se}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Contraindications */}
          {med.contraindications && Object.keys(med.contraindications).length > 0 && (
            <div className="card border-red-100">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-red-50">
                <Shield className="w-4 h-4 text-red-500" />
                <h2 className="font-semibold text-tanzanite-800">Contraindications</h2>
              </div>
              {Object.entries(med.contraindications).map(([key, value]) => (
                <div key={key} className="mb-3 last:mb-0">
                  <h4 className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">{formatKey(key)}</h4>
                  <p className="text-sm text-body">{String(value)}</p>
                </div>
              ))}
            </div>
          )}

          {/* Sources */}
          {med.sources && med.sources.length > 0 && (
            <div className="p-4 bg-tanzanite-50/50 rounded-lg">
              <h3 className="text-xs font-semibold text-tanzanite-500 uppercase tracking-wide mb-3">Sources & References</h3>
              <ol className="space-y-2 list-decimal list-inside">
                {med.sources.map((source: any, i: number) => (
                  <li key={i} className="text-xs text-slate leading-relaxed">
                    {source.authors && <span className="text-body font-medium">{source.authors} </span>}
                    {source.url ? (
                      <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-tanzanite-500 hover:text-tanzanite-700 underline underline-offset-2">
                        {source.title}
                      </a>
                    ) : (
                      <span className="italic">{source.title}</span>
                    )}
                    {source.journal && <span>. {source.journal}</span>}
                    {source.year && <span> ({source.year})</span>}
                    {source.evidence_grade && (
                      <span className={`ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        source.evidence_grade === 'high' ? 'bg-green-100 text-green-700' :
                        source.evidence_grade === 'moderate' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {source.evidence_grade}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* Sidebar - Related Conditions */}
        <div className="lg:col-span-1">
          <div className="card sticky top-20">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-tanzanite-50">
              <Pill className="w-4 h-4 text-tanzanite-500" />
              <h2 className="font-semibold text-tanzanite-800 text-sm">Used For</h2>
            </div>

            {firstLine.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-tanzanite-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> First-Line For
                </h4>
                <div className="space-y-2">
                  {firstLine.map(cm => (
                    <Link
                      key={cm.conditions.id}
                      href={`/wiki/search?q=${encodeURIComponent(cm.conditions.name)}`}
                      className="block p-3 rounded-lg bg-tanzanite-50/50 hover:bg-tanzanite-50 transition-colors"
                    >
                      <span className="font-medium text-sm text-tanzanite-800">{cm.conditions.name}</span>
                      {cm.notes && <p className="text-xs text-tanzanite-400 mt-1">{cm.notes}</p>}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {secondLine.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate uppercase tracking-wide mb-2">Also Used For</h4>
                <div className="space-y-2">
                  {secondLine.map(cm => (
                    <Link
                      key={cm.conditions.id}
                      href={`/wiki/search?q=${encodeURIComponent(cm.conditions.name)}`}
                      className="block p-3 rounded-lg bg-gray-50 hover:bg-tanzanite-50/50 transition-colors"
                    >
                      <span className="font-medium text-sm text-body">{cm.conditions.name}</span>
                      {cm.notes && <p className="text-xs text-slate mt-1">{cm.notes}</p>}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
