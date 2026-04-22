'use client'

import { useState, useEffect } from 'react'
import { useParams, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BookOpen, Stethoscope, AlertTriangle, Pill, ChevronRight, ExternalLink, Shield } from 'lucide-react'
import { getCondition } from '@/lib/supabase'

type Condition = {
  id: string
  name: string
  slug: string
  summary_owner: string
  detail_owner: Record<string, any>
  detail_vet: Record<string, any> | null
  breeds_affected: string[] | null
  severity_range: string | null
  is_contagious: boolean
  tags: string[] | null
  sources: any[] | null
  categories: { name: string; slug: string }
  condition_medications: {
    is_first_line: boolean
    notes: string
    medications: {
      id: string
      name: string
      slug: string
      brand_names: string[]
      drug_class: string
      cost_tier: string
    }
  }[]
}

function SeverityBadge({ severity }: { severity: string | null }) {
  if (!severity) return null
  const styles: Record<string, string> = {
    mild: 'badge-severity-mild',
    moderate: 'badge-severity-moderate',
    severe: 'badge-severity-severe',
    variable: 'bg-tanzanite-50 text-tanzanite-700',
  }
  return <span className={`badge ${styles[severity] || ''}`}>{severity}</span>
}

function CostBadge({ tier }: { tier: string }) {
  const labels: Record<string, string> = { low: '$', moderate: '$$', high: '$$$', premium: '$$$$' }
  return <span className="text-xs text-slate">{labels[tier] || tier}</span>
}

function ContentSection({ title, content, isTip }: { title: string; content: any; isTip?: boolean }) {
  if (!content) return null

  // Special callout styling for tips
  if (isTip) {
    const items = Array.isArray(content) ? content : [content]
    return (
      <div className="mb-6 p-4 bg-ice-50 border border-ice-200 rounded-lg">
        <h3 className="text-sm font-semibold text-tanzanite-600 mb-2 flex items-center gap-2">
          <span className="text-lg">💡</span> {title}
        </h3>
        {items.map((item: string, i: number) => (
          <p key={i} className="text-sm text-body leading-relaxed">{item}</p>
        ))}
      </div>
    )
  }

  if (Array.isArray(content)) {
    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-tanzanite-500 uppercase tracking-wide mb-2">{title}</h3>
        <ul className="space-y-1.5">
          {content.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-body">
              <span className="w-1.5 h-1.5 rounded-full bg-tanzanite-300 mt-1.5 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  if (typeof content === 'string') {
    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-tanzanite-500 uppercase tracking-wide mb-2">{title}</h3>
        <p className="text-sm text-body leading-relaxed">{content}</p>
      </div>
    )
  }

  return null
}

function VetSection({ title, content }: { title: string; content: any }) {
  if (!content) return null

  if (Array.isArray(content)) {
    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-ice-600 uppercase tracking-wide mb-2">{title}</h3>
        <ul className="space-y-1.5">
          {content.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-body">
              <span className="w-1.5 h-1.5 rounded-full bg-ice-400 mt-1.5 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  if (typeof content === 'string') {
    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-ice-600 uppercase tracking-wide mb-2">{title}</h3>
        <p className="text-sm text-body leading-relaxed">{content}</p>
      </div>
    )
  }

  return null
}

// Pretty-print JSONB keys
function formatKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace('Otc', 'OTC')
    .replace('Vet', 'Vet')
}

