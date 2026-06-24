/**
 * github.js — GitHub GraphQL API client for FirstMerge backend.
 * Never let API failure crash the response — every function catches its own errors.
 */

import 'dotenv/config'
const GITHUB_TOKEN = process.env.GITHUB_TOKEN

const DEFAULT_HEADERS = {
  Authorization: `Bearer ${GITHUB_TOKEN}`,
  'Content-Type': 'application/json',
}

export async function ghGraphQL(query, variables = {}) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({ query, variables })
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`GitHub GraphQL ${res.status}: ${text.slice(0, 120)}`)
  }
  const json = await res.json()
  if (json.errors) {
    throw new Error(`GraphQL Error: ${json.errors[0].message}`)
  }
  return json.data
}

const LABEL_MAP = {
  'good-first-issue': 'good first issue',
  'help-wanted': 'help wanted',
  'beginner-friendly': 'beginner friendly',
  'hacktoberfest': 'hacktoberfest',
  'documentation': 'documentation',
  'bug': 'bug'
}

export async function searchIssues(language, skillLevel, labels = ['good-first-issue'], searchQuery = '') {
  try {
    const labelClauses = labels.map(l => {
      const mapped = LABEL_MAP[l] || l
      return `label:"${mapped}"`
    }).join(' ')

    const frameworks = {
      'react': 'React language:javascript',
      'vue': 'Vue language:javascript',
      'angular': 'Angular language:typescript',
      'svelte': 'Svelte language:javascript',
      'next.js': '"Next.js" language:typescript',
      'nuxt.js': '"Nuxt.js" language:javascript',
      'node.js': '"Node.js" language:javascript',
      'ember': 'Ember language:javascript'
    }

    const langLower = language.toLowerCase()
    const mappedLanguageQuery = frameworks[langLower] || `language:${language}`

    let q = `${labelClauses} ${mappedLanguageQuery} state:open is:public sort:created-desc`
    if (skillLevel?.toLowerCase() === 'beginner') q += ' -label:complexity:high'
    if (searchQuery) q += ` ${searchQuery}`

    const query = `
      query SearchIssues($query: String!, $first: Int!) {
        search(query: $query, type: ISSUE, first: $first) {
          issueCount
          nodes {
            ... on Issue {
              id
              title
              url
              createdAt
              comments { totalCount }
              number
              repository {
                nameWithOwner
                stargazerCount
                primaryLanguage { name }
              }
              labels(first: 10) {
                nodes { name }
              }
            }
          }
        }
      }
    `
    if (process.env.NODE_ENV !== 'production') {
      console.log('[issues] GraphQL query string:', query)
      console.log('[github] Search query being sent:', q)
    }

    const data = await ghGraphQL(query, { query: q, first: 30 })
    if (process.env.NODE_ENV !== 'production') {
      console.log('[issues] Raw GitHub response:', JSON.stringify(data?.search, null, 2).slice(0, 500))
      console.log('[github] Issues found:', data?.search?.issueCount)
    }

    const nodes = data?.search?.nodes || []

    return nodes.filter(issue => issue && issue.repository).map(issue => ({
      id: issue.id,
      title: issue.title,
      html_url: issue.url,
      repository_url: `https://api.github.com/repos/${issue.repository.nameWithOwner}`, // Format matches parseOwnerRepo
      created_at: issue.createdAt,
      comments: issue.comments?.totalCount || 0,
      number: issue.number,
      language: issue.repository.primaryLanguage?.name || language,
      stars: issue.repository.stargazerCount,
      labels: issue.labels?.nodes?.map(n => n.name) || []
    }))
  } catch (err) {
    console.error('[github.searchIssues] failed:', err.message)
    return []
  }
}

export async function getRepoPRs(owner, name, first = 50) {
  try {
    const query = `
      query GetRepoPRs($owner: String!, $name: String!, $first: Int!) {
        repository(owner: $owner, name: $name) {
          pullRequests(states: [MERGED, CLOSED], first: $first, orderBy: { field: UPDATED_AT, direction: DESC }) {
            nodes {
              mergedAt
              createdAt
              author { login }
              number
            }
          }
        }
      }
    `
    const data = await ghGraphQL(query, { owner, name, first })
    const nodes = data?.repository?.pullRequests?.nodes || []
    return nodes.map(pr => ({
      merged_at: pr.mergedAt,
      created_at: pr.createdAt,
      user: pr.author?.login,
      title: '', // not needed for score but PR service might need it if we added title
    }))
  } catch (err) {
    console.error(`[github.getRepoPRs] ${owner}/${name} failed:`, err.message)
    return []
  }
}

