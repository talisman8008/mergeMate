import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar.jsx'
import supabase from '../lib/supabase.js'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

// ── Icons ─────────────────────────────────────────────────────────────────────

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

const SpinnerIcon = () => (
  <div className="w-4 h-4 rounded-full border-2 border-[var(--border)] border-t-[var(--text)] animate-spin" />
)

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const XIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

// ── Loading skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 space-y-4 animate-pulse shadow-sm">
      <div className="flex items-center justify-between">
        <div className="h-4 w-28 bg-[var(--border)] rounded" />
        <div className="h-5 w-16 bg-[var(--border)] rounded-sm" />
      </div>
      <div className="space-y-3">
        <div className="h-3 w-full bg-[var(--border)] rounded" />
        <div className="h-3 w-5/6 bg-[var(--border)] rounded" />
        <div className="h-3 w-4/6 bg-[var(--border)] rounded" />
      </div>
      <div className="pt-5 border-t border-[var(--border)] space-y-3">
        <div className="h-3 w-full bg-[var(--border)] rounded" />
        <div className="h-3 w-3/4 bg-[var(--border)] rounded" />
        <div className="h-3 w-2/3 bg-[var(--border)] rounded" />
      </div>
    </div>
  )
}

// ── Difficulty badge ──────────────────────────────────────────────────────────

function DifficultyBadge({ difficulty }) {
  const colors = {
    Easy: 'bg-[color-mix(in_srgb,var(--green)_15%,transparent)] text-[var(--green)] border-[color-mix(in_srgb,var(--green)_30%,transparent)]',
    Medium: 'bg-[color-mix(in_srgb,var(--accent-amber)_15%,transparent)] text-[var(--accent-amber)] border-[color-mix(in_srgb,var(--accent-amber)_30%,transparent)]',
    Hard: 'bg-[color-mix(in_srgb,var(--red)_15%,transparent)] text-[var(--red)] border-[color-mix(in_srgb,var(--red)_30%,transparent)]',
  }
  const colorClass = colors[difficulty] || colors.Medium

  return (
    <span className={`inline-flex items-center font-mono text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-sm border ${colorClass}`}>
      {difficulty}
    </span>
  )
}

