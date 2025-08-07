import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

console.log('Supabase Config:', {
  url: supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
  anonKeyLength: supabaseAnonKey?.length
})

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Test connection on initialization
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('Supabase auth session error:', error)
  } else {
    console.log('Supabase auth session:', data.session ? 'Active' : 'None')
  }
})

// Enhanced error handling for Supabase operations
export const handleSupabaseError = (error: any, operation: string) => {
  console.error(`Supabase ${operation} error:`, error)
  
  // Handle specific auth errors
  if (error?.message?.includes('Invalid login credentials')) {
    throw new Error('Invalid email or password')
  }
  
  if (error?.message?.includes('Email not confirmed')) {
    throw new Error('Please check your email and confirm your account')
  }
  
  if (error?.message?.includes('User already registered')) {
    throw new Error('An account with this email already exists')
  }
  
  if (error?.code === 'PGRST116') {
    throw new Error('No data found for the requested operation')
  }
  
  if (error?.code === '23503') {
    throw new Error('Referenced record does not exist')
  }
  
  if (error?.code === '23505') {
    throw new Error('Record already exists')
  }
  
  if (error?.code === '42501') {
    throw new Error('Insufficient permissions for this operation')
  }
  
  if (error?.code === 'PGRST301') {
    throw new Error('Database schema or table not found')
  }
  
  throw new Error(error?.message || `Failed to ${operation}`)
}

// Type-safe query builder helpers
export const createTypedQuery = <T>(
  table: string,
  select?: string
) => {
  // Use the bloodbank schema for all queries
  return supabase.schema('bloodbank').from(table).select(select || '*') as any
}

// Helper function to get user profile with proper schema
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .schema('bloodbank')
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) {
    handleSupabaseError(error, 'fetch user profile')
    return null
  }
  
  return data
}

// Helper function to create user profile
export const createUserProfile = async (userId: string, profileData: any) => {
  const { data, error } = await supabase
    .schema('bloodbank')
    .from('users')
    .insert([{ 
      id: userId, 
      ...profileData,
      is_active: true 
    }])
    .select()
    .single()
  
  if (error) {
    handleSupabaseError(error, 'create user profile')
    return null
  }
  
  return data
}

// Database types for TypeScript support
export interface BloodInventory {
  id: string
  blood_group: string
  quantity: number
  expiry_date: string
  blood_bank_id: string
  status: 'available' | 'expired' | 'reserved'
  created_at: string
  updated_at: string
}

export interface BloodRequest {
  id: string
  requester_id: string
  blood_group: string
  quantity: number
  status: 'pending' | 'approved' | 'denied' | 'fulfilled'
  assigned_bank?: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
  reason?: string
  patient_name?: string
  contact_number?: string
  hospital_name?: string
  required_by?: string
  created_at: string
  updated_at: string
  fulfilled_at?: string
}

export interface User {
  id: string
  email: string
  name: string
  role: 'donor' | 'recipient' | 'blood_bank' | 'admin'
  blood_type: string
  phone?: string
  created_at: string
  updated_at: string
  is_active: boolean
}

export interface Notification {
  id: string
  user_id: string
  message: string
  type: 'blood_request' | 'donation_scheduled' | 'inventory_low' | 'request_approved' | 'request_denied' | 'general'
  is_read: boolean
  created_at: string
}

export interface DonationHistory {
  id: string
  donor_id: string
  blood_bank_id: string
  donation_date: string
  blood_group: string
  status: 'completed' | 'pending' | 'cancelled'
  notes?: string
  created_at: string
  updated_at: string
}