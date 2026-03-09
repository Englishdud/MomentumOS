import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

// ─── Helpers ────────────────────────────────────────────────────────
function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d
}

function getLabel(score) {
  if (score >= 90) return { text: 'Unstoppable', color: '#43e97b' }
  if (score >= 70) return { text: 'On Fire', color: '#f7971e' }
  if (score >= 50) return { text: 'Steady', color: '#4facfe' }
  if (score >= 25) return { text: 'Building Up', color: '#f093fb' }
  if (score > 0)  return { text: 'Just Starting', color: '#7b82b0' }
  return { text: 'No activity today', color: '#4a5080' }
}

// ─── Score Ring ─────────────────────────────────────────────────────
function ScoreRing({ score }) {
  const label = getLabel(score)
  const circumference = 2 * Math.PI * 70
  const offset = circumference * (1 - score / 100)

  return (
    <div className="relative w-48 h-48 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r="70" fill="none" stroke="#2e3250" strokeWidth="8" />
        <circle
          cx="80" cy="80" r="70" fill="none"
          stroke={label.color}
          strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-[#e8eaf6]">{score}</span>
        <span className="text-xs font-medium mt-1" style={{ color: label.color }}>{label.text}</span>
      </div>
    </div>
  )
}

// ─── Stat Card ──────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = '#6c63ff' }) {
  return (
    <div className="bg-[#1a1d27] border border-[#2e3250] rounded-xl p-4">
      <p className="text-xs text-[#7b82b0] mb-1">{label}</p>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      {sub && <p className="text-[10px] text-[#4a5080] mt-0.5">{sub}</p>}
    </div>
  )
}

