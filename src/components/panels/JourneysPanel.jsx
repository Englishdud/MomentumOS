import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

// ─── Starter journey templates ──────────────────────────────────────
const JOURNEY_TEMPLATES = [
  {
    id: 'study-sprint',
    name: 'Study Sprint',
    color: '#4facfe',
    description: 'A focused 2-week study protocol to boost retention and deep work capacity.',
    habits: [
      { name: 'Review flashcards', duration_minutes: 15 },
      { name: 'Pomodoro deep-work session', duration_minutes: 25 },
      { name: 'Summarize key takeaways', duration_minutes: 10 },
      { name: 'Practice problems', duration_minutes: 20 },
      { name: 'Teach-back journaling', duration_minutes: 10 },
      { name: 'Plan tomorrow\'s topics', duration_minutes: 5 },
    ],
  },
  {
    id: 'morning-ritual',
    name: 'Morning Ritual',
    color: '#f7971e',
    description: 'A 30-day morning routine to start each day with energy, clarity, and intention.',
    habits: [
      { name: 'Hydrate — glass of water', duration_minutes: 2 },
      { name: 'Stretch or yoga flow', duration_minutes: 10 },
      { name: 'Meditation', duration_minutes: 10 },
      { name: 'Gratitude journaling', duration_minutes: 5 },
      { name: 'Cold shower', duration_minutes: 5 },
      { name: 'Healthy breakfast prep', duration_minutes: 15 },
      { name: 'Set 3 daily intentions', duration_minutes: 3 },
    ],
  },
  {
    id: 'career-growth',
    name: 'Career Growth',
    color: '#43e97b',
    description: 'A 12-week sprint to level up your professional skills and expand your network.',
    habits: [
      { name: 'Read industry article', duration_minutes: 15 },
      { name: 'Work on side project', duration_minutes: 30 },
      { name: 'LinkedIn networking outreach', duration_minutes: 10 },
      { name: 'Practice technical skills', duration_minutes: 20 },
      { name: 'Reflect on wins & lessons', duration_minutes: 5 },
    ],
  },
]

function JourneyCard({ journey, onAdd, adding }) {
  const totalMinutes = journey.habits.reduce((sum, h) => sum + h.duration_minutes, 0)

  return (
    <div className="bg-[#1a1d27] border border-[#2e3250] rounded-xl overflow-hidden">
      {/* Header stripe */}
      <div className="h-1.5" style={{ backgroundColor: journey.color }} />

      <div className="p-5">
        {/* Title row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-semibold text-[#e8eaf6] text-base">{journey.name}</h3>
            <p className="text-sm text-[#7b82b0] mt-1 leading-relaxed">{journey.description}</p>
          </div>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: journey.color + '20', border: `1px solid ${journey.color}30` }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={journey.color} strokeWidth="2">
              <path d="M3 12h18M3 6l9-3 9 3M3 18l9 3 9-3" />
            </svg>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mb-4">
          <span className="text-xs text-[#7b82b0]">
            <span className="text-[#e8eaf6] font-medium">{journey.habits.length}</span> habits
          </span>
          <span className="text-xs text-[#7b82b0]">
            <span className="text-[#e8eaf6] font-medium">{totalMinutes}</span> min/day
          </span>
        </div>

        {/* Habits list */}
        <div className="space-y-1.5 mb-5">
          {journey.habits.map((habit, i) => (
            <div key={i} className="flex items-center gap-2.5 py-1">
              <div className="w-5 h-5 rounded-md border border-[#2e3250] flex items-center justify-center text-[10px] text-[#4a5080] font-medium shrink-0">
                {i + 1}
              </div>
              <span className="flex-1 text-sm text-[#e8eaf6]">{habit.name}</span>
              <span className="text-xs text-[#4a5080]">{habit.duration_minutes}m</span>
            </div>
          ))}
        </div>

        {/* Add to My Tracks */}
        <button
          onClick={() => onAdd(journey)}
          disabled={adding === journey.id}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: journey.color + '18',
            color: journey.color,
            border: `1px solid ${journey.color}30`,
          }}
        >
          {adding === journey.id ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add to My Tracks
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default function JourneysPanel({ onNavigateToTracks }) {
  const { user } = useAuth()
  const [adding, setAdding] = useState(null) // journey id currently being added
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState(null)

  const handleAddJourney = async (journey) => {
    setAdding(journey.id)
    setError(null)
    setSuccess(null)

    // 1. Create the track
    const { data: track, error: trackErr } = await supabase
      .from('tracks')
      .insert({
        user_id: user.id,
        name: journey.name,
        color: journey.color,
      })
      .select()
      .single()

    if (trackErr) {
      setError(`Failed to create track: ${trackErr.message}`)
      setAdding(null)
      return
    }

    // 2. Clone all habits into the new track
    const habitsToInsert = journey.habits.map((h, i) => ({
      track_id: track.id,
      name: h.name,
      duration_minutes: h.duration_minutes,
      sort_order: i,
    }))

    const { error: habitsErr } = await supabase.from('habits').insert(habitsToInsert)

    if (habitsErr) {
      setError(`Track created but habits failed: ${habitsErr.message}`)
    } else {
      setSuccess(`"${journey.name}" added to your tracks!`)
    }

    setAdding(null)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#e8eaf6]">Journeys</h2>
          <p className="text-sm text-[#7b82b0] mt-0.5">Starter templates to kickstart your habits</p>
        </div>
      </div>

      {/* Success / Error banners */}
      {success && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg px-4 py-3 text-sm mb-5 flex items-center justify-between">
          <span>{success}</span>
          <button
            onClick={onNavigateToTracks}
            className="text-green-400 underline underline-offset-2 hover:text-green-300 text-sm font-medium ml-4 shrink-0"
          >
            View Tracks
          </button>
        </div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm mb-5">
          {error}
        </div>
      )}

      {/* Journey cards grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {JOURNEY_TEMPLATES.map((journey) => (
          <JourneyCard
            key={journey.id}
            journey={journey}
            onAdd={handleAddJourney}
            adding={adding}
          />
        ))}
      </div>

      {/* Info */}
      <div className="mt-8 text-center">
        <p className="text-xs text-[#4a5080]">
          Each journey creates a new track with pre-loaded habits. Customize them after adding.
        </p>
      </div>
    </div>
  )
}