export async function getRepoIssues(owner, name, first = 20) {
  try {
    const query = `
      query GetRepoIssues($owner: String!, $name: String!, $first: Int!) {
        repository(owner: $owner, name: $name) {
          issues(states: [CLOSED], first: $first, orderBy: { field: UPDATED_AT, direction: DESC }) {
            nodes {
              createdAt
              closedAt
              comments { totalCount }
            }
          }
        }
      }
    `
    const data = await ghGraphQL(query, { owner, name, first })
    const nodes = data?.repository?.issues?.nodes || []
    return nodes.map(issue => ({
      created_at: issue.createdAt,
      closed_at: issue.closedAt,
      comments: issue.comments?.totalCount || 0
    }))
  } catch (err) {
    console.error(`[github.getRepoIssues] ${owner}/${name} failed:`, err.message)
    return []
  }
}

export async function getIssueOpenPRs(owner, name, issueNumber) {
  try {
    const query = `
      query GetOpenPRs($owner: String!, $name: String!, $first: Int!) {
        repository(owner: $owner, name: $name) {
          pullRequests(states: [OPEN], first: $first) {
            nodes {
              title
              body
              number
            }
          }
        }
      }
    `
    const data = await ghGraphQL(query, { owner, name, first: 50 })
    const nodes = data?.repository?.pullRequests?.nodes || []
    const pattern = new RegExp(`#${issueNumber}\\b`, 'i')
    return nodes.filter(pr => 
      pattern.test(pr.title || '') || pattern.test(pr.body || '')
    ).length
  } catch (err) {
    console.error(`[github.getIssueOpenPRs] ${owner}/${name}#${issueNumber} failed:`, err.message)
    return 0
  }
}

export async function getRepoStats(owner, name) {
  try {
    const query = `
      query GetRepoStats($owner: String!, $name: String!) {
        repository(owner: $owner, name: $name) {
          stargazerCount
          pushedAt
          issues(states: [OPEN]) { totalCount }
        }
      }
    `
    const data = await ghGraphQL(query, { owner, name })
    const repo = data?.repository
    if (!repo) return null
    return {
      stars: repo.stargazerCount,
      pushedAt: repo.pushedAt,
      openIssuesCount: repo.issues?.totalCount || 0
    }
  } catch (err) {
    console.error(`[github.getRepoStats] ${owner}/${name} failed:`, err.message)
    return null
  }
}

export async function getCombinedRepoAndIssueData(owner, name, issueNumber) {
  try {
    const query = `
      query GetRepoScoreAndLivenessData($owner: String!, $name: String!, $firstIssues: Int!, $firstPRs: Int!, $firstOpenPRs: Int!) {
        repository(owner: $owner, name: $name) {
          stargazerCount
          pushedAt
          openIssuesTotal: issues(states: [OPEN]) { totalCount }
          pullRequests(states: [MERGED, CLOSED], first: $firstPRs, orderBy: { field: UPDATED_AT, direction: DESC }) {
            nodes { mergedAt, createdAt, author { login }, number, title, body }
          }
          issues(states: [CLOSED], first: $firstIssues, orderBy: { field: UPDATED_AT, direction: DESC }) {
            nodes { createdAt, closedAt, comments { totalCount } }
          }
          openPullRequests: pullRequests(states: [OPEN], first: $firstOpenPRs) {
            nodes { title, body, number }
          }
        }
      }
    `
    const data = await ghGraphQL(query, { owner, name, firstIssues: 20, firstPRs: 50, firstOpenPRs: 50 })
    const repo = data?.repository
    if (!repo) return null

    const closedPRs = (repo.pullRequests?.nodes || []).map(pr => ({
      merged_at: pr.mergedAt,
      created_at: pr.createdAt,
      user: pr.author?.login
    }))

    const closedIssues = (repo.issues?.nodes || []).map(issue => ({
      created_at: issue.createdAt,
      closed_at: issue.closedAt,
      comments: issue.comments?.totalCount
    }))

    const pattern = new RegExp(`#${issueNumber}\\b`, 'i')
    const openPRCount = (repo.openPullRequests?.nodes || []).filter(pr => 
      pattern.test(pr.title || '') || pattern.test(pr.body || '')
    ).length
    
    const mergedPRCount = (repo.pullRequests?.nodes || []).filter(pr => 
      pr.mergedAt && (pattern.test(pr.title || '') || pattern.test(pr.body || ''))
    ).length

    const repoStats = {
      stars: repo.stargazerCount,
      pushedAt: repo.pushedAt,
      openIssuesCount: repo.openIssuesTotal?.totalCount || 0
    }

    return { closedPRs, closedIssues, openPRCount, mergedPRCount, repoStats }
  } catch (err) {
    console.error(`[github.getCombined] ${owner}/${name} failed:`, err.message)
    return null
  }
}

export async function getContributing(owner, name) {
  try {
    const query = `
      query GetContributing($owner: String!, $name: String!) {
        repository(owner: $owner, name: $name) {
          contributing: object(expression: "HEAD:CONTRIBUTING.md") {
            ... on Blob { text }
          }
          readme: object(expression: "HEAD:README.md") {
            ... on Blob { text }
          }
        }
      }
    `
    const data = await ghGraphQL(query, { owner, name })
    return data?.repository?.contributing?.text || null
  } catch (err) {
    console.error(`[github.getContributing] ${owner}/${name} failed:`, err.message)
    return null
  }
}

