-- Complete Supabase Schema for Street Reimagined
-- Enhanced with photo storage, admin auth, and detailed tracking

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Storage buckets for images
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('original-photos', 'original-photos', true),
  ('transformed-photos', 'transformed-photos', true)
ON CONFLICT DO NOTHING;

-- Admin users table - for dashboard access
CREATE TABLE admin_users (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  name text NOT NULL,
  role text DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  last_login timestamp with time zone,
  active boolean DEFAULT true
);

-- Insert default admin (Dennis)
INSERT INTO admin_users (email, password_hash, name, role) VALUES 
  ('dennis.teammade@gmail.com', crypt('TeamMade2024', gen_salt('bf')), 'Dennis Matthijs', 'super_admin')
ON CONFLICT (email) DO NOTHING;

-- Enhanced transformations table with full data capture
CREATE TABLE transformations (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Image storage (Supabase Storage URLs)
  original_image_url text,
  original_image_path text,
  transformed_image_url text, 
  transformed_image_path text,
  
  -- User request and AI data
  user_request text NOT NULL,
  categories text[] DEFAULT '{}',
  ai_model text DEFAULT 'gemini-3-pro-image-preview',
  ai_prompt text, -- Full prompt sent to AI
  processing_time_ms integer,
  
  -- Location data (detailed)
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  location_name text,
  location_accuracy integer, -- GPS accuracy in meters
  location_source text, -- 'gps', 'manual', 'ip', etc.
  
  -- User data (optional - collected if provided)
  user_email text,
  user_name text,
  user_phone text,
  
  -- Session and device tracking
  session_id uuid,
  user_agent text,
  ip_address inet,
  device_type text, -- 'mobile', 'tablet', 'desktop'
  browser_info jsonb,
  
  -- Status and quality
  status text DEFAULT 'completed' CHECK (status IN ('processing', 'completed', 'failed', 'pending_review')),
  quality_score integer CHECK (quality_score >= 1 AND quality_score <= 5),
  admin_notes text,
  
  -- Usage tracking
  downloaded boolean DEFAULT false,
  download_count integer DEFAULT 0,
  shared boolean DEFAULT false,
  share_count integer DEFAULT 0,
  
  CONSTRAINT transformations_email_check CHECK (user_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- User sessions with detailed tracking
CREATE TABLE user_sessions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_active timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  session_duration_ms bigint DEFAULT 0,
  
  -- Transformation stats
  transformations_count integer DEFAULT 0,
  successful_transformations integer DEFAULT 0,
  failed_transformations integer DEFAULT 0,
  
  -- User info (if provided)
  user_email text,
  user_name text,
  contact_method text, -- 'email', 'phone', 'none'
  
  -- Technical info
  first_ip_address inet,
  user_agent text,
  device_type text,
  browser_name text,
  os_name text,
  screen_resolution text,
  
  -- Geographic
  country text,
  region text,
  city text,
  
  -- Engagement
  pages_visited integer DEFAULT 1,
  time_on_site_ms bigint DEFAULT 0,
  
  CONSTRAINT sessions_email_check CHECK (user_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Categories with enhanced metadata
CREATE TABLE categories (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  icon text,
  color text,
  sort_order integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert enhanced categories
INSERT INTO categories (name, display_name, description, icon, color, sort_order) VALUES
  ('groen', 'Meer Groen', 'Bomen, planten, groene ruimte en parken', '🌳', '#10B981', 1),
  ('fiets', 'Fietsvriendelijk', 'Fietspaden, fietsenstallingen en fietsinfrastructuur', '🚴', '#3B82F6', 2),
  ('speel', 'Kindvriendelijk', 'Speeltuinen, speeltoestellen en kindveilige ruimte', '🎪', '#F59E0B', 3),
  ('social', 'Sociale Ruimte', 'Terrassen, banken, ontmoetingsplekken en community spaces', '☕', '#8B5CF6', 4),
  ('minder_auto', 'Minder Auto\'s', 'Minder parkeerplaatsen en autoverkeer', '🚗', '#EF4444', 5),
  ('wandel', 'Wandelvriendelijk', 'Voetgangersgebieden en wandelpaden', '🚶', '#06B6D4', 6),
  ('sport', 'Sport & Recreatie', 'Sportfaciliteiten en recreatiegebieden', '⚽', '#F97316', 7),
  ('cultuur', 'Cultuur & Kunst', 'Openlucht kunst, podia en culturele ruimte', '🎨', '#EC4899', 8),
  ('other', 'Overig', 'Andere transformatie wensen', '✨', '#6B7280', 99)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color;

-- Comprehensive analytics view
CREATE VIEW admin_analytics AS
SELECT 
  DATE(t.created_at) as date,
  COUNT(*) as total_transformations,
  COUNT(DISTINCT t.session_id) as unique_sessions,
  COUNT(DISTINCT t.user_email) FILTER (WHERE t.user_email IS NOT NULL) as unique_emails,
  
  -- Status breakdown
  COUNT(*) FILTER (WHERE t.status = 'completed') as completed,
  COUNT(*) FILTER (WHERE t.status = 'failed') as failed,
  COUNT(*) FILTER (WHERE t.status = 'processing') as processing,
  
  -- Category breakdown (dynamic)
  COUNT(*) FILTER (WHERE 'groen' = ANY(t.categories)) as groen_count,
  COUNT(*) FILTER (WHERE 'fiets' = ANY(t.categories)) as fiets_count,
  COUNT(*) FILTER (WHERE 'speel' = ANY(t.categories)) as speel_count,
  COUNT(*) FILTER (WHERE 'social' = ANY(t.categories)) as social_count,
  COUNT(*) FILTER (WHERE 'minder_auto' = ANY(t.categories)) as minder_auto_count,
  COUNT(*) FILTER (WHERE 'wandel' = ANY(t.categories)) as wandel_count,
  COUNT(*) FILTER (WHERE 'sport' = ANY(t.categories)) as sport_count,
  COUNT(*) FILTER (WHERE 'cultuur' = ANY(t.categories)) as cultuur_count,
  COUNT(*) FILTER (WHERE 'other' = ANY(t.categories)) as other_count,
  
  -- Location stats
  COUNT(*) FILTER (WHERE t.latitude IS NOT NULL) as with_location,
  COUNT(DISTINCT t.location_name) FILTER (WHERE t.location_name IS NOT NULL) as unique_locations,
  
  -- Performance stats
  AVG(t.processing_time_ms) as avg_processing_time,
  MAX(t.processing_time_ms) as max_processing_time,
  MIN(t.processing_time_ms) as min_processing_time,
  
  -- Engagement stats
  COUNT(*) FILTER (WHERE t.downloaded = true) as downloaded_count,
  COUNT(*) FILTER (WHERE t.shared = true) as shared_count,
  SUM(t.download_count) as total_downloads,
  SUM(t.share_count) as total_shares,
  
  -- Device breakdown
  COUNT(*) FILTER (WHERE t.device_type = 'mobile') as mobile_users,
  COUNT(*) FILTER (WHERE t.device_type = 'desktop') as desktop_users,
  COUNT(*) FILTER (WHERE t.device_type = 'tablet') as tablet_users
  
FROM transformations t
GROUP BY DATE(t.created_at)
ORDER BY date DESC;

-- User overview for admin
CREATE VIEW user_overview AS 
SELECT 
  s.id as session_id,
  s.user_email,
  s.user_name,
  s.created_at as first_visit,
  s.last_active,
  s.transformations_count,
  s.successful_transformations,
  s.device_type,
  s.browser_name,
  s.city,
  s.country,
  
  -- Latest transformation
  (SELECT t.user_request 
   FROM transformations t 
   WHERE t.session_id = s.id 
   ORDER BY t.created_at DESC 
   LIMIT 1) as latest_request,
   
  (SELECT t.created_at 
   FROM transformations t 
   WHERE t.session_id = s.id 
   ORDER BY t.created_at DESC 
   LIMIT 1) as latest_transformation
   
FROM user_sessions s
WHERE s.transformations_count > 0
ORDER BY s.last_active DESC;

-- Popular requests view
CREATE VIEW popular_requests AS
SELECT 
  user_request,
  COUNT(*) as request_count,
  COUNT(DISTINCT session_id) as unique_users,
  AVG(processing_time_ms) as avg_processing_time,
  ARRAY_AGG(DISTINCT unnest(categories)) as common_categories,
  MAX(created_at) as last_used,
  COUNT(*) FILTER (WHERE downloaded = true) as download_rate
FROM transformations
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND status = 'completed'
GROUP BY user_request
HAVING COUNT(*) >= 2
ORDER BY request_count DESC, last_used DESC;

-- Geographic distribution view
CREATE VIEW geographic_distribution AS
SELECT 
  COALESCE(location_name, 'Unknown Location') as location,
  COALESCE(s.city, 'Unknown City') as city,
  COALESCE(s.country, 'Unknown Country') as country,
  COUNT(*) as transformation_count,
  COUNT(DISTINCT t.session_id) as unique_users,
  
  -- Most popular category in this location
  (SELECT unnest(categories) as category
   FROM transformations t2 
   WHERE (t2.location_name = t.location_name OR (t2.location_name IS NULL AND t.location_name IS NULL))
     AND t2.session_id IN (SELECT id FROM user_sessions WHERE city = s.city OR city IS NULL)
   GROUP BY category 
   ORDER BY COUNT(*) DESC 
   LIMIT 1) as top_category,
   
  AVG(t.latitude) as avg_latitude,
  AVG(t.longitude) as avg_longitude
  
FROM transformations t
LEFT JOIN user_sessions s ON t.session_id = s.id
WHERE t.created_at >= NOW() - INTERVAL '90 days'
GROUP BY location_name, s.city, s.country
HAVING COUNT(*) >= 1
ORDER BY transformation_count DESC;

-- Indexes for performance
CREATE INDEX idx_transformations_created_at ON transformations(created_at);
CREATE INDEX idx_transformations_status ON transformations(status);
CREATE INDEX idx_transformations_categories ON transformations USING GIN(categories);
CREATE INDEX idx_transformations_location ON transformations(latitude, longitude) WHERE latitude IS NOT NULL;
CREATE INDEX idx_transformations_session ON transformations(session_id);
CREATE INDEX idx_transformations_user_email ON transformations(user_email) WHERE user_email IS NOT NULL;
CREATE INDEX idx_sessions_email ON user_sessions(user_email) WHERE user_email IS NOT NULL;
CREATE INDEX idx_sessions_last_active ON user_sessions(last_active);

-- Row Level Security
ALTER TABLE transformations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Public access for app functionality
CREATE POLICY "Public read/insert for transformations" ON transformations
  FOR ALL USING (true);

CREATE POLICY "Public access for sessions" ON user_sessions
  FOR ALL USING (true);

-- Admin-only access for admin_users table
CREATE POLICY "Admin users can manage admins" ON admin_users
  FOR ALL USING (auth.role() = 'authenticated');

-- Storage policies for image uploads
CREATE POLICY "Public read access for original photos" ON storage.objects FOR SELECT USING (bucket_id = 'original-photos');
CREATE POLICY "Public read access for transformed photos" ON storage.objects FOR SELECT USING (bucket_id = 'transformed-photos');
CREATE POLICY "Authenticated users can upload photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('original-photos', 'transformed-photos'));

-- Useful functions for admin
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_transformations', (SELECT COUNT(*) FROM transformations),
    'total_users', (SELECT COUNT(DISTINCT session_id) FROM transformations),
    'total_with_email', (SELECT COUNT(DISTINCT user_email) FROM transformations WHERE user_email IS NOT NULL),
    'transformations_today', (SELECT COUNT(*) FROM transformations WHERE created_at::date = CURRENT_DATE),
    'transformations_this_week', (SELECT COUNT(*) FROM transformations WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'),
    'transformations_this_month', (SELECT COUNT(*) FROM transformations WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'),
    'success_rate', (
      SELECT ROUND(
        (COUNT(*) FILTER (WHERE status = 'completed')::numeric / NULLIF(COUNT(*), 0)) * 100, 
        2
      ) 
      FROM transformations 
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
    ),
    'avg_processing_time', (
      SELECT ROUND(AVG(processing_time_ms), 0) 
      FROM transformations 
      WHERE status = 'completed' AND processing_time_ms IS NOT NULL
    ),
    'top_category', (
      SELECT unnest(categories) as category
      FROM transformations
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY category
      ORDER BY COUNT(*) DESC
      LIMIT 1
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to authenticate admin users
CREATE OR REPLACE FUNCTION authenticate_admin(user_email text, user_password text)
RETURNS jsonb AS $$
DECLARE
  user_record admin_users%rowtype;
  result jsonb;
BEGIN
  SELECT * INTO user_record 
  FROM admin_users 
  WHERE email = user_email 
    AND password_hash = crypt(user_password, password_hash)
    AND active = true;
    
  IF user_record.id IS NOT NULL THEN
    -- Update last login
    UPDATE admin_users 
    SET last_login = NOW() 
    WHERE id = user_record.id;
    
    result := jsonb_build_object(
      'success', true,
      'user', jsonb_build_object(
        'id', user_record.id,
        'email', user_record.email,
        'name', user_record.name,
        'role', user_record.role
      )
    );
  ELSE
    result := jsonb_build_object('success', false, 'error', 'Invalid credentials');
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;