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
import { getUserProfile, getUserActivity } from '../services/github.js'
import requireAuth from '../middleware/auth.js'

const router = Router()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
)

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

// ── GET /api/user/profile ───────────────────────────────────────────────────

router.get('/profile', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('[user] GET profile failed:', error.message)
      return res.status(500).json({ error: error.message })
    }

    return res.json(data || {})
  } catch (err) {
    console.error('[user] GET /profile failed:', err.message)
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
})

// ── POST /api/user/profile ──────────────────────────────────────────────────

router.post('/profile', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id
    const { languages, skill_level, interests } = req.body

    const { error } = await supabase
      .from('users')
      .upsert(
        {
          id: userId,
          github_id: req.user.user_metadata?.provider_id ?? null,
          username: req.user.user_metadata?.user_name ?? null,
          avatar_url: req.user.user_metadata?.avatar_url ?? null,
          languages,
          skill_level,
          interests,
        },
        { onConflict: 'id' }
      )

    if (error) {
      console.error('[user] Profile save failed:', error.message)
      return res.status(500).json({ error: error.message })
    }

    return res.json({ success: true })
  } catch (err) {
    console.error('[user] POST /profile failed:', err.message)
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
})

// ── GET /api/user/merged-prs ─────────────────────────────────────────────────

router.get('/merged-prs', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id
    let username = req.user.user_metadata?.user_name || req.user.user_metadata?.preferred_username

    // Check users table for username, fallback and update if necessary
    const { data: userRow } = await supabase
      .from('users')
      .select('username')
      .eq('id', userId)
      .maybeSingle()

    if (userRow?.username) {
      username = userRow.username
    } else if (username) {
      await supabase.from('users').update({ username }).eq('id', userId)
    }

    if (!username) {
      return res.json({ heatmapData: {}, totalMerged: 0, recentMerged: [] })
    }

    // Check cache
    const { data: cacheEntry } = await supabase
      .from('user_merged_prs_cache')
      .select('data_json, cached_at')
      .eq('user_id', userId)
      .maybeSingle()

    if (cacheEntry && cacheEntry.cached_at) {
      const cacheAge = Date.now() - new Date(cacheEntry.cached_at).getTime()
      if (cacheAge < 1000 * 60 * 60 && cacheEntry.data_json && cacheEntry.data_json.recentOpen) {
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[merged-prs] cache HIT for user: ${username}`)
        }
        return res.json(cacheEntry.data_json)
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[merged-prs] cache MISS for user: ${username} — fetching GitHub`)
    }

    // Fetch from GitHub GraphQL
    const query = `
      query GetMergedPRs($username: String!) {
        user(login: $username) {
          pullRequests(
            states: [MERGED]
            first: 100
            orderBy: { field: UPDATED_AT, direction: DESC }
          ) {
            nodes {
              mergedAt
              title
              url
              repository {
                nameWithOwner
                stargazerCount
              }
            }
          }
          openPullRequests: pullRequests(
            states: [OPEN]
            first: 10
            orderBy: { field: UPDATED_AT, direction: DESC }
          ) {
            nodes {
              createdAt
              title
              url
              repository {
                nameWithOwner
              }
            }
          }
        }
      }
    `

    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { username }
      })
    })

    if (!response.ok) {
      throw new Error(`GitHub API returned ${response.status}`)
    }

    const result = await response.json()
    if (result.errors) {
      throw new Error(`GraphQL Error: ${result.errors[0].message}`)
    }

    const nodes = result.data?.user?.pullRequests?.nodes || []
    const openNodes = result.data?.user?.openPullRequests?.nodes || []

    const heatmapData = {}
    let totalMerged = 0
    const recentMerged = []

    for (const pr of nodes) {
      totalMerged++
      const dateStr = pr.mergedAt.split('T')[0]
      if (!heatmapData[dateStr]) {
        heatmapData[dateStr] = 0
      }
      heatmapData[dateStr]++
      
      if (recentMerged.length < 5) {
        recentMerged.push({
          title: pr.title,
          url: pr.url,
          repo: pr.repository.nameWithOwner,
          mergedAt: pr.mergedAt
        })
      }
    }

    const recentOpen = openNodes.slice(0, 5).map(pr => ({
      title: pr.title,
      url: pr.url,
      repo: pr.repository.nameWithOwner,
      createdAt: pr.createdAt
    }))

    const payload = {
      heatmapData,
      totalMerged,
      recentMerged,
      recentOpen
    }

    // Save to cache
    await supabase.from('user_merged_prs_cache').upsert({
      user_id: userId,
      data_json: payload,
      cached_at: new Date().toISOString()
    })

    return res.json(payload)

  } catch (err) {
    console.error('[user] GET /merged-prs failed:', err.message)
    // Never crash — gracefully return empty data
    return res.json({ heatmapData: {}, totalMerged: 0, recentMerged: [] })
  }
})

