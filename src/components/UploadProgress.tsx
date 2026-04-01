'use client'

import { useState, useRef, useCallback, type ChangeEvent } from 'react'
import { Upload, Check, X, AlertTriangle, FileText, Image, Loader2 } from 'lucide-react'

// ============================================
// UCD Optimization #5: Enhanced Upload UX
// - Per-file progress bars
// - Auto-category suggestion from filename
// - Post-upload inline prompt for metadata
// ============================================

type UploadFileState = {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
}

type UploadProgressProps = {
  files: UploadFileState[]
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'cultures': ['culture', 'sensitivity', 'c&s', 'cns', 'mrsa', 'staph', 'susceptibility'],
  'lab-results': ['lab', 'blood', 'cbc', 'chemistry', 'panel', 'titer', 'thyroid', 'ige'],
  'prescriptions': ['rx', 'prescription', 'refill', 'pharmacy'],
  'vet-notes': ['vet', 'doctor', 'clinic', 'exam', 'visit', 'soap', 'notes', 'dvm'],
  'imaging': ['photo', 'image', 'xray', 'x-ray', 'ultrasound', 'dermatoscopy', 'img', 'pic'],
}

/**
 * Infer a document category from the filename.
 * Returns the best match or 'general' as fallback.
 */
export function inferCategoryFromFilename(filename: string): string {
  const lower = filename.toLowerCase()
  let bestMatch = 'general'
  let bestScore = 0

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword) && keyword.length > bestScore) {
        bestMatch = category
        bestScore = keyword.length
      }
    }
  }

  return bestMatch
}

// Per-file progress display
export function UploadProgress({ files }: UploadProgressProps) {
  if (files.length === 0) return null

  return (
    <div className="mt-3 space-y-2" aria-live="polite" aria-label="Upload progress">
      {files.map((f, i) => {
        const Icon = f.file.type.startsWith('image/') ? Image : FileText
        return (
          <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-tanzanite-50/50">
            <Icon className="w-4 h-4 text-tanzanite-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-body truncate">{f.file.name}</p>
              {f.status === 'uploading' && (
                <div className="mt-1 h-1.5 bg-tanzanite-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-tanzanite-500 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${Math.max(f.progress, 5)}%` }}
                    role="progressbar"
                    aria-valuenow={f.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Uploading ${f.file.name}: ${f.progress}%`}
                  />
                </div>
              )}
              {f.status === 'error' && (
                <p className="text-xs text-red-500 mt-0.5">{f.error || 'Upload failed'}</p>
              )}
            </div>
            <div className="flex-shrink-0">
              {f.status === 'uploading' && <Loader2 className="w-4 h-4 text-tanzanite-400 animate-spin" />}
              {f.status === 'done' && <Check className="w-4 h-4 text-green-500" />}
              {f.status === 'error' && <AlertTriangle className="w-4 h-4 text-red-400" />}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Post-upload metadata prompt
type PostUploadPromptProps = {
  fileName: string
  onAddMetadata: () => void
  onDismiss: () => void
}

export function PostUploadPrompt({ fileName, onAddMetadata, onDismiss }: PostUploadPromptProps) {
  return (
    <div className="mt-3 p-3 rounded-lg border border-green-200 bg-green-50/50 flex items-center gap-3">
      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-body">
          <span className="font-medium">{fileName}</span> uploaded
        </p>
        <p className="text-xs text-slate mt-0.5">Add a description or link to a vet visit?</p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={onAddMetadata}
          className="px-2.5 py-1 rounded-md text-xs font-medium text-tanzanite-600 bg-white border border-tanzanite-200 hover:bg-tanzanite-50 transition-colors"
        >
          Add details
        </button>
        <button
          onClick={onDismiss}
          className="p-1 rounded hover:bg-green-100 text-slate"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
