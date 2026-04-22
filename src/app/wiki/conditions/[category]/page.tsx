'use client'

import { useState, useEffect } from 'react'
import { useParams, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, AlertTriangle } from 'lucide-react'
import { getCategory, getConditionsByCategory } from '@/lib/supabase'

type CategoryData = { id: string; name: string; slug: string; description: string }
type ConditionCard = {
  id: string; name: string; slug: string; summary_owner: string
  severity_range: string | null; is_contagious: boolean
  breeds_affected: string[] | null; tags: string[] | null
}

function SeverityBadge({ severity }: { severity: string | null }) {
  if (!severity) return null
  const styles: Record<string, string> = {
    mild: 'badge-severity-mild', moderate: 'badge-severity-moderate',
    severe: 'badge-severity-severe', variable: 'bg-tanzanite-50 text-tanzanite-700',
  }
  return <span className={`badge ${styles[severity] || ''}`}>{severity}</span>
}

export default function CategoryPage() {
  const params = useParams()
  const categorySlug = params?.category as string
  const [category, setCategory] = useState<CategoryData | null>(null)
  const [conditions, setConditions] = useState<ConditionCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!categorySlug) return
    Promise.all([getCategory(categorySlug), null])
      .then(async ([cat]) => {
        setCategory(cat)
        const conds = await getConditionsByCategory(cat.id)
        setConditions(conds)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [categorySlug])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-tanzanite-50 rounded w-1/3" />
          <div className="h-4 bg-tanzanite-50 rounded w-2/3" />
          <div className="space-y-3 mt-8">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-tanzanite-50 rounded-xl" />)}
          </div>
        </div>
      </div>
    )
  }

  if (!category) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate mb-6">
        <Link href="/wiki/conditions" className="hover:text-tanzanite-500 transition-colors">Conditions</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-body font-medium">{category.name}</span>
      </nav>

      <h1 className="text-3xl font-bold text-tanzanite-800 mb-2">{category.name}</h1>
      {category.description && (
        <p className="text-slate mb-8 max-w-2xl">{category.description}</p>
      )}

      <div className="space-y-4">
        {conditions.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-slate">No conditions in this category yet. Content is being added.</p>
          </div>
        )}

        {conditions.map(cond => (
          <Link
            key={cond.id}
            href={`/wiki/conditions/${categorySlug}/${cond.slug}`}
            className="card block group hover:border-tanzanite-200 transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-tanzanite-800 group-hover:text-tanzanite-600 transition-colors mb-1">
                  {cond.name}
                </h2>
                <p className="text-sm text-slate line-clamp-2">{cond.summary_owner}</p>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <SeverityBadge severity={cond.severity_range} />
                  {cond.is_contagious && (
                    <span className="badge bg-red-50 text-red-700 text-xs">
                      <AlertTriangle className="w-3 h-3 mr-0.5" /> Contagious
                    </span>
                  )}
                  {cond.breeds_affected && cond.breeds_affected.length > 0 && (
                    <span className="text-xs text-slate">
                      {cond.breeds_affected.length} breed{cond.breeds_affected.length !== 1 ? 's' : ''} affected
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-tanzanite-300 group-hover:text-tanzanite-500 transition-colors flex-shrink-0 mt-1" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
