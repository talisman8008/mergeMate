/**
 * geminiService.js — Gemini AI analysis for PR contributions.
 * Features automatic key rotation — if one key hits quota, tries the next.
 *
 * Exports a single function that analyses a contributor's work in two modes:
 *   • "before" — pre-code guidance (what to build, files to touch, pitfalls)
 *   • "after"  — post-PR verdict   (genuine vs trivial, reason, suggestion)
 */

// ── Key rotation pool ─────────────────────────────────────────────────────────

const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
].filter(Boolean)

if (GEMINI_KEYS.length === 0) {
  console.warn('[geminiService] No Gemini API keys found — set GEMINI_API_KEY_1, _2, _3 in .env')
}

// ── Internal request with key rotation ───────────────────────────────────────

async function geminiRequest(prompt) {
  if (GEMINI_KEYS.length === 0) {
    throw new Error('No Gemini API keys configured')
  }

  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    const key = GEMINI_KEYS[i]
    try {
      console.log(`[geminiService] Trying key ${i + 1} of ${GEMINI_KEYS.length}`)

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

      // Quota exceeded — try next key
      if (response.status === 429) {
        console.warn(`[geminiService] Key ${i + 1} quota exceeded, trying next...`)
        continue
      }

      // Auth error — skip this key
      if (response.status === 401 || response.status === 403) {
        console.warn(`[geminiService] Key ${i + 1} auth failed, trying next...`)
        continue
      }

      if (!response.ok) {
        const errBody = await response.text().catch(() => '')
        throw new Error(`Gemini API returned ${response.status}: ${errBody.slice(0, 200)}`)
      }

      const data = await response.json()
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text

      if (!rawText) {
        throw new Error('Gemini returned empty or unexpected response structure')
      }

      console.log(`[geminiService] Key ${i + 1} succeeded`)
      return rawText

    } catch (err) {
      // If it's a quota error string, try next key
      if (err.message.includes('429') || err.message.includes('quota')) {
        console.warn(`[geminiService] Key ${i + 1} failed with quota error, trying next...`)
        continue
      }
      // Any other error — throw immediately
      throw err
    }
  }

  throw new Error('All Gemini API keys exhausted — quota exceeded on all keys. Try again tomorrow or add more keys.')
}

// ── Strip markdown code fences ────────────────────────────────────────────────

function stripCodeFences(text) {
  let cleaned = text.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
  }
  return cleaned.trim()
}

// ── Prompt builders ───────────────────────────────────────────────────────────

function buildAfterPrompt({ issueTitle, issueBody, contributing, recentClosedPRs, diff }) {
  const prList = recentClosedPRs
    .map((pr) => `- "${pr.title}" (${pr.merged ? 'merged' : 'closed without merge'})`)
    .join('\n')

  return `You are a senior open-source maintainer reviewing a pull request.

ISSUE TITLE: ${issueTitle}
ISSUE BODY: ${issueBody}

CONTRIBUTING GUIDELINES:
${contributing || 'No CONTRIBUTING.md found'}

RECENT CLOSED PRs:
${prList || 'None available'}

PR DIFF:
${diff}

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
  "difficulty": "Easy" or "Medium" or "Hard"
}`
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
export async function analyzeContribution({
  issueTitle,
  issueBody,
  contributing,
  recentClosedPRs,
  diff,
  mode,
}) {
  const prompt = mode === 'after'
    ? buildAfterPrompt({ issueTitle, issueBody, contributing, recentClosedPRs, diff })
    : buildBeforePrompt({ issueTitle, issueBody, contributing, recentClosedPRs })

  const rawText = await geminiRequest(prompt)
  const cleanedText = stripCodeFences(rawText)

  try {
    return JSON.parse(cleanedText)
  } catch (parseErr) {
    console.error('[geminiService] Failed to parse Gemini JSON:', cleanedText.slice(0, 300))
    throw new Error(`Gemini response was not valid JSON: ${parseErr.message}`)
  }
}