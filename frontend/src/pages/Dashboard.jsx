import { useState, useEffect, useRef, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import html2canvas from 'html2canvas'

import Navbar from '../components/Navbar.jsx'
import supabase from '../lib/supabase.js'
import confetti from 'canvas-confetti'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

// ── Custom tooltip for chart ──────────────────────────────────────────────────
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[var(--canvas)] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 shadow-sm">
      <p className="text-xs text-[var(--text)]">
        <span className="font-semibold">{payload[0].payload.name}:</span> {payload[0].value}
      </p>
    </div>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────────
const Spinner = () => (
  <div className="flex items-center justify-center py-20">
    <div className="w-6 h-6 rounded-full border-2 border-[var(--border)] border-t-[var(--text)] animate-spin" />
  </div>
)

// ── Main component ────────────────────────────────────────────────────────────
export default function Dashboard({ user, signIn, signOut }) {
  const [dashData, setDashData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)
  const [animatedMergeRateOffset, setAnimatedMergeRateOffset] = useState(220)

  const [showShareModal, setShowShareModal] = useState(false)
  const [justMergedIssue, setJustMergedIssue] = useState(null)
  const cardRef = useRef(null)

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

  useEffect(() => {
    if (dashData) {
      setTimeout(() => {
        setAnimatedMergeRateOffset(220 - ((dashData.mergeRate || 0) / 100) * 220)
      }, 50)
    }
  }, [dashData])

  const handleStatusChange = async (issueId, newStatus) => {
    try {
      setUpdatingId(issueId)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('No active session')

      const res = await fetch(`${BACKEND_URL}/api/user/issues/${issueId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })

      const updated = await res.json()

      if (!res.ok) throw new Error(updated.error || 'Failed to update status')

      // First PR Celebration
      if (dashData?.totalDone === 0 && newStatus === 'done') {
        const markedIssue = dashData.issues.find(i => i.id === issueId)
        setJustMergedIssue(markedIssue)
        setShowShareModal(true)
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#0F7B6C', '#2383E2', '#D9730D', '#E03E3E'], 
        })
      }

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
          mergeRate: totalSaved > 0 ? Math.round((totalDone / totalSaved) * 1000) / 10 : 0,
        }
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

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
      window.location.reload()
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleClearDemo = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return
      const res = await fetch(`${BACKEND_URL}/api/user/clear-demo`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!res.ok) throw new Error('Failed to clear demo data')
      window.location.reload()
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleDownloadCard = async () => {
    if (cardRef.current) {
      try {
        const canvas = await html2canvas(cardRef.current, { backgroundColor: '#ffffff', scale: 2 })
        const link = document.createElement('a')
        link.download = 'firstmerge-pr-celebration.png'
        link.href = canvas.toDataURL('image/png')
        link.click()
      } catch (err) {
        console.error('Download failed', err)
      }
    }
  }

  const heatmapData = useMemo(() => {
    if (!dashData?.issues) return { grid: [], monthLabels: [] }
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const counts = {};
    dashData.issues.forEach(issue => {
      if (issue.status === 'done' && issue.created_at) {
        const d = new Date(issue.created_at);
        d.setHours(0, 0, 0, 0);
        counts[d.toISOString()] = (counts[d.toISOString()] || 0) + 1;
      }
    });

    const grid = Array.from({ length: 7 }, () => new Array(26).fill(0));
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (26 * 7) + 1);

    const monthLabels = [];
    let currentMonth = -1;

    for (let w = 0; w < 26; w++) {
      for (let d = 0; d < 7; d++) {
        const cellDate = new Date(startDate);
        cellDate.setDate(startDate.getDate() + (w * 7) + d);
        if (cellDate > today) break;

        const m = cellDate.getMonth();
        if (d === 0 && m !== currentMonth) {
          monthLabels.push({ weekIndex: w, label: cellDate.toLocaleString('default', { month: 'short' }) });
          currentMonth = m;
        }

        cellDate.setHours(0, 0, 0, 0);
        grid[d][w] = counts[cellDate.toISOString()] || 0;
      }
    }

    return { grid, monthLabels };
  }, [dashData])

  const chartData = dashData
    ? [
      { name: 'Saved', count: dashData.issues.filter((i) => i.status === 'saved').length, color: 'var(--text-secondary)' },
      { name: 'Attempting', count: dashData.issues.filter((i) => i.status === 'attempting').length, color: 'var(--accent-blue)' },
      { name: 'Done', count: dashData.issues.filter((i) => i.status === 'done').length, color: 'var(--green)' },
    ]
    : []

  const maxStreak = dashData?.currentStreak || 0
  const demoRepos = ['facebook/react', 'tailwindlabs/tailwindcss', 'vitejs/vite', 'supabase/supabase', 'vercel/next.js']
  const isDemoSeeded = dashData?.issues.some(i => demoRepos.includes(i.repo_name))

  if (!user) {
    return (
      <div className="bg-[var(--canvas)] min-h-screen text-[var(--text)]">
        <Navbar user={user} signIn={signIn} signOut={signOut} />
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
          <div className="bg-[var(--surface)] border border-[rgba(255,255,255,0.08)] rounded-2xl p-10 text-center max-w-md">
            <h2 className="text-lg font-semibold text-[var(--text)] mb-2">
              Sign in to view your Dashboard
            </h2>
            <button onClick={signIn} className="inline-flex items-center gap-2 text-white font-medium rounded-md px-5 py-2.5 text-sm transition-colors duration-150 mt-4" style={{ backgroundColor: 'var(--accent-blue)' }}>
              Continue with GitHub
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[var(--canvas)] min-h-screen text-[var(--text)] pb-20">
      <Navbar user={user} signIn={signIn} signOut={signOut} />

      <div className="w-full mx-auto px-4 md:px-8 lg:px-12 xl:px-16 py-12">

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-10">
          <div>
            <h1 className="text-[40px] font-display font-extrabold tracking-tight mb-2 text-[var(--text)]">
              Dashboard
            </h1>
            <p className="font-mono text-[var(--text-secondary)] text-[13px] uppercase tracking-wider">
              Track your contribution consistency and recent merges.
            </p>
          </div>
        </div>

        {loading && <Spinner />}

        {error && (
          <div className="bg-[color-mix(in_srgb,var(--red)_10%,transparent)] border border-[var(--red)] rounded-lg p-4 mb-6">
            <p className="text-sm" style={{ color: 'var(--red)' }}>{error}</p>
          </div>
        )}

        {dashData && !loading && (
          <div className="flex flex-col gap-3">

            {/* ── ROW 1 ── */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              
              {/* Large card (7fr): Merge Rate */}
              <div className="group md:col-span-7 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 relative overflow-hidden flex flex-col items-center justify-center min-h-[180px] cursor-default shadow-sm hover:border-[var(--border-hover)] transition-colors">
                {/* Background Track Arc */}
                <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 200 100" preserveAspectRatio="xMidYMid meet">
                  <path d="M 30 90 A 70 70 0 0 1 170 90" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                </svg>
                {/* Active Progress Arc */}
                <svg className="absolute inset-0 w-full h-full opacity-80 group-hover:opacity-30 transition-opacity duration-300" viewBox="0 0 200 100" preserveAspectRatio="xMidYMid meet">
                  <path d="M 30 90 A 70 70 0 0 1 170 90" fill="none" stroke="var(--teal)" strokeWidth="6" strokeLinecap="round" strokeDasharray="220" strokeDashoffset={animatedMergeRateOffset} style={{ transition: 'stroke-dashoffset 800ms ease-out' }} />
                </svg>
                
                {/* Text overlay (hidden until hover) */}
                <div className="relative z-10 text-center flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-8">
                  <div className="text-[56px] font-display font-extrabold text-[var(--text)] leading-none mb-2 tracking-tighter">
                    {dashData.mergeRate}%
                  </div>
                  <h2 className="font-mono text-[11px] text-[var(--teal)] font-bold uppercase tracking-widest">of your PRs get merged</h2>
                </div>
              </div>

              {/* Tall card (5fr): Current Streak */}
              <div className="md:col-span-5 bg-[color-mix(in_srgb,var(--teal)_5%,transparent)] border border-[color-mix(in_srgb,var(--teal)_20%,transparent)] rounded-xl p-6 shadow-sm relative overflow-hidden flex flex-col items-center justify-center min-h-[180px]">
                <div className="text-[56px] font-display font-extrabold text-[var(--text)] leading-none mb-2 tracking-tighter">
                  {dashData.currentStreak}
                </div>
                <p className="font-mono text-[11px] font-bold text-[var(--teal)] uppercase tracking-widest mb-4">day streak</p>
                <div className="flex items-center justify-center w-12 h-12 rounded-full border border-[color-mix(in_srgb,var(--teal)_30%,transparent)]" style={{ backgroundColor: 'color-mix(in srgb, var(--teal) 10%, transparent)', color: 'var(--teal)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
                </div>
              </div>

            </div>

            {/* ── ROW 2 ── */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              
              {/* Narrow card (5fr): Consistency Badges */}
              <div className="md:col-span-5 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 shadow-sm min-h-[200px] flex flex-col">
                <h2 className="font-mono text-[13px] font-bold uppercase tracking-wider text-[var(--text)] mb-6">MILESTONES</h2>
                <div className="flex-1 flex flex-col justify-between">
                  {[
                    { label: '7-day bronze', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CD7F32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="14" r="6"/><path d="M9.1 10.9 6 5h12l-3.1 5.9"/></svg>, req: 7 },
                    { label: '21-day silver', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="14" r="6"/><path d="M9.1 10.9 6 5h12l-3.1 5.9"/></svg>, req: 21 },
                    { label: '50-day gold', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="14" r="6"/><path d="M9.1 10.9 6 5h12l-3.1 5.9"/></svg>, req: 50 },
                    { label: '100-day diamond', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13"/><path d="M13 3l3 6-4 13"/></svg>, req: 100 },
                  ].map(badge => {
                    const unlocked = maxStreak >= badge.req;
                    return (
                      <div key={badge.req} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`flex items-center justify-center ${!unlocked ? 'grayscale opacity-30' : ''}`}>{badge.icon}</span>
                          <span className={`font-mono text-[12px] font-semibold uppercase tracking-wider ${unlocked ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>{badge.label}</span>
                        </div>
                        {unlocked ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--teal)]"><path d="M20 6 9 17l-5-5"/></svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[rgba(255,255,255,0.1)]"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Wide card (7fr): Heatmap */}
              <div className="md:col-span-7 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 shadow-sm min-h-[200px] flex flex-col">
                <h2 className="font-mono text-[13px] font-bold uppercase tracking-wider text-[var(--text)] mb-6">CONTRIBUTION ACTIVITY</h2>
                <div className="flex-1 flex items-start justify-start overflow-hidden pt-2">
                  <div className="flex flex-col gap-[4px] w-full">
                    <div className="flex gap-[4px] mb-1.5 h-[16px] w-full">
                      {Array.from({ length: 26 }).map((_, i) => {
                        const label = heatmapData.monthLabels.find(m => m.weekIndex === i);
                        return (
                          <div key={i} className="flex-1 text-[10px] text-[var(--text-muted)] relative font-mono uppercase tracking-wider">
                            {label ? <span className="absolute bottom-0 left-0 whitespace-nowrap">{label.label}</span> : ''}
                          </div>
                        )
                      })}
                    </div>
                    {heatmapData.grid.map((row, rIndex) => (
                      <div key={rIndex} className="flex gap-[4px] w-full">
                        {row.map((count, cIndex) => {
                          let style = { backgroundColor: 'rgba(255,255,255,0.05)' };
                          if (count === 1) style = { backgroundColor: 'color-mix(in srgb, var(--teal) 30%, transparent)' };
                          if (count >= 2) style = { backgroundColor: 'color-mix(in srgb, var(--teal) 70%, transparent)' };
                          return <div key={cIndex} className="flex-1 aspect-square rounded-[2px] transition-colors hover:scale-110" style={style} />
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* ── ROW 3 ── */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-mono text-[13px] font-bold uppercase tracking-wider text-[var(--text)]">SAVED ISSUES</h2>
                {!isDemoSeeded && (
                  <button onClick={handleSeedDemo} className="font-mono text-[11px] font-bold text-[var(--text-muted)] hover:text-[var(--text)] uppercase tracking-wider transition-colors bg-white/[0.05] border border-[rgba(255,255,255,0.05)] px-3 py-1.5 rounded-sm">
                    Seed Demo Data
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-3">
                {dashData.issues.length === 0 && (
                   <p className="font-mono text-[12px] text-[var(--text-muted)] py-4">No saved issues yet.</p>
                )}
                {dashData.issues.map(issue => (
                  <div key={issue.id} className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--canvas)] shadow-sm hover:border-[var(--border-hover)] transition-colors">
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-[15px] font-semibold text-[var(--text)] truncate">{issue.issue_title}</p>
                      <p className="font-mono text-[12px] text-[var(--text-secondary)] truncate mt-1">{issue.repo_name}</p>
                    </div>
                    
                    <div className="flex flex-shrink-0 items-center gap-1 bg-[var(--canvas)]/40 p-1 rounded-lg border border-[rgba(255,255,255,0.05)]">
                      {['saved', 'attempting', 'done'].map(status => {
                        const active = issue.status === status;
                        return (
                          <button 
                            key={status}
                            onClick={() => handleStatusChange(issue.id, status)}
                            disabled={updatingId === issue.id}
                            className={`px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${
                              active 
                                ? 'bg-white/[0.08] text-[var(--text)] shadow-sm' 
                                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                            }`}
                          >
                            {status}
                          </button>
                        )
                      })}
                    </div>
                    
                    <a href={issue.issue_url} target="_blank" rel="noopener noreferrer" className="ml-5 mr-2 text-[var(--text-muted)] hover:text-[var(--teal)] transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* ── ROW 4 ── */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 shadow-sm h-[200px] flex flex-col">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Bar dataKey="count" radius={[2, 2, 0, 0]} maxBarSize={40}>
                    {chartData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.name === 'Done' ? 'var(--teal)' : entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Clear Demo link in bottom right */}
            {isDemoSeeded && (
              <div className="flex justify-end mt-2">
                <button onClick={handleClearDemo} className="text-[12px] text-[var(--text-muted)] hover:text-[var(--red)] transition-colors underline decoration-dotted underline-offset-4">
                  Clear Demo Data
                </button>
              </div>
            )}

          </div>
        )}
      </div>

      {/* Share Modal ... */}
      {showShareModal && justMergedIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--canvas)]/80 p-4">
          <div className="bg-[var(--canvas)] border border-[var(--border)] rounded-xl p-6 shadow-lg max-w-sm w-full">
            <div
              ref={cardRef}
              className="p-8 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-center mb-6 flex flex-col items-center"
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'color-mix(in srgb, var(--green) 15%, transparent)', color: 'var(--green)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-[var(--text)] mb-1">
                FirstMerge
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                @{user?.user_metadata?.user_name || 'developer'}
              </p>
              <div className="bg-[var(--canvas)] border border-[var(--border)] rounded-md px-4 py-3 w-full mb-4 text-center">
                <p className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Merged</p>
                <p className="text-[var(--text)] font-medium text-sm truncate">
                  {justMergedIssue.repo_name}
                </p>
              </div>
              <p className="flex items-center gap-2 font-semibold text-[15px]" style={{ color: 'var(--green)' }}>
                Just got my PR merged!
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5.8 11.3 2 22l10.7-3.79"/><path d="M4 3h.01"/><path d="M22 8h.01"/><path d="M15 2h.01"/><path d="M22 20h.01"/><path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12v0c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10"/><path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11v0c-.11.7-.72 1.22-1.43 1.22H17"/><path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98v0C9.52 4.9 9 5.52 9 6.23V7"/><path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z"/></svg>
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleDownloadCard} className="flex-1 py-2 text-white rounded-md font-medium text-[13px] transition-colors" style={{ backgroundColor: 'var(--green)' }}>
                Save Image
              </button>
              <button onClick={() => setShowShareModal(false)} className="px-4 py-2 bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] rounded-md text-[13px] font-medium hover:bg-[var(--surface-elevated)] transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
