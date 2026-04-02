'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Calendar, X, FileText } from 'lucide-react'
import { supabase, getDogs, getVetVisits } from '@/lib/supabase'
import { useToast } from '@/contexts/ToastContext'
import { ValidatedInput, ValidatedTextarea, useFormValidation } from '@/components/FormField'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { EmptyState } from '@/components/EmptyState'

type VetVisit = {
  id: string; visit_date: string; vet_name: string | null; reason: string
  diagnosis: string | null; treatment_plan: any | null; follow_up_date: string | null
  documents: string[] | null; notes: string | null
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function VisitsPage() {
  const [dogs, setDogs] = useState<any[]>([])
  const [activeDogId, setActiveDogId] = useState<string>('')
  const [visits, setVisits] = useState<VetVisit[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const { showToast } = useToast()
  const { getFieldError, onBlur, validateAll, resetValidation } = useFormValidation()

  // Form state
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0])
  const [vetName, setVetName] = useState('')
  const [reason, setReason] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    getDogs().then(data => {
      setDogs(data)
      if (data.length > 0) setActiveDogId(data[0].id)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!activeDogId) return
    getVetVisits(activeDogId).then(setVisits)
  }, [activeDogId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const isValid = validateAll([
      { id: 'reason', value: reason, required: true },
      { id: 'visit-date', value: visitDate, required: true },
    ])
    if (!isValid || !activeDogId) return

    setSaving(true)

    const { error } = await supabase.from('vet_visits').insert({
      dog_id: activeDogId,
      visit_date: visitDate,
      vet_name: vetName || null,
      reason,
      diagnosis: diagnosis || null,
      follow_up_date: followUpDate || null,
      notes: notes || null,
    })

    if (!error) {
      const updated = await getVetVisits(activeDogId)
      setVisits(updated)
      setVisitDate(new Date().toISOString().split('T')[0])
      setVetName(''); setReason(''); setDiagnosis(''); setFollowUpDate(''); setNotes('')
      setShowForm(false)
      resetValidation()
      showToast('Vet visit recorded', 'success')
    } else {
      showToast('Failed to save visit', 'error')
    }
    setSaving(false)
  }

  const upcoming = visits.filter(v => new Date(v.visit_date) >= new Date())
  const pastVisits = visits.filter(v => new Date(v.visit_date) < new Date())

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
      <Breadcrumbs crumbs={[{ label: 'Vet Visits' }]} />

      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="p-2 rounded-lg hover:bg-tanzanite-50 transition-colors" aria-label="Back to dashboard">
          <ArrowLeft className="w-5 h-5 text-tanzanite-500" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-tanzanite-800">Vet Visits</h1>
          <p className="text-sm text-slate">Record visits and track follow-ups</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); if (showForm) resetValidation() }}
          className={showForm ? 'btn-secondary text-sm' : 'btn-primary text-sm'}
        >
          {showForm ? <><X className="w-3.5 h-3.5 inline mr-1" /> Cancel</> : <><Plus className="w-3.5 h-3.5 inline mr-1" /> Add Visit</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-8 border-tanzanite-200">
          <h2 className="font-semibold text-tanzanite-800 mb-4">Record Vet Visit</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <ValidatedInput
              label="Visit Date"
              id="visit-date"
              required
              type="date"
              value={visitDate}
              onValueChange={setVisitDate}
              onValidate={(id, val) => onBlur(id, val, [], true)}
              error={getFieldError('visit-date')}
            />
            <ValidatedInput
              label="Vet / Clinic Name"
              id="vet-name"
              optional
              value={vetName}
              onValueChange={setVetName}
              placeholder="Dr. Smith / ABC Vet Clinic"
            />
          </div>

          <ValidatedInput
            label="Reason for Visit"
            id="reason"
            required
            value={reason}
            onValueChange={setReason}
            onValidate={(id, val) => onBlur(id, val, [], true)}
            error={getFieldError('reason')}
            placeholder="Chief concern"
          />

          <div className="grid sm:grid-cols-2 gap-4">
            <ValidatedInput
              label="Diagnosis"
              id="diagnosis"
              optional
              value={diagnosis}
              onValueChange={setDiagnosis}
              placeholder="Vet's diagnosis"
            />
            <ValidatedInput
              label="Follow-up Date"
              id="follow-up"
              optional
              type="date"
              value={followUpDate}
              onValueChange={setFollowUpDate}
            />
          </div>

          <ValidatedTextarea
            label="Notes"
            id="visit-notes"
            optional
            value={notes}
            onValueChange={setNotes}
            rows={3}
            placeholder="What was discussed, prescribed, recommended..."
          />

          <button type="submit" disabled={saving} className="btn-primary w-full sm:w-auto">
            {saving ? 'Saving...' : 'Save Visit'}
          </button>
        </form>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-tanzanite-500 uppercase tracking-wide mb-3">Upcoming</h2>
          <div className="space-y-3">
            {upcoming.map(v => <VisitCard key={v.id} visit={v} isUpcoming />)}
          </div>
        </div>
      )}

      {/* Past */}
      {pastVisits.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate uppercase tracking-wide mb-3">Past Visits</h2>
          <div className="space-y-3">
            {pastVisits.map(v => <VisitCard key={v.id} visit={v} />)}
          </div>
        </div>
      )}

      {visits.length === 0 && !showForm && (
        <EmptyState
          icon={Calendar}
          title="No vet visits recorded"
          message="Log vet visits to keep your visit history in one place."
          motivation="Having visit history readily available means less time filling out forms and more time discussing care."
          action={
            <button onClick={() => setShowForm(true)} className="btn-secondary text-sm inline-flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Record First Visit
            </button>
          }
        />
      )}
    </div>
  )
}

function VisitCard({ visit: v, isUpcoming }: { visit: VetVisit; isUpcoming?: boolean }) {
  return (
    <div className={`card py-3 px-4 ${isUpcoming ? 'border-tanzanite-200' : ''}`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg flex-shrink-0 ${isUpcoming ? 'bg-tanzanite-50' : 'bg-gray-50'}`}>
          <Calendar className={`w-4 h-4 ${isUpcoming ? 'text-tanzanite-500' : 'text-slate'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-medium text-body">{formatDate(v.visit_date)}</p>
            {v.vet_name && <span className="text-xs text-slate">• {v.vet_name}</span>}
          </div>
          <p className="text-sm text-body">{v.reason}</p>
          {v.diagnosis && <p className="text-xs text-tanzanite-500 mt-0.5">Dx: {v.diagnosis}</p>}
          {v.notes && <p className="text-xs text-slate mt-1">{v.notes}</p>}
          {v.follow_up_date && (
            <p className="text-xs text-amber-600 mt-1">Follow-up: {formatDate(v.follow_up_date)}</p>
          )}
        </div>
        <Link href="/dashboard/documents" className="p-1.5 rounded hover:bg-tanzanite-50 text-slate flex-shrink-0"
          aria-label="View linked documents">
          <FileText className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}
