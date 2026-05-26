-- Migration: Username search performance indexes
-- Run this in your Supabase SQL Editor or via supabase db push
--
-- These indexes make the prefix search on username (ilike 'query%') 
-- use a B-tree index scan instead of a full table seq scan.
-- text_pattern_ops is required for LIKE/ILIKE prefix patterns in Postgres.

CREATE INDEX IF NOT EXISTS idx_profiles_username_lower
  ON profiles (lower(username) text_pattern_ops);

CREATE INDEX IF NOT EXISTS idx_profiles_full_name_lower
  ON profiles (lower(full_name) text_pattern_ops);
