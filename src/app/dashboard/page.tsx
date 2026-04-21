'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [dogs, setDogs] = useState<Dog[]>([])
  const [activeDog, setActiveDog] = useState<Dog | null>(null)
  const [symptoms, setSymptoms] = useState<SymptomLog[]>([])
  const [treatments, setTreatments] = useState<TreatmentLog[]>([])
  const [vetVisits, setVetVisits] = useState<VetVisit[]>([])
  const [dataLoading, setDataLoading] = useState(false)

  // Auth check - listen for session changes (handles page reload + magic link callback)
  useEffect(() => {
    // First check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
      setAuthLoading(false)
    })

    // Listen for changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
      setAuthLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Load dogs when authenticated
  useEffect(() => {
    if (!user) return
    getDogs().then(data => {
      setDogs(data)
      if (data.length > 0) setActiveDog(data[0])
    })
  }, [user])

  // FIX: Use Promise.allSettled so one failed query doesn't block all data
  useEffect(() => {
    if (!activeDog) return
    setDataLoading(true)
    Promise.allSettled([
      getSymptomLogs(activeDog.id, 10),
      getTreatmentLogs(activeDog.id),
      getVetVisits(activeDog.id),
    ]).then(([symp, treat, visits]) => {
      if (symp.status === 'fulfilled') setSymptoms(symp.value)
      if (treat.status === 'fulfilled') setTreatments(treat.value)
      if (visits.status === 'fulfilled') setVetVisits(visits.value)
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
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-tanzanite-800">Dashboard</h1>
          <p className="text-slate text-sm">Track symptoms, treatments, and vet visits</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Dog Selector */}
          {dogs.length > 1 && (
            <select
              value={activeDog?.id || ''}
              onChange={e => setActiveDog(dogs.find(d => d.id === e.target.value) || null)}
              className="px-3 py-2 rounded-lg border border-tanzanite-100 text-sm bg-white"
              aria-label="Select dog"
            >
              {dogs.map(dog => (
                <option key={dog.id} value={dog.id}>{dog.name}</option>
              ))}
            </select>
          )}
          <Link href="/admin/review" className="text-xs text-tanzanite-400 hover:text-tanzanite-600 px-2 py-1.5">
            Admin
          </Link>
          <button
            onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }}
            className="text-xs text-slate hover:text-red-500 px-2 py-1.5 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* No dogs yet */}
      {dogs.length === 0 && (
        <div className="card text-center py-16">
          <PawPrint className="w-12 h-12 text-tanzanite-200 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-tanzanite-800 mb-2">Add your dog</h2>
          <p className="text-slate mb-6 max-w-sm mx-auto">
            Set up your dog&apos;s profile to start tracking symptoms and treatments.
          </p>
          <Link href="/dashboard/dogs/new" className="btn-primary inline-block">
            <Plus className="w-4 h-4 inline mr-1" /> Add Dog
          </Link>
        </div>
      )}

      {activeDog && (
        <>
          {/* Dog Profile Card */}
          <div className="card mb-8 flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            <div className="w-20 h-20 rounded-full bg-tanzanite-50 flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-tanzanite-100">
              {activeDog.photo_url ? (
                <Image src={activeDog.photo_url} alt={activeDog.name || 'Dog profile photo'} width={80} height={80} className="w-full h-full object-cover" />
              ) : (
                <PawPrint className="w-8 h-8 text-tanzanite-300" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-tanzanite-800 mb-1">{activeDog.name}</h2>
                <Link href={`/dashboard/dogs/new?edit=${activeDog.id}`}
                  className="text-xs text-tanzanite-500 hover:underline flex-shrink-0 mt-1">
                  Edit profile
                </Link>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate">
                {activeDog.breed && <span>{activeDog.breed}</span>}
                {activeDog.dob && <span>{DogAge(activeDog.dob)} years old</span>}
                {activeDog.weight_lbs && <span>{activeDog.weight_lbs} lbs</span>}
              </div>
              {activeDog.known_allergies && activeDog.known_allergies.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-xs text-tanzanite-500 font-medium">Allergies:</span>
                  {activeDog.known_allergies.map((a: string) => (
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
                  <Link href="/dashboard/symptoms" className="btn-secondary text-sm inline-block">
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
                  <Link href="/dashboard/symptoms" className="flex items-center justify-center gap-1 p-2 rounded-lg text-sm text-tanzanite-500 hover:bg-tanzanite-50 transition-colors">
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
                  <Link href="/dashboard/visits" className="btn-secondary text-sm inline-block">
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

            {/* Documents Quick Access */}
            <div className="card lg:col-span-2">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-tanzanite-50">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-tanzanite-500" />
                  <h3 className="font-semibold text-tanzanite-800">Vet Documents</h3>
                </div>
                <Link href="/dashboard/documents" className="text-xs text-tanzanite-500 font-medium hover:underline">
                  View all <ChevronRight className="w-3 h-3 inline" />
                </Link>
              </div>
              <p className="text-sm text-slate mb-3">Upload and view vet records, culture results, prescriptions, and lab reports.</p>
              <Link href="/dashboard/documents" className="btn-secondary text-sm inline-block">
                <FileText className="w-3.5 h-3.5 inline mr-1" /> Manage Documents
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function LoginPrompt() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'magic' | 'password' | 'signup'>('magic')
  const [loading, setLoading] = useState(false)

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    })
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  async function handlePasswordAuth(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      })
      if (error) {
        setError(error.message)
      } else {
        setSent(true)
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        window.location.reload()
      }
    }
    setLoading(false)
  }

  async function handleGoogleLogin() {
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
    if (error) setError(error.message)
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="card text-center">
        <PawPrint className="w-10 h-10 text-tanzanite-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-tanzanite-800 mb-2">Sign in to track</h1>
        <p className="text-sm text-slate mb-6">
          Create a free account to track your dog&apos;s symptoms, treatments, and vet visits.
        </p>

        {sent ? (
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700 font-medium">
              {mode === 'signup' ? 'Check your email to confirm your account.' : 'Check your email for a sign-in link.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Google OAuth */}
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-tanzanite-100 hover:bg-tanzanite-50 transition-colors text-sm font-medium text-body"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-tanzanite-100" />
              <span className="text-xs text-slate">or</span>
              <div className="flex-1 h-px bg-tanzanite-100" />
            </div>

            {/* Mode toggle tabs */}
            <div className="flex bg-tanzanite-50 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => { setMode('magic'); setError(null) }}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                  mode === 'magic' ? 'bg-white text-tanzanite-700 shadow-sm' : 'text-slate hover:text-body'
                }`}
              >
                Magic Link
              </button>
              <button
                type="button"
                onClick={() => { setMode('password'); setError(null) }}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                  mode === 'password' ? 'bg-white text-tanzanite-700 shadow-sm' : 'text-slate hover:text-body'
                }`}
              >
                Password
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(null) }}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                  mode === 'signup' ? 'bg-white text-tanzanite-700 shadow-sm' : 'text-slate hover:text-body'
                }`}
              >
                Sign Up
              </button>
            </div>

            {mode === 'magic' ? (
              <form onSubmit={handleMagicLink} className="space-y-3">
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
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? 'Sending...' : 'Send Magic Link'}
                </button>
              </form>
            ) : (
              <form onSubmit={handlePasswordAuth} className="space-y-3">
                <div>
                  <label htmlFor="email-pw" className="sr-only">Email address</label>
                  <input
                    id="email-pw"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="search-input text-base"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="password" className="sr-only">Password</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Password"
                    className="search-input text-base"
                    required
                    minLength={6}
                  />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? 'Loading...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
                </button>
              </form>
            )}
          </div>
        )}

        <p className="text-xs text-slate mt-6">
          The knowledge base is free to browse without an account.{' '}
          <Link href="/conditions" className="text-tanzanite-500 hover:underline">Browse conditions</Link>
        </p>
      </div>
    </div>
  )
}
