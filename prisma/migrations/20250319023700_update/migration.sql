/*
  Warnings:

  - You are about to drop the column `img_url` on the `category` table. All the data in the column will be lost.
  - You are about to drop the column `img_url` on the `collection` table. All the data in the column will be lost.
  - You are about to drop the column `img_url` on the `img_group_product` table. All the data in the column will be lost.
  - You are about to drop the column `img_url_sku` on the `img_product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "category" DROP COLUMN "img_url",
ADD COLUMN     "img_url_category" TEXT;

-- AlterTable
ALTER TABLE "collection" DROP COLUMN "img_url",
ADD COLUMN     "img_url_collaction" TEXT;

-- AlterTable
ALTER TABLE "img_group_product" DROP COLUMN "img_url",
ADD COLUMN     "img_url_group" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "img_product" DROP COLUMN "img_url_sku",
ADD COLUMN     "img_url_product" TEXT;
