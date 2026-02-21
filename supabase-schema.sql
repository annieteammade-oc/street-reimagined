-- Supabase Database Schema for Street Reimagined
-- Run this in Supabase SQL Editor after creating project

-- Enable Row Level Security
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Transformations table - store all photo transformations
CREATE TABLE transformations (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Image data
  original_image_url text,
  transformed_image_url text,
  
  -- Request data
  user_request text NOT NULL,
  categories text[] DEFAULT '{}',
  
  -- Location (optional)
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  location_name text,
  
  -- Analytics
  ai_model text DEFAULT 'gemini-3-pro-image-preview',
  processing_time_ms integer,
  
  -- User session (anonymous)
  session_id uuid,
  
  -- Status
  status text DEFAULT 'completed' CHECK (status IN ('processing', 'completed', 'failed'))
);

-- Categories table - predefined transformation categories
CREATE TABLE categories (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text,
  icon text,
  color text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert default categories
INSERT INTO categories (name, description, icon, color) VALUES
  ('groen', 'Meer bomen, planten en groene ruimte', '🌳', '#10B981'),
  ('fiets', 'Fietspaden en fietsinfrastructuur', '🚴', '#3B82F6'),
  ('speel', 'Speeltuinen en kindvriendelijke ruimte', '🎪', '#F59E0B'),
  ('social', 'Terrassen, banken en ontmoetingsplekken', '☕', '#8B5CF6'),
  ('minder_auto', 'Minder parkeerplaatsen en autoverkeer', '🚗', '#EF4444'),
  ('other', 'Andere transformatie wensen', '✨', '#6B7280');

-- User sessions table - anonymous user tracking
CREATE TABLE user_sessions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_active timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  transformations_count integer DEFAULT 0,
  
  -- Optional user info (if they provide it)
  location_name text,
  device_info jsonb
);

-- Analytics view - aggregated insights
CREATE VIEW transformation_analytics AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_transformations,
  COUNT(DISTINCT session_id) as unique_users,
  
  -- Category breakdown
  SUM(CASE WHEN 'groen' = ANY(categories) THEN 1 ELSE 0 END) as groen_count,
  SUM(CASE WHEN 'fiets' = ANY(categories) THEN 1 ELSE 0 END) as fiets_count,
  SUM(CASE WHEN 'speel' = ANY(categories) THEN 1 ELSE 0 END) as speel_count,
  SUM(CASE WHEN 'social' = ANY(categories) THEN 1 ELSE 0 END) as social_count,
  SUM(CASE WHEN 'minder_auto' = ANY(categories) THEN 1 ELSE 0 END) as minder_auto_count,
  SUM(CASE WHEN 'other' = ANY(categories) THEN 1 ELSE 0 END) as other_count,
  
  -- Location stats
  COUNT(CASE WHEN latitude IS NOT NULL THEN 1 END) as with_location_count,
  
  -- Performance stats
  AVG(processing_time_ms) as avg_processing_time,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count
FROM transformations
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Row Level Security Policies
ALTER TABLE transformations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Public read access for analytics
CREATE POLICY "Public read access for transformations" ON transformations
  FOR SELECT USING (true);

CREATE POLICY "Public insert access for transformations" ON transformations  
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public access for user_sessions" ON user_sessions
  FOR ALL USING (true);

-- Indexes for performance
CREATE INDEX idx_transformations_created_at ON transformations(created_at);
CREATE INDEX idx_transformations_categories ON transformations USING GIN(categories);
CREATE INDEX idx_transformations_location ON transformations(latitude, longitude) 
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX idx_transformations_session ON transformations(session_id);

-- Functions for analytics
CREATE OR REPLACE FUNCTION get_popular_requests(limit_count integer DEFAULT 10)
RETURNS TABLE(request text, count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT user_request, COUNT(*) as request_count
  FROM transformations
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY user_request
  ORDER BY request_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;