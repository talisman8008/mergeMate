/**
 * livenessCheck.js — Check how many open PRs target a specific issue.
 * Never let API failure crash the response — entire function is wrapped in try/catch.
 * Results are cached in Supabase `issue_liveness` table for 30 minutes.
 */

import { createClient } from '@supabase/supabase-js'
import { getIssueOpenPRs } from './github.js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
)

const CACHE_TTL_MS = 30 * 60 * 1000  // 30 minutes

// ── Status label ──────────────────────────────────────────────────────────────

function resolveStatus(openPRCount) {
  if (openPRCount === 0) return 'fresh'
  if (openPRCount <= 2)  return 'active'
  if (openPRCount <= 5)  return 'crowded'
  return 'avoid'
}

// ── Safe fallback result ──────────────────────────────────────────────────────

const ERROR_RESULT = { openPRCount: 0, status: 'fresh', cached: false, error: true }

// ── Main export ───────────────────────────────────────────────────────────────

export async function checkIssueLiveness(owner, repo, issueNumber, preFetchedOpenPRCount = null) {
  try {
    const cacheKey    = `${owner}/${repo}#${issueNumber}`
    const repoFullName = `${owner}/${repo}`

    // ── 1. Try cache ──────────────────────────────────────────────────────────
    try {
      const { data } = await supabase
        .from('issue_liveness')
        .select('open_pr_count, cached_at')
        .eq('issue_id', cacheKey)
        .single()

      if (data?.cached_at) {
        const ageMs = Date.now() - new Date(data.cached_at).getTime()
        if (ageMs < CACHE_TTL_MS) {
          console.log(`[cache] HIT for issue: ${cacheKey}`)
          return {
            openPRCount: data.open_pr_count,
            status: resolveStatus(data.open_pr_count),
            cached: true,
            cached_at: data.cached_at,
          }
        }
      }
    } catch (_cacheErr) {
      // Cache read failure is non-fatal — fall through to live fetch
      console.warn(`[livenessCheck] cache read failed for ${cacheKey}, fetching live`)
    }

    console.log(`[cache] MISS for issue: ${cacheKey}`)

    // ── 2. Fetch live from GitHub ─────────────────────────────────────────────
    const openPRCount = preFetchedOpenPRCount !== null ? preFetchedOpenPRCount : await getIssueOpenPRs(owner, repo, issueNumber)
    const status      = resolveStatus(openPRCount)

    // ── 3. Persist to cache (fire-and-forget — never blocks the response) ─────
    supabase
      .from('issue_liveness')
      .upsert(
        {
          issue_id:          cacheKey,
          repo_full_name:    repoFullName,
          open_pr_count:     openPRCount,
          last_comment_date: new Date().toISOString(),
          cached_at:         new Date().toISOString(),
        },
        { onConflict: 'issue_id' },
      )
      .then(({ error }) => {
        if (error) console.warn('[livenessCheck] cache write failed:', error.message)
      })

    return { openPRCount, status, cached: false, cached_at: new Date().toISOString() }

  } catch (err) {
    // Never let API failure crash the response
    console.error('[livenessCheck] unexpected error:', err.message)
    return ERROR_RESULT
  }
}
