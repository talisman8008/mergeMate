import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ScoreRing from './ScoreRing.jsx'
import supabase from '../lib/supabase.js'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

export default function IssueRow({ issue }) {
  const navigate = useNavigate()
  const {
    title,
    repo_name,
    url,
    friendliness_score,
    open_pr_count,
    number,
    language,
    stars
  } = issue ?? {}

  const [savingStatus, setSavingStatus] = useState('idle')

  const handleRowClick = () => {
    if (repo_name && number) {
      const [owner, repo] = repo_name.split('/')
      navigate(`/issue/${owner}/${repo}/${number}`)
    }
  }

  const handleSaveIssue = async (e) => {
    e.stopPropagation()
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
          issue_title: title,
          repo_name,
          issue_url: url
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

  // logic for liveness text
  let liveElement = null
  if (open_pr_count > 0) {
    if (open_pr_count <= 2) {
      liveElement = <span className="font-mono text-[10px] text-[#D4956A] uppercase tracking-widest">{open_pr_count} PR{open_pr_count === 1 ? '' : 's'} open</span>
    } else {
      liveElement = <span className="font-mono text-[10px] text-[#E07070] uppercase tracking-widest">{open_pr_count} PRs : crowded</span>
    }
  }

  return (
    <div 
      onClick={handleRowClick}
      className="issue-tile group relative flex items-center justify-between py-6 px-4 md:px-6 mb-4 rounded-lg border border-[var(--border)] hover:bg-[rgba(255,255,255,0.02)] transition-colors cursor-pointer overflow-hidden
        before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[4px] before:bg-transparent hover:before:bg-[#52B788] before:transition-colors"
    >
      {/* Left Column */}
      <div className="flex-1 min-w-0 pr-6">
        <div className="font-mono text-[11px] uppercase tracking-widest text-[#5C554D] mb-1.5 flex items-center gap-2 truncate">
          <span>{repo_name}</span>
          {language && (
            <>
              <span className="opacity-40">•</span>
              <span>{language}</span>
            </>
          )}
          {stars !== undefined && (
            <>
              <span className="opacity-40">•</span>
              <span className="flex items-center gap-0.5">
                {stars.toLocaleString()} <span className="text-[10px] pb-px">★</span>
              </span>
            </>
          )}
        </div>
        <h3 className="font-display text-[16px] font-medium text-[var(--text)] leading-snug truncate md:whitespace-normal line-clamp-1 md:line-clamp-none">
          {title}
        </h3>
      </div>

      {/* Right Column */}
      <div className="flex items-center gap-4 md:gap-6 w-auto md:w-[280px] flex-shrink-0 justify-end pr-4 md:pr-6">
        
        {/* Liveness Indicator */}
        <div className="hidden sm:block w-[140px] text-right">
          {liveElement}
        </div>

        {/* Score Ring */}
        <ScoreRing score={friendliness_score ?? 0} />

        {/* Save Button */}
        <div className="w-[60px] flex justify-end">
          {(savingStatus === 'saved' || savingStatus === 'already_saved') ? (
            <span className="font-mono text-[10px] tracking-widest uppercase text-[#52B788] font-bold py-1.5">
              Saved
            </span>
          ) : (
            <button 
              onClick={handleSaveIssue}
              disabled={savingStatus !== 'idle'}
              className={`opacity-0 group-hover:opacity-100 transition-opacity
                font-mono text-[10px] tracking-widest uppercase
                border border-[var(--border)] text-[var(--text-secondary)]
                px-3 py-1.5 rounded-sm
                hover:border-[#52B788] hover:text-[#52B788]
                ${savingStatus === 'saving' ? 'opacity-100 cursor-wait' : ''}
                ${savingStatus === 'error' ? 'opacity-100 text-[#E07070] border-[#E07070]' : ''}`}
            >
              {savingStatus === 'saving' ? '...' : savingStatus === 'error' ? 'Err' : 'Save'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
