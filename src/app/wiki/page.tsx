'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, BookOpen, Pill, ShieldAlert, Footprints, Bug, Dna, ArrowRight } from 'lucide-react'

const CATEGORIES = [
  { name: 'Allergies & Atopy', slug: 'allergies-atopy', icon: ShieldAlert, description: 'Environmental allergies, atopic dermatitis, food reactions', color: 'bg-tanzanite-50 text-tanzanite-700 border-tanzanite-200' },
  { name: 'Interdigital Cysts', slug: 'interdigital-furunculosis', icon: Footprints, description: 'Paw infections, furunculosis, pododermatitis', color: 'bg-red-50 text-red-700 border-red-200' },
  { name: 'Infections', slug: 'infections', icon: Bug, description: 'Pyoderma, yeast, ringworm, secondary infections', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { name: 'Breed-Specific', slug: 'breed-specific', icon: Dna, description: 'Conditions with strong breed predispositions', color: 'bg-ice-50 text-ice-700 border-ice-200' },
]

const QUICK_MEDS = [
  { name: 'Apoquel', generic: 'Oclacitinib', slug: 'oclacitinib-apoquel', class: 'JAK inhibitor' },
  { name: 'Cytopoint', generic: 'Lokivetmab', slug: 'lokivetmab-cytopoint', class: 'Monoclonal antibody' },
  { name: 'Atopica', generic: 'Cyclosporine', slug: 'cyclosporine-atopica', class: 'Calcineurin inhibitor' },
  { name: 'Cephalexin', generic: 'Cephalexin', slug: 'cephalexin', class: 'Antibiotic' },
]

export default function WikiLanding() {
  const [query, setQuery] = useState('')
  const router = useRouter()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) router.push(`/wiki/search?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <div>
      <section className="bg-gradient-to-b from-tanzanite-800 to-tanzanite-700 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Canine Dermatology Wiki</h1>
          <p className="text-tanzanite-200 text-base mb-6 max-w-xl mx-auto">
            Evidence-based skin condition information for dog owners and veterinary professionals. Toggle owner / clinician depth on any article.
          </p>
          <form onSubmit={handleSearch} className="max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search conditions, medications, symptoms…"
                className="search-input pl-12 bg-white/95 backdrop-blur"
                aria-label="Search the wiki"
              />
            </div>
          </form>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-tanzanite-800 mb-6 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-tanzanite-500" />
          Browse by category
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon
            return (
              <Link
                key={cat.slug}
                href={`/wiki/conditions/${cat.slug}`}
                className={`card group border ${cat.color} hover:scale-[1.02] transition-transform duration-200`}
              >
                <Icon className="w-8 h-8 mb-3 opacity-80" />
                <h3 className="font-semibold text-base mb-1">{cat.name}</h3>
                <p className="text-sm opacity-75">{cat.description}</p>
                <div className="flex items-center gap-1 mt-3 text-sm font-medium opacity-60 group-hover:opacity-100 transition-opacity">
                  Browse <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="bg-tanzanite-50/50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-tanzanite-800 mb-6 flex items-center gap-2">
            <Pill className="w-6 h-6 text-tanzanite-500" />
            Derm-curated medications
          </h2>
          <p className="text-sm text-slate mb-6 max-w-2xl">
            Dermatology-relevant drugs with clinical context. Full pharmacology — including non-derm specialties — lives in the separate <span className="font-mono text-ice-700">/vetmed</span> reference.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {QUICK_MEDS.map((med) => (
              <Link
                key={med.slug}
                href={`/wiki/medications/${med.slug}`}
                className="card group"
              >
                <span className="badge badge-medication mb-2">{med.class}</span>
                <h3 className="font-semibold text-tanzanite-800">{med.name}</h3>
                <p className="text-sm text-slate">{med.generic}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
