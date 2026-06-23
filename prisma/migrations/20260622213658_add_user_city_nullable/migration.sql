/*
  Warnings:

  - You are about to drop the column `deliveryAddressId` on the `orders` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_deliveryAddressId_fkey";

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "deliveryAddressId";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "city" TEXT;
