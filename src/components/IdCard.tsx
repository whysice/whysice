'use client'

import Image from 'next/image'
import { Fingerprint, PawPrint, Syringe, Phone, Stethoscope, ShieldAlert, Pill } from 'lucide-react'

export type IdCardData = {
  name: string
  breed: string | null
  dob: string | null
  weight_lbs: number | null
  known_allergies: string[] | null
  photo_url: string | null
  microchip_id: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  primary_vet_name: string | null
  primary_vet_phone: string | null
}

export type IdCardTreatment = {
  treatment_name: string
  dosage: string | null
  frequency: string | null
  medication_name?: string | null
}

function ageLabel(dob: string | null): string | null {
  if (!dob) return null
  const years = (Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  if (years < 1) {
    const months = Math.max(1, Math.floor(years * 12))
    return `${months} mo`
  }
  return `${Math.floor(years)} yr`
}

function Row({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | null }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-slate-300" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-0.5">{label}</p>
        <p className="text-sm text-white break-words">{value || <span className="text-slate-500 italic">Not set</span>}</p>
      </div>
    </div>
  )
}

export function IdCard({
  dog,
  activeTreatments = [],
}: {
  dog: IdCardData
  activeTreatments?: IdCardTreatment[]
}) {
  const age = ageLabel(dog.dob)
  const subline = [dog.breed, age, dog.weight_lbs && `${dog.weight_lbs} lbs`].filter(Boolean).join(' · ')
  const allergies = dog.known_allergies?.filter(Boolean) || []

  return (
    <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-xl">
      <div className="px-5 pt-5 pb-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2">
          <Fingerprint className="w-4 h-4 text-ice-300" />
          <span className="text-[10px] font-bold tracking-widest uppercase text-slate-300">Whysice ID</span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">Portable animal ID</span>
      </div>

      <div className="px-5 py-5 flex items-start gap-4">
        <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-white/20">
          {dog.photo_url ? (
            <Image src={dog.photo_url} alt={dog.name} width={80} height={80} className="w-full h-full object-cover" />
          ) : (
            <PawPrint className="w-10 h-10 text-slate-400" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-tight">{dog.name}</h2>
          {subline && <p className="text-sm text-slate-300 mt-0.5">{subline}</p>}
          {allergies.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              <span className="text-[10px] font-bold tracking-wider uppercase text-red-300 self-center">Allergies:</span>
              {allergies.map(a => (
                <span key={a} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/20 border border-red-400/30 text-red-200 text-xs font-medium">
                  <ShieldAlert className="w-3 h-3" /> {a}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-5 pb-5 grid sm:grid-cols-2 gap-4">
        <Row icon={Syringe} label="Microchip" value={dog.microchip_id} />
        <Row
          icon={Phone}
          label="Emergency contact"
          value={[dog.emergency_contact_name, dog.emergency_contact_phone].filter(Boolean).join(' · ') || null}
        />
        <Row
          icon={Stethoscope}
          label="Primary vet"
          value={[dog.primary_vet_name, dog.primary_vet_phone].filter(Boolean).join(' · ') || null}
        />
      </div>

      {activeTreatments.length > 0 && (
        <div className="px-5 py-4 bg-black/20 border-t border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Pill className="w-4 h-4 text-amber-300" />
            <span className="text-[10px] font-bold tracking-widest uppercase text-amber-200">Active medications</span>
          </div>
          <ul className="space-y-1.5">
            {activeTreatments.map((t, i) => (
              <li key={i} className="text-sm text-slate-100">
                <span className="font-semibold">{t.medication_name || t.treatment_name}</span>
                {(t.dosage || t.frequency) && (
                  <span className="text-slate-300 text-xs ml-2">
                    {[t.dosage, t.frequency].filter(Boolean).join(' · ')}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
