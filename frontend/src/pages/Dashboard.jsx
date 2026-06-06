import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

import Navbar from '../components/Navbar.jsx'
import supabase from '../lib/supabase.js'
import confetti from 'canvas-confetti'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

// ── Status badge config ───────────────────────────────────────────────────────

const STATUS_CONFIG = {
  saved:      { label: 'Saved',      bg: 'bg-[#8b949e]/15', text: 'text-[#8b949e]', border: 'border-[#8b949e]/30', chartColor: '#8b949e' },
  attempting: { label: 'Attempting', bg: 'bg-[#58a6ff]/15', text: 'text-[#58a6ff]', border: 'border-[#58a6ff]/30', chartColor: '#58a6ff' },
  done:       { label: 'Done',       bg: 'bg-[#3fb950]/15', text: 'text-[#3fb950]', border: 'border-[#3fb950]/30', chartColor: '#3fb950' },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.saved
  return (
    <span
      className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}
      style={{ fontFamily: "'Space Mono', monospace" }}
    >
      {cfg.label}
    </span>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, suffix }) {
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 flex flex-col items-center justify-center text-center hover:border-[#238636]/40 transition-all duration-200">
      <span
        className="text-3xl sm:text-4xl font-bold text-[#f0f6fc] tracking-tight"
        style={{ fontFamily: "'Space Mono', monospace" }}
      >
        {value}
        {suffix && <span className="text-lg text-[#8b949e] ml-1">{suffix}</span>}
      </span>
      <span
        className="text-xs text-[#8b949e] mt-2 tracking-wider uppercase"
        style={{ fontFamily: "'Space Mono', monospace" }}
      >
        {label}
      </span>
    </div>
  )
}

