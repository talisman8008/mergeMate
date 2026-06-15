import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ScoreRing from './ScoreRing.jsx'
import supabase from '../lib/supabase.js'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

export default function IssueCard({ issue }) {
  const navigate = useNavigate()
  const {
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

  return (
    <div 
      onClick={handleRowClick}
      className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 hover:border-[var(--border-hover)] hover:bg-[var(--bg-card-hover)] transition-all duration-150 cursor-pointer flex flex-col min-h-[180px]"
    >
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
      <div className="flex justify-between items-end mt-2 pt-2">
        <div className="flex items-center gap-3 flex-wrap">
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
            {interestingLabels.length > 0 && <span className="text-[var(--text-faint)]">·</span>}
            {stars !== undefined && (
              <span className="flex items-center gap-1 font-mono text-[12px]">
                <span className="text-[12px]">★</span> {stars.toLocaleString()}
              </span>
            )}
            {stars !== undefined && <span className="text-[var(--text-faint)]">·</span>}
            <span>opened {timeText}</span>
          </div>
        </div>
        
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
          <span className="font-sans text-[12px] text-[var(--text-muted)] hover:text-[var(--accent-green)] transition-colors">
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
