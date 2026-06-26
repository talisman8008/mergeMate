import { useState, useEffect, useCallback, useRef } from 'react'

import Navbar from '../components/Navbar.jsx'
import FilterSidebar from '../components/FilterSidebar.jsx'
import IssueCard from '../components/IssueCard.jsx'
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

function LoadingSkeleton({ viewMode }) {
  const containerClass = viewMode === 'grid' 
    ? "grid grid-cols-1 xl:grid-cols-2 gap-4 w-full" 
    : "flex flex-col gap-4 w-full";
    
  return (
    <div className={containerClass}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 h-[180px] flex flex-col justify-between animate-pulse">
          <div className="flex justify-between items-start">
            <div className="flex gap-3 items-center">
              <div className="w-8 h-8 rounded-md bg-[var(--border)]"></div>
              <div className="flex flex-col gap-2">
                <div className="h-3 w-20 bg-[var(--border)] rounded"></div>
                <div className="h-2 w-10 bg-[var(--border)] rounded-full"></div>
              </div>
            </div>
            <div className="w-[40px] h-[40px] rounded-full bg-[var(--border)]"></div>
          </div>
          <div className="flex flex-col gap-2 my-2 flex-grow justify-center">
            <div className="h-3.5 w-full bg-[var(--border)] rounded"></div>
            <div className="h-3.5 w-2/3 bg-[var(--border)] rounded"></div>
          </div>
          <div className="flex justify-between items-end mt-2 pt-2 border-t border-transparent">
            <div className="flex gap-2">
              <div className="h-4 w-16 bg-[var(--border)] rounded-full"></div>
              <div className="h-3 w-8 bg-[var(--border)] rounded mt-1"></div>
            </div>
            <div className="flex gap-2">
              <div className="h-3 w-10 bg-[var(--border)] rounded mb-1"></div>
              <div className="h-3 w-12 bg-[var(--border)] rounded mb-1"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Explore() {
  const { user, signIn, signOut } = useAuth()
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'

  const [sidebarFilters, setSidebarFilters] = useState(() => {
    try {
      const saved = localStorage.getItem('exploreFilters')
      if (saved) {
        const parsed = JSON.parse(saved)
        return { ...parsed, _applied: 0 }
      }
    } catch (e) {
      console.error('Failed to parse saved filters', e)
    }
    return {
      languages: ['JavaScript'],
      skillLevel: 'Beginner',
      minScore: 0,
      searchQuery: '',
      labels: ['good-first-issue'],
      _applied: 0
    }
  })

  const [fetchParams, setFetchParams] = useState(() => {
    return {
      language: sidebarFilters.languages.join(',') || 'JavaScript',
      page: 1,
      skillLevel: sidebarFilters.skillLevel.toLowerCase() || 'beginner',
      minScore: parseInt(sidebarFilters.minScore, 10) || 0,
      searchQuery: sidebarFilters.searchQuery || '',
      labels: sidebarFilters.labels || ['good-first-issue'],
      _applied: 0
    }
  })

  useEffect(() => {
    localStorage.setItem('exploreFilters', JSON.stringify({
      languages: sidebarFilters.languages,
      skillLevel: sidebarFilters.skillLevel,
      minScore: sidebarFilters.minScore,
      searchQuery: sidebarFilters.searchQuery,
      labels: sidebarFilters.labels
    }))
  }, [sidebarFilters.languages, sidebarFilters.skillLevel, sidebarFilters.minScore, sidebarFilters.searchQuery, sidebarFilters.labels])

  const { issues, loading, error, hasMore, totalCount, fetchMore, setFilters: setHookFilters } = useIssues(fetchParams)

  const debouncedSetFetchParams = useCallback(
    debounce((filters) => {
      setFetchParams({
        language: filters.languages.join(',') || 'JavaScript',
        page: 1,
        skillLevel: filters.skillLevel.toLowerCase() || 'beginner',
        minScore: parseInt(filters.minScore, 10) || 0,
        searchQuery: filters.searchQuery || '',
        labels: filters.labels || ['good-first-issue'],
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
        language: sidebarFilters.languages.join(',') || 'JavaScript',
        page: 1,
        skillLevel: sidebarFilters.skillLevel.toLowerCase() || 'beginner',
        minScore: parseInt(sidebarFilters.minScore, 10) || 0,
        searchQuery: sidebarFilters.searchQuery || '',
        labels: sidebarFilters.labels || ['good-first-issue'],
        _applied: Date.now()
      })
    } else {
      debouncedSetFetchParams(sidebarFilters)
    }
  }, [sidebarFilters.languages, sidebarFilters.skillLevel, sidebarFilters.minScore, sidebarFilters.searchQuery, sidebarFilters.labels, debouncedSetFetchParams])

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
    <div className="bg-[var(--bg-primary)] min-h-screen text-[var(--text-primary)] flex flex-col">
      <Navbar user={user} signIn={signIn} signOut={signOut} />

      <div className="flex flex-1 w-full items-start">
        {/* Left: FilterSidebar (fixed width, full height) */}
        <div className="w-[280px] flex-shrink-0 hidden md:block sticky top-[64px] h-[calc(100vh-64px)] overflow-y-auto border-r border-[var(--border)] bg-[var(--bg-card)]">
          <FilterSidebar filters={sidebarFilters} onFilterChange={setSidebarFilters} />
        </div>

        {/* Right: issue list (scrollable main area) */}
        <main className="flex-1 min-w-0 w-full p-6 md:p-8">
          
          <div className="max-w-6xl mx-auto">
            {/* Top bar */}
            <div className="flex items-center justify-between pb-3 mb-6 border-b border-[var(--border)]">
              <div className="flex items-center gap-4">
                <span className="font-sans text-[13px] text-[var(--text-muted)]">
                  {noLanguagesSelected ? '0 issues' : `Showing ${issues.length} of ${totalCount || 0} issues`}
                </span>
                <span className="font-sans text-[13px] text-[var(--text-muted)] hidden sm:inline-block">
                  Sorted by friendliness
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* Grid View Button */}
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-[var(--bg-card-hover)] text-[var(--text-primary)] border border-[var(--accent-blue)] shadow-[0_0_0_1px_var(--accent-blue)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-transparent hover:bg-[var(--bg-card-hover)]'
                  }`}
                  title="Grid view"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                </button>

                {/* List View Button */}
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded transition-colors ${
                    viewMode === 'list'
                      ? 'bg-[var(--bg-card-hover)] text-[var(--text-primary)] border border-[var(--accent-blue)] shadow-[0_0_0_1px_var(--accent-blue)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-transparent hover:bg-[var(--bg-card-hover)]'
                  }`}
                  title="List view"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6"></line>
                    <line x1="8" y1="12" x2="21" y2="12"></line>
                    <line x1="8" y1="18" x2="21" y2="18"></line>
                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>

            {/* No languages selected */}
            {noLanguagesSelected && (
              <div className="flex flex-col items-center justify-center h-[400px]">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-50">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                </svg>
                <p className="text-[16px] font-medium text-[var(--text-primary)] mb-1">
                  No issues found
                </p>
                <p className="text-[14px] text-[var(--text-muted)] mb-6">
                  Try adjusting your filters on the left
                </p>
                <button
                  onClick={() => setSidebarFilters({ languages: ['JavaScript'], skillLevel: 'Beginner', minScore: 0, searchQuery: '', labels: ['good-first-issue'], _applied: Date.now() })}
                  className="font-sans text-[13px] font-medium text-black bg-[var(--accent-green)] hover:bg-[#2ea043] px-4 py-2 rounded-md transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            )}

            {/* API error */}
            {!noLanguagesSelected && error && (
              <div className="bg-[var(--bg-card)] border border-[var(--accent-red)] rounded-xl p-6 mb-4 flex flex-col items-center text-center">
                <p className="text-[14px] font-medium" style={{ color: 'var(--accent-red)' }}>
                  Unable to load issues.
                </p>
                <p className="text-[13px] text-[var(--text-faint)] mb-4">
                  {error}
                </p>
                <button
                  onClick={handleRetry}
                  className="text-[13px] font-medium text-black rounded-md px-4 py-1.5 transition-colors duration-150 hover:opacity-90 bg-[var(--accent-green)]"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Issue list */}
            {!noLanguagesSelected && !error && (
              <>
                <div className={viewMode === 'grid' ? "grid grid-cols-1 xl:grid-cols-2 gap-4" : "flex flex-col gap-4"}>
                  {issues.map((issue) => (
                    <div 
                      key={`${issue.repo_name}-${issue.number}-${issue.id}`}
                      className="flex flex-col"
                      onClickCapture={(e) => {
                        if (!user) {
                          e.stopPropagation()
                          e.preventDefault()
                          signIn()
                        }
                      }}
                    >
                      <IssueCard issue={issue} viewMode={viewMode} />
                    </div>
                  ))}
                </div>

                {loading && (
                  <div className={`w-full ${issues.length > 0 ? 'mt-4' : ''}`}>
                    <LoadingSkeleton viewMode={viewMode} />
                  </div>
                )}

                {issues.length > 0 && hasMore && (
                  <div className="mt-8 mb-8 flex justify-center w-full">
                    <button
                      onClick={fetchMore}
                      disabled={loading}
                      className="font-sans text-[14px] font-medium text-[var(--text-primary)] bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--border-hover)] rounded-[6px] px-6 py-3 w-full transition-colors duration-150 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading && (
                        <svg className="animate-spin h-4 w-4 text-[var(--text-primary)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      Load more issues
                    </button>
                  </div>
                )}

                {!loading && issues.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-[400px]">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-50">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <p className="text-[16px] font-medium text-[var(--text-primary)] mb-1">
                      No issues found
                    </p>
                    <p className="text-[14px] text-[var(--text-muted)] mb-6">
                      Try adjusting your filters
                    </p>
                    <button
                      onClick={() => setSidebarFilters({ languages: [], skillLevel: '', minScore: 0, searchQuery: '', labels: ['good-first-issue'], _applied: Date.now() })}
                      className="font-sans text-[13px] font-medium text-black bg-[var(--accent-green)] hover:bg-[#2ea043] px-4 py-2 rounded-md transition-colors"
                    >
                      Reset Filters
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
