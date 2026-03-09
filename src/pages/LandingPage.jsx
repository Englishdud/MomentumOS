import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LandingNav from '../components/LandingNav'

// Decorative floating score ring mock
function HeroVisual() {
  const circumference = 2 * Math.PI * 54
  const progress = 0.72
  const offset = circumference * (1 - progress)

  return (
    <div className="relative flex items-center justify-center animate-float">
      {/* Glow ring */}
      <div
        className="absolute inset-0 rounded-full blur-2xl opacity-30"
        style={{ backgroundColor: '#6c63ff' }}
      />
      {/* Card */}
      <div
        className="relative rounded-2xl p-6 flex flex-col items-center gap-4 border"
        style={{ backgroundColor: '#1a1d27', borderColor: '#2e3250', minWidth: 200 }}
      >
        {/* Score ring */}
        <div className="relative w-32 h-32">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="#2e3250" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke="#6c63ff"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-[#e8eaf6]">72</span>
            <span className="text-[10px] text-[#7b82b0] mt-0.5">momentum</span>
          </div>
        </div>

        {/* Habit list preview */}
        <div className="w-full space-y-2">
          {[
            { name: 'Morning run', done: true },
            { name: 'Meditate', done: true },
            { name: 'Read 20 pages', done: false },
          ].map((h) => (
            <div key={h.name} className="flex items-center gap-2.5">
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: h.done ? '#43e97b20' : '#2e3250',
                  border: `1px solid ${h.done ? '#43e97b60' : '#3d4265'}`,
                }}
              >
                {h.done && (
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#43e97b" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span className="text-xs text-[#7b82b0]">{h.name}</span>
            </div>
          ))}
        </div>

        {/* Streak badge */}
        <div
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
          style={{ backgroundColor: '#6c63ff20', color: '#6c63ff', border: '1px solid #6c63ff40' }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          7-day streak
        </div>
      </div>
    </div>
  )
}

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
    title: 'Tracks',
    body: 'Group habits by area of life — health, work, learning. Each track gets its own focus.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" />
      </svg>
    ),
    title: 'Daily Ritual',
    body: 'Run habits one-by-one with a full-screen countdown timer. No distractions, just flow.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    title: 'Momentum Score',
    body: 'A 0–100 score built from your completion rate and streak bonus — honest signal, not hype.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    title: '30-Day Heatmap',
    body: 'See which days you showed up. Per-track history so you know exactly where momentum lives.',
  },
]

const STEPS = [
  {
    n: '1',
    title: 'Create a Track',
    body: 'Name it, pick a color, add habits with durations. Takes about two minutes.',
  },
  {
    n: '2',
    title: 'Run your Ritual',
    body: 'Hit Start, follow the timer for each habit, tap Done. That\'s it.',
  },
  {
    n: '3',
    title: 'Watch the Score rise',
    body: 'Every completed day builds your streak and pushes your score higher.',
  },
]

export default function LandingPage() {
  const { user } = useAuth()
  if (user) return <Navigate to="/dashboard" replace />

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0f1117', color: '#e8eaf6' }}>
      <LandingNav />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pt-16">
        {/* Radial glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 10%, rgba(108,99,255,0.15), transparent 70%)' }}
        />

        <div className="relative max-w-6xl mx-auto px-4 py-24 w-full grid md:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <div className="animate-slideUp">
            <div
              className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-6"
              style={{ backgroundColor: '#6c63ff20', color: '#6c63ff', border: '1px solid #6c63ff40' }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              Free forever
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-5 text-[#e8eaf6]">
              Build Habits That<br />
              <span style={{ color: '#6c63ff' }}>Actually Stick</span>
            </h1>

            <p className="text-lg text-[#7b82b0] mb-10 max-w-md leading-relaxed">
              Small daily rituals, tracked with care. MomentumOS helps you show up for yourself — every single day.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-white px-6 py-3 rounded-xl transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#6c63ff' }}
              >
                Get started — free forever
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                to="/why"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#7b82b0] hover:text-[#e8eaf6] border border-[#2e3250] hover:border-[#3d4265] px-6 py-3 rounded-xl transition-colors"
              >
                See why it works
              </Link>
            </div>
          </div>

          {/* Visual */}
          <div className="flex justify-center md:justify-end">
            <HeroVisual />
          </div>
        </div>
      </section>

      {/* ── Social proof bar ──────────────────────────────────────────────── */}
      <div className="border-y border-[#2e3250]" style={{ backgroundColor: '#1a1d27' }}>
        <div className="max-w-6xl mx-auto px-4 py-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {['5-min daily rituals', 'Streak tracking', 'Zero friction'].map((stat, i) => (
            <div key={stat} className="flex items-center gap-8">
              <span className="text-sm font-medium text-[#7b82b0]">{stat}</span>
              {i < 2 && <span className="text-[#2e3250] hidden sm:block">·</span>}
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-[#e8eaf6] mb-3">Everything you need, nothing you don't</h2>
          <p className="text-[#7b82b0] max-w-md mx-auto">Built around a single principle: make showing up easier than not showing up.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl p-5 border"
              style={{ backgroundColor: '#1a1d27', borderColor: '#2e3250' }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                style={{ backgroundColor: '#6c63ff20', color: '#6c63ff' }}
              >
                {f.icon}
              </div>
              <h3 className="text-sm font-semibold text-[#e8eaf6] mb-2">{f.title}</h3>
              <p className="text-sm text-[#7b82b0] leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section className="border-t border-[#2e3250]" style={{ backgroundColor: '#1a1d27' }}>
        <div className="max-w-6xl mx-auto px-4 py-24">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#e8eaf6] mb-3">How it works</h2>
            <p className="text-[#7b82b0]">Up and running in under five minutes.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {STEPS.map((step) => (
              <div key={step.n} className="flex flex-col items-center text-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white mb-5"
                  style={{ backgroundColor: '#6c63ff' }}
                >
                  {step.n}
                </div>
                <h3 className="text-sm font-semibold text-[#e8eaf6] mb-2">{step.title}</h3>
                <p className="text-sm text-[#7b82b0] leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-24">
        <div
          className="rounded-2xl p-10 sm:p-16 text-center relative overflow-hidden"
          style={{
            backgroundColor: '#1a1d27',
            border: '1px solid #2e3250',
            boxShadow: '0 0 80px 0 rgba(108,99,255,0.15)',
          }}
        >
          {/* Glow */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(108,99,255,0.12), transparent 70%)' }}
          />

          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#e8eaf6] mb-4">Your momentum starts today.</h2>
            <p className="text-[#7b82b0] mb-8 max-w-md mx-auto">
              No credit card. No time limit. Just a simple, honest tool to help you build the life you want.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white px-8 py-4 rounded-xl transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#6c63ff' }}
            >
              Get started — free forever
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#2e3250]">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: '#6c63ff' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-[#7b82b0]">MomentumOS</span>
            <span className="text-[#4a5080] text-sm">· © 2026</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-sm text-[#4a5080] hover:text-[#7b82b0] transition-colors">Home</Link>
            <Link to="/why" className="text-sm text-[#4a5080] hover:text-[#7b82b0] transition-colors">Why Us</Link>
            <Link to="/login" className="text-sm text-[#4a5080] hover:text-[#7b82b0] transition-colors">Log in</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
