CREATE TABLE IF NOT EXISTS "emergency_queue" (
    "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    "patientId" varchar NOT NULL,
    "symptoms" json NOT NULL,
    "priority" integer NOT NULL,
    "arrivalTime" varchar NOT NULL,
    "status" varchar DEFAULT 'waiting' NOT NULL,
    "assignedDoctor" varchar,
    "createdBy" varchar,
    "updatedAt" varchar
);

-- Backward compatibility if an older camelCase table already exists.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'emergencyQueue'
  ) THEN
    INSERT INTO "emergency_queue" ("patientId", "symptoms", "priority", "arrivalTime", "status", "assignedDoctor", "createdBy", "updatedAt")
    SELECT e."patientId", e."symptoms", e."priority", e."arrivalTime", e."status", e."assignedDoctor", e."createdBy", e."updatedAt"
    FROM "emergencyQueue" e;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'emergency_queue_createdBy_users_email_fk'
  ) THEN
    ALTER TABLE "emergency_queue"
      ADD CONSTRAINT "emergency_queue_createdBy_users_email_fk"
      FOREIGN KEY ("createdBy") REFERENCES "users"("email") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "emergency_queue_status_priority_idx" ON "emergency_queue" ("status", "priority", "id");