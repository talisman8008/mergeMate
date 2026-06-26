/**
 * /api/prcheck
 *
 * Uses the Gemini API to analyse a contributor's pull request diff and
 * return actionable feedback on code quality, alignment with issue requirements,
 * and merge-readiness.
 *
 * Endpoints:
 *   POST /api/prcheck/after  — submit a PR URL for AI verdict
 *   POST /api/prcheck/before — submit an issue URL for pre-code guidance
 */

import { Router } from 'express'

import { fetchPRData, fetchIssueData } from '../services/githubPRService.js'
import { analyzeContribution } from '../services/geminiService.js'
import requireAuth from '../middleware/auth.js'

const router = Router()

// ── URL parsers ───────────────────────────────────────────────────────────────

function parsePRUrl(prUrl) {
  // e.g. https://github.com/owner/repo/pull/123
  const match = prUrl?.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/)
  if (!match) return null
  return { owner: match[1], repo: match[2], prNumber: parseInt(match[3], 10) }
}

function parseIssueUrl(issueUrl) {
  // e.g. https://github.com/owner/repo/issues/456
  const match = issueUrl?.match(/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/)
  if (!match) return null
  return { owner: match[1], repo: match[2], issueNumber: parseInt(match[3], 10) }
}

function parseCompareUrl(compareUrl) {
  // e.g. https://github.com/owner/repo/compare/main...branch
  const cleanUrl = compareUrl?.split('?')[0].split('#')[0]
  const match = cleanUrl?.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/compare\/(.+)$/)
  if (!match) return null
  return { owner: match[1], repo: match[2], branchCompare: match[3] }
}

// ── POST /api/prcheck/after ──────────────────────────────────────────────────

