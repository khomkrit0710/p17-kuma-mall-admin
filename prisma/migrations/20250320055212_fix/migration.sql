/*
  Warnings:

  - You are about to drop the column `img_url_collaction` on the `collection` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "collection" DROP COLUMN "img_url_collaction",
ADD COLUMN     "img_url_collection" TEXT;
