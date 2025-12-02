-- Migration: Add Rostering Schema
-- This migration adds the many-to-many relationship tables and rostering models

-- CreateEnum: RuleType
DO $$ BEGIN
 CREATE TYPE "RuleType" AS ENUM ('HARD_CONSTRAINT', 'SOFT_PREFERENCE', 'OPTIMIZATION_GOAL', 'BUSINESS_RULE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- CreateTable: shift_client (Many-to-Many join table)
CREATE TABLE IF NOT EXISTS "shift_client" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shift_client_pkey" PRIMARY KEY ("id")
);

-- CreateTable: shift_worker (Many-to-Many join table)
CREATE TABLE IF NOT EXISTS "shift_worker" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shift_worker_pkey" PRIMARY KEY ("id")
);

-- CreateTable: rostering_rule
CREATE TABLE IF NOT EXISTS "rostering_rule" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "RuleType" NOT NULL,
    "ruleJson" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rostering_rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable: worker_availability
CREATE TABLE IF NOT EXISTS "worker_availability" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "worker_availability_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Add new fields to user table
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "qualifications" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "preferences" JSONB;

-- AlterTable: Add new fields to organisation table
ALTER TABLE "organisation" ADD COLUMN IF NOT EXISTS "rosteringRules" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "organisation" ADD COLUMN IF NOT EXISTS "defaultShiftDuration" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "shift_client_shiftId_clientId_key" ON "shift_client"("shiftId", "clientId");
CREATE INDEX IF NOT EXISTS "shift_client_shiftId_idx" ON "shift_client"("shiftId");
CREATE INDEX IF NOT EXISTS "shift_client_clientId_idx" ON "shift_client"("clientId");
CREATE INDEX IF NOT EXISTS "shift_client_organisationId_idx" ON "shift_client"("organisationId");

CREATE UNIQUE INDEX IF NOT EXISTS "shift_worker_shiftId_workerId_key" ON "shift_worker"("shiftId", "workerId");
CREATE INDEX IF NOT EXISTS "shift_worker_shiftId_idx" ON "shift_worker"("shiftId");
CREATE INDEX IF NOT EXISTS "shift_worker_workerId_idx" ON "shift_worker"("workerId");
CREATE INDEX IF NOT EXISTS "shift_worker_organisationId_idx" ON "shift_worker"("organisationId");

CREATE INDEX IF NOT EXISTS "rostering_rule_organisationId_idx" ON "rostering_rule"("organisationId");
CREATE INDEX IF NOT EXISTS "rostering_rule_type_idx" ON "rostering_rule"("type");

CREATE INDEX IF NOT EXISTS "worker_availability_workerId_idx" ON "worker_availability"("workerId");
CREATE INDEX IF NOT EXISTS "worker_availability_organisationId_idx" ON "worker_availability"("organisationId");
CREATE INDEX IF NOT EXISTS "worker_availability_date_idx" ON "worker_availability"("date");

-- AddForeignKey
DO $$ BEGIN
 ALTER TABLE "shift_client" ADD CONSTRAINT "shift_client_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "shift_client" ADD CONSTRAINT "shift_client_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "shift_client" ADD CONSTRAINT "shift_client_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "shift_worker" ADD CONSTRAINT "shift_worker_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "shift_worker" ADD CONSTRAINT "shift_worker_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "shift_worker" ADD CONSTRAINT "shift_worker_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "rostering_rule" ADD CONSTRAINT "rostering_rule_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "worker_availability" ADD CONSTRAINT "worker_availability_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "worker_availability" ADD CONSTRAINT "worker_availability_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Data Migration: Create join table entries for existing shifts
-- This migrates existing shifts that have direct clientId/workerId to use the new join tables
INSERT INTO "shift_client" ("id", "shiftId", "clientId", "organisationId", "createdAt")
SELECT 
    gen_random_uuid()::text,
    s.id,
    s."clientId",
    s."organisationId",
    s."createdAt"
FROM "shift" s
WHERE s."clientId" IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO "shift_worker" ("id", "shiftId", "workerId", "organisationId", "createdAt")
SELECT 
    gen_random_uuid()::text,
    s.id,
    s."workerId",
    s."organisationId",
    s."createdAt"
FROM "shift" s
WHERE s."workerId" IS NOT NULL
ON CONFLICT DO NOTHING;