router.post('/after', requireAuth, async (req, res) => {
  try {
    const { prUrl } = req.body

    if (!prUrl) {
      return res.status(400).json({ error: 'prUrl is required' })
    }

    const parsed = parsePRUrl(prUrl)
    if (!parsed) {
      return res.status(400).json({ error: 'Invalid PR URL. Format: https://github.com/owner/repo/pull/123' })
    }

    const { owner, repo, prNumber } = parsed

    // Fetch all PR data from GitHub
    let prData
    try {
      prData = await fetchPRData({ owner, repo, prNumber })
    } catch (err) {
      if (err.status === 404) {
        return res.status(404).json({ error: 'Repository or PR not found. Make sure it is a public repo.' })
      }
      throw err // re-throw non-404 errors to outer catch
    }

    // Analyse with Gemini
    const result = await analyzeContribution({
      issueTitle: prData.issueTitle,
      issueBody: prData.issueBody,
      contributing: prData.contributing,
      recentClosedPRs: prData.recentClosedPRs,
      diff: prData.diff,
      mode: 'after',
    })

    return res.json(result)
  } catch (err) {
    console.error('[prcheck] POST /after failed:', err.message)
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
})

// ── POST /api/prcheck/compare ────────────────────────────────────────────────

router.post('/compare', requireAuth, async (req, res) => {
  try {
    const { compareUrl, title, body } = req.body

    if (!compareUrl) {
      return res.status(400).json({ error: 'compareUrl is required' })
    }

    const parsed = parseCompareUrl(compareUrl)
    if (!parsed) {
      return res.status(400).json({ error: 'Invalid compare URL. Format: https://github.com/owner/repo/compare/...' })
    }

    const { owner, repo, branchCompare } = parsed

    if (!/^[a-zA-Z0-9._-]+$/.test(owner) || !/^[a-zA-Z0-9._-]+$/.test(repo)) {
      return res.status(400).json({ error: 'Invalid owner or repo name' })
    }

    // Fetch the diff directly from GitHub's web view
    const diffUrl = `https://github.com/${owner}/${repo}/compare/${branchCompare}.diff`
    
    const headers = process.env.GITHUB_TOKEN ? {
      Authorization: `token ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3.diff'
    } : {}
    
    const diffResponse = await fetch(diffUrl, { headers })
    
    if (!diffResponse.ok) {
      return res.status(404).json({ error: `Could not fetch diff. GitHub returned ${diffResponse.status}. Make sure the branch has commits and the backend has access to it.` })
    }
    const diff = await diffResponse.text()

    // Fetch context (contributing guidelines, closed PRs) to pass to AI
    // We don't fetch linked issue automatically here since it's just a raw compare,
    // but we use the live title/body passed from the extension form.
    const { getContributing } = await import('../services/github.js')
    const contributing = await getContributing(owner, repo).catch(() => '')
    
    // We can just use the recent closed PRs helper if we expose it, or fetch it.
    // For now we can skip it or fetch it quickly. 
    const { getRepoPRs } = await import('../services/github.js')
    let recentClosedPRs = []
    try {
      const prs = await getRepoPRs(owner, repo, 5)
      recentClosedPRs = prs.map((pr) => ({ title: pr.title || '', merged: pr.merged_at !== null }))
    } catch(err) { /* ignore */ }

    // Detect and fetch linked GitHub issues
    let linkedIssueTitle = title || 'Draft Pull Request'
    let linkedIssueBody = body || ''

    const issueRegex = /#(\d+)/g
    let issueMatch = null
    
    const titleMatches = [...(title || '').matchAll(issueRegex)]
    if (titleMatches.length > 0) {
      issueMatch = titleMatches[0][1]
    } else {
      const bodyMatches = [...(body || '').matchAll(issueRegex)]
      if (bodyMatches.length > 0) {
        issueMatch = bodyMatches[0][1]
      }
    }

    if (issueMatch) {
      try {
        const ghHeaders = process.env.GITHUB_TOKEN ? {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json'
        } : { Accept: 'application/vnd.github.v3+json' }
        
        const issueRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues/${issueMatch}`, { headers: ghHeaders })
        if (issueRes.ok) {
          const issueJson = await issueRes.json()
          linkedIssueTitle = issueJson.title || linkedIssueTitle
          linkedIssueBody = issueJson.body || linkedIssueBody
        }
      } catch (err) {
        // Silently fall back to PR title/body on failure
      }
    }

    // Analyse with Gemini
    const result = await analyzeContribution({
      issueTitle: linkedIssueTitle,
      issueBody: linkedIssueBody,
      contributing,
      recentClosedPRs,
      diff,
      mode: 'after', // we use the 'after' prompt to verify the diff against the title/body
    })

    return res.json(result)
  } catch (err) {
    console.error('[prcheck] POST /compare failed:', err.message)
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
})

// ── POST /api/prcheck/before ─────────────────────────────────────────────────

router.post('/before', requireAuth, async (req, res) => {
  try {
    const { issueUrl } = req.body

    if (!issueUrl) {
      return res.status(400).json({ error: 'issueUrl is required' })
    }

    const parsed = parseIssueUrl(issueUrl)
    if (!parsed) {
      return res.status(400).json({ error: 'Invalid issue URL. Format: https://github.com/owner/repo/issues/123' })
    }

    const { owner, repo, issueNumber } = parsed

    // Fetch issue data from GitHub
    let issueData
    try {
      issueData = await fetchIssueData({ owner, repo, issueNumber })
    } catch (err) {
      if (err.status === 404) {
        return res.status(404).json({ error: 'Repository or PR not found. Make sure it is a public repo.' })
      }
      throw err // re-throw non-404 errors to outer catch
    }

    // Analyse with Gemini
    const result = await analyzeContribution({
      issueTitle: issueData.issueTitle,
      issueBody: issueData.issueBody,
      contributing: issueData.contributing,
      recentClosedPRs: issueData.recentClosedPRs,
      diff: null,
      mode: 'before',
    })

    return res.json(result)
  } catch (err) {
    console.error('[prcheck] POST /before failed:', err.message)
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
})

export default router
