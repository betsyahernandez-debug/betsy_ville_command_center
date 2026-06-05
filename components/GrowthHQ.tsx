'use client'

import { useEffect, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'

interface MonthRow {
  month: string
  followers: number
  views: number
  reach: number
  interactions: number
  reels: number
  carousels: number
  statics: number
  stories: number
}

const GOAL = 10000
const GOAL_DATE = 'Mar 2027'
const COLORS = ['#C9A96E', '#E8C4B0', '#8FA68E', '#6B4F3A']

function parseNumber(v: string | undefined): number {
  if (!v) return 0
  return parseInt(v.replace(/[^0-9]/g, ''), 10) || 0
}

export default function GrowthHQ() {
  const [rows, setRows]     = useState<MonthRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')

  useEffect(() => {
    fetch('/api/sheets?tab=monthly_stats')
      .then(r => r.json())
      .then(json => {
        if (json.error) { setError(json.error); return }
        const raw: string[][] = json.data['Monthly Stats!A:Z'] || []
        if (raw.length < 2) return
        const headers = raw[0].map((h: string) => h.toLowerCase().trim())
        const parsed: MonthRow[] = raw.slice(1).map((row: string[]) => ({
          month:        row[headers.indexOf('month')] || '',
          followers:    parseNumber(row[headers.indexOf('followers')]),
          views:        parseNumber(row[headers.indexOf('views')]),
          reach:        parseNumber(row[headers.indexOf('reach')]),
          interactions: parseNumber(row[headers.indexOf('interactions')]),
          reels:        parseNumber(row[headers.indexOf('reels')]),
          carousels:    parseNumber(row[headers.indexOf('carousels')]),
          statics:      parseNumber(row[headers.indexOf('statics')]),
          stories:      parseNumber(row[headers.indexOf('stories')]),
        })).filter(r => r.month)
        setRows(parsed)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const latest = rows[rows.length - 1]
  const prev   = rows[rows.length - 2]

  function delta(key: keyof MonthRow) {
    if (!latest || !prev) return null
    const diff = (latest[key] as number) - (prev[key] as number)
    return diff
  }

  function fmt(n: number) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
    if (n >= 1000)    return (n / 1000).toFixed(1) + 'K'
    return n.toString()
  }

  const contentMix = latest ? [
    { name: 'Reels',     value: latest.reels },
    { name: 'Carousels', value: latest.carousels },
    { name: 'Statics',   value: latest.statics },
    { name: 'Stories',   value: latest.stories },
  ].filter(d => d.value > 0) : []

  const pctToGoal = latest ? Math.round((latest.followers / GOAL) * 100) : 0

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
          </div>
          <div style={{ flex: 1, maxWidth: 400 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.8rem', opacity: 0.8 }}>
              <span>Progress</span><span>{pctToGoal}%</span>
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
          { label: 'Followers', key: 'followers' as keyof MonthRow },
          { label: 'Views',     key: 'views'     as keyof MonthRow },
          { label: 'Reach',     key: 'reach'     as keyof MonthRow },
          { label: 'Interactions', key: 'interactions' as keyof MonthRow },
        ].map(({ label, key }) => {
          const d = delta(key)
          return (
            <div key={key} className="card">
              <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--brown-mid)', margin: '0 0 0.5rem' }}>{label}</p>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.75rem', margin: '0 0 0.25rem', color: 'var(--brown-deep)' }}>
                {latest ? fmt(latest[key] as number) : '–'}
              </p>
              {d !== null && (
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
        {/* Follower trajectory */}
        <div className="card">
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', margin: '0 0 1.25rem', color: 'var(--brown-deep)' }}>
            Follower Trajectory
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={rows} margin={{ right: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDE5D8" />
              <XAxis dataKey="month" tick={{ fontFamily: 'Jost', fontSize: 11, fill: '#6B4F3A' }} />
              <YAxis tick={{ fontFamily: 'Jost', fontSize: 11, fill: '#6B4F3A' }} tickFormatter={fmt} />
              <Tooltip
                formatter={(v) => [fmt(Number(v)), 'Followers']}
                contentStyle={{ fontFamily: 'Jost', fontSize: 12, border: '1px solid #DDD5C5', borderRadius: 8 }}
              />
              <ReferenceLine y={GOAL} stroke="#C9A96E" strokeDasharray="6 3" label={{ value: `Goal ${fmt(GOAL)}`, fill: '#C9A96E', fontSize: 11, fontFamily: 'Jost' }} />
              <Line type="monotone" dataKey="followers" stroke="#4A3728" strokeWidth={2.5} dot={{ fill: '#C9A96E', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Content mix donut */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', margin: '0 0 1rem', color: 'var(--brown-deep)', alignSelf: 'flex-start' }}>
            Content Mix
          </h3>
          {contentMix.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={contentMix} cx="50%" cy="45%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {contentMix.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontFamily: 'Jost', fontSize: 12 }} />
                <Tooltip contentStyle={{ fontFamily: 'Jost', fontSize: 12, border: '1px solid #DDD5C5', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: 'var(--brown-mid)', fontSize: '0.85rem', marginTop: '2rem' }}>No content data yet</p>
          )}
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
      <p style={{ margin: '0.75rem 0 0', fontSize: '0.8rem' }}>Check that your <code>GOOGLE_SERVICE_ACCOUNT_KEY</code> env var is set and the sheet is shared with the service account.</p>
    </div>
  )
}
