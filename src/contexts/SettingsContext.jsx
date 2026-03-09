/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const SettingsContext = createContext(null)

const DEFAULTS = {
  display_name: '',
  theme_color: '#6c63ff',
  dark_mode: true,
  default_duration: 10,
  reminder_time: '09:00',
}

function applyToDOM(settings) {
  document.documentElement.style.setProperty('--accent', settings.theme_color)
  if (settings.dark_mode) {
    document.documentElement.classList.add('dark')
    document.documentElement.classList.remove('light')
  } else {
    document.documentElement.classList.add('light')
    document.documentElement.classList.remove('dark')
  }
}

export function SettingsProvider({ children }) {
  const { user } = useAuth()
  const [settings, setSettings] = useState(DEFAULTS)
  // loading is true only while we have a user and are fetching their settings
  const [loading, setLoading] = useState(false)

  // Apply defaults immediately on mount
  useEffect(() => { applyToDOM(DEFAULTS) }, [])

  useEffect(() => {
    if (!user) return
    const load = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      if (data) {
        const merged = { ...DEFAULTS, ...data }
        setSettings(merged)
        applyToDOM(merged)
      }
      setLoading(false)
    }
    load()
  }, [user])

  const updateSettings = async (updates) => {
    const newSettings = { ...settings, ...updates }
    setSettings(newSettings)
    applyToDOM(newSettings)

    await supabase.from('user_settings').upsert({
      user_id: user.id,
      display_name: newSettings.display_name,
      theme_color: newSettings.theme_color,
      dark_mode: newSettings.dark_mode,
      default_duration: newSettings.default_duration,
      reminder_time: newSettings.reminder_time,
    })
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider')
  return ctx
}
