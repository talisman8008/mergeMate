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

import { GoogleGenAI } from '@google/genai'

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
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in environment variables')
  }

  // Initialize SDK inside the function to ensure process.env is loaded
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

  const prompt = mode === 'after'
    ? buildAfterPrompt({ issueTitle, issueBody, contributing, recentClosedPRs, diff })
    : buildBeforePrompt({ issueTitle, issueBody, contributing, recentClosedPRs })

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: prompt,
    })

    const rawText = response.text

    if (!rawText) {
      throw new Error('Gemini returned an empty response')
    }

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