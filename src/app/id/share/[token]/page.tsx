'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Fingerprint, AlertTriangle, Clock, PawPrint } from 'lucide-react'
import { getSharedDog, type SharedDog } from '@/lib/supabase'
import { IdCard } from '@/components/IdCard'

export default function SharedIdPage() {
  const params = useParams<{ token: string }>()
  const token = params?.token as string
  const [dog, setDog] = useState<SharedDog | null>(null)
  const [loading, setLoading] = useState(true)
  const [invalid, setInvalid] = useState(false)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    setLoading(true)
    getSharedDog(token)
      .then(data => {
        if (cancelled) return
        if (!data) setInvalid(true)
        else setDog(data)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setInvalid(true)
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [token])

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors">
            <Fingerprint className="w-4 h-4" /> Whysice ID
          </Link>
          <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Shared view</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {loading && (
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-white/5 rounded w-1/3" />
            <div className="h-64 bg-white/5 rounded-xl" />
          </div>
        )}

        {!loading && invalid && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-8 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-300 mx-auto mb-3" />
            <h1 className="text-xl font-bold mb-2">Link isn&rsquo;t valid</h1>
            <p className="text-sm text-slate-300 max-w-sm mx-auto">
              This share link has expired, been revoked, or was never correct. Ask the pet&rsquo;s owner for a fresh link.
            </p>
          </div>
        )}

        {!loading && !invalid && dog && (
          <>
            <div className="mb-4 flex items-start gap-3 rounded-lg bg-white/5 border border-white/10 p-3">
              <PawPrint className="w-4 h-4 text-ice-300 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300 leading-relaxed">
                <p><span className="font-semibold text-white">Shared by the owner.</span> Read-only snapshot of <span className="font-semibold text-white">{dog.name}</span>&rsquo;s record.</p>
                {dog.share_expires_at && (
                  <p className="mt-1 inline-flex items-center gap-1 text-amber-300">
                    <Clock className="w-3 h-3" />
                    Expires {new Date(dog.share_expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
              </div>
            </div>

            <IdCard
              dog={{
                name: dog.name,
                breed: dog.breed,
                dob: dog.dob,
                weight_lbs: dog.weight_lbs,
                known_allergies: dog.known_allergies,
                photo_url: dog.photo_url,
                microchip_id: dog.microchip_id,
                emergency_contact_name: dog.emergency_contact_name,
                emergency_contact_phone: dog.emergency_contact_phone,
                primary_vet_name: dog.primary_vet_name,
                primary_vet_phone: dog.primary_vet_phone,
              }}
              activeTreatments={dog.active_treatments?.map(t => ({
                treatment_name: t.treatment_name,
                dosage: t.dosage,
                frequency: t.frequency,
                medication_name: t.medication_name,
              })) ?? []}
            />

            <p className="text-xs text-slate-500 mt-6 text-center">
              Not a substitute for a full medical record. Always confirm with the owner or primary vet.
            </p>
          </>
        )}
      </main>
    </div>
  )
}
