import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { LEAGUE_TIERS } from '../../lib/leagues'

// Monday of the current week as YYYY-MM-DD
function currentMondayISO() {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

// Format "Mar 10 – Mar 16" from a Monday date string
function weekLabel(mondayISO) {
  const start = new Date(mondayISO + 'T00:00:00')
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(start)} – ${fmt(end)}`
}

// Tier shield icon
function TierShield({ tier, size = 48 }) {
  const info = LEAGUE_TIERS[tier] ?? LEAGUE_TIERS[0]
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl border-2 font-bold"
      style={{
        width: size,
        height: size,
        backgroundColor: info.color + '18',
        borderColor: info.color + '60',
        color: info.color,
        fontSize: size * 0.22,
      }}
    >
      <svg width={size * 0.4} height={size * 0.4} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
      </svg>
    </div>
  )
}

export default function LeaguePanel() {
  const { user } = useAuth()
  const [myRow, setMyRow] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [weekProcessed, setWeekProcessed] = useState(false)

  const monday = currentMondayISO()

  useEffect(() => {
    const load = async () => {
      setLoading(true)

      // Load my league row
      const { data: row } = await supabase
        .from('user_league')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      let currentRow = row

      // Week rollover: if stored week_start < this Monday, process promotion/demotion
      if (row && row.week_start < monday && !weekProcessed) {
        setWeekProcessed(true)

        // Get last week's leaderboard to determine rank
        const { data: lastWeekBoard } = await supabase
          .from('user_league')
          .select('user_id, weekly_xp')
          .eq('tier', row.tier)
          .eq('week_start', row.week_start)
          .order('weekly_xp', { ascending: false })

        const cohortSize = lastWeekBoard?.length ?? 1
        const myRank = (lastWeekBoard ?? []).findIndex((r) => r.user_id === user.id) + 1

        let newTier = row.tier
        if (cohortSize > 5) {
          if (myRank <= 3 && row.tier < LEAGUE_TIERS.length - 1) {
            newTier = row.tier + 1  // promote
          } else if (myRank > cohortSize - 3 && row.tier > 0) {
            newTier = row.tier - 1  // demote
          }
        }

        await supabase
          .from('user_league')
          .update({ tier: newTier, week_start: monday, weekly_xp: 0, updated_at: new Date().toISOString() })
          .eq('user_id', user.id)

        currentRow = { ...row, tier: newTier, week_start: monday, weekly_xp: 0 }
      }

      setMyRow(currentRow)

      // Load leaderboard: same tier, same week
      if (currentRow) {
        const { data: board } = await supabase
          .from('user_league')
          .select('user_id, display_name, weekly_xp')
          .eq('tier', currentRow.tier)
          .eq('week_start', currentRow.week_start ?? monday)
          .order('weekly_xp', { ascending: false })

        setLeaderboard(board ?? [])
      }

      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#6c63ff] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // New user with no league row yet
  if (!myRow) {
    return (
      <div className="animate-fadeIn max-w-xl mx-auto">
        <h2 className="text-xl font-bold text-[#e8eaf6] mb-2">League</h2>
        <div className="bg-[#1a1d27] border border-[#2e3250] rounded-2xl p-8 text-center">
          <TierShield tier={0} size={72} />
          <p className="text-[#e8eaf6] font-semibold mt-4 mb-2">Complete your first habit to join the Spark league!</p>
          <p className="text-sm text-[#7b82b0]">XP is earned every time you finish a habit during a ritual.</p>
        </div>
      </div>
    )
  }

  const tierInfo = LEAGUE_TIERS[myRow.tier] ?? LEAGUE_TIERS[0]
  const nextTier = LEAGUE_TIERS[myRow.tier + 1]
  const prevTier = LEAGUE_TIERS[myRow.tier - 1]
  const cohortSize = leaderboard.length
  const myRank = leaderboard.findIndex((r) => r.user_id === user.id) + 1
  const showZones = cohortSize > 5
  const PROMOTE_COUNT = 3
  const DEMOTE_COUNT = 3

  const maxXp = leaderboard[0]?.weekly_xp || 1

  return (
    <div className="animate-fadeIn max-w-xl mx-auto space-y-5">
      {/* ── League Header ───────────────────────────────────────────── */}
      <div className="bg-[#1a1d27] border border-[#2e3250] rounded-2xl p-5">
        <div className="flex items-center gap-5">
          <TierShield tier={myRow.tier} size={72} />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[#7b82b0] uppercase tracking-wider mb-0.5">Your League</p>
            <h2 className="text-2xl font-bold mb-1" style={{ color: tierInfo.color }}>{tierInfo.name}</h2>
            <p className="text-xs text-[#7b82b0]">{weekLabel(myRow.week_start ?? monday)}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold" style={{ color: '#eab308' }}>{myRow.weekly_xp}</p>
            <p className="text-[10px] text-[#7b82b0] mt-0.5">XP this week</p>
            <p className="text-base font-bold text-[#e8eaf6] mt-2">{myRow.total_xp ?? 0}</p>
            <p className="text-[10px] text-[#7b82b0] mt-0.5">total XP</p>
          </div>
        </div>

        {/* Tier context */}
        <div className="mt-4 flex items-center gap-2 text-xs text-[#4a5080]">
          {prevTier && <span style={{ color: prevTier.color }}>↑ {prevTier.name}</span>}
          {prevTier && nextTier && <span>·</span>}
          {nextTier && <span style={{ color: nextTier.color }}>{nextTier.name} ↑</span>}
          {!nextTier && <span className="font-semibold" style={{ color: tierInfo.color }}>Maximum tier reached!</span>}
        </div>
      </div>

      {/* ── Leaderboard ─────────────────────────────────────────────── */}
      <div className="bg-[#1a1d27] border border-[#2e3250] rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[#2e3250] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#e8eaf6]">Leaderboard</h3>
          <span className="text-xs text-[#4a5080]">{cohortSize} competitor{cohortSize !== 1 ? 's' : ''}</span>
        </div>

        {cohortSize === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-[#7b82b0]">No one else in your league this week yet.</p>
            <p className="text-xs text-[#4a5080] mt-1">Keep earning XP to defend your position!</p>
          </div>
        ) : (
          <div>
            {/* Zone labels */}
            {showZones && (
              <div className="px-5 py-2 bg-[#43e97b08] border-b border-[#43e97b20]">
                <p className="text-[10px] font-semibold text-[#43e97b] uppercase tracking-wider">
                  ↑ Promotion zone — top {PROMOTE_COUNT} advance to {nextTier?.name ?? '—'} next week
                </p>
              </div>
            )}

            <div className="divide-y divide-[#2e3250]">
              {leaderboard.map((entry, i) => {
                const rank = i + 1
                const isMe = entry.user_id === user.id
                const inPromoteZone = showZones && rank <= PROMOTE_COUNT
                const inDemoteZone = showZones && rank > cohortSize - DEMOTE_COUNT
                const barWidth = maxXp > 0 ? Math.max(2, (entry.weekly_xp / maxXp) * 100) : 2

                return (
                  <div
                    key={entry.user_id}
                    className={`px-5 py-3 flex items-center gap-3 transition-colors ${
                      isMe ? 'border-l-2' : ''
                    }`}
                    style={isMe ? {
                      borderLeftColor: tierInfo.color,
                      backgroundColor: tierInfo.color + '08',
                    } : {}}
                  >
                    {/* Rank */}
                    <span
                      className="text-sm font-bold w-6 text-right shrink-0"
                      style={{
                        color: rank === 1 ? '#eab308' : rank === 2 ? '#9ca3af' : rank === 3 ? '#fb923c' : '#4a5080',
                      }}
                    >
                      {rank}
                    </span>

                    {/* Name + bar */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`text-sm truncate ${isMe ? 'font-semibold text-[#e8eaf6]' : 'text-[#7b82b0]'}`}>
                          {entry.display_name || 'Anonymous'}
                        </span>
                        {isMe && (
                          <span className="text-[10px] font-bold shrink-0" style={{ color: tierInfo.color }}>★ you</span>
                        )}
                      </div>
                      {/* XP bar */}
                      <div className="h-1.5 bg-[#22263a] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${barWidth}%`,
                            backgroundColor: inPromoteZone ? '#43e97b' : inDemoteZone ? '#ef4444' : tierInfo.color,
                          }}
                        />
                      </div>
                    </div>

                    {/* XP value */}
                    <span className="text-sm font-bold shrink-0" style={{ color: '#eab308' }}>
                      {entry.weekly_xp} XP
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Demotion zone label */}
            {showZones && (
              <div className="px-5 py-2 bg-[#ef444408] border-t border-[#ef444420]">
                <p className="text-[10px] font-semibold text-[#ef4444] uppercase tracking-wider">
                  ↓ Demotion zone — bottom {DEMOTE_COUNT} drop to {prevTier?.name ?? 'lowest'} next week
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Your rank summary ───────────────────────────────────────── */}
      {cohortSize > 1 && (
        <div
          className="rounded-xl px-5 py-4 border text-sm"
          style={{ backgroundColor: '#1a1d27', borderColor: '#2e3250' }}
        >
          <p className="text-[#7b82b0]">
            You are ranked{' '}
            <span className="font-bold text-[#e8eaf6]">#{myRank}</span>
            {' '}of{' '}
            <span className="font-bold text-[#e8eaf6]">{cohortSize}</span>
            {' '}in the {tierInfo.name} league this week.
            {showZones && myRank <= PROMOTE_COUNT && (
              <span style={{ color: '#43e97b' }}> Keep it up — you're in the promotion zone!</span>
            )}
            {showZones && myRank > cohortSize - DEMOTE_COUNT && (
              <span style={{ color: '#ef4444' }}> Earn more XP to avoid demotion!</span>
            )}
          </p>
        </div>
      )}

      {/* ── XP guide ────────────────────────────────────────────────── */}
      <div
        className="rounded-xl px-5 py-4 border"
        style={{ backgroundColor: '#1a1d27', borderColor: '#2e3250' }}
      >
        <p className="text-xs font-semibold text-[#4a5080] uppercase tracking-wider mb-3">How XP is earned</p>
        <div className="space-y-2 text-sm text-[#7b82b0]">
          <div className="flex justify-between"><span>Habit completion</span><span className="text-[#e8eaf6] font-medium">+10 XP</span></div>
          <div className="flex justify-between"><span>Timed habit (up to 30 min)</span><span className="text-[#e8eaf6] font-medium">+1 XP / min</span></div>
          <div className="flex justify-between"><span>3-day streak bonus</span><span className="text-[#e8eaf6] font-medium">+5 XP</span></div>
          <div className="flex justify-between"><span>7-day streak bonus</span><span className="text-[#e8eaf6] font-medium">+10 XP</span></div>
          <div className="flex justify-between"><span>14-day streak bonus</span><span className="text-[#e8eaf6] font-medium">+20 XP</span></div>
        </div>
      </div>
    </div>
  )
}
