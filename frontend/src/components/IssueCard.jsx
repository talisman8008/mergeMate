import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ScoreRing from './ScoreRing.jsx'
import supabase from '../lib/supabase.js'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

export default function IssueCard({ issue, viewMode = 'grid' }) {
  const navigate = useNavigate()
  const {
    id,
    title,
    repo_name,
    url,
    friendliness_score,
    open_pr_count,
    number,
    language,
    stars,
    labels = [],
    created_at
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

  // Repo avatar logic
  const [owner] = repo_name ? repo_name.split('/') : ['?']
  const firstLetter = owner.charAt(0).toUpperCase()
  // random muted color based on repo name
  const getAvatarColor = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 40%, 25%)`;
  }
  const avatarColor = getAvatarColor(repo_name || '?')

  // Time ago logic
  const daysAgo = created_at ? Math.floor((Date.now() - new Date(created_at).getTime()) / (1000 * 3600 * 24)) : 0;
  const timeText = daysAgo === 0 ? 'today' : `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`;

  // Filter labels
  const interestingLabels = labels.filter(l => l.toLowerCase() !== 'good first issue').slice(0, 2);

  if (viewMode === 'list') {
    return (
      <div 
        onClick={handleRowClick}
        className={`bg-[var(--bg-card)] border ${id === 99999999 ? 'border-yellow-500' : 'border-[var(--border)]'} rounded-lg p-3 hover:border-[var(--border-hover)] hover:bg-[var(--bg-card-hover)] transition-all duration-150 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4`}
      >
        {/* Left: Avatar + Repo Info */}
        <div className="flex gap-3 items-center md:w-[220px] flex-shrink-0">
          <div 
            className="w-8 h-8 rounded-md flex items-center justify-center font-mono text-white text-[13px] font-semibold flex-shrink-0"
            style={{ backgroundColor: avatarColor }}
          >
            {firstLetter}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="font-mono text-[12px] font-normal text-[var(--text-muted)] truncate">
              {repo_name}
            </span>
            {language && (
              <span className="font-sans text-[11px] font-medium w-max px-[6px] py-[1px] rounded-[4px] mt-0.5 bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] text-[var(--text-primary)]">
                {language}
              </span>
            )}
          </div>
        </div>

        {/* Middle: Title + Labels + Time */}
        <div className="flex flex-col flex-1 min-w-0 pr-4">
          <h3 className="font-sans text-[14px] font-semibold text-[var(--text-primary)] truncate leading-[1.5] mb-1">
            {title}
          </h3>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-sans text-[11px] text-[var(--text-muted)]">
            {interestingLabels.length > 0 && (
              <div className="flex items-center gap-2 mr-2">
                {interestingLabels.map(lbl => (
                  <span key={lbl} className="bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] text-[var(--text-muted)] rounded-[4px] px-[6px] py-[1px] truncate max-w-[120px]">
                    {lbl}
                  </span>
                ))}
              </div>
            )}
            {stars !== undefined && (
              <span className="flex items-center gap-1 font-mono">
                <span className="text-[11px]">★</span> {stars.toLocaleString()}
              </span>
            )}
            {stars !== undefined && <span className="text-[var(--text-faint)]">·</span>}
            <span>opened {timeText}</span>
            {open_pr_count >= 2 && (
              <>
                <span className="text-[var(--text-faint)]">·</span>
                <span className="text-[var(--accent-amber)] font-medium">⚠ {open_pr_count} open PRs</span>
              </>
            )}
          </div>
        </div>

        {/* Right: Score + Actions */}
        <div className="flex items-center justify-between md:justify-end gap-6 flex-shrink-0 w-full md:w-auto mt-2 md:mt-0 pt-2 md:pt-0 border-t border-[var(--border)] md:border-0">
          <ScoreRing score={friendliness_score ?? 0} />
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleSaveIssue}
              disabled={savingStatus !== 'idle'}
              className={`font-sans text-[12px] transition-colors
                ${(savingStatus === 'saved' || savingStatus === 'already_saved') ? 'text-[var(--accent-green)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}
                ${savingStatus === 'saving' ? 'opacity-50 cursor-wait' : ''}
                ${savingStatus === 'error' ? 'text-[var(--accent-red)]' : ''}`}
            >
              {savingStatus === 'idle' ? 'Save' : 
               savingStatus === 'saving' ? '...' : 
               (savingStatus === 'saved' || savingStatus === 'already_saved') ? 'Saved' : 'Err'}
            </button>
            <span className="font-sans text-[12px] text-[var(--text-muted)] hover:text-[var(--accent-green)] transition-colors whitespace-nowrap">
              View →
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      onClick={handleRowClick}
      className={`bg-[var(--bg-card)] border ${id === 99999999 ? 'border-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.2)]' : 'border-[var(--border)]'} rounded-lg p-4 hover:border-[var(--border-hover)] hover:bg-[var(--bg-card-hover)] transition-all duration-150 cursor-pointer flex flex-col min-h-[180px] relative`}
    >
      {id === 99999999 && (
        <span className="absolute -top-2.5 right-4 bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Demo</span>
      )}
      {/* ROW 1 - top of card */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex gap-3 items-center">
          <div 
            className="w-8 h-8 rounded-md flex items-center justify-center font-mono text-white text-[13px] font-semibold flex-shrink-0"
            style={{ backgroundColor: avatarColor }}
          >
            {firstLetter}
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-[12px] font-normal text-[var(--text-muted)] line-clamp-1 break-all">
              {repo_name}
            </span>
            {language && (
              <span 
                className="font-sans text-[11px] font-medium w-max px-[8px] py-[2px] rounded-[4px] mt-1 bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] text-[var(--text-primary)]"
              >
                {language}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex-shrink-0 ml-2">
          <ScoreRing score={friendliness_score ?? 0} />
        </div>
      </div>

      {/* ROW 2 - middle */}
      <h3 className="font-sans text-[15px] font-semibold text-[var(--text-primary)] line-clamp-2 my-[10px] leading-[1.5] flex-grow">
        {title}
      </h3>

      {/* ROW 3 - bottom of card */}
      <div className="flex justify-between items-end mt-auto pt-4">
        {/* LEFT: Labels & Meta */}
        <div className="flex flex-col gap-2">
          {interestingLabels.length > 0 && (
            <div className="flex items-center gap-2">
              {interestingLabels.map(lbl => (
                <span key={lbl} className="bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] text-[var(--text-muted)] font-sans text-[11px] rounded-[4px] px-[8px] py-[2px] truncate max-w-[120px]">
                  {lbl}
                </span>
              ))}
            </div>
          )}
          
          <div className="flex items-center gap-2 font-sans text-[12px] text-[var(--text-muted)]">
            {stars !== undefined && (
              <span className="flex items-center gap-1 font-mono text-[12px]">
                <span className="text-[12px]">★</span> {stars.toLocaleString()}
              </span>
            )}
            {stars !== undefined && <span className="text-[var(--text-faint)]">·</span>}
            <span>opened {timeText}</span>
          </div>
        </div>
        
        {/* RIGHT: Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button 
            onClick={handleSaveIssue}
            disabled={savingStatus !== 'idle'}
            className={`font-sans text-[12px] transition-colors
              ${(savingStatus === 'saved' || savingStatus === 'already_saved') ? 'text-[var(--accent-green)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}
              ${savingStatus === 'saving' ? 'opacity-50 cursor-wait' : ''}
              ${savingStatus === 'error' ? 'text-[var(--accent-red)]' : ''}`}
          >
            {savingStatus === 'idle' ? 'Save' : 
             savingStatus === 'saving' ? '...' : 
             (savingStatus === 'saved' || savingStatus === 'already_saved') ? 'Saved' : 'Err'}
          </button>
          <span className="font-sans text-[12px] text-[var(--text-muted)] hover:text-[var(--accent-green)] transition-colors whitespace-nowrap">
            View →
          </span>
        </div>
      </div>

      {/* BOTTOM - WARNING BAR */}
      {open_pr_count >= 2 && (
        <div className="mt-4 -mx-4 -mb-4 bg-[rgba(245,158,11,0.1)] border-t border-[var(--accent-amber)] px-4 py-1.5">
          <span className="font-sans text-[11px] text-[var(--accent-amber)]">
            ⚠ {open_pr_count} PRs already open — move fast
          </span>
        </div>
      )}
    </div>
  )
}
