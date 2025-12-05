-- ============================================
-- Enable Row Level Security (RLS)
-- ============================================

-- Enable RLS on tables
ALTER TABLE cleaning_inventories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Drop existing policies to avoid conflicts
-- ============================================

-- Drop cleaning_inventories policies
DROP POLICY IF EXISTS "Allow public insert" ON cleaning_inventories;
DROP POLICY IF EXISTS "Allow public select" ON cleaning_inventories;
DROP POLICY IF EXISTS "Allow public update" ON cleaning_inventories;
DROP POLICY IF EXISTS "Allow public delete" ON cleaning_inventories;
DROP POLICY IF EXISTS "Users can insert inventories" ON cleaning_inventories;
DROP POLICY IF EXISTS "Users can view inventories" ON cleaning_inventories;
DROP POLICY IF EXISTS "Users can update inventories" ON cleaning_inventories;
DROP POLICY IF EXISTS "Users can delete inventories" ON cleaning_inventories;
DROP POLICY IF EXISTS "Service role can do everything on cleaning_inventories" ON cleaning_inventories;

-- Drop user_profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for registration" ON user_profiles;
DROP POLICY IF EXISTS "Allow anon select user profiles for login" ON user_profiles;
DROP POLICY IF EXISTS "Service role can do everything on user_profiles" ON user_profiles;

-- ============================================
-- Create new RLS policies for cleaning_inventories
-- ============================================

-- Policies allow public (anon and authenticated) access for simplicity
CREATE POLICY "Allow public insert" ON cleaning_inventories
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Allow public select" ON cleaning_inventories
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Allow public update" ON cleaning_inventories
  FOR UPDATE TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete" ON cleaning_inventories
  FOR DELETE TO public
  USING (true);

-- Service role bypass for administrative operations
CREATE POLICY "Service role can do everything on cleaning_inventories" ON cleaning_inventories
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Create RLS policies for user_profiles
-- ============================================

-- Authenticated users can view own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Authenticated users can update own profile
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role can insert on registration
CREATE POLICY "Service role can insert user profiles" ON user_profiles
  FOR INSERT TO service_role
  WITH CHECK (true);

-- Anonymous users can select profiles (for login lookup)
CREATE POLICY "Allow anon select user profiles for login" ON user_profiles
  FOR SELECT TO anon
  USING (true);

-- Service role bypass for administrative operations
CREATE POLICY "Service role can do everything on user_profiles" ON user_profiles
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Grant permissions
-- ============================================

GRANT ALL ON TABLE cleaning_inventories TO anon;
GRANT ALL ON TABLE cleaning_inventories TO authenticated;
GRANT ALL ON TABLE cleaning_inventories TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE user_profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE user_profiles TO authenticated;
GRANT ALL ON TABLE user_profiles TO service_role;
