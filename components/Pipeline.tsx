'use client'

import { useEffect, useState } from 'react'

interface ContentItem {
  date: string
  title: string
  pillar: string
  format: string
  status: string
  collab: string
  notes: string
}

const MONTHS = ['May 2026', 'June 2026', 'July 2026']
const STATUSES = ['All', 'Draft', 'Filming', 'Editing', 'Posted', 'Collab']

export default function Pipeline() {
  const [items, setItems]         = useState<ContentItem[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [monthFilter, setMonth]   = useState('June 2026')
  const [statusFilter, setStatus] = useState('All')

  useEffect(() => {
    fetch('/api/sheets?tab=pipeline')
      .then(r => r.json())
      .then(json => {
        if (json.error) { setError(json.error); return }
        const raw: string[][] = json.data['Pipeline!A:Z'] || []
        if (raw.length < 2) return
        const headers = raw[0].map((h: string) => h.toLowerCase().trim())
        const parsed: ContentItem[] = raw.slice(1).map((row: string[]) => ({
          date:   row[headers.indexOf('date')] || '',
          title:  row[headers.indexOf('title')] || row[headers.indexOf('content')] || '',
          pillar: row[headers.indexOf('pillar')] || '',
          format: row[headers.indexOf('format')] || row[headers.indexOf('type')] || '',
          status: row[headers.indexOf('status')] || 'Draft',
          collab: row[headers.indexOf('collab')] || row[headers.indexOf('brand')] || '',
          notes:  row[headers.indexOf('notes')] || '',
        })).filter(i => i.title)
        setItems(parsed)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = items.filter(item => {
    const matchMonth  = monthFilter === 'All' || (item.date && item.date.includes(monthFilter.split(' ')[0]))
      || (item.date && guessMonth(item.date) === monthFilter)
    const matchStatus = statusFilter === 'All' || item.status.toLowerCase() === statusFilter.toLowerCase()
    return matchMonth && matchStatus
  })

  if (loading) return <div className="shimmer" style={{ height: 400 }} />
  if (error)   return <div style={{ color: '#991B1B', padding: '1rem' }}>{error}</div>

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--brown-mid)', fontWeight: 500 }}>Month:</span>
        {MONTHS.map(m => (
          <button key={m} onClick={() => setMonth(m)} style={filterBtn(monthFilter === m)}>{m}</button>
        ))}
        <span style={{ fontSize: '0.8rem', color: 'var(--brown-mid)', fontWeight: 500, marginLeft: '0.5rem' }}>Status:</span>
        {STATUSES.map(s => (
          <button key={s} onClick={() => setStatus(s)} style={filterBtn(statusFilter === s)}>{s}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--brown-mid)' }}>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem' }}>Nothing here yet</p>
          <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Add content rows to the Pipeline tab in your sheet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map((item, i) => <ContentRow key={i} item={item} />)}
        </div>
      )}

      <p style={{ fontSize: '0.75rem', color: 'var(--brown-mid)', marginTop: '1.5rem' }}>
        {filtered.length} items · refreshes on page load
      </p>
    </div>
  )
}

function ContentRow({ item }: { item: ContentItem }) {
  const statusKey = item.status.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="card" style={{ display: 'grid', gridTemplateColumns: '100px 1fr auto auto', gap: '1rem', alignItems: 'center', padding: '1rem 1.25rem' }}>
      <div>
        <p style={{ fontSize: '0.75rem', color: 'var(--brown-mid)', margin: 0 }}>{item.date}</p>
        {item.format && <span style={{ fontSize: '0.7rem', background: 'var(--parchment-dark)', padding: '0.15rem 0.4rem', borderRadius: 4, color: 'var(--brown-mid)' }}>{item.format}</span>}
      </div>
      <div>
        <p style={{ margin: '0 0 0.2rem', fontWeight: 500, fontSize: '0.9rem', color: 'var(--brown-deep)' }}>{item.title}</p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {item.pillar && <span style={{ fontSize: '0.75rem', color: 'var(--brown-mid)' }}>#{item.pillar}</span>}
          {item.collab && <span style={{ fontSize: 0.75 + 'rem', color: '#6B21A8', background: '#F5D0FE', padding: '0.1rem 0.4rem', borderRadius: 4 }}>🤝 {item.collab}</span>}
        </div>
      </div>
      <span className={`tag tag-${statusKey}`}>{item.status}</span>
      {item.notes && <span title={item.notes} style={{ cursor: 'help', fontSize: '0.85rem' }}>📝</span>}
    </div>
  )
}

function filterBtn(active: boolean) {
  return {
    padding: '0.3rem 0.75rem',
    borderRadius: 999,
    border: active ? '1px solid var(--brown-deep)' : '1px solid var(--cream-border)',
    background: active ? 'var(--brown-deep)' : 'white',
    color: active ? 'var(--parchment)' : 'var(--brown-mid)',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontFamily: "'Jost', sans-serif",
    fontWeight: active ? 600 : 400,
    transition: 'all 0.15s',
  } as React.CSSProperties
}

function guessMonth(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleString('en-US', { month: 'long', year: 'numeric' })
}
