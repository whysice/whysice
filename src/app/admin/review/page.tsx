'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, X, MessageSquare, Clock, Eye, ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type SuggestedEdit = {
  id: string
  user_id: string
  target_type: string
  target_id: string | null
  field_name: string | null
  current_value: string | null
  proposed_value: string
  reason: string | null
  sources: any | null
  status: string
  reviewer_notes: string | null
  reviewed_at: string | null
  created_at: string
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700',
    approved: 'bg-green-50 text-green-700',
    rejected: 'bg-red-50 text-red-700',
    revision_requested: 'bg-tanzanite-50 text-tanzanite-700',
  }
  return <span className={`badge ${styles[status] || 'bg-gray-50 text-gray-700'}`}>{status.replace('_', ' ')}</span>
}

export default function AdminReviewPage() {
  const [edits, setEdits] = useState<SuggestedEdit[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('pending')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)

  // Admin check - for now, first user is admin (you)
  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      // Simple admin check: you're the first user
      const { data } = await supabase.from('dogs').select('user_id').limit(1)
      if (data && data.length > 0 && data[0].user_id === user.id) {
        setIsAdmin(true)
      }
      setLoading(false)
    }
    checkAdmin()
  }, [])

  useEffect(() => {
    if (!isAdmin) return
    loadEdits()
  }, [isAdmin, filter])

  async function loadEdits() {
    let query = supabase
      .from('suggested_edits')
      .select('*')
      .order('created_at', { ascending: false })

    if (filter !== 'all') {
      query = query.eq('status', filter)
    }

    const { data } = await query
    setEdits(data || [])
  }

  async function handleReview(editId: string, newStatus: string) {
    await supabase
      .from('suggested_edits')
      .update({
        status: newStatus,
        reviewer_notes: reviewNotes || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', editId)

    setReviewNotes('')
    setExpandedId(null)
    await loadEdits()
  }

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

  if (!isAdmin) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-tanzanite-800 mb-2">Admin Access Required</h1>
        <p className="text-slate mb-6">This page is only accessible to site administrators.</p>
        <Link href="/dashboard" className="btn-primary inline-block">Back to Dashboard</Link>
      </div>
    )
  }

  const pendingCount = edits.filter(e => e.status === 'pending').length

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="p-2 rounded-lg hover:bg-tanzanite-50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-tanzanite-500" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-tanzanite-800">Review Queue</h1>
          <p className="text-sm text-slate">Review community-submitted content edits and additions</p>
        </div>
        {pendingCount > 0 && (
          <span className="badge bg-amber-50 text-amber-700 text-sm">{pendingCount} pending</span>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {['pending', 'approved', 'rejected', 'revision_requested', 'all'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              filter === f ? 'bg-tanzanite-500 text-white' : 'bg-tanzanite-50 text-tanzanite-600 hover:bg-tanzanite-100'
            }`}>
            {f === 'all' ? 'All' : f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Edit list */}
      {edits.length === 0 ? (
        <div className="card text-center py-12">
          <MessageSquare className="w-10 h-10 text-tanzanite-200 mx-auto mb-3" />
          <p className="text-slate text-sm">
            {filter === 'pending' ? 'No pending edits to review.' : `No ${filter} edits found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {edits.map(edit => {
            const isExpanded = expandedId === edit.id
            return (
              <div key={edit.id} className="card">
                <button onClick={() => setExpandedId(isExpanded ? null : edit.id)}
                  className="w-full text-left">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusBadge status={edit.status} />
                        <span className="badge bg-tanzanite-50 text-tanzanite-600 text-[10px]">{edit.target_type}</span>
                        {edit.field_name && (
                          <span className="text-xs text-slate">{edit.field_name}</span>
                        )}
                      </div>
                      <p className="text-sm text-body line-clamp-2">{edit.proposed_value.substring(0, 150)}...</p>
                      <p className="text-xs text-slate mt-1">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {formatDate(edit.created_at)}
                      </p>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-tanzanite-50">
                    {/* Current value */}
                    {edit.current_value && (
                      <div className="mb-3">
                        <h4 className="text-xs font-semibold text-slate uppercase mb-1">Current</h4>
                        <div className="p-2 bg-red-50/50 rounded text-xs text-body whitespace-pre-wrap">{edit.current_value}</div>
                      </div>
                    )}

                    {/* Proposed value */}
                    <div className="mb-3">
                      <h4 className="text-xs font-semibold text-slate uppercase mb-1">Proposed</h4>
                      <div className="p-2 bg-green-50/50 rounded text-xs text-body whitespace-pre-wrap">{edit.proposed_value}</div>
                    </div>

                    {/* Reason */}
                    {edit.reason && (
                      <div className="mb-3">
                        <h4 className="text-xs font-semibold text-slate uppercase mb-1">Reason</h4>
                        <p className="text-xs text-slate">{edit.reason}</p>
                      </div>
                    )}

                    {/* Sources */}
                    {edit.sources && (
                      <div className="mb-3">
                        <h4 className="text-xs font-semibold text-slate uppercase mb-1">Sources</h4>
                        <p className="text-xs text-slate">{JSON.stringify(edit.sources)}</p>
                      </div>
                    )}

                    {/* Review notes */}
                    {edit.reviewer_notes && (
                      <div className="mb-3 p-2 bg-tanzanite-50 rounded">
                        <h4 className="text-xs font-semibold text-tanzanite-600 mb-1">Your review notes</h4>
                        <p className="text-xs text-body">{edit.reviewer_notes}</p>
                      </div>
                    )}

                    {/* Action buttons (only for pending) */}
                    {edit.status === 'pending' && (
                      <div className="mt-4 space-y-3">
                        <textarea
                          value={reviewNotes}
                          onChange={e => setReviewNotes(e.target.value)}
                          placeholder="Review notes (optional)..."
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg border border-tanzanite-100 text-sm resize-none focus:border-tanzanite-500 focus:outline-none"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleReview(edit.id, 'approved')}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500 text-white text-xs font-medium hover:bg-green-600 transition-colors">
                            <Check className="w-3 h-3" /> Approve
                          </button>
                          <button onClick={() => handleReview(edit.id, 'revision_requested')}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-tanzanite-500 text-white text-xs font-medium hover:bg-tanzanite-600 transition-colors">
                            <MessageSquare className="w-3 h-3" /> Request revision
                          </button>
                          <button onClick={() => handleReview(edit.id, 'rejected')}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-medium hover:bg-red-600 transition-colors">
                            <X className="w-3 h-3" /> Reject
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
