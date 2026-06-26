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
  <div className="w-4 h-4 rounded-full border-2 border-[var(--border)] border-t-[var(--text-primary)] animate-spin" />
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
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 space-y-4 animate-pulse shadow-sm">
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
    Easy: 'bg-[color-mix(in_srgb,var(--accent-green)_15%,transparent)] text-[var(--accent-green)] border-[color-mix(in_srgb,var(--accent-green)_30%,transparent)]',
    Medium: 'bg-[color-mix(in_srgb,var(--accent-amber)_15%,transparent)] text-[var(--accent-amber)] border-[color-mix(in_srgb,var(--accent-amber)_30%,transparent)]',
    Hard: 'bg-[color-mix(in_srgb,var(--accent-red)_15%,transparent)] text-[var(--accent-red)] border-[color-mix(in_srgb,var(--accent-red)_30%,transparent)]',
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
      className={`px-5 py-2.5 font-sans text-[13px] font-medium transition-all duration-300 btn-scale focus:outline-none ${active
          ? 'bg-[var(--border)] text-[var(--text-primary)] shadow-sm'
          : 'bg-transparent text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'
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
    <div className="bg-[color-mix(in_srgb,var(--accent-red)_5%,transparent)] border border-[color-mix(in_srgb,var(--accent-red)_20%,transparent)] rounded-lg p-4 animate-[fadeIn_0.3s_ease-out] shadow-[inset_0_0_20px_color-mix(in_srgb,var(--accent-red)_5%,transparent)]">
      <p className="font-mono text-[12px] font-bold uppercase tracking-wider" style={{ color: 'var(--accent-red)' }}>
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
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const res = await fetch(`${BACKEND_URL}/api/prcheck/before`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const res = await fetch(`${BACKEND_URL}/api/prcheck/after`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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
    <div className="bg-[var(--bg-primary)] min-h-screen text-[var(--text-primary)]">
      <Navbar user={user} signIn={signIn} signOut={signOut} />

      <div className="w-full max-w-[1200px] mx-auto px-6 py-20 flex flex-col items-center justify-center text-center mt-10">
        <h1 className="text-[40px] md:text-[56px] font-sans font-semibold tracking-tight text-[var(--text-primary)] mb-6">
          PR Check is now an Extension
        </h1>
        <div className="max-w-[600px] bg-[var(--bg-card)] border-2 border-[var(--border)] rounded-xl p-10 shadow-lg mx-auto">
          <p className="font-sans text-[18px] text-[var(--text-muted)] leading-relaxed mb-8">
            The PR Check functionality has been upgraded and moved into our dedicated Chrome Extension for a more seamless experience directly on GitHub.
          </p>
          <div className="p-4 bg-[color-mix(in_srgb,var(--accent-blue)_10%,transparent)] border border-[color-mix(in_srgb,var(--accent-blue)_20%,transparent)] rounded-lg">
            <p className="font-sans text-[16px] text-[var(--text-primary)] font-medium">
              <strong className="text-[var(--accent-blue)]">Mentors & Judges:</strong> Please refer to the video demonstration to see the extension in action!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
