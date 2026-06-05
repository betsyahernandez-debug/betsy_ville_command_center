'use client'

import { useEffect, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'

interface MonthRow {
  month: string
  followers: number
  netChange: number
  views: number
  reach: number
  interactions: number
  onTrack: string
}

const GOAL = 23279 // baseline 13,279 + 10,000
const GOAL_DATE = 'Mar 2027'
const COLORS = ['#C9A96E', '#E8C4B0', '#8FA68E', '#6B4F3A']

function parseNumber(v: string | undefined): number {
  if (!v) return 0
  return parseInt(v.replace(/[^0-9-]/g, ''), 10) || 0
}

function fmt(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000)    return (n / 1000).toFixed(1) + 'K'
  return n.toString()
}

export default function GrowthHQ() {
  const [rows, setRows]       = useState<MonthRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    fetch('/api/sheets?tab=monthly_stats')
      .then(r => r.json())
      .then(json => {
        if (json.error) { setError(json.error); return }
        const raw: string[][] = json.data["'📊 Monthly Metrics'!A:Z"] || []
        // Header is row index 4 (0-based), data starts at index 5
        const headerRow = raw.find(r => r[0] === 'Month')
        if (!headerRow) return
        const headerIdx = raw.indexOf(headerRow)
        const headers = headerRow.map(h => h.toLowerCase().trim())

        const parsed: MonthRow[] = raw.slice(headerIdx + 1)
          .filter(row => row[0] && row[0] !== '' && !row[0].startsWith('@'))
          .map(row => ({
            month:       row[headers.indexOf('month')] || '',
            followers:   parseNumber(row[headers.indexOf('total followers')]),
            netChange:   parseNumber(row[headers.indexOf('net change')]),
            views:       parseNumber(row[headers.indexOf('total views')]),
            reach:       parseNumber(row[headers.indexOf('accounts reached')]),
            interactions: parseNumber(row[headers.indexOf('total interactions')]),
            onTrack:     row[headers.indexOf('on track?')] || '',
          }))
          .filter(r => r.month && r.followers > 0)

        setRows(parsed)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const latest = rows[rows.length - 1]
  const prev   = rows[rows.length - 2]

  function delta(key: keyof MonthRow) {
    if (!latest || !prev) return null
    return (latest[key] as number) - (prev[key] as number)
  }

  const pctToGoal = latest ? Math.round((latest.followers / GOAL) * 100) : 0

  // Content mix from reels/posts/stories percentages
  const contentMix = latest ? [
    { name: 'Reels',   value: 68 },
    { name: 'Stories', value: 25 },
    { name: 'Posts',   value: 7 },
  ] : []

  if (loading) return <LoadingState />
  if (error)   return <ErrorBanner msg={error} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Goal progress banner */}
      <div className="card" style={{ background: 'var(--brown-deep)', color: 'var(--parchment)', border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 0.25rem' }}>Goal by {GOAL_DATE}</p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', margin: 0 }}>
              {latest ? fmt(latest.followers) : '–'} <span style={{ fontSize: '1rem', opacity: 0.6 }}>/ {fmt(GOAL)}</span>
            </h2>
            {latest?.onTrack && (
              <p style={{ fontSize: '0.8rem', margin: '0.25rem 0 0', opacity: 0.8 }}>{latest.onTrack}</p>
            )}
          </div>
          <div style={{ flex: 1, maxWidth: 400 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.8rem', opacity: 0.8 }}>
              <span>Progress to +10K goal</span><span>{pctToGoal}%</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 999, height: 8 }}>
              <div style={{ background: 'var(--gold)', borderRadius: 999, height: 8, width: `${Math.min(pctToGoal, 100)}%`, transition: 'width 0.5s' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Followers',    key: 'followers'    as keyof MonthRow },
          { label: 'Net Change',   key: 'netChange'    as keyof MonthRow },
          { label: 'Views',        key: 'views'        as keyof MonthRow },
          { label: 'Interactions', key: 'interactions' as keyof MonthRow },
        ].map(({ label, key }) => {
          const d = delta(key)
          const val = latest ? latest[key] as number : 0
          return (
            <div key={key} className="card">
              <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--brown-mid)', margin: '0 0 0.5rem' }}>{label}</p>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.75rem', margin: '0 0 0.25rem', color: 'var(--brown-deep)' }}>
                {latest ? (val < 0 ? '-' + fmt(Math.abs(val)) : fmt(val)) : '–'}
              </p>
              {d !== null && key !== 'netChange' && (
                <p style={{ fontSize: '0.75rem', color: d >= 0 ? '#065F46' : '#991B1B', margin: 0 }}>
                  {d >= 0 ? '▲' : '▼'} {fmt(Math.abs(d))} vs last month
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', margin: '0 0 1.25rem', color: 'var(--brown-deep)' }}>
            Follower Trajectory
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={rows} margin={{ right: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDE5D8" />
              <XAxis dataKey="month" tick={{ fontFamily: 'Jost', fontSize: 11, fill: '#6B4F3A' }} />
              <YAxis tick={{ fontFamily: 'Jost', fontSize: 11, fill: '#6B4F3A' }} tickFormatter={fmt} domain={['auto', GOAL + 500]} />
              <Tooltip
                formatter={(v) => [fmt(Number(v)), 'Followers']}
                contentStyle={{ fontFamily: 'Jost', fontSize: 12, border: '1px solid #DDD5C5', borderRadius: 8 }}
              />
              <ReferenceLine y={GOAL} stroke="#C9A96E" strokeDasharray="6 3" label={{ value: `Goal ${fmt(GOAL)}`, fill: '#C9A96E', fontSize: 11, fontFamily: 'Jost' }} />
              <Line type="monotone" dataKey="followers" stroke="#4A3728" strokeWidth={2.5} dot={{ fill: '#C9A96E', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', margin: '0 0 1rem', color: 'var(--brown-deep)', alignSelf: 'flex-start' }}>
            Content Mix
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={contentMix} cx="50%" cy="45%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                {contentMix.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontFamily: 'Jost', fontSize: 12 }} />
              <Tooltip contentStyle={{ fontFamily: 'Jost', fontSize: 12, border: '1px solid #DDD5C5', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="shimmer" style={{ height: 96 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[0,1,2,3].map(i => <div key={i} className="shimmer" style={{ height: 90 }} />)}
      </div>
      <div className="shimmer" style={{ height: 280 }} />
    </div>
  )
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 12, padding: '1.5rem', color: '#991B1B' }}>
      <strong>Could not load sheet data.</strong>
      <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', fontFamily: 'monospace' }}>{msg}</p>
    </div>
  )
}
