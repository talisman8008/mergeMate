import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import supabase from '../lib/supabase.js'
import ScrollStack, { ScrollStackItem } from '../components/ScrollStack.jsx'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'

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
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)

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
    const fetchRoadmap = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token

        const issueUrl = `https://github.com/${owner}/${repo}/issues/${number}`
        const res = await fetch(`${BACKEND_URL}/api/prcheck/before`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ issueUrl })
        })
        const json = await res.json()
        if (json.error) throw new Error(json.error)
        setRoadmap(json)
      } catch (err) {
        setRoadmapError(err.message)
      } finally {
        setRoadmapLoading(false)
      }
    }

    fetchRoadmap()
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
                    <div className="relative">
                      <div className={`text-[16px] text-[var(--text-muted)] leading-relaxed bg-[var(--bg-primary)]/20 border border-[rgba(255,255,255,0.05)] shadow-inner p-6 md:p-8 rounded-2xl overflow-hidden transition-all duration-300 ${isDescriptionExpanded ? '' : 'max-h-[300px]'}`}>
                        {details.issue.body ? (
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeSanitize]}
                            components={{
                              h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-[var(--text-primary)] mt-6 mb-4" {...props} />,
                              h2: ({node, ...props}) => <h2 className="text-xl font-bold text-[var(--text-primary)] mt-5 mb-3" {...props} />,
                              h3: ({node, ...props}) => <h3 className="text-lg font-bold text-[var(--text-primary)] mt-4 mb-2" {...props} />,
                              h4: ({node, ...props}) => <h4 className="text-base font-bold text-[var(--text-primary)] mt-4 mb-2" {...props} />,
                              p: ({node, ...props}) => <p className="mb-4 last:mb-0" {...props} />,
                              ul: ({node, ...props}) => <ul className="list-disc list-outside ml-6 mb-4 space-y-1 marker:text-[var(--text-muted)]" {...props} />,
                              ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-6 mb-4 space-y-1 marker:text-[var(--text-muted)]" {...props} />,
                              li: ({node, ...props}) => <li className="" {...props} />,
                              a: ({node, ...props}) => <a className="text-[var(--accent-blue)] hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                              code: ({node, inline, className, children, ...props}) => {
                                const match = /language-(\w+)/.exec(className || '')
                                return !inline ? (
                                  <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg overflow-hidden mb-4">
                                    <div className="bg-[var(--bg-primary)] px-4 py-2 text-xs font-mono text-[var(--text-muted)] border-b border-[var(--border)]">
                                      {match ? match[1] : 'code'}
                                    </div>
                                    <pre className="p-4 overflow-x-auto text-sm text-[var(--text-primary)] font-mono leading-relaxed" {...props}>
                                      <code className={className}>{children}</code>
                                    </pre>
                                  </div>
                                ) : (
                                  <code className="bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] px-1.5 py-0.5 rounded text-[14px] font-mono" {...props}>
                                    {children}
                                  </code>
                                )
                              },
                              blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-[var(--border)] pl-4 italic text-[var(--text-muted)] mb-4 bg-[rgba(255,255,255,0.02)] py-2 pr-4 rounded-r-lg" {...props} />,
                              table: ({node, ...props}) => <div className="overflow-x-auto mb-4"><table className="w-full text-left border-collapse border border-[var(--border)]" {...props} /></div>,
                              th: ({node, ...props}) => <th className="border border-[var(--border)] px-4 py-2 bg-[rgba(255,255,255,0.05)] font-semibold text-[var(--text-primary)]" {...props} />,
                              td: ({node, ...props}) => <td className="border border-[var(--border)] px-4 py-2" {...props} />,
                              img: ({node, ...props}) => <img className="max-w-full h-auto rounded-lg mb-4 border border-[rgba(255,255,255,0.1)]" {...props} alt={props.alt || 'Issue image'} />
                            }}
                          >
                            {details.issue.body}
                          </ReactMarkdown>
                        ) : (
                          'No description provided.'
                        )}
                      </div>
                      
                      {!isDescriptionExpanded && details.issue.body && details.issue.body.length > 400 && (
                        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--bg-primary)] to-transparent flex items-end justify-center pb-4 rounded-b-2xl pointer-events-none">
                          <button 
                            onClick={() => setIsDescriptionExpanded(true)}
                            className="pointer-events-auto font-sans text-[13px] font-semibold text-[var(--accent-blue)] bg-[var(--bg-card)] px-5 py-2 rounded-full border border-[var(--border)] shadow-md hover:border-[var(--accent-blue)] transition-colors focus:outline-none flex items-center gap-2"
                          >
                            Read More
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                          </button>
                        </div>
                      )}
                      
                      {isDescriptionExpanded && details.issue.body && details.issue.body.length > 400 && (
                        <div className="flex justify-center mt-6">
                          <button 
                            onClick={() => setIsDescriptionExpanded(false)}
                            className="font-sans text-[13px] font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors focus:outline-none flex items-center gap-2"
                          >
                            Show Less
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
                          </button>
                        </div>
                      )}
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
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                      
                      {/* What To Build (Span 8) */}
                      <div className="md:col-span-8 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-8 shadow-sm hover:border-[var(--border-hover)] transition-colors">
                        <h3 className="font-mono text-[12px] font-bold text-[var(--accent-blue)] uppercase tracking-wider mb-5 flex items-center gap-2">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                          Objective
                        </h3>
                        <p className="text-[15px] text-[var(--text-primary)] opacity-90 leading-[1.8] tracking-wide">{roadmap.whatToBuild}</p>
                      </div>

                      {/* Time & Difficulty (Span 4) */}
                      <div className="md:col-span-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm flex flex-col justify-center">
                        <h3 className="font-mono text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-5">Estimates</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between gap-3 bg-[var(--bg-primary)] px-4 py-3 rounded-xl border border-[rgba(255,255,255,0.03)] shadow-inner">
                            <span className="font-mono text-[11px] text-[var(--text-muted)] flex items-center gap-1.5 uppercase tracking-wider whitespace-nowrap"><ClockIcon /> Time</span>
                            <span className="font-mono text-[13px] font-semibold text-[var(--text-primary)] text-right break-words">{roadmap.estimatedTime || 'N/A'}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3 bg-[var(--bg-primary)] px-4 py-3 rounded-xl border border-[rgba(255,255,255,0.03)] shadow-inner">
                            <span className="font-mono text-[11px] text-[var(--text-muted)] flex items-center gap-1.5 uppercase tracking-wider whitespace-nowrap">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                              Complexity
                            </span>
                            <span className="font-mono text-[13px] font-semibold text-[var(--text-primary)] text-right break-words">{roadmap.difficulty || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Files to Touch (Span 6) */}
                      <div className="md:col-span-6 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-8 shadow-sm">
                        <h3 className="font-mono text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-5">Files to Modify</h3>
                        <div className="flex flex-wrap gap-2">
                          {(Array.isArray(roadmap.filesToTouch) ? roadmap.filesToTouch : (roadmap.filesToTouch || '').split(/[,\n\s]+/).filter(f => f.trim().length > 0)).map((file, i) => (
                            <span key={i} className="px-3 py-1.5 bg-[var(--bg-primary)] border border-[rgba(255,255,255,0.05)] rounded-lg text-[12px] font-mono text-[var(--text-muted)] break-all hover:text-[var(--text-primary)] hover:border-[rgba(255,255,255,0.1)] transition-colors">
                              {file}
                            </span>
                          ))}
                          {(!roadmap.filesToTouch || roadmap.filesToTouch.length === 0) && (
                            <span className="text-[13px] text-[var(--text-muted)] italic">No files specified</span>
                          )}
                        </div>
                      </div>

                      {/* What to Avoid (Span 6) */}
                      <div className="md:col-span-6 bg-[color-mix(in_srgb,var(--accent-red)_2%,transparent)] border border-[color-mix(in_srgb,var(--accent-red)_15%,transparent)] rounded-2xl p-8 shadow-sm">
                        <h3 className="font-mono text-[12px] font-bold text-[var(--accent-red)] uppercase tracking-wider mb-5 flex items-center gap-2">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                          Constraints & Risks
                        </h3>
                        <p className="text-[14px] text-[var(--text-primary)] opacity-85 leading-[1.8]">{roadmap.whatToAvoid}</p>
                      </div>

                    </div>

                    {/* Step-by-Step Roadmap */}
                    {roadmap.roadmap && roadmap.roadmap.length > 0 && (
                      <div className="mt-12 mb-8">
                        <h3 className="font-sans text-[12px] tracking-[0.1em] text-[var(--accent-blue)] uppercase font-semibold mb-8">EXECUTION STEPS</h3>
                        
                        <div className="h-[600px] rounded-xl overflow-hidden bg-[var(--bg-card)] border border-[var(--border)] shadow-sm relative">
                          <ScrollStack 
                            useWindowScroll={false} 
                            itemDistance={24} 
                            itemStackDistance={50} 
                            stackPosition="10%" 
                            scaleEndPosition="5%"
                            blurAmount={0}
                            baseScale={0.9}
                            itemScale={0.02}
                          >
                            {roadmap.roadmap.map((step, idx) => (
                              <ScrollStackItem key={idx}>
                                <div className="bg-[var(--bg-primary)] border border-[rgba(255,255,255,0.05)] rounded-xl p-5 md:p-6 h-full flex flex-col justify-center shadow-lg hover:border-[var(--accent-blue)] transition-colors duration-300">
                                  <span className="font-mono inline-block text-[var(--accent-blue)] text-[12px] font-bold uppercase tracking-widest mb-3">
                                    {step.step}
                                  </span>
                                  <h4 className="text-[22px] font-semibold text-[var(--text-primary)] mb-4 leading-tight">{step.title}</h4>
                                  <p className="text-[15px] text-[var(--text-muted)] leading-relaxed">{step.description}</p>
                                </div>
                              </ScrollStackItem>
                            ))}
                          </ScrollStack>
                        </div>
                      </div>
                    )}

                  </div>
                ) : null}
              </div>


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

              {/* Sidebar Action Buttons */}
              {details && details.issue?.html_url && (
                <div className="flex flex-col gap-4">
                  <button
                    onClick={handleSaveIssue}
                    disabled={savingStatus !== 'idle'}
                    className={`w-full inline-flex font-sans items-center justify-center gap-2 px-6 h-[44px] rounded-md text-[14px] font-medium transition-all duration-300 disabled:opacity-50 btn-scale focus:outline-none ${
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
                    className="w-full inline-flex font-sans items-center justify-center gap-3 px-6 h-[44px] rounded-[6px] text-[14px] font-semibold bg-[var(--accent-green)] text-black btn-scale focus:outline-none hover:opacity-90"
                  >
                    View on GitHub
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </a>
                </div>
              )}
            </aside>

          </div>
        </div>
      </div>
    </div>
  )
}
