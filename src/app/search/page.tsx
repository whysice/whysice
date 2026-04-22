'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search as SearchIcon, Pill, BookOpen, ArrowRight, Layers } from 'lucide-react'
import { searchWiki } from '@/lib/supabase'
import { DRUGS, matchesDrug, classifyDrug, slugifyDrug, type DrugEntry } from '@/lib/drugData'

type WikiResult = {
  id: string; type: 'condition' | 'medication'; name: string; slug: string
  summary: string; category_name: string; category_slug: string | null; rank: number
}

const VETMED_RESULT_LIMIT = 10

function wikiLink(r: WikiResult): string {
  if (r.type === 'medication') return `/wiki/medications/${r.slug}`
  if (r.category_slug) return `/wiki/conditions/${r.category_slug}/${r.slug}`
  return `/wiki/conditions?highlight=${encodeURIComponent(r.slug)}`
}

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQuery = searchParams.get('q') || ''
  const [query, setQuery] = useState(initialQuery)
  const [wikiResults, setWikiResults] = useState<WikiResult[]>([])
  const [wikiLoading, setWikiLoading] = useState(false)
  const [wikiError, setWikiError] = useState(false)
  const [searched, setSearched] = useState(false)

  const vetmedResults: DrugEntry[] = useMemo(() => {
    const q = initialQuery.trim()
    if (!q) return []
    return DRUGS.filter(d => matchesDrug(d, q)).slice(0, VETMED_RESULT_LIMIT)
  }, [initialQuery])

  useEffect(() => {
    if (!initialQuery.trim()) return
    let cancelled = false
    setWikiLoading(true)
    setWikiError(false)
    setSearched(true)
    searchWiki(initialQuery.trim())
      .then(data => { if (!cancelled) setWikiResults(data || []) })
      .catch(() => { if (!cancelled) { setWikiResults([]); setWikiError(true) } })
      .finally(() => { if (!cancelled) setWikiLoading(false) })
    return () => { cancelled = true }
  }, [initialQuery])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  const vetmedCount = vetmedResults.length
  const wikiCount = wikiResults.length
  const totalCount = wikiCount + vetmedCount

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-tanzanite-500 mb-2">
        <Layers className="w-3.5 h-3.5" /> Cross-tool search
      </div>
      <h1 className="text-3xl font-bold text-tanzanite-800 mb-6">Search</h1>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="relative">
          <SearchIcon className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${wikiLoading ? 'text-tanzanite-300 animate-pulse' : 'text-slate'}`} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search conditions, medications, drug names…"
            className="search-input pl-12"
            aria-label="Search all Whysice tools"
            autoFocus
          />
        </div>
        <p className="text-xs text-slate mt-2">
          Searches the derm wiki and the cross-specialty drug reference together.
          For derm-only results, use <Link href="/wiki/search" className="text-tanzanite-500 underline">wiki search</Link>.
        </p>
      </form>

      {!searched && (
        <div className="text-center py-12">
          <SearchIcon className="w-10 h-10 text-tanzanite-200 mx-auto mb-3" />
          <p className="text-slate text-sm max-w-sm mx-auto">
            Search conditions, medications, and 115+ cross-specialty drugs in one place.
          </p>
        </div>
      )}

      {searched && totalCount === 0 && !wikiLoading && (
        <div className="text-center py-12">
          <SearchIcon className="w-10 h-10 text-tanzanite-200 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-tanzanite-800 mb-1">No results</h2>
          <p className="text-slate text-sm mb-4">Try different keywords, or browse directly.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/wiki/conditions" className="btn-secondary text-sm">Browse Conditions</Link>
            <Link href="/wiki/medications" className="btn-secondary text-sm">Browse Wiki Meds</Link>
            <Link href="/vetmed" className="btn-secondary text-sm">Open Vet Med</Link>
          </div>
        </div>
      )}

      {searched && (wikiLoading || wikiCount > 0 || wikiError) && (
        <section className="mb-8">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-sm font-bold tracking-wider uppercase text-tanzanite-500 flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> From the Wiki
            </h2>
            {!wikiLoading && (
              <span className="text-xs text-slate">{wikiCount} result{wikiCount !== 1 ? 's' : ''}</span>
            )}
          </div>

          {wikiLoading && (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-20 bg-tanzanite-50 rounded-xl animate-pulse" />)}
            </div>
          )}

          {!wikiLoading && wikiError && (
            <p className="text-xs text-slate">Wiki search is unavailable right now.</p>
          )}

          {!wikiLoading && !wikiError && wikiCount === 0 && (
            <p className="text-xs text-slate">No wiki results for &ldquo;{initialQuery}&rdquo;.</p>
          )}

          {!wikiLoading && wikiCount > 0 && (
            <div className="space-y-3">
              {wikiResults.map(r => (
                <Link
                  key={`${r.type}-${r.id}`}
                  href={wikiLink(r)}
                  className="card block group hover:border-tanzanite-200 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${r.type === 'condition' ? 'bg-tanzanite-50' : 'bg-ice-50'}`}>
                      {r.type === 'condition' ? (
                        <BookOpen className="w-4 h-4 text-tanzanite-500" />
                      ) : (
                        <Pill className="w-4 h-4 text-ice-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <h3 className="font-semibold text-tanzanite-800 group-hover:text-tanzanite-600 transition-colors">{r.name}</h3>
                        <span className={`badge text-xs ${r.type === 'condition' ? 'badge-condition' : 'badge-medication'}`}>{r.type}</span>
                      </div>
                      <p className="text-xs text-tanzanite-400 mb-1">{r.category_name}</p>
                      <p className="text-sm text-slate line-clamp-2">{r.summary}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-tanzanite-300 group-hover:text-tanzanite-500 transition-colors flex-shrink-0 mt-1" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {searched && vetmedCount > 0 && (
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-sm font-bold tracking-wider uppercase text-tanzanite-500 flex items-center gap-2">
              <Pill className="w-4 h-4" /> From Vet Med
            </h2>
            <span className="text-xs text-slate">
              {vetmedCount}{vetmedCount === VETMED_RESULT_LIMIT ? '+' : ''} result{vetmedCount !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-3">
            {vetmedResults.map(drug => (
              <Link
                key={drug.genericName}
                href={`/vetmed/${slugifyDrug(drug)}`}
                className="card block group hover:border-tanzanite-200 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg flex-shrink-0 bg-ice-50">
                    <Pill className="w-4 h-4 text-ice-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <h3 className="font-semibold text-tanzanite-800 group-hover:text-tanzanite-600 transition-colors">{drug.genericName}</h3>
                      <span className="text-xs text-tanzanite-300 font-medium">{classifyDrug(drug.drugClass)}</span>
                    </div>
                    <p className="text-xs text-tanzanite-400 mb-1">{drug.brandNames.replace(/;/g, ' · ')}</p>
                    <p className="text-sm text-slate line-clamp-2">{drug.indications.split(';').slice(0, 3).join(' · ')}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-tanzanite-300 group-hover:text-tanzanite-500 transition-colors flex-shrink-0 mt-1" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="h-12 bg-tanzanite-50 rounded-xl animate-pulse" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
