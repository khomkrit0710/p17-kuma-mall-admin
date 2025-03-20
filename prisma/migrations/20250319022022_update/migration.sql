/*
  Warnings:

  - You are about to drop the column `img_url` on the `img_product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "img_product" DROP COLUMN "img_url",
ADD COLUMN     "img_url_sku" TEXT;
