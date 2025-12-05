-- ============================================
-- MPDL Productos - Database Schema Setup
-- ============================================

-- 1. Create cleaning_inventories table
CREATE TABLE IF NOT EXISTS cleaning_inventories (
  id BIGSERIAL PRIMARY KEY,
  device TEXT NOT NULL,
  products JSONB NOT NULL DEFAULT '[]'::jsonb,
  reported_by TEXT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cleaning_inventories_device ON cleaning_inventories(device);
CREATE INDEX IF NOT EXISTS idx_cleaning_inventories_date ON cleaning_inventories(date);
CREATE INDEX IF NOT EXISTS idx_cleaning_inventories_created_at ON cleaning_inventories(created_at);

-- 2. Create user_profiles table (if using authentication)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);

-- ============================================
-- Create functions and triggers
-- ============================================

-- Function to update updated_at column automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Drop triggers if they exist
DROP TRIGGER IF EXISTS update_cleaning_inventories_updated_at ON cleaning_inventories;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;

-- Create triggers for automatic updated_at
CREATE TRIGGER update_cleaning_inventories_updated_at
    BEFORE UPDATE ON cleaning_inventories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile on signup (if using authentication)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, username, email)
  VALUES (NEW.id, LOWER(COALESCE(NEW.raw_user_meta_data->>'username', NEW.email)), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
