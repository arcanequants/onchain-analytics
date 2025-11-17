'use client'

import { useEffect, useState } from 'react'
import { CryptoEvent, EventType } from '@/lib/events'

interface EventCalendarProps {
  days?: number
  limit?: number
}

export default function EventCalendar({ days = 7, limit = 5 }: EventCalendarProps) {
  const [events, setEvents] = useState<CryptoEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/events?limit=${limit}`)
        const result = await response.json()

        if (result.data) {
          setEvents(result.data)
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
  }, [limit])

  // Get event type color
  const getEventTypeColor = (type: EventType): string => {
    const colors: Record<EventType, string> = {
      unlock: '#ff6b6b', // Red
      airdrop: '#4ecdc4', // Teal
      listing: '#95e1d3', // Light teal
      mainnet: '#a29bfe', // Purple
      upgrade: '#74b9ff', // Blue
      halving: '#ffeaa7', // Yellow
      hardfork: '#fd79a8', // Pink
      conference: '#00b894' // Green
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

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays < 7) return `In ${diffDays} days`

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

  if (loading) {
    return (
      <div className="analytics-block">
        <div className="analytics-title">Upcoming Events</div>
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
          Loading events...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="analytics-block">
        <div className="analytics-title">Upcoming Events</div>
        <div style={{ padding: '20px', textAlign: 'center', color: '#ff6b6b' }}>
          {error}
        </div>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="analytics-block">
        <div className="analytics-title">Upcoming Events</div>
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
          No upcoming events
        </div>
      </div>
    )
  }

  return (
    <div className="analytics-block">
      <div className="analytics-title">Upcoming Events</div>

      <div style={{ padding: '12px 0' }}>
        {events.map((event, index) => {
          const typeColor = getEventTypeColor(event.event_type)
          const emoji = getEventTypeEmoji(event.event_type)
          const badge = getImportanceBadge(event.importance)

          return (
            <div
              key={event.id || index}
              style={{
                padding: '12px',
                marginBottom: index < events.length - 1 ? '8px' : '0',
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
              {/* Header: Date and Importance */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}
              >
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

              {/* Event Title */}
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 'bold',
                  color: '#fff',
                  marginBottom: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{emoji}</span>
                <span>{event.title}</span>
              </div>

              {/* Project Info */}
              <div
                style={{
                  fontSize: '11px',
                  color: '#888',
                  marginBottom: event.description ? '6px' : '0'
                }}
              >
                {event.project_name}
                {event.project_symbol && (
                  <span style={{ color: typeColor, marginLeft: '6px' }}>
                    ${event.project_symbol}
                  </span>
                )}
              </div>

              {/* Description (truncated) */}
              {event.description && (
                <div
                  style={{
                    fontSize: '10px',
                    color: '#999',
                    lineHeight: '1.4',
                    maxHeight: '40px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}
                >
                  {event.description}
                </div>
              )}

              {/* Event Type Badge */}
              <div style={{ marginTop: '8px' }}>
                <span
                  style={{
                    fontSize: '9px',
                    color: typeColor,
                    backgroundColor: `${typeColor}22`,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    textTransform: 'uppercase',
                    fontWeight: 'bold'
                  }}
                >
                  {event.event_type}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          fontSize: '9px',
          color: '#666',
          textAlign: 'center'
        }}
      >
        Showing {events.length} upcoming event{events.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}
