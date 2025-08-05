/*
  # Row Level Security Policies

  1. Users Table Policies
    - Users can read their own profile
    - Users can update their own profile
    - Blood banks and admins can read other users for business operations

  2. Blood Inventory Policies
    - Blood banks can manage their own inventory
    - All authenticated users can read available inventory
    - Admins have full access

  3. Blood Requests Policies
    - Requesters can manage their own requests
    - Assigned blood banks can read/update assigned requests
    - Admins have full access

  4. Donation History Policies
    - Donors can read their own history
    - Blood banks can read donations at their facility
    - Admins have full access

  5. Notifications Policies
    - Users can read their own notifications
    - System can create notifications for users
*/

-- Users table policies
CREATE POLICY "Users can read own profile"
  ON bloodbank.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON bloodbank.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Blood banks can read user profiles for business"
  ON bloodbank.users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bloodbank.users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('blood_bank', 'admin')
    )
  );

CREATE POLICY "Admins can manage all users"
  ON bloodbank.users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bloodbank.users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    )
  );

-- Blood inventory policies
CREATE POLICY "Blood banks can manage own inventory"
  ON bloodbank.blood_inventory
  FOR ALL
  TO authenticated
  USING (
    blood_bank_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM bloodbank.users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    )
  );

CREATE POLICY "All users can read available inventory"
  ON bloodbank.blood_inventory
  FOR SELECT
  TO authenticated
  USING (
    status = 'available' AND 
    quantity > 0 AND 
    expiry_date > CURRENT_DATE
  );

-- Blood requests policies
CREATE POLICY "Users can read own requests"
  ON bloodbank.blood_requests
  FOR SELECT
  TO authenticated
  USING (
    requester_id = auth.uid() OR
    assigned_bank = auth.uid() OR
    EXISTS (
      SELECT 1 FROM bloodbank.users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    )
  );

CREATE POLICY "Recipients can create requests"
  ON bloodbank.blood_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    requester_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM bloodbank.users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('recipient', 'admin')
    )
  );

CREATE POLICY "Blood banks can update assigned requests"
  ON bloodbank.blood_requests
  FOR UPDATE
  TO authenticated
  USING (
    assigned_bank = auth.uid() OR
    EXISTS (
      SELECT 1 FROM bloodbank.users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    )
  );

CREATE POLICY "Requesters can update own pending requests"
  ON bloodbank.blood_requests
  FOR UPDATE
  TO authenticated
  USING (
    requester_id = auth.uid() AND 
    status = 'pending'
  );

-- Donation history policies
CREATE POLICY "Donors can read own donation history"
  ON bloodbank.donation_history
  FOR SELECT
  TO authenticated
  USING (
    donor_id = auth.uid() OR
    blood_bank_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM bloodbank.users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    )
  );

CREATE POLICY "Blood banks can manage donations at their facility"
  ON bloodbank.donation_history
  FOR ALL
  TO authenticated
  USING (
    blood_bank_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM bloodbank.users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    )
  );

CREATE POLICY "Donors can create donation appointments"
  ON bloodbank.donation_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    donor_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM bloodbank.users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('donor', 'admin')
    )
  );

-- Notifications policies
CREATE POLICY "Users can read own notifications"
  ON bloodbank.notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON bloodbank.notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON bloodbank.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage all notifications"
  ON bloodbank.notifications
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bloodbank.users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    )
  );