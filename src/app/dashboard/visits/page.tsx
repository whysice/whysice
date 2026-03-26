'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Calendar, X, FileText } from 'lucide-react'
import { supabase, getDogs, getVetVisits } from '@/lib/supabase'

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
    if (!activeDogId || !reason || !visitDate) return
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
    }
    setSaving(false)
  }

  const upcoming = visits.filter(v => new Date(v.visit_date) >= new Date())
  const past = visits.filter(v => new Date(v.visit_date) < new Date())

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
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="p-2 rounded-lg hover:bg-tanzanite-50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-tanzanite-500" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-tanzanite-800">Vet Visits</h1>
          <p className="text-sm text-slate">Record and track veterinary appointments</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/vet-prep" className="btn-secondary text-sm">
            <FileText className="w-3.5 h-3.5 inline mr-1" /> Vet Prep
          </Link>
          <button
            onClick={() => setShowForm(!showForm)}
            className={showForm ? 'btn-secondary text-sm' : 'btn-primary text-sm'}
          >
            {showForm ? <><X className="w-3.5 h-3.5 inline mr-1" /> Cancel</> : <><Plus className="w-3.5 h-3.5 inline mr-1" /> Add Visit</>}
          </button>
        </div>
      </div>

      {/* New Visit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-8 border-tanzanite-200">
          <h2 className="font-semibold text-tanzanite-800 mb-4">Record vet visit</h2>

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="visit-date" className="block text-sm font-medium text-body mb-1">Visit date</label>
              <input
                id="visit-date" type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-tanzanite-100 text-sm focus:border-tanzanite-500 focus:outline-none focus:ring-1 focus:ring-tanzanite-200"
                required
              />
            </div>
            <div>
              <label htmlFor="vet-name" className="block text-sm font-medium text-body mb-1">Veterinarian / clinic</label>
              <input
                id="vet-name" type="text" value={vetName} onChange={e => setVetName(e.target.value)}
                placeholder="e.g., Dr. Prine (Vetster)"
                className="w-full px-3 py-2 rounded-lg border border-tanzanite-100 text-sm focus:border-tanzanite-500 focus:outline-none focus:ring-1 focus:ring-tanzanite-200"
              />
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="reason" className="block text-sm font-medium text-body mb-1">Reason for visit</label>
            <input
              id="reason" type="text" value={reason} onChange={e => setReason(e.target.value)}
              placeholder="Chief concern"
              className="w-full px-3 py-2 rounded-lg border border-tanzanite-100 text-sm focus:border-tanzanite-500 focus:outline-none focus:ring-1 focus:ring-tanzanite-200"
              required
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="diagnosis" className="block text-sm font-medium text-body mb-1">
                Diagnosis <span className="text-slate font-normal">(optional)</span>
              </label>
              <input
                id="diagnosis" type="text" value={diagnosis} onChange={e => setDiagnosis(e.target.value)}
                placeholder="Vet's diagnosis"
                className="w-full px-3 py-2 rounded-lg border border-tanzanite-100 text-sm focus:border-tanzanite-500 focus:outline-none focus:ring-1 focus:ring-tanzanite-200"
              />
            </div>
            <div>
              <label htmlFor="follow-up" className="block text-sm font-medium text-body mb-1">
                Follow-up date <span className="text-slate font-normal">(optional)</span>
              </label>
              <input
                id="follow-up" type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-tanzanite-100 text-sm focus:border-tanzanite-500 focus:outline-none focus:ring-1 focus:ring-tanzanite-200"
              />
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="visit-notes" className="block text-sm font-medium text-body mb-1">
              Notes <span className="text-slate font-normal">(optional)</span>
            </label>
            <textarea
              id="visit-notes" value={notes} onChange={e => setNotes(e.target.value)}
              rows={3} placeholder="What was discussed, prescribed, recommended..."
              className="w-full px-3 py-2 rounded-lg border border-tanzanite-100 text-sm focus:border-tanzanite-500 focus:outline-none focus:ring-1 focus:ring-tanzanite-200 resize-none"
            />
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full sm:w-auto">
            {saving ? 'Saving...' : 'Save Visit'}
          </button>
        </form>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-tanzanite-800 mb-3">Upcoming</h2>
          <div className="space-y-3">
            {upcoming.map(v => (
              <VisitCard key={v.id} visit={v} isUpcoming />
            ))}
          </div>
        </div>
      )}

      {/* Past Visits */}
      {past.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-tanzanite-800 mb-3">Past Visits</h2>
          <div className="space-y-3">
            {past.map(v => (
              <VisitCard key={v.id} visit={v} />
            ))}
          </div>
        </div>
      )}

      {visits.length === 0 && !showForm && (
        <div className="card text-center py-12">
          <Calendar className="w-10 h-10 text-tanzanite-200 mx-auto mb-3" />
          <p className="text-slate text-sm">No vet visits recorded yet.</p>
        </div>
      )}
    </div>
  )
}

function VisitCard({ visit: v, isUpcoming }: { visit: VetVisit; isUpcoming?: boolean }) {
  return (
    <div className={`card py-4 ${isUpcoming ? 'border-l-4 border-l-tanzanite-500' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-tanzanite-800">{formatDate(v.visit_date)}</span>
            {v.vet_name && <span className="text-xs text-slate">- {v.vet_name}</span>}
          </div>
          <p className="text-sm text-body font-medium">{v.reason}</p>
          {v.diagnosis && <p className="text-xs text-tanzanite-500 mt-1">Diagnosis: {v.diagnosis}</p>}
          {v.notes && <p className="text-xs text-slate mt-1">{v.notes}</p>}
          {v.follow_up_date && (
            <p className="text-xs text-tanzanite-400 mt-2">
              Follow-up scheduled: {formatDate(v.follow_up_date)}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
