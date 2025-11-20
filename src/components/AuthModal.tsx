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

  const { signIn, signUp, signInWithGoogle, signInWithGitHub, resetPassword } = useAuth()

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

  const handleGoogleSignIn = async () => {
    setError('')
    setLoading(true)
    try {
      const { error } = await signInWithGoogle()
      if (error) throw error
    } catch (err: any) {
      setError(err.message || 'Google sign in failed')
      setLoading(false)
    }
  }

  const handleGitHubSignIn = async () => {
    setError('')
    setLoading(true)
    try {
      const { error } = await signInWithGitHub()
      if (error) throw error
    } catch (err: any) {
      setError(err.message || 'GitHub sign in failed')
      setLoading(false)
    }
  }

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose}>
          ✕
        </button>

        <div className="auth-modal-header">
          <h2>
            {mode === 'login' && 'Welcome Back'}
            {mode === 'signup' && 'Create Account'}
            {mode === 'reset' && 'Reset Password'}
          </h2>
          <p>
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

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'signup' && (
            <div className="auth-form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                disabled={loading}
              />
            </div>
          )}

          <div className="auth-form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={loading}
            />
          </div>

          {mode !== 'reset' && (
            <div className="auth-form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                disabled={loading}
              />
            </div>
          )}

          <button type="submit" className="auth-btn auth-btn-primary" disabled={loading}>
            {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Sign Up' : 'Send Reset Link'}
          </button>
        </form>

        {mode === 'login' && (
          <>
            <div className="auth-divider">
              <span>or continue with</span>
            </div>

            <div className="auth-social-btns">
              <button
                onClick={handleGoogleSignIn}
                className="auth-btn auth-btn-social"
                disabled={loading}
              >
                <svg width="20" height="20" viewBox="0 0 20 20">
                  <path fill="#4285F4" d="M19.6 10.23c0-.82-.1-1.42-.25-2.05H10v3.72h5.5c-.15.96-.74 2.31-2.04 3.22v2.45h3.16c1.89-1.73 2.98-4.3 2.98-7.34z"/>
                  <path fill="#34A853" d="M13.46 15.13c-.83.59-1.96 1-3.46 1-2.64 0-4.88-1.74-5.68-4.15H1.07v2.52C2.72 17.75 6.09 20 10 20c2.7 0 4.96-.89 6.62-2.42l-3.16-2.45z"/>
                  <path fill="#FBBC05" d="M3.99 10c0-.69.12-1.35.32-1.97V5.51H1.07A9.973 9.973 0 000 10c0 1.61.39 3.14 1.07 4.49l3.24-2.52c-.2-.62-.32-1.28-.32-1.97z"/>
                  <path fill="#EA4335" d="M10 3.88c1.88 0 3.13.81 3.85 1.48l2.84-2.76C14.96.99 12.7 0 10 0 6.09 0 2.72 2.25 1.07 5.51l3.24 2.52C5.12 5.62 7.36 3.88 10 3.88z"/>
                </svg>
                Google
              </button>

              <button
                onClick={handleGitHubSignIn}
                className="auth-btn auth-btn-social"
                disabled={loading}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"/>
                </svg>
                GitHub
              </button>
            </div>
          </>
        )}

        <div className="auth-footer">
          {mode === 'login' && (
            <>
              <button
                type="button"
                className="auth-link"
                onClick={() => setMode('reset')}
              >
                Forgot password?
              </button>
              <span>
                Don't have an account?{' '}
                <button
                  type="button"
                  className="auth-link"
                  onClick={() => setMode('signup')}
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
