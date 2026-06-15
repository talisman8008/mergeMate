import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import Navbar from '../components/Navbar.jsx'

const GitHubIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
  </svg>
)

function useIntersectionObserver(options = {}) {
  const [isVisible, setIsVisible] = useState(false)
  const domRef = useRef()
  
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px', ...options })
    
    if (domRef.current) observer.observe(domRef.current)
    return () => observer.disconnect()
  }, [])
  
  return [domRef, isVisible]
}

const FadeIn = ({ children, delay = 0, className = "" }) => {
  const [ref, isVisible] = useIntersectionObserver()
  return (
    <div 
      ref={ref} 
      className={className}
      style={{ 
        opacity: isVisible ? 1 : 0, 
        transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 500ms ease-out ${delay}ms, transform 500ms ease-out ${delay}ms`
      }}
    >
      {children}
    </div>
  )
}

const SignalRow = ({ name, percent, score, color, delay }) => {
  const [ref, isVisible] = useIntersectionObserver()
  return (
    <div ref={ref} className="flex items-center gap-6 mb-5" style={{ transition: `opacity 500ms ease-out ${delay}ms, transform 500ms ease-out ${delay}ms`, opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(24px)' }}>
      <div className="w-[280px] font-mono text-[14px] text-[var(--text-primary)] whitespace-nowrap">{name}</div>
      <div className="flex-1 h-[2px] bg-[var(--border)] relative overflow-hidden rounded-full">
        <div 
          className="absolute top-0 left-0 h-full transition-all duration-1000 ease-out"
          style={{ width: isVisible ? `${percent}%` : '0%', backgroundColor: `var(${color})`, transitionDelay: `${delay + 200}ms` }}
        />
      </div>
      <div className="w-[40px] text-right font-mono text-[14px] text-[var(--text-primary)]">{score}</div>
    </div>
  )
}

const Heatmap = () => {
  const cols = 52
  const rows = 7
  
  const getCellOpacity = (c, r) => {
    // Generate scattered clusters in last 12 weeks (cols 40-51)
    if (c >= 40) {
      if ((c === 45 && r === 2) || (c === 48 && r === 4) || (c === 51 && r === 1)) return 1 // full
      if ((c === 42 && r === 2) || (c === 46 && r === 3) || (c === 49 && r === 5) || (c === 50 && r === 2)) return 0.6
      if ((c === 41 && r === 4) || (c === 44 && r === 5) || (c === 47 && r === 1) || (c === 50 && r === 3) || (c === 51 && r === 4)) return 0.3
    }
    return 0 // border
  }

  const months = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May']

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between text-[13px] text-[var(--text-muted)]">
        <div className="flex items-center gap-2">
          <span><span className="font-bold text-[var(--text-primary)]">100</span> submissions in the past one year</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-50">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        </div>
        <div className="flex items-center gap-4 mt-2 md:mt-0">
          <div>Total active days: <span className="font-bold text-[var(--text-primary)]">36</span></div>
          <div>Max streak: <span className="font-bold text-[var(--text-primary)]">10</span></div>
          <div className="bg-[var(--bg-card)] px-3 py-1 rounded-md border border-[var(--border)] flex items-center gap-2 text-[var(--text-primary)] ml-2 cursor-pointer">
            Current
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex flex-col gap-[3px] w-full">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-[3px] w-full">
            {Array.from({ length: cols }).map((_, c) => {
              const opacity = getCellOpacity(c, r)
              return (
                <div 
                  key={c} 
                  className="flex-1 aspect-square rounded-[2px]" 
                  style={{ 
                    backgroundColor: opacity > 0 ? `color-mix(in srgb, var(--accent-green) ${opacity * 100}%, transparent)` : 'var(--border)' 
                  }} 
                />
              )
            })}
          </div>
        ))}
      </div>

      {/* Months */}
      <div className="flex justify-between text-[12px] text-[var(--text-muted)] px-1">
        {months.map((m, i) => (
          <div key={i}>{m}</div>
        ))}
      </div>
    </div>
  )
}

export default function Home({ user, signIn, signOut }) {
  const navigate = useNavigate()

  return (
    <div className="landing min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] font-body">
      <Navbar user={user} signIn={signIn} signOut={signOut} />

      <main className="flex-1 flex flex-col w-full">
        
        {/* SECTION 1 */}
        <section className="h-[100vh] w-full flex flex-col items-center justify-center px-6">
          <FadeIn delay={0}>
            <h1 className="text-[48px] md:text-[80px] font-display font-bold leading-[0.9] tracking-[-2px] text-center text-[var(--text-primary)] max-w-[800px]">
              You've been contributing<br/>to open source wrong.
            </h1>
          </FadeIn>
          <FadeIn delay={100} className="mt-[40px]">
            <p className="font-mono text-[13px] text-[var(--text-muted)] uppercase tracking-widest text-center">
              SCROLL TO FIND OUT WHY
            </p>
          </FadeIn>
        </section>

        {/* SECTION 2 */}
        <section className="w-full max-w-[1200px] mx-auto px-6 py-[120px] flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1">
            <FadeIn delay={0}>
              <p className="font-mono text-[13px] text-[var(--text-muted)] uppercase tracking-wider mb-4">THE PROBLEM</p>
            </FadeIn>
            <FadeIn delay={100}>
              <h2 className="font-display text-[48px] font-bold text-[var(--text-primary)] leading-[1.1] mb-6">
                This is what goodfirstissue.dev showed you.
              </h2>
            </FadeIn>
            <FadeIn delay={200}>
              <p className="font-display text-[18px] text-[var(--text-muted)]">
                A label. No data. No context. Just hope.
              </p>
            </FadeIn>
          </div>
          <div className="w-full md:w-[45%]">
            <FadeIn delay={300}>
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[8px] p-8 w-full max-w-[420px] mx-auto shadow-none">
                <p className="font-mono text-[13px] text-[var(--text-muted)] mb-2">random-user/abandoned-project</p>
                <h3 className="font-display text-[18px] font-bold text-[var(--text-primary)] mb-6">Fix typo in README.md</h3>
                
                <div className="flex items-center gap-4 mb-8">
                  <svg width="48" height="48" viewBox="0 0 48 48">
                    <circle cx="24" cy="24" r="20" fill="none" stroke="var(--border)" strokeWidth="4" />
                    <circle cx="24" cy="24" r="20" fill="none" stroke="var(--accent-red)" strokeWidth="4" strokeDasharray="125.6" strokeDashoffset="110" strokeLinecap="round" transform="rotate(-90 24 24)" />
                    <text x="24" y="29" textAnchor="middle" className="font-mono font-bold text-[14px]" fill="var(--accent-red)">12</text>
                  </svg>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="inline-flex max-w-fit px-3 py-1.5 rounded-full bg-[color-mix(in_srgb,var(--accent-red)_15%,transparent)] text-[var(--accent-red)] font-mono text-[12px] font-bold tracking-wider uppercase items-center gap-2">
                    <span>✗</span> Last activity: 8 months ago
                  </div>
                  <div className="inline-flex max-w-fit px-3 py-1.5 rounded-full bg-[color-mix(in_srgb,var(--accent-red)_15%,transparent)] text-[var(--accent-red)] font-mono text-[12px] font-bold tracking-wider uppercase items-center gap-2">
                    <span>✗</span> 11 open PRs already
                  </div>
                  <div className="inline-flex max-w-fit px-3 py-1.5 rounded-full bg-[color-mix(in_srgb,var(--accent-red)_15%,transparent)] text-[var(--accent-red)] font-mono text-[12px] font-bold tracking-wider uppercase items-center gap-2">
                    <span>✗</span> Maintainer response: never
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* SECTION 3 */}
        <section className="w-full bg-[var(--bg-card)]">
          <div className="max-w-[1200px] mx-auto px-6 py-[120px]">
            <FadeIn delay={0}>
              <p className="font-mono text-[13px] text-[var(--text-muted)] uppercase tracking-wider mb-4">THE SOLUTION</p>
            </FadeIn>
            <FadeIn delay={100}>
              <h2 className="font-display text-[48px] font-bold text-[var(--text-primary)] leading-[1.1] mb-16 max-w-[800px]">
                We computed what they never showed you.
              </h2>
            </FadeIn>
            
            <div className="w-full max-w-[800px]">
              <SignalRow name="MAINTAINER RESPONSE TIME" percent={85} score="85" color="--landing-green" delay={200} />
              <SignalRow name="BEGINNER PR MERGE RATE" percent={73} score="73" color="--landing-green" delay={300} />
              <SignalRow name="ISSUE FRESHNESS" percent={91} score="91" color="--landing-green" delay={400} />
              <SignalRow name="PR COLLISION COUNT" percent={100} score="100" color="--landing-green" delay={500} />
              
              <FadeIn delay={700} className="mt-10">
                <div className="font-display text-[24px] font-bold text-[var(--accent-green)]">
                  = Friendliness Score: 87
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* SECTION 4 */}
        <section className="w-full max-w-[1200px] mx-auto px-6 py-[120px] flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1">
            <FadeIn delay={0}>
              <p className="font-mono text-[13px] text-[var(--text-muted)] uppercase tracking-wider mb-4">PR QUALITY CHECK</p>
            </FadeIn>
            <FadeIn delay={100}>
              <h2 className="font-display text-[48px] font-bold text-[var(--text-primary)] leading-[1.1] mb-6">
                Know before you submit.
              </h2>
            </FadeIn>
            <FadeIn delay={200}>
              <p className="font-display text-[18px] text-[var(--text-muted)] max-w-[480px]">
                Paste your PR URL. AI fetches the diff, reads the issue, checks the CONTRIBUTING.md, and tells you the truth.
              </p>
            </FadeIn>
          </div>
          <div className="w-full md:w-[45%]">
            <FadeIn delay={300}>
              <div className="bg-[var(--bg-card)] border-[2px] border-[var(--accent-green)] rounded-[8px] p-8 w-full max-w-[420px] mx-auto shadow-none">
                <p className="font-mono text-[13px] text-[var(--text-muted)] uppercase tracking-widest mb-1">VERDICT</p>
                <div className="font-display text-[64px] font-bold text-[var(--accent-green)] leading-none tracking-tight mb-8">
                  GENUINE
                </div>
                
                <div className="h-[1px] w-full bg-[var(--border)] mb-6" />
                
                <p className="font-mono text-[13px] text-[var(--text-muted)] uppercase tracking-widest mb-2">REASON</p>
                <p className="font-display text-[16px] text-[var(--text-primary)] leading-relaxed">
                  The PR correctly implements error handling for the null case described in the issue.
                </p>
                
                <p className="font-mono text-[13px] text-[var(--text-muted)] uppercase tracking-widest mt-6 mb-2">SUGGESTION</p>
                <p className="font-display text-[16px] text-[var(--text-primary)] leading-relaxed">
                  Add a unit test for the edge case before submitting.
                </p>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* SECTION 5 */}
        <section className="w-full bg-[var(--bg-card)]">
          <div className="max-w-[1200px] mx-auto px-6 py-[120px]">
            <FadeIn delay={0}>
              <p className="font-mono text-[13px] text-[var(--text-muted)] uppercase tracking-wider mb-4">CONTRIBUTION RECORD</p>
            </FadeIn>
            <FadeIn delay={100}>
              <h2 className="font-display text-[48px] font-bold text-[var(--text-primary)] leading-[1.1] mb-16">
                Every merged PR. Tracked.
              </h2>
            </FadeIn>
            
            <FadeIn delay={200}>
              <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-8 max-w-[950px] mx-auto mb-6 shadow-none overflow-x-auto">
                <Heatmap />
              </div>
            </FadeIn>

            <FadeIn delay={300}>
              <div className="flex flex-wrap gap-8 items-center max-w-[950px] mx-auto px-8">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-[var(--accent-green)] flex items-center justify-center text-base bg-[color-mix(in_srgb,var(--accent-green)_10%,transparent)]">🥉</div>
                  <div className="font-mono text-[12px] font-bold text-[var(--text-primary)] tracking-wider">7-DAY STREAK</div>
                </div>
                <div className="flex flex-col items-center gap-3 opacity-50">
                  <div className="w-10 h-10 rounded-full border-2 border-[var(--border)] flex items-center justify-center text-base grayscale">🥈</div>
                  <div className="font-mono text-[12px] font-bold text-[var(--text-muted)] tracking-wider">21-DAY STREAK</div>
                </div>
                <div className="flex flex-col items-center gap-3 opacity-50">
                  <div className="w-10 h-10 rounded-full border-2 border-[var(--border)] flex items-center justify-center text-base grayscale">🥇</div>
                  <div className="font-mono text-[12px] font-bold text-[var(--text-muted)] tracking-wider">50-DAY STREAK</div>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* SECTION 6 */}
        <section className="h-[100vh] w-full flex flex-col items-center justify-center px-6">
          <FadeIn delay={0}>
            <h2 className="text-[64px] font-display font-bold leading-[1.1] text-center text-[var(--text-primary)] mb-4">
              Start contributing right.
            </h2>
          </FadeIn>
          <FadeIn delay={100}>
            <p className="font-display text-[20px] text-[var(--text-muted)] text-center mb-10">
              Free. Works with any public GitHub repo.
            </p>
          </FadeIn>
          <FadeIn delay={200}>
            {user ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-[var(--accent-green)] text-[var(--bg-primary)] font-display text-[16px] px-8 py-4 rounded-[6px] transition-transform hover:scale-95 flex items-center gap-3 font-medium"
              >
                Go to Dashboard
              </button>
            ) : (
              <button
                onClick={signIn}
                className="bg-[var(--accent-green)] text-[var(--bg-primary)] font-display text-[16px] px-8 py-4 rounded-[6px] transition-transform hover:scale-95 flex items-center gap-3 font-medium"
              >
                <GitHubIcon />
                Continue with GitHub
              </button>
            )}
          </FadeIn>
          <FadeIn delay={300} className="mt-6">
            <p className="font-mono text-[12px] text-[var(--text-muted)] uppercase tracking-widest text-center">
              NO CREDIT CARD. NO SETUP. JUST GITHUB OAUTH.
            </p>
          </FadeIn>
        </section>

      </main>
    </div>
  )
}
