/**
 * ULTRA SIMPLE Authentication Modal
 * Fixed: Changed from flexbox center to scrollable layout
 */

'use client'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuthModalSimple({ isOpen, onClose }: AuthModalProps) {
  if (!isOpen) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999999,
        background: 'rgba(0, 0, 0, 0.9)',
        overflowY: 'auto',
        padding: '40px 20px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '450px',
          background: '#1a1a2e',
          borderRadius: '16px',
          padding: '40px',
          position: 'relative',
          border: '2px solid #667eea',
          margin: '0 auto'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            color: '#fff',
            fontSize: '24px',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>

        {/* TEST CONTENT */}
        <div style={{ color: '#fff', textAlign: 'center' }}>
          <h2 style={{ fontSize: '32px', marginBottom: '20px', color: '#667eea' }}>
            🔍 MODAL TEST - TOP
          </h2>

          <p style={{ fontSize: '18px', marginBottom: '30px', background: '#ff0000', padding: '10px' }}>
            ⬆️ YOU SHOULD SEE THIS AT THE TOP ⬆️
          </p>

          <div style={{
            background: '#2a2a4e',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'left'
          }}>
            <p style={{ margin: '10px 0' }}>✅ Header visible</p>
            <p style={{ margin: '10px 0' }}>✅ Close button visible</p>
            <p style={{ margin: '10px 0' }}>✅ Content visible</p>
            <p style={{ margin: '10px 0' }}>✅ Buttons visible below</p>
          </div>

          <button
            style={{
              width: '100%',
              padding: '15px',
              marginBottom: '15px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            TEST BUTTON 1
          </button>

          <button
            style={{
              width: '100%',
              padding: '15px',
              marginBottom: '15px',
              background: '#4285F4',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            🔍 GOOGLE TEST
          </button>

          <button
            style={{
              width: '100%',
              padding: '15px',
              background: '#333',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            🔍 GITHUB TEST
          </button>

          <div style={{ marginTop: '30px', fontSize: '14px', color: '#888', background: '#00ff00', padding: '10px' }}>
            <p>⬇️ YOU SHOULD SEE THIS AT THE BOTTOM ⬇️</p>
            <p>If you see BOTH red box (top) and green box (bottom), scrolling works!</p>
          </div>
        </div>
      </div>
    </div>
  )
}
