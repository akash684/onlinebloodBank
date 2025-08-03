import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'bloodbank'
  }
})

// Database types for TypeScript support
export interface BloodInventory {
  id: string
  blood_group: string
  quantity: number
  expiry_date: string
  blood_bank_id: string
  status: 'available' | 'expired' | 'reserved'
  updated_at: string
}

export interface BloodRequest {
  id: string
  requester_id: string
  blood_group: string
  quantity: number
  status: 'pending' | 'approved' | 'denied' | 'fulfilled'
  assigned_bank?: string
  created_at: string
  fulfilled_at?: string
  urgency?: string
  reason?: string
  patient_name?: string
  contact_number?: string
  hospital_name?: string
  required_by?: string
}

export interface User {
  id: string
  email: string
  name: string
  role: 'donor' | 'recipient' | 'blood_bank' | 'admin'
  blood_type?: string
  phone?: string
  created_at: string
  is_active: boolean
}

export interface Notification {
  id: string
  user_id: string
  message: string
  type: string
  is_read: boolean
  created_at: string
}