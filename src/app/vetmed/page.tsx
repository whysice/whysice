'use client'

import { useState, useMemo, useRef } from 'react'
import Link from 'next/link'
import { Search, ChevronDown, ChevronUp, AlertTriangle, Shield, Pill, Filter, X, ExternalLink } from 'lucide-react'
import {
  DRUGS, DRUG_CATEGORIES, classifyDrug, getSafetyFlags, hasAnySafetyFlag, matchesDrug, slugifyDrug,
  type DrugEntry, type DrugCategory, type SafetyFlags,
} from '@/lib/drugData'

function SafetyBadges({ flags }: { flags: SafetyFlags }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {flags.mdr1 && (
        <span className="badge bg-red-100 text-red-700 text-[10px] font-bold tracking-wider uppercase">MDR1 Alert</span>
      )}
      {flags.boxedWarning && (
        <span className="badge bg-red-100 text-red-700 text-[10px] font-bold tracking-wider uppercase">FDA Boxed Warning</span>
      )}
      {flags.nsaidSteroid && (
        <span className="badge bg-amber-100 text-amber-700 text-[10px] font-bold tracking-wider uppercase">NSAID/Steroid Rule</span>
      )}
      {flags.speciesContra && (
        <span className="badge bg-purple-100 text-purple-700 text-[10px] font-bold tracking-wider uppercase">Species Restriction</span>
      )}
      {flags.highRisk && (
        <span className="badge bg-pink-100 text-pink-700 text-[10px] font-bold tracking-wider uppercase">High Risk</span>
      )}
    </div>
  )
}

function DetailSection({ title, content, accent }: { title: string; content: string; accent?: string }) {
  if (!content || content === 'N/A' || content === 'None routine' || content === 'None' || content === 'Minimal') return null
  const items = content.split('; ')
  return (
    <div className="mb-4">
      <h4 className={`text-[10px] font-bold tracking-widest uppercase mb-1 ${accent || 'text-tanzanite-400'}`}>
        {title}
      </h4>
      <p className="text-sm text-body/80 leading-relaxed">
        {items.map((item, i) => (
          <span key={i}>
            {i > 0 && <span className="text-tanzanite-200"> · </span>}
            {item}
          </span>
        ))}
      </p>
    </div>
  )
}

