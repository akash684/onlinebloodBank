import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'bloodbank'
  }
})

export type Database = {
  bloodbank: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          password_hash?: string
          name: string
          role: 'donor' | 'recipient' | 'blood_bank' | 'admin'
          blood_type: string
          phone: string
          created_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          email: string
          password_hash?: string
          name: string
          role: 'donor' | 'recipient' | 'blood_bank' | 'admin'
          blood_type: string
          phone: string
          created_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          email?: string
          password_hash?: string
          name?: string
          role?: 'donor' | 'recipient' | 'blood_bank' | 'admin'
          blood_type?: string
          phone?: string
          created_at?: string
          is_active?: boolean
        }
      }
      blood_inventory: {
        Row: {
          id: string
          blood_group: string
          quantity: number
          expiry_date: string
          blood_bank_id: string
          status: 'available' | 'expired' | 'reserved'
          updated_at: string
        }
        Insert: {
          id?: string
          blood_group: string
          quantity: number
          expiry_date: string
          blood_bank_id: string
          status?: 'available' | 'expired' | 'reserved'
          updated_at?: string
        }
        Update: {
          id?: string
          blood_group?: string
          quantity?: number
          expiry_date?: string
          blood_bank_id?: string
          status?: 'available' | 'expired' | 'reserved'
          updated_at?: string
        }
      }
      blood_requests: {
        Row: {
          id: string
          requester_id: string
          blood_group: string
          quantity: number
          status: 'pending' | 'approved' | 'denied' | 'fulfilled'
          assigned_bank?: string
          created_at: string
          fulfilled_at?: string
        }
        Insert: {
          id?: string
          requester_id: string
          blood_group: string
          quantity: number
          status?: 'pending' | 'approved' | 'denied' | 'fulfilled'
          assigned_bank?: string
          created_at?: string
          fulfilled_at?: string
        }
        Update: {
          id?: string
          requester_id?: string
          blood_group?: string
          quantity?: number
          status?: 'pending' | 'approved' | 'denied' | 'fulfilled'
          assigned_bank?: string
          created_at?: string
          fulfilled_at?: string
        }
      }
      donation_history: {
        Row: {
          id: string
          donor_id: string
          donation_date: string
          blood_bank_id: string
          blood_group: string
          status: 'completed' | 'pending' | 'cancelled'
        }
        Insert: {
          id?: string
          donor_id: string
          donation_date: string
          blood_bank_id: string
          blood_group: string
          status?: 'completed' | 'pending' | 'cancelled'
        }
        Update: {
          id?: string
          donor_id?: string
          donation_date?: string
          blood_bank_id?: string
          blood_group?: string
          status?: 'completed' | 'pending' | 'cancelled'
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          message: string
          type: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          message: string
          type: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          message?: string
          type?: string
          is_read?: boolean
          created_at?: string
        }
      }
    }
  }
}