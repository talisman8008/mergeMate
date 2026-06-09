import { Routes, Route } from 'react-router-dom'

import useAuth from './hooks/useAuth.js'
import Home from './pages/Home.jsx'
import Explore from './pages/Explore.jsx'
import IssueDetail from './pages/IssueDetail.jsx'
import PRCheck from './pages/PRCheck.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Onboarding from './pages/Onboarding.jsx'
import CustomCursor from './components/CustomCursor.jsx'

export default function App() {
  const { user, loading, signIn, signOut } = useAuth()

  if (loading) {
    return (
      <div className="bg-[var(--canvas)] min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#30363d] border-t-[#238636] animate-spin" />
      </div>
    )
  }

  return (
    <div className="bg-[var(--canvas)] min-h-screen text-[var(--text)]">
      <CustomCursor />
      <Routes>
        <Route path="/" element={<Home user={user} signIn={signIn} signOut={signOut} />} />
        <Route path="/explore" element={<Explore user={user} signIn={signIn} signOut={signOut} />} />
        <Route path="/issue/:owner/:repo/:number" element={<IssueDetail user={user} signIn={signIn} signOut={signOut} />} />
        <Route path="/prcheck" element={<PRCheck user={user} signIn={signIn} signOut={signOut} />} />
        <Route path="/dashboard" element={<Dashboard user={user} signIn={signIn} signOut={signOut} />} />
        <Route path="/onboarding" element={<Onboarding />} />
      </Routes>
    </div>
  )
}