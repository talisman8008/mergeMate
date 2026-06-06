import { useNavigate } from 'react-router-dom'

const GitHubIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
  </svg>
)

const features = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#238636" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: 'Friendliness Score',
    description:
      'We compute 4 GitHub signals into one number. No more guessing if a repo welcomes beginners.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#238636" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
    ),
    title: 'Liveness Check',
    description:
      'See exactly how many open PRs already target your issue before you spend 3 days on it.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#238636" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    title: 'PR Preview',
    description:
      'Paste your PR link. AI tells you if it\'s a genuine fix or something that\'ll get ignored.',
  },
]

export default function Home({ user, signIn, signOut }) {
  const navigate = useNavigate()

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-[#f0f6fc] flex flex-col">
      {/* ── Nav ── */}
      <nav className="border-b border-[#30363d]">
        <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between">
          <span
            className="text-sm font-bold tracking-widest text-[#238636]"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            FIRSTMERGE
          </span>
          {user && (
            <button
              id="nav-signout-btn"
              onClick={signOut}
              className="text-xs text-[#8b949e] hover:text-[#f0f6fc] border border-[#30363d] rounded-md px-3 py-1.5 transition-all duration-200 hover:bg-[#161b22]"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Sign out
            </button>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24">
        <div className="max-w-[780px] w-full flex flex-col items-center text-center gap-6">

          {/* Badge */}
          <span
            className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest text-[#238636] border border-[#238636]/40 bg-[#238636]/10 rounded-full px-4 py-1.5 uppercase"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#238636] animate-pulse" />
            Built for CS students
          </span>

          {/* Heading */}
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-[#f0f6fc]"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            Your first open source contribution —{' '}
            <span className="text-[#238636]">one that actually gets merged.</span>
          </h1>

          {/* Subheading */}
          <p
            className="text-base sm:text-lg text-[#8b949e] max-w-[620px] leading-relaxed"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Stop wasting days on dead issues. FirstMerge scores every repo for
            beginner-friendliness, checks if an issue is already claimed, and tells
            you if your PR will actually land.
          </p>

          {/* CTA */}
          {user ? (
            <button
              id="hero-dashboard-btn"
              onClick={() => navigate('/dashboard')}
              className="mt-2 inline-flex items-center gap-2 bg-[#238636] hover:bg-[#2ea043] text-white font-semibold rounded-md px-6 py-3 text-sm transition-all duration-200"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Go to Dashboard
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          ) : (
            <button
              id="hero-login-btn"
              onClick={signIn}
              className="mt-2 inline-flex items-center gap-2.5 bg-[#238636] hover:bg-[#2ea043] text-white font-semibold rounded-md px-6 py-3 text-sm transition-all duration-200"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              <GitHubIcon />
              Login with GitHub
            </button>
          )}
        </div>

        {/* ── Feature Cards ── */}
        <div className="max-w-[1200px] w-full mt-20 grid grid-cols-1 sm:grid-cols-3 gap-4 px-0">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 flex flex-col gap-3 hover:border-[#238636]/50 transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-[#238636]/10 border border-[#238636]/20 flex-shrink-0">
                  {f.icon}
                </div>
                <h2
                  className="text-sm font-bold text-[#f0f6fc] tracking-wide"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  {f.title}
                </h2>
              </div>
              <p
                className="text-sm text-[#8b949e] leading-relaxed"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-[#30363d] py-6">
        <p
          className="text-center text-xs text-[#8b949e]"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          FirstMerge • HackVerse 2025
        </p>
      </footer>
    </div>
  )
}
