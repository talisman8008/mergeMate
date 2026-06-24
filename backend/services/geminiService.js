/**
 * geminiService.js — Gemini AI analysis for PR contributions.
 *
 * Uses the official @google/genai SDK which properly supports the newer
 * API key formats (like AQ...) that raw fetch cannot handle easily.
 *
 * Exports a single function that analyses a contributor's work in two modes:
 *   • "before" — pre-code guidance (what to build, files to touch, pitfalls)
 *   • "after"  — post-PR verdict   (genuine vs trivial, reason, suggestion)
 */

const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
].filter(Boolean)

const FEATHERLESS_KEY = process.env.FEATHERLESS_API_KEY

async function tryGemini(prompt) {
  for (const key of GEMINI_KEYS) {
    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[ai] Trying Gemini key ${GEMINI_KEYS.indexOf(key) + 1}`)
      }
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      )

      if (response.status === 429) {
        console.warn(`[ai] Gemini key ${GEMINI_KEYS.indexOf(key) + 1} quota exceeded`)
        continue
      }

      if (response.status === 401 || response.status === 403) {
        console.warn(`[ai] Gemini key ${GEMINI_KEYS.indexOf(key) + 1} auth failed`)
        continue
      }

      if (!response.ok) {
        const err = await response.text()
        throw new Error(`Gemini ${response.status}: ${err.slice(0, 100)}`)
      }

      const data = await response.json()
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) throw new Error('Empty Gemini response')
      
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[ai] Gemini key ${GEMINI_KEYS.indexOf(key) + 1} succeeded`)
      }
      return text

    } catch (err) {
      if (err.message.includes('429') || err.message.includes('quota')) {
        continue
      }
      throw err
    }
  }
  return null // all Gemini keys exhausted
}

async function tryFeatherless(prompt) {
  if (!FEATHERLESS_KEY) return null
  
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[ai] Trying Featherless fallback')
    }
    
    const response = await fetch(
      'https://api.featherless.ai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FEATHERLESS_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'Qwen/Qwen2.5-72B-Instruct',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 800,
          temperature: 0.3
        })
      }
    )

    if (!response.ok) {
      const err = await response.text()
      console.warn('[ai] Featherless failed:', err.slice(0, 100))
      return null
    }

    const data = await response.json()
    const text = data?.choices?.[0]?.message?.content
    if (!text) return null
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('[ai] Featherless succeeded')
    }
    return text

  } catch (err) {
    console.warn('[ai] Featherless error:', err.message)
    return null
  }
}

async function aiRequest(prompt) {
  // Try Gemini first with rotation
  const geminiResult = await tryGemini(prompt)
  if (geminiResult) return geminiResult
  
  // Fallback to Featherless
  const featherlessResult = await tryFeatherless(prompt)
  if (featherlessResult) return featherlessResult
  
  throw new Error(
    'All AI providers exhausted — try again later or add more API keys'
  )
}

// ── Prompt builders ───────────────────────────────────────────────────────────

function buildAfterPrompt({ issueTitle, issueBody, contributing, recentClosedPRs, diff }) {
  const prList = recentClosedPRs
    .map((pr) => `- "${pr.title}" (${pr.merged ? 'merged' : 'closed without merge'})`)
    .join('\n')

  const MAX_LEN = 4000
  const safeTitle = (issueTitle || '').slice(0, 200)
  const safeBody = (issueBody || '').slice(0, MAX_LEN)
  const safeDiff = (diff || '').slice(0, MAX_LEN)
  const safeContributing = (contributing || '').slice(0, 1000)

  return `You are a senior open-source maintainer reviewing a pull request.

ISSUE TITLE: <issue_title>${safeTitle}</issue_title>
ISSUE BODY: <issue_body>${safeBody}</issue_body>

CONTRIBUTING GUIDELINES:
<contributing>${safeContributing || 'No CONTRIBUTING.md found'}</contributing>

RECENT CLOSED PRs:
${prList || 'None available'}

PR DIFF:
<diff>${safeDiff}</diff>

Analyse this PR diff against the issue it claims to fix.
Return ONLY a JSON object with no markdown, no preamble, no explanation:
{
  "verdict": "GENUINE" or "TRIVIAL",
  "reason": "one sentence max",
  "suggestion": "specific actionable next step"
}`
}

function buildBeforePrompt({ issueTitle, issueBody, contributing, recentClosedPRs }) {
  const prList = recentClosedPRs
    .map((pr) => `- "${pr.title}" (${pr.merged ? 'merged' : 'closed without merge'})`)
    .join('\n')

  return `You are a senior open-source mentor helping a first-time contributor understand an issue before they write code.

ISSUE TITLE: ${issueTitle}
ISSUE BODY: ${issueBody}

CONTRIBUTING GUIDELINES:
${contributing || 'No CONTRIBUTING.md found'}

RECENT CLOSED PRs:
${prList || 'None available'}

Based on the above, return ONLY a JSON object with no markdown, no preamble, no explanation:
{
  "whatToBuild": "plain English explanation of what the maintainer actually wants",
  "filesToTouch": "which files are likely involved based on the issue",
  "whatToAvoid": "based on recently rejected PRs, what not to do",
  "difficulty": "Easy" or "Medium" or "Hard",
  "estimatedTime": "e.g., 4 hours or 2 days",
  "roadmap": [
    {
      "step": "Day 1 (or Step 1)",
      "title": "Setup and Investigation",
      "description": "..."
    }
  ]
}`
}

// ── Strip markdown code fences ────────────────────────────────────────────────

function stripCodeFences(text) {
  let cleaned = text.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
  }
  return cleaned.trim()
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Analyse a contribution using Gemini AI.
 *
 * @param {object} params
 * @param {string} params.issueTitle
 * @param {string} params.issueBody
 * @param {string|null} params.contributing
 * @param {Array<{title: string, merged: boolean}>} params.recentClosedPRs
 * @param {string|null} params.diff
 * @param {"before"|"after"} params.mode
 * @returns {Promise<object>} Parsed JSON from Gemini
 */
export async function analyzeContribution({ issueTitle, issueBody, contributing, recentClosedPRs, diff, mode }) {
  const prompt = mode === 'after'
    ? buildAfterPrompt({ issueTitle, issueBody, contributing, recentClosedPRs, diff })
    : buildBeforePrompt({ issueTitle, issueBody, contributing, recentClosedPRs })

  try {
    const rawText = await aiRequest(prompt)

    const cleanedText = stripCodeFences(rawText)

    try {
      return JSON.parse(cleanedText)
    } catch (parseErr) {
      console.error('[geminiService] Failed to parse Gemini JSON:', cleanedText.slice(0, 300))
      throw new Error(`Gemini response was not valid JSON: ${parseErr.message}`)
    }
  } catch (err) {
    console.error('[geminiService] analyzeContribution failed:', err.message)
    throw err
  }
}