/**
 * User Menu Component
 *
 * Displays user profile and authentication controls
 */

'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import AuthModalSimple from './AuthModalSimple'
import './UserMenu.css'

export default function UserMenu() {
  const { user, profile, loading, signOut } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    setShowUserMenu(false)
  }

  if (loading) {
    return (
      <div className="user-menu-loading">
        <div className="user-menu-spinner"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <button
          className="user-menu-login-btn"
          onClick={() => setShowAuthModal(true)}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 8a3 3 0 100-6 3 3 0 000 6zm2 2H6c-2.21 0-4 1.79-4 4v1h12v-1c0-2.21-1.79-4-4-4z"/>
          </svg>
          Sign In
        </button>

        <AuthModalSimple
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </>
    )
  }

  return (
    <>
      <div className="user-menu">
        <button
          className="user-menu-trigger"
          onClick={() => setShowUserMenu(!showUserMenu)}
        >
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name || 'User'}
              className="user-menu-avatar"
            />
          ) : (
            <div className="user-menu-avatar user-menu-avatar-placeholder">
              {(profile?.full_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
            </div>
          )}

          <span className="user-menu-name">
            {profile?.full_name || user.email?.split('@')[0] || 'User'}
          </span>

          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M6 9L1 4h10L6 9z"/>
          </svg>
        </button>

        {showUserMenu && (
          <>
            <div
              className="user-menu-overlay"
              onClick={() => setShowUserMenu(false)}
            />
            <div className="user-menu-dropdown">
              <div className="user-menu-header">
                <div className="user-menu-email">{user.email}</div>
                <div className="user-menu-plan">
                  <span className={`user-menu-plan-badge user-menu-plan-${profile?.plan_tier || 'free'}`}>
                    {(profile?.plan_tier || 'free').toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="user-menu-divider" />

              <div className="user-menu-items">
                <a href="/dashboard" className="user-menu-item">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M2 2h5v5H2V2zm7 0h5v5H9V2zM2 9h5v5H2V9zm7 0h5v5H9V9z"/>
                  </svg>
                  Dashboard
                </a>

                <a href="/dashboard/profile" className="user-menu-item">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 8a3 3 0 100-6 3 3 0 000 6zm2 2H6c-2.21 0-4 1.79-4 4v1h12v-1c0-2.21-1.79-4-4-4z"/>
                  </svg>
                  Profile
                </a>

                <a href="/dashboard/api-keys" className="user-menu-item">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M12 1c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 3c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-7 1c-.55 0-1 .45-1 1v4h2V6c0-.55-.45-1-1-1zm6 0H7c-1.1 0-2 .9-2 2v3H3v2h2v2h2v-2h4v2h2v-2h2v-2h-2V7c0-1.1-.9-2-2-2zm0 5H7V7h4v3z"/>
                  </svg>
                  API Keys
                </a>

                {profile?.plan_tier === 'free' && (
                  <a href="/dashboard/upgrade" className="user-menu-item user-menu-item-upgrade">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 0l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z"/>
                    </svg>
                    Upgrade to Pro
                  </a>
                )}
              </div>

              <div className="user-menu-divider" />

              <button
                className="user-menu-item user-menu-item-signout"
                onClick={handleSignOut}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M7 13V3H5v10h2zm4-8H9v2h2V5zm0 4H9v2h2V9zm3-4h-2v2h2V5zm0 4h-2v2h2V9z"/>
                  <path d="M3 1v14h12V1H3zm11 13H4V2h10v12z"/>
                </svg>
                Sign Out
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
