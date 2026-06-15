export default function ScoreRing({ score = 0 }) {
  const color = score >= 70 ? 'var(--accent-green)' : score >= 40 ? 'var(--accent-amber)' : 'var(--accent-red)'
  const circumference = 2 * Math.PI * 18  // r=18 for 44px ring
  const offset = circumference * (1 - score / 100)

  return (
    <div className="relative w-[44px] h-[44px] flex items-center justify-center flex-shrink-0">
      <svg width="44" height="44" viewBox="0 0 44 44" style={{ transform: 'rotate(-90deg)' }} className="absolute inset-0">
        <circle cx="22" cy="22" r="18" fill="none" 
          stroke="var(--border)" strokeWidth="3"/>
        <circle cx="22" cy="22" r="18" fill="none"
          stroke={color} strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}/>
      </svg>
      <span style={{ color, fontFamily: 'Space Mono', fontSize: '14px', fontWeight: 700 }} className="relative z-10">
        {score}
      </span>
    </div>
  )
}
