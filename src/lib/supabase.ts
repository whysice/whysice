import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''

// Safe initialization - returns a stub-safe client during build/prerender
export const supabase: SupabaseClient = supabaseUrl
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder.supabase.co', 'placeholder')

// ============================================
// KNOWLEDGE BASE QUERIES
// ============================================

export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order')
  if (error) throw error
  return data
}

export async function getCategory(slug: string) {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single()
  if (error) throw error
  return data
}

export async function getConditionsByCategory(categoryId: string) {
  const { data, error } = await supabase
    .from('conditions')
    .select('id, name, slug, summary_owner, severity_range, is_contagious, breeds_affected, tags')
    .eq('category_id', categoryId)
    .order('name')
  if (error) throw error
  return data
}

export async function getCondition(slug: string) {
  const { data, error } = await supabase
    .from('conditions')
    .select(`
      *,
      categories (name, slug),
      condition_medications (
        is_first_line,
        notes,
        medications (id, name, slug, brand_names, drug_class, cost_tier)
      )
    `)
    .eq('slug', slug)
    .single()
  if (error) throw error
  return data
}

export async function getMedication(slug: string) {
  const { data, error } = await supabase
    .from('medications')
    .select(`
      *,
      condition_medications (
        is_first_line,
        notes,
        conditions (id, name, slug, severity_range)
      )
    `)
    .eq('slug', slug)
    .single()
  if (error) throw error
  return data
}

export async function getMedications() {
  const { data, error } = await supabase
    .from('medications')
    .select('id, name, slug, brand_names, drug_class, summary_owner, cost_tier')
    .order('name')
  if (error) throw error
  return data
}

// ============================================
// SEARCH
// ============================================

export async function searchWiki(query: string) {
  const { data, error } = await supabase
    .rpc('search_wiki', { search_query: query, result_limit: 20 })
  if (error) throw error
  return data
}

// ============================================
// PERSONAL TRACKING (requires auth)
// ============================================

export async function getDogs() {
  const { data, error } = await supabase
    .from('dogs')
    .select('*')
    .order('name')
  if (error) throw error
  return data
}

export async function getSymptomLogs(dogId: string, limit = 50) {
  const { data, error } = await supabase
    .from('symptom_logs')
    .select('*')
    .eq('dog_id', dogId)
    .order('date', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

export async function getTreatmentLogs(dogId: string) {
  const { data, error } = await supabase
    .from('treatment_logs')
    .select(`
      *,
      medications (name, slug, brand_names)
    `)
    .eq('dog_id', dogId)
    .order('date_started', { ascending: false })
  if (error) throw error
  return data
}

export async function getVetVisits(dogId: string) {
  const { data, error } = await supabase
    .from('vet_visits')
    .select('*')
    .eq('dog_id', dogId)
    .order('visit_date', { ascending: false })
  if (error) throw error
  return data
}

// ============================================
// COMMUNITY CONTRIBUTIONS
// ============================================

export async function submitEdit(edit: {
  target_type: string
  target_id?: string
  field_name?: string
  current_value?: string
  proposed_value: string
  reason?: string
  sources?: object
}) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Must be logged in to submit edits')

  const { data, error } = await supabase
    .from('suggested_edits')
    .insert({ ...edit, user_id: user.id })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getPendingEdits() {
  const { data, error } = await supabase
    .from('suggested_edits')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// ============================================
// DOCUMENT STORAGE
// ============================================

export async function uploadDocument(file: File, dogId: string, category: string = 'general') {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Must be logged in to upload')

  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const path = `${user.id}/${dogId}/${category}/${timestamp}_${safeName}`

  const { data, error } = await supabase.storage
    .from('vet-documents')
    .upload(path, file)

  if (error) throw error
  return { path: data.path, name: file.name, size: file.size, type: file.type, category, uploaded_at: new Date().toISOString() }
}

export async function listDocuments(dogId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase.storage
    .from('vet-documents')
    .list(`${user.id}/${dogId}`, { sortBy: { column: 'created_at', order: 'desc' } })

  if (error) return []

  // List files in all category subfolders
  const categories = ['general', 'cultures', 'lab-results', 'prescriptions', 'vet-notes', 'imaging']
  const allFiles: any[] = []

  for (const cat of categories) {
    const { data: files } = await supabase.storage
      .from('vet-documents')
      .list(`${user.id}/${dogId}/${cat}`, { sortBy: { column: 'created_at', order: 'desc' } })

    if (files) {
      for (const f of files) {
        if (f.name) {
          allFiles.push({
            ...f,
            category: cat,
            fullPath: `${user.id}/${dogId}/${cat}/${f.name}`,
          })
        }
      }
    }
  }

  return allFiles
}

export async function getDocumentUrl(path: string) {
  const { data } = await supabase.storage
    .from('vet-documents')
    .createSignedUrl(path, 3600) // 1 hour expiry

  return data?.signedUrl || null
}

export async function deleteDocument(path: string) {
  const { error } = await supabase.storage
    .from('vet-documents')
    .remove([path])

  if (error) throw error
}
