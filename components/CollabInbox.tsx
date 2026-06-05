'use client'

import { useEffect, useState, useCallback } from 'react'

interface CollabThread {
  threadId: string
  from: string
  subject: string
  date: string
  lastDate: string
  snippet: string
  bucket: 'needs-reply' | 'in-progress' | 'done'
  days: number
  stale: boolean
  messageCount: number
  isUnread: boolean
}

const BUCKETS = [
  {
    id: 'needs-reply' as const,
    label: 'Needs Reply',
    emoji: '🔴',
    description: 'Unread or waiting on your response',
    border: '#FCA5A5',
    bg: '#FEF2F2',
  },
  {
    id: 'in-progress' as const,
    label: 'In Progress',
    emoji: '🟡',
    description: 'Active — deal not yet closed',
    border: '#FCD34D',
    bg: '#FFFBEB',
  },
  {
    id: 'done' as const,
    label: 'Closed',
    emoji: '✅',
    description: 'Delivered, signed, or passed',
    border: '#6EE7B7',
    bg: '#F0FDF4',
  },
]

function fmtDate(dateStr: string) {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function senderName(from: string) {
  const match = from.match(/^"?([^"<]+)"?\s*</)?.[1]
  return match ? match.trim() : from.split('@')[0]
}

export default function CollabInbox() {
  const [threads, setThreads]   = useState<CollabThread[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [moving, setMoving]     = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/gmail')
      .then(r => r.json())
      .then(json => {
        if (json.error) { setError(json.error); return }
        setThreads(json.threads || [])
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  async function moveTo(threadId: string, bucket: CollabThread['bucket']) {
    setMoving(threadId)
    await fetch('/api/gmail/label', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threadId, bucket }),
    })
    // Optimistically update UI
    setThreads(prev => prev.map(t => t.threadId === threadId ? { ...t, bucket } : t))
    setMoving(null)
  }

  if (loading) return (
    <div style={{ display: 'flex', gap: '1.5rem' }}>
      {[0,1,2].map(i => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="shimmer" style={{ height: 48 }} />
          {[0,1,2].map(j => <div key={j} className="shimmer" style={{ height: 100 }} />)}
        </div>
      ))}
    </div>
  )

  if (error) return (
    <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 12, padding: '1.5rem', color: '#991B1B' }}>
      <strong>Could not load Gmail.</strong>
      <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', fontFamily: 'monospace' }}>{error}</p>
    </div>
  )

  const staleCount = threads.filter(t => t.stale).length

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', margin: 0 }}>Collab Inbox</h2>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {staleCount > 0 && (
            <span style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 999, padding: '0.2rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, color: '#92400E' }}>
              ⚠️ {staleCount} deal{staleCount > 1 ? 's' : ''} need follow-up
            </span>
          )}
          <button onClick={load} style={{ background: 'none', border: '1px solid var(--cream-border)', borderRadius: 6, padding: '0.3rem 0.75rem', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--brown-mid)', fontFamily: "'Jost', sans-serif" }}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* 3 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', alignItems: 'start' }}>
        {BUCKETS.map(bucket => {
          const items = threads.filter(t => t.bucket === bucket.id)
          return (
            <div key={bucket.id}>
              {/* Column header */}
              <div style={{ background: bucket.bg, border: `1px solid ${bucket.border}`, borderRadius: '10px 10px 0 0', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--brown-deep)' }}>
                    {bucket.emoji} {bucket.label}
                  </span>
                  <p style={{ margin: '0.1rem 0 0', fontSize: '0.7rem', color: 'var(--brown-mid)' }}>{bucket.description}</p>
                </div>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', color: 'var(--brown-deep)', fontWeight: 700 }}>{items.length}</span>
              </div>

              {/* Cards */}
              <div style={{ border: `1px solid ${bucket.border}`, borderTop: 'none', borderRadius: '0 0 10px 10px', overflow: 'hidden' }}>
                {items.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--brown-mid)', fontSize: '0.8rem', background: 'white' }}>
                    Nothing here
                  </div>
                ) : (
                  items.map((thread, i) => (
                    <ThreadCard
                      key={thread.threadId}
                      thread={thread}
                      currentBucket={bucket.id}
                      onMoveTo={moveTo}
                      isMoving={moving === thread.threadId}
                      isLast={i === items.length - 1}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      <p style={{ fontSize: '0.7rem', color: 'var(--brown-mid)', marginTop: '1rem' }}>
        Primary inbox only · subject keyword filter · last 90 days · {threads.length} threads
      </p>
    </div>
  )
}

function ThreadCard({ thread, currentBucket, onMoveTo, isMoving, isLast }: {
  thread: CollabThread
  currentBucket: CollabThread['bucket']
  onMoveTo: (id: string, bucket: CollabThread['bucket']) => void
  isMoving: boolean
  isLast: boolean
}) {
  const NEXT_ACTIONS: Record<CollabThread['bucket'], { label: string; to: CollabThread['bucket'] }[]> = {
    'needs-reply':  [{ label: 'Mark In Progress →', to: 'in-progress' }, { label: 'Close', to: 'done' }],
    'in-progress':  [{ label: '← Needs Reply', to: 'needs-reply' }, { label: 'Close ✓', to: 'done' }],
    'done':         [{ label: '← Reopen', to: 'needs-reply' }],
  }

  return (
    <div style={{
      background: 'white',
      borderBottom: isLast ? 'none' : '1px solid var(--cream-border)',
      padding: '0.9rem 1rem',
      opacity: isMoving ? 0.5 : 1,
      transition: 'opacity 0.2s',
    }}>
      {/* Stale warning */}
      {thread.stale && (
        <div style={{ background: '#FEF3C7', borderRadius: 4, padding: '0.2rem 0.5rem', fontSize: '0.7rem', fontWeight: 600, color: '#92400E', marginBottom: '0.5rem', display: 'inline-block' }}>
          ⚠️ {thread.days}d since last activity — follow up
        </div>
      )}

      {/* Sender + date */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--brown-deep)' }}>
          {thread.isUnread && <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--brown-deep)', marginRight: 5, verticalAlign: 'middle' }} />}
          {senderName(thread.from)}
        </span>
        <span style={{ fontSize: '0.7rem', color: 'var(--brown-mid)', whiteSpace: 'nowrap' }}>
          {fmtDate(thread.lastDate)} · {thread.days}d ago
          {thread.messageCount > 1 && ` · ${thread.messageCount} msgs`}
        </span>
      </div>

      {/* Subject */}
      <p style={{ margin: '0 0 0.3rem', fontSize: '0.85rem', fontWeight: thread.isUnread ? 600 : 400, color: 'var(--brown-deep)', lineHeight: 1.3 }}>
        {thread.subject}
      </p>

      {/* Snippet */}
      <p style={{ margin: '0 0 0.75rem', fontSize: '0.75rem', color: 'var(--brown-mid)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {thread.snippet}
      </p>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <a
          href={`https://mail.google.com/mail/u/0/#thread/${thread.threadId}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: 5, border: '1px solid var(--cream-border)', color: 'var(--brown-deep)', textDecoration: 'none', background: 'var(--parchment)', fontFamily: "'Jost', sans-serif" }}
        >
          Open in Gmail →
        </a>
        {NEXT_ACTIONS[currentBucket].map(action => (
          <button
            key={action.to}
            disabled={isMoving}
            onClick={() => onMoveTo(thread.threadId, action.to)}
            style={{
              fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: 5,
              border: '1px solid var(--gold)', color: 'var(--brown-deep)',
              background: 'var(--gold-light)', cursor: 'pointer',
              fontFamily: "'Jost', sans-serif", fontWeight: 500,
            }}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  )
}
