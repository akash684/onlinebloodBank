// =================== AuthContext.tsx ===================
import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, handleSupabaseError } from '../lib/supabase'
import toast from 'react-hot-toast'

interface UserProfile {
  id: string
  email: string
  name: string
  role: 'donor' | 'recipient' | 'blood_bank' | 'admin'
  blood_type: string
  phone: string
  created_at: string
  updated_at: string
  is_active: boolean
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, userData: Partial<UserProfile>) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        handleSupabaseError(error, 'fetch profile')
        return
      }
      
      if (!data) {
        throw new Error('User profile not found')
      }
      
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to load user profile')
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, userData: Partial<UserProfile>) => {
    try {
      setLoading(true)
      
      // Validate required fields
      if (!userData.name || !userData.role || !userData.blood_type) {
        throw new Error('Name, role, and blood type are required')
      }
      
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        handleSupabaseError(error, 'sign up')
        return
      }

      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert([{ 
            id: data.user.id, 
            email, 
            ...userData,
            is_active: true 
          }])

        if (profileError) {
          handleSupabaseError(profileError, 'create profile')
          return
        }
        
        toast.success('Account created successfully!')
      }
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Failed to create account'
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        handleSupabaseError(error, 'sign in')
        return
      }
      toast.success('Welcome back!')
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Failed to sign in'
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        handleSupabaseError(error, 'sign out')
        return
      }
      setProfile(null)
      toast.success('Signed out successfully')
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Failed to sign out'
      toast.error(message)
      throw error
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('No user logged in')

    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)

      if (error) {
        handleSupabaseError(error, 'update profile')
        return
      }
      
      setProfile(prev => prev ? { ...prev, ...updates } : null)
      toast.success('Profile updated successfully')
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Failed to update profile'
      toast.error(message)
      throw error
    }
  }

  const value = { user, profile, session, loading, signUp, signIn, signOut, updateProfile }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

