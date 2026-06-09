export default function ScoreRing({ score = 0 }) {
  const color = score >= 70 ? '#52B788' : score >= 40 ? '#D4956A' : '#E07070'
  const circumference = 2 * Math.PI * 16  // r=16 for 40px ring
  const offset = circumference * (1 - score / 100)

  return (
    <div className="relative w-[40px] h-[40px] flex items-center justify-center flex-shrink-0">
      <svg width="40" height="40" viewBox="0 0 40 40" style={{ transform: 'rotate(-90deg)' }} className="absolute inset-0">
        <circle cx="20" cy="20" r="16" fill="none" 
          stroke="var(--border)" strokeWidth="3"/>
        <circle cx="20" cy="20" r="16" fill="none"
          stroke={color} strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}/>
      </svg>
      <span style={{ color, fontFamily: 'Space Mono', fontSize: '11px', fontWeight: 700 }} className="relative z-10">
        {score}
      </span>
    </div>
  )
}
