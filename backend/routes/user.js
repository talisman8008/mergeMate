/**
 * /api/user
 *
 * Authenticated user operations — dashboard stats and issue status management.
 * All endpoints validate the Supabase JWT before responding.
 *
 * Endpoints:
 *   GET   /api/user/dashboard      — get dashboard stats + saved issues
 *   PATCH /api/user/issues/:issueId — update a saved issue's status
 */

import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'

const router = Router()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
)

// ── Auth middleware ───────────────────────────────────────────────────────────

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' })
    }

    const token = authHeader.slice(7) // strip "Bearer "

    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    req.user = user
    next()
  } catch (err) {
    console.error('[user] Auth middleware error:', err.message)
    return res.status(401).json({ error: 'Authentication failed' })
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Calculate current streak — consecutive days (going back from today)
 * where at least one issue was marked "done".
 */
function calculateStreak(issues) {
  const doneIssues = issues.filter((i) => i.status === 'done' && i.created_at)

  if (doneIssues.length === 0) return 0

  // Get unique dates (YYYY-MM-DD) when issues were marked done
  const doneDates = new Set(
    doneIssues.map((i) => new Date(i.created_at).toISOString().slice(0, 10)),
  )

  let streak = 0
  const today = new Date()

  for (let d = 0; d < 365; d++) {
    const checkDate = new Date(today)
    checkDate.setDate(checkDate.getDate() - d)
    const dateStr = checkDate.toISOString().slice(0, 10)

    if (doneDates.has(dateStr)) {
      streak++
    } else if (d > 0) {
      // Allow today to not have activity yet — only break on past gaps
      break
    }
  }

  return streak
}

// ── GET /api/user/dashboard ──────────────────────────────────────────────────

router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id

    const { data: issues, error } = await supabase
      .from('saved_issues')
      .select('id, user_id, issue_title, repo_name, issue_url, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[user] Dashboard query failed:', error.message)
      return res.status(500).json({ error: 'Failed to fetch dashboard data' })
    }

    const allIssues = issues || []

    const totalSaved = allIssues.length
    const totalDone = allIssues.filter((i) => i.status === 'done').length
    const mergeRate = totalSaved > 0
      ? Math.round((totalDone / totalSaved) * 1000) / 10
      : 0
    const currentStreak = calculateStreak(allIssues)

    return res.json({
      issues: allIssues,
      totalSaved,
      totalDone,
      mergeRate,
      currentStreak,
    })
  } catch (err) {
    console.error('[user] GET /dashboard failed:', err.message)
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
})

// ── PATCH /api/user/issues/:issueId ──────────────────────────────────────────

router.patch('/issues/:issueId', requireAuth, async (req, res) => {
  try {
    const { issueId } = req.params
    const { status } = req.body

    const validStatuses = ['saved', 'attempting', 'done']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      })
    }

    const { data, error } = await supabase
      .from('saved_issues')
      .update({ status })
      .eq('id', issueId)
      .eq('user_id', req.user.id) // ensure user owns this issue
      .select()
      .single()

    if (error) {
      console.error('[user] PATCH issue failed:', error.message)
      return res.status(500).json({ error: 'Failed to update issue status' })
    }

    if (!data) {
      return res.status(404).json({ error: 'Issue not found or not owned by you' })
    }

    return res.json(data)
  } catch (err) {
    console.error('[user] PATCH /issues/:issueId failed:', err.message)
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
})

// ── POST /api/user/seed-demo ─────────────────────────────────────────────────

router.post('/seed-demo', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id

    const demoIssues = [
      {
        user_id: userId,
        issue_title: 'Fix React component rendering bug',
        repo_name: 'facebook/react',
        issue_url: 'https://github.com/facebook/react/issues/28000',
        status: 'done',
      },
      {
        user_id: userId,
        issue_title: 'Add dark mode toggle',
        repo_name: 'tailwindlabs/tailwindcss',
        issue_url: 'https://github.com/tailwindlabs/tailwindcss/issues/1420',
        status: 'done',
      },
      {
        user_id: userId,
        issue_title: 'Migrate to Vite 5',
        repo_name: 'vitejs/vite',
        issue_url: 'https://github.com/vitejs/vite/issues/15123',
        status: 'attempting',
      },
      {
        user_id: userId,
        issue_title: 'Support markdown in comments',
        repo_name: 'supabase/supabase',
        issue_url: 'https://github.com/supabase/supabase/issues/890',
        status: 'saved',
      },
      {
        user_id: userId,
        issue_title: 'Update outdated documentation',
        repo_name: 'vercel/next.js',
        issue_url: 'https://github.com/vercel/next.js/issues/62010',
        status: 'saved',
      },
    ]

    const { error } = await supabase
      .from('saved_issues')
      .insert(demoIssues)

    if (error) {
      console.error('[user] Seed demo failed:', error.message)
      return res.status(500).json({ error: 'Failed to seed demo data' })
    }

    return res.json({ message: 'Demo data seeded successfully', count: demoIssues.length })
  } catch (err) {
    console.error('[user] POST /seed-demo failed:', err.message)
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
})

// ── POST /api/user/issues ────────────────────────────────────────────────────

router.post('/issues', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id
    const { issue_title, repo_name, issue_url } = req.body

    // Check if it already exists
    const { data: existing, error: checkError } = await supabase
      .from('saved_issues')
      .select('id')
      .eq('user_id', userId)
      .eq('issue_url', issue_url)
      .maybeSingle()

    if (checkError) {
      console.error('[user] POST issue check failed:', checkError.message)
      return res.status(500).json({ error: 'Failed to check existing issue' })
    }

    if (existing) {
      return res.status(409).json({ error: 'Already saved' })
    }

    // Insert new issue
    const { data, error } = await supabase
      .from('saved_issues')
      .insert({
        user_id: userId,
        issue_title,
        repo_name,
        issue_url,
        status: 'saved',
      })
      .select()
      .single()

    if (error) {
      console.error('[user] POST issue failed:', error.message)
      return res.status(500).json({ error: 'Failed to save issue' })
    }

    return res.status(201).json(data)
  } catch (err) {
    console.error('[user] POST /issues failed:', err.message)
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
})

// ── DELETE /api/user/clear-demo ──────────────────────────────────────────────

router.delete('/clear-demo', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id

    const demoRepos = [
      'facebook/react',
      'tailwindlabs/tailwindcss',
      'vitejs/vite',
      'supabase/supabase',
      'vercel/next.js'
    ]

    const { error } = await supabase
      .from('saved_issues')
      .delete()
      .eq('user_id', userId)
      .in('repo_name', demoRepos)

    if (error) {
      console.error('[user] Clear demo failed:', error.message)
      return res.status(500).json({ error: 'Failed to clear demo data' })
    }

    return res.json({ message: 'Demo data cleared successfully' })
  } catch (err) {
    console.error('[user] DELETE /clear-demo failed:', err.message)
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
})

export default router
