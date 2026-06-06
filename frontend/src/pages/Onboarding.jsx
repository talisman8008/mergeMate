import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth.js'
import supabase from '../lib/supabase.js'

// ── Constants ────────────────────────────────────────────────────────────────

const LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'Java',
  'C++', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift',
]

const EXPERIENCE_LEVELS = [
  {
    id: 'beginner',
    label: 'Beginner',
    description: "I'm just getting started, less than 1 year coding",
  },
  {
    id: 'intermediate',
    label: 'Intermediate',
    description: "I'm comfortable, 1–2 years coding",
  },
  {
    id: 'advanced',
    label: 'Advanced',
    description: "I'm confident, 2+ years coding",
  },
]

const INTERESTS = [
  'Frontend', 'Backend', 'DevOps', 'ML/AI',
  'Mobile', 'Documentation', 'Testing', 'Security',
]

const TOTAL_STEPS = 3

// ── Sub-components ────────────────────────────────────────────────────────────

function ProgressBar({ step }) {
  return (
    <div className="w-full flex flex-col gap-2 mb-10">
      <div className="flex justify-between items-center">
        <span
          className="text-xs text-[#8b949e]"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          Step {step} of {TOTAL_STEPS}
        </span>
        <span
          className="text-xs text-[#238636]"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          {Math.round((step / TOTAL_STEPS) * 100)}%
        </span>
      </div>
      <div className="h-1 w-full bg-[#30363d] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#238636] rounded-full transition-all duration-500"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>
    </div>
  )
}

function MultiSelectPill({ label, selected, onToggle }) {
  return (
    <button
      id={`pill-${label.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`}
      type="button"
      onClick={() => onToggle(label)}
      className={`
        px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200
        ${selected
          ? 'bg-[#238636]/20 border-[#238636] text-[#238636]'
          : 'bg-[#161b22] border-[#30363d] text-[#8b949e] hover:border-[#8b949e] hover:text-[#f0f6fc]'
        }
      `}
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {selected && (
        <span className="mr-1.5 text-[#238636]">✓</span>
      )}
      {label}
    </button>
  )
}

// ── Steps ─────────────────────────────────────────────────────────────────────

function StepLanguages({ selected, onToggle }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2
          className="text-2xl font-bold text-[#f0f6fc]"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          What languages do you know?
        </h2>
        <p
          className="mt-2 text-sm text-[#8b949e]"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Select all that apply — we'll find repos that match.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        {LANGUAGES.map((lang) => (
          <MultiSelectPill
            key={lang}
            label={lang}
            selected={selected.includes(lang)}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  )
}

function StepExperience({ selected, onSelect }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2
          className="text-2xl font-bold text-[#f0f6fc]"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          How would you describe your experience?
        </h2>
        <p
          className="mt-2 text-sm text-[#8b949e]"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Pick the one that feels right. You can always explore beyond it.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {EXPERIENCE_LEVELS.map((level) => {
          const isSelected = selected === level.id
          return (
            <button
              id={`exp-${level.id}`}
              key={level.id}
              type="button"
              onClick={() => onSelect(level.id)}
              className={`
                w-full text-left p-4 rounded-lg border transition-all duration-200
                ${isSelected
                  ? 'border-[#238636] bg-[#238636]/10'
                  : 'border-[#30363d] bg-[#161b22] hover:border-[#8b949e]'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm font-semibold ${isSelected ? 'text-[#238636]' : 'text-[#f0f6fc]'}`}
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  {level.label}
                </span>
                {isSelected && (
                  <span className="w-4 h-4 rounded-full bg-[#238636] flex items-center justify-center flex-shrink-0">
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="2 6 5 9 10 3" />
                    </svg>
                  </span>
                )}
              </div>
              <p
                className="mt-1 text-xs text-[#8b949e]"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {level.description}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function StepInterests({ selected, onToggle }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2
          className="text-2xl font-bold text-[#f0f6fc]"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          What areas interest you?
        </h2>
        <p
          className="mt-2 text-sm text-[#8b949e]"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          We'll surface issues from these domains first.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        {INTERESTS.map((area) => (
          <MultiSelectPill
            key={area}
            label={area}
            selected={selected.includes(area)}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function Onboarding() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [languages, setLanguages] = useState([])
  const [skillLevel, setSkillLevel] = useState('')
  const [interests, setInterests] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // ── Toggle helpers ──

  const toggleLanguage = (lang) =>
    setLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    )

  const toggleInterest = (area) =>
    setInterests((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    )

  // ── Validation ──

  const canAdvance = () => {
    if (step === 1) return languages.length > 0
    if (step === 2) return skillLevel !== ''
    if (step === 3) return interests.length > 0
    return false
  }

  // ── Submit ──

  const handleSubmit = async () => {
    if (!user) return
    setSaving(true)
    setError(null)

    const { error: upsertError } = await supabase
      .from('users')
      .upsert(
        {
          id: user.id,
          github_id: user.user_metadata?.provider_id ?? null,
          username: user.user_metadata?.user_name ?? null,
          avatar_url: user.user_metadata?.avatar_url ?? null,
          languages,
          skill_level: skillLevel,
          interests,
        },
        { onConflict: 'id' }
      )

    setSaving(false)

    if (upsertError) {
      setError('Something went wrong saving your profile. Please try again.')
      return
    }

    navigate('/explore')
  }

  // ── Navigation ──

  const handleNext = () => {
    if (step < TOTAL_STEPS) setStep((s) => s + 1)
    else handleSubmit()
  }

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-[#f0f6fc] flex flex-col">
      {/* Nav */}
      <nav className="border-b border-[#30363d]">
        <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center">
          <span
            className="text-sm font-bold tracking-widest text-[#238636]"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            FIRSTMERGE
          </span>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-[600px] flex flex-col">
          <ProgressBar step={step} />

          {/* Step content */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-8">
            {step === 1 && (
              <StepLanguages selected={languages} onToggle={toggleLanguage} />
            )}
            {step === 2 && (
              <StepExperience selected={skillLevel} onSelect={setSkillLevel} />
            )}
            {step === 3 && (
              <StepInterests selected={interests} onToggle={toggleInterest} />
            )}

            {/* Error */}
            {error && (
              <p
                className="mt-4 text-xs text-[#f85149]"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {error}
              </p>
            )}

            {/* Navigation buttons */}
            <div className="mt-8 flex items-center justify-between">
              <button
                id="onboarding-back-btn"
                type="button"
                onClick={handleBack}
                disabled={step === 1}
                className="text-sm text-[#8b949e] hover:text-[#f0f6fc] border border-[#30363d] rounded-md px-4 py-2 transition-all duration-200 hover:bg-[#0d1117] disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                ← Back
              </button>

              <button
                id="onboarding-next-btn"
                type="button"
                onClick={handleNext}
                disabled={!canAdvance() || saving}
                className="inline-flex items-center gap-2 bg-[#238636] hover:bg-[#2ea043] text-white text-sm font-semibold rounded-md px-5 py-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {saving ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Saving…
                  </>
                ) : step === TOTAL_STEPS ? (
                  "Let's Go →"
                ) : (
                  'Next →'
                )}
              </button>
            </div>
          </div>

          {/* Step dots */}
          <div className="mt-6 flex items-center justify-center gap-2">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i + 1 === step
                    ? 'bg-[#238636] w-4'
                    : i + 1 < step
                    ? 'bg-[#238636]/40'
                    : 'bg-[#30363d]'
                }`}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
