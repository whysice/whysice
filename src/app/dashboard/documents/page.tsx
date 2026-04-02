'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Upload, FileText, Image, Trash2, Eye, X, Filter, Search, Link2, Calendar, Pill, Edit3, Tag, Check, Loader2 } from 'lucide-react'
import { supabase, getDogs, getDocuments, uploadDocument, getDocumentUrl, deleteDocument, updateDocumentMetadata, searchDocuments, getVetVisits, getTreatmentListSimple } from '@/lib/supabase'
import { useToast } from '@/contexts/ToastContext'
import { ConfirmDialog, useConfirmDialog } from '@/components/ConfirmDialog'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { EmptyState } from '@/components/EmptyState'
import { UploadProgress, PostUploadPrompt, inferCategoryFromFilename } from '@/components/UploadProgress'
import type { ReactNode } from 'react'

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

type UploadFileState = {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
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

  // Integrations
  const { showToast } = useToast()
  const { confirmingId, requestConfirm, cancelConfirm, isConfirming } = useConfirmDialog()

  // Upload form state
  const [uploadCategory, setUploadCategory] = useState('general')
  const [uploadDescription, setUploadDescription] = useState('')
  const [uploadDate, setUploadDate] = useState('')
  const [uploadVisitId, setUploadVisitId] = useState('')
  const [uploadTreatmentId, setUploadTreatmentId] = useState('')
  const [showUploadOptions, setShowUploadOptions] = useState(false)

  // #5 Upload progress tracking
  const [uploadFiles, setUploadFiles] = useState<UploadFileState[]>([])
  const [lastUploadedFile, setLastUploadedFile] = useState<string | null>(null)

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
      getTreatmentListSimple(activeDogId),
    ])
    setDocuments(docs)
    setVetVisits(visits)
    setTreatments(treats)
  }

  // #5 Enhanced upload with progress and auto-categorization
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0 || !activeDogId) return

    setUploading(true)
    const fileStates: UploadFileState[] = Array.from(files).map(f => ({
      file: f,
      progress: 0,
      status: 'pending' as const,
    }))
    setUploadFiles(fileStates)

    for (let i = 0; i < files.length; i++) {
      // Auto-suggest category from filename
      const suggestedCategory = inferCategoryFromFilename(files[i].name)
      const effectiveCategory = uploadCategory === 'general' && suggestedCategory !== 'general'
        ? suggestedCategory
        : uploadCategory

      // Update status to uploading
      setUploadFiles(prev => prev.map((f, idx) =>
        idx === i ? { ...f, status: 'uploading', progress: 20 } : f
      ))

      try {
        setUploadFiles(prev => prev.map((f, idx) =>
          idx === i ? { ...f, progress: 50 } : f
        ))

        await uploadDocument(files[i], activeDogId, effectiveCategory, {
          description: uploadDescription || undefined,
          doc_date: uploadDate || undefined,
          vet_visit_id: uploadVisitId || undefined,
          treatment_log_id: uploadTreatmentId || undefined,
        })

        setUploadFiles(prev => prev.map((f, idx) =>
          idx === i ? { ...f, status: 'done', progress: 100 } : f
        ))
      } catch (err) {
        console.error('Upload failed:', err)
        setUploadFiles(prev => prev.map((f, idx) =>
          idx === i ? { ...f, status: 'error', error: 'Upload failed' } : f
        ))
        showToast(`Failed to upload ${files[i].name}`, 'error')
      }
    }

    await refreshData()
    setUploading(false)

    const successCount = fileStates.length // will be updated via state
    setLastUploadedFile(files[0].name)

    // Clear progress after delay
    setTimeout(() => {
      setUploadFiles([])
    }, 3000)

    showToast(`${files.length} file${files.length > 1 ? 's' : ''} uploaded`, 'success')
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

  // #2 Inline confirm for delete
  async function handleDelete(doc: any) {
    try {
      await deleteDocument(doc.id, doc.storage_path)
      await refreshData()
      cancelConfirm()
      showToast(`${doc.file_name} deleted`, 'success')
    } catch (err) {
      showToast('Failed to delete document', 'error')
    }
  }

  async function handleUpdateLink(docId: string, field: string, value: string | null) {
    try {
      await updateDocumentMetadata(docId, { [field]: value || null })
      await refreshData()
      setEditingDoc(null)
      showToast('Document updated', 'success')
    } catch (err) {
      showToast('Failed to update document', 'error')
    }
  }

  const displayDocs = searchResults || (filterCategory === 'all'
    ? documents
    : documents.filter(d => d.category === filterCategory))

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
      <Breadcrumbs crumbs={[{ label: 'Documents' }]} />

      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="p-2 rounded-lg hover:bg-tanzanite-50 transition-colors" aria-label="Back to dashboard">
          <ArrowLeft className="w-5 h-5 text-tanzanite-500" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-tanzanite-800">Documents</h1>
          <p className="text-sm text-slate">Upload and organize vet records, lab results, and photos</p>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search documents..." aria-label="Search documents"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-tanzanite-100 text-sm focus:border-tanzanite-500 focus:outline-none focus:ring-1 focus:ring-tanzanite-200" />
        </div>
        <button type="submit" className="btn-secondary text-sm">Search</button>
        {searchResults && (
          <button type="button" onClick={() => { setSearchResults(null); setSearchQuery('') }}
            className="text-xs text-tanzanite-500 hover:underline">Clear</button>
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

        {/* #5 Upload progress */}
        <UploadProgress files={uploadFiles} />

        {/* #5 Post-upload metadata prompt */}
        {lastUploadedFile && !uploading && !showUploadOptions && uploadFiles.length === 0 && (
          <PostUploadPrompt
            fileName={lastUploadedFile}
            onAddMetadata={() => { setShowUploadOptions(true); setLastUploadedFile(null) }}
            onDismiss={() => setLastUploadedFile(null)}
          />
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
        <EmptyState
          icon={FileText}
          title={searchResults ? 'No results found' : 'No documents uploaded yet'}
          message={searchResults ? 'No documents match your search.' : 'Upload vet records, lab results, or photos to keep everything organized.'}
          motivation={searchResults ? undefined : 'Having documents linked to visits and treatments gives your vet a complete picture at every appointment.'}
        />
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
                                  {formatDate(doc.vet_visits.visit_date)}
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
                            <button onClick={() => handleView(doc)}
                              className="p-1.5 rounded hover:bg-tanzanite-50 text-slate" aria-label={`View ${doc.file_name}`}>
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => requestConfirm(doc.id)}
                              className="p-1.5 rounded hover:bg-red-50 text-slate" aria-label={`Delete ${doc.file_name}`}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {isConfirming(doc.id) && (
                          <ConfirmDialog
                            message={`Delete ${doc.file_name}? This cannot be undone.`}
                            confirmLabel="Delete"
                            onConfirm={() => handleDelete(doc)}
                            onCancel={cancelConfirm}
                          />
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

      {/* Image preview modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setPreviewUrl(null)}>
          <div className="relative max-w-3xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreviewUrl(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center"
              aria-label="Close preview">
              <X className="w-4 h-4" />
            </button>
            <img src={previewUrl} alt={previewName} className="max-w-full max-h-[85vh] rounded-lg shadow-xl" />
          </div>
        </div>
      )}
    </div>
  )
}
