'use client'

import { useEffect, useState } from 'react'

interface GmailMessage {
  id: string
  from: string
  subject: string
  date: string
  snippet: string
  threadId: string
  labelIds: string[]
}

const BRAND_MAP: Record<string, { label: string; color: string }> = {
  'functionhealth':  { label: 'Function Health',  color: '#DBEAFE' },
  '24hourfitness':   { label: '24 Hour Fitness',  color: '#D1FAE5' },
  'lemme':           { label: 'Lemme',             color: '#F5D0FE' },
  'tatcha':          { label: 'Tatcha',            color: '#FEF3C7' },
  'yitty':           { label: 'YITTY',             color: '#FCE7F3' },
  'sephora':         { label: 'Sephora',           color: '#FEF9C3' },
  'oliveandjune':    { label: 'Olive & June',      color: '#D1FAE5' },
  'kirkkara':        { label: 'Kirk Kara',         color: '#E0E7FF' },
  'quince':          { label: 'Quince',            color: '#FEE2E2' },
  'heather mcgarry': { label: 'Heather McGarry',  color: '#FEF3C7' },
  'jasmine valdez':  { label: 'Jasmine Valdez',   color: '#EDE9FE' },
  'kajal vitha':     { label: 'Kajal Vitha',      color: '#D1FAE5' },
}

function detectBrand(from: string, subject: string): { label: string; color: string } | null {
  const haystack = (from + ' ' + subject).toLowerCase()
  for (const [key, val] of Object.entries(BRAND_MAP)) {
    if (haystack.includes(key.replace(/\s+/g, ''))) return val
    if (haystack.includes(key)) return val
  }
  return null
}

function fmtDate(dateStr: string) {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function isUnread(labelIds: string[]) {
  return labelIds.includes('UNREAD')
}

export default function CollabInbox() {
  const [messages, setMessages] = useState<GmailMessage[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  useEffect(() => {
    fetch('/api/gmail')
      .then(r => r.json())
      .then(json => {
        if (json.error) { setError(json.error); return }
        setMessages(json.messages || [])
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {[0,1,2,3,4].map(i => <div key={i} className="shimmer" style={{ height: 80 }} />)}
    </div>
  )

  if (error) return (
    <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 12, padding: '1.5rem', color: '#991B1B' }}>
      <strong>Could not load Gmail.</strong>
      <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', fontFamily: 'monospace' }}>{error}</p>
      <p style={{ margin: '0.75rem 0 0', fontSize: '0.8rem' }}>
        Set <code>GMAIL_CLIENT_ID</code>, <code>GMAIL_CLIENT_SECRET</code>, and <code>GMAIL_REFRESH_TOKEN</code> in your Vercel environment variables.
        See the setup guide in <code>docs/gmail-oauth-setup.md</code>.
      </p>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', margin: 0 }}>Collab Inbox</h2>
        <span style={{ fontSize: '0.8rem', color: 'var(--brown-mid)' }}>
          {messages.filter(m => isUnread(m.labelIds)).length} unread · last 90 days
        </span>
      </div>

      {messages.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--brown-mid)' }}>
          <p style={{ fontFamily: "'Playfair Display', serif" }}>No collab emails found</p>
          <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Scanning inbox from known brand contacts over last 90 days.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {messages.map(msg => {
            const brand = detectBrand(msg.from, msg.subject)
            const unread = isUnread(msg.labelIds)
            return (
              <div key={msg.id} className="card" style={{
                borderLeft: `4px solid ${brand?.color || 'var(--blush)'}`,
                opacity: unread ? 1 : 0.8,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                      {unread && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--brown-deep)', display: 'inline-block', flexShrink: 0 }} />}
                      {brand && (
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, background: brand.color, padding: '0.15rem 0.5rem', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--brown-deep)' }}>
                          {brand.label}
                        </span>
                      )}
                      <span style={{ fontSize: '0.75rem', color: 'var(--brown-mid)' }}>{fmtDate(msg.date)}</span>
                    </div>
                    <p style={{ margin: '0 0 0.25rem', fontWeight: unread ? 600 : 400, fontSize: '0.9rem', color: 'var(--brown-deep)' }}>
                      {msg.subject}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--brown-mid)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '600px' }}>
                      {msg.snippet}
                    </p>
                  </div>
                  <a
                    href={`https://mail.google.com/mail/u/0/#thread/${msg.threadId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '0.3rem 0.75rem',
                      borderRadius: 6,
                      border: '1px solid var(--cream-border)',
                      fontSize: '0.75rem',
                      color: 'var(--brown-deep)',
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                      background: 'white',
                    }}
                  >
                    Open →
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
