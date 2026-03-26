'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, PawPrint } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function NewDogPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [breed, setBreed] = useState('')
  const [dob, setDob] = useState('')
  const [weight, setWeight] = useState('')
  const [allergies, setAllergies] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const allergyArray = allergies
      .split(',')
      .map(a => a.trim())
      .filter(a => a.length > 0)

    const { error } = await supabase.from('dogs').insert({
      user_id: user.id,
      name,
      breed: breed || null,
      dob: dob || null,
      weight_lbs: weight ? Number(weight) : null,
      known_allergies: allergyArray.length > 0 ? allergyArray : null,
    })

    if (!error) {
      router.push('/dashboard')
    }
    setSaving(false)
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="p-2 rounded-lg hover:bg-tanzanite-50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-tanzanite-500" />
        </Link>
        <h1 className="text-2xl font-bold text-tanzanite-800">Add Your Dog</h1>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-tanzanite-50">
          <div className="w-14 h-14 rounded-full bg-tanzanite-50 flex items-center justify-center">
            <PawPrint className="w-6 h-6 text-tanzanite-300" />
          </div>
          <div>
            <h2 className="font-semibold text-tanzanite-800">Dog Profile</h2>
            <p className="text-xs text-slate">Set up your dog's basic information</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-body mb-1">Name *</label>
            <input
              id="name" type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Your dog's name"
              className="w-full px-3 py-2 rounded-lg border border-tanzanite-100 text-sm focus:border-tanzanite-500 focus:outline-none focus:ring-1 focus:ring-tanzanite-200"
              required
            />
          </div>

          <div>
            <label htmlFor="breed" className="block text-sm font-medium text-body mb-1">Breed / mix</label>
            <input
              id="breed" type="text" value={breed} onChange={e => setBreed(e.target.value)}
              placeholder="e.g., Boxer-Pitbull mix"
              className="w-full px-3 py-2 rounded-lg border border-tanzanite-100 text-sm focus:border-tanzanite-500 focus:outline-none focus:ring-1 focus:ring-tanzanite-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="dob" className="block text-sm font-medium text-body mb-1">Date of birth</label>
              <input
                id="dob" type="date" value={dob} onChange={e => setDob(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-tanzanite-100 text-sm focus:border-tanzanite-500 focus:outline-none focus:ring-1 focus:ring-tanzanite-200"
              />
            </div>
            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-body mb-1">Weight (lbs)</label>
              <input
                id="weight" type="number" value={weight} onChange={e => setWeight(e.target.value)}
                placeholder="e.g., 69"
                className="w-full px-3 py-2 rounded-lg border border-tanzanite-100 text-sm focus:border-tanzanite-500 focus:outline-none focus:ring-1 focus:ring-tanzanite-200"
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
              className="w-full px-3 py-2 rounded-lg border border-tanzanite-100 text-sm focus:border-tanzanite-500 focus:outline-none focus:ring-1 focus:ring-tanzanite-200"
            />
            <p className="text-xs text-slate mt-1">Only list confirmed allergies from IgE testing or elimination trials.</p>
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full mt-6">
          {saving ? 'Saving...' : 'Create Profile'}
        </button>
      </form>
    </div>
  )
}
