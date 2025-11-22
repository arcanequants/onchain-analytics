'use client'

import { useState } from 'react'
import EventCalendarAdvanced from '@/components/EventCalendarAdvanced'
import EventSubmissionForm from '@/components/EventSubmissionForm'
import EventAnalyticsDashboard from '@/components/EventAnalyticsDashboard'
import Link from 'next/link'

export default function EventsPage() {
  const [activeTab, setActiveTab] = useState<'calendar' | 'analytics'>('calendar')

  return (
    <main>
      {/* Animated Background Grid */}
      <div className="bg-grid"></div>

      {/* Floating Particles */}
      <div className="particle" style={{ left: '10%', animationDelay: '0s' }}></div>
      <div className="particle" style={{ left: '25%', animationDelay: '3s' }}></div>
      <div className="particle" style={{ left: '50%', animationDelay: '6s' }}></div>
      <div className="particle" style={{ left: '75%', animationDelay: '9s' }}></div>
      <div className="particle" style={{ left: '90%', animationDelay: '12s' }}></div>

      <div className="content-layer">
        {/* Top Bar */}
        <div className="top-bar">
          <Link href="/" className="logo" style={{ cursor: 'pointer', textDecoration: 'none' }}>
            ← ONCHAIN TERMINAL
          </Link>
          <div className="top-time">CRYPTO EVENTS CALENDAR</div>
        </div>

        {/* Main Content */}
        <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ marginBottom: '20px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>
              Crypto Events Calendar
            </h1>
            <p style={{ fontSize: '14px', color: '#aaa' }}>
              Track token unlocks, airdrops, listings, mainnet launches, and more. Stay ahead of important crypto events.
            </p>
          </div>

          {/* Tabs */}
          <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '12px' }}>
            <button
              onClick={() => setActiveTab('calendar')}
              style={{
                padding: '8px 20px',
                backgroundColor: activeTab === 'calendar' ? 'rgba(0, 153, 255, 0.2)' : 'transparent',
                border: activeTab === 'calendar' ? '1px solid rgba(0, 153, 255, 0.5)' : '1px solid transparent',
                borderRadius: '6px',
                color: activeTab === 'calendar' ? '#0099ff' : '#888',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              📅 Events Calendar
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              style={{
                padding: '8px 20px',
                backgroundColor: activeTab === 'analytics' ? 'rgba(0, 153, 255, 0.2)' : 'transparent',
                border: activeTab === 'analytics' ? '1px solid rgba(0, 153, 255, 0.5)' : '1px solid transparent',
                borderRadius: '6px',
                color: activeTab === 'analytics' ? '#0099ff' : '#888',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              🤖 AI Analytics & Predictions
            </button>
          </div>

          {activeTab === 'calendar' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
              {/* Left: Event Calendar */}
              <div>
                <EventCalendarAdvanced
                  defaultLimit={20}
                  showFilters={true}
                  showSearch={true}
                />
              </div>

            {/* Right: Event Submission & Stats */}
            <div>
              {/* Event Submission Form */}
              <div style={{ marginBottom: '20px' }}>
                <EventSubmissionForm />
              </div>

              {/* Event Stats */}
              <div className="analytics-block">
                <div className="analytics-title">Event Statistics</div>
                <div style={{ padding: '12px' }}>
                  <div className="stat-row">
                    <span className="stat-label">🔓 Token Unlocks</span>
                    <span className="stat-value">Track major unlocks</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">🪂 Airdrops</span>
                    <span className="stat-value">Free token opportunities</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">📈 Listings</span>
                    <span className="stat-value">New exchange listings</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">🚀 Mainnet Launches</span>
                    <span className="stat-value">Network milestones</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">⬆️ Upgrades</span>
                    <span className="stat-value">Protocol improvements</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">🎤 Conferences</span>
                    <span className="stat-value">Industry events</span>
                  </div>
                </div>
              </div>

              {/* Data Sources */}
              <div className="analytics-block" style={{ marginTop: '20px' }}>
                <div className="analytics-title">Data Sources</div>
                <div style={{ padding: '12px', fontSize: '10px', color: '#888', lineHeight: '1.6' }}>
                  <p>Our event calendar aggregates data from:</p>
                  <ul style={{ marginLeft: '16px', marginTop: '8px' }}>
                    <li>Defillama - Token unlock schedules</li>
                    <li>CoinGecko - Trending coins & listings</li>
                    <li>Community submissions - User-contributed events</li>
                    <li>Official project announcements</li>
                  </ul>
                  <p style={{ marginTop: '12px', fontSize: '9px', color: '#666' }}>
                    All events are reviewed before being published. Submit events using the form above!
                  </p>
                </div>
              </div>

              {/* Alert Banner */}
              <div
                style={{
                  marginTop: '20px',
                  padding: '16px',
                  backgroundColor: 'rgba(0, 153, 255, 0.1)',
                  border: '1px solid rgba(0, 153, 255, 0.3)',
                  borderRadius: '8px'
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0099ff', marginBottom: '8px' }}>
                  📬 Coming Soon: Email Alerts
                </div>
                <div style={{ fontSize: '10px', color: '#aaa', lineHeight: '1.4' }}>
                  Subscribe to receive notifications about important upcoming events. Get alerts for token unlocks, airdrops, and major announcements.
                </div>
              </div>
            </div>
          </div>
          ) : (
            <EventAnalyticsDashboard />
          )}
        </div>
      </div>
    </main>
  )
}
