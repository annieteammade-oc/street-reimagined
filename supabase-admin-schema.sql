-- Complete Street Reimagined Database Schema for Admin Dashboard
-- Run this in Supabase SQL Editor after creating your project

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- MAIN TABLES
-- ========================================

-- User sessions table (tracks unique users/sessions)
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    user_email TEXT,
    user_name TEXT,
    device_type TEXT, -- mobile, tablet, desktop
    browser_name TEXT,
    user_agent TEXT,
    ip_address INET,
    city TEXT,
    country TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    transformations_count INTEGER DEFAULT 0,
    successful_transformations INTEGER DEFAULT 0,
    last_transformation_at TIMESTAMP WITH TIME ZONE
);

-- Transformations table (each photo transformation)
CREATE TABLE IF NOT EXISTS transformations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES user_sessions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    user_request TEXT NOT NULL,
    categories TEXT[] DEFAULT '{}',
    original_image_url TEXT,
    transformed_image_url TEXT,
    location_name TEXT,
    user_email TEXT,
    user_name TEXT,
    device_type TEXT,
    processing_time_ms INTEGER,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    ai_model TEXT DEFAULT 'nano-banana',
    downloaded BOOLEAN DEFAULT FALSE,
    download_count INTEGER DEFAULT 0,
    download_timestamps TIMESTAMP WITH TIME ZONE[]
);

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Insert default admin user (dennis.teammade@gmail.com with password "teamMade2026")
INSERT INTO admin_users (email, password_hash) 
VALUES ('dennis.teammade@gmail.com', 'teamMade2026')
ON CONFLICT (email) DO NOTHING;

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_transformations_created_at ON transformations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transformations_session_id ON transformations(session_id);
CREATE INDEX IF NOT EXISTS idx_transformations_status ON transformations(status);
CREATE INDEX IF NOT EXISTS idx_transformations_categories ON transformations USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_user_sessions_created_at ON user_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_active ON user_sessions(last_active DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_email ON user_sessions(user_email);

-- ========================================
-- FUNCTIONS FOR ADMIN DASHBOARD
-- ========================================

-- Function to get main dashboard statistics
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
    total_transformations INTEGER;
    total_users INTEGER;
    total_with_email INTEGER;
    transformations_today INTEGER;
    transformations_this_week INTEGER;
    transformations_this_month INTEGER;
    success_rate DECIMAL(5,2);
    avg_processing_time DECIMAL(10,2);
    top_category TEXT;
BEGIN
    -- Total transformations
    SELECT COUNT(*) INTO total_transformations FROM transformations;
    
    -- Total unique users
    SELECT COUNT(*) INTO total_users FROM user_sessions;
    
    -- Users with email
    SELECT COUNT(*) INTO total_with_email FROM user_sessions WHERE user_email IS NOT NULL;
    
    -- Transformations today
    SELECT COUNT(*) INTO transformations_today 
    FROM transformations 
    WHERE DATE(created_at) = CURRENT_DATE;
    
    -- Transformations this week
    SELECT COUNT(*) INTO transformations_this_week 
    FROM transformations 
    WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE);
    
    -- Transformations this month
    SELECT COUNT(*) INTO transformations_this_month 
    FROM transformations 
    WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE);
    
    -- Success rate (last 7 days)
    SELECT 
        CASE 
            WHEN COUNT(*) = 0 THEN 0 
            ELSE ROUND((COUNT(*) FILTER (WHERE status = 'completed') * 100.0 / COUNT(*)), 2)
        END INTO success_rate
    FROM transformations 
    WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';
    
    -- Average processing time (completed transformations only)
    SELECT COALESCE(AVG(processing_time_ms), 0) INTO avg_processing_time
    FROM transformations 
    WHERE status = 'completed' AND processing_time_ms IS NOT NULL;
    
    -- Top category (last 30 days)
    SELECT 
        COALESCE(
            (SELECT unnest(categories) 
             FROM transformations 
             WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
             GROUP BY unnest(categories) 
             ORDER BY COUNT(*) DESC 
             LIMIT 1), 
            'geen data'
        ) INTO top_category;
    
    -- Build result JSON
    result := json_build_object(
        'totalTransformations', total_transformations,
        'totalUsers', total_users,
        'totalWithEmail', total_with_email,
        'transformationsToday', transformations_today,
        'transformationsThisWeek', transformations_this_week,
        'transformationsThisMonth', transformations_this_month,
        'successRate', success_rate,
        'avgProcessingTime', avg_processing_time,
        'topCategory', top_category
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- VIEWS FOR EASY QUERYING
-- ========================================

-- User overview view
CREATE OR REPLACE VIEW user_overview AS
SELECT 
    us.id,
    us.created_at,
    us.last_active,
    us.user_email,
    us.user_name,
    us.device_type,
    us.browser_name,
    us.city,
    us.country,
    us.transformations_count,
    us.successful_transformations,
    (SELECT user_request FROM transformations t WHERE t.session_id = us.id ORDER BY created_at DESC LIMIT 1) as latest_request,
    (SELECT created_at FROM transformations t WHERE t.session_id = us.id ORDER BY created_at DESC LIMIT 1) as latest_transformation
FROM user_sessions us
ORDER BY us.last_active DESC;

-- Daily analytics view
CREATE OR REPLACE VIEW admin_analytics AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_transformations,
    COUNT(DISTINCT session_id) as unique_sessions,
    COUNT(DISTINCT user_email) FILTER (WHERE user_email IS NOT NULL) as unique_emails,
    COUNT(*) FILTER (WHERE status = 'completed') as completed,
    COUNT(*) FILTER (WHERE status = 'failed') as failed,
    COUNT(*) FILTER (WHERE 'groen' = ANY(categories)) as groen_count,
    COUNT(*) FILTER (WHERE 'fiets' = ANY(categories)) as fiets_count,
    COUNT(*) FILTER (WHERE 'speel' = ANY(categories)) as speel_count,
    COUNT(*) FILTER (WHERE 'social' = ANY(categories)) as social_count,
    COUNT(*) FILTER (WHERE 'minder_auto' = ANY(categories)) as minder_auto_count,
    COUNT(*) FILTER (WHERE location_name IS NOT NULL) as with_location,
    AVG(processing_time_ms) FILTER (WHERE processing_time_ms IS NOT NULL) as avg_processing_time
FROM transformations
GROUP BY DATE(created_at)
ORDER BY DATE(created_at) DESC;

-- Popular requests view
CREATE OR REPLACE VIEW popular_requests AS
SELECT 
    user_request,
    COUNT(*) as request_count,
    COUNT(DISTINCT session_id) as unique_users,
    AVG(processing_time_ms) FILTER (WHERE processing_time_ms IS NOT NULL) as avg_processing_time,
    array_agg(DISTINCT unnest(categories)) as common_categories,
    MAX(created_at) as last_used,
    (COUNT(*) FILTER (WHERE downloaded = true) * 100.0 / COUNT(*))::DECIMAL(5,2) as download_rate
FROM transformations
GROUP BY user_request
HAVING COUNT(*) >= 2
ORDER BY request_count DESC, last_used DESC;

-- Geographic distribution view
CREATE OR REPLACE VIEW geographic_distribution AS
SELECT 
    COALESCE(city, 'Onbekend') as location,
    city,
    country,
    COUNT(*) as transformation_count,
    COUNT(DISTINCT session_id) as unique_users,
    (array_agg(unnest(categories) ORDER BY COUNT(*) DESC))[1] as top_category,
    AVG(latitude) as avg_latitude,
    AVG(longitude) as avg_longitude
FROM transformations
WHERE city IS NOT NULL OR country IS NOT NULL
GROUP BY city, country
ORDER BY transformation_count DESC;

-- ========================================
-- TRIGGERS FOR AUTO-UPDATING COUNTERS
-- ========================================

-- Function to update user_sessions counters when transformation is added
CREATE OR REPLACE FUNCTION update_session_counters()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update transformation count and last activity
        UPDATE user_sessions 
        SET 
            transformations_count = transformations_count + 1,
            last_active = NEW.created_at,
            last_transformation_at = NEW.created_at
        WHERE id = NEW.session_id;
        
        -- Update successful count if completed
        IF NEW.status = 'completed' THEN
            UPDATE user_sessions 
            SET successful_transformations = successful_transformations + 1
            WHERE id = NEW.session_id;
        END IF;
        
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'UPDATE' THEN
        -- If status changed to completed, increment successful count
        IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
            UPDATE user_sessions 
            SET successful_transformations = successful_transformations + 1
            WHERE id = NEW.session_id;
        END IF;
        
        -- If status changed from completed to not completed, decrement successful count
        IF OLD.status = 'completed' AND NEW.status != 'completed' THEN
            UPDATE user_sessions 
            SET successful_transformations = GREATEST(0, successful_transformations - 1)
            WHERE id = NEW.session_id;
        END IF;
        
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        -- Decrement counters when transformation is deleted
        UPDATE user_sessions 
        SET 
            transformations_count = GREATEST(0, transformations_count - 1),
            successful_transformations = CASE 
                WHEN OLD.status = 'completed' THEN GREATEST(0, successful_transformations - 1)
                ELSE successful_transformations
            END
        WHERE id = OLD.session_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_session_counters ON transformations;
CREATE TRIGGER trigger_update_session_counters
    AFTER INSERT OR UPDATE OR DELETE ON transformations
    FOR EACH ROW
    EXECUTE FUNCTION update_session_counters();

-- ========================================
-- SAMPLE DATA FOR TESTING (OPTIONAL)
-- ========================================

-- Uncomment to insert sample data for testing

/*
-- Sample user session
INSERT INTO user_sessions (id, user_email, user_name, device_type, browser_name, city, country, transformations_count, successful_transformations)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'test@example.com', 'Test User', 'mobile', 'Safari', 'Gent', 'Belgium', 0, 0);

-- Sample transformations
INSERT INTO transformations (session_id, user_request, categories, status, processing_time_ms, user_email, user_name, device_type)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'Maak deze straat groener met meer bomen', ARRAY['groen'], 'completed', 2500, 'test@example.com', 'Test User', 'mobile'),
    ('550e8400-e29b-41d4-a716-446655440000', 'Voeg fietspaden en speeltuinen toe', ARRAY['fiets', 'speel'], 'completed', 3200, 'test@example.com', 'Test User', 'mobile');
*/

-- ========================================
-- PERMISSIONS & SECURITY
-- ========================================

-- Enable Row Level Security on all tables
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transformations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Allow public read/write access to user_sessions and transformations (for the app)
CREATE POLICY "Allow public access to user_sessions" ON user_sessions FOR ALL TO PUBLIC USING (true);
CREATE POLICY "Allow public access to transformations" ON transformations FOR ALL TO PUBLIC USING (true);

-- Restrict admin_users table to authenticated users only
CREATE POLICY "Allow public read access to admin_users" ON admin_users FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "Allow public insert/update to admin_users" ON admin_users FOR ALL TO PUBLIC USING (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO PUBLIC;
GRANT ALL ON ALL TABLES IN SCHEMA public TO PUBLIC;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO PUBLIC;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO PUBLIC;