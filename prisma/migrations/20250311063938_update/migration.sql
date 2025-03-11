-- CreateTable
CREATE TABLE "group_to_category" (
    "group_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,

    CONSTRAINT "group_to_category_pkey" PRIMARY KEY ("group_id","category_id")
);

-- CreateTable
CREATE TABLE "group_to_collection" (
    "group_id" INTEGER NOT NULL,
    "collection_id" INTEGER NOT NULL,

    CONSTRAINT "group_to_collection_pkey" PRIMARY KEY ("group_id","collection_id")
);

-- CreateIndex
CREATE INDEX "group_to_category_group_id_idx" ON "group_to_category"("group_id");

-- CreateIndex
CREATE INDEX "group_to_category_category_id_idx" ON "group_to_category"("category_id");

-- CreateIndex
CREATE INDEX "group_to_collection_group_id_idx" ON "group_to_collection"("group_id");

-- CreateIndex
CREATE INDEX "group_to_collection_collection_id_idx" ON "group_to_collection"("collection_id");

-- AddForeignKey
ALTER TABLE "group_to_category" ADD CONSTRAINT "group_to_category_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "group_product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_to_category" ADD CONSTRAINT "group_to_category_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_to_collection" ADD CONSTRAINT "group_to_collection_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "group_product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_to_collection" ADD CONSTRAINT "group_to_collection_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
