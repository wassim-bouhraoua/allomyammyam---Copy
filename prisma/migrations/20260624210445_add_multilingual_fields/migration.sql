-- AlterTable
ALTER TABLE "chef_profiles" ADD COLUMN     "bio_ar" TEXT,
ADD COLUMN     "bio_en" TEXT;

-- AlterTable
ALTER TABLE "dishes" ADD COLUMN     "description_ar" TEXT,
ADD COLUMN     "description_en" TEXT,
ADD COLUMN     "name_ar" TEXT,
ADD COLUMN     "name_en" TEXT;
