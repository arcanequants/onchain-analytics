/**
 * Notification Settings Page
 *
 * User preferences for alerts and notifications
 *
 * Phase 2, Week 6, Day 4
 */

'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  DEFAULT_MONITORING_PREFERENCES,
  type MonitoringPreferences,
} from '@/lib/monitoring';

// ================================================================
// TOGGLE COMPONENT
// ================================================================

interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

function Toggle({
  enabled,
  onChange,
  label,
  description,
  disabled = false,
}: ToggleProps) {
  return (
    <div className="flex items-start justify-between py-4">
      <div className="flex-1">
        <label className="text-sm font-medium text-gray-900 dark:text-white">
          {label}
        </label>
        {description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => !disabled && onChange(!enabled)}
        disabled={disabled}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
          enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        role="switch"
        aria-checked={enabled}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
            enabled ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
    </div>
  );
}

// ================================================================
// THRESHOLD INPUT
// ================================================================

interface ThresholdInputProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  description: string;
  min?: number;
  max?: number;
  unit?: string;
}

function ThresholdInput({
  value,
  onChange,
  label,
  description,
  min = -100,
  max = 100,
  unit = 'points',
}: ThresholdInputProps) {
  return (
    <div className="py-4">
      <label className="block text-sm font-medium text-gray-900 dark:text-white">
        {label}
      </label>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {description}
      </p>
      <div className="mt-2 flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
        <span className="w-20 text-sm text-gray-700 dark:text-gray-300 text-right">
          {value > 0 ? `+${value}` : value} {unit}
        </span>
      </div>
    </div>
  );
}

// ================================================================
// MAIN COMPONENT
// ================================================================

export default function NotificationSettingsPage() {
  const [preferences, setPreferences] = useState<MonitoringPreferences>({
    ...DEFAULT_MONITORING_PREFERENCES,
    userId: 'currentUser',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const updatePreference = <K extends keyof MonitoringPreferences>(
    key: K,
    value: MonitoringPreferences[K]
  ) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // In production, save to API
      // await fetch('/api/settings/notifications', {
      //   method: 'PUT',
      //   body: JSON.stringify(preferences),
      // });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSaved(true);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Notification Settings
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Configure how and when you receive alerts about your AI perception
            scores.
          </p>
        </div>

        {/* Notification Channels */}
        <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Notification Channels
          </h2>

          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            <Toggle
              enabled={preferences.emailAlerts}
              onChange={(v) => updatePreference('emailAlerts', v)}
              label="Email Alerts"
              description="Receive important alerts via email"
            />

            <Toggle
              enabled={preferences.inAppAlerts}
              onChange={(v) => updatePreference('inAppAlerts', v)}
              label="In-App Notifications"
              description="Show alerts in the notification center"
            />

            <Toggle
              enabled={preferences.weeklyDigest}
              onChange={(v) => updatePreference('weeklyDigest', v)}
              label="Weekly Digest"
              description="Receive a weekly summary of your AI perception scores"
            />
          </div>
        </section>

        {/* Alert Types */}
        <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Alert Types
          </h2>

          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            <Toggle
              enabled={preferences.alertOnScoreDrop}
              onChange={(v) => updatePreference('alertOnScoreDrop', v)}
              label="Score Drop Alerts"
              description="Get notified when your score decreases significantly"
            />

            {preferences.alertOnScoreDrop && (
              <ThresholdInput
                value={preferences.scoreDropThreshold}
                onChange={(v) => updatePreference('scoreDropThreshold', v)}
                label="Score Drop Threshold"
                description="Alert me when score drops by at least this many points"
                min={-50}
                max={-1}
              />
            )}

            <Toggle
              enabled={preferences.alertOnScoreIncrease}
              onChange={(v) => updatePreference('alertOnScoreIncrease', v)}
              label="Score Increase Alerts"
              description="Get notified when your score improves significantly"
            />

            {preferences.alertOnScoreIncrease && (
              <ThresholdInput
                value={preferences.scoreIncreaseThreshold}
                onChange={(v) => updatePreference('scoreIncreaseThreshold', v)}
                label="Score Increase Threshold"
                description="Alert me when score increases by at least this many points"
                min={1}
                max={50}
              />
            )}

            <Toggle
              enabled={preferences.alertOnNewMention}
              onChange={(v) => updatePreference('alertOnNewMention', v)}
              label="New Mention Alerts"
              description="Get notified when AI starts mentioning your brand"
            />

            <Toggle
              enabled={preferences.alertOnLostMention}
              onChange={(v) => updatePreference('alertOnLostMention', v)}
              label="Lost Mention Alerts"
              description="Get notified when AI stops mentioning your brand"
            />
          </div>
        </section>

        {/* Quiet Hours */}
        <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quiet Hours
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Pause email notifications during these hours (local time).
          </p>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start
              </label>
              <select
                value={preferences.quietHoursStart ?? ''}
                onChange={(e) =>
                  updatePreference(
                    'quietHoursStart',
                    e.target.value ? parseInt(e.target.value, 10) : null
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Off</option>
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </div>

            <span className="pt-6 text-gray-500">to</span>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End
              </label>
              <select
                value={preferences.quietHoursEnd ?? ''}
                onChange={(e) =>
                  updatePreference(
                    'quietHoursEnd',
                    e.target.value ? parseInt(e.target.value, 10) : null
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Off</option>
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Timezone */}
        <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Timezone
          </h2>

          <select
            value={preferences.timezone}
            onChange={(e) => updatePreference('timezone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="UTC">UTC</option>
            <option value="America/New_York">Eastern Time (ET)</option>
            <option value="America/Chicago">Central Time (CT)</option>
            <option value="America/Denver">Mountain Time (MT)</option>
            <option value="America/Los_Angeles">Pacific Time (PT)</option>
            <option value="Europe/London">London (GMT)</option>
            <option value="Europe/Paris">Paris (CET)</option>
            <option value="Asia/Tokyo">Tokyo (JST)</option>
          </select>
        </section>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-4">
          {saved && (
            <span className="text-sm text-green-600 dark:text-green-400">
              Settings saved successfully!
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              'px-6 py-2 rounded-lg font-medium transition-colors',
              'bg-blue-600 text-white hover:bg-blue-700',
              isSaving && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
