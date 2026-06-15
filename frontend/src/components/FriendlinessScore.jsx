import { useState, useEffect } from 'react'

function getScoreColor(score) {
  if (score >= 70) return 'var(--accent-green)'
  if (score >= 40) return 'var(--accent-amber)'
  return 'var(--accent-red)'
}

export default function FriendlinessScore({ score, breakdown, small = false }) {
  const [showTooltip, setShowTooltip] = useState(false)

  const size = small ? 50 : 76
  const strokeWidth = small ? 4 : 6
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.max(0, Math.min(100, score ?? 0))
  const [animatedProgress, setAnimatedProgress] = useState(0)

  useEffect(() => {
    let start = null
    const duration = 600
    const endValue = progress

    function animate(timestamp) {
      if (!start) start = timestamp
      const elapsed = timestamp - start
      const percentage = Math.min(elapsed / duration, 1)
      setAnimatedProgress(Math.floor(percentage * endValue))
      
      if (percentage < 1) {
        window.requestAnimationFrame(animate)
      }
    }
    
    if (endValue > 0) {
      window.requestAnimationFrame(animate)
    } else {
      setAnimatedProgress(0)
    }
  }, [progress])

  const offset = circumference - (progress / 100) * circumference
  const color = getScoreColor(progress)

  const hasBreakdown = breakdown && (breakdown.response_time_hrs != null || breakdown.beginner_merge_rate != null)

  function getResponseLabel(hrs) {
    if (hrs == null) return null
    return hrs <= 24 ? 'fast' : 'slow'
  }

  return (
    <div
      className="relative inline-flex flex-col items-center gap-1 cursor-default"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} aria-label={`Friendliness score: ${progress}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease' }}
        />
      </svg>

      <span
        className="absolute font-semibold"
        style={{
          top: small ? 16 : 24,
          fontSize: small ? 13 : 20,
          color: 'var(--text-primary)',
          lineHeight: 1,
        }}
      >
        {animatedProgress}
      </span>

      {!small && (
        <span className="text-[13px] text-[var(--text-muted)] mt-1">
          Friendliness
        </span>
      )}

      {showTooltip && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-2 shadow-sm min-w-[220px] text-left pointer-events-none">
          <p className="text-[11px] font-semibold text-[var(--text-muted)] mb-2">Breakdown</p>

          {hasBreakdown ? (
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center gap-4">
                <span className="text-[12px] text-[var(--text-muted)]">Maintainer Response</span>
                <span className="text-[12px] font-medium text-[var(--text-primary)]">
                  {breakdown.response_time_hrs != null
                    ? `${getResponseLabel(breakdown.response_time_hrs)} (${breakdown.response_time_hrs}h)`
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <span className="text-[12px] text-[var(--text-muted)]">Beginner PR Acceptance</span>
                <span className="text-[12px] font-medium text-[var(--text-primary)]">
                  {breakdown.beginner_merge_rate != null ? `${Math.round(breakdown.beginner_merge_rate * 100)}%` : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <span className="text-[12px] text-[var(--text-muted)]">Issue Freshness</span>
                <span className="text-[12px] font-medium text-[var(--text-primary)]">
                  {breakdown.issue_age_days != null
                    ? (breakdown.issue_age_days <= 30 ? 'active' : 'stale')
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <span className="text-[12px] text-[var(--text-muted)]">Competition</span>
                <span className="text-[12px] font-medium text-[var(--text-primary)]">
                  {breakdown.open_pr_count != null ? `${breakdown.open_pr_count} open PRs` : '—'}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
              Score based on maintainer responsiveness, beginner PR history, issue freshness, and competition.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
