-- CreateTable
CREATE TABLE "product" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "create_Date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sku" TEXT NOT NULL,
    "name_sku" TEXT NOT NULL DEFAULT '',
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "make_price" INTEGER,
    "price_origin" INTEGER NOT NULL,
    "product_width" INTEGER,
    "product_length" INTEGER,
    "product_heigth" INTEGER,
    "product_weight" INTEGER,
    "img_url" TEXT,
    "update_date" TIMESTAMP(3) NOT NULL,
    "group_name" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_product" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "create_Date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "group_name" TEXT NOT NULL DEFAULT '',
    "main_img_url" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "description" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "group_product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "create_Date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "create_Date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_to_group" (
    "product_id" INTEGER NOT NULL,
    "group_id" INTEGER NOT NULL,

    CONSTRAINT "product_to_group_pkey" PRIMARY KEY ("product_id","group_id")
);

-- CreateTable
CREATE TABLE "product_to_category" (
    "product_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,

    CONSTRAINT "product_to_category_pkey" PRIMARY KEY ("product_id","category_id")
);

-- CreateTable
CREATE TABLE "product_to_collection" (
    "product_id" INTEGER NOT NULL,
    "collection_id" INTEGER NOT NULL,

    CONSTRAINT "product_to_collection_pkey" PRIMARY KEY ("product_id","collection_id")
);

-- CreateTable
CREATE TABLE "flash_sale" (
    "id" SERIAL NOT NULL,
    "create_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "sku" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "flash_sale_price" INTEGER NOT NULL,
    "flash_sale_per" INTEGER NOT NULL,
    "price_origin" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "update_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flash_sale_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_sku_key" ON "product"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "category_name_key" ON "category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "collection_name_key" ON "collection"("name");

-- CreateIndex
CREATE INDEX "product_to_group_product_id_idx" ON "product_to_group"("product_id");

-- CreateIndex
CREATE INDEX "product_to_group_group_id_idx" ON "product_to_group"("group_id");

-- CreateIndex
CREATE INDEX "product_to_category_product_id_idx" ON "product_to_category"("product_id");

-- CreateIndex
CREATE INDEX "product_to_category_category_id_idx" ON "product_to_category"("category_id");

-- CreateIndex
CREATE INDEX "product_to_collection_product_id_idx" ON "product_to_collection"("product_id");

-- CreateIndex
CREATE INDEX "product_to_collection_collection_id_idx" ON "product_to_collection"("collection_id");

-- CreateIndex
CREATE UNIQUE INDEX "flash_sale_sku_key" ON "flash_sale"("sku");

-- CreateIndex
CREATE INDEX "flash_sale_sku_idx" ON "flash_sale"("sku");

-- AddForeignKey
ALTER TABLE "product_to_group" ADD CONSTRAINT "product_to_group_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_to_group" ADD CONSTRAINT "product_to_group_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "group_product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_to_category" ADD CONSTRAINT "product_to_category_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_to_category" ADD CONSTRAINT "product_to_category_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_to_collection" ADD CONSTRAINT "product_to_collection_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_to_collection" ADD CONSTRAINT "product_to_collection_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flash_sale" ADD CONSTRAINT "flash_sale_sku_fkey" FOREIGN KEY ("sku") REFERENCES "product"("sku") ON DELETE CASCADE ON UPDATE CASCADE;
