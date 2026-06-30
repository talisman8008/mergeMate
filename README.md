# FirstMerge (formerly MergeMate)

FirstMerge is an intelligent open-source onboarding platform that helps beginners find their first open-source issues, evaluate repository friendliness, and generate AI-driven step-by-step roadmaps to solve bugs with confidence. It also includes a Chrome Extension for real-time PR analysis natively on GitHub.

## 🚀 Deployed Links
- **Web Platform:** [www.firstmerge.app/](https://www.firstmerge.app/) 
- **API Backend:** https://mergemate-production-59be.up.railway.app
- **Chrome Extension:** Load unpacked from the `/extension` directory.

## 💡 Key Features
1. **Curated Issue Discovery:** Automatically aggregates "good first issues" and beginner-friendly tasks across GitHub.
2. **Friendliness Score:** Dynamically scores repositories (0-100) based on maintainer response times, beginner PR merge rates, issue freshness, and PR collisions to ensure beginners only pick battles they can win.
3. **AI-Powered Roadmaps:** Generates a step-by-step, actionable checklist (via Gemini AI) to guide you through solving an issue before you even clone the repo.
4. **Chrome Extension Auto-Analysis:** Natively injects into GitHub's Pull Request page, analyzing your code and comparing it to the linked issue *before* you hit submit to ensure high quality.
5. **Personalized Dashboard:** Save issues, track your open-source journey, and share your contributor profile.

## 🛠️ Tech Stack

### Frontend Layer (Web App)
- **Framework:** React + Vite
- **Routing:** React Router
- **Styling:** Tailwind CSS / Vanilla CSS (Modern, dark-mode, glassmorphic UI)
- **Deployment:** Vercel

### Backend Layer (API)
- **Framework:** Express.js (Node.js)
- **Deployment:** Railway
- **Rate Limiting & Security:** Helmet, Express-Rate-Limit, CORS (locked to frontend domain), SSRF-safe URL parsing

### AI & Data Pipeline
- **AI Integration:** Google Gemini API (with 3-key rotation & XML sanitization)
- **GitHub Integration:** GitHub REST API & GraphQL API (batched queries)
- **Database & Cache:** Supabase (PostgreSQL) for 1-hour issue caching and 2-hour Repo Score caching
- **Authentication:** Supabase GitHub OAuth (JWT)

### Chrome Extension
- **Environment:** Manifest V3
- **Injection:** Real-time DOM MutationObserver for GitHub SPA compatibility (Turbo/pjax)
- **Auth Syncing:** Cross-domain token syncing from the Vercel web app to the extension.

## 📁 Repository Structure
- `/frontend`: The React + Vite web application.
- `/backend`: The Express.js API server handling GitHub data, AI processing, and Supabase caching.
- `/extension`: The Chrome extension source code.

## 💻 Local Development

### Prerequisites
- Node.js (v18+)
- Supabase Project (Database & Auth setup)
- GitHub Personal Access Token
- Google Gemini API Key

### 1. Setup Backend
```bash
cd backend
npm install
# Create a .env file with your SUPABASE_URL, SUPABASE_SERVICE_KEY, GITHUB_TOKEN, and GEMINI API keys.
npm run dev
```

### 2. Setup Frontend
```bash
cd frontend
npm install
# Create a .env file with VITE_BACKEND_URL and VITE_SUPABASE keys.
npm run dev
```

### 3. Setup Extension
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `/extension` folder in this repository.

## 🤝 Contributors

<a href="https://github.com/talisman8008/FirstMerge/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=talisman8008/FirstMerge" alt="FirstMerge contributors" />
</a>

---
*Built to empower the next generation of open-source contributors.*
