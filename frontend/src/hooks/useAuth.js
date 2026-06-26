import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../lib/supabase.js'

export default function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // Get the current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
      
      if (session?.access_token) {
        window.postMessage({ 
          type: 'FM_AUTH_TOKEN', 
          token: session.access_token,
          refreshToken: session.refresh_token,
          supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
          supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY
        }, window.location.origin)
      }
    })

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)

      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.access_token) {
        window.postMessage({ 
          type: 'FM_AUTH_TOKEN', 
          token: session.access_token,
          refreshToken: session.refresh_token,
          supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
          supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY
        }, window.location.origin)
      } else if (event === 'SIGNED_OUT') {
        window.postMessage({ type: 'FM_AUTH_LOGOUT' }, window.location.origin)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin,
      },
    })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    localStorage.clear()
    sessionStorage.clear()
    window.location.href = '/'
  }

  return { user, loading, signIn, signOut }
}
