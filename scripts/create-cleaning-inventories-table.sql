-- Create the cleaning_inventories table if it doesn't exist
CREATE TABLE IF NOT EXISTS cleaning_inventories (
  id BIGSERIAL PRIMARY KEY,
  device TEXT NOT NULL,
  products JSONB NOT NULL DEFAULT '[]'::jsonb,
  reported_by TEXT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cleaning_inventories_device ON cleaning_inventories(device);
CREATE INDEX IF NOT EXISTS idx_cleaning_inventories_date ON cleaning_inventories(date);
CREATE INDEX IF NOT EXISTS idx_cleaning_inventories_created_at ON cleaning_inventories(created_at);

-- Create a function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_cleaning_inventories_updated_at ON cleaning_inventories;
CREATE TRIGGER update_cleaning_inventories_updated_at
    BEFORE UPDATE ON cleaning_inventories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
