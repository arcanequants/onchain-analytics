'use client'

/**
 * Email Verification Page
 *
 * This page handles email verification after user clicks link in email
 * URL format: /auth/verify-email?token=ABC123
 */

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

type VerificationStatus = 'loading' | 'success' | 'error'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<VerificationStatus>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Invalid verification link. Please check your email and try again.')
      return
    }

    verifyEmail(token)
  }, [token])

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verificationToken }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage('Your email has been verified successfully!')

        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          router.push('/dashboard')
        }, 3000)
      } else {
        setStatus('error')
        setMessage(data.error || 'Verification failed. Please try again.')
      }
    } catch (error) {
      console.error('[Verify Email] Error:', error)
      setStatus('error')
      setMessage('An error occurred during verification. Please try again.')
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
        padding: '20px',
      }}
    >
      <div
        style={{
          maxWidth: '500px',
          width: '100%',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
        }}
      >
        {status === 'loading' && (
          <>
            <div
              className="spinner"
              style={{
                width: '60px',
                height: '60px',
                border: '4px solid rgba(0, 153, 255, 0.1)',
                borderTop: '4px solid #0099ff',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 20px',
              }}
            ></div>
            <h1 style={{ color: '#fff', marginBottom: '10px', fontSize: '24px' }}>
              Verifying Email...
            </h1>
            <p style={{ color: '#aaa', fontSize: '14px' }}>
              Please wait while we verify your email address.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div
              style={{
                width: '80px',
                height: '80px',
                background: '#00d4aa',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                fontSize: '40px',
                color: 'white',
              }}
            >
              ✓
            </div>
            <h1
              style={{
                color: '#00d4aa',
                marginBottom: '10px',
                fontSize: '24px',
                fontWeight: 'bold',
              }}
            >
              Email Verified!
            </h1>
            <p style={{ color: '#aaa', marginBottom: '20px', fontSize: '14px' }}>
              {message}
            </p>
            <p style={{ color: '#888', fontSize: '13px' }}>
              Redirecting to dashboard in 3 seconds...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div
              style={{
                width: '80px',
                height: '80px',
                background: '#ff6b6b',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                fontSize: '40px',
                color: 'white',
              }}
            >
              ✕
            </div>
            <h1
              style={{
                color: '#ff6b6b',
                marginBottom: '10px',
                fontSize: '24px',
                fontWeight: 'bold',
              }}
            >
              Verification Failed
            </h1>
            <p style={{ color: '#aaa', marginBottom: '30px', fontSize: '14px' }}>
              {message}
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                href="/"
                style={{
                  display: 'inline-block',
                  background: '#0099ff',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  fontSize: '14px',
                }}
              >
                Go to Homepage
              </Link>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}
