import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const profileChannelRef = useRef(null)

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
        clearProfileSubscription()
      }
    })

    return () => {
      subscription.unsubscribe()
      clearProfileSubscription()
    }
  }, [])

  useEffect(() => {
    if (!user?.id) return undefined

    const refreshOnFocus = () => fetchProfile(user.id, { subscribe: false })
    window.addEventListener('focus', refreshOnFocus)
    return () => window.removeEventListener('focus', refreshOnFocus)
  }, [user?.id])

  function clearProfileSubscription() {
    if (profileChannelRef.current) {
      supabase.removeChannel(profileChannelRef.current)
      profileChannelRef.current = null
    }
  }

  function subscribeToProfile(userId) {
    clearProfileSubscription()
    profileChannelRef.current = supabase
      .channel(`profile-${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        (payload) => setProfile(payload.new ?? null)
      )
      .subscribe()
  }

  async function fetchProfile(userId, { subscribe = true } = {}) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      setProfile(data ?? null)
      setLoading(false)

      if (subscribe) subscribeToProfile(userId)
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
    clearProfileSubscription()
  }

  function refreshProfile() {
    if (!user?.id) return Promise.resolve()
    return fetchProfile(user.id, { subscribe: false })
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
