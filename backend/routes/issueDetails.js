import { Router } from 'express'
import { getRepoPRs } from '../services/github.js'

const router = Router()

const BASE_URL = 'https://api.github.com'

const getHeaders = () => ({
  Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
  Accept: 'application/vnd.github.v3+json',
})

async function directFetch(path) {
  const url = `${BASE_URL}${path}`
  const res = await fetch(url, { headers: getHeaders() })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const err = new Error(`GitHub ${res.status} ${res.statusText}: ${text.slice(0, 120)}`)
    err.status = res.status
    throw err
  }
  return res.json()
}

router.get('/:owner/:repo/:issueNumber', async (req, res) => {
  const { owner, repo, issueNumber } = req.params

  try {
    // Concurrently fetch issue details and repo details
    const [issueData, repoData] = await Promise.all([
      directFetch(`/repos/${owner}/${repo}/issues/${issueNumber}`),
      directFetch(`/repos/${owner}/${repo}`)
    ])

    // Fetch the last commit on the default branch
    let lastCommitDate = null
    try {
      const branchName = repoData.default_branch || 'main'
      const commitData = await directFetch(`/repos/${owner}/${repo}/commits/${branchName}`)
      lastCommitDate = commitData.commit?.committer?.date || null
    } catch (commitErr) {
      console.warn('[issueDetails] Failed to fetch last commit:', commitErr.message)
    }

    return res.json({
      data: {
        issue: {
          title: issueData.title,
          body: issueData.body,
          html_url: issueData.html_url,
          created_at: issueData.created_at,
          author: issueData.user?.login,
          author_avatar: issueData.user?.avatar_url,
        },
        repo: {
          name: `${owner}/${repo}`,
          default_branch: repoData.default_branch,
          last_commit_date: lastCommitDate,
          created_at: repoData.created_at,
        }
      },
      error: null
    })

  } catch (err) {
    console.error('[issueDetails] GET failed:', err.message)
    return res.status(err.status || 500).json({ data: null, error: err.message })
  }
})

export default router
