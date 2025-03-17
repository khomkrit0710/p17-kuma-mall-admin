/*
  Warnings:

  - You are about to drop the column `description` on the `group_product` table. All the data in the column will be lost.
  - You are about to drop the column `main_img_url` on the `group_product` table. All the data in the column will be lost.
  - You are about to drop the column `img_url` on the `product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "group_product" DROP COLUMN "description",
DROP COLUMN "main_img_url";

-- AlterTable
ALTER TABLE "product" DROP COLUMN "img_url",
ADD COLUMN     "size" TEXT;

-- CreateTable
CREATE TABLE "product_description" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "group_id" INTEGER NOT NULL,
    "text_des" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "img_url_des" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "create_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_description_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "img_product" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "img_url" TEXT NOT NULL,
    "create_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "img_product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "img_group_product" (
    "id" SERIAL NOT NULL,
    "group_id" INTEGER NOT NULL,
    "img_url" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "create_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "img_group_product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_description_group_id_key" ON "product_description"("group_id");

-- CreateIndex
CREATE INDEX "product_description_group_id_idx" ON "product_description"("group_id");

-- CreateIndex
CREATE UNIQUE INDEX "img_product_product_id_key" ON "img_product"("product_id");

-- CreateIndex
CREATE INDEX "img_product_product_id_idx" ON "img_product"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "img_group_product_group_id_key" ON "img_group_product"("group_id");

-- CreateIndex
CREATE INDEX "img_group_product_group_id_idx" ON "img_group_product"("group_id");

-- AddForeignKey
ALTER TABLE "product_description" ADD CONSTRAINT "product_description_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "group_product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "img_product" ADD CONSTRAINT "img_product_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "img_group_product" ADD CONSTRAINT "img_group_product_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "group_product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
