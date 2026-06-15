import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import supabase from '../lib/supabase.js'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

// ── Icons ─────────────────────────────────────────────────────────────────────

const SpinnerIcon = () => (
  <div className="w-5 h-5 rounded-full border-2 border-[var(--border)] border-t-[var(--text-primary)] animate-spin" />
)

const CheckCircleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent-green)]">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

const RepoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
)

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

const ChevronLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

// ── Main Component ─────────────────────────────────────────────────────────────

export default function IssueDetail({ user, signIn, signOut }) {
  const { owner, repo, number } = useParams()
  const navigate = useNavigate()
  
  const [details, setDetails] = useState(null)
  const [detailsError, setDetailsError] = useState(null)
  
  const [roadmap, setRoadmap] = useState(null)
  const [roadmapLoading, setRoadmapLoading] = useState(true)
  const [roadmapError, setRoadmapError] = useState(null)

  const [savingStatus, setSavingStatus] = useState('idle')

  const handleSaveIssue = async () => {
    if (!details) return
    try {
      setSavingStatus('saving')
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setSavingStatus('error')
        setTimeout(() => setSavingStatus('idle'), 2000)
        return
      }

      const res = await fetch(`${BACKEND_URL}/api/user/issues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          issue_title: details.issue.title,
          repo_name: details.repo.name,
          issue_url: details.issue.html_url
        })
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

  useEffect(() => {
    // 1. Fetch Issue & Repo Metadata
    fetch(`${BACKEND_URL}/api/issue-details/${owner}/${repo}/${number}`)
      .then(res => res.json())
      .then(json => {
        if (json.error) throw new Error(json.error)
        setDetails(json.data)
      })
      .catch(err => setDetailsError(err.message))

    // 2. Fetch AI Roadmap
    const issueUrl = `https://github.com/${owner}/${repo}/issues/${number}`
    fetch(`${BACKEND_URL}/api/prcheck/before`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ issueUrl })
    })
      .then(res => res.json())
      .then(json => {
        if (json.error) throw new Error(json.error)
        setRoadmap(json)
      })
      .catch(err => setRoadmapError(err.message))
      .finally(() => setRoadmapLoading(false))
  }, [owner, repo, number])

  return (
    <div className="bg-[var(--bg-primary)] min-h-screen text-[var(--text-primary)] font-sans relative">
      {/* Subtle background highlight for depth (not overpowering) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[500px] bg-[var(--accent-blue)] opacity-[0.03] blur-[100px] pointer-events-none" />

      <div className="relative z-10">
        <Navbar user={user} signIn={signIn} signOut={signOut} />

        <div className="w-full mx-auto px-4 md:px-8 lg:px-12 xl:px-16 py-8 md:py-12">
          
          {/* Back Navigation */}
          <button 
            onClick={() => navigate(-1)}
            className="font-sans text-[13px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-8 focus:outline-none max-w-fit"
          >
            ← Back to Explore
          </button>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
            
            {/* Left Column: Content & Roadmap */}
            <main className="flex-1 min-w-0 w-full space-y-10">
              
              {/* Issue Preview Area */}
              <div>
                {!details && !detailsError ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-8 w-3/4 bg-[var(--bg-card)] rounded-lg"></div>
                    <div className="h-4 w-full bg-[var(--bg-card)] rounded-md mt-6"></div>
                    <div className="h-4 w-5/6 bg-[var(--bg-card)] rounded-md"></div>
                  </div>
                ) : detailsError ? (
                  <div className="text-[var(--accent-red)] text-[14px] bg-[color-mix(in_srgb,var(--accent-red)_10%,transparent)] p-4 rounded-xl border border-[color-mix(in_srgb,var(--accent-red)_20%,transparent)]">
                    Failed to load issue details: {detailsError}
                  </div>
                ) : (
                  <>
                    <h1 className="font-sans text-[28px] font-semibold text-[var(--text-primary)] leading-[1.4] mb-6">
                      {details.issue.title} <span className="font-mono text-[16px] font-normal text-[var(--text-muted)] ml-2">#{number}</span>
                    </h1>
                    <div className="text-[16px] text-[var(--text-muted)] leading-relaxed bg-[var(--bg-primary)]/20 border border-[rgba(255,255,255,0.05)] shadow-inner p-6 md:p-8 rounded-2xl max-h-[350px] overflow-y-auto" style={{ whiteSpace: 'pre-wrap' }}>
                      {details.issue.body || 'No description provided.'}
                    </div>
                  </>
                )}
              </div>

              {/* AI Roadmap Area */}
              <div>
                <div className="flex items-center mb-8">
                  <h2 className="font-sans text-[12px] tracking-[0.1em] text-[var(--accent-purple)] uppercase font-semibold">IMPLEMENTATION PLAN</h2>
                </div>

                {roadmapLoading ? (
                  <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-12 flex flex-col items-center justify-center min-h-[250px] gap-5 shadow-sm">
                    <SpinnerIcon />
                    <p className="text-[15px] text-[var(--text-muted)] font-medium">Analyzing repository architecture...</p>
                  </div>
                ) : roadmapError ? (
                  <div className="bg-[color-mix(in_srgb,var(--accent-red)_10%,transparent)] border border-[color-mix(in_srgb,var(--accent-red)_30%,transparent)] rounded-xl p-6 shadow-sm">
                    <p className="text-[15px] font-medium text-[var(--accent-red)]">{roadmapError}</p>
                  </div>
                ) : roadmap ? (
                  <div className="space-y-6">
                    
                    {/* Bento Box Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      
                      {/* What To Build (Span 8) */}
                      <div className="md:col-span-8 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 shadow-sm hover:border-[var(--border-hover)] transition-colors">
                        <h3 className="font-mono text-[12px] font-bold text-[var(--accent-blue)] uppercase tracking-wider mb-4 flex items-center gap-2">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                          Objective
                        </h3>
                        <p className="text-[17px] text-[var(--text-primary)] leading-relaxed">{roadmap.whatToBuild}</p>
                      </div>

                      {/* Time & Difficulty (Span 4) */}
                      <div className="md:col-span-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 shadow-sm flex flex-col justify-center">
                        <h3 className="font-mono text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-4">Estimates</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between bg-[var(--bg-primary)]/20 px-4 py-3 rounded-lg border border-[rgba(255,255,255,0.05)] shadow-inner">
                            <span className="font-mono text-[13px] text-[var(--text-muted)] flex items-center gap-2 uppercase tracking-wider"><ClockIcon /> Time</span>
                            <span className="font-mono text-[14px] font-semibold text-[var(--text-primary)]">{roadmap.estimatedTime || 'N/A'}</span>
                          </div>
                          <div className="flex items-center justify-between bg-[var(--bg-primary)]/20 px-4 py-3 rounded-lg border border-[rgba(255,255,255,0.05)] shadow-inner">
                            <span className="font-mono text-[13px] text-[var(--text-muted)] flex items-center gap-2 uppercase tracking-wider">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                              Complexity
                            </span>
                            <span className="font-mono text-[14px] font-semibold text-[var(--text-primary)]">{roadmap.difficulty || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Files to Touch (Span 6) */}
                      <div className="md:col-span-6 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 shadow-sm">
                        <h3 className="font-mono text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-4">Files to Modify</h3>
                        <div className="bg-[var(--bg-primary)]/20 border border-[rgba(255,255,255,0.05)] shadow-inner rounded-xl p-4 font-mono text-[14px] text-[var(--text-primary)] leading-relaxed break-all whitespace-pre-wrap">
                          {roadmap.filesToTouch}
                        </div>
                      </div>

                      {/* What to Avoid (Span 6) */}
                      <div className="md:col-span-6 bg-[color-mix(in_srgb,var(--accent-red)_2%,transparent)] border border-[color-mix(in_srgb,var(--accent-red)_15%,transparent)] rounded-xl p-6 shadow-sm">
                        <h3 className="font-mono text-[12px] font-bold text-[var(--accent-red)] uppercase tracking-wider mb-4 flex items-center gap-2">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                          Constraints & Risks
                        </h3>
                        <p className="text-[16px] text-[var(--text-primary)] leading-relaxed">{roadmap.whatToAvoid}</p>
                      </div>

                    </div>

                    {/* Step-by-Step Roadmap */}
                    {roadmap.roadmap && roadmap.roadmap.length > 0 && (
                      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 md:p-10 mt-6 shadow-sm">
                        <h3 className="font-sans text-[12px] tracking-[0.1em] text-[var(--accent-blue)] uppercase font-semibold mb-8">EXECUTION STEPS</h3>
                        <div className="space-y-12 relative border-l border-[rgba(255,255,255,0.1)] ml-2">
                          {roadmap.roadmap.map((step, idx) => (
                            <div key={idx} className="relative flex items-start gap-8 pl-10 group">
                              {/* Sharp minimalist line node */}
                              <div className="absolute -left-[1px] top-3 w-[16px] h-[2px] bg-[var(--accent-blue)] group-hover:w-[24px] transition-all duration-300"></div>
                              
                              <div className="flex-1 min-w-0">
                                <span className="font-mono inline-block text-[var(--accent-blue)] text-[12px] font-bold uppercase tracking-widest mb-2">
                                  {step.step}
                                </span>
                                <h4 className="text-[20px] font-semibold text-[var(--text-primary)] mb-3">{step.title}</h4>
                                <p className="text-[16px] text-[var(--text-muted)] leading-relaxed">{step.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                ) : null}
              </div>

              {/* Bottom CTA */}
              {details && details.issue?.html_url && (
                <div className="pt-8 flex flex-col sm:flex-row gap-4 border-t border-[rgba(255,255,255,0.05)]">
                  <button
                    onClick={handleSaveIssue}
                    disabled={savingStatus !== 'idle'}
                    className={`flex-1 inline-flex font-sans items-center justify-center gap-2 px-6 h-[44px] rounded-md text-[14px] font-medium transition-all duration-300 disabled:opacity-50 btn-scale focus:outline-none ${
                      savingStatus === 'saved' || savingStatus === 'already_saved'
                        ? 'bg-[color-mix(in_srgb,var(--accent-green)_15%,transparent)] text-[var(--accent-green)] border border-[color-mix(in_srgb,var(--accent-green)_30%,transparent)] cursor-not-allowed'
                        : savingStatus === 'error'
                          ? 'bg-[color-mix(in_srgb,var(--accent-red)_15%,transparent)] text-[var(--accent-red)] border border-[color-mix(in_srgb,var(--accent-red)_30%,transparent)]'
                          : 'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--bg-card-hover)] hover:border-[var(--border-hover)]'
                    }`}
                  >
                    {savingStatus === 'saving' && <><SpinnerIcon /> Saving...</>}
                    {savingStatus === 'saved' && <><CheckCircleIcon /> Saved</>}
                    {savingStatus === 'already_saved' && <><CheckCircleIcon /> Saved</>}
                    {savingStatus === 'error' && 'Failed'}
                    {savingStatus === 'idle' && 'Save to Dashboard'}
                  </button>

                  <a 
                    href={details.issue.html_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex font-sans items-center justify-center gap-3 px-6 h-[44px] rounded-[6px] text-[14px] font-semibold bg-[var(--accent-green)] text-black btn-scale focus:outline-none hover:opacity-90"
                  >
                    View on GitHub
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </a>
                </div>
              )}

            </main>

            {/* Right Column: Sidebar Metadata */}
            <aside className="w-full lg:w-[320px] flex-shrink-0 space-y-6 lg:sticky lg:top-[100px]">
              {/* Repo Details Card */}
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 shadow-sm">
                <h3 className="font-mono text-[13px] font-bold text-[var(--text-primary)] uppercase tracking-wider mb-6 flex items-center gap-3 border-b border-[rgba(255,255,255,0.05)] pb-4">
                  <RepoIcon /> REPOSITORY
                </h3>
                
                {!details && !detailsError ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 w-full bg-[rgba(255,255,255,0.05)] rounded-md"></div>
                    <div className="h-4 w-3/4 bg-[rgba(255,255,255,0.05)] rounded-md"></div>
                  </div>
                ) : details ? (
                  <div className="space-y-6">
                    <div>
                      <p className="font-mono text-[11px] text-[var(--text-muted)] font-bold uppercase tracking-widest mb-1.5">Name</p>
                      <p className="font-mono text-[14px] text-[var(--text-primary)] font-medium break-all">{details.repo.name}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[11px] text-[var(--text-muted)] font-bold uppercase tracking-widest mb-1.5">Default Branch</p>
                      <p className="font-mono text-[14px] text-[var(--text-primary)] font-medium flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[var(--text-muted)]"></span> {details.repo.default_branch}
                      </p>
                    </div>
                    <div>
                      <p className="font-mono text-[11px] text-[var(--text-muted)] font-bold uppercase tracking-widest mb-1.5">Created</p>
                      <p className="font-mono text-[14px] text-[var(--text-primary)] font-medium flex items-center gap-2">
                        <CalendarIcon />
                        {details.repo.created_at ? new Date(details.repo.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Unknown'}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Issue Context Card */}
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 shadow-sm">
                <h3 className="font-mono text-[13px] font-bold text-[var(--text-primary)] uppercase tracking-wider mb-6 border-b border-[rgba(255,255,255,0.05)] pb-4">
                  CONTEXT
                </h3>
                
                {!details && !detailsError ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-8 w-full bg-[rgba(255,255,255,0.05)] rounded-md"></div>
                  </div>
                ) : details ? (
                  <div className="space-y-6">
                    <div>
                      <p className="font-mono text-[11px] text-[var(--text-muted)] font-bold uppercase tracking-widest mb-2.5">Author</p>
                      <div className="flex items-center gap-3">
                        {details.issue.author_avatar ? (
                          <img src={details.issue.author_avatar} alt="Author avatar" className="w-7 h-7 rounded-sm ring-1 ring-[rgba(255,255,255,0.1)]" />
                        ) : (
                          <div className="w-7 h-7 rounded-sm bg-[rgba(255,255,255,0.05)] ring-1 ring-[rgba(255,255,255,0.1)]"></div>
                        )}
                        <p className="font-mono text-[14px] text-[var(--text-primary)] font-medium">{details.issue.author}</p>
                      </div>
                    </div>
                    <div>
                      <p className="font-mono text-[11px] text-[var(--text-muted)] font-bold uppercase tracking-widest mb-1.5">Opened</p>
                      <p className="font-mono text-[14px] text-[var(--text-primary)] font-medium flex items-center gap-2">
                        <CalendarIcon />
                        {new Date(details.issue.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </aside>

          </div>
        </div>
      </div>
    </div>
  )
}
