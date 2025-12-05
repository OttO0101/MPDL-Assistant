-- ============================================
-- Demo Data for Testing
-- ============================================
-- This script seeds sample data for testing
-- Run ONLY if you want demo data

-- Insert sample cleaning inventory records
INSERT INTO cleaning_inventories (device, products, reported_by, date)
VALUES
  ('CE', '[{"productId": "cp001", "quantity": "2"}, {"productId": "cp002", "quantity": "5"}]', 'Admin', CURRENT_DATE),
  ('CM', '[{"productId": "cp001", "quantity": "3"}, {"productId": "cp002", "quantity": "4"}]', 'Admin', CURRENT_DATE),
  ('LAC1', '[{"productId": "cp001", "quantity": "1"}, {"productId": "cp002", "quantity": "2"}]', 'Admin', CURRENT_DATE),
  ('LAC2', '[{"productId": "cp001", "quantity": "1"}, {"productId": "cp002", "quantity": "2"}]', 'Admin', CURRENT_DATE)
ON CONFLICT DO NOTHING;

-- Verify data was inserted
SELECT COUNT(*) as total_records FROM cleaning_inventories;
