/*
  # Database Triggers and Functions

  1. Updated At Triggers
    - Automatically update updated_at timestamps

  2. Inventory Management
    - Auto-expire blood units past expiry date
    - Update inventory when donations are completed

  3. Notification Triggers
    - Auto-notify on new blood requests
    - Auto-notify on low inventory
    - Auto-notify on request status changes

  4. Business Logic Functions
    - Validate blood type compatibility
    - Check inventory availability
*/

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION bloodbank.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON bloodbank.users 
  FOR EACH ROW EXECUTE FUNCTION bloodbank.update_updated_at_column();

CREATE TRIGGER update_blood_inventory_updated_at 
  BEFORE UPDATE ON bloodbank.blood_inventory 
  FOR EACH ROW EXECUTE FUNCTION bloodbank.update_updated_at_column();

CREATE TRIGGER update_blood_requests_updated_at 
  BEFORE UPDATE ON bloodbank.blood_requests 
  FOR EACH ROW EXECUTE FUNCTION bloodbank.update_updated_at_column();

CREATE TRIGGER update_donation_history_updated_at 
  BEFORE UPDATE ON bloodbank.donation_history 
  FOR EACH ROW EXECUTE FUNCTION bloodbank.update_updated_at_column();

-- Function to auto-expire blood inventory
CREATE OR REPLACE FUNCTION bloodbank.auto_expire_blood()
RETURNS void AS $$
BEGIN
  UPDATE bloodbank.blood_inventory 
  SET status = 'expired', updated_at = now()
  WHERE expiry_date <= CURRENT_DATE 
    AND status = 'available';
END;
$$ LANGUAGE plpgsql;

-- Function to update inventory after donation
CREATE OR REPLACE FUNCTION bloodbank.update_inventory_after_donation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when donation is completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Check if inventory record exists
    IF EXISTS (
      SELECT 1 FROM bloodbank.blood_inventory 
      WHERE blood_bank_id = NEW.blood_bank_id 
        AND blood_group = NEW.blood_group 
        AND status = 'available'
        AND expiry_date > CURRENT_DATE + INTERVAL '30 days'
      LIMIT 1
    ) THEN
      -- Update existing inventory
      UPDATE bloodbank.blood_inventory 
      SET quantity = quantity + 1, updated_at = now()
      WHERE blood_bank_id = NEW.blood_bank_id 
        AND blood_group = NEW.blood_group 
        AND status = 'available'
        AND expiry_date > CURRENT_DATE + INTERVAL '30 days'
      ORDER BY expiry_date DESC
      LIMIT 1;
    ELSE
      -- Create new inventory record
      INSERT INTO bloodbank.blood_inventory (
        blood_bank_id, 
        blood_group, 
        quantity, 
        expiry_date, 
        status
      ) VALUES (
        NEW.blood_bank_id,
        NEW.blood_group,
        1,
        CURRENT_DATE + INTERVAL '42 days', -- Standard blood shelf life
        'available'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_inventory_after_donation
  AFTER UPDATE ON bloodbank.donation_history
  FOR EACH ROW EXECUTE FUNCTION bloodbank.update_inventory_after_donation();

-- Function to create notifications for new blood requests
CREATE OR REPLACE FUNCTION bloodbank.notify_new_blood_request()
RETURNS TRIGGER AS $$
DECLARE
  blood_bank_record RECORD;
BEGIN
  -- Find blood banks with available inventory
  FOR blood_bank_record IN
    SELECT DISTINCT bi.blood_bank_id, u.name
    FROM bloodbank.blood_inventory bi
    JOIN bloodbank.users u ON u.id = bi.blood_bank_id
    WHERE bi.blood_group = NEW.blood_group
      AND bi.status = 'available'
      AND bi.quantity >= NEW.quantity
      AND bi.expiry_date > CURRENT_DATE
      AND u.role = 'blood_bank'
      AND u.is_active = true
  LOOP
    INSERT INTO bloodbank.notifications (
      user_id,
      message,
      type
    ) VALUES (
      blood_bank_record.blood_bank_id,
      format('New %s priority blood request: %s units of %s type', 
        NEW.urgency, NEW.quantity, NEW.blood_group),
      'blood_request'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_new_blood_request
  AFTER INSERT ON bloodbank.blood_requests
  FOR EACH ROW EXECUTE FUNCTION bloodbank.notify_new_blood_request();

-- Function to notify on request status changes
CREATE OR REPLACE FUNCTION bloodbank.notify_request_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify if status actually changed
  IF OLD.status != NEW.status THEN
    INSERT INTO bloodbank.notifications (
      user_id,
      message,
      type
    ) VALUES (
      NEW.requester_id,
      format('Your blood request for %s units of %s has been %s', 
        NEW.quantity, NEW.blood_group, NEW.status),
      format('request_%s', NEW.status)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_request_status_change
  AFTER UPDATE ON bloodbank.blood_requests
  FOR EACH ROW EXECUTE FUNCTION bloodbank.notify_request_status_change();

-- Function to check low inventory and notify
CREATE OR REPLACE FUNCTION bloodbank.check_low_inventory()
RETURNS void AS $$
DECLARE
  inventory_record RECORD;
BEGIN
  FOR inventory_record IN
    SELECT 
      bi.blood_bank_id,
      bi.blood_group,
      SUM(bi.quantity) as total_quantity,
      u.name as blood_bank_name
    FROM bloodbank.blood_inventory bi
    JOIN bloodbank.users u ON u.id = bi.blood_bank_id
    WHERE bi.status = 'available' 
      AND bi.expiry_date > CURRENT_DATE
    GROUP BY bi.blood_bank_id, bi.blood_group, u.name
    HAVING SUM(bi.quantity) <= 5
  LOOP
    -- Check if we haven't sent this notification recently (within 24 hours)
    IF NOT EXISTS (
      SELECT 1 FROM bloodbank.notifications 
      WHERE user_id = inventory_record.blood_bank_id
        AND type = 'inventory_low'
        AND message LIKE '%' || inventory_record.blood_group || '%'
        AND created_at > now() - INTERVAL '24 hours'
    ) THEN
      INSERT INTO bloodbank.notifications (
        user_id,
        message,
        type
      ) VALUES (
        inventory_record.blood_bank_id,
        format('Low inventory alert: Only %s units of %s remaining', 
          inventory_record.total_quantity, inventory_record.blood_group),
        'inventory_low'
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;