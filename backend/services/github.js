/**
 * github.js — GitHub REST API client for FirstMerge backend.
 * Never let API failure crash the response — every function catches its own errors.
 */

import 'dotenv/config'
console.log('GitHub token:', process.env.GITHUB_TOKEN?.slice(0, 10))
const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const BASE_URL = 'https://api.github.com'

const DEFAULT_HEADERS = {
  Authorization: `Bearer ${GITHUB_TOKEN}`,
  Accept: 'application/vnd.github.v3+json',
}

// ── Internal fetch helper ─────────────────────────────────────────────────────

async function ghFetch(path, params = {}) {
  const url = new URL(`${BASE_URL}${path}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))
  const res = await fetch(url.toString(), { headers: DEFAULT_HEADERS })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`GitHub ${res.status} ${res.statusText}: ${text.slice(0, 120)}`)
  }
  return res.json()
}

// ── Exported functions ────────────────────────────────────────────────────────

/**
 * Search open "good first issue" issues for a language + skill level.
 * Never let API failure crash the response — returns [] on any error.
 */
export async function searchIssues(language, skillLevel, page = 1) {
  try {
    let q = `label:"good first issue" language:${language} state:open`
    if (skillLevel?.toLowerCase() === 'beginner') q += ' label:"good-first-issue" -label:complexity:high'

    const data = await ghFetch('/search/issues', {
      q,
      sort: 'created',
      order: 'desc',
      per_page: 30,
      page,
    })

    if (!Array.isArray(data?.items)) return []

    return data.items.map((issue) => ({
      id: issue.id,
      title: issue.title,
      html_url: issue.html_url,
      repository_url: issue.repository_url,
      created_at: issue.created_at,
      comments: issue.comments,
      number: issue.number,
      language: language,
    }))
  } catch (err) {
    console.error('[github.searchIssues] failed:', err.message)
    return []
  }
}

/**
 * Fetch closed/merged PRs for a repo (used for merge rate signal).
 * Never let API failure crash the response — returns [] on any error.
 */
export async function getRepoPRs(owner, repo, state = 'closed', perPage = 50) {
  try {
    const data = await ghFetch(`/repos/${owner}/${repo}/pulls`, {
      state,
      per_page: perPage,
      sort: 'updated',
      direction: 'desc',
    })

    if (!Array.isArray(data)) return []

    return data.map((pr) => ({
      merged_at: pr.merged_at ?? null,
      created_at: pr.created_at,
      user: pr.user?.login ?? null,
    }))
  } catch (err) {
    console.error(`[github.getRepoPRs] ${owner}/${repo} failed:`, err.message)
    return []
  }
}

/**
 * Fetch recently closed issues for a repo (used for response time signal).
 * Never let API failure crash the response — returns [] on any error.
 * Note: GitHub issues endpoint includes PRs — they are filtered out.
 */
export async function getRepoIssues(owner, repo, perPage = 20) {
  try {
    const data = await ghFetch(`/repos/${owner}/${repo}/issues`, {
      state: 'closed',
      per_page: perPage,
      sort: 'updated',
      direction: 'desc',
    })

    if (!Array.isArray(data)) return []

    return data
      .filter((item) => !item.pull_request) // exclude PRs returned by this endpoint
      .map((issue) => ({
        created_at: issue.created_at,
        closed_at: issue.closed_at,
        comments: issue.comments,
      }))
  } catch (err) {
    console.error(`[github.getRepoIssues] ${owner}/${repo} failed:`, err.message)
    return []
  }
}

/**
 * Count open PRs whose title or body references a specific issue number.
 * Never let API failure crash the response — returns 0 on any error.
 */
export async function getIssueOpenPRs(owner, repo, issueNumber) {
  try {
    const data = await ghFetch(`/repos/${owner}/${repo}/pulls`, {
      state: 'open',
      per_page: 50,
    })

    if (!Array.isArray(data)) return 0

    const pattern = new RegExp(`#${issueNumber}\\b`, 'i')
    return data.filter((pr) =>
      pattern.test(pr.title ?? '') || pattern.test(pr.body ?? ''),
    ).length
  } catch (err) {
    console.error(`[github.getIssueOpenPRs] ${owner}/${repo}#${issueNumber} failed:`, err.message)
    return 0
  }
}

/**
 * Get the repository data (language, stars).
 * Never let API failure crash the response — returns default object on any error.
 */
export async function getRepoData(owner, repo) {
  try {
    const data = await ghFetch(`/repos/${owner}/${repo}`)
    return {
      language: data?.language ?? null,
      stars: data?.stargazers_count ?? 0
    }
  } catch (err) {
    console.error(`[github.getRepoData] ${owner}/${repo} failed:`, err.message)
    return { language: null, stars: 0 }
  }
}
