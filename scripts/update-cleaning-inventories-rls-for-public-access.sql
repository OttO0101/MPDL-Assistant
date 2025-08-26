-- scripts/update-cleaning-inventories-rls-for-public-access.sql

-- 1. Asegurarse de que RLS está habilitado para la tabla
ALTER TABLE cleaning_inventories ENABLE ROW LEVEL SECURITY;

-- 2. Otorgar privilegios base a los roles anon y authenticated
--    Las políticas RLS filtran filas, pero el privilegio base debe existir primero.
GRANT ALL ON TABLE cleaning_inventories TO anon;
GRANT ALL ON TABLE cleaning_inventories TO authenticated;

-- 3. Eliminar políticas existentes para evitar conflictos (incluyendo las que se pudieron crear antes)
DROP POLICY IF EXISTS "Users can insert inventories" ON cleaning_inventories;
DROP POLICY IF EXISTS "Users can view inventories" ON cleaning_inventories;
DROP POLICY IF EXISTS "Users can update inventories" ON cleaning_inventories;
DROP POLICY IF EXISTS "Users can delete inventories" ON cleaning_inventories;
DROP POLICY IF EXISTS "Service role can do everything on cleaning_inventories" ON cleaning_inventories;
DROP POLICY IF EXISTS "Allow public insert" ON cleaning_inventories;
DROP POLICY IF EXISTS "Allow public select" ON cleaning_inventories;
DROP POLICY IF EXISTS "Allow public update" ON cleaning_inventories;
DROP POLICY IF EXISTS "Allow public delete" ON cleaning_inventories;


-- 4. Crear nuevas políticas RLS para acceso público
--    Estas políticas permiten a cualquier usuario (anon o authenticated) realizar operaciones.

-- Política para INSERT
CREATE POLICY "Allow public insert" ON cleaning_inventories
  FOR INSERT
  TO public  -- Aplica a ambos roles: anon y authenticated
  WITH CHECK (true); -- Permite todas las inserciones

-- Política para SELECT
CREATE POLICY "Allow public select" ON cleaning_inventories
  FOR SELECT
  TO public
  USING (true); -- Permite todas las selecciones

-- Política para UPDATE
CREATE POLICY "Allow public update" ON cleaning_inventories
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true); -- Permite todas las actualizaciones

-- Política para DELETE
CREATE POLICY "Allow public delete" ON cleaning_inventories
  FOR DELETE
  TO public
  USING (true); -- Permite todas las eliminaciones
