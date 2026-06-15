import { NavLink, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'

const GitHubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
  </svg>
)

const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"></circle>
    <line x1="12" y1="1" x2="12" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="23"></line>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
    <line x1="1" y1="12" x2="3" y2="12"></line>
    <line x1="21" y1="12" x2="23" y2="12"></line>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
  </svg>
)

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
  </svg>
)

export default function Navbar({ user, signIn, signOut }) {
  const [isDark, setIsDark] = useState(true)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const isLanding = location.pathname === '/'

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'light') {
      document.documentElement.classList.add('light')
      setIsDark(false)
    } else {
      document.documentElement.classList.remove('light')
      setIsDark(true)
    }

    const handleScroll = () => {
      if (location.pathname === '/') {
        setScrolled(window.scrollY > window.innerHeight - 100)
      } else {
        setScrolled(window.scrollY > 50)
      }
    }
    window.addEventListener('scroll', handleScroll)
    // Run once to set initial state
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [location.pathname])

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.add('light')
      localStorage.setItem('theme', 'light')
      setIsDark(false)
    } else {
      document.documentElement.classList.remove('light')
      localStorage.setItem('theme', 'dark')
      setIsDark(true)
    }
  }

  const isDashboard = location.pathname === '/dashboard'
  const navClass = isLanding
    ? `fixed top-0 left-0 w-full z-50 transition-transform duration-300 ${scrolled ? 'translate-y-0 bg-[var(--bg-primary)] border-b border-[var(--border)]' : '-translate-y-full bg-transparent border-transparent'}`
    : `sticky top-0 z-50 transition-all duration-300 ${scrolled ? (isDashboard ? 'bg-[var(--bg-primary)]/90' : 'bg-[var(--bg-primary)]/90') + ' backdrop-blur-sm border-b border-[var(--border)]' : (isDashboard ? 'bg-[var(--bg-primary)] border-transparent' : 'bg-transparent border-transparent')}`

  const getNavLinkClass = ({ isActive }) => {
    if (isLanding) {
      return `font-sans text-[13px] transition-colors duration-150 px-2.5 py-1.5 rounded-md ${isActive ? 'font-semibold text-[var(--text-primary)] bg-[var(--bg-card-hover)]' : 'font-medium text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'}`
    }
    return `font-sans text-[13px] transition-colors duration-150 px-2.5 py-1.5 rounded-md ${isActive ? 'font-semibold bg-[var(--bg-card-hover)] text-[var(--text-primary)]' : 'font-medium text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'}`
  }

  return (
    <nav className={navClass}>
      <div className="w-full mx-auto px-4 md:px-8 lg:px-12 xl:px-16 h-14 flex items-center justify-between gap-6">

        {/* Wordmark */}
        <NavLink
          to="/"
          id="nav-wordmark"
          className="font-sans text-sm font-semibold flex-shrink-0"
          style={{ color: 'var(--text-primary)' }}
        >
          FirstMerge
        </NavLink>

        {/* Nav links — only when logged in */}
        {user && (
          <div className="flex items-center gap-1.5">
            <NavLink to="/explore" id="nav-explore" className={getNavLinkClass}>
              Explore
            </NavLink>
            <NavLink to="/prcheck" id="nav-prcheck" className={getNavLinkClass}>
              PR Check
            </NavLink>
            <NavLink to="/dashboard" id="nav-dashboard" className={getNavLinkClass}>
              Dashboard
            </NavLink>
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Light/Dark Toggle */}
          {!isLanding && (
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-md transition-colors duration-150 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
              aria-label="Toggle theme"
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
          )}

          {user ? (
            <>
              {/* Avatar + username */}
              <div className="flex items-center gap-2 ml-2">
                {user.user_metadata?.avatar_url && (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt={user.user_metadata.user_name ?? 'avatar'}
                    className="w-6 h-6 rounded border border-[var(--border)]"
                  />
                )}
              </div>

              {/* Sign out */}
              <button
                id="navbar-signout-btn"
                onClick={signOut}
                className={isLanding ? "font-sans text-[13px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] rounded-md px-2.5 py-1.5 transition-colors duration-150 ml-1" : "font-sans text-[13px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] rounded-md px-2.5 py-1.5 transition-colors duration-150 ml-1"}
              >
                Sign out
              </button>
            </>
          ) : (
            /* Login */
            <button
              id="navbar-login-btn"
              onClick={signIn}
              className={`inline-flex items-center gap-2 font-sans text-[13px] font-medium rounded-md px-3 py-1.5 btn-scale focus:outline-none ml-2 ${isLanding ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]' : 'bg-[var(--accent-green)] text-[var(--bg-primary)]'}`}
            >
              <GitHubIcon />
              Log in
            </button>
          )}
        </div>

      </div>
    </nav>
  )
}
