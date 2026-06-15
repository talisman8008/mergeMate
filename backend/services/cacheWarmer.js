/**
 * cacheWarmer.js — Warm up the Supabase issues_cache before demo day.
 * 
 * Usage:
 * node -e "import('./services/cacheWarmer.js').then(m => m.warmCache(['JavaScript','Python','TypeScript'], ['beginner','intermediate']))"
 */

export async function warmCache(languages, skillLevels) {
  console.log('[warmer] Starting cache warmup...')
  const backendUrl = process.env.VITE_BACKEND_URL || 'http://localhost:3000'

  for (const language of languages) {
    for (const skillLevel of skillLevels) {
      console.log(`[warmer] Warming ${language}/${skillLevel}...`)
      try {
        const url = `${backendUrl}/api/issues?language=${encodeURIComponent(language)}&skillLevel=${encodeURIComponent(skillLevel)}&page=1`
        const response = await fetch(url)
        
        if (!response.ok) {
          console.error(`[warmer] Error warming ${language}/${skillLevel}: HTTP ${response.status}`)
          continue
        }

        const json = await response.json()
        if (json.error) {
          console.error(`[warmer] API error for ${language}/${skillLevel}:`, json.error)
        } else {
          console.log(`[warmer] Successfully warmed ${language}/${skillLevel} (${json.data?.length || 0} issues).`)
        }
      } catch (err) {
        console.error(`[warmer] Request failed for ${language}/${skillLevel}:`, err.message)
      }
    }
  }
  
  console.log('[warmer] Cache warmup complete!')
}
