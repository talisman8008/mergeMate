/**
 * /api/issues
 *
 * GET /api/issues — search and return enriched beginner-friendly GitHub issues.
 * Enrichment: friendliness score + liveness check per issue.
 * Cache: repo_scores table — skip re-computation if scored < 30 mins ago.
 *
 * CRITICAL: Never return 500 — always return partial results with error flag.
 */

import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'

import { searchIssues, getCombinedRepoAndIssueData } from '../services/github.js'
import { computeFriendlinessScore } from '../services/friendlinessScore.js'
import { checkIssueLiveness } from '../services/livenessCheck.js'

const router = Router()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
)

const SCORE_TTL_MS = 2 * 60 * 60 * 1000 // 2 hours for score
const LIVE_TTL_MS = 30 * 60 * 1000      // 30 minutes for liveness

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseOwnerRepo(repositoryUrl) {
  const parts = (repositoryUrl ?? '').split('/')
  const repo  = parts.pop()
  const owner = parts.pop()
  return { owner, repo }
}

// ── GET /api/issues ───────────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  const language   = req.query.language   ?? 'JavaScript'
  const skillLevel = req.query.skillLevel ?? 'beginner'
  const page       = parseInt(req.query.page ?? '1', 10)
  const labelsQuery = req.query.labels    ?? 'good-first-issue'
  const searchQuery = req.query.searchQuery ?? ''
  const minScore    = parseInt(req.query.minScore ?? '0', 10)

  if (process.env.NODE_ENV !== 'production') {
    console.log('[issues] Request params:', { language, skillLevel, page, labels: labelsQuery })
  }

  const labelsList = labelsQuery.split(',').map(l => l.trim()).filter(Boolean)
  if (!labelsList.includes('good-first-issue')) {
    labelsList.push('good-first-issue') // Always include good first issue
  }
  labelsList.sort() // Sort for stable cache key

  const languagesList = language.split(',').map(l => l.trim()).filter(Boolean).sort()
  if (languagesList.length === 0) languagesList.push('JavaScript')

  const safeSearchQuery = searchQuery.trim().toLowerCase()

  // Use a stable cache key. Since labels and languages affect the fetched data, they must be part of the key.
  const cacheKey = `${languagesList.join(',')}_${skillLevel}_${labelsList.join('-')}_${safeSearchQuery}`
  const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour for the whole search results
  // Note: we can't fully cache the paginated response here if we sort *after* enrichment.
  // Actually, we can cache the ALL enriched list for this query, then slice by page.
  // Or we cache per page. Let's cache the fully enriched list per query (page-agnostic) and just slice.
  
  try {
    // 0. Check Supabase issues_cache first
    try {
      const { data } = await supabase
        .from('issues_cache')
        .select('issues_json, cached_at')
        .eq('cache_key', cacheKey)
        .single()
      
      if (data?.cached_at) {
        const ageMs = Date.now() - new Date(data.cached_at).getTime()
        if (ageMs < CACHE_TTL_MS) {
          if (process.env.NODE_ENV !== 'production') {
            console.log(`[cache] HIT for issues: ${cacheKey}`)
          }
          const fullEnriched = data.issues_json
          
          const filteredFullEnriched = fullEnriched.filter(issue => (issue.friendliness_score ?? 0) >= minScore)
          
          const itemsPerPage = 10
          const startIndex = (page - 1) * itemsPerPage
          const sliced = filteredFullEnriched.slice(startIndex, startIndex + itemsPerPage)
          
          return res.json({
            data: sliced,
            total_count: Math.max(1, filteredFullEnriched.length),
            page: page,
            has_more: startIndex + itemsPerPage < filteredFullEnriched.length,
            error: null,
            cache_hit: true,
            cached_at: data.cached_at,
          })
        }
      }
    } catch (_cacheErr) {
      // Non-fatal, fall through to fetch
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[cache] MISS for issues: ${cacheKey}`)
    }

    // 1. Fetch raw issues from GitHub — run language searches sequentially
    // to avoid parallel GraphQL calls hitting rate limits and silently dropping a language's results.
    let rawIssues = []
    for (const lang of languagesList) {
      for (const lbl of labelsList) {
        const results = await searchIssues(lang, skillLevel, [lbl], searchQuery)
        rawIssues = rawIssues.concat(results)
      }
    }

    if (!rawIssues.length) {
      return res.json({ data: [], total_count: 0, page, has_more: false, error: null })
    }

    // Deduplication — allow up to 2 issues per repo per language selected,
    // so adding a second language never reduces results from the first.
    const perRepoCap = Math.max(2, languagesList.length * 2)
    const seenUrls = new Set()
    const repoCounts = {}
    rawIssues = rawIssues.filter((issue) => {
      if (seenUrls.has(issue.html_url)) return false
      seenUrls.add(issue.html_url)

      const { owner, repo } = parseOwnerRepo(issue.repository_url)
      const repoFullName = `${owner}/${repo}`
      repoCounts[repoFullName] = (repoCounts[repoFullName] || 0) + 1
      return repoCounts[repoFullName] <= perRepoCap
    })
    if (process.env.NODE_ENV !== 'production') {
      console.log('[issues] After dedup count:', rawIssues.length)
    }

    // Quality filters
    rawIssues = rawIssues.filter(issue => issue.stars >= 10)
    rawIssues = rawIssues.filter(issue => /^[\x00-\x7F\s\p{P}]*$/u.test(issue.title))
    if (process.env.NODE_ENV !== 'production') {
      console.log('[issues] After quality filter count:', rawIssues.length)
    }

    // 2. Enrich issues in batches to improve speed while avoiding rate-limit cascade
    const enriched = []
    const BATCH_SIZE = 10

    for (let i = 0; i < rawIssues.length; i += BATCH_SIZE) {
      const batch = rawIssues.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.all(batch.map(async (issue) => {
        try {
          const { owner, repo } = parseOwnerRepo(issue.repository_url)
          const repoFullName    = `${owner}/${repo}`
          const livenessCacheKey = `${owner}/${repo}#${issue.number}`

          // Check individual caches to see if we need the combined GraphQL call
          const { data: liveData } = await supabase.from('issue_liveness').select('cached_at').eq('issue_id', livenessCacheKey).single()
          const { data: scoreData } = await supabase.from('repo_scores').select('last_updated').eq('repo_full_name', repoFullName).single()
          
          const liveHit = liveData?.cached_at && (Date.now() - new Date(liveData.cached_at).getTime() < LIVE_TTL_MS)
          const scoreHit = scoreData?.last_updated && (Date.now() - new Date(scoreData.last_updated).getTime() < SCORE_TTL_MS)

          let combinedData = null
          if (!liveHit || !scoreHit) {
            combinedData = await getCombinedRepoAndIssueData(owner, repo, issue.number)
            
            if (combinedData && combinedData.mergedPRCount > 0) {
              if (process.env.NODE_ENV !== 'production') {
                console.log(`[issues] Skipping ${repoFullName}#${issue.number} as it has a merged PR`)
              }
              return null // Skip adding it to enriched, effectively hiding it from explore
            }
          }

          const liveness = await checkIssueLiveness(owner, repo, issue.number, combinedData?.openPRCount ?? null)
          const scoreRes = await computeFriendlinessScore(
            owner, 
            repo, 
            issue.created_at, 
            liveness.openPRCount, 
            combinedData?.closedIssues ?? null, 
            combinedData?.closedPRs ?? null,
            combinedData?.repoStats ?? null
          )

          return {
            id:               issue.id,
            title:            issue.title,
            url:              issue.html_url,
            repo_name:        repoFullName,
            language:         issue.language, // GraphQL sets this directly
            stars:            issue.stars,    // GraphQL sets this directly
            created_at:       issue.created_at,
            comments:         issue.comments,
            number:           issue.number,
            labels:           issue.labels,
            friendliness_score: scoreRes.score,
            score_breakdown:    scoreRes.breakdown,
            fallbacks_used:     scoreRes.fallbacks_used ?? [],
            open_pr_count:      liveness.openPRCount,
            liveness_status:    liveness.status,
            liveness_cached:    liveness.cached,
            score_cached:       scoreRes.cached,
          }
        } catch (issueErr) {
          console.warn('[issues] enrichment failed for issue', issue.id, issueErr.message)
          return null
        }
      }))
      
      enriched.push(...batchResults.filter(Boolean))
    }

    // 3. Sorting
    enriched.sort((a, b) => {
      if (b.friendliness_score !== a.friendliness_score) {
        return b.friendliness_score - a.friendliness_score
      }
      return new Date(b.created_at) - new Date(a.created_at)
    })

    const now = new Date().toISOString()

    // Save ALL enriched + sorted to issues_cache
    supabase
      .from('issues_cache')
      .upsert(
        { cache_key: cacheKey, issues_json: enriched, cached_at: now },
        { onConflict: 'cache_key' }
      )
      .then(({ error }) => {
        if (error) console.warn('[issues] issues_cache write failed:', error.message)
      })

    // 4. Pagination slicing and minScore filter
    const filteredEnriched = enriched.filter(issue => (issue.friendliness_score ?? 0) >= minScore)
    const itemsPerPage = 10
    const startIndex = (page - 1) * itemsPerPage
    let sliced = filteredEnriched.slice(startIndex, startIndex + itemsPerPage)

    return res.json({ 
      data: sliced, 
      total_count: Math.max(1, filteredEnriched.length),
      page: page,
      has_more: startIndex + itemsPerPage < filteredEnriched.length,
      error: null 
    })

  } catch (err) {
    console.error('[issues] GET / failed:', err.message)
    return res.json({ data: [], total_count: 0, page, has_more: false, error: err.message })
  }
})

export default router
