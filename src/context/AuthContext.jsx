import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const pollIntervalRef = useRef(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
        }
      }
    })

    return () => {
      subscription.unsubscribe()
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [])

  async function fetchProfile(userId) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      setProfile(data ?? null)
      setLoading(false)

      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }

      // Poll profile every 10 seconds to catch suspension/ban changes.
      pollIntervalRef.current = setInterval(async () => {
        try {
          const { data: updatedProfile } = await supabase
            .from('profiles')
            .select('is_suspended, banned_at')
            .eq('id', userId)
            .single()

          if (updatedProfile) {
            setProfile(prev => ({
              ...prev,
              is_suspended: updatedProfile.is_suspended,
              banned_at: updatedProfile.banned_at
            }))
          }
        } catch (error) {
          console.error('Error polling profile:', error)
        }
      }, 10000)
    } catch (error) {
      console.error('Error fetching profile:', error)
      setLoading(false)
    }
  }

  async function signUp({ email, password, fullName, role = 'customer' }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } }
    })
    return { data, error }
  }

  async function signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
