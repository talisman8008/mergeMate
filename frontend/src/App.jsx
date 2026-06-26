import { useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

import useAuth from './hooks/useAuth.js'
import supabase from './lib/supabase.js'
import Home from './pages/Home.jsx'
import Explore from './pages/Explore.jsx'
import IssueDetail from './pages/IssueDetail.jsx'
import PRCheck from './pages/PRCheck.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Onboarding from './pages/Onboarding.jsx'
import NotFound from './pages/NotFound.jsx'
import CustomCursor from './components/CustomCursor.jsx'

export default function App() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  const { user, loading, signIn, signOut } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user && !loading && window.location.pathname !== '/onboarding') {
      const checkProfile = async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (!session?.access_token) return
          
          const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'
          const res = await fetch(`${BACKEND_URL}/api/user/profile`, {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          })
          
          if (res.ok) {
            const data = await res.json()
            if (!data || !data.interests || data.interests.length === 0) {
              navigate('/onboarding')
            }
          }
        } catch (err) {
          console.error("Error checking user profile:", err)
        }
      }
      checkProfile()
    }
  }, [user, loading, navigate])

  if (loading) {
    return (
      <div className="bg-[var(--canvas)] min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--border)] border-t-[var(--accent-green)] animate-spin" />
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
        <Route path="*" element={<NotFound user={user} signIn={signIn} signOut={signOut} />} />
      </Routes>
    </div>
  )
}