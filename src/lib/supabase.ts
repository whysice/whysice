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
    .select('id, name, slug, brand_names, drug_class, summary_owner, cost_tier, sort_order')
    .order('sort_order', { ascending: true })
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
      medications (name, slug, brand_names),
      treatment_medications (
        medication_id,
        medications (id, name, slug, brand_names)
      )
    `)
    .eq('dog_id', dogId)
    .order('date_started', { ascending: false })
  if (error) throw error
  return data
}

export async function setTreatmentMedications(treatmentId: string, medicationIds: string[]) {
  // Clear existing links
  await supabase.from('treatment_medications').delete().eq('treatment_log_id', treatmentId)
  // Insert new links
  if (medicationIds.length > 0) {
    const rows = medicationIds.map(mid => ({ treatment_log_id: treatmentId, medication_id: mid }))
    await supabase.from('treatment_medications').insert(rows)
  }
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
// DOCUMENT STORAGE + METADATA
// ============================================

export async function uploadDocument(
  file: File,
  dogId: string,
  category: string = 'general',
  options?: {
    description?: string
    doc_date?: string
    vet_visit_id?: string
    treatment_log_id?: string
    tags?: string[]
  }
) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Must be logged in to upload')

  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const path = `${user.id}/${dogId}/${category}/${timestamp}_${safeName}`

  // Upload file to storage
  const { data, error } = await supabase.storage
    .from('vet-documents')
    .upload(path, file)

  if (error) throw error

  // Create metadata record
  const { data: meta, error: metaError } = await supabase
    .from('document_metadata')
    .insert({
      user_id: user.id,
      dog_id: dogId,
      storage_path: data.path,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      category,
      description: options?.description || null,
      doc_date: options?.doc_date || null,
      vet_visit_id: options?.vet_visit_id || null,
      treatment_log_id: options?.treatment_log_id || null,
      tags: options?.tags || null,
    })
    .select()
    .single()

  if (metaError) console.error('Metadata insert failed:', metaError)

  // Trigger document processing (text extraction + AI parsing)
  if (meta) {
    triggerDocumentProcessing(meta.id, data.path, file.name, file.type).catch(err =>
      console.error('Document processing trigger failed:', err)
    )
  }

  return { path: data.path, name: file.name, size: file.size, type: file.type, category, metadata: meta }
}

// Fire-and-forget call to Edge Function for document processing
async function triggerDocumentProcessing(docId: string, storagePath: string, fileName: string, fileType: string) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) return

  try {
    await fetch(`${supabaseUrl}/functions/v1/process-document`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        doc_id: docId,
        storage_path: storagePath,
        file_name: fileName,
        file_type: fileType,
      }),
    })
  } catch (err) {
    console.error('Edge function call failed:', err)
  }
}

export async function getDocuments(dogId: string) {
  const { data, error } = await supabase
    .from('document_metadata')
    .select(`
      *,
      vet_visits (visit_date, vet_name, reason),
      treatment_logs (treatment_name, date_started)
    `)
    .eq('dog_id', dogId)
    .order('created_at', { ascending: false })

  if (error) return []
  return data
}

export async function getDocumentsForVisit(visitId: string) {
  const { data, error } = await supabase
    .from('document_metadata')
    .select('*')
    .eq('vet_visit_id', visitId)
    .order('created_at', { ascending: false })

  if (error) return []
  return data
}

export async function getDocumentsForTreatment(treatmentId: string) {
  const { data, error } = await supabase
    .from('document_metadata')
    .select('*')
    .eq('treatment_log_id', treatmentId)
    .order('created_at', { ascending: false })

  if (error) return []
  return data
}

export async function updateDocumentMetadata(docId: string, updates: {
  display_name?: string | null
  description?: string | null
  doc_date?: string | null
  vet_visit_id?: string | null
  treatment_log_id?: string | null
  category?: string
  tags?: string[]
}) {
  const { data, error } = await supabase
    .from('document_metadata')
    .update(updates)
    .eq('id', docId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function searchDocuments(query: string, dogId?: string) {
  const { data, error } = await supabase
    .rpc('search_documents', {
      search_query: query,
      dog_id_filter: dogId || null,
      result_limit: 20
    })

  if (error) return []
  return data
}

export async function getDocumentUrl(path: string) {
  const { data } = await supabase.storage
    .from('vet-documents')
    .createSignedUrl(path, 3600)

  return data?.signedUrl || null
}

export async function deleteDocument(docId: string, storagePath: string) {
  // Delete from storage
  await supabase.storage.from('vet-documents').remove([storagePath])
  // Delete metadata
  await supabase.from('document_metadata').delete().eq('id', docId)
}

// Legacy function for listing files without metadata (fallback)
export async function listDocuments(dogId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const categories = ['general', 'cultures', 'lab-results', 'prescriptions', 'vet-notes', 'imaging']
  const allFiles: any[] = []

  for (const cat of categories) {
    const { data: files } = await supabase.storage
      .from('vet-documents')
      .list(`${user.id}/${dogId}/${cat}`, { sortBy: { column: 'created_at', order: 'desc' } })

    if (files) {
      for (const f of files) {
        if (f.name) {
          allFiles.push({ ...f, category: cat, fullPath: `${user.id}/${dogId}/${cat}/${f.name}` })
        }
      }
    }
  }

  return allFiles
}
