/**
 * /api/liveness
 *
 * GET /api/liveness/:owner/:repo/:issue
 * — Returns liveness status for a specific GitHub issue.
 *   Delegates to checkIssueLiveness which handles its own caching.
 *
 * Response shape: { data: { openPRCount, status, cached }, error, cached }
 */

import { Router } from 'express'
import { checkIssueLiveness } from '../services/livenessCheck.js'

const router = Router()

// ── GET /api/liveness/:owner/:repo/:issue ─────────────────────────────────────

router.get('/:owner/:repo/:issue', async (req, res) => {
  const { owner, repo, issue } = req.params
  const issueNumber = parseInt(issue, 10)

  try {
    if (isNaN(issueNumber)) {
      return res.json({
        data:   null,
        error:  'issue must be a valid number',
        cached: false,
      })
    }

    const result = await checkIssueLiveness(owner, repo, issueNumber)

    return res.json({
      data: {
        openPRCount: result.openPRCount,
        status:      result.status,
        cached:      result.cached,
        ...(result.error ? { error: true } : {}),
      },
      error:  result.error ? 'liveness check failed, returning safe default' : null,
      cache_hit: result.cached,
      cached_at: result.cached_at || null,
    })

  } catch (err) {
    // Outer catch — checkIssueLiveness already catches internally, so this is last resort
    console.error(`[liveness] GET /${owner}/${repo}/${issue} failed:`, err.message)
    return res.json({
      data:   { openPRCount: 0, status: 'fresh', cached: false },
      error:  err.message,
      cache_hit: false,
      cached_at: null,
    })
  }
})

export default router
