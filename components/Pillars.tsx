'use client'

import { useEffect, useState } from 'react'

interface Pillar {
  name: string
  description: string
  postCount: number
  status: string
  emoji: string
}

export default function Pillars() {
  const [pillars, setPillars] = useState<Pillar[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    fetch('/api/sheets?tab=pillars')
      .then(r => r.json())
      .then(json => {
        if (json.error) { setError(json.error); return }
        const raw: string[][] = json.data['Pillars!A:Z'] || []
        if (raw.length < 2) return
        const headers = raw[0].map((h: string) => h.toLowerCase().trim())
        const parsed: Pillar[] = raw.slice(1).map((row: string[]) => ({
          name:        row[headers.indexOf('pillar')] || row[headers.indexOf('name')] || '',
          description: row[headers.indexOf('description')] || '',
          postCount:   parseInt(row[headers.indexOf('posts')] || row[headers.indexOf('post count')] || '0') || 0,
          status:      row[headers.indexOf('status')] || 'active',
          emoji:       row[headers.indexOf('emoji')] || '✦',
        })).filter(p => p.name)
        setPillars(parsed)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
      {[0,1,2,3,4,5,6].map(i => <div key={i} className="shimmer" style={{ height: 140 }} />)}
    </div>
  )

  if (error) return <ErrorCard msg={error} />

  // Fallback static pillars if sheet doesn't have them yet
  const displayPillars: Pillar[] = pillars.length > 0 ? pillars : STATIC_PILLARS

  const total = displayPillars.reduce((s, p) => s + p.postCount, 0)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', margin: 0 }}>Content Pillars</h2>
        <span style={{ fontSize: '0.8rem', color: 'var(--brown-mid)' }}>{total} total posts tracked</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {displayPillars.map((p, i) => (
          <PillarCard key={i} pillar={p} total={total} />
        ))}
      </div>
    </div>
  )
}

function PillarCard({ pillar, total }: { pillar: Pillar; total: number }) {
  const pct = total > 0 ? Math.round((pillar.postCount / total) * 100) : 0
  const statusClass = `tag tag-${pillar.status.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0,
        width: `${pct}%`, background: 'var(--blush-light)', opacity: 0.5, transition: 'width 0.4s',
      }} />
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>{pillar.emoji}</span>
          <span className={statusClass}>{pillar.status}</span>
        </div>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.05rem', margin: '0 0 0.35rem', color: 'var(--brown-deep)' }}>
          {pillar.name}
        </h3>
        {pillar.description && (
          <p style={{ fontSize: '0.8rem', color: 'var(--brown-mid)', margin: '0 0 0.75rem', lineHeight: 1.5 }}>
            {pillar.description}
          </p>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--brown-mid)' }}>{pillar.postCount} posts</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 600 }}>{pct}% of mix</span>
        </div>
      </div>
    </div>
  )
}

function ErrorCard({ msg }: { msg: string }) {
  return (
    <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 12, padding: '1.5rem', color: '#991B1B' }}>
      <strong>Could not load pillar data.</strong>
      <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem' }}>{msg}</p>
      <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem' }}>Showing static defaults below.</p>
    </div>
  )
}

const STATIC_PILLARS: Pillar[] = [
  { emoji: '👗', name: 'OOTD / Style',        description: 'Daily outfits, styling inspo, get ready with me',                                       postCount: 0, status: 'live' },
  { emoji: '💄', name: 'Beauty & Glam',        description: 'Makeup tutorials, skin care, get ready with me',                                       postCount: 0, status: 'live' },
  { emoji: '🏡', name: 'Lifestyle & Home',     description: 'Day in the life, home decor, routines',                                                postCount: 0, status: 'live' },
  { emoji: '💼', name: 'Creator Business',     description: 'Brand deals, behind the scenes, creator tips',                                         postCount: 0, status: 'live' },
  { emoji: '💗', name: 'Big Sis Advice',       description: 'Encouragement, mindset, life lessons — big-sis energy',                               postCount: 0, status: 'growing' },
  { emoji: '🛍️', name: 'Shopping & Finds',    description: 'Hauls, Amazon finds, seasonal must-haves',                                              postCount: 0, status: 'live' },
  { emoji: '✈️', name: 'Travel & Experiences', description: 'Trips, local adventures, food spots',                                                  postCount: 0, status: 'planned' },
]
