'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, PawPrint, Camera, X, Check, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function DogProfilePageWrapper() {
  return (
    <Suspense fallback={
      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-tanzanite-50 rounded w-1/3" />
          <div className="h-48 bg-tanzanite-50 rounded-xl" />
        </div>
      </div>
    }>
      <DogProfilePage />
    </Suspense>
  )
}

function DogProfilePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams?.get('edit') || null
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(!!editId)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')
  const [breed, setBreed] = useState('')
  const [dob, setDob] = useState('')
  const [weight, setWeight] = useState('')
  const [allergies, setAllergies] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null)

  // Load existing profile if editing
  useEffect(() => {
    if (!editId) return
    async function loadDog() {
      const { data } = await supabase.from('dogs').select('*').eq('id', editId).single()
      if (data) {
        setName(data.name)
        setBreed(data.breed || '')
        setDob(data.dob || '')
        setWeight(data.weight_lbs?.toString() || '')
        setAllergies(data.known_allergies?.join(', ') || '')
        setExistingPhotoUrl(data.photo_url || null)
      }
      setLoadingProfile(false)
    }
    loadDog()
  }, [editId])

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Photo must be under 5MB')
      return
    }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
    setError(null)
  }

  function removePhoto() {
    setPhotoFile(null)
    setPhotoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not logged in'); setSaving(false); return }

    let photoUrl = existingPhotoUrl

    // Upload photo if selected
    if (photoFile) {
      const ext = photoFile.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('profile-photos')
        .upload(path, photoFile, { upsert: true })

      if (uploadErr) {
        setError('Photo upload failed: ' + uploadErr.message)
        setSaving(false)
        return
      }

      const { data: urlData } = supabase.storage.from('profile-photos').getPublicUrl(path)
      photoUrl = urlData.publicUrl
    }

    const allergyArray = allergies.split(',').map(a => a.trim()).filter(a => a.length > 0)

    const payload = {
      name: name.trim(),
      breed: breed.trim() || null,
      dob: dob || null,
      weight_lbs: weight ? Number(weight) : null,
      known_allergies: allergyArray.length > 0 ? allergyArray : null,
      photo_url: photoUrl,
    }

    let dbError
    if (editId) {
      const { error: err } = await supabase.from('dogs').update(payload).eq('id', editId)
      dbError = err
    } else {
      const { error: err } = await supabase.from('dogs').insert({ ...payload, user_id: user.id })
      dbError = err
    }

    if (dbError) {
      setError('Save failed: ' + dbError.message)
      setSaving(false)
      return
    }

    setSuccess(true)
    setTimeout(() => router.push('/dashboard'), 1200)
  }

  if (loadingProfile) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-tanzanite-50 rounded w-1/3" />
          <div className="h-48 bg-tanzanite-50 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Skip link for accessibility */}
      <a href="#dog-form" className="sr-only focus:not-sr-only focus:absolute focus:top-20 focus:left-4 focus:bg-tanzanite-500 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:z-50">
        Skip to form
      </a>

      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="p-2 rounded-lg hover:bg-tanzanite-50 transition-colors" aria-label="Back to dashboard">
          <ArrowLeft className="w-5 h-5 text-tanzanite-500" />
        </Link>
        <h1 className="text-2xl font-bold text-tanzanite-800">
          {editId ? 'Edit Dog Profile' : 'Add Your Dog'}
        </h1>
      </div>

      {/* Success message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3" role="alert">
          <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700 font-medium">
            {editId ? 'Profile updated!' : 'Profile created!'} Redirecting...
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3" role="alert">
          <X className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-red-100 rounded" aria-label="Dismiss error">
            <X className="w-4 h-4 text-red-400" />
          </button>
        </div>
      )}

      <form id="dog-form" onSubmit={handleSubmit} className="card">
        {/* Photo upload */}
        <div className="flex flex-col items-center mb-6 pb-4 border-b border-tanzanite-50">
          <div className="relative mb-3">
            <div className="w-24 h-24 rounded-full bg-tanzanite-50 flex items-center justify-center overflow-hidden border-2 border-tanzanite-100">
              {(photoPreview || existingPhotoUrl) ? (
                <img
                  src={photoPreview || existingPhotoUrl || ''}
                  alt={name || 'Dog photo'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <PawPrint className="w-10 h-10 text-tanzanite-300" />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-tanzanite-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-tanzanite-600 transition-colors"
              aria-label="Upload photo"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              onChange={handlePhotoSelect}
              className="hidden"
              aria-label="Choose photo file"
            />
          </div>
          {(photoPreview || existingPhotoUrl) && (
            <button type="button" onClick={removePhoto} className="text-xs text-red-400 hover:text-red-500">
              Remove photo
            </button>
          )}
          <p className="text-xs text-slate mt-1">Tap the camera icon to add a photo (max 5MB)</p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-body mb-1">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              id="name" type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Your dog's name"
              className="w-full px-3 py-2.5 rounded-lg border border-tanzanite-100 text-sm focus:border-tanzanite-500 focus:outline-none focus:ring-2 focus:ring-tanzanite-200 transition-all"
              required autoFocus={!editId}
            />
          </div>

          <div>
            <label htmlFor="breed" className="block text-sm font-medium text-body mb-1">Breed / mix</label>
            <input
              id="breed" type="text" value={breed} onChange={e => setBreed(e.target.value)}
              placeholder="e.g., Boxer-Pitbull mix"
              className="w-full px-3 py-2.5 rounded-lg border border-tanzanite-100 text-sm focus:border-tanzanite-500 focus:outline-none focus:ring-2 focus:ring-tanzanite-200 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="dob" className="block text-sm font-medium text-body mb-1">Date of birth</label>
              <input
                id="dob" type="date" value={dob} onChange={e => setDob(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2.5 rounded-lg border border-tanzanite-100 text-sm focus:border-tanzanite-500 focus:outline-none focus:ring-2 focus:ring-tanzanite-200 transition-all"
              />
            </div>
            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-body mb-1">Weight (lbs)</label>
              <input
                id="weight" type="number" min="1" max="300" value={weight} onChange={e => setWeight(e.target.value)}
                placeholder="e.g., 69"
                className="w-full px-3 py-2.5 rounded-lg border border-tanzanite-100 text-sm focus:border-tanzanite-500 focus:outline-none focus:ring-2 focus:ring-tanzanite-200 transition-all"
              />
            </div>
          </div>

          <div>
            <label htmlFor="allergies" className="block text-sm font-medium text-body mb-1">
              Known allergies <span className="text-slate font-normal">(comma-separated)</span>
            </label>
            <input
              id="allergies" type="text" value={allergies} onChange={e => setAllergies(e.target.value)}
              placeholder="e.g., Dust mites, Grass pollen"
              className="w-full px-3 py-2.5 rounded-lg border border-tanzanite-100 text-sm focus:border-tanzanite-500 focus:outline-none focus:ring-2 focus:ring-tanzanite-200 transition-all"
            />
            <p className="text-xs text-slate mt-1">Only list confirmed allergies from IgE testing or elimination trials.</p>
          </div>
        </div>

        <button type="submit" disabled={saving || success} className="btn-primary w-full mt-6 flex items-center justify-center gap-2">
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
          ) : success ? (
            <><Check className="w-4 h-4" /> Saved!</>
          ) : (
            editId ? 'Update Profile' : 'Create Profile'
          )}
        </button>
      </form>
    </div>
  )
}
