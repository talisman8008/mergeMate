import { useState, useEffect, useRef } from 'react'
import { fetchIssues } from '../lib/github.js'
import supabase from '../lib/supabase.js'

export default function useIssues(initialFilters) {
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  
  // Track current filters and pagination internally or via props
  const [filters, setFilters] = useState({
    language: initialFilters?.language || 'JavaScript',
    skillLevel: initialFilters?.skillLevel || 'beginner',
    page: initialFilters?.page || 1,
    minScore: initialFilters?.minScore || 0,
    labels: initialFilters?.labels || ['good-first-issue'],
    searchQuery: initialFilters?.searchQuery || '',
    // When _applied changes, it triggers a refetch from page 1
    _applied: initialFilters?._applied || Date.now()
  })

  // Cache saved urls so we don't spam the DB
  const savedUrlsRef = useRef(null)

  const getSavedUrls = async () => {
    if (savedUrlsRef.current) return savedUrlsRef.current;
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return new Set()
      const { data } = await supabase.from('saved_issues').select('issue_url').eq('user_id', session.user.id)
      const urls = new Set((data || []).map(i => i.issue_url))
      savedUrlsRef.current = urls
      return urls
    } catch(e) {
      return new Set()
    }
  }

  // Whenever filters logic effectively changes (like a new language, skillLevel, or Apply Filters is clicked)
  useEffect(() => {
    let active = true

    const loadInitial = async () => {
      setLoading(true)
      setError(null)
      setIssues([]) // clear previous
      
      const [result, savedUrls] = await Promise.all([
        fetchIssues(filters.language, filters.skillLevel, 1, filters.labels, filters.searchQuery, filters.minScore),
        getSavedUrls()
      ])
      
      if (!active) return

      if (result.error) {
        setError(result.error)
      } else {
        // Filter by minScore and exclude already saved/solved issues
        const filteredData = (result.data || []).filter(issue => !savedUrls.has(issue.url))
        setIssues(filteredData)
        setHasMore(result.has_more)
        setTotalCount(result.total_count)
        // Reset page to 1 internally if it was changed
        setFilters(prev => ({ ...prev, page: 1 }))
      }
      setLoading(false)
    }

    loadInitial()

    return () => {
      active = false
    }
  }, [filters.language, filters.skillLevel, filters.minScore, filters.labels, filters.searchQuery, filters._applied])

  const fetchMore = async () => {
    setLoading(true)
    setError(null)
    
    const nextPage = filters.page + 1
    const [result, savedUrls] = await Promise.all([
      fetchIssues(filters.language, filters.skillLevel, nextPage, filters.labels, filters.searchQuery, filters.minScore),
      getSavedUrls()
    ])
    
    if (result.error) {
      setError(result.error)
    } else {
      const filteredData = (result.data || []).filter(issue => !savedUrls.has(issue.url))
      setIssues(prev => [...prev, ...filteredData])
      setFilters(prev => ({ ...prev, page: nextPage }))
      setHasMore(result.has_more)
      setTotalCount(result.total_count)
    }
    setLoading(false)
  }

  return { issues, loading, error, hasMore, totalCount, fetchMore, setFilters }
}
