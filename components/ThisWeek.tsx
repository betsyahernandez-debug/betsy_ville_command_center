'use client'

import { useEffect, useState } from 'react'

interface Deal {
  brand: string
  type: string
  deadline: string
  status: string
  notes: string
  contact: string
}

interface WeekData {
  deals: Deal[]
  upcomingPosts: number
  unreadCollabs: number
  followerCount: number
  goal: number
}

const QUICK_ACTIONS = [
  { emoji: '📊', label: 'Check follower growth', tab: 'growth' },
  { emoji: '🗓', label: 'Review content calendar', tab: 'pipeline' },
  { emoji: '📬', label: 'Scan collab inbox', tab: 'collab' },
  { emoji: '🧱', label: 'Audit pillar balance', tab: 'pillars' },
]

export default function ThisWeek() {
  const [data, setData]     = useState<WeekData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Pull sheets + gmail in parallel
    Promise.all([
      fetch('/api/sheets?tab=monthly_stats').then(r => r.json()).catch(() => ({ error: true })),
      fetch('/api/gmail').then(r => r.json()).catch(() => ({ error: true })),
      fetch('/api/sheets?tab=pipeline').then(r => r.json()).catch(() => ({ error: true })),
    ]).then(([statsJson, gmailJson, pipelineJson]) => {
      // Parse latest follower count
      let followerCount = 0
      const statsRaw: string[][] = statsJson?.data?.['Monthly Stats!A:Z'] || []
      if (statsRaw.length >= 2) {
        const headers = statsRaw[0].map((h: string) => h.toLowerCase().trim())
        const lastRow  = statsRaw[statsRaw.length - 1]
        const fIdx     = headers.indexOf('followers')
        if (fIdx >= 0) followerCount = parseInt(lastRow[fIdx]?.replace(/[^0-9]/g, '') || '0') || 0
      }

      // Upcoming posts this week
      const pipelineRaw: string[][] = pipelineJson?.data?.['Pipeline!A:Z'] || []
      let upcomingPosts = 0
      if (pipelineRaw.length >= 2) {
        const headers = pipelineRaw[0].map((h: string) => h.toLowerCase().trim())
        const today   = new Date()
        const weekEnd = new Date(today); weekEnd.setDate(today.getDate() + 7)
        upcomingPosts = pipelineRaw.slice(1).filter(row => {
          const dateStr = row[headers.indexOf('date')] || ''
          const d = new Date(dateStr)
          return !isNaN(d.getTime()) && d >= today && d <= weekEnd
        }).length
      }

      // Unread collabs
      const msgs = gmailJson?.messages || []
      const unreadCollabs = msgs.filter((m: { labelIds: string[] }) => m.labelIds?.includes('UNREAD')).length

      setData({ deals: [], upcomingPosts, unreadCollabs, followerCount, goal: 10000 })
    }).finally(() => setLoading(false))
  }, [])

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const pctToGoal = data ? Math.round((data.followerCount / data.goal) * 100) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Date heading */}
      <div>
        <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--brown-mid)', margin: '0 0 0.25rem' }}>Today is</p>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', margin: 0, color: 'var(--brown-deep)' }}>{today}</h2>
      </div>

      {/* Snapshot row */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
          {[0,1,2].map(i => <div key={i} className="shimmer" style={{ height: 80 }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
          <SnapshotCard emoji="🎯" label="Goal progress" value={`${pctToGoal}%`} sub={`of ${(data?.goal || 10000).toLocaleString()} followers`} />
          <SnapshotCard emoji="🗓" label="Posts this week" value={String(data?.upcomingPosts ?? '–')} sub="in pipeline" />
          <SnapshotCard emoji="📬" label="Unread collabs" value={String(data?.unreadCollabs ?? '–')} sub="in last 90 days" />
        </div>
      )}

      {/* Active brand deals */}
      <div className="card">
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', margin: '0 0 1rem', color: 'var(--brown-deep)' }}>Active Brand Deals</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--brown-mid)', margin: 0 }}>
          Pull from your Collab Inbox tab to track deadlines here. (Coming in v2 — mark deals in your sheet with a <code>deadline</code> column to surface them automatically.)
        </p>
      </div>

      {/* Quick actions */}
      <div className="card">
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', margin: '0 0 1rem', color: 'var(--brown-deep)' }}>Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {QUICK_ACTIONS.map(a => (
            <div key={a.tab} style={{
              padding: '0.9rem 1rem',
              background: 'var(--parchment)',
              borderRadius: 8,
              border: '1px solid var(--cream-border)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              fontSize: '0.85rem',
              color: 'var(--brown-deep)',
              fontWeight: 500,
            }}>
              <span style={{ fontSize: '1.1rem' }}>{a.emoji}</span>
              {a.label}
            </div>
          ))}
        </div>
      </div>

      {/* Weekly affirmation */}
      <div className="card" style={{ background: 'var(--brown-deep)', color: 'var(--parchment)', border: 'none', textAlign: 'center', padding: '1.5rem 2rem' }}>
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontStyle: 'italic', margin: 0, opacity: 0.9 }}>
          "Consistency compounds. Show up for your audience the way they show up for you."
        </p>
        <p style={{ fontSize: '0.75rem', opacity: 0.5, margin: '0.5rem 0 0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>betsy_ville mantra</p>
      </div>
    </div>
  )
}

function SnapshotCard({ emoji, label, value, sub }: { emoji: string; label: string; value: string; sub: string }) {
  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{emoji}</div>
      <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--brown-mid)', margin: '0 0 0.25rem' }}>{label}</p>
      <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', margin: '0 0 0.2rem', color: 'var(--brown-deep)' }}>{value}</p>
      <p style={{ fontSize: '0.75rem', color: 'var(--brown-mid)', margin: 0 }}>{sub}</p>
    </div>
  )
}
