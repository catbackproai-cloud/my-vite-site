import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)


export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (!error && data) {
      setProfile(data)
    } else {
      setProfile(null)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    // When laptop lid opens / tab resumes, clear any stale auth lock data
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('mta-auth') && key.includes('lock')) {
            localStorage.removeItem(key)
          }
        })
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  const isSubscribed = profile?.subscription_status === 'active'

  async function signUp(email, password, fullName) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email,
        full_name: fullName,
      }, { onConflict: 'id' })
    }

    return data
  }

  async function signIn(email, password) {
    // Clear any stale auth state before signing in
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('mta-auth')) localStorage.removeItem(key)
    })

    const signInPromise = supabase.auth.signInWithPassword({ email, password })
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Sign in timed out. Please try again.')), 12000)
    )

    const { data, error } = await Promise.race([signInPromise, timeout])
    if (error) throw error
    return data
  }

  async function refreshProfile(userId) {
    await fetchProfile(userId)
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setSession(null)
  }

  const value = {
    user,
    profile,
    session,
    loading,
    isSubscribed,
    signUp,
    signIn,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
