import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'bloodbank'
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Enhanced error handling for Supabase operations
export const handleSupabaseError = (error: any, operation: string) => {
  console.error(`Supabase ${operation} error:`, error)
  
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
  
  throw new Error(error?.message || `Failed to ${operation}`)
}

// Type-safe query builder helpers
export const createTypedQuery = <T>(
  table: string,
  select?: string
) => {
  return supabase.from(table).select(select || '*') as any
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