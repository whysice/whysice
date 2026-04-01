'use client'

import { type ReactNode, type ElementType } from 'react'

// ============================================
// UCD Optimization #6: Contextual Empty States
// Adds motivating context to empty states to
// explain WHY tracking is valuable, not just
// what's missing.
// ============================================

type EmptyStateProps = {
  icon: ElementType
  title?: string
  message: string
  motivation?: string
  action?: ReactNode
}

const EMPTY_STATE_CONTENT = {
  symptoms: {
    title: 'No symptoms logged yet',
    message: 'Start tracking symptoms to spot patterns your vet can use.',
    motivation: 'Logging symptoms helps identify triggers and measure whether treatments are working over time.',
  },
  treatments: {
    title: 'No treatments logged yet',
    message: 'Record medications and therapies to build a treatment history.',
    motivation: 'A clear treatment timeline helps your vet see what has been tried, what worked, and what to adjust.',
  },
  visits: {
    title: 'No vet visits recorded',
    message: 'Log vet visits to keep your visit history in one place.',
    motivation: 'Having visit history readily available means less time filling out forms and more time discussing care.',
  },
  documents: {
    title: 'No documents uploaded yet',
    message: 'Upload vet records, lab results, or photos to keep everything organized.',
    motivation: 'Having documents linked to visits and treatments gives your vet a complete picture at every appointment.',
  },
  search: {
    title: 'No results found',
    message: 'No documents match your search.',
    motivation: undefined,
  },
}

export function EmptyState({ icon: Icon, title, message, motivation, action }: EmptyStateProps) {
  return (
    <div className="card text-center py-12 px-6">
      <Icon className="w-10 h-10 text-tanzanite-200 mx-auto mb-3" />
      {title && <p className="text-sm font-medium text-body mb-1">{title}</p>}
      <p className="text-sm text-slate mb-1">{message}</p>
      {motivation && (
        <p className="text-xs text-slate/70 max-w-xs mx-auto mb-4 leading-relaxed">
          {motivation}
        </p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}

// Convenience presets
export function SymptomsEmptyState({ action }: { action?: ReactNode }) {
  return <EmptyState icon={require('lucide-react').Activity} {...EMPTY_STATE_CONTENT.symptoms} action={action} />
}

export function TreatmentsEmptyState({ action }: { action?: ReactNode }) {
  return <EmptyState icon={require('lucide-react').Pill} {...EMPTY_STATE_CONTENT.treatments} action={action} />
}

export function VisitsEmptyState({ action }: { action?: ReactNode }) {
  return <EmptyState icon={require('lucide-react').Calendar} {...EMPTY_STATE_CONTENT.visits} action={action} />
}

export function DocumentsEmptyState({ action }: { action?: ReactNode }) {
  return <EmptyState icon={require('lucide-react').FileText} {...EMPTY_STATE_CONTENT.documents} action={action} />
}

export { EMPTY_STATE_CONTENT }
