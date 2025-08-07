// =================== AuthContext.tsx ===================
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, handleSupabaseError, getUserProfile, createUserProfile } from '../lib/supabase';
import toast from 'react-hot-toast';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'donor' | 'recipient' | 'blood_bank' | 'admin';
  blood_type: string;
  phone: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: Partial<UserProfile>) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const initAuth = async () => {
    setLoading(true)
    console.log('Initializing auth...')
    const { data: { session } } = await supabase.auth.getSession()
    setSession(session)
    setUser(session?.user ?? null)
    console.log('Initial session:', session)

    if (session?.user) {
      await fetchProfile(session.user.id)
    } else {
      setProfile(null)
    }

    setLoading(false)
  }

  initAuth()

  const { data: authListener } = supabase.auth.onAuthStateChange(
    async (_event, session) => {
      console.log('Auth change:', session)
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
    }
  )

  return () => {
    authListener?.subscription?.unsubscribe()
  }
}, [])


  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      const data = await getUserProfile(userId);

      if (!data) {
        toast.error('User profile not found. Please complete your registration.');
        setProfile(null);
        return;
      }

      console.log('Profile fetched successfully:', data.role);
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load user profile');
      setProfile(null);
    }
  };

  const signUp = async (email: string, password: string, userData: Partial<UserProfile>) => {
    try {
      setLoading(true);
      console.log('Starting sign up process for:', email);

      if (!userData.name || !userData.role || !userData.blood_type) {
        throw new Error('Name, role, and blood type are required');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        handleSupabaseError(error, 'sign up');
        return;
      }

      if (data.user) {
        const profileData = await createUserProfile(data.user.id, {
          email,
          ...userData
        });

        if (!profileData) {
          throw new Error('Failed to create user profile');
        }

        if (data.session) {
          setProfile(profileData);
        }

        if (data.user.email_confirmed_at) {
          toast.success('Account created successfully!');
        } else {
          toast.success('Account created! Please check your email to confirm your account.');
        }
      }
    } catch (error: any) {
      toast.error(error instanceof Error ? error.message : 'Failed to create account');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        handleSupabaseError(error, 'sign in');
        return;
      }

      if (data.user && !data.user.email_confirmed_at) {
        toast.error('Please confirm your email before signing in.');
        return;
      }

      toast.success('Welcome back!');
    } catch (error: any) {
      toast.error(error instanceof Error ? error.message : 'Failed to sign in');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        handleSupabaseError(error, 'sign out');
        return;
      }
      setProfile(null);
      toast.success('Signed out successfully');
    } catch (error: any) {
      toast.error(error instanceof Error ? error.message : 'Failed to sign out');
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('No user logged in');

    try {
      const { error } = await supabase
        .schema('bloodbank')
        .from('users')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        handleSupabaseError(error, 'update profile');
        return;
      }

      setProfile(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
      throw error;
    }
  };

  const value = { user, profile, session, loading, signUp, signIn, signOut, updateProfile };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
