# FirstMerge — Project Instructions

## What We're Building
FirstMerge is a web app that helps CS students make open source contributions 
that actually get merged. Not just finding issues — guiding them through the 
entire contribution process.

## Core Tagline
"Your first open source contribution — one that actually gets merged."

## Tech Stack
- Frontend: React + Vite + Tailwind CSS v4 + React Router + Recharts
- Backend: Node.js + Express (ES Modules — always use import/export, never require)
- Database + Auth: Supabase (Postgres + GitHub OAuth)
- AI: Gemini API (for PR check and issue analysis)
- GitHub Data: GitHub REST + GraphQL API
- Hosting: Vercel (frontend) + Railway (backend)

## Design System
- Background: #0a0a0a
- Card background: #161b22
- Border color: #30363d
- Primary accent: #238636 (GitHub green)
- Text primary: #f0f6fc
- Text secondary: #8b949e
- Error/danger: #f85149
- Font: Space Mono for code elements, DM Sans for body text
- Border radius: 8px
- Feel: GitHub dark mode aesthetic — premium developer tool

## Key Rules — Always Follow
- Always write complete files, never partial snippets
- Always use ES module syntax (import/export) — never require()
- Always write modular components — one feature per file
- Never break existing functionality when adding new features
- Always use Tailwind classes — never inline styles
- Always refer to .cline/skills/frontend.md before writing any UI code
- Backend always validates Supabase JWT before accessing user data
- All GitHub API responses cached in Supabase with cached_at timestamp
- Never use in-memory caching — it dies on Railway restarts

## Folder Structure
frontend/src/components/ — reusable UI components
frontend/src/pages/      — full page components
frontend/src/lib/        — api clients and utilities  
frontend/src/hooks/      — custom React hooks
backend/routes/          — Express route handlers
backend/services/        — business logic and algorithms
backend/middleware/       — auth and validation

## Environment Variables
Frontend (.env):
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_BACKEND_URL=http://localhost:3000

Backend (.env):
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
GITHUB_TOKEN=
GEMINI_API_KEY=
PORT=3000

## Supabase Tables
- users: id, github_id, username, avatar_url, languages[], skill_level, interests[], created_at
- saved_issues: id, user_id, issue_url, issue_title, repo_name, status, created_at
- repo_scores: repo_full_name, friendliness_score, response_time_hrs, beginner_merge_rate, last_updated
- issue_liveness: issue_id, repo_full_name, open_pr_count, last_comment_date, cached_at 