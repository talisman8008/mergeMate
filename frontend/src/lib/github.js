/**
 * lib/github.js
 * Frontend wrapper for backend API calls.
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

/**
 * Fetch enriched issues from the backend.
 * @param {string} language
 * @param {string} skillLevel
 * @param {string[]} labels
 */
export async function fetchIssues(language, skillLevel, page, labels = ['good-first-issue'], searchQuery = '', minScore = 0) {
  try {
    const params = new URLSearchParams({
      language,
      skillLevel,
      page: String(page),
      labels: labels.join(','),
      searchQuery,
      minScore: String(minScore)
    })
    
    const res = await fetch(`${BACKEND_URL}/api/issues?${params}`)
    if (!res.ok) {
      throw new Error(`API returned status: ${res.status}`)
    }
    
    const data = await res.json()
    return data
  } catch (err) {
    console.error('[lib/github.js] fetchIssues failed:', err)
    return { data: [], error: err.message, cached: false }
  }
}

/**
 * Fetch score for a specific repo from the backend.
 * @param {string} owner
 * @param {string} repo
 */
export async function fetchRepoScore(owner, repo) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/repos/${owner}/${repo}/score`)
    if (!res.ok) {
      throw new Error(`API returned status: ${res.status}`)
    }
    return await res.json()
  } catch (err) {
    console.error('[lib/github.js] fetchRepoScore failed:', err)
    return { data: null, error: err.message, cached: false }
  }
}

/**
 * Fetch liveness for a specific issue from the backend.
 * @param {string} owner
 * @param {string} repo
 * @param {number} issueNumber
 */
export async function fetchLiveness(owner, repo, issueNumber) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/liveness/${owner}/${repo}/${issueNumber}`)
    if (!res.ok) {
      throw new Error(`API returned status: ${res.status}`)
    }
    return await res.json()
  } catch (err) {
    console.error('[lib/github.js] fetchLiveness failed:', err)
    return { data: null, error: err.message, cached: false }
  }
}
