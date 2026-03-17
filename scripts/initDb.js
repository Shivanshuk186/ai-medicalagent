const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function run() {
  await sql.query(`
    CREATE TABLE IF NOT EXISTS "users" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "name" varchar(255) NOT NULL,
      "email" varchar(255) NOT NULL UNIQUE,
      "credits" integer,
      "isPremium" boolean DEFAULT false,
      "premiumExpiresAt" varchar,
      "isAdmin" boolean DEFAULT false,
      "monthlyConsultations" integer DEFAULT 0,
      "consultationsResetDate" varchar
    );
  `);

  await sql.query(`
    CREATE TABLE IF NOT EXISTS "sessionChatTable" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "sessionId" varchar NOT NULL,
      "notes" text,
      "selectedDoctor" json,
      "conversation" json,
      "report" json,
      "uploadedReports" json,
      "createdBy" varchar,
      "createdOn" varchar
    );
  `);

  await sql.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'sessionChatTable_createdBy_users_email_fk'
      ) THEN
        ALTER TABLE "sessionChatTable"
          ADD CONSTRAINT "sessionChatTable_createdBy_users_email_fk"
          FOREIGN KEY ("createdBy") REFERENCES "users"("email") ON DELETE NO ACTION ON UPDATE NO ACTION;
      END IF;
    END $$;
  `);

  await sql.query(`
    CREATE TABLE IF NOT EXISTS "paymentTable" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "transactionId" varchar(255) NOT NULL UNIQUE,
      "userEmail" varchar NOT NULL,
      "amount" varchar NOT NULL,
      "status" varchar DEFAULT 'pending',
      "createdAt" varchar NOT NULL,
      "approvedAt" varchar,
      "approvedBy" varchar,
      "rejectionReason" text
    );
  `);

  await sql.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'paymentTable_userEmail_users_email_fk'
      ) THEN
        ALTER TABLE "paymentTable"
          ADD CONSTRAINT "paymentTable_userEmail_users_email_fk"
          FOREIGN KEY ("userEmail") REFERENCES "users"("email") ON DELETE NO ACTION ON UPDATE NO ACTION;
      END IF;
    END $$;
  `);

  await sql.query(`
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
  `);

  await sql.query(`
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
  `);

  await sql.query(`
    CREATE INDEX IF NOT EXISTS "emergency_queue_status_priority_idx"
      ON "emergency_queue" ("status", "priority", "id");
  `);

  console.log('DB schema initialized successfully.');
}

run().catch((error) => {
  console.error('DB init failed:', error);
  process.exit(1);
});
