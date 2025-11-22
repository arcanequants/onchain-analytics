/**
 * Authentication Modal Component
 *
 * Displays login/signup forms in a modal
 */

'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import './AuthModal.css'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultMode?: 'login' | 'signup'
}

export default function AuthModal({ isOpen, onClose, defaultMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>(defaultMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { signIn, signUp, resetPassword } = useAuth()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password)
        if (error) throw error
        onClose()
      } else if (mode === 'signup') {
        const { error } = await signUp(email, password, fullName)
        if (error) throw error
        setSuccess('Check your email for confirmation link!')
        setTimeout(() => {
          onClose()
        }, 3000)
      } else if (mode === 'reset') {
        const { error } = await resetPassword(email)
        if (error) throw error
        setSuccess('Password reset link sent to your email!')
        setTimeout(() => {
          setMode('login')
          setSuccess('')
        }, 3000)
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="auth-modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.85)',
        padding: '20px'
      }}
    >
      <div
        className="auth-modal"
        style={{
          maxHeight: '90vh',
          overflowY: 'auto',
          width: '100%',
          maxWidth: '450px',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          borderRadius: '16px',
          padding: '32px',
          position: 'relative',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="auth-modal-close" onClick={onClose}>
          ✕
        </button>

        <div className="auth-modal-header" style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#fff',
            margin: '0 0 8px 0',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            {mode === 'login' && 'Welcome Back'}
            {mode === 'signup' && 'Create Account'}
            {mode === 'reset' && 'Reset Password'}
          </h2>
          <p style={{ fontSize: '14px', color: '#888', margin: 0 }}>
            {mode === 'login' && 'Sign in to access your dashboard'}
            {mode === 'signup' && 'Get started with Onchain Analytics'}
            {mode === 'reset' && 'Enter your email to reset password'}
          </p>
        </div>

        {error && (
          <div className="auth-alert auth-alert-error">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="auth-alert auth-alert-success">
            ✅ {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {mode === 'signup' && (
            <div className="auth-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="fullName" style={{ fontSize: '14px', fontWeight: '500', color: '#aaa' }}>Full Name</label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                disabled={loading}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  fontSize: '15px',
                  color: '#fff'
                }}
              />
            </div>
          )}

          <div className="auth-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="email" style={{ fontSize: '14px', fontWeight: '500', color: '#aaa' }}>Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={loading}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '15px',
                color: '#fff'
              }}
            />
          </div>

          {mode !== 'reset' && (
            <div className="auth-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="password" style={{ fontSize: '14px', fontWeight: '500', color: '#aaa' }}>Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                disabled={loading}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  fontSize: '15px',
                  color: '#fff'
                }}
              />
            </div>
          )}

          <button
            type="submit"
            className="auth-btn auth-btn-primary"
            disabled={loading}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              border: 'none',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Sign Up' : 'Send Reset Link'}
          </button>
        </form>

        <div className="auth-footer" style={{
          marginTop: '24px',
          textAlign: 'center',
          fontSize: '14px',
          color: '#888',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {mode === 'login' && (
            <>
              <button
                type="button"
                className="auth-link"
                onClick={() => setMode('reset')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#667eea',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: 'inherit',
                  fontWeight: '500'
                }}
              >
                Forgot password?
              </button>
              <span>
                Don't have an account?{' '}
                <button
                  type="button"
                  className="auth-link"
                  onClick={() => setMode('signup')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#667eea',
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: 'inherit',
                    fontWeight: '500'
                  }}
                >
                  Sign up
                </button>
              </span>
            </>
          )}

          {mode === 'signup' && (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                className="auth-link"
                onClick={() => setMode('login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#667eea',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: 'inherit',
                  fontWeight: '500'
                }}
              >
                Sign in
              </button>
            </span>
          )}

          {mode === 'reset' && (
            <span>
              Remember your password?{' '}
              <button
                type="button"
                className="auth-link"
                onClick={() => setMode('login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#667eea',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: 'inherit',
                  fontWeight: '500'
                }}
              >
                Sign in
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
