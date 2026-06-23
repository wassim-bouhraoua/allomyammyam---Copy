-- AlterTable
ALTER TABLE "dishes" ADD COLUMN     "calories" INTEGER,
ADD COLUMN     "carbs" INTEGER,
ADD COLUMN     "fat" INTEGER,
ADD COLUMN     "protein" INTEGER,
ADD COLUMN     "sugar" INTEGER;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "deliveryAddressId" TEXT;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_deliveryAddressId_fkey" FOREIGN KEY ("deliveryAddressId") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
