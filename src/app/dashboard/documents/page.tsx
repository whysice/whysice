'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Upload, FileText, Image, Trash2, Download, FolderOpen, Eye, X, Filter } from 'lucide-react'
import { supabase, getDogs, listDocuments, uploadDocument, getDocumentUrl, deleteDocument } from '@/lib/supabase'

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'cultures', label: 'Culture Results' },
  { value: 'lab-results', label: 'Lab Results' },
  { value: 'prescriptions', label: 'Prescriptions' },
  { value: 'vet-notes', label: 'Vet Notes' },
  { value: 'imaging', label: 'Imaging / Photos' },
]

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase()
  if (['jpg', 'jpeg', 'png', 'heic', 'heif', 'webp'].includes(ext || '')) return Image
  return FileText
}

function cleanFileName(name: string) {
  // Remove timestamp prefix from display name
  const parts = name.split('_')
  if (parts.length > 1 && /^\d{13}$/.test(parts[0])) {
    return parts.slice(1).join('_').replace(/_/g, ' ')
  }
  return name.replace(/_/g, ' ')
}

export default function DocumentsPage() {
  const [dogs, setDogs] = useState<any[]>([])
  const [activeDogId, setActiveDogId] = useState('')
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadCategory, setUploadCategory] = useState('general')
  const [filterCategory, setFilterCategory] = useState('all')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewName, setPreviewName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getDogs().then(data => {
      setDogs(data)
      if (data.length > 0) setActiveDogId(data[0].id)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!activeDogId) return
    refreshDocuments()
  }, [activeDogId])

  async function refreshDocuments() {
    const docs = await listDocuments(activeDogId)
    setDocuments(docs)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0 || !activeDogId) return

    setUploading(true)
    for (let i = 0; i < files.length; i++) {
      try {
        await uploadDocument(files[i], activeDogId, uploadCategory)
      } catch (err) {
        console.error('Upload failed:', err)
      }
    }
    await refreshDocuments()
    setUploading(false)

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleView(doc: any) {
    const url = await getDocumentUrl(doc.fullPath)
    if (url) {
      const ext = doc.name.split('.').pop()?.toLowerCase()
      if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
        setPreviewUrl(url)
        setPreviewName(cleanFileName(doc.name))
      } else {
        // Open PDFs and other files in a new tab
        window.open(url, '_blank')
      }
    }
  }

  async function handleDelete(doc: any) {
    if (!confirm(`Delete ${cleanFileName(doc.name)}?`)) return
    try {
      await deleteDocument(doc.fullPath)
      await refreshDocuments()
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  const filteredDocs = filterCategory === 'all'
    ? documents
    : documents.filter(d => d.category === filterCategory)

  // Group by category
  const grouped = filteredDocs.reduce<Record<string, any[]>>((acc, doc) => {
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
          <p className="text-sm text-slate">Upload and view vet records, lab results, and prescriptions</p>
        </div>
      </div>

      {/* Upload Card */}
      <div className="card mb-8 border-tanzanite-200">
        <div className="flex items-center gap-2 mb-4">
          <Upload className="w-4 h-4 text-tanzanite-500" />
          <h2 className="font-semibold text-tanzanite-800">Upload Documents</h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label htmlFor="upload-category" className="block text-xs text-slate mb-1">Category</label>
            <select
              id="upload-category"
              value={uploadCategory}
              onChange={e => setUploadCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-tanzanite-100 text-sm focus:border-tanzanite-500 focus:outline-none focus:ring-1 focus:ring-tanzanite-200"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-xs text-slate mb-1">File (PDF, JPG, PNG)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.heic,.heif,.webp"
              multiple
              onChange={handleUpload}
              className="w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-tanzanite-500 file:text-white file:font-medium file:cursor-pointer hover:file:bg-tanzanite-600 file:transition-colors"
              disabled={uploading}
            />
          </div>
        </div>

        {uploading && (
          <div className="mt-3 flex items-center gap-2 text-sm text-tanzanite-500">
            <div className="w-4 h-4 border-2 border-tanzanite-500 border-t-transparent rounded-full animate-spin" />
            Uploading...
          </div>
        )}

        <p className="text-xs text-slate mt-3">
          Max 50MB per file. Supported: PDF, JPEG, PNG, HEIC, WebP. Files are private to your account.
        </p>
      </div>

      {/* Filter */}
      {documents.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-slate" />
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-tanzanite-100 text-sm"
            aria-label="Filter by category"
          >
            <option value="all">All categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          <span className="text-xs text-slate">{filteredDocs.length} document{filteredDocs.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Documents List */}
      {documents.length === 0 ? (
        <div className="card text-center py-12">
          <FolderOpen className="w-10 h-10 text-tanzanite-200 mx-auto mb-3" />
          <p className="text-slate text-sm">No documents uploaded yet. Upload vet records, lab results, or prescriptions above.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, docs]) => {
            const catLabel = CATEGORIES.find(c => c.value === category)?.label || category
            return (
              <div key={category}>
                <h3 className="text-sm font-semibold text-tanzanite-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <FolderOpen className="w-4 h-4" />
                  {catLabel}
                  <span className="text-xs text-slate font-normal">({docs.length})</span>
                </h3>
                <div className="space-y-2">
                  {docs.map((doc: any) => {
                    const Icon = getFileIcon(doc.name)
                    return (
                      <div key={doc.fullPath} className="card py-3 px-4 flex items-center gap-3 group">
                        <div className="p-2 rounded-lg bg-tanzanite-50 flex-shrink-0">
                          <Icon className="w-4 h-4 text-tanzanite-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-body truncate">{cleanFileName(doc.name)}</p>
                          <div className="flex gap-x-3 text-xs text-slate">
                            {doc.metadata?.size && <span>{formatFileSize(doc.metadata.size)}</span>}
                            {doc.created_at && <span>{formatDate(doc.created_at)}</span>}
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleView(doc)}
                            className="p-2 rounded-lg hover:bg-tanzanite-50 transition-colors"
                            title="View"
                            aria-label={`View ${cleanFileName(doc.name)}`}
                          >
                            <Eye className="w-4 h-4 text-tanzanite-500" />
                          </button>
                          <button
                            onClick={() => handleDelete(doc)}
                            className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                            title="Delete"
                            aria-label={`Delete ${cleanFileName(doc.name)}`}
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
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
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
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
