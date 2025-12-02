-- Migration: Add Rules Engine Tables
-- This migration adds WorkerCredential, ClientRequirement, and SILStaffingRule tables

-- CreateEnum: CredentialType
DO $$ BEGIN
 CREATE TYPE "CredentialType" AS ENUM (
    'NDIS_WORKER_SCREENING',
    'WORKING_WITH_CHILDREN',
    'FIRST_AID_CPR',
    'MANUAL_HANDLING',
    'MEDICATION_ADMINISTRATION',
    'PBS_TRAINING',
    'HIGH_INTENSITY_CATHETER',
    'HIGH_INTENSITY_PEG',
    'HIGH_INTENSITY_DIABETES',
    'HIGH_INTENSITY_SEIZURE',
    'HIGH_INTENSITY_BEHAVIOUR',
    'DRIVER_LICENSE',
    'OTHER'
 );
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- CreateEnum: RiskLevel
DO $$ BEGIN
 CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- CreateEnum: ShiftType
DO $$ BEGIN
 CREATE TYPE "ShiftType" AS ENUM (
    'STANDARD',
    'SLEEPOVER',
    'ACTIVE_OVERNIGHT',
    'EVENING',
    'WEEKEND',
    'PUBLIC_HOLIDAY'
 );
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- CreateEnum: ValidationStatus
DO $$ BEGIN
 CREATE TYPE "ValidationStatus" AS ENUM ('PENDING', 'VALID', 'WARNING', 'BLOCKED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- CreateTable: worker_credential
CREATE TABLE IF NOT EXISTS "worker_credential" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "type" "CredentialType" NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "documentUrl" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "worker_credential_pkey" PRIMARY KEY ("id")
);

-- CreateTable: client_requirement
CREATE TABLE IF NOT EXISTS "client_requirement" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "requiresHighIntensity" BOOLEAN NOT NULL DEFAULT false,
    "highIntensityTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "genderPreference" TEXT,
    "bannedWorkerIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredWorkerIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requiresBSP" BOOLEAN NOT NULL DEFAULT false,
    "bspRequires2to1" BOOLEAN NOT NULL DEFAULT false,
    "bspRequiredGender" TEXT,
    "bspRequiresPBS" BOOLEAN NOT NULL DEFAULT false,
    "requiresTransfers" BOOLEAN NOT NULL DEFAULT false,
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'LOW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_requirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable: sil_staffing_rule
CREATE TABLE IF NOT EXISTS "sil_staffing_rule" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "timeOfDay" TEXT NOT NULL,
    "participantCount" INTEGER NOT NULL,
    "requiredStaff" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sil_staffing_rule_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Add new fields to shift table
ALTER TABLE "shift" ADD COLUMN IF NOT EXISTS "shiftType" "ShiftType" DEFAULT 'STANDARD';
ALTER TABLE "shift" ADD COLUMN IF NOT EXISTS "validationStatus" "ValidationStatus" DEFAULT 'PENDING';
ALTER TABLE "shift" ADD COLUMN IF NOT EXISTS "validationErrors" JSONB;
ALTER TABLE "shift" ADD COLUMN IF NOT EXISTS "isHighIntensity" BOOLEAN DEFAULT false;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "worker_credential_workerId_idx" ON "worker_credential"("workerId");
CREATE INDEX IF NOT EXISTS "worker_credential_type_idx" ON "worker_credential"("type");
CREATE INDEX IF NOT EXISTS "worker_credential_expiryDate_idx" ON "worker_credential"("expiryDate");

CREATE UNIQUE INDEX IF NOT EXISTS "client_requirement_clientId_key" ON "client_requirement"("clientId");
CREATE INDEX IF NOT EXISTS "client_requirement_riskLevel_idx" ON "client_requirement"("riskLevel");

CREATE INDEX IF NOT EXISTS "sil_staffing_rule_siteId_idx" ON "sil_staffing_rule"("siteId");
CREATE INDEX IF NOT EXISTS "sil_staffing_rule_timeOfDay_idx" ON "sil_staffing_rule"("timeOfDay");

-- AddForeignKey
DO $$ BEGIN
 ALTER TABLE "worker_credential" ADD CONSTRAINT "worker_credential_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "client_requirement" ADD CONSTRAINT "client_requirement_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "sil_staffing_rule" ADD CONSTRAINT "sil_staffing_rule_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