export async function getUserProfile(username) {
  try {
    const query = `
      query($username: String!) {
        user(login: $username) {
          avatarUrl
          name
          login
          followers { totalCount }
          repositories(privacy: PUBLIC) { totalCount }
        }
      }
    `
    const data = await ghGraphQL(query, { username })
    const u = data?.user
    return {
      avatar_url: u.avatarUrl,
      name: u.name,
      login: u.login,
      followers: u.followers?.totalCount || 0,
      public_repos: u.repositories?.totalCount || 0,
    }
  } catch (err) {
    console.error(`[github.getUserProfile] ${username} failed:`, err.message)
    return null
  }
}

export async function getUserActivity(username) {
  try {
    const repoQuery = `
      query($username: String!) {
        user(login: $username) {
          repositories(first: 100, ownerAffiliations: OWNER, orderBy: {field: PUSHED_AT, direction: DESC}) {
            nodes {
              languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
                edges { size node { name } }
              }
            }
          }
          repositoriesContributedTo(first: 10, contributionTypes: [COMMIT, PULL_REQUEST], orderBy: {field: STARGAZERS, direction: DESC}) {
            nodes { nameWithOwner description url stargazerCount }
          }
          pullRequests(first: 1) { totalCount }
          issues(first: 1, states: [CLOSED]) { totalCount }
        }
      }
    `
    const data = await ghGraphQL(repoQuery, { username })
    
    const languages = {}
    let totalSize = 0
    const ownedNodes = data?.user?.repositories?.nodes || []
    ownedNodes.forEach(repo => {
      repo.languages?.edges?.forEach(edge => {
        languages[edge.node.name] = (languages[edge.node.name] || 0) + edge.size
        totalSize += edge.size
      })
    })

    const topRepos = (data?.user?.repositoriesContributedTo?.nodes || []).slice(0, 3).map(r => ({
      name: r.nameWithOwner,
      url: r.url,
      stars: r.stargazerCount || 0,
      description: r.description
    }))

    const sortedLanguages = Object.entries(languages)
      .sort((a, b) => b[1] - a[1])
      .map(([lang, size]) => ({ 
        lang, 
        percentage: totalSize > 0 ? ((size / totalSize) * 100).toFixed(1) : 0 
      }))

    const totalPRs = data?.user?.pullRequests?.totalCount || 0
    const totalIssuesClosed = data?.user?.issues?.totalCount || 0

    const currentYear = new Date().getFullYear();
    const fromDate = new Date(Date.UTC(currentYear, 0, 1)).toISOString();
    const toDate = new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59)).toISOString();

    const heatQuery = `
      query($username: String!, $from: DateTime!, $to: DateTime!) {
        user(login: $username) {
          contributionsCollection(from: $from, to: $to) {
            totalCommitContributions
            totalIssueContributions
            totalPullRequestContributions
            totalPullRequestReviewContributions
            contributionCalendar {
              weeks { contributionDays { contributionCount date } }
            }
          }
        }
      }
    `
    const hData = await ghGraphQL(heatQuery, { username, from: fromDate, to: toDate })
    const coll = hData?.user?.contributionsCollection || {}
    const weeks = coll.contributionCalendar?.weeks || []
    
    const contributionSplit = [
      { name: 'Commits', value: coll.totalCommitContributions || 0, color: 'var(--accent-green)' },
      { name: 'PRs', value: coll.totalPullRequestContributions || 0, color: 'var(--accent-blue)' },
      { name: 'Issues', value: coll.totalIssueContributions || 0, color: 'var(--accent-amber)' },
      { name: 'Reviews', value: coll.totalPullRequestReviewContributions || 0, color: 'var(--accent-purple)' }
    ].filter(item => item.value > 0)
    
    const dayMap = {}
    weeks.forEach(week => {
      week.contributionDays.forEach(day => {
        dayMap[day.date] = day.contributionCount
      })
    })

    const isLeap = currentYear % 4 === 0 && (currentYear % 100 !== 0 || currentYear % 400 === 0);
    const daysInMonth = [31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    
    const heatmap = []
    for (let m = 0; m < 12; m++) {
      for (let d = 1; d <= daysInMonth[m]; d++) {
        const dateStr = `${currentYear}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        heatmap.push({
          date: dateStr,
          count: dayMap[dateStr] || 0
        })
      }
    }

    const todayStr = new Date().toISOString().slice(0, 10)
    const todayIndex = heatmap.findIndex(d => d.date === todayStr)
    const recentActivity = todayIndex !== -1 
      ? heatmap.slice(Math.max(0, todayIndex - 13), todayIndex + 1)
      : heatmap.slice(-14)

    return {
      languages: sortedLanguages,
      totalPRs,
      totalIssuesClosed,
      heatmap,
      recentActivity,
      contributionSplit,
      topRepos
    }
  } catch (err) {
    console.error(`[github.getUserActivity] ${username} failed:`, err.message)
    return null
  }
}
