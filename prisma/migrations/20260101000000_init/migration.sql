-- CreateEnum
CREATE TYPE "DrinkSource" AS ENUM ('MANUAL', 'OPEN_FOOD_FACTS');

-- CreateEnum
CREATE TYPE "WebhookStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Drink" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "barcode" TEXT,
    "alcoholPercentage" DOUBLE PRECISION,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "categoryId" TEXT NOT NULL,
    "source" "DrinkSource" NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Drink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "drinkId" TEXT,
    "drinkName" TEXT NOT NULL,
    "webhookStatus" "WebhookStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Drink_barcode_key" ON "Drink"("barcode");

-- CreateIndex
CREATE INDEX "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- AddForeignKey
ALTER TABLE "Drink" ADD CONSTRAINT "Drink_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_drinkId_fkey" FOREIGN KEY ("drinkId") REFERENCES "Drink"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Default categories (UTC timestamps, spaced so the display order is stable)
INSERT INTO "Category" ("id", "name", "createdAt") VALUES
    (gen_random_uuid()::text, 'Bières', (now() AT TIME ZONE 'UTC') + interval '1 millisecond'),
    (gen_random_uuid()::text, 'Vins', (now() AT TIME ZONE 'UTC') + interval '2 milliseconds'),
    (gen_random_uuid()::text, 'Softs', (now() AT TIME ZONE 'UTC') + interval '3 milliseconds'),
    (gen_random_uuid()::text, 'Alcools', (now() AT TIME ZONE 'UTC') + interval '4 milliseconds'),
    (gen_random_uuid()::text, 'Cocktails', (now() AT TIME ZONE 'UTC') + interval '5 milliseconds'),
    (gen_random_uuid()::text, 'Sans alcool', (now() AT TIME ZONE 'UTC') + interval '6 milliseconds');
