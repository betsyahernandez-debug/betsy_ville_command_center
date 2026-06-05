'use client'

import { useState } from 'react'
import GrowthHQ from '@/components/GrowthHQ'
import Pillars from '@/components/Pillars'
import Pipeline from '@/components/Pipeline'
import CollabInbox from '@/components/CollabInbox'
import ThisWeek from '@/components/ThisWeek'

const TABS = [
  { id: 'growth',   label: 'Growth HQ',   emoji: '📈' },
  { id: 'pillars',  label: 'Pillars',      emoji: '🧱' },
  { id: 'pipeline', label: 'Pipeline',     emoji: '🗓' },
  { id: 'collab',   label: 'Collab Inbox', emoji: '📬' },
  { id: 'week',     label: 'This Week',    emoji: '⚡' },
]

export default function Home() {
  const [activeTab, setActiveTab] = useState('growth')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--parchment)' }}>
      {/* Header */}
      <header style={{ background: 'var(--brown-deep)', color: 'var(--parchment)', padding: '1.25rem 2rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
            @betsy_ville
          </h1>
          <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.8rem', fontWeight: 300, opacity: 0.7, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Command Center
          </span>
        </div>
      </header>

      {/* Tab Bar */}
      <nav style={{ background: 'white', borderBottom: '1px solid var(--cream-border)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', padding: '0 1.5rem', gap: 0 }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.9rem 1.25rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: "'Jost', sans-serif",
                fontSize: '0.85rem',
                fontWeight: activeTab === tab.id ? 600 : 400,
                color: activeTab === tab.id ? 'var(--brown-deep)' : 'var(--brown-mid)',
                borderBottom: activeTab === tab.id ? '2px solid var(--gold)' : '2px solid transparent',
                marginBottom: '-1px',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ marginRight: '0.4rem' }}>{tab.emoji}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {activeTab === 'growth'   && <GrowthHQ />}
        {activeTab === 'pillars'  && <Pillars />}
        {activeTab === 'pipeline' && <Pipeline />}
        {activeTab === 'collab'   && <CollabInbox />}
        {activeTab === 'week'     && <ThisWeek />}
      </main>
    </div>
  )
}
