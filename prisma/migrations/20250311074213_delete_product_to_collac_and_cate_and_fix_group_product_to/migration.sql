/*
  Warnings:

  - You are about to drop the `product_to_category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `product_to_collection` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "product_to_category" DROP CONSTRAINT "product_to_category_category_id_fkey";

-- DropForeignKey
ALTER TABLE "product_to_category" DROP CONSTRAINT "product_to_category_product_id_fkey";

-- DropForeignKey
ALTER TABLE "product_to_collection" DROP CONSTRAINT "product_to_collection_collection_id_fkey";

-- DropForeignKey
ALTER TABLE "product_to_collection" DROP CONSTRAINT "product_to_collection_product_id_fkey";

-- DropTable
DROP TABLE "product_to_category";

-- DropTable
DROP TABLE "product_to_collection";
