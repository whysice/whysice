'use client'

import { useState } from 'react'
import { Download, Copy, Share2, Check, Printer, Mail } from 'lucide-react'

// ============================================
// UCD Optimization #10: Vet Prep Export Options
// Adds PDF download, copy-to-clipboard, and
// share-via-email beyond just @media print.
// ============================================

type VetPrepExportProps = {
  reportRef: React.RefObject<HTMLDivElement | null>
  dogName: string
  reportDate: string
}

export function VetPrepExport({ reportRef, dogName, reportDate }: VetPrepExportProps) {
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)

  // Copy report text to clipboard
  async function handleCopyText() {
    if (!reportRef.current) return

    const text = reportRef.current.innerText
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  // Print (leverages existing @media print CSS)
  function handlePrint() {
    window.print()
  }

  // Generate and download PDF via browser print-to-PDF
  async function handleDownloadPDF() {
    setGenerating(true)
    // Use the browser's print dialog targeting PDF
    // This is the most reliable cross-browser approach
    // without adding a heavy PDF library dependency
    setTimeout(() => {
      window.print()
      setGenerating(false)
    }, 100)
  }

  // Open email client with report text
  function handleEmailShare() {
    if (!reportRef.current) return

    const text = reportRef.current.innerText
    const subject = encodeURIComponent(`Vet Prep Report - ${dogName} (${reportDate})`)
    const body = encodeURIComponent(text)
    window.open(`mailto:?subject=${subject}&body=${body}`, '_self')
  }

  return (
    <div className="flex flex-wrap gap-2 print:hidden" aria-label="Export options">
      {/* Copy to clipboard - PRIMARY action on mobile */}
      <button
        onClick={handleCopyText}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all
          ${copied
            ? 'bg-green-100 text-green-700 border border-green-200'
            : 'bg-tanzanite-500 text-white hover:bg-tanzanite-600'
          }`}
        aria-label={copied ? 'Report copied to clipboard' : 'Copy report to clipboard'}
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        {copied ? 'Copied!' : 'Copy Report'}
      </button>

      {/* Print / PDF */}
      <button
        onClick={handlePrint}
        disabled={generating}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-ice-200 text-tanzanite-800 hover:bg-ice-300 transition-colors disabled:opacity-50"
        aria-label="Print or save as PDF"
      >
        <Printer className="w-4 h-4" />
        <span className="hidden sm:inline">Print / PDF</span>
        <span className="sm:hidden">PDF</span>
      </button>

      {/* Email */}
      <button
        onClick={handleEmailShare}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-ice-200 text-tanzanite-800 hover:bg-ice-300 transition-colors"
        aria-label="Share report via email"
      >
        <Mail className="w-4 h-4" />
        <span className="hidden sm:inline">Email to Vet</span>
        <span className="sm:hidden">Email</span>
      </button>
    </div>
  )
}
