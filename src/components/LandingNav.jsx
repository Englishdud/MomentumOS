import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'backdrop-blur-md border-b border-[#2e3250]' : ''
      }`}
      style={{ backgroundColor: scrolled ? 'rgba(15,17,23,0.85)' : 'transparent' }}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#6c63ff' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <span className="font-bold text-base tracking-tight text-[#e8eaf6]">MomentumOS</span>
        </Link>

        <div className="flex-1" />

        {/* Desktop links */}
        <nav className="hidden md:flex items-center gap-2">
          <Link
            to="/why"
            className="text-sm text-[#7b82b0] hover:text-[#e8eaf6] px-3 py-2 rounded-lg transition-colors"
          >
            Why Us
          </Link>
          <Link
            to="/login"
            className="text-sm text-[#7b82b0] hover:text-[#e8eaf6] border border-[#2e3250] hover:border-[#3d4265] px-4 py-2 rounded-lg transition-colors"
          >
            Log in
          </Link>
          <Link
            to="/login?mode=signup"
            className="text-sm font-semibold text-white px-4 py-2 rounded-lg transition-colors hover:opacity-90"
            style={{ backgroundColor: '#6c63ff' }}
          >
            Get started
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg text-[#7b82b0] hover:text-[#e8eaf6] transition-colors"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden border-t border-[#2e3250] px-4 py-4 flex flex-col gap-2" style={{ backgroundColor: 'rgba(15,17,23,0.97)' }}>
          <Link
            to="/why"
            onClick={() => setMenuOpen(false)}
            className="text-sm text-[#7b82b0] hover:text-[#e8eaf6] px-3 py-2.5 rounded-lg transition-colors"
          >
            Why Us
          </Link>
          <Link
            to="/login"
            onClick={() => setMenuOpen(false)}
            className="text-sm text-[#7b82b0] hover:text-[#e8eaf6] border border-[#2e3250] px-3 py-2.5 rounded-lg transition-colors text-center"
          >
            Log in
          </Link>
          <Link
            to="/login?mode=signup"
            onClick={() => setMenuOpen(false)}
            className="text-sm font-semibold text-white px-3 py-2.5 rounded-lg transition-colors text-center hover:opacity-90"
            style={{ backgroundColor: '#6c63ff' }}
          >
            Get started — free forever
          </Link>
        </div>
      )}
    </header>
  )
}
