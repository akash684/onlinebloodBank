import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'donor' | 'recipient' | 'blood_bank' | 'admin'
          blood_type: string
          phone: string
          location: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          role: 'donor' | 'recipient' | 'blood_bank' | 'admin'
          blood_type: string
          phone: string
          location: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'donor' | 'recipient' | 'blood_bank' | 'admin'
          blood_type?: string
          phone?: string
          location?: string
          created_at?: string
          updated_at?: string
        }
      }
      blood_inventory: {
        Row: {
          id: string
          blood_group: string
          quantity: number
          expiry_date: string
          blood_bank_id: string
          status: 'available' | 'reserved' | 'expired'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          blood_group: string
          quantity: number
          expiry_date: string
          blood_bank_id: string
          status?: 'available' | 'reserved' | 'expired'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          blood_group?: string
          quantity?: number
          expiry_date?: string
          blood_bank_id?: string
          status?: 'available' | 'reserved' | 'expired'
          created_at?: string
          updated_at?: string
        }
      }
      blood_requests: {
        Row: {
          id: string
          requester_id: string
          blood_group: string
          quantity: number
          urgency: 'low' | 'medium' | 'high' | 'critical'
          status: 'pending' | 'approved' | 'fulfilled' | 'rejected'
          hospital_name: string
          patient_name: string
          contact_info: string
          reason: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          requester_id: string
          blood_group: string
          quantity: number
          urgency: 'low' | 'medium' | 'high' | 'critical'
          status?: 'pending' | 'approved' | 'fulfilled' | 'rejected'
          hospital_name: string
          patient_name: string
          contact_info: string
          reason: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          requester_id?: string
          blood_group?: string
          quantity?: number
          urgency?: 'low' | 'medium' | 'high' | 'critical'
          status?: 'pending' | 'approved' | 'fulfilled' | 'rejected'
          hospital_name?: string
          patient_name?: string
          contact_info?: string
          reason?: string
          created_at?: string
          updated_at?: string
        }
      }
      donation_history: {
        Row: {
          id: string
          donor_id: string
          donation_date: string
          blood_group: string
          quantity: number
          blood_bank_id: string
          status: 'scheduled' | 'completed' | 'cancelled'
          notes: string
          created_at: string
        }
        Insert: {
          id?: string
          donor_id: string
          donation_date: string
          blood_group: string
          quantity: number
          blood_bank_id: string
          status?: 'scheduled' | 'completed' | 'cancelled'
          notes?: string
          created_at?: string
        }
        Update: {
          id?: string
          donor_id?: string
          donation_date?: string
          blood_group?: string
          quantity?: number
          blood_bank_id?: string
          status?: 'scheduled' | 'completed' | 'cancelled'
          notes?: string
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'info' | 'warning' | 'success' | 'error'
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: 'info' | 'warning' | 'success' | 'error'
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: 'info' | 'warning' | 'success' | 'error'
          is_read?: boolean
          created_at?: string
        }
      }
    }
  }
}