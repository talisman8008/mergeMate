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

const SparklesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l2.8 5.2L20 11l-5.2 2.8L12 19l-2.8-5.2L4 11l5.2-2.8L12 3z" />
  </svg>
)

const LogOutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80 hover:opacity-100 transition-opacity">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
)

const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
)

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
)

export default function Navbar({ user, signIn, signOut }) {
  const [theme, setTheme] = useState('dark')
  const [scrolled, setScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()
  const isLanding = location.pathname === '/'

  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'dark'
    setTheme(saved)
    document.documentElement.classList.remove('light')
    if (saved === 'light') {
      document.documentElement.classList.add('light')
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

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'

    if (nextTheme === 'light') {
      document.documentElement.classList.add('light')
    } else {
      document.documentElement.classList.remove('light')
    }

    localStorage.setItem('theme', nextTheme)
    setTheme(nextTheme)
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

        {/* Left Side: Logo + Nav Links */}
        <div className="flex items-center gap-8">
          {/* Wordmark */}
          <NavLink
            to="/"
            id="nav-wordmark"
            className="flex-shrink-0 flex items-center h-full"
          >
            <img
              src={theme === 'dark'
                ? '/logos/firstmerge-logo-dark-bg.svg'
                : '/logos/firstmerge-logo.svg'}
              alt="FirstMerge Logo"
              className="h-7 w-auto object-contain"
            />
          </NavLink>

          {/* Nav links — only when logged in */}
          {user && (
            <div className="hidden md:flex items-center gap-1.5">
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
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Light/Dark Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-md transition-colors duration-150 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>

          {user ? (
            <>
              {/* Avatar + username */}
              <div className="hidden sm:flex items-center gap-2 ml-2">
                {user.user_metadata?.avatar_url && (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt={user.user_metadata.user_name ?? 'avatar'}
                    className="w-6 h-6 rounded border border-[var(--border)]"
                  />
                )}
              </div>

              <button
                id="navbar-signout-btn"
                onClick={signOut}
                className={`hidden sm:flex font-sans text-[13px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] rounded-md px-2.5 py-1.5 transition-colors duration-150 ml-1 items-center justify-center`}
                title="Sign out"
              >
                <LogOutIcon />
              </button>
            </>
          ) : (
            /* Login */
            <button
              id="navbar-login-btn"
              onClick={signIn}
              className={`hidden sm:inline-flex items-center gap-2 font-sans text-[13px] font-medium rounded-md px-3 py-1.5 btn-scale focus:outline-none ml-2 ${isLanding ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]' : 'bg-[var(--accent-green)] text-[var(--bg-primary)]'}`}
            >
              <GitHubIcon />
              Log in
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-1.5 ml-2 rounded-md transition-colors duration-150 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>

      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-14 left-0 w-full bg-[var(--bg-primary)] border-b border-[var(--border)] shadow-xl flex flex-col py-4 px-4 gap-2 z-50">
          {user ? (
            <>
              <NavLink to="/explore" className={getNavLinkClass}>Explore</NavLink>
              <NavLink to="/prcheck" className={getNavLinkClass}>PR Check</NavLink>
              <NavLink to="/dashboard" className={getNavLinkClass}>Dashboard</NavLink>
              <div className="h-px bg-[var(--border)] my-2 w-full" />
              <button
                onClick={signOut}
                className="w-full text-left font-sans text-[13px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] px-2.5 py-2 flex items-center gap-2 rounded-md"
              >
                <LogOutIcon />
                Sign out
              </button>
            </>
          ) : (
            <button
              onClick={signIn}
              className="w-full inline-flex items-center justify-center gap-2 font-sans text-[13px] font-medium rounded-md px-3 py-2.5 bg-[var(--accent-green)] text-[var(--bg-primary)]"
            >
              <GitHubIcon />
              Log in with GitHub
            </button>
          )}
        </div>
      )}
    </nav>
  )
}
