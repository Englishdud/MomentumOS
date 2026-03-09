import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import TracksPanel from '../components/panels/TracksPanel'
import JourneysPanel from '../components/panels/JourneysPanel'
import ScorePanel from '../components/panels/ScorePanel'
import DailyRitual from '../components/DailyRitual'

const NAV_ITEMS = [
  {
    id: 'tracks',
    label: 'Tracks',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: 'journeys',
    label: 'Journeys',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12h18M3 6l9-3 9 3M3 18l9 3 9-3" />
      </svg>
    ),
  },
  {
    id: 'score',
    label: 'Score',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
]

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const [activeNav, setActiveNav] = useState('tracks')
  // Ritual state
  const [ritualTrack, setRitualTrack] = useState(null)
  const [ritualHabits, setRitualHabits] = useState(null)
  // Transition key for panel animation
  const [panelKey, setPanelKey] = useState(0)

  const handleSignOut = async () => {
    await signOut()
  }

  const handleStartRitual = (track, habits) => {
    setRitualTrack(track)
    setRitualHabits(habits)
  }

  const handleCloseRitual = () => {
    setRitualTrack(null)
    setRitualHabits(null)
  }

  const handleNavChange = (id) => {
    if (id !== activeNav) {
      setActiveNav(id)
      setPanelKey((k) => k + 1)
    }
  }

  const userInitial = user?.email?.[0]?.toUpperCase() ?? '?'

  // ── Full-screen ritual mode ──
  if (ritualTrack && ritualHabits) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex flex-col">
        <header className="h-14 bg-[#1a1d27] border-b border-[#2e3250] flex items-center px-4 gap-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#6c63ff] flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <span className="font-bold text-[#e8eaf6] text-base tracking-tight">MomentumOS</span>
          </div>
          <div className="flex-1" />
          <span className="text-xs font-medium text-[#6c63ff] bg-[#6c63ff]/10 border border-[#6c63ff]/25 px-3 py-1 rounded-full">
            Ritual in progress
          </span>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-2xl mx-auto">
            <DailyRitual track={ritualTrack} habits={ritualHabits} onClose={handleCloseRitual} />
          </div>
        </main>
      </div>
    )
  }

  // ── Normal dashboard ──
  return (
    <div className="min-h-screen bg-[#0f1117] flex flex-col">
      {/* Top Navbar */}
      <header className="h-14 bg-[#1a1d27] border-b border-[#2e3250] flex items-center px-4 gap-4 shrink-0 z-30 sticky top-0">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#6c63ff] flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <span className="font-bold text-[#e8eaf6] text-base tracking-tight">MomentumOS</span>
        </div>

        <div className="flex-1" />

        {/* User info + logout */}
        <div className="flex items-center gap-3">
          <span className="text-[#7b82b0] text-sm hidden sm:block truncate max-w-[180px]">{user?.email}</span>
          <div className="w-8 h-8 rounded-full bg-[#6c63ff]/20 border border-[#6c63ff]/40 flex items-center justify-center text-[#6c63ff] text-xs font-bold">
            {userInitial}
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-sm text-[#7b82b0] hover:text-[#e8eaf6] transition-colors px-2 py-1 rounded-lg hover:bg-[#2e3250]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar — hidden on mobile */}
        <aside className="hidden lg:flex w-56 bg-[#1a1d27] border-r border-[#2e3250] flex-col shrink-0">
          <nav className="flex-1 p-3 space-y-1">
            <p className="text-xs font-semibold text-[#4a5080] uppercase tracking-wider px-3 py-2 mt-1">
              Navigation
            </p>
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavChange(item.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-150
                  ${activeNav === item.id
                    ? 'bg-[#6c63ff]/15 text-[#6c63ff] border border-[#6c63ff]/25'
                    : 'text-[#7b82b0] hover:text-[#e8eaf6] hover:bg-[#22263a]'
                  }
                `}
              >
                <span className={activeNav === item.id ? 'text-[#6c63ff]' : ''}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-[#2e3250]">
            <div className="text-xs text-[#4a5080] text-center">MomentumOS v0.1.0</div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <div key={panelKey} className="p-6 max-w-5xl mx-auto animate-fadeIn">
            {activeNav === 'tracks' && <TracksPanel onStartRitual={handleStartRitual} />}
            {activeNav === 'journeys' && <JourneysPanel onNavigateToTracks={() => handleNavChange('tracks')} />}
            {activeNav === 'score' && <ScorePanel />}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav — visible only on < lg */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#1a1d27] border-t border-[#2e3250] flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavChange(item.id)}
            className={`
              flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all
              ${activeNav === item.id
                ? 'text-[#6c63ff]'
                : 'text-[#4a5080]'
              }
            `}
          >
            {item.icon}
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
