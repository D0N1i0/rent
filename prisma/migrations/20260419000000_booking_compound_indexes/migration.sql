-- CreateIndex
CREATE INDEX IF NOT EXISTS "bookings_carId_status_pickupDateTime_idx" ON "bookings"("carId", "status", "pickupDateTime");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "bookings_status_createdAt_idx" ON "bookings"("status", "createdAt");
