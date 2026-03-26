'use client'

import Link from 'next/link'
import { Search, BookOpen, Stethoscope, PawPrint, ShieldAlert, Footprints, Bug, Dna, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const CATEGORIES = [
  { name: 'Allergies & Atopy', slug: 'allergies-atopy', icon: ShieldAlert, description: 'Environmental allergies, atopic dermatitis, food reactions', color: 'bg-tanzanite-50 text-tanzanite-700 border-tanzanite-200' },
  { name: 'Interdigital Cysts', slug: 'interdigital-furunculosis', icon: Footprints, description: 'Paw infections, furunculosis, pododermatitis', color: 'bg-red-50 text-red-700 border-red-200' },
  { name: 'Infections', slug: 'infections', icon: Bug, description: 'Pyoderma, yeast, ringworm, secondary infections', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { name: 'Breed-Specific', slug: 'breed-specific', icon: Dna, description: 'Conditions with strong breed predispositions', color: 'bg-ice-50 text-ice-700 border-ice-200' },
]

export default function HomePage() {
  const [query, setQuery] = useState('')
  const router = useRouter()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-tanzanite-800 to-tanzanite-700 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <PawPrint className="w-8 h-8 text-ice-200" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Canine Dermatology Wiki
          </h1>
          <p className="text-tanzanite-200 text-lg mb-8 max-w-xl mx-auto">
            Evidence-based skin condition information for dog owners and veterinary professionals. Search conditions, medications, and treatment protocols.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search conditions, medications, symptoms..."
                className="search-input pl-12 bg-white/95 backdrop-blur"
                aria-label="Search the wiki"
              />
            </div>
          </form>
        </div>
      </section>

      {/* Content Layer Toggle Info */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row gap-6 mb-12">
          <div className="flex-1 card border-l-4 border-l-tanzanite-500">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-5 h-5 text-tanzanite-500" />
              <h3 className="font-semibold text-tanzanite-800">Owner View</h3>
            </div>
            <p className="text-sm text-slate">
              Plain-language explanations, practical care tips, and when to see your vet. Designed for pet parents.
            </p>
          </div>
          <div className="flex-1 card border-l-4 border-l-ice-500">
            <div className="flex items-center gap-3 mb-2">
              <Stethoscope className="w-5 h-5 text-ice-600" />
              <h3 className="font-semibold text-tanzanite-800">Vet Detail</h3>
            </div>
            <p className="text-sm text-slate">
              Clinical depth: differentials, pharmacokinetics, evidence grading, and treatment algorithms. Toggle on any article.
            </p>
          </div>
        </div>

        {/* Category Grid */}
        <h2 className="text-2xl font-bold text-tanzanite-800 mb-6">Browse by Category</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon
            return (
              <Link
                key={cat.slug}
                href={`/conditions/${cat.slug}`}
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

      {/* Quick Access */}
      <section className="bg-tanzanite-50/50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-tanzanite-800 mb-6">Common Medications</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'Apoquel', generic: 'Oclacitinib', slug: 'oclacitinib-apoquel', class: 'JAK inhibitor' },
              { name: 'Cytopoint', generic: 'Lokivetmab', slug: 'lokivetmab-cytopoint', class: 'Monoclonal antibody' },
              { name: 'Atopica', generic: 'Cyclosporine', slug: 'cyclosporine-atopica', class: 'Calcineurin inhibitor' },
              { name: 'Cephalexin', generic: 'Cephalexin', slug: 'cephalexin', class: 'Antibiotic' },
            ].map((med) => (
              <Link
                key={med.slug}
                href={`/medications/${med.slug}`}
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

      {/* Track Your Dog CTA */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <PawPrint className="w-10 h-10 text-tanzanite-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-tanzanite-800 mb-3">Track Your Dog's Skin Health</h2>
          <p className="text-slate mb-6 max-w-xl mx-auto">
            Log symptoms, track treatments, monitor flare patterns, and generate vet-ready health summaries. Free for all dog owners.
          </p>
          <Link href="/dashboard" className="btn-primary inline-block">
            Start Tracking
          </Link>
        </div>
      </section>
    </div>
  )
}
