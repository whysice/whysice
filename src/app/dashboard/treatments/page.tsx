'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Pill, X, ExternalLink, Trash2, Archive, Edit3, RotateCcw } from 'lucide-react'
import { supabase, getDogs, getTreatmentLogs, getMedications } from '@/lib/supabase'

type TreatmentLog = {
  id: string; treatment_name: string; date_started: string; date_ended: string | null
  dosage: string | null; frequency: string | null; effectiveness: number | null
  side_effects_observed: string | null; notes: string | null
  medications: { name: string; slug: string; brand_names: string[] } | null
}

type MedOption = { id: string; name: string; slug: string; brand_names: string[] | null }

function EffectivenessDots({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-xs text-slate">Not rated</span>
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <span key={i} className={`w-2.5 h-2.5 rounded-full ${i <= rating ? 'bg-tanzanite-400' : 'bg-gray-200'}`} />
      ))}
    </div>
  )
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function TreatmentsPage() {
  const [dogs, setDogs] = useState<any[]>([])
  const [activeDogId, setActiveDogId] = useState<string>('')
  const [treatments, setTreatments] = useState<TreatmentLog[]>([])
  const [wikiMeds, setWikiMeds] = useState<MedOption[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [treatmentName, setTreatmentName] = useState('')
  const [medicationId, setMedicationId] = useState<string>('')
  const [dateStarted, setDateStarted] = useState(new Date().toISOString().split('T')[0])
  const [dateEnded, setDateEnded] = useState('')
  const [dosage, setDosage] = useState('')
  const [frequency, setFrequency] = useState('')
  const [effectiveness, setEffectiveness] = useState<number>(0)
  const [sideEffects, setSideEffects] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    Promise.all([getDogs(), getMedications()]).then(([dogData, medData]) => {
      setDogs(dogData)
      setWikiMeds(medData)
      if (dogData.length > 0) setActiveDogId(dogData[0].id)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!activeDogId) return
    refreshTreatments()
  }, [activeDogId])

  async function refreshTreatments() {
    const data = await getTreatmentLogs(activeDogId)
    setTreatments(data)
  }

  useEffect(() => {
    if (medicationId && !editingId) {
      const med = wikiMeds.find(m => m.id === medicationId)
      if (med) setTreatmentName(med.brand_names?.[0] || med.name)
    }
  }, [medicationId, wikiMeds, editingId])

  function resetForm() {
    setTreatmentName(''); setMedicationId(''); setDateStarted(new Date().toISOString().split('T')[0])
    setDateEnded(''); setDosage(''); setFrequency(''); setEffectiveness(0)
    setSideEffects(''); setNotes(''); setEditingId(null)
  }

  function startEdit(t: TreatmentLog) {
    setEditingId(t.id)
    setTreatmentName(t.treatment_name)
    setMedicationId('')
    setDateStarted(t.date_started)
    setDateEnded(t.date_ended || '')
    setDosage(t.dosage || '')
    setFrequency(t.frequency || '')
    setEffectiveness(t.effectiveness || 0)
    setSideEffects(t.side_effects_observed || '')
    setNotes(t.notes || '')
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!activeDogId || !treatmentName || !dateStarted) return
    setSaving(true)

    const payload = {
      treatment_name: treatmentName,
      medication_id: medicationId || null,
      date_started: dateStarted,
      date_ended: dateEnded || null,
      dosage: dosage || null,
      frequency: frequency || null,
      effectiveness: effectiveness || null,
      side_effects_observed: sideEffects || null,
      notes: notes || null,
    }

    if (editingId) {
      await supabase.from('treatment_logs').update(payload).eq('id', editingId)
    } else {
      await supabase.from('treatment_logs').insert({ ...payload, dog_id: activeDogId })
    }

    await refreshTreatments()
    resetForm()
    setShowForm(false)
    setSaving(false)
  }

  async function handleMarkAsPast(id: string) {
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('treatment_logs').update({ date_ended: today }).eq('id', id)
    await refreshTreatments()
  }

  async function handleReactivate(id: string) {
    await supabase.from('treatment_logs').update({ date_ended: null }).eq('id', id)
    await refreshTreatments()
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    await supabase.from('treatment_logs').delete().eq('id', id)
    await refreshTreatments()
  }

  const active = treatments.filter(t => !t.date_ended)
  const past = treatments.filter(t => t.date_ended)

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-tanzanite-50 rounded w-1/3" />
          <div className="h-48 bg-tanzanite-50 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="p-2 rounded-lg hover:bg-tanzanite-50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-tanzanite-500" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-tanzanite-800">Treatment Log</h1>
          <p className="text-sm text-slate">Track medications and treatments over time</p>
        </div>
        <button
          onClick={() => { if (showForm) { resetForm(); setShowForm(false) } else setShowForm(true) }}
          className={showForm ? 'btn-secondary text-sm' : 'btn-primary text-sm'}
        >
          {showForm ? <><X className="w-3.5 h-3.5 inline mr-1" /> Cancel</> : <><Plus className="w-3.5 h-3.5 inline mr-1" /> Add Treatment</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-8 border-tanzanite-200">
          <h2 className="font-semibold text-tanzanite-800 mb-4">
            {editingId ? 'Edit treatment' : 'New treatment'}
          </h2>

          <div className="mb-4">
            <label htmlFor="wiki-med" className="block text-sm font-medium text-body mb-1">
              Link to wiki medication <span className="text-slate font-normal">(optional)</span>
            </label>
            <select id="wiki-med" value={medicationId} onChange={e => setMedicationId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-tanzanite-100 text-sm focus:border-tanzanite-500 focus:outline-none focus:ring-1 focus:ring-tanzanite-200">
              <option value="">None - custom treatment</option>
              {wikiMeds.map(med => (
                <option key={med.id} value={med.id}>{med.brand_names?.[0] || med.name} ({med.name})</option>
              ))}
            </select>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="treatment-name" className="block text-sm font-medium text-body mb-1">Treatment name</label>
              <input id="treatment-name" type="text" value={treatmentName} onChange={e => setTreatmentName(e.target.value)}
                placeholder="e.g., Apoquel, Chlorhexidine paw soak"
                className="w-full px-3 py-2 rounded-lg border border-tanzanite-100 text-sm focus:border-tanzanite-500 focus:outline-none focus:ring-1 focus:ring-tanzanite-200" required />
            </div>
            <div>
              <label htmlFor="dosage" className="block text-sm font-medium text-body mb-1">Dosage</label>
              <input id="dosage" type="text" value={dosage} onChange={e => setDosage(e.target.value)}
                placeholder="e.g., 750mg, 2 pumps"
                className="w-full px-3 py-2 rounded-lg border border-tanzanite-100 text-sm focus:border-tanzanite-500 focus:outline-none focus:ring-1 focus:ring-tanzanite-200" />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label htmlFor="date-started" className="block text-sm font-medium text-body mb-1">Started</label>
              <input id="date-started" type="date" value={dateStarted} onChange={e => setDateStarted(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-tanzanite-100 text-sm focus:border-tanzanite-500 focus:outline-none focus:ring-1 focus:ring-tanzanite-200" required />
            </div>
            <div>
              <label htmlFor="date-ended" className="block text-sm font-medium text-body mb-1">
                Ended <span className="text-slate font-normal">(blank = ongoing)</span>
              </label>
              <input id="date-ended" type="date" value={dateEnded} onChange={e => setDateEnded(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-tanzanite-100 text-sm focus:border-tanzanite-500 focus:outline-none focus:ring-1 focus:ring-tanzanite-200" />
            </div>
            <div>
              <label htmlFor="frequency" className="block text-sm font-medium text-body mb-1">Frequency</label>
              <select id="frequency" value={frequency} onChange={e => setFrequency(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-tanzanite-100 text-sm focus:border-tanzanite-500 focus:outline-none focus:ring-1 focus:ring-tanzanite-200">
                <option value="">Select...</option>
                <option value="Once daily">Once daily</option>
                <option value="Twice daily">Twice daily</option>
                <option value="Three times daily">Three times daily</option>
                <option value="Every 12 hours">Every 12 hours</option>
                <option value="Every other day">Every other day</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="As needed">As needed</option>
                <option value="Topical daily">Topical daily</option>
                <option value="Topical twice daily">Topical twice daily</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="effectiveness" className="block text-sm font-medium text-body mb-1">
              Effectiveness: {effectiveness > 0 ? `${effectiveness}/5` : 'Not yet rated'}
            </label>
            <input id="effectiveness" type="range" min="0" max="5" value={effectiveness}
              onChange={e => setEffectiveness(Number(e.target.value))} className="w-full accent-tanzanite-500" />
            <div className="flex justify-between text-xs text-slate mt-1">
              <span>N/A</span><span>No effect</span><span>Moderate</span><span>Very effective</span>
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="side-effects" className="block text-sm font-medium text-body mb-1">
              Side effects observed <span className="text-slate font-normal">(optional)</span>
            </label>
            <textarea id="side-effects" value={sideEffects} onChange={e => setSideEffects(e.target.value)}
              rows={2} placeholder="Any side effects noticed?"
              className="w-full px-3 py-2 rounded-lg border border-tanzanite-100 text-sm focus:border-tanzanite-500 focus:outline-none focus:ring-1 focus:ring-tanzanite-200 resize-none" />
          </div>

          <div className="mb-4">
            <label htmlFor="treatment-notes" className="block text-sm font-medium text-body mb-1">
              Notes <span className="text-slate font-normal">(optional)</span>
            </label>
            <textarea id="treatment-notes" value={notes} onChange={e => setNotes(e.target.value)}
              rows={2} placeholder="Additional notes about this treatment"
              className="w-full px-3 py-2 rounded-lg border border-tanzanite-100 text-sm focus:border-tanzanite-500 focus:outline-none focus:ring-1 focus:ring-tanzanite-200 resize-none" />
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : editingId ? 'Update Treatment' : 'Save Treatment'}
            </button>
            {editingId && (
              <button type="button" onClick={() => { resetForm(); setShowForm(false) }} className="btn-secondary">
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      )}

      {active.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-tanzanite-800 mb-3 flex items-center gap-2">
            <Pill className="w-4 h-4 text-ice-500" /> Active Treatments
          </h2>
          <div className="space-y-3">
            {active.map(t => (
              <TreatmentCard key={t.id} treatment={t}
                onEdit={() => startEdit(t)}
                onMarkPast={() => handleMarkAsPast(t.id)}
                onDelete={() => handleDelete(t.id, t.treatment_name)} />
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-tanzanite-800 mb-3 flex items-center gap-2">
            <Pill className="w-4 h-4 text-slate" /> Past Treatments
          </h2>
          <div className="space-y-3">
            {past.map(t => (
              <TreatmentCard key={t.id} treatment={t} isPast
                onEdit={() => startEdit(t)}
                onReactivate={() => handleReactivate(t.id)}
                onDelete={() => handleDelete(t.id, t.treatment_name)} />
            ))}
          </div>
        </div>
      )}

      {treatments.length === 0 && !showForm && (
        <div className="card text-center py-12">
          <Pill className="w-10 h-10 text-tanzanite-200 mx-auto mb-3" />
          <p className="text-slate text-sm">No treatments logged yet.</p>
        </div>
      )}
    </div>
  )
}

function TreatmentCard({ treatment: t, isPast, onEdit, onMarkPast, onReactivate, onDelete }: {
  treatment: TreatmentLog; isPast?: boolean
  onEdit: () => void; onMarkPast?: () => void; onReactivate?: () => void; onDelete: () => void
}) {
  return (
    <div className={`card py-4 ${isPast ? 'opacity-75' : ''}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1">
          <h3 className="font-medium text-body">{t.treatment_name}</h3>
          <div className="flex flex-wrap gap-x-3 text-xs text-slate mt-0.5">
            {t.dosage && <span>{t.dosage}</span>}
            {t.frequency && <span>{t.frequency}</span>}
            <span>{formatDate(t.date_started)}{t.date_ended ? ` - ${formatDate(t.date_ended)}` : ' - ongoing'}</span>
          </div>
        </div>
        <EffectivenessDots rating={t.effectiveness} />
      </div>

      {t.side_effects_observed && <p className="text-xs text-red-500 mt-1">Side effects: {t.side_effects_observed}</p>}
      {t.notes && <p className="text-xs text-slate mt-1">{t.notes}</p>}
      {t.medications && (
        <Link href={`/medications/${t.medications.slug}`}
          className="inline-flex items-center gap-1 text-xs text-tanzanite-500 hover:underline mt-2">
          <ExternalLink className="w-3 h-3" /> Wiki: {t.medications.brand_names?.[0] || t.medications.name}
        </Link>
      )}

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-tanzanite-50">
        <button onClick={onEdit}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-tanzanite-500 hover:bg-tanzanite-50 transition-colors">
          <Edit3 className="w-3 h-3" /> Edit
        </button>
        {!isPast && onMarkPast && (
          <button onClick={onMarkPast}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-amber-600 hover:bg-amber-50 transition-colors">
            <Archive className="w-3 h-3" /> Mark as past
          </button>
        )}
        {isPast && onReactivate && (
          <button onClick={onReactivate}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-green-600 hover:bg-green-50 transition-colors">
            <RotateCcw className="w-3 h-3" /> Reactivate
          </button>
        )}
        <button onClick={onDelete}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-red-400 hover:bg-red-50 transition-colors ml-auto">
          <Trash2 className="w-3 h-3" /> Delete
        </button>
      </div>
    </div>
  )
}
