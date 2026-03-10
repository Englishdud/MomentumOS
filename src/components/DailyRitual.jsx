import { useState, useEffect, useRef, useCallback } from 'react'
import confetti from 'canvas-confetti'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useSettings } from '../contexts/SettingsContext'

// Format seconds as MM:SS
function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// Monday of the current week as YYYY-MM-DD
function currentMondayISO() {
  const d = new Date()
  const day = d.getDay() // 0=Sun
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

// ─── Single Habit Timer Screen ──────────────────────────────────────
function HabitTimer({ habit, index, total, onDone }) {
  const durationSec = (habit.duration_minutes || 0) * 60
  const hasTimer = durationSec > 0
  const [remaining, setRemaining] = useState(durationSec)
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef(null)

  const startTimer = useCallback(() => {
    setRunning(true)
  }, [])

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1)
      if (hasTimer) {
        setRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current)
            return 0
          }
          return prev - 1
        })
      }
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [running, hasTimer])

  const handleDone = () => {
    clearInterval(intervalRef.current)
    onDone(elapsed)
  }

  // Progress ring
  const progress = hasTimer && durationSec > 0
    ? Math.max(0, Math.min(1, 1 - remaining / durationSec))
    : 0
  const circumference = 2 * Math.PI * 90
  const offset = circumference * (1 - progress)

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i < index ? 'w-6 bg-[#43e97b]' : i === index ? 'w-8 bg-[#6c63ff]' : 'w-4 bg-[#2e3250]'
            }`}
          />
        ))}
      </div>

      <p className="text-xs uppercase tracking-wider text-[#7b82b0] mb-2">
        Habit {index + 1} of {total}
      </p>
      <h2 className="text-2xl font-bold text-[#e8eaf6] mb-8 text-center">{habit.name}</h2>

      {/* Timer ring */}
      <div className="relative w-52 h-52 mb-8">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
          {/* Track */}
          <circle cx="100" cy="100" r="90" fill="none" stroke="#2e3250" strokeWidth="6" />
          {/* Progress */}
          {hasTimer && (
            <circle
              cx="100" cy="100" r="90"
              fill="none"
              stroke="#6c63ff"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-1000 ease-linear"
            />
          )}
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {hasTimer ? (
            <>
              <span className="text-4xl font-mono font-bold text-[#e8eaf6]">
                {formatTime(remaining)}
              </span>
              <span className="text-xs text-[#7b82b0] mt-1">remaining</span>
            </>
          ) : (
            <>
              <span className="text-4xl font-mono font-bold text-[#e8eaf6]">
                {formatTime(elapsed)}
              </span>
              <span className="text-xs text-[#7b82b0] mt-1">elapsed</span>
            </>
          )}
        </div>
      </div>

      {/* Duration info */}
      {hasTimer && (
        <p className="text-sm text-[#4a5080] mb-6">
          {habit.duration_minutes} minute{habit.duration_minutes !== 1 ? 's' : ''}
        </p>
      )}

      {/* Controls */}
      <div className="flex gap-3">
        {!running ? (
          <button
            onClick={startTimer}
            className="flex items-center gap-2 bg-[#6c63ff] hover:bg-[#857dff] text-white font-semibold px-8 py-3 rounded-xl text-sm transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Start
          </button>
        ) : (
          <button
            onClick={handleDone}
            className="flex items-center gap-2 bg-[#43e97b] hover:bg-[#3ad870] text-[#0f1117] font-semibold px-8 py-3 rounded-xl text-sm transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Done
          </button>
        )}
      </div>

      {/* Skip option when running */}
      {running && (
        <button
          onClick={handleDone}
          className="mt-3 text-xs text-[#4a5080] hover:text-[#7b82b0] transition-colors"
        >
          {remaining === 0 && hasTimer ? 'Timer complete — tap Done' : 'Skip ahead'}
        </button>
      )}
    </div>
  )
}

// ─── Summary Screen ─────────────────────────────────────────────────
function RitualSummary({ track, completedHabits, totalElapsed, totalXpEarned, onClose }) {
  useEffect(() => {
    // Fire confetti burst when the summary mounts
    const fire = (particleRatio, opts) =>
      confetti({
        origin: { y: 0.6 },
        ...opts,
        particleCount: Math.floor(200 * particleRatio),
      })
    fire(0.25, { spread: 26, startVelocity: 55 })
    fire(0.2,  { spread: 60 })
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 })
    fire(0.1,  { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 })
    fire(0.1,  { spread: 120, startVelocity: 45 })
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      {/* Celebration icon */}
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
        style={{ backgroundColor: track.color + '20', border: `1px solid ${track.color}40` }}
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={track.color} strokeWidth="2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-[#e8eaf6] mb-2">Ritual Complete!</h2>
      <p className="text-sm text-[#7b82b0] mb-8">{track.name}</p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-xs mb-10">
        <div className="bg-[#1a1d27] border border-[#2e3250] rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-[#6c63ff]">{completedHabits}</p>
          <p className="text-xs text-[#7b82b0] mt-1">habits done</p>
        </div>
        <div className="bg-[#1a1d27] border border-[#2e3250] rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-[#43e97b]">{formatTime(totalElapsed)}</p>
          <p className="text-xs text-[#7b82b0] mt-1">total time</p>
        </div>
        <div className="bg-[#1a1d27] border border-[#eab308] border-opacity-40 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: '#eab308' }}>+{totalXpEarned}</p>
          <p className="text-xs text-[#7b82b0] mt-1">XP earned</p>
        </div>
      </div>

      {/* Completed list */}
      <div className="w-full max-w-sm bg-[#1a1d27] border border-[#2e3250] rounded-xl p-4 mb-8">
        <p className="text-xs font-semibold text-[#4a5080] uppercase tracking-wider mb-3">Completed</p>
        {completedHabits > 0 ? (
          <div className="space-y-2">
            {Array.from({ length: completedHabits }, (_, i) => i).map((i) => (
              <div key={i} className="flex items-center gap-2.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#43e97b" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="text-sm text-[#e8eaf6]">Habit {i + 1}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#4a5080]">No habits completed</p>
        )}
      </div>

      <button
        onClick={onClose}
        className="bg-[#6c63ff] hover:bg-[#857dff] text-white font-semibold px-8 py-3 rounded-xl text-sm transition-colors animate-confettiPop"
      >
        Back to Home
      </button>
    </div>
  )
}

// ─── Main DailyRitual ───────────────────────────────────────────────
export default function DailyRitual({ track, habits, streak = 0, onClose }) {
  const { user } = useAuth()
  const { settings } = useSettings()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [totalElapsed, setTotalElapsed] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)
  const [totalXpEarned, setTotalXpEarned] = useState(0)

  const handleHabitDone = async (elapsed) => {
    const habit = habits[currentIndex]

    // Compute XP for this habit
    const streakBonus = streak >= 14 ? 20 : streak >= 7 ? 10 : streak >= 3 ? 5 : 0
    const xp = 10 + Math.min(habit.duration_minutes ?? 0, 30) + streakBonus

    // Record the completion (XP is tracked separately in user_league)
    const completionPayload = {
      habit_id: habit.id,
      user_id: user.id,
      completed_at: new Date().toISOString(),
    }
    console.log('[completions] insert payload:', completionPayload)
    const { error: completionErr } = await supabase.from('completions').insert(completionPayload)
    if (completionErr) console.error('[completions] insert error:', completionErr)

    // Update user_league XP
    const monday = currentMondayISO()
    const displayName = settings.display_name || user?.email || ''

    const { data: leagueRow, error: fetchErr } = await supabase
      .from('user_league')
      .select('tier, weekly_xp, total_xp, week_start')
      .eq('user_id', user.id)
      .maybeSingle()

    if (fetchErr) {
      console.error('League fetch failed:', fetchErr)
    } else {
      const isNewWeek = leagueRow && leagueRow.week_start < monday
      const prevWeeklyXp = (!leagueRow || isNewWeek) ? 0 : (leagueRow.weekly_xp ?? 0)
      const prevTotalXp = leagueRow?.total_xp ?? 0

      const { error: upsertErr } = await supabase
        .from('user_league')
        .upsert(
          {
            user_id: user.id,
            display_name: displayName,
            tier: leagueRow?.tier ?? 0,
            week_start: monday,
            weekly_xp: prevWeeklyXp + xp,
            total_xp: prevTotalXp + xp,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )

      if (upsertErr) console.error('League XP upsert failed:', upsertErr)
    }

    const newTotal = totalElapsed + elapsed
    const newCount = completedCount + 1
    const newXp = totalXpEarned + xp
    setTotalElapsed(newTotal)
    setCompletedCount(newCount)
    setTotalXpEarned(newXp)

    // Advance to next habit or show summary
    if (currentIndex + 1 < habits.length) {
      setCurrentIndex(currentIndex + 1)
    } else {
      setCompleted(true)
    }
  }

  if (completed) {
    return (
      <RitualSummary
        track={track}
        completedHabits={completedCount}
        totalElapsed={totalElapsed}
        totalXpEarned={totalXpEarned}
        onClose={onClose}
      />
    )
  }

  return (
    <div>
      {/* Minimal top bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: track.color }} />
          <span className="text-sm font-medium text-[#e8eaf6]">{track.name}</span>
        </div>
        <button
          onClick={onClose}
          className="text-xs text-[#7b82b0] hover:text-[#e8eaf6] flex items-center gap-1 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
          Exit
        </button>
      </div>

      <HabitTimer
        key={currentIndex}
        habit={habits[currentIndex]}
        index={currentIndex}
        total={habits.length}
        onDone={handleHabitDone}
      />
    </div>
  )
}