function DrugCard({ drug, expanded, onToggle }: { drug: DrugEntry; expanded: boolean; onToggle: () => void }) {
  const flags = getSafetyFlags(drug)
  const hasFlags = hasAnySafetyFlag(flags)
  const category = classifyDrug(drug.drugClass)
  const slug = slugifyDrug(drug)

  return (
    <div
      className={`card cursor-pointer transition-all duration-200 ${
        expanded ? 'ring-2 ring-tanzanite-400 shadow-lg' : 'hover:border-tanzanite-100'
      }`}
      onClick={onToggle}
      role="button"
      aria-expanded={expanded}
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle() } }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-lg font-bold text-tanzanite-800">{drug.genericName}</span>
            <span className="text-xs text-tanzanite-300 font-medium">{category}</span>
          </div>
          <p className="text-sm text-slate mt-0.5">{drug.brandNames.replace(/;/g, ' · ')}</p>
          {!expanded && (
            <p className="text-xs text-slate/70 mt-1.5 line-clamp-2">
              {drug.indications.split(';').slice(0, 3).join(' · ')}
              {drug.indications.split(';').length > 3 && ' ...'}
            </p>
          )}
          {hasFlags && <SafetyBadges flags={flags} />}
        </div>
        <div className="flex-shrink-0 text-tanzanite-300 mt-1">
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </div>

      {expanded && (
        <div className="mt-5 pt-4 border-t border-tanzanite-50">
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <h4 className="text-[10px] font-bold tracking-widest uppercase text-tanzanite-600 mb-1">Dosage</h4>
              <p className="text-sm text-body font-semibold">{drug.dosage}</p>
            </div>
            <div>
              <h4 className="text-[10px] font-bold tracking-widest uppercase text-tanzanite-600 mb-1">Route</h4>
              <p className="text-sm text-body font-semibold">{drug.route}</p>
            </div>
          </div>

          <DetailSection title="Indications" content={drug.indications} />
          <DetailSection title="Common Side Effects" content={drug.sideEffects} />
          <DetailSection title="⚠ Serious Warnings" content={drug.warnings} accent="text-red-500" />
          <DetailSection title="Drug Interactions" content={drug.interactions} accent="text-amber-600" />
          <DetailSection title="Food Interactions" content={drug.foodInteractions} />
          <DetailSection title="Contraindications" content={drug.contraindications} accent="text-pink-600" />
          <DetailSection title="Monitoring" content={drug.monitoring} />
          <DetailSection title="Clinical Notes" content={drug.notes} accent="text-tanzanite-600" />

          {drug.alsoUsedIn && drug.alsoUsedIn !== 'Dogs only' && (
            <p className="text-xs text-slate mt-3">
              <span className="font-semibold">Also used in:</span> {drug.alsoUsedIn}
            </p>
          )}

          <div className="flex items-center justify-end pt-3 mt-3 border-t border-tanzanite-50">
            <Link
              href={`/vetmed/${slug}`}
              onClick={e => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-xs text-tanzanite-500 hover:text-tanzanite-700 font-medium"
            >
              Permalink <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default function VetMedLookupPage() {
  const [query, setQuery] = useState('')
  const [classFilter, setClassFilter] = useState<DrugCategory>('All')
  const [safetyOnly, setSafetyOnly] = useState(false)
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    return DRUGS.filter(d => {
      if (!matchesDrug(d, query)) return false
      if (classFilter !== 'All' && classifyDrug(d.drugClass) !== classFilter) return false
      if (safetyOnly && !hasAnySafetyFlag(getSafetyFlags(d))) return false
      return true
    })
  }, [query, classFilter, safetyOnly])

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-tanzanite-50 rounded-lg">
            <Pill className="w-6 h-6 text-tanzanite-500" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-tanzanite-800">Vet Med Lookup</h1>
            <p className="text-sm text-slate">
              {DRUGS.length} medications across cardiac, chemo, seizure, endocrine, emergency &amp; more · Search by name, brand, or condition
            </p>
          </div>
        </div>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate/50" />
        <input
          ref={searchRef}
          type="text"
          placeholder="Search medications, brands, conditions..."
          value={query}
          onChange={e => { setQuery(e.target.value); setExpandedIdx(null) }}
          className="search-input pl-12 pr-10"
          aria-label="Search medications"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); searchRef.current?.focus() }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate/50 hover:text-tanzanite-500 transition-colors"
            aria-label="Clear search"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
            showFilters || classFilter !== 'All'
              ? 'border-tanzanite-400 bg-tanzanite-50 text-tanzanite-700'
              : 'border-tanzanite-50 text-slate hover:border-tanzanite-200'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          {classFilter !== 'All' ? classFilter : 'Filter by class'}
        </button>

        <button
          onClick={() => { setSafetyOnly(!safetyOnly); setExpandedIdx(null) }}
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
            safetyOnly
              ? 'border-red-300 bg-red-50 text-red-700'
              : 'border-tanzanite-50 text-slate hover:border-tanzanite-200'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          Safety Flags Only
        </button>

        <span className="text-xs text-slate ml-auto">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {showFilters && (
        <div className="mb-6 p-4 card">
          <h3 className="text-xs font-bold tracking-widest uppercase text-tanzanite-400 mb-3">Drug Class</h3>
          <div className="flex flex-wrap gap-2">
            {DRUG_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => { setClassFilter(cat); setExpandedIdx(null); setShowFilters(false) }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  classFilter === cat
                    ? 'bg-tanzanite-500 text-white'
                    : 'bg-tanzanite-50 text-tanzanite-600 hover:bg-tanzanite-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="card text-center py-12">
            <Search className="w-10 h-10 text-tanzanite-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-body mb-1">No medications found</p>
            <p className="text-sm text-slate max-w-sm mx-auto">Try a different search term or adjust your filters.</p>
          </div>
        )}
        {filtered.map((drug, i) => (
          <DrugCard
            key={drug.genericName}
            drug={drug}
            expanded={expandedIdx === i}
            onToggle={() => setExpandedIdx(expandedIdx === i ? null : i)}
          />
        ))}
      </div>

      <div className="mt-10 p-4 rounded-xl bg-tanzanite-50/50 border border-tanzanite-100">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-tanzanite-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate leading-relaxed">
            <p className="font-semibold text-tanzanite-600 mb-1">Disclaimer</p>
            <p>
              This reference tool is for informational and educational purposes only. It is not a substitute for professional veterinary advice, diagnosis, or treatment. Dosages shown are typical ranges and may not be appropriate for every patient. Always consult a licensed veterinarian before administering any medication. Verify against current product labels.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
