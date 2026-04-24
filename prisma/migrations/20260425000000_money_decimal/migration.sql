-- Migration: Float → Decimal for all money/price fields
-- Converts IEEE 754 DOUBLE PRECISION columns to NUMERIC for exact decimal storage.
-- Existing data is preserved; PostgreSQL casts FLOAT8 → NUMERIC without data loss.

-- ── Car ──────────────────────────────────────────────────────────────────────
ALTER TABLE "cars"
  ALTER COLUMN "pricePerDay"  TYPE DECIMAL(10,2) USING "pricePerDay"::DECIMAL(10,2),
  ALTER COLUMN "pricePerWeek" TYPE DECIMAL(10,2) USING "pricePerWeek"::DECIMAL(10,2),
  ALTER COLUMN "pricePerMonth" TYPE DECIMAL(10,2) USING "pricePerMonth"::DECIMAL(10,2),
  ALTER COLUMN "deposit"      TYPE DECIMAL(10,2) USING "deposit"::DECIMAL(10,2),
  ALTER COLUMN "extraKmFee"   TYPE DECIMAL(10,2) USING "extraKmFee"::DECIMAL(10,2);

-- ── SeasonalPricing ──────────────────────────────────────────────────────────
ALTER TABLE "seasonal_pricing"
  ALTER COLUMN "pricePerDay"  TYPE DECIMAL(10,2) USING "pricePerDay"::DECIMAL(10,2),
  ALTER COLUMN "pricePerWeek" TYPE DECIMAL(10,2) USING "pricePerWeek"::DECIMAL(10,2);

-- ── Location ─────────────────────────────────────────────────────────────────
ALTER TABLE "locations"
  ALTER COLUMN "pickupFee"  TYPE DECIMAL(10,2) USING "pickupFee"::DECIMAL(10,2),
  ALTER COLUMN "dropoffFee" TYPE DECIMAL(10,2) USING "dropoffFee"::DECIMAL(10,2);

-- ── Extra ────────────────────────────────────────────────────────────────────
ALTER TABLE "extras"
  ALTER COLUMN "price" TYPE DECIMAL(10,2) USING "price"::DECIMAL(10,2);

-- ── Booking (pricing snapshot) ────────────────────────────────────────────────
ALTER TABLE "bookings"
  ALTER COLUMN "basePricePerDay"  TYPE DECIMAL(10,2) USING "basePricePerDay"::DECIMAL(10,2),
  ALTER COLUMN "subtotal"         TYPE DECIMAL(10,2) USING "subtotal"::DECIMAL(10,2),
  ALTER COLUMN "extrasTotal"      TYPE DECIMAL(10,2) USING "extrasTotal"::DECIMAL(10,2),
  ALTER COLUMN "pickupFee"        TYPE DECIMAL(10,2) USING "pickupFee"::DECIMAL(10,2),
  ALTER COLUMN "dropoffFee"       TYPE DECIMAL(10,2) USING "dropoffFee"::DECIMAL(10,2),
  ALTER COLUMN "discount"         TYPE DECIMAL(10,2) USING "discount"::DECIMAL(10,2),
  ALTER COLUMN "vatRate"          TYPE DECIMAL(5,4)  USING "vatRate"::DECIMAL(5,4),
  ALTER COLUMN "vatAmount"        TYPE DECIMAL(10,2) USING "vatAmount"::DECIMAL(10,2),
  ALTER COLUMN "cancellationFee"  TYPE DECIMAL(10,2) USING "cancellationFee"::DECIMAL(10,2),
  ALTER COLUMN "depositAmount"    TYPE DECIMAL(10,2) USING "depositAmount"::DECIMAL(10,2),
  ALTER COLUMN "totalAmount"      TYPE DECIMAL(10,2) USING "totalAmount"::DECIMAL(10,2);

-- ── BookingExtra ──────────────────────────────────────────────────────────────
ALTER TABLE "booking_extras"
  ALTER COLUMN "price" TYPE DECIMAL(10,2) USING "price"::DECIMAL(10,2),
  ALTER COLUMN "total" TYPE DECIMAL(10,2) USING "total"::DECIMAL(10,2);

-- ── Offer ────────────────────────────────────────────────────────────────────
ALTER TABLE "offers"
  ALTER COLUMN "discountPct"  TYPE DECIMAL(5,2)  USING "discountPct"::DECIMAL(5,2),
  ALTER COLUMN "discountAmt"  TYPE DECIMAL(10,2) USING "discountAmt"::DECIMAL(10,2),
  ALTER COLUMN "minSubtotal"  TYPE DECIMAL(10,2) USING "minSubtotal"::DECIMAL(10,2);
