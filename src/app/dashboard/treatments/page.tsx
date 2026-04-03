'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Pill, X, Trash2, Edit3, Check, RotateCcw, Pause } from 'lucide-react'
import { supabase, getDogs, getTreatmentLogs, getMedications, setTreatmentMedications } from '@/lib/supabase'
import { useToast } from '@/contexts/ToastContext'
import { ConfirmDialog, useConfirmDialog } from '@/components/ConfirmDialog'
import { ValidatedInput, ValidatedSelect, ValidatedTextarea, useFormValidation } from '@/components/FormField'
import { SeverityPicker } from '@/components/SeverityPicker'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { EmptyState } from '@/components/EmptyState'

type TreatmentLog = {
  id: string; treatment_name: string; date_started: string; date_ended: string | null
  dosage: string | null; frequency: string | null; effectiveness: number | null
  side_effects_observed: string | null; notes: string | null
  medication_id: string | null
  medications: { name: string; slug: string; brand_names: string[] } | null
  treatment_medications: { medication_id: string; medications: { id: string; name: string; slug: string; brand_names: string[] } }[]
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function TreatmentsPage() {
  const [dogs, setDogs] = useState<any[]>([])
  const [activeDogId, setActiveDogId] = useState<string>('')
  const [treatments, setTreatments] = useState<TreatmentLog[]>([])
  const [allMedications, setAllMedications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Integrations
  const { showToast, showUndoToast } = useToast()
  const { confirmingId, requestConfirm, cancelConfirm, isConfirming } = useConfirmDialog()
  const { getFieldError, onBlur, validateAll, resetValidation } = useFormValidation()

  // Form state
  const [treatmentName, setTreatmentName] = useState('')
  const [selectedMedIds, setSelectedMedIds] = useState<string[]>([])
  const [dateStarted, setDateStarted] = useState(new Date().toISOString().split('T')[0])
  const [dateEnded, setDateEnded] = useState('')
  const [dosage, setDosage] = useState('')
  const [frequency, setFrequency] = useState('')
  const [effectiveness, setEffectiveness] = useState(3)
  const [sideEffects, setSideEffects] = useState('')
  const [notes, setNotes] = useState('')

  // FIX: Use Promise.allSettled so getMedications failure doesn't block dog loading
  useEffect(() => {
    Promise.allSettled([getDogs(), getMedications()]).then(([dogsResult, medsResult]) => {
      const d = dogsResult.status === 'fulfilled' ? dogsResult.value : []
      const m = medsResult.status === 'fulfilled' ? medsResult.value : []
      setDogs(d)
      setAllMedications(m || [])
      if (d.length > 0) setActiveDogId(d[0].id)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!activeDogId) return
    refreshTreatments()
  }, [activeDogId])

  // FIX: Add try/catch so a failed fetch doesn't leave page blank
  async function refreshTreatments() {
    try {
      const data = await getTreatmentLogs(activeDogId)
      setTreatments(data)
    } catch {
      setTreatments([])
    }
  }

  function resetForm() {
    setTreatmentName(''); setSelectedMedIds([]); setDateStarted(new Date().toISOString().split('T')[0])
    setDateEnded(''); setDosage(''); setFrequency(''); setEffectiveness(3)
    setSideEffects(''); setNotes(''); setEditingId(null); resetValidation()
  }

  function startEdit(t: TreatmentLog) {
    setEditingId(t.id)
    setTreatmentName(t.treatment_name)
    setSelectedMedIds(
      t.treatment_medications?.map(tm => tm.medication_id) ||
      (t.medication_id ? [t.medication_id] : [])
    )
    setDateStarted(t.date_started)
    setDateEnded(t.date_ended || '')
    setDosage(t.dosage || '')
    setFrequency(t.frequency || '')
    setEffectiveness(t.effectiveness || 3)
    setSideEffects(t.side_effects_observed || '')
    setNotes(t.notes || '')
    setShowForm(true)
    resetValidation()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const isValid = validateAll([
      { id: 'treatment-name', value: treatmentName, required: true },
      { id: 'date-started', value: dateStarted, required: true },
    ])
    if (!isValid || !activeDogId) return

    setSaving(true)

    const payload: any = {
      treatment_name: treatmentName,
      medication_id: selectedMedIds.length > 0 ? selectedMedIds[0] : null,
      date_started: dateStarted,
      date_ended: dateEnded || null,
      dosage: dosage || null,
      frequency: frequency || null,
      effectiveness: effectiveness || null,
      side_effects_observed: sideEffects || null,
      notes: notes || null,
    }

    let treatmentId = editingId
    if (editingId) {
      const { error } = await supabase.from('treatment_logs').update(payload).eq('id', editingId)
      if (error) { showToast('Failed to update treatment', 'error'); setSaving(false); return }
    } else {
      const { data, error } = await supabase.from('treatment_logs').insert({ ...payload, dog_id: activeDogId }).select('id').single()
      if (error) { showToast('Failed to save treatment', 'error'); setSaving(false); return }
      treatmentId = data?.id || null
    }

    if (treatmentId && selectedMedIds.length > 0) {
      await setTreatmentMedications(treatmentId, selectedMedIds)
    }

    await refreshTreatments()
    showToast(editingId ? 'Treatment updated' : 'Treatment saved', 'success')
    resetForm()
    setShowForm(false)
    setSaving(false)
  }

  // #4 Undo support for "Mark as past"
  async function handleMarkAsPast(id: string) {
    const today = new Date().toISOString().split('T')[0]
    const original = treatments.find(t => t.id === id)

    await supabase.from('treatment_logs').update({ date_ended: today }).eq('id', id)
    await refreshTreatments()

    showUndoToast('Treatment marked as past', async () => {
      await supabase.from('treatment_logs').update({ date_ended: null }).eq('id', id)
      await refreshTreatments()
      showToast('Treatment reactivated', 'success')
    })
  }

  async function handleReactivate(id: string) {
    await supabase.from('treatment_logs').update({ date_ended: null }).eq('id', id)
    await refreshTreatments()
    showToast('Treatment reactivated', 'success')
  }

  // #2 Inline confirm + #4 undo for delete
  async function handleDelete(id: string, name: string) {
    cancelConfirm()
    const deletedTreatment = treatments.find(t => t.id === id)

    // Optimistic removal
    setTreatments(prev => prev.filter(t => t.id !== id))

    showUndoToast(`"${name}" deleted`, async () => {
      if (deletedTreatment) {
        await supabase.from('treatment_logs').insert({
          id: deletedTreatment.id,
          dog_id: activeDogId,
          treatment_name: deletedTreatment.treatment_name,
          medication_id: deletedTreatment.medication_id,
          date_started: deletedTreatment.date_started,
          date_ended: deletedTreatment.date_ended,
          dosage: deletedTreatment.dosage,
          frequency: deletedTreatment.frequency,
          effectiveness: deletedTreatment.effectiveness,
          side_effects_observed: deletedTreatment.side_effects_observed,
          notes: deletedTreatment.notes,
        })
        await refreshTreatments()
        showToast('Treatment restored', 'success')
      }
    })

    setTimeout(async () => {
      await supabase.from('treatment_logs').delete().eq('id', id)
    }, 6500)
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
      <Breadcrumbs crumbs={[{ label: 'Treatments' }]} />

      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="p-2 rounded-lg hover:bg-tanzanite-50 transition-colors" aria-label="Back to dashboard">
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
            {editingId ? 'Edit Treatment' : 'Add Treatment'}
          </h2>

          <ValidatedInput
            label="Treatment Name"
            id="treatment-name"
            required
            value={treatmentName}
            onValueChange={setTreatmentName}
            onValidate={(id, val) => onBlur(id, val, [], true)}
            error={getFieldError('treatment-name')}
            placeholder="e.g., Apoquel, Medicated bath"
          />

          {allMedications.length > 0 && (
            <ValidatedSelect
              label="Linked Medication"
              id="linked-med"
              optional
              value={selectedMedIds[0] || ''}
              onValueChange={val => setSelectedMedIds(val ? [val] : [])}
              options={allMedications.map((m: any) => ({
                value: m.id,
                label: m.brand_names?.[0] ? `${m.name} (${m.brand_names[0]})` : m.name,
              }))}
              placeholder="Select from wiki..."
            />
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <ValidatedInput
              label="Start Date"
              id="date-started"
              required
              type="date"
              value={dateStarted}
              onValueChange={setDateStarted}
              onValidate={(id, val) => onBlur(id, val, [], true)}
              error={getFieldError('date-started')}
            />
            <ValidatedInput
              label="End Date"
              id="date-ended"
              optional
              type="date"
              value={dateEnded}
              onValueChange={setDateEnded}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <ValidatedInput
              label="Dosage"
              id="dosage"
              optional
              value={dosage}
              onValueChange={setDosage}
              placeholder="e.g., 16mg"
            />
            <ValidatedInput
              label="Frequency"
              id="frequency"
              optional
              value={frequency}
              onValueChange={setFrequency}
              placeholder="e.g., 2x daily"
            />
          </div>

          <SeverityPicker
            value={effectiveness}
            onChange={setEffectiveness}
            id="effectiveness"
            label="Effectiveness"
          />

          <ValidatedTextarea
            label="Side Effects Observed"
            id="side-effects"
            optional
            value={sideEffects}
            onValueChange={setSideEffects}
            rows={2}
            placeholder="Any side effects noticed..."
          />

          <ValidatedTextarea
            label="Notes"
            id="treatment-notes"
            optional
            value={notes}
            onValueChange={setNotes}
            rows={2}
            placeholder="Additional notes..."
          />

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

      {/* Active Treatments */}
      {active.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-tanzanite-800 mb-3 flex items-center gap-2">
            <Pill className="w-4 h-4 text-ice-500" /> Active Treatments
          </h2>
          <div className="space-y-3">
            {active.map(t => (
              <TreatmentCard
                key={t.id}
                treatment={t}
                onEdit={() => startEdit(t)}
                onMarkPast={() => handleMarkAsPast(t.id)}
                onDelete={() => requestConfirm(t.id)}
                isConfirming={isConfirming(t.id)}
                onConfirmDelete={() => handleDelete(t.id, t.treatment_name)}
                onCancelConfirm={cancelConfirm}
              />
            ))}
          </div>
        </div>
      )}

      {/* Past Treatments */}
      {past.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-tanzanite-800 mb-3 flex items-center gap-2">
            <Pill className="w-4 h-4 text-slate" /> Past Treatments
          </h2>
          <div className="space-y-3">
            {past.map(t => (
              <TreatmentCard
                key={t.id}
                treatment={t}
                isPast
                onEdit={() => startEdit(t)}
                onReactivate={() => handleReactivate(t.id)}
                onDelete={() => requestConfirm(t.id)}
                isConfirming={isConfirming(t.id)}
                onConfirmDelete={() => handleDelete(t.id, t.treatment_name)}
                onCancelConfirm={cancelConfirm}
              />
            ))}
          </div>
        </div>
      )}

      {treatments.length === 0 && !showForm && (
        <EmptyState
          icon={Pill}
          title="No treatments logged yet"
          message="Record medications and therapies to build a treatment history."
          motivation="A clear treatment timeline helps your vet see what has been tried, what worked, and what to adjust."
          action={
            <button onClick={() => setShowForm(true)} className="btn-secondary text-sm inline-flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Add First Treatment
            </button>
          }
        />
      )}
    </div>
  )
}

function TreatmentCard({ treatment: t, isPast, onEdit, onMarkPast, onReactivate, onDelete, isConfirming: confirming, onConfirmDelete, onCancelConfirm }: {
  treatment: TreatmentLog; isPast?: boolean
  onEdit: () => void; onMarkPast?: () => void; onReactivate?: () => void; onDelete: () => void
  isConfirming: boolean; onConfirmDelete: () => void; onCancelConfirm: () => void
}) {
  return (
    <div className={`card py-3 px-4 ${isPast ? 'opacity-70' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium text-body">{t.treatment_name}</p>
            <EffectivenessDots rating={t.effectiveness} />
          </div>
          <div className="flex flex-wrap gap-x-3 text-xs text-slate">
            {t.dosage && <span>{t.dosage}</span>}
            {t.frequency && <span>{t.frequency}</span>}
            <span>Since {formatDate(t.date_started)}</span>
            {t.date_ended && <span>Until {formatDate(t.date_ended)}</span>}
          </div>
          {t.side_effects_observed && <p className="text-xs text-amber-600 mt-1">{t.side_effects_observed}</p>}
          {t.notes && <p className="text-xs text-slate mt-0.5">{t.notes}</p>}
          {t.medications && (
            <Link href={`/medications/${t.medications.slug}`}
              className="text-xs text-tanzanite-500 hover:underline mt-1 inline-block">
              Wiki: {t.medications.brand_names?.[0] || t.medications.name}
            </Link>
          )}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={onEdit} className="p-1.5 rounded hover:bg-tanzanite-50 text-slate" aria-label="Edit treatment">
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          {!isPast && onMarkPast && (
            <button onClick={onMarkPast} className="p-1.5 rounded hover:bg-amber-50 text-slate" aria-label="Mark as past">
              <Pause className="w-3.5 h-3.5" />
            </button>
          )}
          {isPast && onReactivate && (
            <button onClick={onReactivate} className="p-1.5 rounded hover:bg-green-50 text-slate" aria-label="Reactivate">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={onDelete} className="p-1.5 rounded hover:bg-red-50 text-slate" aria-label="Delete treatment">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {confirming && (
        <ConfirmDialog
          message={`Delete "${t.treatment_name}"? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={onConfirmDelete}
          onCancel={onCancelConfirm}
        />
      )}
    </div>
  )
}

function EffectivenessDots({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-xs text-slate">Not rated</span>
  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5" aria-hidden="true">
        {[1,2,3,4,5].map(i => (
          <span key={i} className={`w-2 h-2 rounded-full ${i <= rating ? 'bg-tanzanite-400' : 'bg-gray-200'}`} />
        ))}
      </div>
      <span className="sr-only">Effectiveness: {rating} out of 5</span>
    </div>
  )
}
