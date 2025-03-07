import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

// API สำหรับเพิ่มสินค้าหลายรายการพร้อมกัน
export async function POST(request: Request) {
  try {
    // ตรวจสอบสิทธิ์การเข้าถึง
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    // รับข้อมูลสินค้าหลายรายการและ group_id
    const { products, group_id } = await request.json();

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "กรุณาระบุข้อมูลสินค้าอย่างน้อย 1 รายการ" 
      }, { status: 400 });
    }

    if (!group_id) {
      return NextResponse.json({ 
        success: false, 
        error: "กรุณาระบุกลุ่มสินค้า" 
      }, { status: 400 });
    }

    // ตรวจสอบว่ามีกลุ่มสินค้านี้อยู่จริงหรือไม่
    const existingGroup = await prisma.group_product.findUnique({
      where: { id: group_id }
    });

    if (!existingGroup) {
      return NextResponse.json({ 
        success: false, 
        error: "ไม่พบกลุ่มสินค้า" 
      }, { status: 404 });
    }

    // ตรวจสอบการซ้ำของ SKU
    const skus = products.map((product: any) => product.sku);
    const existingProducts = await prisma.product.findMany({
      where: { sku: { in: skus } }
    });

    if (existingProducts.length > 0) {
      const duplicateSKUs = existingProducts.map(product => product.sku);
      return NextResponse.json({ 
        success: false, 
        error: `มี SKU ที่ซ้ำกับในระบบ: ${duplicateSKUs.join(', ')}` 
      }, { status: 400 });
    }

    // สร้างสินค้าและความสัมพันธ์กับกลุ่มสินค้าใน transaction
    const result = await prisma.$transaction(async (tx) => {
      const createdProducts = [];

      // วนลูปสร้างสินค้าทีละรายการ
      for (const productData of products) {
        const { 
          sku,
          name_sku = "",
          quantity = 0,
          make_price = null, 
          price_origin,
          product_width = null,
          product_length = null,
          product_heigth = null, 
          product_weight = null,
          img_url = null,
          categories = [],
          collections = []
        } = productData;

        // สร้างสินค้าใหม่
        const newProduct = await tx.product.create({
          data: {
            sku,
            name_sku,
            quantity,
            make_price,
            price_origin,
            product_width,
            product_length,
            product_heigth,
            product_weight,
            img_url,
            group_name: existingGroup.group_name // ใช้ชื่อกลุ่มสินค้าเพื่อแสดงผล
          }
        });

        // สร้างความสัมพันธ์กับกลุ่มสินค้า
        await tx.product_to_group.create({
          data: {
            product_id: newProduct.id,
            group_id: group_id
          }
        });

        // สร้างความสัมพันธ์กับหมวดหมู่ (ถ้ามี)
        if (categories.length > 0) {
          const categoryConnections = categories.map((categoryId: string) => ({
            product_id: newProduct.id,
            category_id: parseInt(categoryId)
          }));

          await tx.product_to_category.createMany({
            data: categoryConnections
          });
        }

        // สร้างความสัมพันธ์กับคอลเลคชัน (ถ้ามี)
        if (collections.length > 0) {
          const collectionConnections = collections.map((collectionId: string) => ({
            product_id: newProduct.id,
            collection_id: parseInt(collectionId)
          }));

          await tx.product_to_collection.createMany({
            data: collectionConnections
          });
        }

        createdProducts.push(newProduct);
      }

      return createdProducts;
    });

    return NextResponse.json({ 
      success: true,
      message: `เพิ่มสินค้าสำเร็จทั้งหมด ${result.length} รายการ`,
      data: result
    });
  } catch (error) {
    console.error("Error creating batch products:", error);
    return NextResponse.json({
      success: false,
      error: "เกิดข้อผิดพลาดในการสร้างสินค้า"
    }, { status: 500 });
  }
}