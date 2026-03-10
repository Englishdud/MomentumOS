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

// ISO date of the Monday N weeks ago
function mondayWeeksAgo(n) {
  const d = new Date(currentMondayISO() + 'T00:00:00')
  d.setDate(d.getDate() - n * 7)
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

// ── Bot generation ────────────────────────────────────────────────────────────

const BOT_NAMES = [
  'Alex', 'Jordan', 'Sam', 'Taylor', 'Morgan', 'Riley', 'Casey', 'Quinn',
  'Avery', 'Blake', 'Cameron', 'Drew', 'Emery', 'Finley', 'Gray', 'Harper',
  'Indigo', 'Jesse', 'Kai', 'Logan', 'Mika', 'Noel', 'Oakley', 'Parker',
  'Reese', 'Sage', 'Tatum', 'Vale', 'Wren', 'Yael',
]

// XP range [min, max] per tier — gets progressively harder
const TIER_XP_RANGES = [
  [15,  90],   // 0 Spark
  [40,  140],  // 1 Ember
  [75,  210],  // 2 Flame
  [120, 290],  // 3 Blaze
  [185, 390],  // 4 Inferno
  [260, 490],  // 5 Nova
  [350, 620],  // 6 Comet
  [460, 770],  // 7 Nebula
  [590, 920],  // 8 Cosmos
  [760, 1250], // 9 Supernova
]

// Simple deterministic hash (no floats, no Math.random)
function hashInt(n) {
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b) | 0
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b) | 0
  return Math.abs(n ^ (n >>> 16))
}

function seedFromString(s) {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 0x01000193) | 0
  }
  return Math.abs(h)
}

function generateBots(tier, weekISO) {
  const BOT_COUNT = 9
  const [minXp, maxXp] = TIER_XP_RANGES[Math.min(tier, TIER_XP_RANGES.length - 1)]
  const range = maxXp - minXp
  const baseSeed = seedFromString(`${tier}:${weekISO}`)

  const usedNames = new Set()
  return Array.from({ length: BOT_COUNT }, (_, i) => {
    // Deterministic name
    let nameIdx = hashInt(baseSeed + i * 1337) % BOT_NAMES.length
    while (usedNames.has(nameIdx)) nameIdx = (nameIdx + 1) % BOT_NAMES.length
    usedNames.add(nameIdx)
    // Deterministic XP within tier range
    const xp = minXp + (hashInt(baseSeed + i * 7919) % (range + 1))
    return {
      user_id: `bot:${tier}:${i}:${weekISO}`,
      display_name: BOT_NAMES[nameIdx],
      weekly_xp: xp,
      isBot: true,
    }
  })
}

// Merge real users with bots and sort descending by XP
function buildLeaderboard(realUsers, tier, weekISO) {
  const bots = generateBots(tier, weekISO)
  return [...realUsers, ...bots].sort((a, b) => b.weekly_xp - a.weekly_xp)
}

// ── Tier shield ───────────────────────────────────────────────────────────────

