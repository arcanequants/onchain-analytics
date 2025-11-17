'use client'

import { useState } from 'react'
import { EventType } from '@/lib/events'

export default function EventSubmissionForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'listing' as EventType,
    event_date: '',
    project_name: '',
    project_symbol: '',
    source_url: '',
    submitted_by: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/events/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit event')
      }

      setSuccess(true)
      // Reset form
      setFormData({
        title: '',
        description: '',
        event_type: 'listing',
        event_date: '',
        project_name: '',
        project_symbol: '',
        source_url: '',
        submitted_by: ''
      })

      // Close form after 3 seconds
      setTimeout(() => {
        setIsOpen(false)
        setSuccess(false)
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit event')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: 'rgba(0, 153, 255, 0.1)',
          border: '2px dashed rgba(0, 153, 255, 0.3)',
          borderRadius: '8px',
          color: '#0099ff',
          fontSize: '13px',
          fontWeight: 'bold',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(0, 153, 255, 0.2)'
          e.currentTarget.style.borderColor = 'rgba(0, 153, 255, 0.5)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(0, 153, 255, 0.1)'
          e.currentTarget.style.borderColor = 'rgba(0, 153, 255, 0.3)'
        }}
      >
        ➕ Submit Event
      </button>
    )
  }

  return (
    <div
      style={{
        padding: '16px',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}
      >
        <h3 style={{ margin: 0, fontSize: '14px', color: '#fff' }}>Submit Event</h3>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: '#999',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '0',
            width: '24px',
            height: '24px'
          }}
        >
          ×
        </button>
      </div>

      {success && (
        <div
          style={{
            padding: '12px',
            backgroundColor: 'rgba(0, 255, 136, 0.1)',
            border: '1px solid rgba(0, 255, 136, 0.3)',
            borderRadius: '4px',
            color: '#00ff88',
            fontSize: '12px',
            marginBottom: '16px'
          }}
        >
          ✅ Event submitted successfully! It will be reviewed by our team.
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '12px',
            backgroundColor: 'rgba(255, 107, 107, 0.1)',
            border: '1px solid rgba(255, 107, 107, 0.3)',
            borderRadius: '4px',
            color: '#ff6b6b',
            fontSize: '12px',
            marginBottom: '16px'
          }}
        >
          ❌ {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Event Title */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>
            Event Title *
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Bitcoin Halving 2028"
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

        {/* Project Name */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>
            Project Name *
          </label>
          <input
            type="text"
            required
            value={formData.project_name}
            onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
            placeholder="e.g., Bitcoin"
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

        {/* Project Symbol */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>
            Project Symbol
          </label>
          <input
            type="text"
            value={formData.project_symbol}
            onChange={(e) => setFormData({ ...formData, project_symbol: e.target.value.toUpperCase() })}
            placeholder="e.g., BTC"
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

        {/* Event Type */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>
            Event Type *
          </label>
          <select
            required
            value={formData.event_type}
            onChange={(e) => setFormData({ ...formData, event_type: e.target.value as EventType })}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '12px'
            }}
          >
            <option value="unlock">🔓 Token Unlock</option>
            <option value="airdrop">🪂 Airdrop</option>
            <option value="listing">📈 Listing</option>
            <option value="mainnet">🚀 Mainnet Launch</option>
            <option value="upgrade">⬆️ Network Upgrade</option>
            <option value="halving">✂️ Halving</option>
            <option value="hardfork">🍴 Hard Fork</option>
            <option value="conference">🎤 Conference</option>
          </select>
        </div>

        {/* Event Date */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>
            Event Date *
          </label>
          <input
            type="datetime-local"
            required
            value={formData.event_date}
            onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
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

        {/* Description */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Provide details about this event..."
            rows={3}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '12px',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Source URL */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>
            Source URL
          </label>
          <input
            type="url"
            value={formData.source_url}
            onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
            placeholder="https://..."
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

        {/* Your Email */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>
            Your Email *
          </label>
          <input
            type="email"
            required
            value={formData.submitted_by}
            onChange={(e) => setFormData({ ...formData, submitted_by: e.target.value })}
            placeholder="your@email.com"
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
          <div style={{ fontSize: '9px', color: '#666', marginTop: '4px' }}>
            We'll notify you when your event is reviewed
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: loading ? 'rgba(0, 153, 255, 0.3)' : 'rgba(0, 153, 255, 0.8)',
            border: 'none',
            borderRadius: '4px',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          {loading ? 'Submitting...' : 'Submit Event'}
        </button>
      </form>
    </div>
  )
}
