export default function JourneysPanel() {
  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#e8eaf6]">Journeys</h2>
        <p className="text-sm text-[#7b82b0] mt-0.5">Multi-week habit campaigns and challenges</p>
      </div>

      {/* Coming soon placeholder */}
      <div className="bg-[#1a1d27] border border-[#2e3250] rounded-2xl p-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#f093fb]/10 border border-[#f093fb]/20 flex items-center justify-center mx-auto mb-5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f093fb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12h18M3 6l9-3 9 3M3 18l9 3 9-3" />
          </svg>
        </div>
        <h3 className="text-[#e8eaf6] font-semibold text-lg mb-2">Journeys coming soon</h3>
        <p className="text-[#7b82b0] text-sm max-w-sm mx-auto leading-relaxed">
          Plan focused multi-week journeys — like a 30-day morning routine challenge or a 12-week fitness program.
          Set milestones, track streaks, and celebrate completions.
        </p>

        {/* Feature preview cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 text-left">
          {[
            {
              icon: '🗓️',
              title: 'Time-boxed campaigns',
              desc: 'Define start and end dates for focused habit sprints.',
            },
            {
              icon: '🔥',
              title: 'Streak tracking',
              desc: 'Visualize your consistency with daily streak counters.',
            },
            {
              icon: '🏆',
              title: 'Milestone rewards',
              desc: 'Unlock badges and insights as you hit goals.',
            },
          ].map((f) => (
            <div key={f.title} className="bg-[#22263a] border border-[#2e3250] rounded-xl p-4">
              <div className="text-2xl mb-2">{f.icon}</div>
              <p className="text-sm font-medium text-[#e8eaf6] mb-1">{f.title}</p>
              <p className="text-xs text-[#7b82b0] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