export default function ConditionPage() {
  const params = useParams()
  const slug = params?.slug as string
  const [condition, setCondition] = useState<Condition | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'owner' | 'vet'>('owner')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    getCondition(slug)
      .then(data => { setCondition(data); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [slug])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-tanzanite-50 rounded w-1/3" />
          <div className="h-4 bg-tanzanite-50 rounded w-2/3" />
          <div className="h-32 bg-tanzanite-50 rounded" />
        </div>
      </div>
    )
  }

  if (error || !condition) {
    notFound()
  }

  const ownerContent = condition.detail_owner || {}
  const vetContent = condition.detail_vet || {}
  const firstLine = condition.condition_medications?.filter(cm => cm.is_first_line) || []
  const secondLine = condition.condition_medications?.filter(cm => !cm.is_first_line) || []

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate mb-6">
        <Link href="/wiki/conditions" className="hover:text-tanzanite-500 transition-colors">Conditions</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/wiki/conditions/${condition.categories.slug}`} className="hover:text-tanzanite-500 transition-colors">
          {condition.categories.name}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-body font-medium">{condition.name}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-tanzanite-800 mb-2">{condition.name}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={condition.severity_range} />
            {condition.is_contagious && (
              <span className="badge bg-red-50 text-red-700">
                <AlertTriangle className="w-3 h-3 mr-1" /> Contagious
              </span>
            )}
            <span className="badge badge-condition">{condition.categories.name}</span>
          </div>
        </div>

        {/* View Toggle */}
        {condition.detail_vet && (
          <div className="flex items-center bg-tanzanite-50 rounded-lg p-1 self-start">
            <button
              onClick={() => setViewMode('owner')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'owner' ? 'toggle-owner shadow-sm' : 'text-slate hover:text-body'
              }`}
              aria-pressed={viewMode === 'owner'}
            >
              <BookOpen className="w-3.5 h-3.5" /> Owner
            </button>
            <button
              onClick={() => setViewMode('vet')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'vet' ? 'toggle-vet shadow-sm' : 'text-slate hover:text-body'
              }`}
              aria-pressed={viewMode === 'vet'}
            >
              <Stethoscope className="w-3.5 h-3.5" /> Vet Detail
            </button>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="card mb-8">
        <p className="text-body leading-relaxed">{condition.summary_owner}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Owner Content */}
          {viewMode === 'owner' && (
            <div className="card">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-tanzanite-50">
                <BookOpen className="w-4 h-4 text-tanzanite-500" />
                <h2 className="font-semibold text-tanzanite-800">Owner Guide</h2>
              </div>
              {Object.entries(ownerContent).map(([key, value]) => {
                const isTip = key.toLowerCase().includes('tip') || key.toLowerCase().includes('pro_tip') || key.toLowerCase().includes('practical_tip') || key.toLowerCase().includes('zero_cost')
                return <ContentSection key={key} title={formatKey(key)} content={value} isTip={isTip} />
              })}
            </div>
          )}

          {/* Vet Content */}
          {viewMode === 'vet' && vetContent && (
            <div className="card border-ice-200">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-ice-100">
                <Stethoscope className="w-4 h-4 text-ice-600" />
                <h2 className="font-semibold text-tanzanite-800">Clinical Detail</h2>
                <span className="badge bg-ice-50 text-ice-700 text-xs">Professional</span>
              </div>
              {Object.entries(vetContent).map(([key, value]) => (
                <VetSection key={key} title={formatKey(key)} content={value} />
              ))}
            </div>
          )}

          {/* Breeds Affected */}
          {condition.breeds_affected && condition.breeds_affected.length > 0 && (
            <div className="card mt-6">
              <h3 className="text-sm font-semibold text-tanzanite-500 uppercase tracking-wide mb-3">
                Commonly Affected Breeds
              </h3>
              <div className="flex flex-wrap gap-2">
                {condition.breeds_affected.map(breed => (
                  <span key={breed} className="badge bg-tanzanite-50 text-tanzanite-600">{breed}</span>
                ))}
              </div>
            </div>
          )}

          {/* Sources */}
          {condition.sources && condition.sources.length > 0 && (
            <div className="mt-6 p-4 bg-tanzanite-50/50 rounded-lg">
              <h3 className="text-xs font-semibold text-tanzanite-500 uppercase tracking-wide mb-3">Sources & References</h3>
              <ol className="space-y-2 list-decimal list-inside">
                {condition.sources.map((source: any, i: number) => (
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

        {/* Sidebar - Medications */}
        <div className="lg:col-span-1">
          <div className="card sticky top-20">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-tanzanite-50">
              <Pill className="w-4 h-4 text-tanzanite-500" />
              <h2 className="font-semibold text-tanzanite-800 text-sm">Treatment Options</h2>
            </div>

            {firstLine.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-tanzanite-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> First-Line
                </h4>
                <div className="space-y-2">
                  {firstLine.map(cm => (
                    <Link
                      key={cm.medications.id}
                      href={`/wiki/medications/${cm.medications.slug}`}
                      className="block p-3 rounded-lg bg-tanzanite-50/50 hover:bg-tanzanite-50 transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm text-tanzanite-800 group-hover:text-tanzanite-600">
                          {cm.medications.brand_names?.[0] || cm.medications.name}
                        </span>
                        <CostBadge tier={cm.medications.cost_tier} />
                      </div>
                      <p className="text-xs text-slate mt-0.5">{cm.medications.drug_class}</p>
                      {cm.notes && <p className="text-xs text-tanzanite-400 mt-1">{cm.notes}</p>}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {secondLine.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate uppercase tracking-wide mb-2">Additional Options</h4>
                <div className="space-y-2">
                  {secondLine.map(cm => (
                    <Link
                      key={cm.medications.id}
                      href={`/wiki/medications/${cm.medications.slug}`}
                      className="block p-3 rounded-lg bg-gray-50 hover:bg-tanzanite-50/50 transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm text-body group-hover:text-tanzanite-600">
                          {cm.medications.brand_names?.[0] || cm.medications.name}
                        </span>
                        <CostBadge tier={cm.medications.cost_tier} />
                      </div>
                      <p className="text-xs text-slate mt-0.5">{cm.medications.drug_class}</p>
                      {cm.notes && <p className="text-xs text-tanzanite-400 mt-1">{cm.notes}</p>}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {condition.condition_medications?.length === 0 && (
              <p className="text-sm text-slate">No medications linked yet.</p>
            )}
          </div>

          {/* Tags */}
          {condition.tags && condition.tags.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-slate uppercase tracking-wide mb-2">Related Tags</h4>
              <div className="flex flex-wrap gap-1.5">
                {condition.tags.map(tag => (
                  <Link
                    key={tag}
                    href={`/wiki/search?q=${encodeURIComponent(tag)}`}
                    className="text-xs px-2 py-1 rounded bg-tanzanite-50 text-tanzanite-500 hover:bg-tanzanite-100 transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
