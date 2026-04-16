/*
  Warnings:

  - A unique constraint covering the columns `[stripePaymentIntentId]` on the table `bookings` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "cancellationFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "documentIdUrl" TEXT,
ADD COLUMN     "documentLicenseUrl" TEXT,
ADD COLUMN     "stripeClientSecret" TEXT,
ADD COLUMN     "stripePaymentIntentId" TEXT,
ADD COLUMN     "vatAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "vatRate" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "bookings_stripePaymentIntentId_key" ON "bookings"("stripePaymentIntentId");
