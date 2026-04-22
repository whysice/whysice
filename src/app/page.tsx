'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, BookOpen, Pill, Fingerprint, LayoutDashboard, ArrowRight, PawPrint, Stethoscope,
} from 'lucide-react'

type Tool = {
  slug: string
  href: string
  label: string
  tagline: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  audience: string
  status: 'live' | 'beta' | 'coming-soon'
  accent: string
}

const TOOLS: Tool[] = [
  {
    slug: 'wiki',
    href: '/wiki',
    label: 'Derm Wiki',
    tagline: 'Evidence-based canine dermatology',
    description: 'Conditions, differentials, and derm-curated medications. Plain-language and clinical layers in one article.',
    icon: BookOpen,
    audience: 'Owners + vets',
    status: 'live',
    accent: 'from-tanzanite-600 to-tanzanite-800',
  },
  {
    slug: 'vetmed',
    href: '/vetmed',
    label: 'Vet Med Lookup',
    tagline: '115-drug cross-specialty reference',
    description: 'Dosing, safety flags, interactions, and species contraindications across cardiac, chemo, seizure, endocrine, and emergency drugs.',
    icon: Pill,
    audience: 'Vets + techs',
    status: 'coming-soon',
    accent: 'from-ice-600 to-ice-800',
  },
  {
    slug: 'id',
    href: '/id',
    label: 'Whysice ID',
    tagline: 'One ID, every animal',
    description: 'Portable universal animal ID — clinic, boarder, border. Same record, species-aware chart.',
    icon: Fingerprint,
    audience: 'Owners + vets',
    status: 'coming-soon',
    accent: 'from-slate-700 to-slate-900',
  },
  {
    slug: 'dashboard',
    href: '/dashboard',
    label: 'Health Tracker',
    tagline: 'Track symptoms, treatments, flares',
    description: 'Personal symptom log, treatment timeline, and vet-prep export. Free for pet owners.',
    icon: LayoutDashboard,
    audience: 'Owners',
    status: 'live',
    accent: 'from-tanzanite-500 to-ice-600',
  },
]

const STATUS_LABEL = {
  live: 'Live',
  beta: 'Beta',
  'coming-soon': 'Coming soon',
} as const

export default function HubLanding() {
  const [query, setQuery] = useState('')
  const router = useRouter()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/wiki/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-tanzanite-800 to-tanzanite-700 text-white py-16 sm:py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <PawPrint className="w-8 h-8 text-ice-200" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Whysice
          </h1>
          <p className="text-tanzanite-200 text-lg mb-8 max-w-xl mx-auto">
            Veterinary tools for owners and clinicians. One brand, four surfaces — a derm wiki, a cross-specialty drug reference, a universal animal ID, and a personal health tracker.
          </p>

          <form onSubmit={handleSearch} className="max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search the derm wiki…"
                className="search-input pl-12 bg-white/95 backdrop-blur"
                aria-label="Search the derm wiki"
              />
            </div>
          </form>
        </div>
      </section>

      {/* Tool directory */}
      <section className="max-w-7xl mx-auto px-4 py-12 sm:py-16">
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-2xl font-bold text-tanzanite-800">Tools</h2>
          <p className="text-sm text-slate hidden sm:block">Pick a surface to enter.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {TOOLS.map((tool) => {
            const Icon = tool.icon
            const isLive = tool.status === 'live'
            const Wrapper: any = isLive ? Link : 'div'
            const wrapperProps = isLive ? { href: tool.href } : { 'aria-disabled': true }
            return (
              <Wrapper
                key={tool.slug}
                {...wrapperProps}
                className={`group relative overflow-hidden rounded-2xl border border-tanzanite-100 bg-white transition-all ${
                  isLive ? 'hover:border-tanzanite-300 hover:shadow-md cursor-pointer' : 'opacity-70'
                }`}
              >
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${tool.accent}`}/>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${tool.accent} grid place-items-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded ${
                      isLive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {STATUS_LABEL[tool.status]}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-tanzanite-800 mb-1">{tool.label}</h3>
                  <p className="text-sm text-tanzanite-600 font-medium mb-2">{tool.tagline}</p>
                  <p className="text-sm text-slate leading-relaxed mb-4">{tool.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate">For {tool.audience}</span>
                    {isLive ? (
                      <span className="flex items-center gap-1 text-tanzanite-600 font-medium group-hover:gap-2 transition-all">
                        Enter <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="text-slate-400">Not yet available</span>
                    )}
                  </div>
                </div>
              </Wrapper>
            )
          })}
        </div>
      </section>

      {/* Audience split */}
      <section className="bg-tanzanite-50/60 py-12 px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-4">
          <div className="card border-l-4 border-l-tanzanite-500">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-5 h-5 text-tanzanite-500" />
              <h3 className="font-semibold text-tanzanite-800">Owner view</h3>
            </div>
            <p className="text-sm text-slate">
              Plain-language explanations, practical care tips, flare tracking. Start at the <Link href="/wiki" className="text-tanzanite-600 underline">wiki</Link> or the <Link href="/dashboard" className="text-tanzanite-600 underline">tracker</Link>.
            </p>
          </div>
          <div className="card border-l-4 border-l-ice-500">
            <div className="flex items-center gap-3 mb-2">
              <Stethoscope className="w-5 h-5 text-ice-600" />
              <h3 className="font-semibold text-tanzanite-800">Clinician view</h3>
            </div>
            <p className="text-sm text-slate">
              Clinical depth in the wiki, plus a cross-specialty drug reference at <span className="font-mono text-ice-700">/vetmed</span> when it ships.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
