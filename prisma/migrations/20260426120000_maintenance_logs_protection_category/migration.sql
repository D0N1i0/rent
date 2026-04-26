-- Migration: add maintenance logs and protection category for extras
-- 2026-04-26

-- Add protection category to extras (insurance/CDW tiers)
ALTER TABLE "extras" ADD COLUMN IF NOT EXISTS "protectionCategory" TEXT;

-- Create car maintenance logs table
CREATE TABLE IF NOT EXISTS "car_maintenance_logs" (
    "id" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "serviceDate" TIMESTAMP(3) NOT NULL,
    "maintenanceType" TEXT NOT NULL,
    "description" TEXT,
    "odometer" INTEGER,
    "cost" DECIMAL(10,2),
    "performedBy" TEXT,
    "nextServiceDate" TIMESTAMP(3),
    "nextServiceKm" INTEGER,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "car_maintenance_logs_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
ALTER TABLE "car_maintenance_logs"
    ADD CONSTRAINT "car_maintenance_logs_carId_fkey"
    FOREIGN KEY ("carId") REFERENCES "cars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS "car_maintenance_logs_carId_idx" ON "car_maintenance_logs"("carId");
CREATE INDEX IF NOT EXISTS "car_maintenance_logs_carId_serviceDate_idx" ON "car_maintenance_logs"("carId", "serviceDate");
