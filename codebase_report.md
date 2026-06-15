# MergeMate Codebase Report

This document provides a comprehensive overview of the MergeMate codebase structure, technologies, and core modules.

## 1. High-Level Overview

**MergeMate** is an open-source contribution platform designed to help beginners and developers find suitable repositories to enhance their CVs and skills. 

The project follows a standard modern web application architecture:
- **Frontend**: A React single-page application built with Vite and TailwindCSS.
- **Backend**: A Node.js/Express REST API serving as the intermediary between the frontend, Supabase, and external services (like GitHub).
- **Database/Cache**: Supabase (PostgreSQL) is used heavily for caching responses (e.g., repository friendliness scores, issue liveness) to prevent API rate-limit exhaustion.

---

## 2. Technology Stack

### Backend Stack
- **Framework**: Express.js (Node.js)
- **Database / BaaS**: Supabase (`@supabase/supabase-js`)
- **AI Integration**: Google GenAI (`@google/genai`) for potential issue summarization or PR checking.
- **External APIs**: GitHub REST API and GraphQL API for fetching issues, repository stats, and pull requests.
- **Utilities**: `dotenv` for environment variable management, `cors` for cross-origin requests.

### Frontend Stack
- **Framework**: React 19 (`react`, `react-dom`)
- **Build Tool**: Vite
- **Routing**: React Router DOM v7 (`react-router-dom`)
- **Styling**: TailwindCSS v4 with Vite integration.
- **Data Visualization**: Recharts (`recharts`)
- **Additional Utilities**: `canvas-confetti` (for gamification/success states), `html2canvas`.
- **Database SDK**: Supabase Client (`@supabase/supabase-js`)

---

## 3. Directory Structure

```text
d:\mergemate\
├── backend/                # Node.js Express API
│   ├── routes/             # API Endpoint Definitions
│   ├── services/           # Core Business Logic & External API Calls
│   ├── index.js            # Express server entry point
│   └── package.json        # Backend dependencies
├── frontend/               # React Client
│   ├── public/             # Static assets
│   ├── src/                # React Source Code
│   │   ├── components/     # Reusable UI elements
│   │   ├── hooks/          # Custom React hooks (e.g., useIssues)
│   │   ├── lib/            # Library integrations (e.g., github SDK wrapper)
│   │   ├── pages/          # Full page views
│   │   ├── App.jsx         # Root component and router configuration
│   │   └── main.jsx        # React DOM render entry
│   ├── package.json        # Frontend dependencies
│   └── vite.config.js      # Vite build configuration
```

---

## 4. Backend Deep Dive

### API Routes (`backend/routes/`)
- **`issues.js`**: Handles searching and returning enriched beginner-friendly GitHub issues. It fetches from GitHub, filters by repository stars, deduplicates, and enriches results with friendliness and liveness scores. Heavily cached.
- **`repos.js`**: Manages repository-specific requests and data retrieval.
- **`user.js`**: Likely handles user profiles, preferences, and authentication callbacks.
- **`prcheck.js`**: An endpoint for verifying Pull Requests.
- **`issueDetails.js`**: Fetches in-depth information about a specific issue.
- **`liveness.js`**: Checks if an issue is still active or if it has been abandoned.

### Core Services (`backend/services/`)
- **`friendlinessScore.js`**: Computes a repository's beginner-friendliness score (0-100) based on maintainer response time, beginner PR merge rate, issue freshness, and PR collision count. Includes tiered scoring and hard caps based on stars and open issues.
- **`livenessCheck.js`**: Analyzes specific issues to determine if they are still "alive" and worth a beginner's time (checking for stale dates, locked statuses, or linked PRs).
- **`github.js` & `githubPRService.js`**: Wrappers for the GitHub API (REST and GraphQL) to fetch repos, stats, issues, and PRs securely.
- **`geminiService.js`**: Interfaces with Google's GenAI for AI-assisted features.
- **`cacheWarmer.js`**: Background job/service to pre-fetch and cache data in Supabase so the user experience remains fast.

---

## 5. Frontend Deep Dive

### Pages (`frontend/src/pages/`)
- **`Home.jsx`**: The landing page of MergeMate.
- **`Explore.jsx`**: The main discovery feed where users browse beginner-friendly issues.
- **`Dashboard.jsx`**: User-specific dashboard tracking their contributions and skills.
- **`IssueDetail.jsx`**: A dedicated view for examining a single issue, its requirements, and repo context.
- **`Onboarding.jsx`**: Walkthrough for new users to set up their skills, languages, and preferences.
- **`PRCheck.jsx`**: Interface allowing users to check the status or validity of their Pull Requests.

### Components (`frontend/src/components/`)
- **`FilterSidebar.jsx`**: Allows users to filter issues by language, labels, or skill level in the Explore view.
- **`IssueCard.jsx`**: Displays a summary of an issue in the feed.
- **`FriendlinessScore.jsx` & `ScoreRing.jsx`**: UI components that visually display the computed 0-100 friendliness score.
- **`LivenessCheck.jsx`**: Visual indicator of whether an issue is active or stale.
- **`SkillBadge.jsx`**: UI badges representing languages or tools.
- **`Navbar.jsx` & `CustomCursor.jsx`**: Layout and UX enhancements.

### Hooks (`frontend/src/hooks/`)
- **`useIssues.js`**: Custom hook for fetching, caching, and paginating issue data from the backend.

---

## 6. Core Features

Based on the modules and components, the primary features of MergeMate include:
- **Smart Issue Discovery**: A searchable feed of open-source issues tailored for beginners, filterable by language, labels, and skill levels.
- **Repository Friendliness Scoring**: An algorithmic 0-100 score given to repositories based on maintainer responsiveness, beginner PR merge rates, and issue freshness.
- **Liveness Verification**: Ensures beginners aren't wasting time on dead or overly competitive issues by checking if there are already multiple open PRs attached.
- **PR Status Checker**: A dedicated tool for users to check the status or validity of their Pull Requests.
- **Gamified Dashboard**: Tracks user contributions and displays "Skill Badges" and gamified success states to keep users motivated.
- **Personalized Onboarding**: A setup flow for users to define their tech stack so they receive relevant issue recommendations.

---

## 7. Key Mechanisms & Architecture Notes

1.  **Heavy Caching Strategy**: Because GitHub's API has strict rate limits, MergeMate uses Supabase as a caching layer. The `friendlinessScore.js` and `issues.js` extensively read from `repo_scores` and `issues_cache` tables to serve requests quickly.
2.  **Tiered Quality Control**: The platform is highly protective of beginners' time. It filters out projects with fewer than 10 stars and penalizes repositories that have massive backlogs (>500 issues) or haven't merged a beginner PR recently.
3.  **Liveness Verification**: Before an issue is recommended, `livenessCheck.js` ensures that there aren't already 5 open PRs trying to solve it, preventing beginners from doing duplicate work.

---
*Generated by Antigravity IDE.*
