/**
 * User Dashboard Page
 *
 * Main dashboard showing user stats and activity
 */

'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { PLAN_LIMITS, PLAN_PRICING } from '@/types/auth'
import './dashboard.css'

export default function DashboardPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!loading && !user && mounted) {
      router.push('/')
    }
  }, [user, loading, router, mounted])

  if (!mounted || loading) {
    return (
      <main className="dashboard-container">
        <div className="dashboard-loading">
          <div className="spinner"></div>
          <div>Loading your dashboard...</div>
        </div>
      </main>
    )
  }

  if (!user || !profile) {
    return null
  }

  const planLimits = PLAN_LIMITS[profile.plan_tier]
  const apiUsagePercentage = (profile.api_calls_month / planLimits.api_calls_monthly) * 100
  const dailyUsagePercentage = (profile.api_calls_today / planLimits.api_calls_daily) * 100

  return (
    <main className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Welcome back, {profile.full_name || user.email?.split('@')[0]}</h1>
          <p>Your onchain analytics dashboard</p>
        </div>
        <a href="/" className="dashboard-btn dashboard-btn-secondary">
          ← Back to Terminal
        </a>
      </div>

      {/* Stats Grid */}
      <div className="dashboard-grid">
        {/* Plan Card */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3>Current Plan</h3>
            <span className={`plan-badge plan-badge-${profile.plan_tier}`}>
              {profile.plan_tier.toUpperCase()}
            </span>
          </div>
          <div className="dashboard-card-body">
            <div className="plan-price">
              <span className="plan-price-amount">
                ${PLAN_PRICING[profile.plan_tier]}
              </span>
              <span className="plan-price-period">/month</span>
            </div>

            {profile.plan_tier === 'free' && (
              <a href="/dashboard/upgrade" className="dashboard-btn dashboard-btn-primary">
                Upgrade to Pro
              </a>
            )}

            <div className="plan-features">
              <div className="plan-feature">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                </svg>
                {planLimits.api_calls_daily.toLocaleString()} API calls/day
              </div>
              <div className="plan-feature">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                </svg>
                {planLimits.api_calls_monthly.toLocaleString()} API calls/month
              </div>
              <div className="plan-feature">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                </svg>
                {planLimits.saved_wallets === -1 ? 'Unlimited' : planLimits.saved_wallets} saved wallets
              </div>
              <div className="plan-feature">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                </svg>
                {planLimits.saved_tokens === -1 ? 'Unlimited' : planLimits.saved_tokens} saved tokens
              </div>
            </div>
          </div>
        </div>

        {/* API Usage Card */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3>API Usage</h3>
          </div>
          <div className="dashboard-card-body">
            <div className="usage-stat">
              <div className="usage-stat-label">Today</div>
              <div className="usage-stat-value">
                {profile.api_calls_today.toLocaleString()} / {planLimits.api_calls_daily.toLocaleString()}
              </div>
              <div className="usage-bar">
                <div
                  className="usage-bar-fill"
                  style={{ width: `${Math.min(dailyUsagePercentage, 100)}%` }}
                />
              </div>
            </div>

            <div className="usage-stat">
              <div className="usage-stat-label">This Month</div>
              <div className="usage-stat-value">
                {profile.api_calls_month.toLocaleString()} / {planLimits.api_calls_monthly.toLocaleString()}
              </div>
              <div className="usage-bar">
                <div
                  className="usage-bar-fill"
                  style={{ width: `${Math.min(apiUsagePercentage, 100)}%` }}
                />
              </div>
            </div>

            <a href="/dashboard/api-keys" className="dashboard-link">
              Manage API Keys →
            </a>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3>Quick Actions</h3>
          </div>
          <div className="dashboard-card-body">
            <div className="quick-actions">
              <a href="/dashboard/profile" className="quick-action">
                <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 8a3 3 0 100-6 3 3 0 000 6zm2 2H6c-2.21 0-4 1.79-4 4v1h12v-1c0-2.21-1.79-4-4-4z"/>
                </svg>
                Edit Profile
              </a>

              <a href="/dashboard/api-keys" className="quick-action">
                <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M12 1c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 3c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-7 1c-.55 0-1 .45-1 1v4h2V6c0-.55-.45-1-1-1zm6 0H7c-1.1 0-2 .9-2 2v3H3v2h2v2h2v-2h4v2h2v-2h2v-2h-2V7c0-1.1-.9-2-2-2zm0 5H7V7h4v3z"/>
                </svg>
                API Keys
              </a>

              <a href="/dashboard/watchlist" className="quick-action">
                <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 2.748l-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 01.176-.17C12.72-3.042 23.333 4.867 8 15z"/>
                </svg>
                Watchlist
              </a>

              {profile.plan_tier === 'free' && (
                <a href="/dashboard/upgrade" className="quick-action quick-action-upgrade">
                  <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z"/>
                  </svg>
                  Upgrade Plan
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