function TierShield({ tier, size = 48 }) {
  const info = LEAGUE_TIERS[tier] ?? LEAGUE_TIERS[0]
  return (
    <div
      className="flex items-center justify-center rounded-2xl border-2"
      style={{
        width: size,
        height: size,
        backgroundColor: info.color + '18',
        borderColor: info.color + '60',
        color: info.color,
      }}
    >
      <svg width={size * 0.42} height={size * 0.42} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
      </svg>
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────

export default function LeaguePanel() {
  const { user } = useAuth()
  const [myRow, setMyRow] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)

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

      // Week rollover: if stored week_start is before this Monday, process promotion/demotion
      if (row && row.week_start < monday) {
        // Generate last week's bots + fetch any real users from last week
        const lastMonday = mondayWeeksAgo(1)
        const { data: lastWeekReal } = await supabase
          .from('user_league')
          .select('user_id, weekly_xp')
          .eq('tier', row.tier)
          .eq('week_start', lastMonday)

        const lastWeekBoard = buildLeaderboard(lastWeekReal ?? [], row.tier, lastMonday)
        const cohortSize = lastWeekBoard.length
        const myRank = lastWeekBoard.findIndex((r) => r.user_id === user.id) + 1

        let newTier = row.tier
        const PROMOTE_COUNT = 3
        const DEMOTE_COUNT  = 3
        if (myRank > 0 && cohortSize > 5) {
          if (myRank <= PROMOTE_COUNT && row.tier < LEAGUE_TIERS.length - 1) {
            newTier = row.tier + 1
          } else if (myRank > cohortSize - DEMOTE_COUNT && row.tier > 0) {
            newTier = row.tier - 1
          }
        }

        await supabase
          .from('user_league')
          .update({ tier: newTier, week_start: monday, weekly_xp: 0, updated_at: new Date().toISOString() })
          .eq('user_id', user.id)

        currentRow = { ...row, tier: newTier, week_start: monday, weekly_xp: 0 }
      }

      setMyRow(currentRow)

      // Build leaderboard: real users in same tier + bots
      if (currentRow) {
        const { data: realUsers } = await supabase
          .from('user_league')
          .select('user_id, display_name, weekly_xp')
          .eq('tier', currentRow.tier)
          .eq('week_start', currentRow.week_start ?? monday)

        const board = buildLeaderboard(realUsers ?? [], currentRow.tier, currentRow.week_start ?? monday)
        setLeaderboard(board)
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

  // New user — no league row yet (hasn't completed any habit)
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

  const tierInfo  = LEAGUE_TIERS[myRow.tier] ?? LEAGUE_TIERS[0]
  const nextTier  = LEAGUE_TIERS[myRow.tier + 1]
  const prevTier  = LEAGUE_TIERS[myRow.tier - 1]
  const cohortSize = leaderboard.length
  const myRank    = leaderboard.findIndex((r) => r.user_id === user.id) + 1
  const PROMOTE_COUNT = 3
  const DEMOTE_COUNT  = 3
  const maxXp = leaderboard[0]?.weekly_xp || 1

  return (
    <div className="animate-fadeIn max-w-xl mx-auto space-y-5">
      {/* ── League header ───────────────────────────────────────────── */}
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

        {/* Tier ladder hint */}
        <div className="mt-4 flex items-center gap-2 text-xs">
          {prevTier && (
            <span style={{ color: prevTier.color }}>
              <TierShield tier={myRow.tier - 1} size={16} /> {prevTier.name}
            </span>
          )}
          {prevTier && nextTier && <span className="text-[#2e3250]">→</span>}
          <span className="font-semibold" style={{ color: tierInfo.color }}>{tierInfo.name}</span>
          {nextTier && <span className="text-[#2e3250]">→</span>}
          {nextTier && (
            <span style={{ color: nextTier.color }}>{nextTier.name}</span>
          )}
          {!nextTier && (
            <span className="font-semibold" style={{ color: tierInfo.color }}>— Maximum tier!</span>
          )}
        </div>
      </div>

      {/* ── Leaderboard ─────────────────────────────────────────────── */}
      <div className="bg-[#1a1d27] border border-[#2e3250] rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[#2e3250] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#e8eaf6]">Leaderboard</h3>
          <span className="text-xs text-[#4a5080]">{cohortSize} competitors</span>
        </div>

        {/* Promotion zone header */}
        <div className="px-5 py-2 border-b border-[#43e97b20]" style={{ backgroundColor: '#43e97b08' }}>
          <p className="text-[10px] font-semibold text-[#43e97b] uppercase tracking-wider">
            ↑ Top {PROMOTE_COUNT} promote to {nextTier?.name ?? 'max tier'} next week
          </p>
        </div>

        <div className="divide-y divide-[#2e3250]">
          {leaderboard.map((entry, i) => {
            const rank = i + 1
            const isMe = entry.user_id === user.id
            const inPromoteZone = rank <= PROMOTE_COUNT
            const inDemoteZone = rank > cohortSize - DEMOTE_COUNT
            const barWidth = Math.max(2, (entry.weekly_xp / maxXp) * 100)

            return (
              <div
                key={entry.user_id}
                className={`px-5 py-3 flex items-center gap-3 ${isMe ? 'border-l-2' : ''}`}
                style={isMe ? {
                  borderLeftColor: tierInfo.color,
                  backgroundColor: tierInfo.color + '0d',
                } : {}}
              >
                {/* Rank number */}
                <span
                  className="text-sm font-bold w-6 text-right shrink-0"
                  style={{
                    color: rank === 1 ? '#eab308' : rank === 2 ? '#9ca3af' : rank === 3 ? '#fb923c' : '#4a5080',
                  }}
                >
                  {rank}
                </span>

                {/* Name + XP bar */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`text-sm truncate ${isMe ? 'font-semibold text-[#e8eaf6]' : 'text-[#7b82b0]'}`}>
                      {entry.display_name || 'Anonymous'}
                    </span>
                    {isMe && (
                      <span className="text-[10px] font-bold shrink-0" style={{ color: tierInfo.color }}>★ you</span>
                    )}
                    {entry.isBot && !isMe && (
                      <span className="text-[9px] text-[#3d4265] shrink-0">bot</span>
                    )}
                  </div>
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

                {/* XP */}
                <span className="text-sm font-bold shrink-0" style={{ color: '#eab308' }}>
                  {entry.weekly_xp} XP
                </span>
              </div>
            )
          })}
        </div>

        {/* Demotion zone footer */}
        <div className="px-5 py-2 border-t border-[#ef444420]" style={{ backgroundColor: '#ef444408' }}>
          <p className="text-[10px] font-semibold text-[#ef4444] uppercase tracking-wider">
            ↓ Bottom {DEMOTE_COUNT} drop to {prevTier?.name ?? 'lowest tier'} next week
          </p>
        </div>
      </div>

      {/* ── Your position summary ────────────────────────────────────── */}
      <div className="rounded-xl px-5 py-4 border text-sm" style={{ backgroundColor: '#1a1d27', borderColor: '#2e3250' }}>
        <p className="text-[#7b82b0]">
          You are ranked{' '}
          <span className="font-bold text-[#e8eaf6]">#{myRank || '—'}</span>
          {' '}of{' '}
          <span className="font-bold text-[#e8eaf6]">{cohortSize}</span>
          {' '}in the {tierInfo.name} league this week.
          {myRank > 0 && myRank <= PROMOTE_COUNT && (
            <span style={{ color: '#43e97b' }}> You're in the promotion zone — keep going!</span>
          )}
          {myRank > 0 && myRank > cohortSize - DEMOTE_COUNT && (
            <span style={{ color: '#ef4444' }}> Earn more XP to avoid demotion!</span>
          )}
        </p>
      </div>

      {/* ── XP guide ────────────────────────────────────────────────── */}
      <div className="rounded-xl px-5 py-4 border" style={{ backgroundColor: '#1a1d27', borderColor: '#2e3250' }}>
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
