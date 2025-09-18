-- scripts/verify-supabase-setup.sql
-- Script para verificar que la configuración de Supabase esté correcta

-- 1. Verificar que la tabla existe y tiene la estructura correcta
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'cleaning_inventories'
ORDER BY ordinal_position;

-- 2. Verificar índices
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'cleaning_inventories';

-- 3. Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'cleaning_inventories';

-- 4. Verificar que RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'cleaning_inventories';

-- 5. Verificar permisos
SELECT 
    grantee,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_name = 'cleaning_inventories';

-- 6. Contar registros existentes
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT device) as unique_devices,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record
FROM cleaning_inventories;

-- 7. Verificar dispositivos únicos
SELECT 
    device,
    COUNT(*) as record_count,
    MAX(updated_at) as last_update
FROM cleaning_inventories 
GROUP BY device 
ORDER BY device;

-- 8. Verificar funciones personalizadas
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('update_updated_at_column', 'cleanup_old_inventories', 'get_latest_inventory_by_device');

-- 9. Verificar triggers
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'cleaning_inventories';

-- 10. Verificar vista consolidada LAC
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.views 
    WHERE table_name = 'lac_consolidated_view'
) as lac_view_exists;
