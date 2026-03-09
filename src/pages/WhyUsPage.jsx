import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LandingNav from '../components/LandingNav'

const PAIN_POINTS = [
  {
    problem: 'Habit apps have 50+ features to configure',
    solution: 'Start in 2 minutes — no onboarding wizard, no bloat',
  },
  {
    problem: 'No sense of daily progress',
    solution: 'Live Momentum Score updates with every completion',
  },
  {
    problem: 'Streaks reset forever on one bad day',
    solution: 'Score-based — one miss doesn\'t nuke everything',
  },
  {
    problem: 'Generic reminders you learn to ignore',
    solution: 'A ritual view that makes you want to open the app',
  },
]

const FEATURE_CARDS = [
  {
    title: 'Ritual Mode',
    body: 'Full-screen focus. One habit at a time. A countdown timer that keeps you honest. No notifications, no sidebar, just you and the task.',
    color: '#6c63ff',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" />
      </svg>
    ),
  },
  {
    title: 'Streak-aware Scoring',
    body: 'Your Momentum Score blends completion rate (70%) with a streak bonus (30%). Honest signal — not a dopamine trap.',
    color: '#43e97b',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    title: 'Per-track Heatmaps',
    body: '30 days of visual history for each area of your life. See patterns at a glance. Know exactly which track needs attention.',
    color: '#4facfe',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    title: 'Journeys',
    body: 'Pre-built habit templates for morning routines, deep work, fitness, and learning. One tap to clone into your own track.',
    color: '#f7971e',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M3 12h18M3 6l9-3 9 3M3 18l9 3 9-3" />
      </svg>
    ),
  },
]

export default function WhyUsPage() {
  const { user } = useAuth()
  if (user) return <Navigate to="/dashboard" replace />

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0f1117', color: '#e8eaf6' }}>
      <LandingNav />

      {/* ── Problem Hero ──────────────────────────────────────────────────── */}
      <section className="relative pt-16">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(108,99,255,0.12), transparent 60%)' }}
        />
        <div className="relative max-w-3xl mx-auto px-4 py-24 text-center animate-slideUp">
          <div
            className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-6"
            style={{ backgroundColor: '#6c63ff20', color: '#6c63ff', border: '1px solid #6c63ff40' }}
          >
            Built differently
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-6 text-[#e8eaf6]">
            Most habit apps fail you.<br />
            <span style={{ color: '#6c63ff' }}>Here's why we're different.</span>
          </h1>
          <p className="text-lg text-[#7b82b0] leading-relaxed max-w-xl mx-auto">
            We built MomentumOS around one insight: the ritual matters more than the result.
            Show up consistently and the results take care of themselves.
          </p>
        </div>
      </section>

      {/* ── Pain points vs solutions ───────────────────────────────────────── */}
      <section className="border-t border-[#2e3250]" style={{ backgroundColor: '#1a1d27' }}>
        <div className="max-w-5xl mx-auto px-4 py-20">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Problems */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#4a5080] mb-5 flex items-center gap-2">
                <span className="text-red-400">✕</span> The problem with other apps
              </p>
              <div className="space-y-3">
                {PAIN_POINTS.map((p) => (
                  <div
                    key={p.problem}
                    className="flex items-start gap-3 p-4 rounded-xl border"
                    style={{ backgroundColor: '#0f1117', borderColor: '#2e3250' }}
                  >
                    <span className="text-red-400 mt-0.5 shrink-0 text-sm">✕</span>
                    <p className="text-sm text-[#7b82b0]">{p.problem}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Solutions */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#4a5080] mb-5 flex items-center gap-2">
                <span style={{ color: '#43e97b' }}>✓</span> MomentumOS
              </p>
              <div className="space-y-3">
                {PAIN_POINTS.map((p) => (
                  <div
                    key={p.solution}
                    className="flex items-start gap-3 p-4 rounded-xl border"
                    style={{ backgroundColor: '#0f1117', borderColor: '#43e97b30' }}
                  >
                    <span className="mt-0.5 shrink-0 text-sm" style={{ color: '#43e97b' }}>✓</span>
                    <p className="text-sm text-[#e8eaf6]">{p.solution}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Philosophy ────────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 py-24 text-center">
        <div
          className="rounded-2xl p-10 border relative overflow-hidden"
          style={{ backgroundColor: '#1a1d27', borderColor: '#2e3250' }}
        >
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(108,99,255,0.08), transparent)' }}
          />
          <svg
            className="w-8 h-8 mx-auto mb-6 opacity-30"
            viewBox="0 0 24 24"
            fill="#6c63ff"
          >
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>
          <blockquote className="text-xl sm:text-2xl font-semibold text-[#e8eaf6] leading-snug mb-6 relative">
            "Small consistent actions, tracked honestly, compound into transformation."
          </blockquote>
          <p className="text-sm text-[#7b82b0] leading-relaxed max-w-xl mx-auto">
            We don't believe in gamification gimmicks or notification spam. MomentumOS gives you
            clear signal — a score, a heatmap, a streak — so you always know where you stand
            and what showing up tomorrow is worth.
          </p>
        </div>
      </section>

      {/* ── Deep-dive feature cards ────────────────────────────────────────── */}
      <section className="border-t border-[#2e3250]" style={{ backgroundColor: '#1a1d27' }}>
        <div className="max-w-5xl mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#e8eaf6] mb-3">Under the hood</h2>
            <p className="text-[#7b82b0]">Every feature exists for a reason. Here's what each one does.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {FEATURE_CARDS.map((card) => (
              <div
                key={card.title}
                className="rounded-xl p-6 border"
                style={{ backgroundColor: '#0f1117', borderColor: '#2e3250' }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: card.color + '20', color: card.color }}
                >
                  {card.icon}
                </div>
                <h3 className="text-base font-semibold text-[#e8eaf6] mb-2">{card.title}</h3>
                <p className="text-sm text-[#7b82b0] leading-relaxed">{card.body}</p>
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
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(108,99,255,0.12), transparent 70%)' }}
          />
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#e8eaf6] mb-4">Ready to build real momentum?</h2>
            <p className="text-[#7b82b0] mb-8 max-w-md mx-auto">
              Join people who chose clarity over chaos. Your streak starts the moment you begin.
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
