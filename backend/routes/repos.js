/**
 * /api/repos
 *
 * GET /api/repos/:owner/:repo/score
 * — Returns the friendliness score for a specific repository.
 *   Checks Supabase repo_scores cache first (30-min TTL).
 *   Computes fresh if stale or missing, then caches the result.
 *
 * Response shape: { data: { repo, score, breakdown, fallbacks_used, cached }, error, cached }
 */

import { Router } from 'express'
import { computeFriendlinessScore } from '../services/friendlinessScore.js'

const router = Router()

// ── GET /api/repos/:owner/:repo/score ─────────────────────────────────────────

router.get('/:owner/:repo/score', async (req, res) => {
  const { owner, repo } = req.params
  const repoFullName    = `${owner}/${repo}`

  try {
    // Compute friendliness score (it will hit cache internally if valid)
    const result = await computeFriendlinessScore(owner, repo, null, 0)

    return res.json({
      data: {
        repo:          repoFullName,
        score:         result.score,
        breakdown:     result.breakdown,
        fallbacks_used: result.fallbacks_used,
        cached:        result.cached,
      },
      error:  null,
      cache_hit: result.cached,
      cached_at: result.cached_at,
    })

  } catch (err) {
    console.error(`[repos] GET /${owner}/${repo}/score failed:`, err.message)
    return res.json({
      data:   null,
      error:  err.message,
      cache_hit: false,
      cached_at: null,
    })
  }
})

export default router
