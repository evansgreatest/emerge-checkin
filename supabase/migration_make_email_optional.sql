-- Migration: Make email optional and add phone index
-- Run this if you already have the attendees table created

-- Make email optional (remove NOT NULL constraint)
ALTER TABLE attendees ALTER COLUMN email DROP NOT NULL;

-- Add index for phone number (for faster lookups)
CREATE INDEX IF NOT EXISTS idx_attendees_phone ON attendees(phone);

