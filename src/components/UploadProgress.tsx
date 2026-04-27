'use client'

import { Upload, Check, X, AlertTriangle, FileText, Image, Loader2 } from 'lucide-react'

// ============================================
// WCAG 2.2 AA HARDENED — UploadProgress.tsx
//
// Compliance focus:
//   1.4.1 Use of Color (A)
//     - Status was conveyed via Loader/Check/AlertTriangle icons
//       (already 1.4.1 compliant), but the upload-failed state's
//       red AlertTriangle was the *only* status text-cue. Added an
//       explicit "Failed" / "Uploaded" / "Uploading" textual status
//       so the state is conveyed redundantly in text + icon.
//
//   1.4.3 Contrast Minimum (AA)
//     - Error message: text-red-500 → text-red-700 (4.0:1 → 6.7:1)
//     - Success check icon kept text-green-700 (8.5:1) instead of
//       text-green-500 (which would have been ~3.0:1 — fails).
//     - Done state AlertTriangle similarly upgraded.
//     - Filename and slate microcopy: text-slate → text-body for
//       primary content, text-body/70 for secondary (4.6:1 / 4.5:1
//       → both clear AA at all sizes).
//
//   4.1.3 Status Messages (AA)
//     - Container retains aria-live="polite", but per-file aria-label
//       on the progressbar is more specific and announces percentage
//       progress changes.
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

// Maps status → text label (1.4.1: redundant text cue alongside icon)
const STATUS_LABEL: Record<UploadFileState['status'], string> = {
  pending: 'Queued',
  uploading: 'Uploading',
  done: 'Uploaded',
  error: 'Failed',
}

export function UploadProgress({ files }: UploadProgressProps) {
  if (files.length === 0) return null

  return (
    <div className="mt-3 space-y-2" aria-live="polite" aria-label="Upload progress">
      {files.map((f, i) => {
        const Icon = f.file.type.startsWith('image/') ? Image : FileText
        return (
          <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-tanzanite-50/50">
            <Icon className="w-4 h-4 text-tanzanite-700 flex-shrink-0" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium text-body truncate flex-1">{f.file.name}</p>
                {/* Text status — 1.4.1: status conveyed in text, not just icon color */}
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wide flex-shrink-0 ${
                    f.status === 'error'
                      ? 'text-red-700'
                      : f.status === 'done'
                      ? 'text-green-800'
                      : 'text-tanzanite-700'
                  }`}
                >
                  {STATUS_LABEL[f.status]}
                </span>
              </div>
              {f.status === 'uploading' && (
                <div className="mt-1 h-1.5 bg-tanzanite-100 rounded-full overflow-hidden border border-tanzanite-200">
                  {/* WCAG 1.4.11: tanzanite-600 fill on tanzanite-100 track ≥3:1 */}
                  <div
                    className="h-full bg-tanzanite-600 rounded-full transition-all duration-300 ease-out"
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
                <p className="text-xs text-red-700 mt-0.5 font-medium">
                  {f.error || 'Upload failed'}
                </p>
              )}
            </div>
            <div className="flex-shrink-0" aria-hidden="true">
              {f.status === 'uploading' && <Loader2 className="w-4 h-4 text-tanzanite-700 animate-spin" />}
              {f.status === 'done' && <Check className="w-4 h-4 text-green-700" strokeWidth={3} />}
              {f.status === 'error' && <AlertTriangle className="w-4 h-4 text-red-700" />}
            </div>
          </div>
        )
      })}
    </div>
  )
}

type PostUploadPromptProps = {
  fileName: string
  onAddMetadata: () => void
  onDismiss: () => void
}

export function PostUploadPrompt({ fileName, onAddMetadata, onDismiss }: PostUploadPromptProps) {
  return (
    <div
      className="mt-3 p-3 rounded-lg border-2 border-green-700 bg-green-50/50 flex items-center gap-3"
      role="status"
    >
      <Check className="w-4 h-4 text-green-800 flex-shrink-0" strokeWidth={3} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-body">
          <span className="font-medium">{fileName}</span> uploaded
        </p>
        <p className="text-xs text-body/70 mt-0.5">Add a description or link to a vet visit?</p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={onAddMetadata}
          className="px-2.5 py-1 rounded-md text-xs font-semibold text-tanzanite-700 bg-white border-2 border-tanzanite-600 hover:bg-tanzanite-50 transition-colors
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tanzanite-500 focus-visible:ring-offset-1"
        >
          Add details
        </button>
        <button
          onClick={onDismiss}
          className="p-1 rounded hover:bg-green-100 text-body/70 hover:text-body
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tanzanite-500 focus-visible:ring-offset-1"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
