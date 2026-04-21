'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Activity, X, Trash2, Edit3, Check } from 'lucide-react'
import { supabase, getDogs, getSymptomLogs } from '@/lib/supabase'
import { useToast } from '@/contexts/ToastContext'
import { ConfirmDialog, useConfirmDialog } from '@/components/ConfirmDialog'
import { ValidatedSelect, ValidatedTextarea, useFormValidation } from '@/components/FormField'
import { SeverityPicker, SeverityDots, SeverityBadge } from '@/components/SeverityPicker'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { EmptyState } from '@/components/EmptyState'

const BODY_AREAS = ['Front left paw', 'Front right paw', 'Back left paw', 'Back right paw', 'Ears', 'Face', 'Belly', 'Armpits', 'Back', 'Neck', 'Perianal', 'General']
const SYMPTOM_TYPES = ['Itching', 'Redness', 'Swelling', 'Discharge', 'Cyst/nodule', 'Hair loss', 'Crusting', 'Odor', 'Hot spot', 'Ear infection signs', 'Licking/chewing', 'Other']

type SymptomLog = {
  id: string; date: string; body_area: string; symptom_type: string
  severity: number; photo_urls: string[] | null; notes: string | null; environmental_notes: string | null
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function SymptomsPage() {
  const [dogs, setDogs] = useState<{ id: string; name: string }[]>([])
  const [activeDogId, setActiveDogId] = useState<string>('')
  const [logs, setLogs] = useState<SymptomLog[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Integrations
  const { showToast, showUndoToast } = useToast()
  const { confirmingId, requestConfirm, cancelConfirm, isConfirming } = useConfirmDialog()
  const { errors, getFieldError, onBlur, validateAll, resetValidation } = useFormValidation()

  // Form state
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [bodyArea, setBodyArea] = useState('')
  const [symptomType, setSymptomType] = useState('')
  const [severity, setSeverity] = useState(3)
  const [notes, setNotes] = useState('')
  const [envNotes, setEnvNotes] = useState('')

  useEffect(() => {
    getDogs().then(data => {
      setDogs(data)
      if (data.length > 0) setActiveDogId(data[0].id)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!activeDogId) return
    getSymptomLogs(activeDogId, 50).then(setLogs)
  }, [activeDogId])

  function resetForm() {
    setDate(new Date().toISOString().split('T')[0])
    setBodyArea('')
    setSymptomType('')
    setSeverity(3)
    setNotes('')
    setEnvNotes('')
    setEditingId(null)
    resetValidation()
  }

  function startEdit(entry: SymptomLog) {
    setEditingId(entry.id)
    setDate(entry.date)
    setBodyArea(entry.body_area)
    setSymptomType(entry.symptom_type)
    setSeverity(entry.severity)
    setNotes(entry.notes || '')
    setEnvNotes(entry.environmental_notes || '')
    setShowForm(true)
    resetValidation()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // #4 Undo support: soft-delete with undo window
  async function handleDelete(id: string) {
    const deletedLog = logs.find(l => l.id === id)
    if (!deletedLog) return

    // Optimistically remove from UI
    setLogs(prev => prev.filter(l => l.id !== id))
    cancelConfirm()

    // Show undo toast
    showUndoToast(
      `Symptom entry deleted`,
      async () => {
        // Undo: re-insert the log
        const { error } = await supabase.from('symptom_logs').insert({
          id: deletedLog.id,
          dog_id: activeDogId,
          date: deletedLog.date,
          body_area: deletedLog.body_area,
          symptom_type: deletedLog.symptom_type,
          severity: deletedLog.severity,
          notes: deletedLog.notes,
          environmental_notes: deletedLog.environmental_notes,
        })
        if (!error) {
          const updated = await getSymptomLogs(activeDogId, 50)
          setLogs(updated)
          showToast('Entry restored', 'success')
        }
      }
    )

    // Actually delete after undo window
    setTimeout(async () => {
      await supabase.from('symptom_logs').delete().eq('id', id)
    }, 6500)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // #3 Form validation
    const isValid = validateAll([
      { id: 'body-area', value: bodyArea, required: true },
      { id: 'symptom-type', value: symptomType, required: true },
    ])
    if (!isValid || !activeDogId) return

    setSaving(true)

    const payload = {
      dog_id: activeDogId,
      date,
      body_area: bodyArea,
      symptom_type: symptomType,
      severity,
      notes: notes || null,
      environmental_notes: envNotes || null,
    }

    if (editingId) {
      const { error } = await supabase.from('symptom_logs').update(payload).eq('id', editingId)
      if (!error) {
        const updated = await getSymptomLogs(activeDogId, 50)
        setLogs(updated)
        resetForm()
        setShowForm(false)
        showToast('Symptom entry updated', 'success')
      } else {
        showToast('Failed to update entry', 'error')
      }
    } else {
      const { error } = await supabase.from('symptom_logs').insert(payload)
      if (!error) {
        const updated = await getSymptomLogs(activeDogId, 50)
        setLogs(updated)
        resetForm()
        setShowForm(false)
        showToast('Symptom logged', 'success')
      } else {
        showToast('Failed to save entry', 'error')
      }
    }
    setSaving(false)
  }

  const grouped = logs.reduce<Record<string, SymptomLog[]>>((acc, log) => {
    if (!acc[log.date]) acc[log.date] = []
    acc[log.date].push(log)
    return acc
  }, {})

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
      {/* #7 Breadcrumbs */}
      <Breadcrumbs crumbs={[{ label: 'Symptom Log' }]} />

      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="p-2 rounded-lg hover:bg-tanzanite-50 transition-colors" aria-label="Back to dashboard">
          <ArrowLeft className="w-5 h-5 text-tanzanite-500" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-tanzanite-800">Symptom Log</h1>
          <p className="text-sm text-slate">Track symptoms over time to identify patterns</p>
        </div>
        <button
          onClick={() => { if (showForm) { resetForm(); setShowForm(false) } else { resetForm(); setShowForm(true) } }}
          className={showForm ? 'btn-secondary text-sm' : 'btn-primary text-sm'}
        >
          {showForm ? <><X className="w-3.5 h-3.5 inline mr-1" /> Cancel</> : <><Plus className="w-3.5 h-3.5 inline mr-1" /> Log Symptom</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-8 border-tanzanite-200">
          <h2 className="font-semibold text-tanzanite-800 mb-4">
            {editingId ? 'Edit Symptom Entry' : 'Log New Symptom'}
          </h2>

          <div className="mb-4">
            <label htmlFor="symptom-date" className="block text-sm font-medium text-body mb-1">Date</label>
            <input id="symptom-date" type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-tanzanite-100 text-sm focus:border-tanzanite-500 focus:outline-none focus:ring-1 focus:ring-tanzanite-200" />
          </div>

          {/* #3 Validated select fields */}
          <div className="grid sm:grid-cols-2 gap-4">
            <ValidatedSelect
              label="Body Area"
              id="body-area"
              required
              value={bodyArea}
              onValueChange={setBodyArea}
              onValidate={(id, val) => onBlur(id, val, [], true)}
              error={getFieldError('body-area')}
              options={BODY_AREAS.map(a => ({ value: a, label: a }))}
              placeholder="Select area..."
            />
            <ValidatedSelect
              label="Symptom Type"
              id="symptom-type"
              required
              value={symptomType}
              onValueChange={setSymptomType}
              onValidate={(id, val) => onBlur(id, val, [], true)}
              error={getFieldError('symptom-type')}
              options={SYMPTOM_TYPES.map(t => ({ value: t, label: t }))}
              placeholder="Select type..."
            />
          </div>

          {/* #8 Severity picker with labels */}
          <SeverityPicker value={severity} onChange={setSeverity} />

          <ValidatedTextarea
            label="Notes"
            id="symptom-notes"
            optional
            value={notes}
            onValueChange={setNotes}
            rows={2}
            placeholder="What you observed, any context..."
          />

          <ValidatedTextarea
            label="Environmental Notes"
            id="env-notes"
            optional
            hint="Weather, recent activities, new exposures, etc."
            value={envNotes}
            onValueChange={setEnvNotes}
            rows={2}
            placeholder="e.g., Rainy day, walked in tall grass"
          />

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : editingId ? 'Update Entry' : 'Save Entry'}
            </button>
            {editingId && (
              <button type="button" onClick={() => { resetForm(); setShowForm(false) }} className="btn-secondary">
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      )}

      {/* #9 aria-live region for dynamic updates */}
      <div aria-live="polite" aria-atomic="false" className="sr-only">
        {logs.length} symptom entries loaded
      </div>

      {Object.entries(grouped).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, entries]) => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-tanzanite-500 mb-2">{formatDate(date)}</h3>
              <div className="space-y-2">
                {entries.map(entry => (
                  <div key={entry.id} className="card py-3 px-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-body">{entry.symptom_type}</p>
                          <span className="text-xs text-slate">—</span>
                          <p className="text-sm text-slate">{entry.body_area}</p>
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          {/* #8 Severity badge instead of bare dots */}
                          <SeverityBadge severity={entry.severity} />
                        </div>
                        {entry.notes && <p className="text-xs text-slate mt-1">{entry.notes}</p>}
                        {entry.environmental_notes && (
                          <p className="text-xs text-slate/70 mt-0.5 italic">{entry.environmental_notes}</p>
                        )}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => startEdit(entry)}
                          className="p-1.5 rounded hover:bg-tanzanite-50 text-slate transition-colors"
                          aria-label={`Edit ${entry.symptom_type} entry`}>
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => requestConfirm(entry.id)}
                          className="p-1.5 rounded hover:bg-red-50 text-slate transition-colors"
                          aria-label={`Delete ${entry.symptom_type} entry`}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* #2 Inline confirmation dialog */}
                    {isConfirming(entry.id) && (
                      <ConfirmDialog
                        message={`Delete this ${entry.symptom_type} entry from ${formatDate(entry.date)}?`}
                        confirmLabel="Delete"
                        onConfirm={() => handleDelete(entry.id)}
                        onCancel={cancelConfirm}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : !showForm ? (
        /* #6 Motivating empty state */
        <EmptyState
          icon={Activity}
          title="No symptoms logged yet"
          message="Start tracking symptoms to spot patterns your vet can use."
          motivation="Logging symptoms helps identify triggers and measure whether treatments are working over time."
          action={
            <button onClick={() => setShowForm(true)} className="btn-secondary text-sm inline-flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Log First Symptom
            </button>
          }
        />
      ) : null}
    </div>
  )
}
