/**
 * /api/issues
 *
 * GET /api/issues — search and return enriched beginner-friendly GitHub issues.
 * Enrichment: friendliness score + liveness check per issue.
 * Cache: repo_scores table — skip re-computation if scored < 30 mins ago.
 *
 * CRITICAL: Process max 5 issues per request to avoid GitHub rate limits.
 * CRITICAL: Never return 500 — always return partial results with error flag.
 */

import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'

import { searchIssues, getRepoData } from '../services/github.js'
import { computeFriendlinessScore } from '../services/friendlinessScore.js'
import { checkIssueLiveness } from '../services/livenessCheck.js'

const router = Router()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
)

const SCORE_TTL_MS = 30 * 60 * 1000  // 30 minutes
const MAX_PER_REQUEST = 5             // GitHub rate-limit guard

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Parse owner and repo from a GitHub repository_url string. */
function parseOwnerRepo(repositoryUrl) {
  // e.g. https://api.github.com/repos/facebook/react
  const parts = (repositoryUrl ?? '').split('/')
  const repo  = parts.pop()
  const owner = parts.pop()
  return { owner, repo }
}

/** Read a cached repo score from Supabase. Returns null if missing or stale. */
async function getCachedScore(repoFullName) {
  try {
    const { data } = await supabase
      .from('repo_scores')
      .select('friendliness_score, response_time_hrs, beginner_merge_rate, last_updated')
      .eq('repo_full_name', repoFullName)
      .single()

    if (!data?.last_updated) return null
    const ageMs = Date.now() - new Date(data.last_updated).getTime()
    if (ageMs > SCORE_TTL_MS) return null

    return {
      score: data.friendliness_score,
      breakdown: {
        response_time_hrs:    data.response_time_hrs,
        beginner_merge_rate:  data.beginner_merge_rate,
      },
    }
  } catch {
    return null
  }
}

/** Persist a freshly computed score to Supabase (fire-and-forget). */
function saveScore(repoFullName, score, breakdown) {
  supabase
    .from('repo_scores')
    .upsert(
      {
        repo_full_name:      repoFullName,
        friendliness_score:  score,
        response_time_hrs:   breakdown.response_time_hrs ?? null,
        beginner_merge_rate: breakdown.beginner_merge_rate ?? null,
        last_updated:        new Date().toISOString(),
      },
      { onConflict: 'repo_full_name' },
    )
    .then(({ error }) => {
      if (error) console.warn('[issues] saveScore failed:', error.message)
    })
}

// ── GET /api/issues ───────────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  const language   = req.query.language   ?? 'JavaScript'
  const skillLevel = req.query.skillLevel ?? 'beginner'
  const page       = parseInt(req.query.page ?? '1', 10)

  try {
    // 1. Fetch raw issues from GitHub search for each language
    const languages = language.split(',').map(l => l.trim()).filter(Boolean)
    if (languages.length === 0) languages.push('JavaScript') // fallback

    const results = await Promise.all(
      languages.map(lang => searchIssues(lang, skillLevel, page))
    )
    
    // Merge and sort all results by created_at descending
    let rawIssues = results.flat().sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    if (!rawIssues.length) {
      return res.json({ data: [], error: null, cached: false })
    }

    // Filter to keep max 2 issues per repository
    const repoCounts = {}
    rawIssues = rawIssues.filter((issue) => {
      const { owner, repo } = parseOwnerRepo(issue.repository_url)
      const repoFullName = `${owner}/${repo}`
      repoCounts[repoFullName] = (repoCounts[repoFullName] || 0) + 1
      return repoCounts[repoFullName] <= 2
    })

    // 2. Cap to MAX_PER_REQUEST to avoid rate limit cascade
    const slice = rawIssues.slice(0, MAX_PER_REQUEST)

    // 3. Enrich each issue (score + liveness) — sequentially to stay rate-limit safe
    const enriched = []

    for (const issue of slice) {
      try {
        const { owner, repo } = parseOwnerRepo(issue.repository_url)
        const repoFullName    = `${owner}/${repo}`

        // Liveness check (has its own cache internally)
        const liveness = await checkIssueLiveness(owner, repo, issue.number)

        // Score — check repo-level cache first
        let scoreData = await getCachedScore(repoFullName)
        let cached    = !!scoreData

        if (!scoreData) {
          scoreData = await computeFriendlinessScore(
            owner, repo, issue.created_at, liveness.openPRCount,
          )
          saveScore(repoFullName, scoreData.score, scoreData.breakdown)
        }

        const repoData = await getRepoData(owner, repo)

        enriched.push({
          id:               issue.id,
          title:            issue.title,
          url:              issue.html_url,
          repo_name:        repoFullName,
          language:         issue.language || repoData.language,
          stars:            repoData.stars,
          created_at:       issue.created_at,
          comments:         issue.comments,
          number:           issue.number,
          friendliness_score: scoreData.score,
          score_breakdown:    scoreData.breakdown,
          fallbacks_used:     scoreData.fallbacks_used ?? [],
          open_pr_count:      liveness.openPRCount,
          liveness_status:    liveness.status,
          liveness_cached:    liveness.cached,
          score_cached:       cached,
        })
      } catch (issueErr) {
        // One issue failing must not block the rest
        console.warn('[issues] enrichment failed for issue', issue.id, issueErr.message)
      }
    }

    return res.json({ data: enriched, error: null, cached: false })

  } catch (err) {
    // Never return 500 — return whatever partial data we have
    console.error('[issues] GET / failed:', err.message)
    return res.json({ data: [], error: err.message, cached: false })
  }
})

export default router
