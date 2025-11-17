'use client'

import { useEffect, useState } from 'react'
import { CryptoEvent, EventType } from '@/lib/events'

interface EventCalendarAdvancedProps {
  defaultLimit?: number
  showFilters?: boolean
  showSearch?: boolean
}

export default function EventCalendarAdvanced({
  defaultLimit = 10,
  showFilters = true,
  showSearch = true
}: EventCalendarAdvancedProps) {
  const [events, setEvents] = useState<CryptoEvent[]>([])
  const [filteredEvents, setFilteredEvents] = useState<CryptoEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter states
  const [selectedType, setSelectedType] = useState<EventType | 'all'>('all')
  const [selectedImportance, setSelectedImportance] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/events?limit=50`)
        const result = await response.json()

        if (result.data) {
          setEvents(result.data)
          setFilteredEvents(result.data.slice(0, defaultLimit))
          setError(null)
        }
      } catch (err) {
        console.error('Error fetching events:', err)
        setError('Failed to load events')
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()

    // Refresh every 30 minutes
    const interval = setInterval(fetchEvents, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [defaultLimit])

  // Apply filters whenever filter states change
  useEffect(() => {
    let filtered = [...events]

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(e => e.event_type === selectedType)
    }

    // Filter by importance
    if (selectedImportance !== 'all') {
      filtered = filtered.filter(e => e.importance === selectedImportance)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(query) ||
        e.project_name.toLowerCase().includes(query) ||
        (e.project_symbol && e.project_symbol.toLowerCase().includes(query)) ||
        (e.description && e.description.toLowerCase().includes(query))
      )
    }

    // Limit results
    setFilteredEvents(filtered.slice(0, defaultLimit))
  }, [events, selectedType, selectedImportance, searchQuery, defaultLimit])

  // Get event type color
  const getEventTypeColor = (type: EventType): string => {
    const colors: Record<EventType, string> = {
      unlock: '#ff6b6b',
      airdrop: '#4ecdc4',
      listing: '#95e1d3',
      mainnet: '#a29bfe',
      upgrade: '#74b9ff',
      halving: '#ffeaa7',
      hardfork: '#fd79a8',
      conference: '#00b894'
    }
    return colors[type] || '#666'
  }

  // Get event type emoji
  const getEventTypeEmoji = (type: EventType): string => {
    const emojis: Record<EventType, string> = {
      unlock: '🔓',
      airdrop: '🪂',
      listing: '📈',
      mainnet: '🚀',
      upgrade: '⬆️',
      halving: '✂️',
      hardfork: '🍴',
      conference: '🎤'
    }
    return emojis[type] || '📅'
  }

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays < 7) return `In ${diffDays} days`
    if (diffDays < 0) {
      const pastDays = Math.abs(diffDays)
      if (pastDays === 1) return 'Yesterday'
      if (pastDays < 7) return `${pastDays} days ago`
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  // Get importance badge
  const getImportanceBadge = (importance: string) => {
    const badges = {
      critical: { text: 'CRITICAL', color: '#ff0000', bg: 'rgba(255, 0, 0, 0.1)' },
      high: { text: 'HIGH', color: '#ff9500', bg: 'rgba(255, 149, 0, 0.1)' },
      medium: { text: 'MED', color: '#00ff88', bg: 'rgba(0, 255, 136, 0.1)' },
      low: { text: 'LOW', color: '#666', bg: 'rgba(102, 102, 102, 0.1)' }
    }
    return badges[importance as keyof typeof badges] || badges.medium
  }

  // Export to ICS
  const exportToICS = () => {
    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Onchain Analytics//Event Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Crypto Events',
      'X-WR-TIMEZONE:UTC'
    ]

    filteredEvents.forEach(event => {
      const startDate = new Date(event.event_date)
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000) // 1 hour duration

      const formatICSDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
      }

      icsContent.push(
        'BEGIN:VEVENT',
        `UID:${event.id}@vectorialdata.com`,
        `DTSTAMP:${formatICSDate(new Date())}`,
        `DTSTART:${formatICSDate(startDate)}`,
        `DTEND:${formatICSDate(endDate)}`,
        `SUMMARY:${event.title}`,
        `DESCRIPTION:${event.description || ''}`,
        `LOCATION:${event.source_url || ''}`,
        `CATEGORIES:${event.event_type}`,
        `STATUS:${event.status === 'upcoming' ? 'CONFIRMED' : 'CANCELLED'}`,
        'END:VEVENT'
      )
    })

    icsContent.push('END:VCALENDAR')

    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'crypto-events.ics'
    link.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="analytics-block">
        <div className="analytics-title">Crypto Events</div>
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
          Loading events...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="analytics-block">
        <div className="analytics-title">Crypto Events</div>
        <div style={{ padding: '20px', textAlign: 'center', color: '#ff6b6b' }}>
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="analytics-block">
      <div className="analytics-title">
        Crypto Events
        <button
          onClick={exportToICS}
          style={{
            float: 'right',
            fontSize: '10px',
            padding: '4px 8px',
            backgroundColor: 'rgba(0, 153, 255, 0.2)',
            border: '1px solid #0099ff',
            borderRadius: '4px',
            color: '#0099ff',
            cursor: 'pointer'
          }}
        >
          📅 Export
        </button>
      </div>

      {/* Search */}
      {showSearch && (
        <div style={{ padding: '12px 12px 0 12px' }}>
          <input
            type="text"
            placeholder="Search events, projects, symbols..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '12px'
            }}
          />
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div style={{ padding: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as EventType | 'all')}
            style={{
              padding: '4px 8px',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '10px',
              flex: 1,
              minWidth: '100px'
            }}
          >
            <option value="all">All Types</option>
            <option value="unlock">🔓 Unlocks</option>
            <option value="airdrop">🪂 Airdrops</option>
            <option value="listing">📈 Listings</option>
            <option value="mainnet">🚀 Mainnet</option>
            <option value="upgrade">⬆️ Upgrades</option>
            <option value="halving">✂️ Halvings</option>
            <option value="hardfork">🍴 Hardforks</option>
            <option value="conference">🎤 Conferences</option>
          </select>

          {/* Importance Filter */}
          <select
            value={selectedImportance}
            onChange={(e) => setSelectedImportance(e.target.value)}
            style={{
              padding: '4px 8px',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '10px',
              flex: 1,
              minWidth: '100px'
            }}
          >
            <option value="all">All Importance</option>
            <option value="critical">🔴 Critical</option>
            <option value="high">🟠 High</option>
            <option value="medium">🟢 Medium</option>
            <option value="low">⚪ Low</option>
          </select>
        </div>
      )}

      {/* Events List */}
      <div style={{ padding: '0 12px 12px 12px' }}>
        {filteredEvents.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            No events found matching your filters
          </div>
        ) : (
          filteredEvents.map((event, index) => {
            const typeColor = getEventTypeColor(event.event_type)
            const emoji = getEventTypeEmoji(event.event_type)
            const badge = getImportanceBadge(event.importance)

            return (
              <div
                key={event.id || index}
                style={{
                  padding: '12px',
                  marginBottom: index < filteredEvents.length - 1 ? '8px' : '0',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  borderLeft: `3px solid ${typeColor}`,
                  cursor: event.source_url ? 'pointer' : 'default',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => {
                  if (event.source_url) {
                    window.open(event.source_url, '_blank')
                  }
                }}
                onMouseEnter={(e) => {
                  if (event.source_url) {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.3)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.2)'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#aaa' }}>
                    {formatDate(event.event_date)}
                  </div>
                  <div
                    style={{
                      fontSize: '9px',
                      fontWeight: 'bold',
                      color: badge.color,
                      backgroundColor: badge.bg,
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}
                  >
                    {badge.text}
                  </div>
                </div>

                {/* Title */}
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{emoji}</span>
                  <span>{event.title}</span>
                </div>

                {/* Project */}
                <div style={{ fontSize: '11px', color: '#888', marginBottom: event.description ? '6px' : '0' }}>
                  {event.project_name}
                  {event.project_symbol && (
                    <span style={{ color: typeColor, marginLeft: '6px' }}>
                      ${event.project_symbol}
                    </span>
                  )}
                </div>

                {/* Description */}
                {event.description && (
                  <div style={{ fontSize: '10px', color: '#999', lineHeight: '1.4', maxHeight: '40px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {event.description}
                  </div>
                )}

                {/* Type Badge */}
                <div style={{ marginTop: '8px' }}>
                  <span style={{ fontSize: '9px', color: typeColor, backgroundColor: `${typeColor}22`, padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                    {event.event_type}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '9px', color: '#666', textAlign: 'center' }}>
        Showing {filteredEvents.length} of {events.length} events
      </div>
    </div>
  )
}
