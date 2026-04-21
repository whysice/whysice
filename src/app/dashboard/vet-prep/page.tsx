'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, FileText, Activity, Pill, Calendar, PawPrint, Paperclip, TrendingUp, TrendingDown, Minus, Bell } from 'lucide-react'
import { getDogs, getSymptomLogs, getTreatmentLogs, getVetVisits, getDocuments } from '@/lib/supabase'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { VetPrepExport } from '@/components/VetPrepExport'
import { SeverityBadge } from '@/components/SeverityPicker'

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function topCount(values: string[]): { value: string; count: number } | null {
  if (values.length === 0) return null
  const counts = values.reduce<Record<string, number>>((acc, v) => {
    acc[v] = (acc[v] || 0) + 1
    return acc
  }, {})
  const [value, count] = Object.entries(counts).sort(([, a], [, b]) => b - a)[0]
  return { value, count }
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
  const [includePhotos, setIncludePhotos] = useState(true)

  const reportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getDogs().then(data => {
      setDogs(data ?? [])
      if (data && data.length > 0) {
        setActiveDogId(data[0].id)
        setActiveDog(data[0])
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!activeDogId) return
    setActiveDog(dogs.find(d => d.id === activeDogId) || null)
    Promise.allSettled([
      getSymptomLogs(activeDogId, 100),
      getTreatmentLogs(activeDogId),
      getVetVisits(activeDogId),
      getDocuments(activeDogId),
    ]).then(([s, t, v, d]) => {
      setSymptoms(s.status === 'fulfilled' ? (s.value ?? []) : [])
      setTreatments(t.status === 'fulfilled' ? (t.value ?? []) : [])
      setVetVisits(v.status === 'fulfilled' ? (v.value ?? []) : [])
      setDocuments(d.status === 'fulfilled' ? (d.value ?? []) : [])
    })
  }, [activeDogId, dogs])

  const now = new Date()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - daysBack)
  const cutoffStr = cutoff.toISOString().split('T')[0]
  const todayStr = now.toISOString().split('T')[0]
  const today = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  // Symptoms within the window
  const filteredSymptoms = symptoms.filter(s => s.date >= cutoffStr)

  // Symptom trend: compare first half vs second half of window
  const midDate = new Date(cutoff)
  midDate.setDate(midDate.getDate() + Math.floor(daysBack / 2))
  const midStr = midDate.toISOString().split('T')[0]
  const olderHalf = filteredSymptoms.filter(s => s.date < midStr)
  const newerHalf = filteredSymptoms.filter(s => s.date >= midStr)
  const avg = (arr: any[]) => arr.length > 0 ? arr.reduce((sum, s) => sum + s.severity, 0) / arr.length : null
  const avgOlder = avg(olderHalf)
  const avgNewer = avg(newerHalf)
  const avgAll = avg(filteredSymptoms)
  const trendDelta = (avgNewer != null && avgOlder != null) ? avgNewer - avgOlder : null
  const trendDirection =
    trendDelta == null ? 'n/a' :
    trendDelta > 0.5 ? 'worsening' :
    trendDelta < -0.5 ? 'improving' :
    'stable'
  const topArea = topCount(filteredSymptoms.map(s => s.body_area))
  const topType = topCount(filteredSymptoms.map(s => s.symptom_type))

  // Treatments: active OR ended within the window
  const relevantTreatments = treatments
    .filter(t => !t.date_ended || t.date_ended >= cutoffStr)
    .sort((a, b) => {
      // Active first, then most recently ended
      if (!a.date_ended && b.date_ended) return -1
      if (a.date_ended && !b.date_ended) return 1
      if (!a.date_ended && !b.date_ended) {
        return (b.date_started || '').localeCompare(a.date_started || '')
      }
      return (b.date_ended || '').localeCompare(a.date_ended || '')
    })
  const activeTreatments = relevantTreatments.filter(t => !t.date_ended)
  const endedTreatments = relevantTreatments.filter(t => t.date_ended)

  // "Currently on" summary line
  const currentMedsSummary = activeTreatments
    .map(t => {
      const parts = [t.dosage, t.frequency].filter(Boolean).join(' ')
      return parts ? `${t.treatment_name} (${parts})` : t.treatment_name
    })
    .join(' · ')

  // Vet visits in window + upcoming follow-ups (future)
  const recentVisits = vetVisits.filter(v => v.visit_date >= cutoffStr)
  const upcomingFollowups = vetVisits
    .filter(v => v.follow_up_date && v.follow_up_date >= todayStr)
    .sort((a, b) => a.follow_up_date.localeCompare(b.follow_up_date))

  // Documents: linked AND within window (by doc_date or created_at)
  const filteredDocs = documents.filter(d => {
    if (!d.vet_visit_id && !d.treatment_log_id) return false
    const docDateStr = d.doc_date || (d.created_at ? d.created_at.split('T')[0] : null)
    if (!docDateStr) return true // include if we can't tell
    return docDateStr >= cutoffStr
  })

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

  const TrendIcon = trendDirection === 'worsening' ? TrendingUp : trendDirection === 'improving' ? TrendingDown : Minus
  const trendColor =
    trendDirection === 'worsening' ? 'text-red-600' :
    trendDirection === 'improving' ? 'text-green-600' :
    'text-slate'

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
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={includePhotos} onChange={e => setIncludePhotos(e.target.checked)}
                className="rounded border-tanzanite-300 text-tanzanite-500 focus:ring-tanzanite-200" />
              Symptom Photos
            </label>
          </div>
        </div>

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
          <div className="mb-4 p-3 bg-tanzanite-50/50 rounded-lg">
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

        {/* At-a-glance summary */}
        {includeTreatments && currentMedsSummary && (
          <div className="mb-3 p-3 rounded-lg bg-ice-50 border border-ice-100">
            <p className="text-xs uppercase tracking-wide font-semibold text-ice-700 mb-1">Currently on</p>
            <p className="text-sm text-body">{currentMedsSummary}</p>
          </div>
        )}

        {/* Upcoming follow-ups */}
        {includeVisits && upcomingFollowups.length > 0 && (
          <div className="mb-6 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-xs uppercase tracking-wide font-semibold text-amber-800 mb-1 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5" /> Upcoming follow-up{upcomingFollowups.length > 1 ? 's' : ''}
            </p>
            {upcomingFollowups.map(v => (
              <p key={v.id} className="text-sm text-body">
                <span className="font-medium">{formatDate(v.follow_up_date)}</span>
                {v.vet_name && <span className="text-slate"> — {v.vet_name}</span>}
                {v.reason && <span className="text-slate"> ({v.reason})</span>}
              </p>
            ))}
          </div>
        )}

        {/* Symptoms */}
        {includeSymptoms && (
          <div className="mb-6">
            <h3 className="flex items-center gap-2 text-sm font-bold text-tanzanite-800 uppercase tracking-wide mb-3">
              <Activity className="w-4 h-4" /> Symptoms ({filteredSymptoms.length})
            </h3>

            {filteredSymptoms.length === 0 ? (
              <p className="text-sm text-slate italic">No symptoms logged in this window.</p>
            ) : (
              <>
                {/* Trend summary */}
                {avgAll != null && (
                  <div className="mb-3 p-3 rounded-lg bg-tanzanite-50/50 text-sm">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span>
                        <span className="text-xs text-slate">Avg severity:</span>{' '}
                        <span className="font-medium">{avgAll.toFixed(1)}/5</span>
                      </span>
                      {trendDelta != null && (
                        <span className={`inline-flex items-center gap-1 ${trendColor}`}>
                          <TrendIcon className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium capitalize">{trendDirection}</span>
                          <span className="text-xs text-slate">
                            ({avgOlder!.toFixed(1)} → {avgNewer!.toFixed(1)})
                          </span>
                        </span>
                      )}
                      {topArea && (
                        <span className="text-xs">
                          <span className="text-slate">Most affected:</span>{' '}
                          <span className="font-medium">{topArea.value}</span>
                          <span className="text-slate"> ({topArea.count}×)</span>
                        </span>
                      )}
                      {topType && (
                        <span className="text-xs">
                          <span className="text-slate">Most common:</span>{' '}
                          <span className="font-medium">{topType.value}</span>
                          <span className="text-slate"> ({topType.count}×)</span>
                        </span>
                      )}
                    </div>
                  </div>
                )}

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
                      <tr key={s.id} className="border-b border-tanzanite-50 align-top">
                        <td className="py-1.5">{formatDate(s.date)}</td>
                        <td className="py-1.5">{s.symptom_type}</td>
                        <td className="py-1.5 text-slate">{s.body_area}</td>
                        <td className="py-1.5"><SeverityBadge severity={s.severity} /></td>
                        <td className="py-1.5 text-xs text-slate">
                          {s.notes && <div>{s.notes}</div>}
                          {s.environmental_notes && (
                            <div className="mt-0.5 text-tanzanite-600">
                              <span className="font-medium">Context:</span> {s.environmental_notes}
                            </div>
                          )}
                          {includePhotos && s.photo_urls && s.photo_urls.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {s.photo_urls.map((url: string, i: number) => (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  key={i}
                                  src={url}
                                  alt={`${s.symptom_type} on ${s.date}`}
                                  className="w-12 h-12 object-cover rounded border border-tanzanite-100"
                                />
                              ))}
                            </div>
                          )}
                          {!s.notes && !s.environmental_notes && (!s.photo_urls || s.photo_urls.length === 0) && '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
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
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{t.treatment_name}</p>
                  {t.effectiveness != null && (
                    <span className="text-xs text-slate">Effectiveness: {t.effectiveness}/5</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-3 text-xs text-slate">
                  {t.dosage && <span>{t.dosage}</span>}
                  {t.frequency && <span>{t.frequency}</span>}
                  <span>Since {formatDate(t.date_started)}</span>
                </div>
                {t.side_effects_observed && <p className="text-xs text-amber-700 mt-0.5"><span className="font-medium">Side effects:</span> {t.side_effects_observed}</p>}
                {t.notes && <p className="text-xs text-slate mt-0.5">{t.notes}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Recently Discontinued Treatments */}
        {includeTreatments && endedTreatments.length > 0 && (
          <div className="mb-6">
            <h3 className="flex items-center gap-2 text-sm font-bold text-tanzanite-800 uppercase tracking-wide mb-3">
              <Pill className="w-4 h-4" /> Recently Ended ({endedTreatments.length})
            </h3>
            {endedTreatments.map(t => (
              <div key={t.id} className="mb-3 pb-3 border-b border-tanzanite-50 last:border-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{t.treatment_name}</p>
                  {t.effectiveness != null && (
                    <span className="text-xs text-slate">Effectiveness: {t.effectiveness}/5</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-3 text-xs text-slate">
                  {t.dosage && <span>{t.dosage}</span>}
                  {t.frequency && <span>{t.frequency}</span>}
                  <span>{formatDate(t.date_started)} → {formatDate(t.date_ended)}</span>
                </div>
                {t.side_effects_observed && <p className="text-xs text-amber-700 mt-0.5"><span className="font-medium">Side effects:</span> {t.side_effects_observed}</p>}
                {t.notes && <p className="text-xs text-slate mt-0.5">{t.notes}</p>}
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
                {v.follow_up_date && <p className="text-xs text-slate">Follow-up: {formatDate(v.follow_up_date)}</p>}
                {v.notes && <p className="text-xs text-slate">{v.notes}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Linked Documents */}
        {includeDocs && filteredDocs.length > 0 && (
          <div className="mb-6">
            <h3 className="flex items-center gap-2 text-sm font-bold text-tanzanite-800 uppercase tracking-wide mb-3">
              <Paperclip className="w-4 h-4" /> Linked Documents ({filteredDocs.length})
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
                {filteredDocs.map(d => (
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
