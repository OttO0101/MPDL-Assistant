-- scripts/update-supabase-schema.sql
-- Actualización completa del esquema de Supabase para el sistema MPDL

-- 1. Actualizar la tabla cleaning_inventories con la estructura correcta
DROP TABLE IF EXISTS cleaning_inventories CASCADE;

CREATE TABLE cleaning_inventories (
  id BIGSERIAL PRIMARY KEY,
  device TEXT NOT NULL,
  products JSONB NOT NULL DEFAULT '[]'::jsonb,
  reported_by TEXT NOT NULL DEFAULT 'Usuario MPDL',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear índices optimizados para mejor rendimiento
CREATE INDEX idx_cleaning_inventories_device ON cleaning_inventories(device);
CREATE INDEX idx_cleaning_inventories_date ON cleaning_inventories(date);
CREATE INDEX idx_cleaning_inventories_created_at ON cleaning_inventories(created_at DESC);
CREATE INDEX idx_cleaning_inventories_device_date ON cleaning_inventories(device, date DESC);

-- Índice GIN para búsquedas eficientes en JSONB
CREATE INDEX idx_cleaning_inventories_products ON cleaning_inventories USING GIN (products);

-- 3. Función para actualizar automáticamente updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Trigger para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS update_cleaning_inventories_updated_at ON cleaning_inventories;
CREATE TRIGGER update_cleaning_inventories_updated_at
    BEFORE UPDATE ON cleaning_inventories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Habilitar RLS (Row Level Security)
ALTER TABLE cleaning_inventories ENABLE ROW LEVEL SECURITY;

-- 6. Eliminar políticas existentes para evitar conflictos
DROP POLICY IF EXISTS "Allow public access" ON cleaning_inventories;
DROP POLICY IF EXISTS "Allow public insert" ON cleaning_inventories;
DROP POLICY IF EXISTS "Allow public select" ON cleaning_inventories;
DROP POLICY IF EXISTS "Allow public update" ON cleaning_inventories;
DROP POLICY IF EXISTS "Allow public delete" ON cleaning_inventories;
DROP POLICY IF EXISTS "Users can insert inventories" ON cleaning_inventories;
DROP POLICY IF EXISTS "Users can view inventories" ON cleaning_inventories;
DROP POLICY IF EXISTS "Users can update inventories" ON cleaning_inventories;
DROP POLICY IF EXISTS "Users can delete inventories" ON cleaning_inventories;

-- 7. Crear nuevas políticas RLS optimizadas para acceso público
CREATE POLICY "Enable all operations for everyone" ON cleaning_inventories
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- 8. Otorgar permisos necesarios
GRANT ALL ON TABLE cleaning_inventories TO anon;
GRANT ALL ON TABLE cleaning_inventories TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE cleaning_inventories_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE cleaning_inventories_id_seq TO authenticated;

-- 9. Función para limpiar inventarios antiguos (opcional)
CREATE OR REPLACE FUNCTION cleanup_old_inventories(days_old INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM cleaning_inventories 
    WHERE created_at < NOW() - INTERVAL '1 day' * days_old;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 10. Función para obtener el último inventario por dispositivo
CREATE OR REPLACE FUNCTION get_latest_inventory_by_device()
RETURNS TABLE (
    id BIGINT,
    device TEXT,
    products JSONB,
    reported_by TEXT,
    date DATE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (ci.device) 
        ci.id,
        ci.device,
        ci.products,
        ci.reported_by,
        ci.date,
        ci.created_at,
        ci.updated_at
    FROM cleaning_inventories ci
    ORDER BY ci.device, ci.updated_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 11. Insertar datos de ejemplo para pruebas (opcional)
INSERT INTO cleaning_inventories (device, products, reported_by, date) VALUES
('CE', '[{"productId": "cp001", "quantity": "2"}, {"productId": "cp002", "quantity": "1"}]'::jsonb, 'Sistema MPDL', CURRENT_DATE),
('LAC1', '[{"productId": "cp001", "quantity": "1"}, {"productId": "cp003", "quantity": "2"}]'::jsonb, 'Sistema MPDL', CURRENT_DATE),
('LAC2', '[{"productId": "cp002", "quantity": "3"}, {"productId": "cp004", "quantity": "1"}]'::jsonb, 'Sistema MPDL', CURRENT_DATE)
ON CONFLICT DO NOTHING;

-- 12. Crear vista para inventarios consolidados LAC
CREATE OR REPLACE VIEW lac_consolidated_view AS
SELECT 
    'LAC_CONSOLIDATED' as device,
    jsonb_object_agg(
        product_key, 
        COALESCE(sum((product_value->>'quantity')::integer), 0)
    ) as products,
    'Sistema MPDL' as reported_by,
    CURRENT_DATE as date,
    NOW() as created_at,
    NOW() as updated_at
FROM (
    SELECT 
        device,
        jsonb_array_elements(products) as product_data
    FROM cleaning_inventories 
    WHERE device ~ '^LAC[1-6]$'
    AND date = CURRENT_DATE
) t,
LATERAL (
    SELECT 
        product_data->>'productId' as product_key,
        product_data as product_value
) p
WHERE product_key IS NOT NULL
GROUP BY device;

-- 13. Comentarios para documentación
COMMENT ON TABLE cleaning_inventories IS 'Tabla principal para almacenar inventarios de productos de limpieza por dispositivo';
COMMENT ON COLUMN cleaning_inventories.device IS 'Identificador del dispositivo (CE, LAC1, LAC2, etc.)';
COMMENT ON COLUMN cleaning_inventories.products IS 'Array JSON con los productos y cantidades';
COMMENT ON COLUMN cleaning_inventories.reported_by IS 'Usuario que reportó el inventario';
COMMENT ON COLUMN cleaning_inventories.date IS 'Fecha del inventario';
COMMENT ON FUNCTION get_latest_inventory_by_device() IS 'Obtiene el inventario más reciente para cada dispositivo';
COMMENT ON VIEW lac_consolidated_view IS 'Vista que consolida automáticamente los inventarios LAC1-LAC6';
