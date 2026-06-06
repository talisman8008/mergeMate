/**
 * githubPRService.js — GitHub API calls for PR check and issue analysis.
 */

import { getRepoPRs } from './github.js'

const BASE_URL = 'https://api.github.com'

const directHeaders = {
  Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
  Accept: 'application/vnd.github.v3+json',
}

async function directFetch(path) {
  const url = `${BASE_URL}${path}`
  const res = await fetch(url, { headers: directHeaders })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`GitHub ${res.status} ${res.statusText}: ${text.slice(0, 120)}`)
  }
  return res.json()
}

function parseLinkedIssueNumber(body) {
  if (!body) return null
  const match = body.match(/(?:fix(?:es)?|close[sd]?|resolve[sd]?)\s+#(\d+)/i)
  return match ? parseInt(match[1], 10) : null
}

async function fetchContributing(owner, repo) {
  try {
    const data = await directFetch(`/repos/${owner}/${repo}/contents/CONTRIBUTING.md`)
    if (data?.content) {
      return Buffer.from(data.content, 'base64').toString('utf-8')
    }
    return null
  } catch (err) {
    if (err.message.includes('404')) return null
    return null
  }
}

async function fetchRecentClosedPRs(owner, repo) {
  try {
    const prs = await getRepoPRs(owner, repo, 'closed', 5)
    return prs.map((pr) => ({
      title: pr.title || '',
      merged: pr.merged_at !== null,
    }))
  } catch (err) {
    return []
  }
}

export async function fetchPRData({ owner, repo, prNumber }) {
  const files = await directFetch(`/repos/${owner}/${repo}/pulls/${prNumber}/files`)
  const diff = Array.isArray(files)
    ? files.map((f) => f.patch || '').filter(Boolean).join('\n\n')
    : ''

  const prDetail = await directFetch(`/repos/${owner}/${repo}/pulls/${prNumber}`)
  const issueNumber = parseLinkedIssueNumber(prDetail?.body)

  let issueTitle = prDetail?.title || 'No linked issue found'
  let issueBody = prDetail?.body || ''

  if (issueNumber) {
    try {
      const issueData = await directFetch(`/repos/${owner}/${repo}/issues/${issueNumber}`)
      issueTitle = issueData.title
      issueBody = issueData.body || ''
    } catch (err) {
      console.warn('[githubPRService] Could not fetch linked issue:', err.message)
    }
  }

  const contributing = await fetchContributing(owner, repo)
  const recentClosedPRs = await fetchRecentClosedPRs(owner, repo)

  return { diff, issueTitle, issueBody, contributing, recentClosedPRs, issueNumber }
}

export async function fetchIssueData({ owner, repo, issueNumber }) {
  const issueData = await directFetch(`/repos/${owner}/${repo}/issues/${issueNumber}`)
  const issueTitle = issueData.title
  const issueBody = issueData.body || ''

  const contributing = await fetchContributing(owner, repo)
  const recentClosedPRs = await fetchRecentClosedPRs(owner, repo)

  return { issueTitle, issueBody, contributing, recentClosedPRs }
}