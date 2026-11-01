-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT NOT NULL DEFAULT '',
    "avatar" TEXT NOT NULL DEFAULT '',
    "roles" TEXT[] DEFAULT ARRAY['buyer']::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "priceUnit" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'available',
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "area" DOUBLE PRECISION NOT NULL,
    "areaUnit" TEXT NOT NULL DEFAULT 'sqft',
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL DEFAULT '',
    "images" TEXT[],
    "amenities" TEXT[],
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "yearBuilt" INTEGER NOT NULL DEFAULT 2020,
    "parkingSpaces" INTEGER NOT NULL DEFAULT 0,
    "agentName" TEXT NOT NULL DEFAULT '',
    "agentAvatar" TEXT NOT NULL DEFAULT '',
    "agentPhone" TEXT NOT NULL DEFAULT '',
    "agentEmail" TEXT NOT NULL DEFAULT '',
    "agentRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "agentListings" INTEGER NOT NULL DEFAULT 0,
    "latitude" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "longitude" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "mode" TEXT NOT NULL DEFAULT 'owner',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interiors" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "images" TEXT[],
    "designer" TEXT NOT NULL,
    "style" TEXT NOT NULL,
    "tags" TEXT[],
    "likes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interiors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interior_likes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "interiorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interior_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rentals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rentalState" TEXT NOT NULL DEFAULT 'onboarding',
    "rent" DOUBLE PRECISION NOT NULL,
    "deposit" DOUBLE PRECISION NOT NULL,
    "maintenanceSpendLimit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "startDate" TEXT,
    "endDate" TEXT,
    "escalationPct" DOUBLE PRECISION,
    "ownerApproval" BOOLEAN NOT NULL DEFAULT false,
    "depositReceived" BOOLEAN NOT NULL DEFAULT false,
    "depositSettled" BOOLEAN NOT NULL DEFAULT false,
    "duesCleared" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "propType" TEXT NOT NULL DEFAULT 'residential',
    "propUnitNo" TEXT NOT NULL,
    "propTower" TEXT,
    "propBlock" TEXT,
    "propFloor" INTEGER NOT NULL DEFAULT 0,
    "propCarpetArea" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "propFacing" TEXT,
    "propAddress" TEXT NOT NULL,
    "propLocality" TEXT NOT NULL,
    "propCity" TEXT NOT NULL,
    "propImage" TEXT NOT NULL DEFAULT '',
    "ownerName" TEXT NOT NULL,
    "ownerPhone" TEXT NOT NULL DEFAULT '',
    "ownerEmail" TEXT NOT NULL DEFAULT '',
    "ownerResidencyStatus" TEXT NOT NULL DEFAULT 'resident',
    "ownerAvatar" TEXT NOT NULL DEFAULT '',
    "tenantName" TEXT,
    "tenantPhone" TEXT,
    "tenantEmail" TEXT,
    "tenantResidencyStatus" TEXT,
    "tenantAvatar" TEXT,

    CONSTRAINT "rentals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_documents" (
    "id" TEXT NOT NULL,
    "rentalId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "isOnFile" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rental_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_inspections" (
    "id" TEXT NOT NULL,
    "rentalId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "conductedBy" TEXT NOT NULL,
    "conductedAt" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rental_inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_inspection_items" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "room" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "condition" TEXT NOT NULL,

    CONSTRAINT "rental_inspection_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_entries" (
    "id" TEXT NOT NULL,
    "rentalId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_userId_propertyId_key" ON "favorites"("userId", "propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "interior_likes_userId_interiorId_key" ON "interior_likes"("userId", "interiorId");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interior_likes" ADD CONSTRAINT "interior_likes_interiorId_fkey" FOREIGN KEY ("interiorId") REFERENCES "interiors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_documents" ADD CONSTRAINT "rental_documents_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "rentals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_inspections" ADD CONSTRAINT "rental_inspections_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "rentals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_inspection_items" ADD CONSTRAINT "rental_inspection_items_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "rental_inspections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "rentals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
