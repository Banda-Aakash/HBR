-- AlterTable
ALTER TABLE "bookings" ALTER COLUMN "status" SET DEFAULT 'pending';

-- CreateIndex
CREATE INDEX "bookings_userId_idx" ON "bookings"("userId");

-- CreateIndex
CREATE INDEX "bookings_propertyId_idx" ON "bookings"("propertyId");

-- CreateIndex
CREATE INDEX "favorites_propertyId_idx" ON "favorites"("propertyId");

-- CreateIndex
CREATE INDEX "interior_likes_interiorId_idx" ON "interior_likes"("interiorId");

-- CreateIndex
CREATE INDEX "ledger_entries_rentalId_idx" ON "ledger_entries"("rentalId");

-- CreateIndex
CREATE INDEX "rental_documents_rentalId_idx" ON "rental_documents"("rentalId");

-- CreateIndex
CREATE INDEX "rental_inspection_items_inspectionId_idx" ON "rental_inspection_items"("inspectionId");

-- CreateIndex
CREATE INDEX "rental_inspections_rentalId_idx" ON "rental_inspections"("rentalId");

-- CreateIndex
CREATE INDEX "rentals_userId_idx" ON "rentals"("userId");

-- CreateIndex
CREATE INDEX "rentals_rentalState_idx" ON "rentals"("rentalState");

-- A user can't hold the same slot twice, but can rebook one they cancelled.
-- Added by hand because Prisma can't describe a partial index in schema.prisma.
CREATE UNIQUE INDEX "bookings_active_slot_key" ON "bookings"("userId", "propertyId", "date", "time") WHERE "status" <> 'cancelled';