// ─── Per-track 30-day heatmap ───────────────────────────────────────
function TrackHeatmap({ track, completionsByDate, habitCount }) {
  const days = []
  for (let i = 29; i >= 0; i--) {
    const d = daysAgo(i)
    const key = dateKey(d)
    const count = completionsByDate[key] || 0
    days.push({ key, count, day: d })
  }

  // intensity: 0–3 based on fraction of habits completed
  const intensity = (count) => {
    if (habitCount === 0 || count === 0) return 0
    const frac = count / habitCount
    if (frac >= 1) return 3
    if (frac >= 0.5) return 2
    return 1
  }

  const cellColor = (level) => {
    switch (level) {
      case 3: return track.color
      case 2: return track.color + '99'
      case 1: return track.color + '44'
      default: return '#22263a'
    }
  }

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  return (
    <div className="bg-[#1a1d27] border border-[#2e3250] rounded-xl p-4">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: track.color }} />
        <h4 className="text-sm font-semibold text-[#e8eaf6] flex-1">{track.name}</h4>
        <span className="text-[10px] text-[#4a5080]">{habitCount} habit{habitCount !== 1 ? 's' : ''}</span>
      </div>

      {/* Day headers (only for first row context) */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {dayLabels.map((l, i) => (
          <div key={i} className="text-center text-[9px] text-[#3d4265]">{l}</div>
        ))}
      </div>

      {/* Grid: pad the first row so day 0 lands on correct column */}
      <div className="grid grid-cols-7 gap-1">
        {/* Padding cells for alignment */}
        {(() => {
          const firstDow = days[0].day.getDay()
          return Array.from({ length: firstDow }, (_, i) => (
            <div key={`pad-${i}`} className="aspect-square" />
          ))
        })()}
        {days.map((d) => {
          const lvl = intensity(d.count)
          return (
            <div
              key={d.key}
              className="aspect-square rounded-sm transition-colors"
              style={{ backgroundColor: cellColor(lvl) }}
              title={`${d.key}: ${d.count} completion${d.count !== 1 ? 's' : ''}`}
            />
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1 mt-2 justify-end">
        <span className="text-[9px] text-[#3d4265]">Less</span>
        {[0, 1, 2, 3].map((l) => (
          <div key={l} className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: cellColor(l) }} />
        ))}
        <span className="text-[9px] text-[#3d4265]">More</span>
      </div>
    </div>
  )
}

// ─── Main ScorePanel ────────────────────────────────────────────────
export default function ScorePanel() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [stats, setStats] = useState(null)
  const [trackHeatmaps, setTrackHeatmaps] = useState([])

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    const thirtyDaysAgo = daysAgo(30).toISOString()

    // Parallel fetches
    const [tracksRes, completionsRes] = await Promise.all([
      supabase.from('tracks').select('id, name, color').order('created_at'),
      supabase.from('completions').select('id, habit_id, completed_at').eq('user_id', user.id).gte('completed_at', thirtyDaysAgo),
    ])

    const tracks = tracksRes.data ?? []
    const completions = completionsRes.data ?? []

    // Fetch habits for all tracks
    const trackIds = tracks.map((t) => t.id)
    const { data: habits } = trackIds.length > 0
      ? await supabase.from('habits').select('id, track_id').in('track_id', trackIds)
      : { data: [] }
    const allHabits = habits ?? []

    // Build habit->track mapping
    const habitToTrack = {}
    for (const h of allHabits) habitToTrack[h.id] = h.track_id

    // Build per-track, per-date completion counts
    const trackDateMap = {} // trackId -> { 'YYYY-MM-DD': count }
    const globalDateMap = {} // 'YYYY-MM-DD' -> Set<trackId>
    for (const c of completions) {
      const d = new Date(c.completed_at)
      const dk = dateKey(d)
      const tid = habitToTrack[c.habit_id]
      if (tid) {
        if (!trackDateMap[tid]) trackDateMap[tid] = {}
        trackDateMap[tid][dk] = (trackDateMap[tid][dk] || 0) + 1
        if (!globalDateMap[dk]) globalDateMap[dk] = new Set()
        globalDateMap[dk].add(tid)
      }
    }

    // ── Calculate daily score (0-100) ──
    const todayKey = dateKey(new Date())
    const todayTracksCompleted = globalDateMap[todayKey]?.size ?? 0
    const totalTracks = tracks.length
    const completionPct = totalTracks > 0 ? (todayTracksCompleted / totalTracks) * 100 : 0

    // ── Calculate cross-track streak ──
    let streakCount = 0
    for (let i = 0; i < 30; i++) {
      const dk = dateKey(daysAgo(i))
      // For today (i=0) skip if nothing yet — don't break streak
      if (i === 0 && !globalDateMap[dk]) continue
      if (globalDateMap[dk] && globalDateMap[dk].size > 0) {
        streakCount++
      } else {
        break
      }
    }

    // Score = 70% completion + 30% streak bonus (capped at 30 from streak)
    const streakBonus = Math.min(streakCount * 3, 30)
    const dailyScore = Math.round(Math.min(100, completionPct * 0.7 + streakBonus))

    // ── Stats ──
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayISO = todayStart.toISOString()
    const weekStart = daysAgo(new Date().getDay()).toISOString()
    const todayCount = completions.filter((c) => c.completed_at >= todayISO).length
    const weekCount = completions.filter((c) => c.completed_at >= weekStart).length

    // ── Per-track heatmap data ──
    const heatmaps = tracks.map((t) => {
      const habitCount = allHabits.filter((h) => h.track_id === t.id).length
      return {
        track: t,
        completionsByDate: trackDateMap[t.id] || {},
        habitCount,
      }
    })

    setScore(dailyScore)
    setStreak(streakCount)
    setStats({
      tracks: totalTracks,
      habits: allHabits.length,
      today: todayCount,
      week: weekCount,
      total: completions.length,
      todayTracks: todayTracksCompleted,
    })
    setTrackHeatmaps(heatmaps)
    setLoading(false)
  }

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-[#e8eaf6]">Score</h2>
          <p className="text-sm text-[#7b82b0] mt-0.5">Your momentum dashboard</p>
        </div>
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#6c63ff] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  // Empty state
  if (stats.tracks === 0) {
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-[#e8eaf6]">Score</h2>
          <p className="text-sm text-[#7b82b0] mt-0.5">Your momentum dashboard</p>
        </div>
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-[#6c63ff]/10 border border-[#6c63ff]/20 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6c63ff" strokeWidth="1.5">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <p className="text-[#e8eaf6] font-medium mb-1">No data yet</p>
          <p className="text-sm text-[#7b82b0]">Create tracks and complete habits to see your score</p>
        </div>
      </div>
    )
  }

  const label = getLabel(score)

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#e8eaf6]">Score</h2>
        <p className="text-sm text-[#7b82b0] mt-0.5">Your momentum dashboard</p>
      </div>

      {/* Score hero */}
      <div className="bg-[#1a1d27] border border-[#2e3250] rounded-2xl p-8 mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-8">
          <ScoreRing score={score} />
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-lg font-bold text-[#e8eaf6] mb-1">Today's Momentum</h3>
            <p className="text-sm text-[#7b82b0] mb-4">
              {stats.todayTracks} of {stats.tracks} track{stats.tracks !== 1 ? 's' : ''} active today
            </p>
            {/* Streak badge */}
            <div className="inline-flex items-center gap-2 bg-[#22263a] border border-[#2e3250] rounded-lg px-4 py-2">
              <span className="text-lg">
                {streak >= 7 ? '\uD83D\uDD25' : streak >= 3 ? '\u26A1' : '\uD83C\uDF31'}
              </span>
              <div>
                <p className="text-sm font-bold text-[#e8eaf6]">{streak} day streak</p>
                <p className="text-[10px] text-[#4a5080]">
                  {streak === 0 ? 'Complete a habit to start' : 'Keep it going!'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Today" value={stats.today} color="#6c63ff" />
        <StatCard label="This week" value={stats.week} color="#43e97b" />
        <StatCard label="All time" value={stats.total} color="#4facfe" />
        <StatCard label="Streak" value={`${streak}d`} color="#f7971e" />
      </div>

      {/* Per-track heatmaps */}
      <div className="mb-4">
        <h3 className="text-base font-semibold text-[#e8eaf6] mb-1">Track Activity</h3>
        <p className="text-xs text-[#7b82b0] mb-4">Last 30 days per track</p>
      </div>

      {trackHeatmaps.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trackHeatmaps.map(({ track, completionsByDate, habitCount }) => (
            <TrackHeatmap
              key={track.id}
              track={track}
              completionsByDate={completionsByDate}
              habitCount={habitCount}
            />
          ))}
        </div>
      ) : (
        <div className="bg-[#1a1d27] border border-[#2e3250] rounded-xl p-8 text-center">
          <p className="text-sm text-[#4a5080]">No track activity in the last 30 days</p>
        </div>
      )}
    </div>
  )
}
