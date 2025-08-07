// =================== AuthContext.tsx ===================
import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, handleSupabaseError, getUserProfile, createUserProfile } from '../lib/supabase'
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

  // Debug logging
  useEffect(() => {
    console.log('Auth state changed:', { 
      hasUser: !!user, 
      hasProfile: !!profile, 
      hasSession: !!session, 
      loading 
    })
  }, [user, profile, session, loading])

  useEffect(() => {
    console.log('Setting up auth state listener...')
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session ? 'Found' : 'None')
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
        console.log('Auth state change event:', event, session ? 'Session exists' : 'No session')
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
      console.log('Fetching profile for user:', userId)
      
      const data = await getUserProfile(userId)
      
      if (!data) {
        console.warn('User profile not found for:', userId)
        toast.error('User profile not found. Please complete your registration.')
        setProfile(null)
        return
      }
      
      console.log('Profile fetched successfully:', data.role)
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
      
      console.log('Starting sign up process for:', email, 'Role:', userData.role)
      
      // Validate required fields
      if (!userData.name || !userData.role || !userData.blood_type) {
        throw new Error('Name, role, and blood type are required')
      }
      
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      })
      
      if (error) {
        console.error('Auth signup error:', error)
        handleSupabaseError(error, 'sign up')
        return
      }

      console.log('Auth signup successful:', data.user?.id)

      if (data.user) {
        console.log('Creating user profile...')
        const profileData = await createUserProfile(data.user.id, {
          email,
          ...userData
        })

        if (!profileData) {
          throw new Error('Failed to create user profile')
        }
        
        console.log('User profile created successfully')
        
        // If email confirmation is disabled, set the profile immediately
        if (data.session) {
          setProfile(profileData)
        }
        
        if (data.user.email_confirmed_at) {
          toast.success('Account created successfully!')
        } else {
          toast.success('Account created! Please check your email to confirm your account.')
        }
      }
    } catch (error: any) {
      console.error('Sign up error:', error)
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
      console.log('Starting sign in process for:', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      
      if (error) {
        console.error('Auth signin error:', error)
        handleSupabaseError(error, 'sign in')
        return
      }
      
      console.log('Auth signin successful:', data.user?.id)
      
      if (data.user && !data.user.email_confirmed_at) {
        toast.error('Please check your email and confirm your account before signing in.')
        return
      }
      
      toast.success('Welcome back!')
    } catch (error: any) {
      console.error('Sign in error:', error)
      const message = error instanceof Error ? error.message : 'Failed to sign in'
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      console.log('Signing out...')
      const { error } = await supabase.auth.signOut()
      if (error) {
        handleSupabaseError(error, 'sign out')
        return
      }
      setProfile(null)
      console.log('Sign out successful')
      toast.success('Signed out successfully')
    } catch (error: any) {
      console.error('Sign out error:', error)
      const message = error instanceof Error ? error.message : 'Failed to sign out'
      toast.error(message)
      throw error
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('No user logged in')

    try {
      console.log('Updating profile:', updates)
      const { error } = await supabase
        .schema('bloodbank')
        .from('users')
        .update(updates)
        .eq('id', user.id)

      if (error) {
        handleSupabaseError(error, 'update profile')
        return
      }
      
      setProfile(prev => prev ? { ...prev, ...updates } : null)
      console.log('Profile updated successfully')
      toast.success('Profile updated successfully')
    } catch (error: any) {
      console.error('Update profile error:', error)
      const message = error instanceof Error ? error.message : 'Failed to update profile'
      toast.error(message)
      throw error
    }
  }

  const value = { user, profile, session, loading, signUp, signIn, signOut, updateProfile }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}