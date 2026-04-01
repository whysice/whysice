'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Upload, FileText, Image, Trash2, Eye, X, Filter, Search, Link2, Calendar, Pill, Edit3, Tag, Check, Loader2 } from 'lucide-react'
import { supabase, getDogs, getDocuments, uploadDocument, getDocumentUrl, deleteDocument, updateDocumentMetadata, searchDocuments, getVetVisits, getTreatmentLogs } from '@/lib/supabase'

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'cultures', label: 'Culture Results' },
  { value: 'lab-results', label: 'Lab Results' },
  { value: 'prescriptions', label: 'Prescriptions' },
  { value: 'vet-notes', label: 'Vet Notes' },
  { value: 'imaging', label: 'Imaging / Photos' },
]

function formatFileSize(bytes: number) {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function formatDate(dateStr: string) {
  return new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00')).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase()
  if (['jpg', 'jpeg', 'png', 'heic', 'heif', 'webp'].includes(ext || '')) return Image
  return FileText
}

export default function DocumentsPage() {
  const [dogs, setDogs] = useState<any[]>([])
  const [activeDogId, setActiveDogId] = useState('')
  const [documents, setDocuments] = useState<any[]>([])
  const [vetVisits, setVetVisits] = useState<any[]>([])
  const [treatments, setTreatments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [filterCategory, setFilterCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[] | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewName, setPreviewName] = useState('')
  const [editingDoc, setEditingDoc] = useState<any | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Upload form state
  const [uploadCategory, setUploadCategory] = useState('general')
  const [uploadDescription, setUploadDescription] = useState('')
  const [uploadDate, setUploadDate] = useState('')
  const [uploadVisitId, setUploadVisitId] = useState('')
  const [uploadTreatmentId, setUploadTreatmentId] = useState('')
  const [showUploadOptions, setShowUploadOptions] = useState(false)

  useEffect(() => {
    getDogs().then(data => {
      setDogs(data)
      if (data.length > 0) setActiveDogId(data[0].id)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!activeDogId) return
    refreshData()
  }, [activeDogId])

  async function refreshData() {
    const [docs, visits, treats] = await Promise.all([
      getDocuments(activeDogId),
      getVetVisits(activeDogId),
      getTreatmentLogs(activeDogId),
    ])
    setDocuments(docs)
    setVetVisits(visits)
    setTreatments(treats)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0 || !activeDogId) return

    setUploading(true)
    for (let i = 0; i < files.length; i++) {
      try {
        await uploadDocument(files[i], activeDogId, uploadCategory, {
          description: uploadDescription || undefined,
          doc_date: uploadDate || undefined,
          vet_visit_id: uploadVisitId || undefined,
          treatment_log_id: uploadTreatmentId || undefined,
        })
      } catch (err) {
        console.error('Upload failed:', err)
      }
    }
    await refreshData()
    setUploading(false)
    setUploadDescription('')
    setUploadDate('')
    setUploadVisitId('')
    setUploadTreatmentId('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!searchQuery.trim()) { setSearchResults(null); return }
    const results = await searchDocuments(searchQuery.trim(), activeDogId)
    setSearchResults(results)
  }

  async function handleView(doc: any) {
    const url = await getDocumentUrl(doc.storage_path)
    if (url) {
      const ext = doc.file_name.split('.').pop()?.toLowerCase()
      if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
        setPreviewUrl(url)
        setPreviewName(doc.file_name)
      } else {
        window.open(url, '_blank')
      }
    }
  }

  async function handleDelete(doc: any) {
    if (!confirm(`Delete ${doc.file_name}?`)) return
    try {
      await deleteDocument(doc.id, doc.storage_path)
      await refreshData()
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  async function handleUpdateLink(docId: string, field: string, value: string | null) {
    try {
      await updateDocumentMetadata(docId, { [field]: value || null })
      await refreshData()
      setEditingDoc(null)
    } catch (err) {
      console.error('Update failed:', err)
    }
  }

  const displayDocs = searchResults || (filterCategory === 'all' ? documents : documents.filter(d => d.category === filterCategory))

  // Group by category
  const grouped = displayDocs.reduce<Record<string, any[]>>((acc, doc) => {
    const cat = doc.category || 'general'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(doc)
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
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="p-2 rounded-lg hover:bg-tanzanite-50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-tanzanite-500" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-tanzanite-800">Vet Documents</h1>
          <p className="text-sm text-slate">Upload, search, and link vet records to visits and treatments</p>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate" />
          <input
            type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search inside documents..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-tanzanite-100 text-sm focus:border-tanzanite-500 focus:outline-none focus:ring-1 focus:ring-tanzanite-200"
          />
          {searchResults && (
            <button type="button" onClick={() => { setSearchResults(null); setSearchQuery('') }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-tanzanite-500 hover:underline">
              Clear
            </button>
          )}
        </div>
        {searchResults && (
          <p className="text-xs text-slate mt-1">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"</p>
        )}
      </form>

      {/* Upload Card */}
      <div className="card mb-6 border-tanzanite-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-tanzanite-500" />
            <h2 className="font-semibold text-tanzanite-800">Upload</h2>
          </div>
          <button onClick={() => setShowUploadOptions(!showUploadOptions)}
            className="text-xs text-tanzanite-500 hover:underline">
            {showUploadOptions ? 'Simple upload' : 'More options'}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-3">
          <div className="flex-1">
            <select value={uploadCategory} onChange={e => setUploadCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-tanzanite-100 text-sm focus:border-tanzanite-500 focus:outline-none"
              aria-label="Document category">
              {CATEGORIES.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.heic,.heif,.webp" multiple
              onChange={handleUpload} disabled={uploading}
              className="w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-tanzanite-500 file:text-white file:font-medium file:cursor-pointer hover:file:bg-tanzanite-600" />
          </div>
        </div>

        {showUploadOptions && (
          <div className="grid sm:grid-cols-2 gap-3 pt-3 border-t border-tanzanite-50">
            <div>
              <label className="block text-xs text-slate mb-1">Description</label>
              <input type="text" value={uploadDescription} onChange={e => setUploadDescription(e.target.value)}
                placeholder="e.g., March 2026 culture results"
                className="w-full px-3 py-1.5 rounded-lg border border-tanzanite-100 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate mb-1">Document date</label>
              <input type="date" value={uploadDate} onChange={e => setUploadDate(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-tanzanite-100 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate mb-1">
                <Calendar className="w-3 h-3 inline mr-1" />Link to vet visit
              </label>
              <select value={uploadVisitId} onChange={e => setUploadVisitId(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-tanzanite-100 text-sm">
                <option value="">None</option>
                {vetVisits.map(v => (
                  <option key={v.id} value={v.id}>
                    {formatDate(v.visit_date)} - {v.reason?.substring(0, 40)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate mb-1">
                <Pill className="w-3 h-3 inline mr-1" />Link to treatment
              </label>
              <select value={uploadTreatmentId} onChange={e => setUploadTreatmentId(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-tanzanite-100 text-sm">
                <option value="">None</option>
                {treatments.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.treatment_name} ({formatDate(t.date_started)})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {uploading && (
          <div className="mt-3 flex items-center gap-2 text-sm text-tanzanite-500">
            <div className="w-4 h-4 border-2 border-tanzanite-500 border-t-transparent rounded-full animate-spin" />
            Uploading...
          </div>
        )}
      </div>

      {/* Filter */}
      {!searchResults && documents.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-slate" />
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-tanzanite-100 text-sm" aria-label="Filter by category">
            <option value="all">All categories</option>
            {CATEGORIES.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
          </select>
          <span className="text-xs text-slate">{displayDocs.length} document{displayDocs.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Documents List */}
      {displayDocs.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="w-10 h-10 text-tanzanite-200 mx-auto mb-3" />
          <p className="text-slate text-sm">
            {searchResults ? 'No documents match your search.' : 'No documents uploaded yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, docs]) => {
            const catLabel = CATEGORIES.find(c => c.value === category)?.label || category
            return (
              <div key={category}>
                <h3 className="text-sm font-semibold text-tanzanite-500 uppercase tracking-wide mb-2">
                  {catLabel} <span className="text-xs text-slate font-normal">({docs.length})</span>
                </h3>
                <div className="space-y-2">
                  {docs.map((doc: any) => {
                    const Icon = getFileIcon(doc.file_name)
                    const isEditing = editingDoc?.id === doc.id
                    return (
                      <div key={doc.id} className="card py-3 px-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-tanzanite-50 flex-shrink-0">
                            <Icon className="w-4 h-4 text-tanzanite-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-body">{doc.display_name || doc.file_name}</p>
                            {doc.display_name && <p className="text-[10px] text-slate">{doc.file_name}</p>}
                            {doc.description && <p className="text-xs text-slate">{doc.description}</p>}
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate mt-1">
                              {doc.file_size && <span>{formatFileSize(doc.file_size)}</span>}
                              {doc.doc_date && <span>{formatDate(doc.doc_date)}</span>}
                              {doc.vet_visits && (
                                <span className="text-tanzanite-500">
                                  <Calendar className="w-3 h-3 inline mr-0.5" />
                                  {formatDate(doc.vet_visits.visit_date)} - {doc.vet_visits.reason?.substring(0, 30)}
                                </span>
                              )}
                              {doc.treatment_logs && (
                                <span className="text-ice-600">
                                  <Pill className="w-3 h-3 inline mr-0.5" />
                                  {doc.treatment_logs.treatment_name}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button onClick={() => handleView(doc)} className="p-1.5 rounded hover:bg-tanzanite-50" title="View"
                              aria-label={`View ${doc.file_name}`}>
                              <Eye className="w-4 h-4 text-tanzanite-500" />
                            </button>
                            <button onClick={() => setEditingDoc(isEditing ? null : doc)} className="p-1.5 rounded hover:bg-tanzanite-50" title="Edit links"
                              aria-label={`Edit links for ${doc.file_name}`}>
                              <Link2 className="w-4 h-4 text-tanzanite-400" />
                            </button>
                            <button onClick={() => handleDelete(doc)} className="p-1.5 rounded hover:bg-red-50" title="Delete"
                              aria-label={`Delete ${doc.file_name}`}>
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        </div>

                        {/* Edit panel */}
                        {isEditing && (
                          <EditPanel
                            doc={doc}
                            vetVisits={vetVisits}
                            treatments={treatments}
                            onSave={async (updates) => {
                              try {
                                await updateDocumentMetadata(doc.id, updates)
                                await refreshData()
                                setEditingDoc(null)
                              } catch (err) { console.error('Update failed:', err) }
                            }}
                            onCancel={() => setEditingDoc(null)}
                          />
                        )}

                        {/* Extraction status and AI-parsed data */}
                        {doc.extraction_status === 'processing' && (
                          <div className="mt-2 flex items-center gap-2 text-xs text-tanzanite-500">
                            <div className="w-3 h-3 border-2 border-tanzanite-500 border-t-transparent rounded-full animate-spin" />
                            Extracting text and analyzing content...
                          </div>
                        )}
                        {doc.extraction_status === 'completed' && doc.extracted_data && (
                          <div className="mt-2 pt-2 border-t border-tanzanite-50">
                            {doc.extracted_data.summary && (
                              <p className="text-xs text-body mb-1">{doc.extracted_data.summary}</p>
                            )}
                            <div className="flex flex-wrap gap-1">
                              {doc.extracted_data.document_type && (
                                <span className="badge bg-tanzanite-50 text-tanzanite-600 text-[10px]">
                                  {doc.extracted_data.document_type.replace(/_/g, ' ')}
                                </span>
                              )}
                              {doc.extracted_data.diagnoses_mentioned?.map((d: string, i: number) => (
                                <span key={i} className="badge bg-ice-50 text-ice-700 text-[10px]">{d}</span>
                              ))}
                            </div>
                            {doc.extracted_data.culture_results?.organisms && (
                              <div className="mt-2 p-2 bg-tanzanite-50/30 rounded-lg">
                                <p className="text-[10px] font-semibold text-tanzanite-600 uppercase mb-1">Culture results</p>
                                {doc.extracted_data.culture_results.organisms.map((org: any, i: number) => (
                                  <div key={i} className="mb-1.5 last:mb-0">
                                    <p className="text-xs font-medium text-body">{org.name} {org.growth && `(${org.growth})`}</p>
                                    {org.sensitivities && (
                                      <div className="flex flex-wrap gap-1 mt-0.5">
                                        {org.sensitivities.filter((s: any) => s.result === 'S').map((s: any, j: number) => (
                                          <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-green-50 text-green-700">{s.antibiotic} S</span>
                                        ))}
                                        {org.sensitivities.filter((s: any) => s.result === 'R').slice(0, 5).map((s: any, j: number) => (
                                          <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-600">{s.antibiotic} R</span>
                                        ))}
                                        {org.sensitivities.filter((s: any) => s.result === 'R').length > 5 && (
                                          <span className="text-[10px] text-red-400">+{org.sensitivities.filter((s: any) => s.result === 'R').length - 5} more R</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        {doc.extraction_status === 'failed' && (
                          <p className="mt-2 text-xs text-red-400">Text extraction failed</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Image Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setPreviewUrl(null)}>
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 border-b border-tanzanite-50">
              <p className="text-sm font-medium text-body truncate">{previewName}</p>
              <button onClick={() => setPreviewUrl(null)} className="p-1 rounded hover:bg-tanzanite-50">
                <X className="w-5 h-5 text-slate" />
              </button>
            </div>
            <div className="overflow-auto max-h-[80vh]">
              <img src={previewUrl} alt={previewName} className="w-full h-auto" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function EditPanel({ doc, vetVisits, treatments, onSave, onCancel }: {
  doc: any
  vetVisits: any[]
  treatments: any[]
  onSave: (updates: any) => Promise<void>
  onCancel: () => void
}) {
  const [displayName, setDisplayName] = useState(doc.display_name || '')
  const [description, setDescription] = useState(doc.description || '')
  const [docDate, setDocDate] = useState(doc.doc_date || '')
  const [visitId, setVisitId] = useState(doc.vet_visit_id || '')
  const [treatmentId, setTreatmentId] = useState(doc.treatment_log_id || '')
  const [category, setCategory] = useState(doc.category || 'general')
  const [saving, setSaving] = useState(false)

  function fmtDate(dateStr: string) {
    return new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00')).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const CATS = [
    { value: 'general', label: 'General' },
    { value: 'cultures', label: 'Culture Results' },
    { value: 'lab-results', label: 'Lab Results' },
    { value: 'prescriptions', label: 'Prescriptions' },
    { value: 'vet-notes', label: 'Vet Notes' },
    { value: 'imaging', label: 'Imaging / Photos' },
  ]

  async function handleSave() {
    setSaving(true)
    await onSave({
      display_name: displayName.trim() || null,
      description: description.trim() || null,
      doc_date: docDate || null,
      vet_visit_id: visitId || null,
      treatment_log_id: treatmentId || null,
      category,
    })
    setSaving(false)
  }

  return (
    <div className="mt-3 pt-3 border-t border-tanzanite-50">
      <div className="grid sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs text-slate mb-1">Display name (rename)</label>
          <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
            placeholder={doc.file_name}
            className="w-full px-2 py-1.5 rounded border border-tanzanite-100 text-xs focus:border-tanzanite-500 focus:outline-none focus:ring-1 focus:ring-tanzanite-200" />
        </div>
        <div>
          <label className="block text-xs text-slate mb-1">Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="w-full px-2 py-1.5 rounded border border-tanzanite-100 text-xs focus:border-tanzanite-500 focus:outline-none focus:ring-1 focus:ring-tanzanite-200">
            {CATS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate mb-1">Description</label>
          <input type="text" value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Brief description..."
            className="w-full px-2 py-1.5 rounded border border-tanzanite-100 text-xs focus:border-tanzanite-500 focus:outline-none focus:ring-1 focus:ring-tanzanite-200" />
        </div>
        <div>
          <label className="block text-xs text-slate mb-1">Document date</label>
          <input type="date" value={docDate} onChange={e => setDocDate(e.target.value)}
            className="w-full px-2 py-1.5 rounded border border-tanzanite-100 text-xs focus:border-tanzanite-500 focus:outline-none focus:ring-1 focus:ring-tanzanite-200" />
        </div>
        <div>
          <label className="block text-xs text-slate mb-1">Link to vet visit</label>
          <select value={visitId} onChange={e => setVisitId(e.target.value)}
            className="w-full px-2 py-1.5 rounded border border-tanzanite-100 text-xs focus:border-tanzanite-500 focus:outline-none focus:ring-1 focus:ring-tanzanite-200">
            <option value="">None</option>
            {vetVisits.map((v: any) => (
              <option key={v.id} value={v.id}>{fmtDate(v.visit_date)} - {v.reason?.substring(0, 35)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate mb-1">Link to treatment</label>
          <select value={treatmentId} onChange={e => setTreatmentId(e.target.value)}
            className="w-full px-2 py-1.5 rounded border border-tanzanite-100 text-xs focus:border-tanzanite-500 focus:outline-none focus:ring-1 focus:ring-tanzanite-200">
            <option value="">None</option>
            {treatments.map((t: any) => (
              <option key={t.id} value={t.id}>{t.treatment_name} ({fmtDate(t.date_started)})</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-tanzanite-500 text-white text-xs font-medium hover:bg-tanzanite-600 transition-colors disabled:opacity-50">
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
          {saving ? 'Saving...' : 'Save changes'}
        </button>
        <button onClick={onCancel}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate hover:bg-tanzanite-50 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  )
}
