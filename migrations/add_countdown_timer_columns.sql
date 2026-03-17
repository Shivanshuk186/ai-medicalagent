-- Add countdown timer columns to emergency_queue table
ALTER TABLE emergency_queue
ADD COLUMN IF NOT EXISTS serve_start_time VARCHAR,
ADD COLUMN IF NOT EXISTS completed_at VARCHAR;

-- Create an index on serve_start_time for faster queries
CREATE INDEX IF NOT EXISTS idx_emergency_queue_serve_start_time ON emergency_queue (serve_start_time);