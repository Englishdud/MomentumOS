import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useSettings } from '../../contexts/SettingsContext'

const ACCENT_COLORS = [
  { label: 'Purple', color: '#6c63ff' },
  { label: 'Blue',   color: '#4facfe' },
  { label: 'Green',  color: '#43e97b' },
  { label: 'Orange', color: '#f7971e' },
  { label: 'Pink',   color: '#f093fb' },
  { label: 'Red',    color: '#ff6584' },
]

const DURATION_OPTIONS = [5, 10, 15, 20]

export default function SettingsPanel() {
  const { user, signOut } = useAuth()
  const { settings, updateSettings } = useSettings()

  const [displayName, setDisplayName] = useState(settings.display_name || '')
  const [nameSaving, setNameSaving] = useState(false)
  const [nameSaved, setNameSaved] = useState(false)

  const [passwordSent, setPasswordSent] = useState(false)
  const [passwordError, setPasswordError] = useState(null)

  const [deleteDataConfirm, setDeleteDataConfirm] = useState(false)
  const [deleteAccountConfirm, setDeleteAccountConfirm] = useState(false)
  const [actionPending, setActionPending] = useState(false)

  // ── Profile ──────────────────────────────────────────────────────────

  const handleSaveName = async () => {
    setNameSaving(true)
    await updateSettings({ display_name: displayName.trim() })
    setNameSaving(false)
    setNameSaved(true)
    setTimeout(() => setNameSaved(false), 2500)
  }

  const handleChangePassword = async () => {
    setPasswordError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(user.email)
    if (error) {
      setPasswordError(error.message)
    } else {
      setPasswordSent(true)
      setTimeout(() => setPasswordSent(false), 5000)
    }
  }

  // ── Danger zone ──────────────────────────────────────────────────────

  const handleDeleteAllData = async () => {
    setActionPending(true)
    // Delete completions, then tracks (cascades habits via FK)
    await supabase.from('completions').delete().eq('user_id', user.id)
    await supabase.from('tracks').delete().eq('user_id', user.id)
    setDeleteDataConfirm(false)
    setActionPending(false)
  }

  const handleDeleteAccount = async () => {
    setActionPending(true)
    // Attempt to call a delete_user RPC; fall back to informing the user
    const { error } = await supabase.rpc('delete_user')
    if (error) {
      alert('Account deletion requires a server-side function. Please contact support or use the Supabase dashboard.')
      setActionPending(false)
      setDeleteAccountConfirm(false)
    } else {
      await signOut()
    }
  }

  // ── Shared styles ────────────────────────────────────────────────────

  const sectionClass = 'bg-[#1a1d27] border border-[#2e3250] rounded-xl p-5 mb-4'
  const labelClass = 'block text-xs font-medium text-[#7b82b0] mb-1.5'
  const inputClass =
    'bg-[#0f1117] border border-[#2e3250] rounded-lg px-3 py-2 text-sm text-[#e8eaf6] placeholder-[#3d4265] focus:outline-none focus:border-[#6c63ff]'

  return (
    <div className="animate-fadeIn max-w-lg">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#e8eaf6]">Settings</h2>
        <p className="text-sm text-[#7b82b0] mt-0.5">Manage your profile and preferences</p>
      </div>

      {/* ── Profile ───────────────────────────────────────────────────── */}
      <section className={sectionClass}>
        <h3 className="text-sm font-semibold text-[#e8eaf6] mb-4 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7b82b0" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Profile
        </h3>

        {/* Display name */}
        <div className="mb-4">
          <label className={labelClass}>Display Name</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              placeholder="Your name"
              className={`flex-1 ${inputClass}`}
            />
            <button
              onClick={handleSaveName}
              disabled={nameSaving}
              className="text-white text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              style={{ backgroundColor: nameSaved ? '#43e97b' : 'var(--accent)' }}
            >
              {nameSaved ? 'Saved ✓' : nameSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        {/* Email (read-only) */}
        <div className="mb-4">
          <label className={labelClass}>Email</label>
          <div className={`${inputClass} cursor-not-allowed text-[#4a5080]`}>
            {user?.email}
          </div>
        </div>

        {/* Change password */}
        <div>
          <label className={labelClass}>Password</label>
          {passwordError && (
            <p className="text-xs text-red-400 mb-2">{passwordError}</p>
          )}
          {passwordSent ? (
            <p className="text-xs text-[#43e97b] py-1">Password reset email sent — check your inbox.</p>
          ) : (
            <button
              onClick={handleChangePassword}
              className="text-sm text-[#7b82b0] hover:text-[#e8eaf6] border border-[#2e3250] hover:border-[#3d4265] px-4 py-2 rounded-lg transition-colors"
            >
              Send password reset email
            </button>
          )}
        </div>
      </section>

      {/* ── Appearance ─────────────────────────────────────────────────── */}
      <section className={sectionClass}>
        <h3 className="text-sm font-semibold text-[#e8eaf6] mb-4 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7b82b0" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
          </svg>
          Appearance
        </h3>

        {/* Accent color swatches */}
        <div className="mb-5">
          <label className={labelClass}>Accent Color</label>
          <div className="flex gap-3">
            {ACCENT_COLORS.map(({ label, color }) => (
              <button
                key={color}
                onClick={() => updateSettings({ theme_color: color })}
                title={label}
                className={`w-8 h-8 rounded-full transition-all ${
                  settings.theme_color === color
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1a1d27] scale-110'
                    : 'opacity-70 hover:opacity-100 hover:scale-105'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Dark / Light mode toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[#e8eaf6]">Dark Mode</p>
            <p className="text-xs text-[#4a5080] mt-0.5">Toggle between dark and light theme</p>
          </div>
          <button
            onClick={() => updateSettings({ dark_mode: !settings.dark_mode })}
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
              settings.dark_mode ? '' : 'bg-[#3d4265]'
            }`}
            style={settings.dark_mode ? { backgroundColor: 'var(--accent)' } : {}}
            aria-label="Toggle dark mode"
          >
            <div
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                settings.dark_mode ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </section>

      {/* ── Habit Defaults ──────────────────────────────────────────────── */}
      <section className={sectionClass}>
        <h3 className="text-sm font-semibold text-[#e8eaf6] mb-4 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7b82b0" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          Habit Defaults
        </h3>

        {/* Default duration */}
        <div className="mb-4">
          <label className={labelClass}>Default Duration</label>
          <div className="flex gap-2">
            {DURATION_OPTIONS.map((min) => (
              <button
                key={min}
                onClick={() => updateSettings({ default_duration: min })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  settings.default_duration === min
                    ? 'text-white'
                    : 'bg-[#22263a] text-[#7b82b0] hover:text-[#e8eaf6] border border-[#2e3250]'
                }`}
                style={settings.default_duration === min ? { backgroundColor: 'var(--accent)' } : {}}
              >
                {min} min
              </button>
            ))}
          </div>
        </div>

        {/* Reminder time */}
        <div>
          <label className={labelClass}>Default Reminder Time</label>
          <input
            type="time"
            value={settings.reminder_time}
            onChange={(e) => updateSettings({ reminder_time: e.target.value })}
            className={inputClass}
          />
          <p className="text-[10px] text-[#4a5080] mt-1.5">Stored for future notification support</p>
        </div>
      </section>

      {/* ── Danger Zone ─────────────────────────────────────────────────── */}
      <section className="bg-[#1a1d27] border border-red-500/20 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-red-400 mb-4 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          Danger Zone
        </h3>

        {/* Delete all data */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-[#e8eaf6]">Delete All My Data</p>
            <p className="text-xs text-[#4a5080] mt-0.5">Removes all tracks, habits, and completions</p>
          </div>
          {deleteDataConfirm ? (
            <div className="flex gap-2">
              <button
                onClick={handleDeleteAllData}
                disabled={actionPending}
                className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {actionPending ? 'Deleting…' : 'Confirm'}
              </button>
              <button
                onClick={() => setDeleteDataConfirm(false)}
                className="text-xs text-[#7b82b0] border border-[#2e3250] px-3 py-1.5 rounded-lg hover:text-[#e8eaf6] transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setDeleteDataConfirm(true)}
              className="text-xs text-red-400 border border-red-500/30 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors"
            >
              Delete data
            </button>
          )}
        </div>

        {/* Delete account */}
        <div className="border-t border-red-500/10 pt-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-[#e8eaf6]">Delete Account</p>
            <p className="text-xs text-[#4a5080] mt-0.5">Permanently remove your account and all data</p>
          </div>
          {deleteAccountConfirm ? (
            <div className="flex gap-2">
              <button
                onClick={handleDeleteAccount}
                disabled={actionPending}
                className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {actionPending ? 'Deleting…' : 'Confirm'}
              </button>
              <button
                onClick={() => setDeleteAccountConfirm(false)}
                className="text-xs text-[#7b82b0] border border-[#2e3250] px-3 py-1.5 rounded-lg hover:text-[#e8eaf6] transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setDeleteAccountConfirm(true)}
              className="text-xs text-red-400 border border-red-500/30 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors"
            >
              Delete account
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
