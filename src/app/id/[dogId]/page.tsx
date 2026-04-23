'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, AlertCircle, Copy, Check, Link as LinkIcon, Share2, RotateCcw, X, Fingerprint, Stethoscope, Phone, Syringe, Calendar,
} from 'lucide-react'
import {
  supabase, getDogForId, updateDogIdFields, generateShareToken, revokeShare, getTreatmentLogs,
  type DogForId, type DogIdFields,
} from '@/lib/supabase'
import { LoginPrompt } from '@/components/LoginPrompt'
import { IdCard, type IdCardTreatment } from '@/components/IdCard'

type Treatment = {
  treatment_name: string
  dosage: string | null
  frequency: string | null
  date_ended: string | null
  medications: { name: string } | null
}

const EXPIRY_OPTIONS = [
  { label: 'Never', days: null },
  { label: '24 hours', days: 1 },
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
] as const

function formatExpiry(iso: string | null): string {
  if (!iso) return 'No expiry'
  const d = new Date(iso)
  if (d.getTime() < Date.now()) return 'Expired'
  return `Expires ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
}

export default function IdOwnerPage() {
  const params = useParams<{ dogId: string }>()
  const router = useRouter()
  const dogId = params?.dogId as string

  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [dog, setDog] = useState<DogForId | null>(null)
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [revoking, setRevoking] = useState(false)
  const [copied, setCopied] = useState(false)
  const [expiry, setExpiry] = useState<typeof EXPIRY_OPTIONS[number]['days']>(null)
  const [origin, setOrigin] = useState('')

  const [form, setForm] = useState<DogIdFields>({
    microchip_id: null,
    emergency_contact_name: null,
    emergency_contact_phone: null,
    primary_vet_name: null,
    primary_vet_phone: null,
  })

  useEffect(() => { if (typeof window !== 'undefined') setOrigin(window.location.origin) }, [])

  // Auth
  useEffect(() => {
    let resolved = false
    supabase.auth.getSession()
      .then(({ data: { session } }) => { resolved = true; setUser(session?.user || null); setAuthLoading(false) })
      .catch(() => { resolved = true; setUser(null); setAuthLoading(false) })
    const fallback = setTimeout(() => { if (!resolved) setAuthLoading(false) }, 5000)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setUser(s?.user || null); setAuthLoading(false)
    })
    return () => { clearTimeout(fallback); subscription.unsubscribe() }
  }, [])

  // Load dog + active treatments
  useEffect(() => {
    if (!user || !dogId) return
    let cancelled = false
    setLoading(true)
    setLoadError(null)
    Promise.all([getDogForId(dogId), getTreatmentLogs(dogId)])
      .then(([dogData, treatmentData]) => {
        if (cancelled) return
        if (!dogData) {
          setLoadError('This pet doesn’t exist or isn’t yours.')
          setLoading(false)
          return
        }
        setDog(dogData)
        setForm({
          microchip_id: dogData.microchip_id,
          emergency_contact_name: dogData.emergency_contact_name,
          emergency_contact_phone: dogData.emergency_contact_phone,
          primary_vet_name: dogData.primary_vet_name,
          primary_vet_phone: dogData.primary_vet_phone,
        })
        setTreatments((treatmentData ?? []) as Treatment[])
        setLoading(false)
      })
      .catch(err => {
        if (cancelled) return
        setLoadError(err?.message || 'Failed to load pet.')
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [user, dogId])

  const activeTreatments: IdCardTreatment[] = useMemo(() =>
    treatments
      .filter(t => !t.date_ended)
      .map(t => ({
        treatment_name: t.treatment_name,
        dosage: t.dosage,
        frequency: t.frequency,
        medication_name: t.medications?.name ?? null,
      }))
  , [treatments])

  const shareUrl = dog?.share_token && origin
    ? `${origin}/id/share/${dog.share_token}`
    : null

  const isExpired = dog?.share_expires_at
    ? new Date(dog.share_expires_at).getTime() < Date.now()
    : false

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!dog) return
    setSaving(true)
    setLoadError(null)
    try {
      const updated = await updateDogIdFields(dog.id, {
        microchip_id: form.microchip_id?.trim() || null,
        emergency_contact_name: form.emergency_contact_name?.trim() || null,
        emergency_contact_phone: form.emergency_contact_phone?.trim() || null,
        primary_vet_name: form.primary_vet_name?.trim() || null,
        primary_vet_phone: form.primary_vet_phone?.trim() || null,
      })
      setDog(updated)
    } catch (err: any) {
      setLoadError(err?.message || 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  async function handleGenerate() {
    if (!dog) return
    setSharing(true)
    setLoadError(null)
    try {
      const expiresAt = expiry
        ? new Date(Date.now() + expiry * 24 * 60 * 60 * 1000)
        : null
      const updated = await generateShareToken(dog.id, expiresAt)
      setDog({ ...dog, ...updated })
    } catch (err: any) {
      setLoadError(err?.message || 'Failed to generate share link.')
    } finally {
      setSharing(false)
    }
  }

  async function handleRevoke() {
    if (!dog) return
    if (!confirm('Revoke the share link? Anyone with the current URL will lose access.')) return
    setRevoking(true)
    try {
      await revokeShare(dog.id)
      setDog({ ...dog, share_token: null, share_expires_at: null })
    } catch (err: any) {
      setLoadError(err?.message || 'Failed to revoke.')
    } finally {
      setRevoking(false)
    }
  }

  async function handleCopy() {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-tanzanite-50 rounded w-1/4" />
          <div className="h-48 bg-tanzanite-50 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <LoginPrompt
        title="Sign in to open this ID"
        description="The ID you&rsquo;re opening belongs to an account. Sign in to continue."
        redirectTo={`/id/${dogId}`}
      />
    )
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-tanzanite-50 rounded w-1/4" />
          <div className="h-48 bg-tanzanite-50 rounded-xl" />
          <div className="h-32 bg-tanzanite-50 rounded-xl" />
        </div>
      </div>
    )
  }

  if (loadError && !dog) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-tanzanite-800 mb-2">Can’t open this ID</h1>
        <p className="text-sm text-slate mb-6">{loadError}</p>
        <Link href="/id" className="btn-secondary inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to your pets
        </Link>
      </div>
    )
  }

  if (!dog) return null

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <nav className="flex items-center gap-2 text-sm text-slate">
        <Link href="/id" className="hover:text-tanzanite-500 transition-colors inline-flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Your pets
        </Link>
        <span className="text-tanzanite-200">·</span>
        <span className="inline-flex items-center gap-1 text-tanzanite-600">
          <Fingerprint className="w-3.5 h-3.5" /> ID
        </span>
      </nav>

      {loadError && (
        <div className="card border-l-4 border-l-red-400 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-body flex-1">{loadError}</p>
          <button onClick={() => setLoadError(null)} className="text-slate hover:text-body">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Preview */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold tracking-wider uppercase text-tanzanite-500">Preview</h2>
          <span className="text-xs text-slate">This is what someone you share with sees.</span>
        </div>
        <IdCard dog={dog} activeTreatments={activeTreatments} />
      </section>

      {/* Edit fields */}
      <section>
        <h2 className="text-sm font-bold tracking-wider uppercase text-tanzanite-500 mb-3">ID details</h2>
        <form onSubmit={handleSave} className="card space-y-4">
          <p className="text-xs text-slate -mt-1">
            Name, breed, age, weight, and photo come from the tracker —{' '}
            <Link href={`/dashboard/dogs/new?edit=${dog.id}`} className="text-tanzanite-500 hover:underline">edit profile</Link>.
          </p>

          <div>
            <label className="block text-[10px] font-bold tracking-widest uppercase text-tanzanite-500 mb-1">
              <Syringe className="w-3 h-3 inline mr-1" /> Microchip ID
            </label>
            <input
              type="text"
              value={form.microchip_id ?? ''}
              onChange={e => setForm({ ...form, microchip_id: e.target.value })}
              placeholder="15-digit microchip number"
              className="search-input"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase text-tanzanite-500 mb-1">
                <Phone className="w-3 h-3 inline mr-1" /> Emergency contact name
              </label>
              <input
                type="text"
                value={form.emergency_contact_name ?? ''}
                onChange={e => setForm({ ...form, emergency_contact_name: e.target.value })}
                placeholder="e.g. Jane Smith"
                className="search-input"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase text-tanzanite-500 mb-1">Emergency contact phone</label>
              <input
                type="tel"
                value={form.emergency_contact_phone ?? ''}
                onChange={e => setForm({ ...form, emergency_contact_phone: e.target.value })}
                placeholder="e.g. (555) 123-4567"
                className="search-input"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase text-tanzanite-500 mb-1">
                <Stethoscope className="w-3 h-3 inline mr-1" /> Primary vet name
              </label>
              <input
                type="text"
                value={form.primary_vet_name ?? ''}
                onChange={e => setForm({ ...form, primary_vet_name: e.target.value })}
                placeholder="Clinic or vet name"
                className="search-input"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase text-tanzanite-500 mb-1">Primary vet phone</label>
              <input
                type="tel"
                value={form.primary_vet_phone ?? ''}
                onChange={e => setForm({ ...form, primary_vet_phone: e.target.value })}
                placeholder="Clinic phone"
                className="search-input"
              />
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button type="submit" disabled={saving} className="btn-primary inline-flex items-center gap-2">
              {saving ? 'Saving…' : 'Save ID details'}
            </button>
          </div>
        </form>
      </section>

      {/* Share panel */}
      <section>
        <h2 className="text-sm font-bold tracking-wider uppercase text-tanzanite-500 mb-3">Share</h2>
        <div className="card space-y-4">
          {!dog.share_token || isExpired ? (
            <>
              {isExpired && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  The previous link expired. Generate a new one to share again.
                </p>
              )}
              <p className="text-sm text-slate">
                Create a read-only link to hand to a boarder, new clinic, or emergency vet. They won&apos;t need an account.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-slate" />
                  <span className="text-slate">Expires in:</span>
                  <select
                    value={String(expiry ?? 'never')}
                    onChange={e => setExpiry(e.target.value === 'never' ? null : Number(e.target.value) as any)}
                    className="px-2 py-1 rounded border border-tanzanite-100 text-sm bg-white"
                  >
                    {EXPIRY_OPTIONS.map(o => (
                      <option key={o.label} value={String(o.days ?? 'never')}>{o.label}</option>
                    ))}
                  </select>
                </label>
                <button
                  onClick={handleGenerate}
                  disabled={sharing}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  {sharing ? 'Generating…' : 'Generate share link'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-tanzanite-500 mb-1">
                    <LinkIcon className="w-3 h-3 inline mr-1" /> Share link
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={shareUrl ?? ''}
                      readOnly
                      className="search-input font-mono text-xs"
                      onFocus={e => e.target.select()}
                    />
                    <button
                      onClick={handleCopy}
                      className="btn-secondary inline-flex items-center gap-1.5 flex-shrink-0"
                      aria-label="Copy share link"
                    >
                      {copied ? <><Check className="w-4 h-4" /> Copied</> : <><Copy className="w-4 h-4" /> Copy</>}
                    </button>
                  </div>
                  <p className="text-xs text-slate mt-1.5">{formatExpiry(dog.share_expires_at)}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-tanzanite-50">
                <button
                  onClick={handleGenerate}
                  disabled={sharing}
                  className="text-xs text-tanzanite-500 hover:text-tanzanite-700 inline-flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> {sharing ? 'Rotating…' : 'Rotate link'}
                </button>
                <span className="text-slate text-xs">·</span>
                <button
                  onClick={handleRevoke}
                  disabled={revoking}
                  className="text-xs text-red-500 hover:text-red-700 inline-flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" /> {revoking ? 'Revoking…' : 'Revoke link'}
                </button>
                <label className="ml-auto flex items-center gap-2 text-xs text-slate">
                  Next rotation expiry:
                  <select
                    value={String(expiry ?? 'never')}
                    onChange={e => setExpiry(e.target.value === 'never' ? null : Number(e.target.value) as any)}
                    className="px-2 py-1 rounded border border-tanzanite-100 text-xs bg-white"
                  >
                    {EXPIRY_OPTIONS.map(o => (
                      <option key={o.label} value={String(o.days ?? 'never')}>{o.label}</option>
                    ))}
                  </select>
                </label>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
