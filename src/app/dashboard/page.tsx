'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PawPrint, Activity, Pill, Calendar, FileText, Plus, ChevronRight, AlertCircle, TrendingUp } from 'lucide-react'
import { supabase, getDogs, getSymptomLogs, getTreatmentLogs, getVetVisits } from '@/lib/supabase'

type Dog = {
  id: string; name: string; breed: string | null; dob: string | null
  weight_lbs: number | null; known_allergies: string[] | null; photo_url: string | null
}

type SymptomLog = {
  id: string; date: string; body_area: string; symptom_type: string; severity: number; notes: string | null
}

type TreatmentLog = {
  id: string; treatment_name: string; date_started: string; date_ended: string | null
  dosage: string | null; frequency: string | null; effectiveness: number | null
  medications: { name: string; slug: string; brand_names: string[] } | null
}

type VetVisit = {
  id: string; visit_date: string; vet_name: string | null; reason: string
  diagnosis: string | null; follow_up_date: string | null
}

function SeverityDots({ severity }: { severity: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <span key={i} className={`w-2 h-2 rounded-full ${
          i <= severity
            ? severity >= 4 ? 'bg-red-400' : severity >= 3 ? 'bg-amber-400' : 'bg-green-400'
            : 'bg-gray-200'
        }`} />
      ))}
    </div>
  )
}

