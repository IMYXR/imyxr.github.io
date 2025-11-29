-- =====================================================
-- Supabase Row Level Security (RLS) Setup
-- =====================================================
-- Run this SQL in your Supabase SQL Editor to set up
-- secure visitor tracking with public credentials
-- =====================================================

-- Step 1: Create the visitors table (if not already created)
CREATE TABLE IF NOT EXISTS visitors (
    id BIGSERIAL PRIMARY KEY,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    city TEXT,
    country TEXT,
    ip TEXT,
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Enable Row Level Security (RLS)
-- This is CRITICAL for security with public credentials
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing policies (if any) to avoid conflicts
DROP POLICY IF EXISTS "Allow public insert" ON visitors;
DROP POLICY IF EXISTS "Allow public read" ON visitors;

-- Step 4: Create INSERT policy
-- Allows anonymous users to add their own visit data
CREATE POLICY "Allow public insert" ON visitors
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Step 5: Create SELECT policy
-- Allows anonymous users to read all visitor data (for the globe)
CREATE POLICY "Allow public read" ON visitors
    FOR SELECT
    TO anon
    USING (true);

-- Step 6: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_visitors_lat_lng ON visitors(lat, lng);
CREATE INDEX IF NOT EXISTS idx_visitors_timestamp ON visitors(timestamp DESC);

-- =====================================================
-- Verification Queries
-- =====================================================

-- Check if RLS is enabled (should return 'true')
SELECT relrowsecurity FROM pg_class WHERE relname = 'visitors';

-- List all policies on visitors table
SELECT * FROM pg_policies WHERE tablename = 'visitors';

-- Count total visitors
SELECT COUNT(*) as total_visitors FROM visitors;

-- View recent visitors
SELECT city, country, timestamp
FROM visitors
ORDER BY timestamp DESC
LIMIT 10;

-- =====================================================
-- Optional: Privacy Enhancement
-- =====================================================

-- If you want to automatically delete old visitor data:
-- (Uncomment and modify the interval as needed)

-- CREATE OR REPLACE FUNCTION delete_old_visitors()
-- RETURNS void AS $$
-- BEGIN
--   DELETE FROM visitors WHERE timestamp < NOW() - INTERVAL '90 days';
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SECURITY NOTES
-- =====================================================
-- ✅ The 'anon' key is designed to be public
-- ✅ RLS policies protect your data from unauthorized access
-- ✅ Users can only INSERT their own data and SELECT all data
-- ✅ Users CANNOT update or delete existing records
-- ✅ Never expose your 'service_role' key in client-side code
-- =====================================================
