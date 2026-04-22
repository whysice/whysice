'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search as SearchIcon, Pill, BookOpen, ArrowRight } from 'lucide-react'
import { searchWiki } from '@/lib/supabase'

type SearchResult = {
  id: string; type: string; name: string; slug: string
  summary: string; category_name: string; category_slug: string | null; rank: number
}

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQuery = searchParams.get('q') || ''
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    if (initialQuery) {
      doSearch(initialQuery)
    }
  }, [initialQuery])

  async function doSearch(q: string) {
    if (!q.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const data = await searchWiki(q.trim())
      setResults(data || [])
    } catch (err) {
      setResults([])
    }
    setLoading(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading || !query.trim()) return
    router.push(`/wiki/search?q=${encodeURIComponent(query.trim())}`)
    doSearch(query.trim())
  }

  function getLink(result: SearchResult) {
    if (result.type === 'medication') return `/wiki/medications/${result.slug}`
    if (result.category_slug) return `/wiki/conditions/${result.category_slug}/${result.slug}`
    // Fallback if category_slug is missing
    return `/wiki/conditions?highlight=${encodeURIComponent(result.slug)}`
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-tanzanite-800 mb-6">Search</h1>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="relative">
          <SearchIcon className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${loading ? 'text-tanzanite-300 animate-pulse' : 'text-slate'}`} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search conditions, medications, symptoms..."
            className="search-input pl-12"
            aria-label="Search the wiki"
            disabled={loading}
            autoFocus
          />
        </div>
      </form>

      {/* Results */}
      {loading && (
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="h-20 bg-tanzanite-50 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="text-center py-12">
          <SearchIcon className="w-10 h-10 text-tanzanite-200 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-tanzanite-800 mb-1">No results found</h2>
          <p className="text-slate text-sm mb-4">
            Try different keywords or browse by category.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/wiki/conditions" className="btn-secondary text-sm">Browse Conditions</Link>
            <Link href="/wiki/medications" className="btn-secondary text-sm">Browse Medications</Link>
          </div>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div>
          <p className="text-sm text-slate mb-4">
            {results.length} result{results.length !== 1 ? 's' : ''} for "{initialQuery}"
          </p>
          <div className="space-y-3">
            {results.map(result => (
              <Link
                key={`${result.type}-${result.id}`}
                href={getLink(result)}
                className="card block group hover:border-tanzanite-200 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg flex-shrink-0 ${
                    result.type === 'condition' ? 'bg-tanzanite-50' : 'bg-ice-50'
                  }`}>
                    {result.type === 'condition' ? (
                      <BookOpen className="w-4 h-4 text-tanzanite-500" />
                    ) : (
                      <Pill className="w-4 h-4 text-ice-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-tanzanite-800 group-hover:text-tanzanite-600 transition-colors">
                        {result.name}
                      </h3>
                      <span className={`badge text-xs ${
                        result.type === 'condition' ? 'badge-condition' : 'badge-medication'
                      }`}>
                        {result.type}
                      </span>
                    </div>
                    <p className="text-xs text-tanzanite-400 mb-1">{result.category_name}</p>
                    <p className="text-sm text-slate line-clamp-2">{result.summary}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-tanzanite-300 group-hover:text-tanzanite-500 transition-colors flex-shrink-0 mt-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {!searched && !loading && (
        <div className="text-center py-12">
          <SearchIcon className="w-10 h-10 text-tanzanite-200 mx-auto mb-3" />
          <p className="text-slate text-sm">
            Search across all conditions and medications in the Whysice knowledge base.
          </p>
        </div>
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
