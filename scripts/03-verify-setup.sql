-- ============================================
-- Verification Script
-- ============================================
-- Run this to verify the setup is correct

-- 1. Check table structure
SELECT 
    'cleaning_inventories' as table_name,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'cleaning_inventories'
GROUP BY table_name;

-- 2. Check indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'cleaning_inventories'
ORDER BY indexname;

-- 3. Check RLS status
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('cleaning_inventories', 'user_profiles')
ORDER BY tablename;

-- 4. Check RLS policies
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'cleaning_inventories'
ORDER BY tablename, policyname;

-- 5. Check triggers
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers 
WHERE event_object_table IN ('cleaning_inventories', 'user_profiles')
ORDER BY event_object_table, trigger_name;

-- 6. Count records
SELECT 
    'cleaning_inventories' as table_name,
    COUNT(*) as total_records
FROM cleaning_inventories
UNION ALL
SELECT 
    'user_profiles' as table_name,
    COUNT(*) as total_records
FROM user_profiles;

-- 7. Check devices in inventory
SELECT 
    device,
    COUNT(*) as record_count,
    MAX(updated_at) as last_updated
FROM cleaning_inventories
GROUP BY device
ORDER BY device;