// ── Tab button ────────────────────────────────────────────────────────────────

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 font-mono text-[12px] uppercase tracking-wider font-bold rounded-sm transition-all duration-300 btn-scale focus:outline-none ${active
          ? 'bg-[var(--border)] text-[var(--text)] shadow-sm'
          : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text)]'
        }`}
    >
      {children}
    </button>
  )
}

// ── Error alert ───────────────────────────────────────────────────────────────

function ErrorAlert({ message }) {
  if (!message) return null
  return (
    <div className="bg-[color-mix(in_srgb,var(--red)_5%,transparent)] border border-[color-mix(in_srgb,var(--red)_20%,transparent)] rounded-lg p-4 animate-[fadeIn_0.3s_ease-out] shadow-[inset_0_0_20px_color-mix(in_srgb,var(--red)_5%,transparent)]">
      <p className="font-mono text-[12px] font-bold uppercase tracking-wider" style={{ color: 'var(--red)' }}>
        {message}
      </p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PRCheck({ user, signIn, signOut }) {
  const [activeTab, setActiveTab] = useState('before')
  const [issueUrl, setIssueUrl] = useState('')
  const [prUrl, setPrUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [beforeResult, setBeforeResult] = useState(null)
  const [afterResult, setAfterResult] = useState(null)
  const [savingStatus, setSavingStatus] = useState('idle')
  const [recentChecks, setRecentChecks] = useState([])

  useEffect(() => {
    const saved = JSON.parse(sessionStorage.getItem('recentPRChecks') || '[]')
    setRecentChecks(saved)
  }, [])

  const saveRecentCheck = (url, verdict) => {
    const saved = JSON.parse(sessionStorage.getItem('recentPRChecks') || '[]')
    const updated = [{ url, verdict, timestamp: Date.now() }, ...saved.filter(c => c.url !== url)].slice(0, 3)
    sessionStorage.setItem('recentPRChecks', JSON.stringify(updated))
    setRecentChecks(updated)
  }

  const handleAnalyseIssue = async () => {
    if (!issueUrl.trim()) return
    setLoading(true)
    setError(null)
    setBeforeResult(null)
    setSavingStatus('idle')

    try {
      const res = await fetch(`${BACKEND_URL}/api/prcheck/before`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueUrl }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Server returned ${res.status}`)
      setBeforeResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveIssue = async () => {
    try {
      setSavingStatus('saving')
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setSavingStatus('error')
        setTimeout(() => setSavingStatus('idle'), 2000)
        return
      }

      let repo_name = 'unknown/repo'
      let issue_title = 'Saved from PR Check'

      try {
        const urlObj = new URL(issueUrl)
        if (urlObj.hostname === 'github.com') {
          const parts = urlObj.pathname.split('/').filter(Boolean)
          if (parts.length >= 2) repo_name = `${parts[0]}/${parts[1]}`
        }
      } catch {
        // Ignore empty blocks
      }

      const res = await fetch(`${BACKEND_URL}/api/user/issues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ issue_title, repo_name, issue_url: issueUrl })
      })

      if (res.status === 409) {
        setSavingStatus('already_saved')
        return
      }
      if (!res.ok) throw new Error('Failed')
      setSavingStatus('saved')
    } catch {
      setSavingStatus('error')
      setTimeout(() => setSavingStatus('idle'), 2000)
    }
  }

  const handleCheckPR = async () => {
    if (!prUrl.trim()) return
    setLoading(true)
    setError(null)
    setAfterResult(null)

    try {
      const res = await fetch(`${BACKEND_URL}/api/prcheck/after`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prUrl }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Server returned ${res.status}`)
      setAfterResult(data)
      saveRecentCheck(prUrl, data.verdict)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckAnother = () => {
    if (activeTab === 'before') {
      setIssueUrl('')
      setBeforeResult(null)
      setSavingStatus('idle')
    } else {
      setPrUrl('')
      setAfterResult(null)
    }
    setError(null)
  }

  return (
    <div className="bg-[var(--canvas)] min-h-screen text-[var(--text)]">
      <Navbar user={user} signIn={signIn} signOut={signOut} />

      <div className="w-full max-w-[1200px] mx-auto px-6 py-12 flex flex-col md:flex-row gap-12">
        <div className="flex-1 max-w-[700px] mx-auto w-full">
          <div className="text-center mb-12">
            <h1 className="text-[40px] md:text-[56px] font-display font-bold tracking-tight text-[var(--text)] mb-4">
              PR Check
            </h1>
            <p className="font-mono text-[13px] text-[var(--text-secondary)] max-w-[400px] mx-auto leading-relaxed uppercase tracking-widest">
              Get AI-powered guidance before you code, or a verdict after you open your PR.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 mb-10 bg-[var(--surface)] p-1.5 rounded-lg border-2 border-[var(--border)] max-w-fit mx-auto shadow-none">
          <TabButton active={activeTab === 'before'} onClick={() => { setActiveTab('before'); setError(null) }}>
            Before Writing Code
          </TabButton>
          <TabButton active={activeTab === 'after'} onClick={() => { setActiveTab('after'); setError(null) }}>
            After Opening PR
          </TabButton>
        </div>

        {activeTab === 'before' && (
          <div className="space-y-6">
            <div className="bg-[var(--surface)] border-2 border-[var(--border)] rounded-xl p-6 shadow-none">
              <label htmlFor="issue-url-input" className="block font-mono text-[13px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-3">
                STEP 1: GITHUB ISSUE URL
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  id="issue-url-input"
                  type="text"
                  value={issueUrl}
                  onChange={(e) => setIssueUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAnalyseIssue()}
                  placeholder="https://github.com/owner/repo/issues/123"
                  className="flex-1 bg-[var(--canvas)]/20 border border-[rgba(255,255,255,0.05)] rounded-sm px-4 py-3 font-mono text-[13px] text-[var(--text)] focus:outline-none focus:border-[var(--teal)] transition-colors shadow-inner"
                  disabled={loading}
                />
                <button
                  onClick={handleAnalyseIssue}
                  disabled={loading || !issueUrl.trim()}
                  className="inline-flex items-center justify-center gap-2 font-mono font-bold uppercase tracking-widest rounded-md px-6 py-3 text-[13px] bg-[var(--teal)] text-black btn-scale focus:outline-none disabled:opacity-50"
                >
                  {loading ? <SpinnerIcon /> : <SearchIcon />}
                  Analyse Issue
                </button>
              </div>
            </div>

            <ErrorAlert message={error} />
            {loading && <LoadingSkeleton />}

            {beforeResult && !loading && (
              <div className="bg-[var(--surface)] border-2 border-[var(--border)] rounded-xl overflow-hidden shadow-none animate-[fadeIn_0.3s_ease-out]">
                <div className="px-8 py-5 border-b-2 border-[var(--border)] flex items-center justify-between">
                  <h2 className="font-mono text-[13px] font-bold text-[var(--text)] uppercase tracking-wider">
                    RESULTS
                  </h2>
                  <DifficultyBadge difficulty={beforeResult.difficulty} />
                </div>

                <div className="p-8 space-y-8">
                  <div>
                    <h3 className="font-mono text-[12px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: 'var(--teal)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      What to Build
                    </h3>
                    <p className="text-[16px] text-[var(--text-secondary)] leading-relaxed">
                      {beforeResult.whatToBuild}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-mono text-[12px] font-bold uppercase tracking-widest mb-3 text-[var(--text-muted)]">Files to Touch</h3>
                    <p className="font-mono text-[13px] text-[var(--text)] bg-[var(--canvas)]/20 border border-[rgba(255,255,255,0.05)] shadow-inner rounded-lg p-5 leading-relaxed break-all whitespace-pre-wrap">
                      {beforeResult.filesToTouch}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-mono text-[12px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: 'var(--red)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                      What to Avoid
                    </h3>
                    <p className="text-[16px] text-[var(--text-secondary)] leading-relaxed">
                      {beforeResult.whatToAvoid}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {beforeResult && !loading && (
              <div className="flex justify-between items-center mt-4 animate-[fadeIn_0.3s_ease-out]">
                <button
                  onClick={handleCheckAnother}
                  className="font-mono text-[12px] font-bold uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text)] bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-elevated)] rounded-md px-6 py-3 transition-colors btn-scale focus:outline-none"
                >
                  ← CHECK ANOTHER
                </button>
                <button
                  onClick={handleSaveIssue}
                  disabled={savingStatus !== 'idle'}
                  className={`font-mono text-[12px] font-bold uppercase tracking-widest border rounded-md px-6 py-3 transition-all duration-300 disabled:opacity-50 btn-scale focus:outline-none ${savingStatus === 'saved' || savingStatus === 'already_saved'
                      ? 'bg-[color-mix(in_srgb,var(--green)_10%,transparent)] text-[var(--green)] border-[color-mix(in_srgb,var(--green)_30%,transparent)] cursor-not-allowed'
                      : savingStatus === 'error'
                        ? 'bg-[color-mix(in_srgb,var(--red)_10%,transparent)] text-[var(--red)] border-[color-mix(in_srgb,var(--red)_30%,transparent)]'
                        : 'bg-[var(--surface)] text-[var(--text)] border-[var(--border)] hover:bg-[var(--surface-elevated)] hover:border-[var(--border-hover)]'
                    }`}
                >
                  {savingStatus === 'saving' && 'SAVING...'}
                  {savingStatus === 'saved' && 'SAVED'}
                  {savingStatus === 'already_saved' && 'ALREADY SAVED'}
                  {savingStatus === 'error' && 'FAILED'}
                  {savingStatus === 'idle' && 'SAVE TO DASHBOARD'}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'after' && (
          <div className="space-y-6">
            <div className="bg-[var(--surface)] border-2 border-[var(--border)] rounded-xl p-6 shadow-none">
              <label htmlFor="pr-url-input" className="block font-mono text-[13px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-3">
                STEP 1: GITHUB PR URL
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  id="pr-url-input"
                  type="text"
                  value={prUrl}
                  onChange={(e) => setPrUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCheckPR()}
                  placeholder="https://github.com/owner/repo/pull/123"
                  className="flex-1 bg-[var(--canvas)]/20 border border-[rgba(255,255,255,0.05)] rounded-sm px-4 py-3 font-mono text-[13px] text-[var(--text)] focus:outline-none focus:border-[var(--teal)] transition-colors shadow-inner"
                  disabled={loading}
                />
                <button
                  onClick={handleCheckPR}
                  disabled={loading || !prUrl.trim()}
                  className="inline-flex items-center justify-center gap-2 font-mono font-bold uppercase tracking-widest rounded-md px-6 py-3 text-[13px] bg-[var(--teal)] text-black btn-scale focus:outline-none disabled:opacity-50"
                >
                  {loading ? <SpinnerIcon /> : <SearchIcon />}
                  Check My PR
                </button>
              </div>
            </div>

            <ErrorAlert message={error} />
            {loading && <LoadingSkeleton />}

            {afterResult && !loading && (
              <div className={`bg-[var(--surface)] border-2 border-[var(--border)] rounded-xl overflow-hidden shadow-none animate-[fadeIn_0.3s_ease-out] ${afterResult.verdict === 'GENUINE' ? 'bg-[color-mix(in_srgb,var(--green)_5%,transparent)]' : ''}`}>
                <div className="px-8 py-5 border-b-2 border-[var(--border)] flex items-center justify-between bg-[var(--surface)]">
                  <h2 className="font-mono text-[13px] font-bold text-[var(--text)] uppercase tracking-wider">
                    RESULTS
                  </h2>
                </div>
                <div
                  className={`px-8 py-8 text-center border-b-2 border-[var(--border)] ${afterResult.verdict === 'GENUINE'
                      ? 'bg-[color-mix(in_srgb,var(--teal)_10%,transparent)]'
                      : 'bg-[color-mix(in_srgb,var(--red)_10%,transparent)]'
                    }`}
                >
                  <div className="flex items-center justify-center gap-3 mb-1">
                    {afterResult.verdict === 'GENUINE' ? (
                      <span style={{ color: 'var(--teal)' }}><CheckIcon /></span>
                    ) : (
                      <span style={{ color: 'var(--red)' }}><XIcon /></span>
                    )}
                    <span className="text-[32px] font-display font-bold tracking-tight uppercase" style={{ color: afterResult.verdict === 'GENUINE' ? 'var(--teal)' : 'var(--red)' }}>
                      {afterResult.verdict.split('').map((char, i) => (
                        <span key={i} className="inline-block animate-[fadeIn_400ms_ease-out_forwards]" style={{ animationDelay: `${(i * 400) / afterResult.verdict.length}ms`, opacity: 0 }}>
                          {char}
                        </span>
                      ))}
                    </span>
                  </div>
                </div>

                <div className="p-8 space-y-8">
                  <div>
                    <h3 className="font-mono text-[12px] font-bold uppercase tracking-widest text-[var(--text)] mb-3">
                      Reason
                    </h3>
                    <p className="text-[16px] text-[var(--text-secondary)] leading-relaxed">
                      {afterResult.reason}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-mono text-[12px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: 'var(--teal)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                      Suggestion
                    </h3>
                    <p className="text-[14px] text-[var(--text)] bg-[var(--canvas)]/20 border border-[rgba(255,255,255,0.05)] shadow-inner rounded-lg p-5 leading-relaxed font-mono">
                      {afterResult.suggestion}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {afterResult && !loading && (
              <div className="flex justify-start mt-4 animate-[fadeIn_0.3s_ease-out]">
                <button
                  onClick={handleCheckAnother}
                  className="font-mono text-[12px] font-bold uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text)] bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-elevated)] rounded-md px-6 py-3 transition-colors btn-scale focus:outline-none"
                >
                  ← CHECK ANOTHER
                </button>
              </div>
            )}
          </div>
        )}
        </div>

        {/* Right Sidebar: Recent Checks */}
        <aside className="w-full md:w-[320px] flex-shrink-0">
          <div className="sticky top-[100px]">
            <h2 className="font-mono text-[13px] font-bold uppercase tracking-wider text-[var(--text)] mb-6">
              RECENT CHECKS
            </h2>
            {recentChecks.length > 0 ? (
              <div className="space-y-4">
                {recentChecks.map((check, i) => (
                  <div key={i} className="bg-[var(--surface)] border-2 border-[var(--border)] rounded-xl p-5 shadow-none flex flex-col gap-2">
                    <span className="font-mono text-[11px] text-[var(--text-secondary)] truncate" title={check.url}>
                      {check.url.split('/').slice(-3).join('/')}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${check.verdict === 'GENUINE' ? 'bg-[var(--teal)]' : 'bg-[var(--red)]'}`} />
                      <span className="font-mono text-[12px] font-bold uppercase tracking-wider text-[var(--text)]">
                        {check.verdict}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[var(--surface)] border border-dashed border-[var(--border)] rounded-xl p-8 text-center">
                <p className="font-mono text-[12px] text-[var(--text-secondary)]">No recent checks</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
