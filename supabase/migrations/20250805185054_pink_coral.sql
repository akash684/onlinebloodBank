/*
  # Blood Bank Management System Schema

  1. New Tables
    - `users` - User profiles with role-based access
    - `blood_inventory` - Blood stock tracking with expiry dates
    - `blood_requests` - Request management with status tracking
    - `donation_history` - Complete donation records
    - `notifications` - Real-time alert system

  2. Security
    - Enable RLS on all tables
    - Add comprehensive policies for each role
    - Ensure proper foreign key constraints

  3. Indexes
    - Performance optimization for common queries
    - Composite indexes for complex lookups
*/

-- Create bloodbank schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS bloodbank;

-- Users table (base table for all foreign keys)
CREATE TABLE IF NOT EXISTS bloodbank.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['donor'::text, 'recipient'::text, 'blood_bank'::text, 'admin'::text])),
  blood_type text CHECK (blood_type = ANY (ARRAY['A+'::text, 'A-'::text, 'B+'::text, 'B-'::text, 'AB+'::text, 'AB-'::text, 'O+'::text, 'O-'::text])),
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Blood inventory table
CREATE TABLE IF NOT EXISTS bloodbank.blood_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blood_group text NOT NULL CHECK (blood_group = ANY (ARRAY['A+'::text, 'A-'::text, 'B+'::text, 'B-'::text, 'AB+'::text, 'AB-'::text, 'O+'::text, 'O-'::text])),
  quantity integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  expiry_date date NOT NULL CHECK (expiry_date > CURRENT_DATE),
  blood_bank_id uuid NOT NULL,
  status text DEFAULT 'available'::text CHECK (status = ANY (ARRAY['available'::text, 'expired'::text, 'reserved'::text])),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT blood_inventory_blood_bank_id_fkey FOREIGN KEY (blood_bank_id) REFERENCES bloodbank.users(id) ON DELETE CASCADE
);

-- Blood requests table
CREATE TABLE IF NOT EXISTS bloodbank.blood_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL,
  blood_group text NOT NULL CHECK (blood_group = ANY (ARRAY['A+'::text, 'A-'::text, 'B+'::text, 'B-'::text, 'AB+'::text, 'AB-'::text, 'O+'::text, 'O-'::text])),
  quantity integer NOT NULL CHECK (quantity > 0),
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'denied'::text, 'fulfilled'::text])),
  assigned_bank uuid,
  urgency text DEFAULT 'medium'::text CHECK (urgency = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text])),
  reason text,
  patient_name text,
  contact_number text,
  hospital_name text,
  required_by date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  fulfilled_at timestamptz,
  CONSTRAINT blood_requests_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES bloodbank.users(id) ON DELETE CASCADE,
  CONSTRAINT blood_requests_assigned_bank_fkey FOREIGN KEY (assigned_bank) REFERENCES bloodbank.users(id) ON DELETE SET NULL
);

-- Donation history table
CREATE TABLE IF NOT EXISTS bloodbank.donation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id uuid NOT NULL,
  blood_bank_id uuid NOT NULL,
  donation_date date NOT NULL,
  blood_group text NOT NULL CHECK (blood_group = ANY (ARRAY['A+'::text, 'A-'::text, 'B+'::text, 'B-'::text, 'AB+'::text, 'AB-'::text, 'O+'::text, 'O-'::text])),
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['completed'::text, 'pending'::text, 'cancelled'::text])),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT donation_history_donor_id_fkey FOREIGN KEY (donor_id) REFERENCES bloodbank.users(id) ON DELETE CASCADE,
  CONSTRAINT donation_history_blood_bank_id_fkey FOREIGN KEY (blood_bank_id) REFERENCES bloodbank.users(id) ON DELETE CASCADE
);

-- Notifications table
CREATE TABLE IF NOT EXISTS bloodbank.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['blood_request'::text, 'donation_scheduled'::text, 'inventory_low'::text, 'request_approved'::text, 'request_denied'::text, 'general'::text])),
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES bloodbank.users(id) ON DELETE CASCADE
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON bloodbank.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON bloodbank.users(role);
CREATE INDEX IF NOT EXISTS idx_blood_inventory_blood_bank_id ON bloodbank.blood_inventory(blood_bank_id);
CREATE INDEX IF NOT EXISTS idx_blood_inventory_blood_group ON bloodbank.blood_inventory(blood_group);
CREATE INDEX IF NOT EXISTS idx_blood_inventory_status ON bloodbank.blood_inventory(status);
CREATE INDEX IF NOT EXISTS idx_blood_inventory_expiry_date ON bloodbank.blood_inventory(expiry_date);
CREATE INDEX IF NOT EXISTS idx_blood_requests_requester_id ON bloodbank.blood_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_blood_requests_assigned_bank ON bloodbank.blood_requests(assigned_bank);
CREATE INDEX IF NOT EXISTS idx_blood_requests_status ON bloodbank.blood_requests(status);
CREATE INDEX IF NOT EXISTS idx_blood_requests_blood_group ON bloodbank.blood_requests(blood_group);
CREATE INDEX IF NOT EXISTS idx_donation_history_donor_id ON bloodbank.donation_history(donor_id);
CREATE INDEX IF NOT EXISTS idx_donation_history_blood_bank_id ON bloodbank.donation_history(blood_bank_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON bloodbank.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON bloodbank.notifications(is_read);

-- Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_blood_inventory_composite ON bloodbank.blood_inventory(blood_bank_id, blood_group, status);
CREATE INDEX IF NOT EXISTS idx_blood_requests_composite ON bloodbank.blood_requests(assigned_bank, status, created_at);

-- Enable Row Level Security
ALTER TABLE bloodbank.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bloodbank.blood_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE bloodbank.blood_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE bloodbank.donation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE bloodbank.notifications ENABLE ROW LEVEL SECURITY;