function getBadgeConfig(count) {
  if (count === 0) return { label: 'No competition', color: 'var(--accent-green)', icon: '✓' }
  if (count <= 2) return { label: `${count} competing`, color: 'var(--accent-amber)', icon: '⚡' }
  return { label: `${count} competing`, color: 'var(--accent-red)', icon: '✕' }
}

export default function LivenessCheck({ openPRCount }) {
  const count = openPRCount ?? 0
  const { label, color, icon } = getBadgeConfig(count)

  const tooltip = count === 0
    ? 'No open PRs competing for this issue'
    : `${count} open PR${count !== 1 ? 's' : ''} targeting this issue — move fast!`

  return (
    <span
      className="inline-flex items-center gap-1.5 text-[12px] font-medium px-2 py-0.5 rounded border"
      style={{
        color,
        borderColor: `color-mix(in srgb, ${color} 20%, transparent)`,
        backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`
      }}
      title={tooltip}
    >
      <span className="text-[10px]" aria-hidden="true">{icon}</span>
      {label}
    </span>
  )
}
