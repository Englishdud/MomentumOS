import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

// ── Constants & Helpers ───────────────────────────────────────────────────────

const TRACK_COLORS = [
  '#6c63ff', '#ff6584', '#43e97b', '#f7971e',
  '#4facfe', '#f093fb', '#fda085', '#a8edea',
]

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d
}

function getScoreLabel(score) {
  if (score >= 90) return { text: 'Unstoppable', color: '#43e97b' }
  if (score >= 70) return { text: 'On Fire', color: '#f7971e' }
  if (score >= 50) return { text: 'Steady', color: '#4facfe' }
  if (score >= 25) return { text: 'Building Up', color: '#f093fb' }
  if (score > 0)   return { text: 'Just Starting', color: '#7b82b0' }
  return { text: 'No activity today', color: '#4a5080' }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ColorDot({ color, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-6 h-6 rounded-full transition-all ${
        selected
          ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1a1d27] scale-110'
          : 'opacity-70 hover:opacity-100'
      }`}
      style={{ backgroundColor: color }}
    />
  )
}

function ScoreRing({ score }) {
  const label = getScoreLabel(score)
  const circumference = 2 * Math.PI * 52
  const offset = circumference * (1 - score / 100)
  return (
    <div className="relative w-36 h-36 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="52" fill="none" stroke="#2e3250" strokeWidth="7" />
        <circle
          cx="60" cy="60" r="52" fill="none"
          stroke={label.color}
          strokeWidth="7" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-[#e8eaf6]">{score}</span>
        <span className="text-[10px] font-medium mt-0.5" style={{ color: label.color }}>{label.text}</span>
      </div>
    </div>
  )
}

function HabitRow({ habit, index, onDelete, onDragStart, onDrop, isDragging }) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
      onDrop={(e) => onDrop(e, index)}
      className={`flex items-center gap-3 py-2 group rounded-lg px-2 -mx-2 transition-all ${
        isDragging ? 'opacity-30' : 'hover:bg-[#22263a]/50'
      }`}
    >
      <span className="cursor-grab text-[#3d4265] hover:text-[#7b82b0] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="8" cy="4" r="2"/><circle cx="16" cy="4" r="2"/>
          <circle cx="8" cy="12" r="2"/><circle cx="16" cy="12" r="2"/>
          <circle cx="8" cy="20" r="2"/><circle cx="16" cy="20" r="2"/>
        </svg>
      </span>
      <div className="w-1.5 h-1.5 rounded-full bg-[#6c63ff]" />
      <span className="flex-1 text-sm text-[#e8eaf6]">{habit.name}</span>
      {habit.duration_minutes > 0 && (
        <span className="text-xs text-[#7b82b0]">{habit.duration_minutes} min</span>
      )}
      <button
        onClick={() => onDelete(habit.id)}
        className="opacity-0 group-hover:opacity-100 text-[#7b82b0] hover:text-red-400 transition-all p-0.5"
        aria-label="Delete habit"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

// ── Track Card ────────────────────────────────────────────────────────────────

function TrackCard({ track, habits: initialHabits, todayDone, trackStreak, onDelete, onUpdate, onStartRitual, onRefreshData }) {
  const [habits, setHabits] = useState(initialHabits)
  const [expanded, setExpanded] = useState(false)
  const [addingHabit, setAddingHabit] = useState(false)
  const [habitName, setHabitName] = useState('')
  const [habitDuration, setHabitDuration] = useState('')
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(track.name)
  const [editColor, setEditColor] = useState(track.color)
  const [editSaving, setEditSaving] = useState(false)
  const [dragIndex, setDragIndex] = useState(null)

  // Sync when parent re-fetches
  useEffect(() => {
    setHabits(initialHabits)
  }, [initialHabits])

  const totalHabits = habits.length
  const progressPct = totalHabits > 0 ? Math.round((todayDone / totalHabits) * 100) : 0
  const streakEmoji = trackStreak >= 7 ? '🔥' : trackStreak >= 3 ? '⚡' : '🌱'

  const handleAddHabit = async (e) => {
    e.preventDefault()
    if (!habitName.trim()) return
    setSaving(true)
    const { data, error } = await supabase.from('habits').insert({
      track_id: track.id,
      name: habitName.trim(),
      duration_minutes: parseInt(habitDuration) || 0,
      sort_order: habits.length,
    }).select().single()
    if (!error && data) {
      setHabits((prev) => [...prev, data])
      setHabitName('')
      setHabitDuration('')
      setAddingHabit(false)
      onRefreshData()
    }
    setSaving(false)
  }

  const handleDeleteHabit = async (habitId) => {
    await supabase.from('habits').delete().eq('id', habitId)
    setHabits((prev) => prev.filter((h) => h.id !== habitId))
    onRefreshData()
  }

  const handleEditSave = async () => {
    if (!editName.trim()) return
    setEditSaving(true)
    const { data, error } = await supabase
      .from('tracks')
      .update({ name: editName.trim(), color: editColor })
      .eq('id', track.id)
      .select()
      .single()
    if (!error && data) {
      onUpdate(data)
      setEditing(false)
    }
    setEditSaving(false)
  }

  const handleDragStart = (e, index) => {
    setDragIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === dropIndex) { setDragIndex(null); return }
    const reordered = [...habits]
    const [moved] = reordered.splice(dragIndex, 1)
    reordered.splice(dropIndex, 0, moved)
    setHabits(reordered)
    setDragIndex(null)
    await Promise.all(reordered.map((h, i) => supabase.from('habits').update({ sort_order: i }).eq('id', h.id)))
  }

  return (
    <div className="bg-[#1a1d27] border border-[#2e3250] rounded-xl overflow-hidden">
      {/* Edit mode */}
      {editing ? (
        <div className="px-5 py-4 space-y-3">
          <div className="flex gap-2">
            <input
              autoFocus
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="flex-1 bg-[#0f1117] border border-[#2e3250] rounded-lg px-3 py-1.5 text-sm text-[#e8eaf6] focus:outline-none focus:border-[#6c63ff]"
            />
            <button
              onClick={handleEditSave}
              disabled={editSaving || !editName.trim()}
              className="bg-[#6c63ff] hover:bg-[#857dff] disabled:opacity-50 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => { setEditing(false); setEditName(track.name); setEditColor(track.color) }}
              className="text-[#7b82b0] hover:text-[#e8eaf6] text-sm px-2 py-1.5 rounded-lg hover:bg-[#22263a] transition-colors"
            >
              Cancel
            </button>
          </div>
          <div className="flex gap-2">
            {TRACK_COLORS.map((c) => (
              <ColorDot key={c} color={c} selected={editColor === c} onClick={() => setEditColor(c)} />
            ))}
          </div>
        </div>
      ) : (
        /* Normal card */
        <div className="px-5 py-4">
          {/* Header row */}
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: track.color }} />
            <h3 className="flex-1 font-semibold text-[#e8eaf6] text-base truncate">{track.name}</h3>

            {/* Streak badge */}
            {trackStreak > 0 && (
              <span className="text-xs text-[#7b82b0] flex items-center gap-0.5 shrink-0">
                {streakEmoji} {trackStreak}d
              </span>
            )}

            {/* Start button */}
            {totalHabits > 0 && (
              <button
                onClick={() => onStartRitual(track, habits)}
                className="flex items-center gap-1.5 text-xs font-medium bg-[#43e97b]/15 text-[#43e97b] border border-[#43e97b]/25 px-3 py-1.5 rounded-lg hover:bg-[#43e97b]/25 transition-colors shrink-0"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Start
              </button>
            )}

            {/* Expand / collapse */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[#7b82b0] hover:text-[#e8eaf6] transition-colors p-1"
              aria-label={expanded ? 'Collapse' : 'Expand'}
            >
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Edit */}
            <button
              onClick={() => setEditing(true)}
              className="text-[#7b82b0] hover:text-[#e8eaf6] transition-colors p-1"
              aria-label="Edit track"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>

            {/* Delete */}
            <button
              onClick={() => onDelete(track.id)}
              className="text-[#7b82b0] hover:text-red-400 transition-colors p-1"
              aria-label="Delete track"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </button>
          </div>

          {/* Progress row */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-[#7b82b0]">
                {todayDone} of {totalHabits} habit{totalHabits !== 1 ? 's' : ''} done today
              </span>
              {progressPct === 100 && (
                <span className="text-[10px] text-[#43e97b] font-medium">✓ Complete</span>
              )}
            </div>
            {totalHabits > 0 ? (
              <div className="h-1.5 bg-[#22263a] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${progressPct}%`,
                    backgroundColor: progressPct === 100 ? '#43e97b' : track.color,
                  }}
                />
              </div>
            ) : (
              <p className="text-[10px] text-[#4a5080]">No habits yet — expand to add some</p>
            )}
          </div>
        </div>
      )}

      {/* Expanded habits management */}
      {expanded && !editing && (
        <div className="border-t border-[#2e3250] px-5 py-3">
          {habits.length > 1 && (
            <p className="text-[10px] text-[#3d4265] uppercase tracking-wider mb-1">Drag to reorder</p>
          )}
          {habits.length === 0 && !addingHabit && (
            <p className="text-sm text-[#4a5080] py-2">No habits yet. Add one below.</p>
          )}
          {habits.map((habit, index) => (
            <HabitRow
              key={habit.id}
              habit={habit}
              index={index}
              onDelete={handleDeleteHabit}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              isDragging={dragIndex === index}
            />
          ))}

          {addingHabit ? (
            <form onSubmit={handleAddHabit} className="mt-3 flex gap-2">
              <input
                autoFocus
                type="text"
                placeholder="Habit name"
                value={habitName}
                onChange={(e) => setHabitName(e.target.value)}
                className="flex-1 bg-[#0f1117] border border-[#2e3250] rounded-lg px-3 py-1.5 text-sm text-[#e8eaf6] placeholder-[#3d4265] focus:outline-none focus:border-[#6c63ff]"
              />
              <input
                type="number"
                placeholder="Min"
                value={habitDuration}
                onChange={(e) => setHabitDuration(e.target.value)}
                min="0"
                className="w-16 bg-[#0f1117] border border-[#2e3250] rounded-lg px-2 py-1.5 text-sm text-[#e8eaf6] placeholder-[#3d4265] focus:outline-none focus:border-[#6c63ff]"
              />
              <button
                type="submit"
                disabled={saving}
                className="bg-[#6c63ff] hover:bg-[#857dff] disabled:opacity-50 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setAddingHabit(false)}
                className="text-[#7b82b0] hover:text-[#e8eaf6] text-sm px-2 py-1.5 rounded-lg hover:bg-[#22263a] transition-colors"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              onClick={() => setAddingHabit(true)}
              className="mt-2 flex items-center gap-1.5 text-sm text-[#7b82b0] hover:text-[#6c63ff] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add habit
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main HomePanel ────────────────────────────────────────────────────────────

export default function HomePanel({ onStartRitual }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [tracks, setTracks] = useState([])
  const [trackHabitMap, setTrackHabitMap] = useState({})   // track_id → habits[]
  const [trackData, setTrackData] = useState({})            // track_id → { todayDone, trackStreak }
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [stats, setStats] = useState({ today: 0, week: 0 })
  const [showForm, setShowForm] = useState(false)
  const [trackName, setTrackName] = useState('')
  const [trackColor, setTrackColor] = useState(TRACK_COLORS[0])
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  const fetchAll = async () => {
    setLoading(true)
    const thirtyDaysAgo = daysAgo(30).toISOString()
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const weekStart = daysAgo(new Date().getDay()).toISOString()

    const [tracksRes, completions30Res, completionsTodayRes] = await Promise.all([
      supabase.from('tracks').select('*').order('created_at'),
      supabase.from('completions').select('habit_id, completed_at').eq('user_id', user.id).gte('completed_at', thirtyDaysAgo),
      supabase.from('completions').select('habit_id').eq('user_id', user.id).gte('completed_at', todayStart.toISOString()),
    ])

    const tracks = tracksRes.data ?? []
    const completions30 = completions30Res.data ?? []
    const completionsToday = completionsTodayRes.data ?? []

    // Fetch all habits for these tracks
    const trackIds = tracks.map((t) => t.id)
    const { data: habitsRaw } = trackIds.length > 0
      ? await supabase.from('habits').select('*').in('track_id', trackIds).order('sort_order')
      : { data: [] }
    const habits = habitsRaw ?? []

    // Build maps
    const habitToTrack = {}
    const habitMapByTrack = {}
    for (const h of habits) {
      habitToTrack[h.id] = h.track_id
      if (!habitMapByTrack[h.track_id]) habitMapByTrack[h.track_id] = []
      habitMapByTrack[h.track_id].push(h)
    }

    // Today's completed habit ids
    const todayHabitIds = new Set(completionsToday.map((c) => c.habit_id))

    // 30-day per-track-per-date completion sets
    const trackDateMap = {}   // track_id → { 'YYYY-MM-DD': Set<habit_id> }
    const globalDateMap = {}  // 'YYYY-MM-DD' → Set<track_id>
    for (const c of completions30) {
      const dk = dateKey(new Date(c.completed_at))
      const tid = habitToTrack[c.habit_id]
      if (!tid) continue
      if (!trackDateMap[tid]) trackDateMap[tid] = {}
      if (!trackDateMap[tid][dk]) trackDateMap[tid][dk] = new Set()
      trackDateMap[tid][dk].add(c.habit_id)
      if (!globalDateMap[dk]) globalDateMap[dk] = new Set()
      globalDateMap[dk].add(tid)
    }

    // Per-track stats
    const trackDataCalc = {}
    for (const t of tracks) {
      const tHabits = habitMapByTrack[t.id] || []
      const todayDone = tHabits.filter((h) => todayHabitIds.has(h.id)).length

      let trackStreak = 0
      for (let i = 0; i < 30; i++) {
        const dk = dateKey(daysAgo(i))
        if (i === 0 && !trackDateMap[t.id]?.[dk]) continue
        if (trackDateMap[t.id]?.[dk]?.size > 0) {
          trackStreak++
        } else {
          break
        }
      }
      trackDataCalc[t.id] = { todayDone, trackStreak }
    }

    // Global score and streak
    const todayKey = dateKey(new Date())
    const todayTracksActive = globalDateMap[todayKey]?.size ?? 0
    const totalTracks = tracks.length
    const completionPct = totalTracks > 0 ? (todayTracksActive / totalTracks) * 100 : 0

    let globalStreak = 0
    for (let i = 0; i < 30; i++) {
      const dk = dateKey(daysAgo(i))
      if (i === 0 && !globalDateMap[dk]) continue
      if (globalDateMap[dk]?.size > 0) {
        globalStreak++
      } else {
        break
      }
    }

    const streakBonus = Math.min(globalStreak * 3, 30)
    const dailyScore = Math.round(Math.min(100, completionPct * 0.7 + streakBonus))

    const todayCount = todayHabitIds.size
    const weekCount = completions30.filter((c) => c.completed_at >= weekStart).length

    setTracks(tracks)
    setTrackHabitMap(habitMapByTrack)
    setTrackData(trackDataCalc)
    setScore(dailyScore)
    setStreak(globalStreak)
    setStats({ today: todayCount, week: weekCount })
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchAll() }, [])

  const handleAddTrack = async (e) => {
    e.preventDefault()
    if (!trackName.trim()) return
    setFormError(null)
    setSaving(true)
    const { data, error } = await supabase.from('tracks').insert({
      user_id: user.id,
      name: trackName.trim(),
      color: trackColor,
    }).select().single()
    if (error) {
      setFormError(error.message)
    } else {
      setTracks((prev) => [...prev, data])
      setTrackHabitMap((prev) => ({ ...prev, [data.id]: [] }))
      setTrackData((prev) => ({ ...prev, [data.id]: { todayDone: 0, trackStreak: 0 } }))
      setTrackName('')
      setTrackColor(TRACK_COLORS[0])
      setShowForm(false)
    }
    setSaving(false)
  }

  const handleDeleteTrack = async (trackId) => {
    await supabase.from('tracks').delete().eq('id', trackId)
    setTracks((prev) => prev.filter((t) => t.id !== trackId))
  }

  const handleUpdateTrack = (updated) => {
    setTracks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
  }

  const streakEmoji = streak >= 7 ? '🔥' : streak >= 3 ? '⚡' : '🌱'

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#6c63ff] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="animate-fadeIn">
      {/* ── Score Section ──────────────────────────────────────────────── */}
      <div className="bg-[#1a1d27] border border-[#2e3250] rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-5">
          <ScoreRing score={score} />
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-[#e8eaf6] mb-1">Today's Momentum</h2>
            {/* Streak */}
            <div className="flex items-center gap-2 mb-3">
              <span>{streakEmoji}</span>
              <span className="text-sm font-semibold text-[#e8eaf6]">{streak} day streak</span>
              {streak === 0 && (
                <span className="text-xs text-[#4a5080]">– complete a habit to start</span>
              )}
            </div>
            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[#22263a] rounded-lg px-2 py-2 text-center">
                <p className="text-base font-bold text-[#6c63ff]">{stats.today}</p>
                <p className="text-[10px] text-[#7b82b0] mt-0.5">today</p>
              </div>
              <div className="bg-[#22263a] rounded-lg px-2 py-2 text-center">
                <p className="text-base font-bold text-[#43e97b]">{stats.week}</p>
                <p className="text-[10px] text-[#7b82b0] mt-0.5">this week</p>
              </div>
              <div className="bg-[#22263a] rounded-lg px-2 py-2 text-center">
                <p className="text-base font-bold text-[#f7971e]">{streak}d</p>
                <p className="text-[10px] text-[#7b82b0] mt-0.5">streak</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tracks Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-[#e8eaf6]">My Tracks</h3>
          <p className="text-xs text-[#7b82b0]">{tracks.length} track{tracks.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Track
        </button>
      </div>

      {/* New track form */}
      {showForm && (
        <div className="bg-[#1a1d27] border border-[#6c63ff]/40 rounded-xl p-5 mb-4">
          <h3 className="text-sm font-semibold text-[#e8eaf6] mb-4">Create New Track</h3>
          {formError && (
            <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-3">
              {formError}
            </div>
          )}
          <form onSubmit={handleAddTrack} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#7b82b0] mb-1.5">Track Name</label>
              <input
                autoFocus
                type="text"
                placeholder="e.g. Health & Fitness"
                value={trackName}
                onChange={(e) => setTrackName(e.target.value)}
                className="w-full bg-[#0f1117] border border-[#2e3250] rounded-lg px-4 py-2.5 text-sm text-[#e8eaf6] placeholder-[#3d4265] focus:outline-none focus:border-[#6c63ff]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#7b82b0] mb-2">Color</label>
              <div className="flex gap-2">
                {TRACK_COLORS.map((c) => (
                  <ColorDot key={c} color={c} selected={trackColor === c} onClick={() => setTrackColor(c)} />
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving || !trackName.trim()}
                className="bg-[#6c63ff] hover:bg-[#857dff] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                {saving ? 'Creating...' : 'Create Track'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setFormError(null) }}
                className="text-[#7b82b0] hover:text-[#e8eaf6] text-sm px-4 py-2 rounded-lg hover:bg-[#22263a] transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tracks list */}
      {tracks.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-14 h-14 rounded-2xl bg-[#6c63ff]/10 border border-[#6c63ff]/20 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6c63ff" strokeWidth="1.5">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>
          <p className="text-[#e8eaf6] font-medium mb-1">No tracks yet</p>
          <p className="text-sm text-[#7b82b0]">Create your first track to start building habits</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tracks.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              habits={trackHabitMap[track.id] || []}
              todayDone={trackData[track.id]?.todayDone ?? 0}
              trackStreak={trackData[track.id]?.trackStreak ?? 0}
              onDelete={handleDeleteTrack}
              onUpdate={handleUpdateTrack}
              onStartRitual={onStartRitual}
              onRefreshData={fetchAll}
            />
          ))}
        </div>
      )}
    </div>
  )
}
