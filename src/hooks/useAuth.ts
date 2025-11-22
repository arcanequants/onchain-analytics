/**
 * Authentication Hook
 *
 * Provides authentication state and methods
 */

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import type { User, Session } from '@supabase/supabase-js'
import type { UserProfile } from '@/types/auth'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)

      // Fetch user profile if authenticated
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('[useAuth] Error fetching profile:', error)
        setProfile(null)
      } else {
        setProfile(data)
      }
    } catch (error) {
      console.error('[useAuth] Error:', error)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || null,
          },
          emailRedirectTo: `${window.location.origin}/auth/verify-email`,
        },
      })

      if (error) throw error

      // Send verification email via our API
      if (data.user) {
        try {
          await fetch('/api/auth/resend-verification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          })
        } catch (emailError) {
          console.error('[useAuth] Failed to send verification email:', emailError)
          // Don't fail signup if email fails
        }
      }

      return { data, error: null }
    } catch (error: any) {
      console.error('[useAuth] Sign up error:', error)
      return { data: null, error }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      return { data, error: null }
    } catch (error: any) {
      console.error('[useAuth] Sign in error:', error)
      return { data: null, error }
    }
  }

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
      return { data, error: null }
    } catch (error: any) {
      console.error('[useAuth] Google sign in error:', error)
      return { data: null, error }
    }
  }

  const signInWithGitHub = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
      return { data, error: null }
    } catch (error: any) {
      console.error('[useAuth] GitHub sign in error:', error)
      return { data: null, error }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { error: null }
    } catch (error: any) {
      console.error('[useAuth] Sign out error:', error)
      return { error }
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error
      return { data, error: null }
    } catch (error: any) {
      console.error('[useAuth] Reset password error:', error)
      return { data: null, error }
    }
  }

  const updatePassword = async (newPassword: string) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error
      return { data, error: null }
    } catch (error: any) {
      console.error('[useAuth] Update password error:', error)
      return { data: null, error }
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { data: null, error: new Error('No user') }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      setProfile(data)
      return { data, error: null }
    } catch (error: any) {
      console.error('[useAuth] Update profile error:', error)
      return { data: null, error }
    }
  }

  const resendVerificationEmail = async (email: string) => {
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification email')
      }

      return { data, error: null }
    } catch (error: any) {
      console.error('[useAuth] Resend verification error:', error)
      return { data: null, error }
    }
  }

  return {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    resendVerificationEmail,
  }
}
