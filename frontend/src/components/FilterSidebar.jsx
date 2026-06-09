const LANGUAGES = ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 'Rust', 'Ruby']
const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced']

export default function FilterSidebar({ filters, onFilterChange }) {
  const {
    languages = [],
    skillLevel = '',
    minScore = 0,
  } = filters ?? {}

  const toggleLanguage = (lang) => {
    const updated = languages.includes(lang)
      ? languages.filter((l) => l !== lang)
      : [...languages, lang]
    onFilterChange({ ...filters, languages: updated })
  }

  const handleSkillLevel = (level) => {
    onFilterChange({ ...filters, skillLevel: level })
  }

  const handleScore = (e) => {
    onFilterChange({ ...filters, minScore: Number(e.target.value) })
  }

  const handleApply = () => {
    // Handled by debounce in Explore.jsx now
  }

  const handleReset = () => {
    onFilterChange({ languages: [], skillLevel: '', minScore: 0 })
  }

  return (
    <aside className="bg-transparent md:bg-[var(--surface)] md:border border-[var(--border)] md:rounded-xl p-0 md:p-5 flex flex-col gap-6 w-full">

      <h2 className="font-mono text-[13px] font-bold uppercase tracking-wider text-[var(--text)]">
        FILTERS
      </h2>

      {/* Language filter */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">
          Language
        </p>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map(lang => (
            <button
              key={lang}
              onClick={() => toggleLanguage(lang)}
              className={`
                font-mono text-[10px] tracking-widest uppercase px-3 py-1.5 rounded-sm
                border transition-all duration-150
                ${languages.includes(lang) 
                  ? 'bg-[var(--green)] border-[var(--green)] text-[#D1FAE5]' 
                  : 'bg-transparent border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-hover)] hover:text-[var(--text)]'}
              `}>
              {lang}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-[var(--border)]" />

      {/* Skill level */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">
          Skill Level
        </p>
        <div className="flex flex-col gap-1.5">
          {SKILL_LEVELS.map((level) => (
            <label
              key={level}
              className="flex items-center gap-2 cursor-pointer group"
              htmlFor={`skill-${level}`}
            >
              <input
                id={`skill-${level}`}
                type="radio"
                name="skillLevel"
                value={level}
                checked={skillLevel === level}
                onChange={() => handleSkillLevel(level)}
                className="w-3.5 h-3.5 rounded-full border border-[var(--border)] bg-[var(--canvas)] appearance-none cursor-pointer flex items-center justify-center
                  checked:border-[var(--text)] relative
                  after:content-[''] after:hidden checked:after:block after:w-1.5 after:h-1.5 after:bg-[var(--text)] after:rounded-full"
              />
              <span className="text-[14px] text-[var(--text)] transition-colors duration-150">
                {level}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="h-px bg-[var(--border)]" />

      {/* Min friendliness score */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">
            Min Score
          </span>
          <span className="font-mono text-[11px] font-bold text-[var(--text)]">
            {minScore}
          </span>
        </div>
        <input
          id="filter-min-score"
          type="range"
          min={0}
          max={100}
          step={5}
          value={minScore}
          onChange={handleScore}
          className="w-full h-1 bg-[var(--border)] rounded-full appearance-none cursor-pointer"
          style={{ accentColor: 'var(--text)' }}
        />
        <div className="flex justify-between text-[11px] text-[var(--text-muted)]">
          <span>0</span>
          <span>50</span>
          <span>100</span>
        </div>
      </div>

      <div className="h-px bg-[var(--border)] md:hidden" />

      {/* Actions */}
      <div className="flex flex-col gap-1.5">
        <button
          id="filter-reset-btn"
          onClick={handleReset}
          className="w-full text-[13px] text-[var(--text-secondary)] hover:text-[var(--text)] py-1.5 transition-colors duration-150 hover:bg-[var(--surface-elevated)] rounded-md focus:outline-none"
        >
          Reset
        </button>
      </div>

    </aside>
  )
}
