-- Enable RLS on cleaning_inventories table if not already enabled
ALTER TABLE cleaning_inventories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can insert their own inventories" ON cleaning_inventories;
DROP POLICY IF EXISTS "Users can view all inventories" ON cleaning_inventories;
DROP POLICY IF EXISTS "Users can update their own inventories" ON cleaning_inventories;
DROP POLICY IF EXISTS "Users can delete their own inventories" ON cleaning_inventories;

-- Policy to allow authenticated users to insert inventories
CREATE POLICY "Users can insert inventories" ON cleaning_inventories
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy to allow authenticated users to view all inventories
CREATE POLICY "Users can view inventories" ON cleaning_inventories
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy to allow authenticated users to update inventories
CREATE POLICY "Users can update inventories" ON cleaning_inventories
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy to allow authenticated users to delete inventories
CREATE POLICY "Users can delete inventories" ON cleaning_inventories
  FOR DELETE
  TO authenticated
  USING (true);

-- Also ensure the user_profiles table has proper RLS policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on user_profiles if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for registration" ON user_profiles;
-- Nueva política para permitir la selección de perfiles por usuarios anónimos para el login
DROP POLICY IF EXISTS "Allow anon select user profiles for login" ON user_profiles;


-- Updated policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable insert for registration" ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Nueva política: Permitir a los usuarios anónimos seleccionar perfiles para propósitos de login
-- Esto es necesario para que la función de login pueda encontrar el email por username antes de la autenticación.
CREATE POLICY "Allow anon select user profiles for login" ON public.user_profiles
  FOR SELECT
  TO anon
  USING (true);


-- Allow service role to bypass RLS for administrative operations
CREATE POLICY "Service role can do everything on cleaning_inventories" ON cleaning_inventories
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do everything on user_profiles" ON user_profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
