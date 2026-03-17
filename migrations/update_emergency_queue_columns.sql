-- Add missing columns to emergency_queue table
ALTER TABLE "emergency_queue"
ADD COLUMN IF NOT EXISTS "patientName" varchar;

ALTER TABLE "emergency_queue"
ADD COLUMN IF NOT EXISTS "age" integer;

ALTER TABLE "emergency_queue"
ADD COLUMN IF NOT EXISTS "emergencyDescription" text;

ALTER TABLE "emergency_queue"
ADD COLUMN IF NOT EXISTS "aiAnalysis" json;

ALTER TABLE "emergency_queue"
ADD COLUMN IF NOT EXISTS "aiReason" text;

ALTER TABLE "emergency_queue"
ADD COLUMN IF NOT EXISTS "imageUrl" varchar;

ALTER TABLE "emergency_queue"
ADD COLUMN IF NOT EXISTS "approvedBy" varchar;

ALTER TABLE "emergency_queue"
ADD COLUMN IF NOT EXISTS "approvedAt" varchar;

ALTER TABLE "emergency_queue"
ADD COLUMN IF NOT EXISTS "completedAt" varchar;

-- Add unique constraint to patientId if it doesn't exist
ALTER TABLE "emergency_queue"
ADD CONSTRAINT "emergency_queue_patientId_unique" UNIQUE ("patientId");

-- Update status default value to 'pending_approval'
ALTER TABLE "emergency_queue"
ALTER COLUMN "status"
SET DEFAULT 'pending_approval';