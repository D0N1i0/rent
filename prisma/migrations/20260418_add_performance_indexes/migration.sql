-- Performance indexes: availability overlap queries, booking lookups, offer filtering

-- AvailabilityBlock: range queries for booking conflict checks
CREATE INDEX IF NOT EXISTS "availability_blocks_startDate_idx" ON "availability_blocks"("startDate");
CREATE INDEX IF NOT EXISTS "availability_blocks_endDate_idx" ON "availability_blocks"("endDate");
CREATE INDEX IF NOT EXISTS "availability_blocks_carId_startDate_endDate_idx" ON "availability_blocks"("carId", "startDate", "endDate");

-- Booking: additional lookup patterns
CREATE INDEX IF NOT EXISTS "bookings_dropoffDateTime_idx" ON "bookings"("dropoffDateTime");
CREATE INDEX IF NOT EXISTS "bookings_createdAt_idx" ON "bookings"("createdAt");
CREATE INDEX IF NOT EXISTS "bookings_carId_status_idx" ON "bookings"("carId", "status");
CREATE INDEX IF NOT EXISTS "bookings_guestEmail_idx" ON "bookings"("guestEmail");

-- Car: standalone isActive for queries that don't also filter isFeatured
CREATE INDEX IF NOT EXISTS "cars_isActive_idx" ON "cars"("isActive");

-- Offer: admin and coupon validation filtering
CREATE INDEX IF NOT EXISTS "offers_isActive_idx" ON "offers"("isActive");
CREATE INDEX IF NOT EXISTS "offers_validFrom_idx" ON "offers"("validFrom");
CREATE INDEX IF NOT EXISTS "offers_validUntil_idx" ON "offers"("validUntil");
