import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

function StatCard({ label, value, sub, color = '#6c63ff' }) {
  return (
    <div className="bg-[#1a1d27] border border-[#2e3250] rounded-xl p-5">
      <p className="text-sm text-[#7b82b0] mb-1">{label}</p>
      <p className="text-3xl font-bold" style={{ color }}>{value}</p>
      {sub && <p className="text-xs text-[#4a5080] mt-1">{sub}</p>}
    </div>
  )
}

export default function ScorePanel() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const [tracksRes, habitsRes, completionsRes] = await Promise.all([
      supabase.from('tracks').select('id', { count: 'exact' }),
      supabase.from('habits').select('id', { count: 'exact' }),
      supabase.from('completions').select('id, completed_at').eq('user_id', user.id),
    ])

    const completions = completionsRes.data ?? []
    const todayCount = completions.filter((c) => c.completed_at >= todayStart).length
    const weekCount = completions.filter((c) => c.completed_at >= weekStart).length
    const monthCount = completions.filter((c) => c.completed_at >= monthStart).length

    setStats({
      tracks: tracksRes.count ?? 0,
      habits: habitsRes.count ?? 0,
      today: todayCount,
      week: weekCount,
      month: monthCount,
      total: completions.length,
    })
    setLoading(false)
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#e8eaf6]">Score</h2>
        <p className="text-sm text-[#7b82b0] mt-0.5">Your habit completion overview</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#6c63ff] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            <StatCard label="Completions today" value={stats.today} color="#6c63ff" />
            <StatCard label="This week" value={stats.week} color="#43e97b" />
            <StatCard label="This month" value={stats.month} color="#f7971e" />
            <StatCard label="Total completions" value={stats.total} sub="all time" color="#4facfe" />
            <StatCard label="Active tracks" value={stats.tracks} color="#f093fb" />
            <StatCard label="Total habits" value={stats.habits} color="#fda085" />
          </div>

          {/* Chart placeholder */}
          <div className="bg-[#1a1d27] border border-[#2e3250] rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-[#e8eaf6]">Completion Activity</h3>
              <span className="text-xs text-[#4a5080] bg-[#22263a] px-3 py-1 rounded-full">Last 30 days</span>
            </div>

            {/* Simple activity grid (GitHub-style) */}
            <ActivityGrid completions={stats.total} />

            <div className="mt-6 border-t border-[#2e3250] pt-5">
              <p className="text-xs text-[#7b82b0] text-center">
                Full analytics with charts, streaks, and trends coming soon.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function ActivityGrid() {
  // Placeholder 5×7 activity grid
  const cells = Array.from({ length: 35 }, (_, i) => {
    const rand = Math.random()
    if (rand > 0.7) return 3
    if (rand > 0.5) return 2
    if (rand > 0.3) return 1
    return 0
  })

  const intensityClass = (level) => {
    switch (level) {
      case 3: return 'bg-[#6c63ff]'
      case 2: return 'bg-[#6c63ff]/60'
      case 1: return 'bg-[#6c63ff]/25'
      default: return 'bg-[#22263a]'
    }
  }

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div>
      <div className="flex gap-1 mb-1">
        {days.map((d) => (
          <div key={d} className="flex-1 text-center text-[10px] text-[#4a5080]">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((level, i) => (
          <div
            key={i}
            className={`aspect-square rounded-sm ${intensityClass(level)} transition-colors`}
            title={`${level} completions`}
          />
        ))}
      </div>
      <div className="flex items-center gap-1.5 mt-3 justify-end">
        <span className="text-[10px] text-[#4a5080]">Less</span>
        {[0, 1, 2, 3].map((l) => (
          <div key={l} className={`w-3 h-3 rounded-sm ${intensityClass(l)}`} />
        ))}
        <span className="text-[10px] text-[#4a5080]">More</span>
      </div>
    </div>
  )
}