// ── GET /api/user/github-profile ─────────────────────────────────────────────

router.get('/github-profile', requireAuth, async (req, res) => {
  try {
    const userMeta = req.user.user_metadata
    const username = userMeta?.user_name || userMeta?.preferred_username

    if (!username) {
      return res.status(400).json({ error: 'GitHub username not found in user metadata.' })
    }

    const [profile, activity] = await Promise.all([
      getUserProfile(username),
      getUserActivity(username),
    ])

    if (!profile) {
      return res.status(404).json({ error: 'GitHub profile not found.' })
    }

    return res.json({
      profile,
      activity: activity || {
        languages: [],
        totalPRs: 0,
        totalIssuesClosed: 0,
        heatmap: [],
        recentActivity: []
      }
    })
  } catch (err) {
    console.error('[user] GET /github-profile failed:', err.message)
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

    // Clear existing issues first
    await supabase.from('saved_issues').delete().eq('user_id', userId)

    const now = new Date()
    const offset = (days) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString()

    const demoIssues = [
      {
        user_id: userId,
        issue_title: 'Fix React component rendering bug',
        repo_name: 'facebook/react',
        issue_url: 'https://github.com/facebook/react/issues/28000',
        status: 'done',
        created_at: offset(2)
      },
      {
        user_id: userId,
        issue_title: 'Add dark mode toggle',
        repo_name: 'tailwindlabs/tailwindcss',
        issue_url: 'https://github.com/tailwindlabs/tailwindcss/issues/1420',
        status: 'done',
        created_at: offset(15)
      },
      {
        user_id: userId,
        issue_title: 'Migrate to Vite 5',
        repo_name: 'vitejs/vite',
        issue_url: 'https://github.com/vitejs/vite/issues/15123',
        status: 'done',
        created_at: offset(35)
      },
      {
        user_id: userId,
        issue_title: 'Support markdown in comments',
        repo_name: 'supabase/supabase',
        issue_url: 'https://github.com/supabase/supabase/issues/890',
        status: 'attempting',
        created_at: offset(4)
      },
      {
        user_id: userId,
        issue_title: 'Update outdated documentation',
        repo_name: 'vercel/next.js',
        issue_url: 'https://github.com/vercel/next.js/issues/62010',
        status: 'attempting',
        created_at: offset(10)
      },
      {
        user_id: userId,
        issue_title: 'Fix hydration error on server render',
        repo_name: 'facebook/react',
        issue_url: 'https://github.com/facebook/react/issues/1',
        status: 'attempting',
        created_at: offset(20)
      },
      {
        user_id: userId,
        issue_title: 'Support dynamic arbitrary values',
        repo_name: 'tailwindlabs/tailwindcss',
        issue_url: 'https://github.com/tailwindlabs/tailwindcss/issues/3',
        status: 'saved',
        created_at: offset(45)
      },
      {
        user_id: userId,
        issue_title: 'Add new theme settings',
        repo_name: 'microsoft/vscode',
        issue_url: 'https://github.com/microsoft/vscode/pull/4',
        status: 'saved',
        created_at: offset(55)
      }
    ]

    const { error } = await supabase
      .from('saved_issues')
      .insert(demoIssues)

    if (error) {
      console.error('[user] Seed demo failed:', error.message)
      return res.status(500).json({ error: 'Failed to seed demo data' })
    }

    return res.json({ success: true, mode: 'demo' })
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

// ── DELETE /api/user/issues/:id ──────────────────────────────────────────────

router.delete('/issues/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id
    const issueId = req.params.id

    const { error } = await supabase
      .from('saved_issues')
      .delete()
      .eq('id', issueId)
      .eq('user_id', userId)

    if (error) {
      console.error('[user] DELETE issue failed:', error.message)
      return res.status(500).json({ error: 'Failed to delete issue' })
    }

    return res.json({ success: true })
  } catch (err) {
    console.error('[user] DELETE /issues/:id failed:', err.message)
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
