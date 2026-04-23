-- Launch hardening indexes for hot booking, availability, pricing and admin list paths.
CREATE INDEX IF NOT EXISTS "bookings_userId_createdAt_idx" ON "bookings"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "bookings_carId_status_dropoffDateTime_idx" ON "bookings"("carId", "status", "dropoffDateTime");
CREATE INDEX IF NOT EXISTS "seasonal_pricing_carId_isActive_startDate_endDate_idx" ON "seasonal_pricing"("carId", "isActive", "startDate", "endDate");
CREATE INDEX IF NOT EXISTS "availability_blocks_carId_startDate_endDate_idx" ON "availability_blocks"("carId", "startDate", "endDate");
CREATE INDEX IF NOT EXISTS "offers_isActive_validFrom_validUntil_idx" ON "offers"("isActive", "validFrom", "validUntil");
