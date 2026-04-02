'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, FileText, Activity, Pill, Calendar, PawPrint, Paperclip } from 'lucide-react'
import { getDogs, getSymptomLogs, getTreatmentLogs, getVetVisits, getDocuments } from '@/lib/supabase'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { VetPrepExport } from '@/components/VetPrepExport'
import { SeverityBadge } from '@/components/SeverityPicker'

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function VetPrepPage() {
  const [dogs, setDogs] = useState<any[]>([])
  const [activeDogId, setActiveDogId] = useState<string>('')
  const [activeDog, setActiveDog] = useState<any>(null)
  const [symptoms, setSymptoms] = useState<any[]>([])
  const [treatments, setTreatments] = useState<any[]>([])
  const [vetVisits, setVetVisits] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [daysBack, setDaysBack] = useState(30)

  const [includeSymptoms, setIncludeSymptoms] = useState(true)
  const [includeTreatments, setIncludeTreatments] = useState(true)
  const [includeVisits, setIncludeVisits] = useState(true)
  const [includeDocs, setIncludeDocs] = useState(true)

  // #10 Ref for export
  const reportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getDogs().then(data => {
      setDogs(data)
      if (data.length > 0) {
        setActiveDogId(data[0].id)
        setActiveDog(data[0])
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!activeDogId) return
    setActiveDog(dogs.find(d => d.id === activeDogId) || null)
    Promise.all([
      getSymptomLogs(activeDogId, 100),
      getTreatmentLogs(activeDogId),
      getVetVisits(activeDogId),
      getDocuments(activeDogId),
    ]).then(([s, t, v, d]) => {
      setSymptoms(s)
      setTreatments(t)
      setVetVisits(v)
      setDocuments(d)
    })
  }, [activeDogId, dogs])

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - daysBack)
  const cutoffStr = cutoff.toISOString().split('T')[0]
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const filteredSymptoms = symptoms.filter(s => s.date >= cutoffStr)
  const activeTreatments = treatments.filter(t => !t.date_ended)
  const recentVisits = vetVisits.filter(v => v.visit_date >= cutoffStr)

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
      <Breadcrumbs crumbs={[{ label: 'Vet Prep' }]} />

      {/* Controls - hidden during print */}
      <div className="print:hidden mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/dashboard" className="p-2 rounded-lg hover:bg-tanzanite-50 transition-colors" aria-label="Back to dashboard">
            <ArrowLeft className="w-5 h-5 text-tanzanite-500" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-tanzanite-800">Vet Prep Report</h1>
            <p className="text-sm text-slate">Generate a summary to bring to your vet appointment</p>
          </div>
        </div>

        {/* Config */}
        <div className="card mb-4">
          <div className="flex flex-wrap gap-3 items-center mb-3">
            <label className="text-sm font-medium text-body">Time range:</label>
            <select value={daysBack} onChange={e => setDaysBack(Number(e.target.value))}
              className="px-3 py-1.5 rounded-lg border border-tanzanite-100 text-sm">
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
              <option value={60}>Last 60 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={includeSymptoms} onChange={e => setIncludeSymptoms(e.target.checked)}
                className="rounded border-tanzanite-300 text-tanzanite-500 focus:ring-tanzanite-200" />
              Symptoms
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={includeTreatments} onChange={e => setIncludeTreatments(e.target.checked)}
                className="rounded border-tanzanite-300 text-tanzanite-500 focus:ring-tanzanite-200" />
              Treatments
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={includeVisits} onChange={e => setIncludeVisits(e.target.checked)}
                className="rounded border-tanzanite-300 text-tanzanite-500 focus:ring-tanzanite-200" />
              Past Visits
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={includeDocs} onChange={e => setIncludeDocs(e.target.checked)}
                className="rounded border-tanzanite-300 text-tanzanite-500 focus:ring-tanzanite-200" />
              Documents
            </label>
          </div>
        </div>

        {/* #10 Export options */}
        <VetPrepExport
          reportRef={reportRef}
          dogName={activeDog?.name || 'Dog'}
          reportDate={today}
        />
      </div>

      {/* Report content */}
      <div ref={reportRef} className="card print:shadow-none print:border-none print:p-0">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-tanzanite-100">
          <PawPrint className="w-6 h-6 text-tanzanite-500" />
          <div>
            <h2 className="text-lg font-bold text-tanzanite-800">{activeDog?.name || 'Dog'} — Vet Prep</h2>
            <p className="text-xs text-slate">Generated {today} • Last {daysBack} days</p>
          </div>
        </div>

        {/* Dog info */}
        {activeDog && (
          <div className="mb-6 p-3 bg-tanzanite-50/50 rounded-lg">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
              {activeDog.breed && <div><span className="text-xs text-slate block">Breed</span>{activeDog.breed}</div>}
              {activeDog.dob && <div><span className="text-xs text-slate block">DOB</span>{formatDate(activeDog.dob)}</div>}
              {activeDog.weight_lbs && <div><span className="text-xs text-slate block">Weight</span>{activeDog.weight_lbs} lbs</div>}
              {activeDog.known_allergies?.length > 0 && (
                <div><span className="text-xs text-slate block">Allergies</span>{activeDog.known_allergies.join(', ')}</div>
              )}
            </div>
          </div>
        )}

        {/* Symptoms */}
        {includeSymptoms && filteredSymptoms.length > 0 && (
          <div className="mb-6">
            <h3 className="flex items-center gap-2 text-sm font-bold text-tanzanite-800 uppercase tracking-wide mb-3">
              <Activity className="w-4 h-4" /> Symptoms ({filteredSymptoms.length})
            </h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-tanzanite-100">
                  <th className="text-left py-1.5 text-xs text-slate font-medium">Date</th>
                  <th className="text-left py-1.5 text-xs text-slate font-medium">Type</th>
                  <th className="text-left py-1.5 text-xs text-slate font-medium">Area</th>
                  <th className="text-left py-1.5 text-xs text-slate font-medium">Severity</th>
                  <th className="text-left py-1.5 text-xs text-slate font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredSymptoms.map(s => (
                  <tr key={s.id} className="border-b border-tanzanite-50">
                    <td className="py-1.5">{formatDate(s.date)}</td>
                    <td className="py-1.5">{s.symptom_type}</td>
                    <td className="py-1.5 text-slate">{s.body_area}</td>
                    <td className="py-1.5"><SeverityBadge severity={s.severity} /></td>
                    <td className="py-1.5 text-xs text-slate">{s.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Active Treatments */}
        {includeTreatments && activeTreatments.length > 0 && (
          <div className="mb-6">
            <h3 className="flex items-center gap-2 text-sm font-bold text-tanzanite-800 uppercase tracking-wide mb-3">
              <Pill className="w-4 h-4" /> Active Treatments ({activeTreatments.length})
            </h3>
            {activeTreatments.map(t => (
              <div key={t.id} className="mb-3 pb-3 border-b border-tanzanite-50 last:border-0">
                <p className="text-sm font-medium">{t.treatment_name}</p>
                <div className="flex flex-wrap gap-x-3 text-xs text-slate">
                  {t.dosage && <span>{t.dosage}</span>}
                  {t.frequency && <span>{t.frequency}</span>}
                  <span>Since {formatDate(t.date_started)}</span>
                </div>
                {t.side_effects_observed && <p className="text-xs text-amber-600 mt-0.5">{t.side_effects_observed}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Recent Visits */}
        {includeVisits && recentVisits.length > 0 && (
          <div className="mb-6">
            <h3 className="flex items-center gap-2 text-sm font-bold text-tanzanite-800 uppercase tracking-wide mb-3">
              <Calendar className="w-4 h-4" /> Recent Vet Visits
            </h3>
            {recentVisits.map(v => (
              <div key={v.id} className="mb-3 pb-3 border-b border-tanzanite-50 last:border-0">
                <div className="flex gap-x-4 text-sm">
                  <span className="font-medium">{formatDate(v.visit_date)}</span>
                  {v.vet_name && <span className="text-slate">{v.vet_name}</span>}
                </div>
                <p className="text-sm">{v.reason}</p>
                {v.diagnosis && <p className="text-xs text-tanzanite-500">Dx: {v.diagnosis}</p>}
                {v.notes && <p className="text-xs text-slate">{v.notes}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Linked Documents */}
        {includeDocs && documents.filter(d => d.vet_visit_id || d.treatment_log_id).length > 0 && (
          <div className="mb-6">
            <h3 className="flex items-center gap-2 text-sm font-bold text-tanzanite-800 uppercase tracking-wide mb-3">
              <Paperclip className="w-4 h-4" /> Linked Documents
            </h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-tanzanite-100">
                  <th className="text-left py-1.5 text-xs text-slate font-medium">Document</th>
                  <th className="text-left py-1.5 text-xs text-slate font-medium">Category</th>
                  <th className="text-left py-1.5 text-xs text-slate font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {documents.filter(d => d.vet_visit_id || d.treatment_log_id).map(d => (
                  <tr key={d.id} className="border-b border-tanzanite-50">
                    <td className="py-1.5 font-medium">{d.display_name || d.file_name}</td>
                    <td className="py-1.5 text-slate">{d.category}</td>
                    <td className="py-1.5 text-slate">{d.doc_date ? formatDate(d.doc_date) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-tanzanite-100 pt-3 mt-8">
          <p className="text-xs text-slate text-center">
            Generated by Whysice (whysice.netlify.app) — Canine Dermatology Wiki & Health Tracker
          </p>
        </div>
      </div>
    </div>
  )
}
