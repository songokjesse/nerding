-- AlterTable: Add banned field to user table
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banned" BOOLEAN NOT NULL DEFAULT false;

-- CreateEnum: ModuleType
DO $$ BEGIN
 CREATE TYPE "ModuleType" AS ENUM ('BOWEL_MONITORING', 'FLUID_INTAKE', 'BEHAVIOUR_OBSERVATION', 'SEIZURE_MONITORING');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- CreateTable: client_module
CREATE TABLE IF NOT EXISTS "client_module" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "moduleType" "ModuleType" NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_module_pkey" PRIMARY KEY ("id")
);

-- CreateTable: observation
CREATE TABLE IF NOT EXISTS "observation" (
    "id" TEXT NOT NULL,
    "progressNoteId" TEXT NOT NULL,
    "type" "ModuleType" NOT NULL,
    "data" JSONB NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "observation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "client_module_clientId_moduleType_key" ON "client_module"("clientId", "moduleType");

-- AddForeignKey
DO $$ BEGIN
 ALTER TABLE "client_module" ADD CONSTRAINT "client_module_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
 ALTER TABLE "observation" ADD CONSTRAINT "observation_progressNoteId_fkey" FOREIGN KEY ("progressNoteId") REFERENCES "progress_note"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
