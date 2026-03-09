import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const TRACK_COLORS = [
  '#6c63ff', '#ff6584', '#43e97b', '#f7971e',
  '#4facfe', '#f093fb', '#fda085', '#a8edea',
]

function ColorDot({ color, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-6 h-6 rounded-full transition-all ${selected ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1a1d27] scale-110' : 'opacity-70 hover:opacity-100'}`}
      style={{ backgroundColor: color }}
    />
  )
}

// ─── Draggable habit row ────────────────────────────────────────────
function HabitRow({ habit, index, onDelete, onDragStart, onDragOver, onDrop, isDragging }) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      className={`flex items-center gap-3 py-2 group rounded-lg px-2 -mx-2 transition-all ${isDragging ? 'opacity-30 bg-[#6c63ff]/5' : 'hover:bg-[#22263a]/50'}`}
    >
      {/* Drag handle */}
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

// ─── Track Card ─────────────────────────────────────────────────────
function TrackCard({ track, onDelete, onUpdate, onStartRitual }) {
  const [habits, setHabits] = useState([])
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [addingHabit, setAddingHabit] = useState(false)
  const [habitName, setHabitName] = useState('')
  const [habitDuration, setHabitDuration] = useState('')
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(track.name)
  const [editColor, setEditColor] = useState(track.color)
  const [editSaving, setEditSaving] = useState(false)
  const [dragIndex, setDragIndex] = useState(null)

  useEffect(() => {
    if (expanded) fetchHabits()
  }, [expanded])

  const fetchHabits = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('habits')
      .select('*')
      .eq('track_id', track.id)
      .order('sort_order')
    setHabits(data ?? [])
    setLoading(false)
  }

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
    }
    setSaving(false)
  }

  const handleDeleteHabit = async (habitId) => {
    await supabase.from('habits').delete().eq('id', habitId)
    setHabits((prev) => prev.filter((h) => h.id !== habitId))
  }

  // ── Edit track ──
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

  // ── Drag-to-reorder ──
  const handleDragStart = (e, index) => {
    setDragIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null)
      return
    }
    const reordered = [...habits]
    const [moved] = reordered.splice(dragIndex, 1)
    reordered.splice(dropIndex, 0, moved)
    // Optimistic update
    setHabits(reordered)
    setDragIndex(null)
    // Persist new sort_order for all affected habits
    const updates = reordered.map((h, i) =>
      supabase.from('habits').update({ sort_order: i }).eq('id', h.id)
    )
    await Promise.all(updates)
  }

  return (
    <div className="bg-[#1a1d27] border border-[#2e3250] rounded-xl overflow-hidden">
      {/* Track header */}
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
        <div className="flex items-center gap-3 px-5 py-4">
          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: track.color }} />
          <h3 className="flex-1 font-semibold text-[#e8eaf6] text-base">{track.name}</h3>
          {/* Start ritual */}
          {expanded && habits.length > 0 && (
            <button
              onClick={() => onStartRitual(track, habits)}
              className="flex items-center gap-1.5 text-xs font-medium bg-[#43e97b]/15 text-[#43e97b] border border-[#43e97b]/25 px-3 py-1.5 rounded-lg hover:bg-[#43e97b]/25 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Start
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-[#7b82b0] hover:text-[#e8eaf6] flex items-center gap-1 transition-colors"
          >
            {expanded ? 'Collapse' : 'Expand'}
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {/* Edit button */}
          <button
            onClick={() => { setEditing(true); setEditName(track.name); setEditColor(track.color) }}
            className="text-[#7b82b0] hover:text-[#e8eaf6] transition-colors p-1"
            aria-label="Edit track"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          {/* Delete button */}
          <button
            onClick={() => onDelete(track.id)}
            className="text-[#7b82b0] hover:text-red-400 transition-colors p-1"
            aria-label="Delete track"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </button>
        </div>
      )}

      {/* Expanded habits */}
      {expanded && !editing && (
        <div className="border-t border-[#2e3250] px-5 py-3">
          {loading ? (
            <div className="py-4 flex justify-center">
              <div className="w-5 h-5 border-2 border-[#6c63ff] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {habits.length === 0 && !addingHabit && (
                <p className="text-sm text-[#4a5080] py-2">No habits yet. Add one below.</p>
              )}
              {habits.length > 1 && (
                <p className="text-[10px] text-[#3d4265] uppercase tracking-wider mb-1">Drag to reorder</p>
              )}
              {habits.map((habit, index) => (
                <HabitRow
                  key={habit.id}
                  habit={habit}
                  index={index}
                  onDelete={handleDeleteHabit}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  isDragging={dragIndex === index}
                />
              ))}
            </>
          )}

          {/* Add habit form */}
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

// ─── Main TracksPanel ───────────────────────────────────────────────
export default function TracksPanel({ onStartRitual }) {
  const { user } = useAuth()
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [trackName, setTrackName] = useState('')
  const [trackColor, setTrackColor] = useState(TRACK_COLORS[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchTracks()
  }, [])

  const fetchTracks = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('tracks')
      .select('*')
      .order('created_at')
    setTracks(data ?? [])
    setLoading(false)
  }

  const handleAddTrack = async (e) => {
    e.preventDefault()
    if (!trackName.trim()) return
    setError(null)
    setSaving(true)
    const { data, error } = await supabase.from('tracks').insert({
      user_id: user.id,
      name: trackName.trim(),
      color: trackColor,
    }).select().single()
    if (error) {
      setError(error.message)
    } else {
      setTracks((prev) => [...prev, data])
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

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#e8eaf6]">Tracks</h2>
          <p className="text-sm text-[#7b82b0] mt-0.5">Organize your habits by life area</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-[#6c63ff] hover:bg-[#857dff] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
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
        <div className="bg-[#1a1d27] border border-[#6c63ff]/40 rounded-xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-[#e8eaf6] mb-4">Create New Track</h3>
          {error && (
            <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-3">
              {error}
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
                onClick={() => { setShowForm(false); setError(null) }}
                className="text-[#7b82b0] hover:text-[#e8eaf6] text-sm px-4 py-2 rounded-lg hover:bg-[#22263a] transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tracks list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#6c63ff] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tracks.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-[#6c63ff]/10 border border-[#6c63ff]/20 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6c63ff" strokeWidth="1.5">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>
          <p className="text-[#e8eaf6] font-medium mb-1">No tracks yet</p>
          <p className="text-sm text-[#7b82b0]">Create your first track to start organizing habits</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tracks.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              onDelete={handleDeleteTrack}
              onUpdate={handleUpdateTrack}
              onStartRitual={onStartRitual}
            />
          ))}
        </div>
      )}
    </div>
  )
}
