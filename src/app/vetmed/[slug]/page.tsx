'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { notFound, useParams } from 'next/navigation'
import { ChevronRight, ArrowLeft, AlertTriangle, Pill } from 'lucide-react'
import {
  DRUGS, classifyDrug, getSafetyFlags, hasAnySafetyFlag, slugifyDrug,
  type DrugEntry, type SafetyFlags,
} from '@/lib/drugData'

function SafetyBadges({ flags }: { flags: SafetyFlags }) {
  const items: Array<[keyof SafetyFlags, string, string]> = [
    ['mdr1', 'MDR1 Alert', 'bg-red-100 text-red-700'],
    ['boxedWarning', 'FDA Boxed Warning', 'bg-red-100 text-red-700'],
    ['nsaidSteroid', 'NSAID/Steroid Rule', 'bg-amber-100 text-amber-700'],
    ['speciesContra', 'Species Restriction', 'bg-purple-100 text-purple-700'],
    ['highRisk', 'High Risk', 'bg-pink-100 text-pink-700'],
  ]
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {items.map(([k, label, style]) => flags[k] && (
        <span key={k} className={`badge ${style} text-[10px] font-bold tracking-wider uppercase`}>{label}</span>
      ))}
    </div>
  )
}

function DetailBlock({ title, content, accent }: { title: string; content: string; accent?: string }) {
  if (!content || content === 'N/A' || content === 'None routine' || content === 'None' || content === 'Minimal') return null
  const items = content.split('; ')
  return (
    <div className="mb-5">
      <h4 className={`text-[10px] font-bold tracking-widest uppercase mb-1.5 ${accent || 'text-tanzanite-400'}`}>
        {title}
      </h4>
      <p className="text-sm text-body leading-relaxed">
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

export default function VetMedDetailPage() {
  const params = useParams<{ slug: string }>()
  const slug = params?.slug

  const drug: DrugEntry | undefined = useMemo(
    () => DRUGS.find(d => slugifyDrug(d) === slug),
    [slug]
  )

  if (!drug) return notFound()

  const flags = getSafetyFlags(drug)
  const hasFlags = hasAnySafetyFlag(flags)
  const category = classifyDrug(drug.drugClass)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-2 text-sm text-slate mb-6">
        <Link href="/vetmed" className="hover:text-tanzanite-500 transition-colors inline-flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Vet Med Lookup
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-body font-medium">{drug.genericName}</span>
      </nav>

      <header className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-tanzanite-50 rounded-lg">
            <Pill className="w-6 h-6 text-tanzanite-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-tanzanite-800">{drug.genericName}</h1>
            <p className="text-sm text-slate mt-0.5">
              <span className="text-tanzanite-600 font-medium">{category}</span>
              <span className="text-tanzanite-200 mx-2">·</span>
              {drug.drugClass}
            </p>
          </div>
        </div>
        {drug.brandNames && (
          <p className="text-sm text-slate ml-[52px]">
            <span className="font-semibold">Brand names:</span> {drug.brandNames.replace(/;/g, ' · ')}
          </p>
        )}
        {hasFlags && <div className="ml-[52px]"><SafetyBadges flags={flags} /></div>}
      </header>

      <div className="card mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-[10px] font-bold tracking-widest uppercase text-tanzanite-600 mb-1">Dosage</h4>
            <p className="text-sm text-body font-semibold">{drug.dosage}</p>
          </div>
          <div>
            <h4 className="text-[10px] font-bold tracking-widest uppercase text-tanzanite-600 mb-1">Route</h4>
            <p className="text-sm text-body font-semibold">{drug.route}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <DetailBlock title="Indications" content={drug.indications} />
        <DetailBlock title="Common Side Effects" content={drug.sideEffects} />
        <DetailBlock title="⚠ Serious Warnings" content={drug.warnings} accent="text-red-500" />
        <DetailBlock title="Drug Interactions" content={drug.interactions} accent="text-amber-600" />
        <DetailBlock title="Food Interactions" content={drug.foodInteractions} />
        <DetailBlock title="Contraindications" content={drug.contraindications} accent="text-pink-600" />
        <DetailBlock title="Monitoring" content={drug.monitoring} />
        <DetailBlock title="Clinical Notes" content={drug.notes} accent="text-tanzanite-600" />

        {drug.alsoUsedIn && drug.alsoUsedIn !== 'Dogs only' && (
          <p className="text-xs text-slate mt-3 pt-3 border-t border-tanzanite-50">
            <span className="font-semibold">Also used in:</span> {drug.alsoUsedIn}
          </p>
        )}
      </div>

      <div className="mt-8 p-4 rounded-xl bg-tanzanite-50/50 border border-tanzanite-100">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-tanzanite-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate leading-relaxed">
            <p className="font-semibold text-tanzanite-600 mb-1">Disclaimer</p>
            <p>
              This reference is for informational and educational purposes only. It is not a substitute for professional veterinary advice, diagnosis, or treatment. Verify dosing against current product labels and consult a licensed veterinarian.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
