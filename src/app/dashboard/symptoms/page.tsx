'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Activity, X, Trash2, Edit3, Check } from 'lucide-react'
import { supabase, getDogs, getSymptomLogs } from '@/lib/supabase'

const BODY_AREAS = ['Front left paw', 'Front right paw', 'Back left paw', 'Back right paw', 'Ears', 'Face', 'Belly', 'Armpits', 'Back', 'Neck', 'Perianal', 'General']
const SYMPTOM_TYPES = ['Itching', 'Redness', 'Swelling', 'Discharge', 'Cyst/nodule', 'Hair loss', 'Crusting', 'Odor', 'Hot spot', 'Ear infection signs', 'Licking/chewing', 'Other']

type SymptomLog = {
  id: string; date: string; body_area: string; symptom_type: string
  severity: number; photo_urls: string[] | null; notes: string | null; environmental_notes: string | null
}

function SeverityDots({ severity }: { severity: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <span key={i} className={`w-2 h-2 rounded-full ${
          i <= severity ? severity >= 4 ? 'bg-red-400' : severity >= 3 ? 'bg-amber-400' : 'bg-green-400' : 'bg-gray-200'
        }`} />
      ))}
    </div>
  )
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function SymptomsPage() {
  const [dogs, setDogs] = useState<any[]>([])
  const [activeDogId, setActiveDogId] = useState<string>('')
  const [logs, setLogs] = useState<SymptomLog[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

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
      if (data.length > 0) {
        setActiveDogId(data[0].id)
      }
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
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('symptom_logs').delete().eq('id', id)
    if (!error) {
      setLogs(prev => prev.filter(l => l.id !== id))
    }
    setDeleteConfirm(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!activeDogId || !bodyArea || !symptomType) return
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
      }
    } else {
      const { error } = await supabase.from('symptom_logs').insert(payload)
      if (!error) {
        const updated = await getSymptomLogs(activeDogId, 50)
        setLogs(updated)
        resetForm()
        setShowForm(false)
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
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="p-2 rounded-lg hover:bg-tanzanite-50 transition-colors">
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
            {editingId ? 'Edit symptom entry' : 'New symptom entry'}
          </h2>

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-body mb-1">Date</label>
              <input
                id="date" type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-tanzanite-100 text-sm focus:border-tanzanite-500 focus:outline-none focus:ring-1 focus:ring-tanzanite-200"
                required
              />
            </div>
            <div>
              <label htmlFor="severity" className="block text-sm font-medium text-body mb-1">
                Severity: {severity}/5
              </label>
              <input
                id="severity" type="range" min="1" max="5" value={severity}
                onChange={e => setSeverity(Number(e.target.value))}
                className="w-full accent-tanzanite-500 mt-2"
              />
              <div className="flex justify-between text-xs text-slate mt-1">
                <span>Mild</span><span>Severe</span>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="body-area" className="block text-sm font-medium text-body mb-1">Body area</label>
              <select
                id="body-area" value={bodyArea} onChange={e => setBodyArea(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-tanzanite-100 text-sm focus:border-tanzanite-500 focus:outline-none focus:ring-1 focus:ring-tanzanite-200"
                required
              >
                <option value="">Select area...</option>
                {BODY_AREAS.map(area => <option key={area} value={area}>{area}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="symptom-type" className="block text-sm font-medium text-body mb-1">Symptom type</label>
              <select
                id="symptom-type" value={symptomType} onChange={e => setSymptomType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-tanzanite-100 text-sm focus:border-tanzanite-500 focus:outline-none focus:ring-1 focus:ring-tanzanite-200"
                required
              >
                <option value="">Select type...</option>
                {SYMPTOM_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="notes" className="block text-sm font-medium text-body mb-1">Notes</label>
            <textarea
              id="notes" value={notes} onChange={e => setNotes(e.target.value)}
              rows={2} placeholder="What did you observe?"
              className="w-full px-3 py-2 rounded-lg border border-tanzanite-100 text-sm focus:border-tanzanite-500 focus:outline-none focus:ring-1 focus:ring-tanzanite-200 resize-none"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="env-notes" className="block text-sm font-medium text-body mb-1">
              Environmental notes <span className="text-slate font-normal">(optional)</span>
            </label>
            <textarea
              id="env-notes" value={envNotes} onChange={e => setEnvNotes(e.target.value)}
              rows={2} placeholder="Weather, bedding changes, cleaning products, etc."
              className="w-full px-3 py-2 rounded-lg border border-tanzanite-100 text-sm focus:border-tanzanite-500 focus:outline-none focus:ring-1 focus:ring-tanzanite-200 resize-none"
            />
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full sm:w-auto">
            {saving ? 'Saving...' : editingId ? 'Update Entry' : 'Save Entry'}
          </button>
        </form>
      )}

      {Object.keys(grouped).length === 0 ? (
        <div className="card text-center py-12">
          <Activity className="w-10 h-10 text-tanzanite-200 mx-auto mb-3" />
          <p className="text-slate text-sm">No symptoms logged yet. Start tracking to identify patterns.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, entries]) => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-tanzanite-500 mb-2">{formatDate(date)}</h3>
              <div className="space-y-2">
                {entries.map(entry => (
                  <div key={entry.id} className="card py-3 px-4 group">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-body">{entry.symptom_type}</span>
                        <span className="text-xs text-slate">({entry.body_area})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <SeverityDots severity={entry.severity} />
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                          <button
                            onClick={() => startEdit(entry)}
                            className="p-1 rounded hover:bg-tanzanite-50 text-slate hover:text-tanzanite-600 transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {deleteConfirm === entry.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(entry.id)}
                                className="p-1 rounded bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                title="Confirm delete"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="p-1 rounded hover:bg-gray-100 text-slate transition-colors"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(entry.id)}
                              className="p-1 rounded hover:bg-red-50 text-slate hover:text-red-500 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    {entry.notes && <p className="text-xs text-slate">{entry.notes}</p>}
                    {entry.environmental_notes && (
                      <p className="text-xs text-tanzanite-400 mt-1">Env: {entry.environmental_notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
