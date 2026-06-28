# FirstMerge (mergeMate)

FirstMerge is an AI-powered open-source contribution companion. It helps beginner and intermediate developers find beginner-friendly open-source issues and ensures their Pull Requests (PRs) get merged instead of rejected or ignored.

## 🎯 Core Features

- **Friendliness Score Engine**: Calculates a precise 0–100 score for repositories using real-time GitHub data, analyzing PR collision count, beginner PR merge rate, maintainer response time, and issue freshness.
- **AI-Powered PR Quality Check**: Acts as an automated senior engineer reviewing code *before* maintainers do. Analyzes the code diff, original issue body, and CONTRIBUTING.md file to provide a verdict (`GENUINE` or `TRIVIAL`) and actionable suggestions.
- **AI-Powered Issue Roadmap**: Generates a tailored, step-by-step implementation plan using AI before you write a single line of code, complete with time/complexity estimates, target files, and risks.
- **Seamless Chrome Extension**: Integrates directly into GitHub. Automatically analyzes PRs and injects a FirstMerge dashboard into the GitHub PR discussion timeline.
- **Gamification**: Turns open-source contribution into a game with contribution heatmaps, streak tracking, and medals.

## 📂 Project Structure

- `/frontend` - The web application frontend (dashboard, explore page).
- `/backend` - The backend API handling authentication, GitHub API interactions, and AI integrations.
- `/extension` - The Chrome extension that injects into GitHub pull request pages.

## 🚀 Installation & Setup

### Prerequisites
- Node.js
- npm or yarn

### 1. Web Application (Frontend & Backend)

**Backend:**
```bash
cd backend
npm install
# Add your .env variables (Supabase, GitHub API, Google Gemini, etc.)
npm start
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### 2. How to Install the Chrome Extension

To install the FirstMerge Chrome extension locally for development, follow these steps:

1. Open Google Chrome (or any Chromium-based browser like Edge, Brave).
2. Navigate to the Extensions management page by typing `chrome://extensions/` in your address bar and hitting Enter.
3. Enable **"Developer mode"** by toggling the switch in the top right corner of the page.
4. Click the **"Load unpacked"** button that appears in the top left corner.
5. In the file dialog that opens, navigate to your project directory and select the `extension` folder (e.g., `Desktop/mergeMate/extension`).
6. The FirstMerge extension is now installed! It will automatically activate and provide zero-click analysis when you view a Pull Request on GitHub.
