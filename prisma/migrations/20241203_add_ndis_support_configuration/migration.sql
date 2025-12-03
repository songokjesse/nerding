-- CreateEnum
CREATE TYPE "SupportRatio" AS ENUM ('ONE_TO_ONE', 'TWO_TO_ONE', 'THREE_TO_ONE', 'ONE_TO_TWO', 'ONE_TO_THREE', 'ONE_TO_FOUR');

-- CreateEnum
CREATE TYPE "ShiftCategory" AS ENUM ('ACTIVE', 'SLEEPOVER', 'OVERNIGHT', 'RESPITE', 'TRANSPORT');

-- CreateEnum
CREATE TYPE "HouseType" AS ENUM ('STANDARD', 'HIGH_NEEDS', 'RESPITE', 'TRANSITIONAL');

-- AlterEnum
ALTER TYPE "ShiftType" ADD VALUE 'WEEKEND';
ALTER TYPE "ShiftType" ADD VALUE 'SPLIT';

-- AlterTable: ClientRequirement - Add NDIS Support Configuration
ALTER TABLE "client_requirement" ADD COLUMN "supportRatio" "SupportRatio" NOT NULL DEFAULT 'ONE_TO_ONE';
ALTER TABLE "client_requirement" ADD COLUMN "requiresOvernightSupport" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "client_requirement" ADD COLUMN "allowsSleepoverShifts" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: ClientRequirement - Add NDIS Funding
ALTER TABLE "client_requirement" ADD COLUMN "ndisAllocatedHours" DOUBLE PRECISION;
ALTER TABLE "client_requirement" ADD COLUMN "ndisFundingPeriod" TEXT;
ALTER TABLE "client_requirement" ADD COLUMN "ndisPlanStartDate" TIMESTAMP(3);
ALTER TABLE "client_requirement" ADD COLUMN "ndisPlanEndDate" TIMESTAMP(3);
ALTER TABLE "client_requirement" ADD COLUMN "hoursUsedThisPeriod" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "client_requirement" ADD COLUMN "hoursRemainingThisPeriod" DOUBLE PRECISION;
ALTER TABLE "client_requirement" ADD COLUMN "lastHoursUpdate" TIMESTAMP(3);

-- AlterTable: ClientRequirement - Add SIL-Specific Fields
ALTER TABLE "client_requirement" ADD COLUMN "isSILResident" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "client_requirement" ADD COLUMN "requiresConsistentStaff" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "client_requirement" ADD COLUMN "maxNewStaffPerMonth" INTEGER;
ALTER TABLE "client_requirement" ADD COLUMN "preferredShiftTimes" JSONB;

-- AlterTable: Shift - Add NDIS Shift Configuration
ALTER TABLE "shift" ADD COLUMN "shiftCategory" "ShiftCategory" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "shift" ADD COLUMN "supportRatio" "SupportRatio" NOT NULL DEFAULT 'ONE_TO_ONE';

-- AlterTable: Shift - Add Billing & Costing
ALTER TABLE "shift" ADD COLUMN "hourlyRate" DOUBLE PRECISION;
ALTER TABLE "shift" ADD COLUMN "totalCost" DOUBLE PRECISION;
ALTER TABLE "shift" ADD COLUMN "ndisLineItem" TEXT;
ALTER TABLE "shift" ADD COLUMN "isBillable" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable: Site - Add SIL-specific fields
ALTER TABLE "site" ADD COLUMN "isSILHouse" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "site" ADD COLUMN "houseType" "HouseType" NOT NULL DEFAULT 'STANDARD';
ALTER TABLE "site" ADD COLUMN "capacity" INTEGER;

-- CreateTable: SILHouseConfiguration
CREATE TABLE "sil_house_configuration" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "minimumStaffRatio" "SupportRatio" NOT NULL DEFAULT 'ONE_TO_ONE',
    "requiresOvernightStaff" BOOLEAN NOT NULL DEFAULT true,
    "requires24x7Coverage" BOOLEAN NOT NULL DEFAULT true,
    "minActiveHoursPerDay" DOUBLE PRECISION NOT NULL DEFAULT 16,
    "maxSleepoverHoursPerDay" DOUBLE PRECISION NOT NULL DEFAULT 8,
    "allowsSleepoverShifts" BOOLEAN NOT NULL DEFAULT true,
    "totalResidents" INTEGER NOT NULL DEFAULT 1,
    "maxResidentsPerWorker" INTEGER NOT NULL DEFAULT 3,
    "requiresMaleStaff" BOOLEAN NOT NULL DEFAULT false,
    "requiresFemaleStaff" BOOLEAN NOT NULL DEFAULT false,
    "preferredGenderMix" TEXT,
    "preferConsistentStaff" BOOLEAN NOT NULL DEFAULT true,
    "maxNewStaffPerWeek" INTEGER DEFAULT 2,
    "minShiftsBeforeAlone" INTEGER DEFAULT 3,
    "overnightSupportRatio" "SupportRatio",
    "allowsSingleOvernightStaff" BOOLEAN NOT NULL DEFAULT false,
    "requiresOnCallBackup" BOOLEAN NOT NULL DEFAULT true,
    "emergencyContactRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sil_house_configuration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sil_house_configuration_siteId_key" ON "sil_house_configuration"("siteId");

-- AddForeignKey
ALTER TABLE "sil_house_configuration" ADD CONSTRAINT "sil_house_configuration_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
