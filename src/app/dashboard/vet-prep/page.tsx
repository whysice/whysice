'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, FileText, Download, Activity, Pill, Calendar, PawPrint, Paperclip } from 'lucide-react'
import { getDogs, getSymptomLogs, getTreatmentLogs, getVetVisits, getDocuments, getDocumentUrl } from '@/lib/supabase'

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

  // Sections to include
  const [includeSymptoms, setIncludeSymptoms] = useState(true)
  const [includeTreatments, setIncludeTreatments] = useState(true)
  const [includeVisits, setIncludeVisits] = useState(true)
  const [includeDocs, setIncludeDocs] = useState(true)

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

  // Filter by date range
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - daysBack)
  const cutoffStr = cutoff.toISOString().split('T')[0]

  const filteredSymptoms = symptoms.filter(s => s.date >= cutoffStr)
  const activeTreatments = treatments.filter(t => !t.date_ended)
  const recentVisits = vetVisits.filter(v => v.visit_date >= cutoffStr)

  function handlePrint() {
    window.print()
  }

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
      {/* Controls - hidden when printing */}
      <div className="print:hidden">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard" className="p-2 rounded-lg hover:bg-tanzanite-50 transition-colors">
            <ArrowLeft className="w-5 h-5 text-tanzanite-500" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-tanzanite-800">Vet Prep Report</h1>
            <p className="text-sm text-slate">Generate a summary to bring to your vet visit</p>
          </div>
          <button onClick={handlePrint} className="btn-primary text-sm">
            <Download className="w-3.5 h-3.5 inline mr-1" /> Print / Save PDF
          </button>
        </div>

        {/* Config */}
        <div className="card mb-8">
          <h3 className="text-sm font-semibold text-tanzanite-800 mb-3">Report settings</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="days-back" className="block text-xs text-slate mb-1">Date range</label>
              <select
                id="days-back" value={daysBack} onChange={e => setDaysBack(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-tanzanite-100 text-sm"
              >
                <option value={7}>Last 7 days</option>
                <option value={14}>Last 14 days</option>
                <option value={30}>Last 30 days</option>
                <option value={60}>Last 60 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-xs text-slate mb-1">Include sections</label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={includeSymptoms} onChange={e => setIncludeSymptoms(e.target.checked)} className="accent-tanzanite-500" />
                Symptom log ({filteredSymptoms.length} entries)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={includeTreatments} onChange={e => setIncludeTreatments(e.target.checked)} className="accent-tanzanite-500" />
                Active treatments ({activeTreatments.length})
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={includeVisits} onChange={e => setIncludeVisits(e.target.checked)} className="accent-tanzanite-500" />
                Recent vet visits ({recentVisits.length})
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={includeDocs} onChange={e => setIncludeDocs(e.target.checked)} className="accent-tanzanite-500" />
                Linked documents ({documents.filter(d => d.vet_visit_id || d.treatment_log_id).length})
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Report */}
      <div className="print:p-0">
        {/* Report Header */}
        <div className="border-b-2 border-tanzanite-500 pb-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <PawPrint className="w-5 h-5 text-tanzanite-500" />
            <span className="text-sm font-bold text-tanzanite-500">WHYSICE</span>
            <span className="text-xs text-slate">Vet Prep Report</span>
          </div>
          {activeDog && (
            <div>
              <h2 className="text-xl font-bold text-tanzanite-800">{activeDog.name}</h2>
              <div className="flex flex-wrap gap-x-4 text-sm text-slate">
                {activeDog.breed && <span>{activeDog.breed}</span>}
                {activeDog.dob && <span>DOB: {formatDate(activeDog.dob)}</span>}
                {activeDog.weight_lbs && <span>{activeDog.weight_lbs} lbs</span>}
              </div>
              {activeDog.known_allergies && activeDog.known_allergies.length > 0 && (
                <p className="text-sm mt-1">
                  <strong>Confirmed allergies:</strong> {activeDog.known_allergies.join(', ')}
                </p>
              )}
            </div>
          )}
          <p className="text-xs text-slate mt-2">
            Generated {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            {' | '}Last {daysBack} days
          </p>
        </div>

        {/* Active Treatments */}
        {includeTreatments && activeTreatments.length > 0 && (
          <div className="mb-6">
            <h3 className="flex items-center gap-2 text-sm font-bold text-tanzanite-800 uppercase tracking-wide mb-3">
              <Pill className="w-4 h-4" /> Current Treatments
            </h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-tanzanite-100">
                  <th className="text-left py-1.5 text-xs text-slate font-medium">Treatment</th>
                  <th className="text-left py-1.5 text-xs text-slate font-medium">Dosage</th>
                  <th className="text-left py-1.5 text-xs text-slate font-medium">Frequency</th>
                  <th className="text-left py-1.5 text-xs text-slate font-medium">Since</th>
                </tr>
              </thead>
              <tbody>
                {activeTreatments.map(t => (
                  <tr key={t.id} className="border-b border-tanzanite-50">
                    <td className="py-1.5 font-medium">{t.treatment_name}</td>
                    <td className="py-1.5 text-slate">{t.dosage || '-'}</td>
                    <td className="py-1.5 text-slate">{t.frequency || '-'}</td>
                    <td className="py-1.5 text-slate">{formatDate(t.date_started)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Symptom Log */}
        {includeSymptoms && filteredSymptoms.length > 0 && (
          <div className="mb-6">
            <h3 className="flex items-center gap-2 text-sm font-bold text-tanzanite-800 uppercase tracking-wide mb-3">
              <Activity className="w-4 h-4" /> Symptom Log ({filteredSymptoms.length} entries)
            </h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-tanzanite-100">
                  <th className="text-left py-1.5 text-xs text-slate font-medium">Date</th>
                  <th className="text-left py-1.5 text-xs text-slate font-medium">Area</th>
                  <th className="text-left py-1.5 text-xs text-slate font-medium">Symptom</th>
                  <th className="text-left py-1.5 text-xs text-slate font-medium">Sev</th>
                  <th className="text-left py-1.5 text-xs text-slate font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredSymptoms.map(s => (
                  <tr key={s.id} className="border-b border-tanzanite-50">
                    <td className="py-1.5">{formatDate(s.date)}</td>
                    <td className="py-1.5 text-slate">{s.body_area}</td>
                    <td className="py-1.5">{s.symptom_type}</td>
                    <td className="py-1.5 font-medium">{s.severity}/5</td>
                    <td className="py-1.5 text-xs text-slate">{s.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Recent Vet Visits */}
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
                  <th className="text-left py-1.5 text-xs text-slate font-medium">Linked To</th>
                </tr>
              </thead>
              <tbody>
                {documents.filter(d => d.vet_visit_id || d.treatment_log_id).map(d => (
                  <tr key={d.id} className="border-b border-tanzanite-50">
                    <td className="py-1.5 font-medium">{d.file_name}</td>
                    <td className="py-1.5 text-slate">{d.category}</td>
                    <td className="py-1.5 text-slate">{d.doc_date ? formatDate(d.doc_date) : '-'}</td>
                    <td className="py-1.5 text-xs text-slate">
                      {d.vet_visits && <span>Visit: {formatDate(d.vet_visits.visit_date)}</span>}
                      {d.treatment_logs && <span>Tx: {d.treatment_logs.treatment_name}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-slate mt-2">Documents available for viewing at whysice.netlify.app/dashboard/documents</p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-tanzanite-100 pt-3 mt-8">
          <p className="text-xs text-slate text-center">
            Generated by Whysice (whysice.netlify.app) - Canine Dermatology Wiki & Health Tracker
          </p>
        </div>
      </div>
    </div>
  )
}
