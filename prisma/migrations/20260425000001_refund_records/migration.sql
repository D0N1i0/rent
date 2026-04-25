-- Migration: add amountRefunded to bookings + new refund_records table

ALTER TABLE "bookings"
  ADD COLUMN "amountRefunded" DECIMAL(10,2) NOT NULL DEFAULT 0;

CREATE TABLE "refund_records" (
  "id"             TEXT          NOT NULL,
  "bookingId"      TEXT          NOT NULL,
  "stripeRefundId" TEXT          NOT NULL,
  "amount"         DECIMAL(10,2) NOT NULL,
  "reason"         TEXT          NOT NULL,
  "status"         TEXT          NOT NULL DEFAULT 'SUCCEEDED',
  "initiatedById"  TEXT,
  "createdAt"      TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "refund_records_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "refund_records_stripeRefundId_key" ON "refund_records"("stripeRefundId");
CREATE INDEX "refund_records_bookingId_idx" ON "refund_records"("bookingId");

ALTER TABLE "refund_records"
  ADD CONSTRAINT "refund_records_bookingId_fkey"
    FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "refund_records"
  ADD CONSTRAINT "refund_records_initiatedById_fkey"
    FOREIGN KEY ("initiatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
