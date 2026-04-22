import Link from 'next/link'
import { Fingerprint, Stethoscope, Hotel, Plane, Siren, Bird, Cat, Dog, ArrowRight, ShieldCheck } from 'lucide-react'

export const metadata = {
  title: 'Whysice ID — One ID, every animal',
  description: 'A portable universal animal ID. One record across clinic, boarder, and border — species-aware, owner-presentable.',
}

const USE_CASES = [
  { icon: Stethoscope, label: 'New clinic or specialist', copy: 'Hand off a complete, current record without faxing or re-typing history.' },
  { icon: Hotel, label: 'Boarders & sitters', copy: 'Meds, allergies, emergency contacts — visible without the owner on the phone.' },
  { icon: Plane, label: 'Border crossings', copy: 'Vaccination status and microchip linkage in one presentable surface.' },
  { icon: Siren, label: 'Emergencies', copy: 'The ER tech scans, not guesses. Drug contraindications are right there.' },
]

const SPECIES = [
  { icon: Dog, label: 'Dogs' },
  { icon: Cat, label: 'Cats' },
  { icon: Bird, label: 'Avian & exotics' },
]

export default function IdPreviewPage() {
  return (
    <div>
      <section className="bg-gradient-to-b from-slate-800 to-slate-900 text-white py-16 sm:py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-bold tracking-wider uppercase mb-6">
            <Fingerprint className="w-3.5 h-3.5" /> Whysice ID · Preview
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            One ID, every animal
          </h1>
          <p className="text-slate-300 text-lg mb-8 max-w-xl mx-auto leading-relaxed">
            A portable universal animal ID (UAID) — one record across clinic, boarder, and border. Species-aware, owner-presentable, clinician-readable.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-400/10 border border-amber-300/30 text-amber-200 text-sm">
            <ShieldCheck className="w-4 h-4" />
            In design — not yet shippable. This page previews the concept.
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
        <div className="grid md:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-2xl font-bold text-tanzanite-800 mb-3">Why a universal ID?</h2>
            <p className="text-slate leading-relaxed mb-4">
              Pet medical records today live in silos — each clinic, each specialist, each boarder keeps its own fragment. Transfers are by fax or memory. Travel, emergencies, and handoffs lose critical context.
            </p>
            <p className="text-slate leading-relaxed">
              The UAID is the atomic unit: one record, owned by the animal (presented by the owner). Clinics read and annotate. The record travels with the patient, not with the clinic.
            </p>
          </div>
          <div className="card border-slate-200">
            <h3 className="text-sm font-semibold text-tanzanite-800 mb-3">First principles</h3>
            <ul className="space-y-2 text-sm text-slate">
              <li className="flex gap-2"><span className="text-slate-400">01</span> The record belongs to the animal, not the clinic.</li>
              <li className="flex gap-2"><span className="text-slate-400">02</span> Same data, two renderings: owner plain-language + clinician detail.</li>
              <li className="flex gap-2"><span className="text-slate-400">03</span> Species-aware by design — dog, cat, avian, exotic.</li>
              <li className="flex gap-2"><span className="text-slate-400">04</span> Works offline: printable card, QR-scannable, portable PDF.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-tanzanite-50/60 py-12 sm:py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-tanzanite-800 mb-6">Where it's useful</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {USE_CASES.map(({ icon: Icon, label, copy }) => (
              <div key={label} className="card">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-tanzanite-50 rounded-lg flex-shrink-0">
                    <Icon className="w-5 h-5 text-tanzanite-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-tanzanite-800 mb-1">{label}</h3>
                    <p className="text-sm text-slate leading-relaxed">{copy}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-tanzanite-800 mb-2">Not just dogs</h2>
          <p className="text-slate max-w-xl mx-auto">The same primitive scales across species — the chart changes, the ID doesn't.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {SPECIES.map(({ icon: Icon, label }) => (
            <div key={label} className="card text-center">
              <Icon className="w-8 h-8 text-tanzanite-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-tanzanite-800">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-900 text-white py-12 sm:py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-3">What's next</h2>
          <p className="text-slate-300 mb-6 max-w-xl mx-auto leading-relaxed">
            Schema, auth, and the create / share flow are the next build. In the meantime, owners can start tracking their pet's health in the dashboard — the data model there is what <span className="text-white font-medium">/id</span> will federate.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-slate-900 text-sm font-semibold hover:bg-slate-100 transition-colors">
              Open the tracker <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-white/30 text-white text-sm font-medium hover:bg-white/10 transition-colors">
              Back to Whysice
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