// ── Custom tooltip for chart ──────────────────────────────────────────────────

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1c2128] border border-[#30363d] rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-[#f0f6fc]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <span className="font-semibold">{payload[0].payload.name}:</span> {payload[0].value}
      </p>
    </div>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────────

const Spinner = () => (
  <div className="flex items-center justify-center py-20">
    <div className="w-8 h-8 rounded-full border-2 border-[#30363d] border-t-[#238636] animate-spin" />
  </div>
)

// ── Main component ────────────────────────────────────────────────────────────

export default function Dashboard({ user, signIn, signOut }) {
  const [dashData, setDashData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)

  // ── Fetch dashboard data ────────────────────────────────────────────────

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    async function loadDashboard() {
      try {
        setLoading(true)
        setError(null)

        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) {
          throw new Error('No active session. Please sign in again.')
        }

        const res = await fetch(`${BACKEND_URL}/api/user/dashboard`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || `Server returned ${res.status}`)
        }

        setDashData(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [user])

  // ── Update issue status ─────────────────────────────────────────────────

  const handleStatusChange = async (issueId, newStatus) => {
    try {
      setUpdatingId(issueId)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No active session')
      }

      const res = await fetch(`${BACKEND_URL}/api/user/issues/${issueId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })

      const updated = await res.json()

      if (!res.ok) {
        throw new Error(updated.error || 'Failed to update status')
      }

      // ── First PR Celebration! ──
      if (dashData?.totalDone === 0 && newStatus === 'done') {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#238636', '#58a6ff', '#f0f6fc', '#f85149'],
        })
      }

      // Update local state
      setDashData((prev) => {
        if (!prev) return prev
        const updatedIssues = prev.issues.map((issue) =>
          issue.id === issueId ? { ...issue, status: newStatus } : issue,
        )
        const totalDone = updatedIssues.filter((i) => i.status === 'done').length
        const totalSaved = updatedIssues.length
        return {
          ...prev,
          issues: updatedIssues,
          totalDone,
          totalSaved,
          mergeRate: totalSaved > 0
            ? Math.round((totalDone / totalSaved) * 1000) / 10
            : 0,
        }
      })
    } catch (err) {
      console.error('[Dashboard] Status update failed:', err.message)
      setError(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  // ── Seed Demo Data ──────────────────────────────────────────────────────

  const handleSeedDemo = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const res = await fetch(`${BACKEND_URL}/api/user/seed-demo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!res.ok) throw new Error('Failed to seed demo data')
      
      // Reload the page to fetch the new dashboard data
      window.location.reload()
    } catch (err) {
      console.error('[Dashboard] Seed failed:', err.message)
      setError(err.message)
      setLoading(false)
    }
  }

  // ── Chart data ──────────────────────────────────────────────────────────

  const chartData = dashData
    ? [
        {
          name: 'Saved',
          count: dashData.issues.filter((i) => i.status === 'saved').length,
          color: STATUS_CONFIG.saved.chartColor,
        },
        {
          name: 'Attempting',
          count: dashData.issues.filter((i) => i.status === 'attempting').length,
          color: STATUS_CONFIG.attempting.chartColor,
        },
        {
          name: 'Done',
          count: dashData.issues.filter((i) => i.status === 'done').length,
          color: STATUS_CONFIG.done.chartColor,
        },
      ]
    : []

  // ── Not logged in ───────────────────────────────────────────────────────

  if (!user) {
    return (
      <div className="bg-[#0a0a0a] min-h-screen text-[#f0f6fc]">
        <Navbar user={user} signIn={signIn} signOut={signOut} />
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-10 text-center max-w-md">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#8b949e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <h2
              className="text-lg font-bold text-[#f0f6fc] mb-2"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              Sign in to view your Dashboard
            </h2>
            <p
              className="text-sm text-[#8b949e] mb-6"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Track your open source contributions, merge rate, and streak.
            </p>
            <button
              id="dashboard-login-btn"
              onClick={signIn}
              className="inline-flex items-center gap-2 bg-[#238636] hover:bg-[#2ea043] text-white font-semibold rounded-lg px-6 py-3 text-sm transition-all duration-200"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
              Login with GitHub
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-[#f0f6fc]">
      <Navbar user={user} signIn={signIn} signOut={signOut} />

      <div className="max-w-[1000px] mx-auto px-6 py-10">

        {/* ── Heading ── */}
        <h1
          className="text-2xl sm:text-3xl font-bold text-[#f0f6fc] mb-8"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          Dashboard
        </h1>

        {loading && <Spinner />}

        {error && (
          <div className="bg-[#f85149]/10 border border-[#f85149]/40 rounded-lg p-4 mb-6">
            <p className="text-sm text-[#f85149]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              {error}
            </p>
          </div>
        )}

        {dashData && !loading && (
          <>
            {/* ── Stats row ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <StatCard label="Merge Rate" value={dashData.mergeRate} suffix="%" />
              <StatCard label="Total Done" value={dashData.totalDone} />
              <StatCard label="Current Streak" value={dashData.currentStreak} suffix="d" />
            </div>

            {/* ── Chart ── */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 mb-8">
              <h2
                className="text-sm font-bold text-[#f0f6fc] tracking-wide mb-5"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                Contributions by Status
              </h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#8b949e', fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}
                    axisLine={{ stroke: '#30363d' }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: '#8b949e', fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}
                    axisLine={{ stroke: '#30363d' }}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#21262d' }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={60}>
                    {chartData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* ── Issues list ── */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-[#30363d]">
                <h2
                  className="text-sm font-bold text-[#f0f6fc] tracking-wide"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  Saved Issues
                  <span className="ml-2 text-[#8b949e] font-normal">({dashData.issues.length})</span>
                </h2>
              </div>

              {dashData.issues.length === 0 ? (
                <div className="p-10 text-center flex flex-col items-center justify-center">
                  <p className="text-sm text-[#8b949e] mb-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    No saved issues yet. Head to Explore to find your first issue!
                  </p>
                  <button
                    onClick={handleSeedDemo}
                    className="px-4 py-2 bg-[#1f6feb]/10 text-[#58a6ff] hover:bg-[#1f6feb]/20 border border-[#1f6feb]/30 rounded-lg text-sm font-semibold transition-all"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    Seed Demo Data
                  </button>
                </div>
              ) : (
                <ul className="divide-y divide-[#21262d]">
                  {dashData.issues.map((issue) => (
                    <li
                      key={issue.id}
                      className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-[#1c2128] transition-colors duration-150"
                    >
                      {/* Left: issue info */}
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm text-[#f0f6fc] font-medium truncate"
                          style={{ fontFamily: "'DM Sans', sans-serif" }}
                        >
                          {issue.issue_title || 'Untitled Issue'}
                        </p>
                        <p
                          className="text-xs text-[#8b949e] mt-1"
                          style={{ fontFamily: "'Space Mono', monospace" }}
                        >
                          {issue.repo_name || 'unknown/repo'}
                          {issue.issue_number ? ` #${issue.issue_number}` : ''}
                        </p>
                      </div>

                      {/* Middle: status badge */}
                      <StatusBadge status={issue.status} />

                      {/* Right: status dropdown */}
                      <select
                        id={`status-select-${issue.id}`}
                        value={issue.status}
                        onChange={(e) => handleStatusChange(issue.id, e.target.value)}
                        disabled={updatingId === issue.id}
                        className="bg-[#0d1117] border border-[#30363d] rounded-md px-2 py-1.5 text-xs text-[#f0f6fc] focus:outline-none focus:border-[#238636] disabled:opacity-50 cursor-pointer transition-all duration-200"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        <option value="saved">Saved</option>
                        <option value="attempting">Attempting</option>
                        <option value="done">Done</option>
                      </select>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
