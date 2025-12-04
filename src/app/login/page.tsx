/**
 * Login Page
 * Dedicated authentication page with email/password and OAuth
 */

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/'

  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { user, signIn, signUp, resetPassword } = useAuth()

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push(redirectTo)
    }
  }, [user, router, redirectTo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password)
        if (error) throw error
        router.push(redirectTo)
      } else if (mode === 'signup') {
        const { error } = await signUp(email, password, fullName)
        if (error) throw error
        setSuccess('Check your email for confirmation link!')
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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a0e1a 0%, #1a1a2e 100%)',
      padding: '20px'
    }}>
      {/* Background effects */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'radial-gradient(circle at 50% 50%, rgba(102, 126, 234, 0.1) 0%, transparent 50%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        width: '100%',
        maxWidth: '450px',
        background: 'rgba(15, 20, 25, 0.95)',
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Logo/Brand */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              margin: '0 0 8px 0',
              fontFamily: 'IBM Plex Mono, monospace'
            }}>
              Vectorial Data
            </h1>
          </Link>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#fff',
            margin: '0 0 8px 0'
          }}>
            {mode === 'login' && 'Welcome Back'}
            {mode === 'signup' && 'Create Account'}
            {mode === 'reset' && 'Reset Password'}
          </h2>
          <p style={{ fontSize: '14px', color: '#888', margin: 0 }}>
            {mode === 'login' && 'Sign in to access your dashboard'}
            {mode === 'signup' && 'Discover how AI perceives your brand'}
            {mode === 'reset' && 'Enter your email to reset password'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px',
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            color: '#22c55e'
          }}>
            ✅ {success}
          </div>
        )}

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Full Name (signup only) */}
          {mode === 'signup' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="fullName" style={{ fontSize: '14px', fontWeight: '500', color: '#aaa' }}>
                Full Name
              </label>
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
                  color: '#fff',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
              />
            </div>
          )}

          {/* Email */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="email" style={{ fontSize: '14px', fontWeight: '500', color: '#aaa' }}>
              Email
            </label>
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
                color: '#fff',
                outline: 'none',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
            />
          </div>

          {/* Password */}
          {mode !== 'reset' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="password" style={{ fontSize: '14px', fontWeight: '500', color: '#aaa' }}>
                Password
              </label>
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
                  color: '#fff',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              border: 'none',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
              opacity: loading ? 0.5 : 1,
              transition: 'all 0.2s'
            }}
          >
            {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Sign Up' : 'Send Reset Link'}
          </button>
        </form>

        {/* Footer Links */}
        <div style={{
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

        {/* Legal Consent Links - Required for OAuth Approval */}
        <div style={{
          marginTop: '20px',
          textAlign: 'center',
          fontSize: '12px',
          color: '#666',
          lineHeight: '1.6',
          padding: '12px 16px',
          background: 'rgba(102, 126, 234, 0.05)',
          border: '1px solid rgba(102, 126, 234, 0.1)',
          borderRadius: '8px'
        }}>
          By signing in, you agree to our{' '}
          <Link
            href="/terms"
            style={{
              color: '#667eea',
              textDecoration: 'underline',
              fontWeight: '500',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#764ba2'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#667eea'}
          >
            Terms of Service
          </Link>
          {' '}and{' '}
          <Link
            href="/privacy"
            style={{
              color: '#667eea',
              textDecoration: 'underline',
              fontWeight: '500',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#764ba2'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#667eea'}
          >
            Privacy Policy
          </Link>
          .
        </div>

        {/* Back to Home */}
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <Link
            href="/"
            style={{
              color: '#666',
              fontSize: '14px',
              textDecoration: 'none',
              transition: 'color 0.2s'
            }}
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a0e1a 0%, #1a1a2e 100%)'
      }}>
        <div style={{ color: '#fff', fontSize: '18px' }}>Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
