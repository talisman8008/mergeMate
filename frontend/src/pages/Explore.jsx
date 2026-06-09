import { useState, useEffect, useCallback, useRef } from 'react'

import Navbar from '../components/Navbar.jsx'
import FilterSidebar from '../components/FilterSidebar.jsx'
import IssueRow from '../components/IssueRow.jsx'
import useAuth from '../hooks/useAuth.js'
import useIssues from '../hooks/useIssues.js'

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function LoadingSkeleton() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between py-6 border-b border-[var(--border)] animate-pulse">
          <div className="flex-1 pr-6">
            <div className="h-2 w-20 bg-[var(--border)] rounded mb-3"></div>
            <div className="h-4 w-3/4 max-w-[400px] bg-[var(--border)] rounded"></div>
          </div>
          <div className="flex items-center gap-6 w-[280px] justify-end">
            <div className="h-2 w-20 bg-[var(--border)] rounded hidden sm:block"></div>
            <div className="w-[40px] h-[40px] rounded-full bg-[var(--border)]"></div>
            <div className="w-[60px] h-6 bg-[var(--border)] rounded"></div>
          </div>
        </div>
      ))}
    </>
  )
}

export default function Explore() {
  const { user, signIn, signOut } = useAuth()

  const [sidebarFilters, setSidebarFilters] = useState({
    languages: ['Python'],
    skillLevel: 'Beginner',
    minScore: 0,
    _applied: 0
  })


  const [fetchParams, setFetchParams] = useState({
    language: 'Python',
    page: 1,
    skillLevel: 'beginner',
    minScore: 0,
    _applied: 0
  })

  const { issues, loading, error, fetchMore, setFilters: setHookFilters } = useIssues(fetchParams)

  const debouncedSetFetchParams = useCallback(
    debounce((filters) => {
      setFetchParams({
        language: filters.languages.join(',') || 'Python',
        page: 1,
        skillLevel: filters.skillLevel.toLowerCase() || 'beginner',
        minScore: parseInt(filters.minScore, 10) || 0,
        _applied: Date.now()
      })
    }, 400),
    []
  )

  const prevSkillLevelRef = useRef(sidebarFilters.skillLevel)

  useEffect(() => {
    if (sidebarFilters.skillLevel !== prevSkillLevelRef.current) {
      prevSkillLevelRef.current = sidebarFilters.skillLevel
      setFetchParams({
        language: sidebarFilters.languages.join(',') || 'Python',
        page: 1,
        skillLevel: sidebarFilters.skillLevel.toLowerCase() || 'beginner',
        minScore: parseInt(sidebarFilters.minScore, 10) || 0,
        _applied: Date.now()
      })
    } else {
      debouncedSetFetchParams(sidebarFilters)
    }
  }, [sidebarFilters.languages, sidebarFilters.skillLevel, sidebarFilters.minScore, debouncedSetFetchParams])

  useEffect(() => {
    setHookFilters(fetchParams)
  }, [fetchParams, setHookFilters])

  const noLanguagesSelected = sidebarFilters.languages.length === 0

  const handleRetry = () => {
    setFetchParams(prev => ({
      ...prev,
      _applied: prev._applied + 1
    }))
  }

  return (
    <div className="bg-[var(--canvas)] min-h-screen text-[var(--text)]">
      <Navbar user={user} signIn={signIn} signOut={signOut} />

      <div className="w-full mx-auto px-4 md:px-8 lg:px-12 xl:px-16 py-8">
        <div className="flex gap-6 items-start flex-col md:flex-row">

          {/* Left: FilterSidebar */}
          <aside className="w-full md:w-[240px] flex-shrink-0 md:sticky md:top-[72px]">
            <FilterSidebar filters={sidebarFilters} onFilterChange={setSidebarFilters} />
          </aside>

          {/* Right: issue list */}
          <main className="flex-1 min-w-0 w-full pt-1 md:pt-0">
            {/* Bloomberg header row */}
            <div className="flex items-center justify-between py-3 border-b border-[var(--border)] mb-4">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">
                {noLanguagesSelected ? '0 issues' : `${issues.length} issues`}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">
                Sorted by friendliness
              </span>
            </div>

            {/* No languages selected */}
            {noLanguagesSelected && (
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-10 flex flex-col items-center justify-center text-center">
                <p className="text-[15px] font-medium text-[var(--text)]">
                  Select at least one language
                </p>
                <p className="text-[14px] text-[var(--text-secondary)] mt-1">
                  Use the filters on the left to find issues.
                </p>
              </div>
            )}

            {/* API error */}
            {!noLanguagesSelected && error && (
              <div className="bg-[var(--surface)] border border-[var(--red)] rounded-xl p-6 mb-4 flex flex-col items-center text-center">
                <p className="text-[14px] font-medium" style={{ color: 'var(--red)' }}>
                  Unable to load issues.
                </p>
                <p className="text-[13px] text-[var(--text-muted)] mb-4">
                  {error}
                </p>
                <button
                  onClick={handleRetry}
                  className="text-[13px] font-medium text-white rounded-md px-4 py-1.5 transition-colors duration-150 hover:opacity-90"
                  style={{ backgroundColor: 'var(--accent-blue)' }}
                >
                  Retry
                </button>
              </div>
            )}

            {/* Issue list */}
            {!noLanguagesSelected && !error && (
              <>
                <div className="flex flex-col border-t border-[var(--border)]">
                  {issues.map((issue) => (
                    <IssueRow key={`${issue.repo_name}-${issue.number}-${issue.id}`} issue={issue} />
                  ))}
                  {loading && <LoadingSkeleton />}
                </div>

                {!loading && issues.length > 0 && (
                  <div className="mt-8 flex justify-center">
                    <button
                      onClick={fetchMore}
                      className="text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--text)] bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-elevated)] rounded-md px-4 py-2 transition-colors duration-150"
                    >
                      Load More
                    </button>
                  </div>
                )}

                {!loading && issues.length === 0 && (
                  <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-10 flex flex-col items-center justify-center text-center">
                    <p className="text-[15px] font-medium text-[var(--text)]">No issues found.</p>
                    <p className="text-[14px] text-[var(--text-secondary)] mt-1">Try adjusting your filters.</p>
                  </div>
                )}
              </>
            )}
          </main>

        </div>
      </div>
    </div>
  )
}