function EffectivenessDots({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-xs text-slate">Not rated</span>
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <span key={i} className={`w-2 h-2 rounded-full ${i <= rating ? 'bg-tanzanite-400' : 'bg-gray-200'}`} />
      ))}
    </div>
  )
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function DogAge(dob: string | null) {
  if (!dob) return null
  const birth = new Date(dob)
  const now = new Date()
  const years = Math.floor((now.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
  return years
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [dogs, setDogs] = useState<Dog[]>([])
  const [activeDog, setActiveDog] = useState<Dog | null>(null)
  const [symptoms, setSymptoms] = useState<SymptomLog[]>([])
  const [treatments, setTreatments] = useState<TreatmentLog[]>([])
  const [vetVisits, setVetVisits] = useState<VetVisit[]>([])
  const [dataLoading, setDataLoading] = useState(false)

  // Auth check
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setAuthLoading(false)
    })
  }, [])

  // Load dogs when authenticated
  useEffect(() => {
    if (!user) return
    getDogs().then(data => {
      setDogs(data)
      if (data.length > 0) setActiveDog(data[0])
    })
  }, [user])

  // Load data for active dog
  useEffect(() => {
    if (!activeDog) return
    setDataLoading(true)
    Promise.all([
      getSymptomLogs(activeDog.id, 10),
      getTreatmentLogs(activeDog.id),
      getVetVisits(activeDog.id),
    ]).then(([symp, treat, visits]) => {
      setSymptoms(symp)
      setTreatments(treat)
      setVetVisits(visits)
      setDataLoading(false)
    })
  }, [activeDog])

  // Auth gate
  if (authLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-tanzanite-50 rounded w-1/4" />
          <div className="h-48 bg-tanzanite-50 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginPrompt />
  }

  const activeTreatments = treatments.filter(t => !t.date_ended)
  const recentSymptoms = symptoms.slice(0, 5)
  const upcomingVisit = vetVisits.find(v => new Date(v.visit_date) >= new Date())
  const avgSeverity = symptoms.length > 0
    ? (symptoms.reduce((sum, s) => sum + s.severity, 0) / symptoms.length).toFixed(1)
    : null

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-tanzanite-800">Dashboard</h1>
          <p className="text-slate text-sm">Track symptoms, treatments, and vet visits</p>
        </div>

        {/* Dog Selector */}
        {dogs.length > 1 && (
          <select
            value={activeDog?.id || ''}
            onChange={e => setActiveDog(dogs.find(d => d.id === e.target.value) || null)}
            className="px-4 py-2 rounded-lg border border-tanzanite-100 text-sm bg-white"
            aria-label="Select dog"
          >
            {dogs.map(dog => (
              <option key={dog.id} value={dog.id}>{dog.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* No dogs yet */}
      {dogs.length === 0 && (
        <div className="card text-center py-16">
          <PawPrint className="w-12 h-12 text-tanzanite-200 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-tanzanite-800 mb-2">Add your dog</h2>
          <p className="text-slate mb-6 max-w-sm mx-auto">
            Set up your dog's profile to start tracking symptoms and treatments.
          </p>
          <Link href="/dashboard/dogs/new" className="btn-primary inline-block">
            <Plus className="w-4 h-4 inline mr-1" /> Add Dog
          </Link>
        </div>
      )}

      {activeDog && (
        <>
          {/* Dog Profile Card */}
          <div className="card mb-8 flex flex-col sm:flex-row items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-tanzanite-50 flex items-center justify-center flex-shrink-0">
              {activeDog.photo_url ? (
                <img src={activeDog.photo_url} alt={activeDog.name} className="w-20 h-20 rounded-full object-cover" />
              ) : (
                <PawPrint className="w-8 h-8 text-tanzanite-300" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-tanzanite-800 mb-1">{activeDog.name}</h2>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate">
                {activeDog.breed && <span>{activeDog.breed}</span>}
                {activeDog.dob && <span>{DogAge(activeDog.dob)} years old</span>}
                {activeDog.weight_lbs && <span>{activeDog.weight_lbs} lbs</span>}
              </div>
              {activeDog.known_allergies && activeDog.known_allergies.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-xs text-tanzanite-500 font-medium">Allergies:</span>
                  {activeDog.known_allergies.map(a => (
                    <span key={a} className="badge bg-red-50 text-red-600 text-xs">{a}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="card text-center py-4">
              <Activity className="w-5 h-5 text-tanzanite-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-tanzanite-800">{symptoms.length}</p>
              <p className="text-xs text-slate">Symptom entries</p>
            </div>
            <div className="card text-center py-4">
              <Pill className="w-5 h-5 text-ice-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-tanzanite-800">{activeTreatments.length}</p>
              <p className="text-xs text-slate">Active treatments</p>
            </div>
            <div className="card text-center py-4">
              <TrendingUp className="w-5 h-5 text-tanzanite-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-tanzanite-800">{avgSeverity || '--'}</p>
              <p className="text-xs text-slate">Avg severity</p>
            </div>
            <div className="card text-center py-4">
              <Calendar className="w-5 h-5 text-ice-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-tanzanite-800">{vetVisits.length}</p>
              <p className="text-xs text-slate">Vet visits</p>
            </div>
          </div>

          {/* Upcoming Visit Alert */}
          {upcomingVisit && (
            <div className="card border-l-4 border-l-tanzanite-500 mb-8 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-tanzanite-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-tanzanite-800">
                  Upcoming vet visit: {formatDate(upcomingVisit.visit_date)}
                </p>
                <p className="text-xs text-slate">
                  {upcomingVisit.vet_name && `${upcomingVisit.vet_name} - `}{upcomingVisit.reason}
                </p>
                <Link href="/dashboard/vet-prep" className="text-xs text-tanzanite-500 font-medium hover:underline mt-1 inline-block">
                  Generate vet prep report <ChevronRight className="w-3 h-3 inline" />
                </Link>
              </div>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Symptoms */}
            <div className="card">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-tanzanite-50">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-tanzanite-500" />
                  <h3 className="font-semibold text-tanzanite-800">Recent Symptoms</h3>
                </div>
                <Link href="/dashboard/symptoms" className="text-xs text-tanzanite-500 font-medium hover:underline">
                  View all <ChevronRight className="w-3 h-3 inline" />
                </Link>
              </div>

              {recentSymptoms.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-slate mb-3">No symptoms logged yet.</p>
                  <Link href="/dashboard/symptoms/new" className="btn-secondary text-sm inline-block">
                    <Plus className="w-3.5 h-3.5 inline mr-1" /> Log Symptom
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentSymptoms.map(s => (
                    <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-tanzanite-50/30">
                      <div className="text-center flex-shrink-0 w-12">
                        <p className="text-xs text-slate">{formatDate(s.date).split(',')[0]}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-body truncate">
                          {s.symptom_type} - {s.body_area}
                        </p>
                        {s.notes && <p className="text-xs text-slate truncate">{s.notes}</p>}
                      </div>
                      <SeverityDots severity={s.severity} />
                    </div>
                  ))}
                  <Link href="/dashboard/symptoms/new" className="flex items-center justify-center gap-1 p-2 rounded-lg text-sm text-tanzanite-500 hover:bg-tanzanite-50 transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Log new symptom
                  </Link>
                </div>
              )}
            </div>

            {/* Active Treatments */}
            <div className="card">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-tanzanite-50">
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-ice-500" />
                  <h3 className="font-semibold text-tanzanite-800">Active Treatments</h3>
                </div>
                <Link href="/dashboard/treatments" className="text-xs text-tanzanite-500 font-medium hover:underline">
                  View all <ChevronRight className="w-3 h-3 inline" />
                </Link>
              </div>

              {activeTreatments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-slate mb-3">No active treatments.</p>
                  <Link href="/dashboard/treatments/new" className="btn-secondary text-sm inline-block">
                    <Plus className="w-3.5 h-3.5 inline mr-1" /> Add Treatment
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeTreatments.map(t => (
                    <div key={t.id} className="p-3 rounded-lg bg-ice-50/30">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-body">{t.treatment_name}</p>
                        <EffectivenessDots rating={t.effectiveness} />
                      </div>
                      <div className="flex flex-wrap gap-x-3 text-xs text-slate">
                        {t.dosage && <span>{t.dosage}</span>}
                        {t.frequency && <span>{t.frequency}</span>}
                        <span>Since {formatDate(t.date_started)}</span>
                      </div>
                      {t.medications && (
                        <Link
                          href={`/medications/${t.medications.slug}`}
                          className="text-xs text-tanzanite-500 hover:underline mt-1 inline-block"
                        >
                          Wiki: {t.medications.brand_names?.[0] || t.medications.name}
                        </Link>
                      )}
                    </div>
                  ))}
                  <Link href="/dashboard/treatments/new" className="flex items-center justify-center gap-1 p-2 rounded-lg text-sm text-tanzanite-500 hover:bg-tanzanite-50 transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Add treatment
                  </Link>
                </div>
              )}
            </div>

            {/* Recent Vet Visits */}
            <div className="card lg:col-span-2">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-tanzanite-50">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-tanzanite-500" />
                  <h3 className="font-semibold text-tanzanite-800">Vet Visits</h3>
                </div>
                <div className="flex gap-3">
                  <Link href="/dashboard/vet-prep" className="text-xs text-ice-600 font-medium hover:underline flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Vet Prep
                  </Link>
                  <Link href="/dashboard/visits" className="text-xs text-tanzanite-500 font-medium hover:underline">
                    View all <ChevronRight className="w-3 h-3 inline" />
                  </Link>
                </div>
              </div>

              {vetVisits.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-slate mb-3">No vet visits recorded yet.</p>
                  <Link href="/dashboard/visits/new" className="btn-secondary text-sm inline-block">
                    <Plus className="w-3.5 h-3.5 inline mr-1" /> Add Visit
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {vetVisits.slice(0, 5).map(v => (
                    <div key={v.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-tanzanite-50/30">
                      <div className="text-center flex-shrink-0 w-16">
                        <p className="text-sm font-medium text-tanzanite-800">{formatDate(v.visit_date)}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-body">{v.reason}</p>
                        <div className="flex gap-x-3 text-xs text-slate mt-0.5">
                          {v.vet_name && <span>{v.vet_name}</span>}
                          {v.diagnosis && <span>Dx: {v.diagnosis}</span>}
                        </div>
                        {v.follow_up_date && (
                          <p className="text-xs text-tanzanite-500 mt-1">
                            Follow-up: {formatDate(v.follow_up_date)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function LoginPrompt() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    })
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="card text-center">
        <PawPrint className="w-10 h-10 text-tanzanite-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-tanzanite-800 mb-2">Sign in to track</h1>
        <p className="text-sm text-slate mb-6">
          Create a free account to track your dog's symptoms, treatments, and vet visits.
        </p>

        {sent ? (
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700 font-medium">Check your email for a sign-in link.</p>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="search-input text-base"
                required
                aria-describedby={error ? 'login-error' : undefined}
              />
            </div>
            {error && <p id="login-error" className="text-sm text-red-600">{error}</p>}
            <button type="submit" className="btn-primary w-full">
              Send Magic Link
            </button>
          </form>
        )}

        <p className="text-xs text-slate mt-6">
          The knowledge base is free to browse without an account.{' '}
          <Link href="/conditions" className="text-tanzanite-500 hover:underline">Browse conditions</Link>
        </p>
      </div>
    </div>
  )
}
