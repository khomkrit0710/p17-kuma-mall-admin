import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    const { products, group_id } = await request.json();

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

    const existingGroup = await prisma.group_product.findUnique({
      where: { id: group_id }
    });

    if (!existingGroup) {
      return NextResponse.json({ 
        success: false, 
        error: "ไม่พบกลุ่มสินค้า" 
      }, { status: 404 });
    }

    const skus = products.map((product: { sku: string }) => product.sku);
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

    const result = await prisma.$transaction(async (tx) => {
      const createdProducts = [];

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
          img_url = null
        } = productData;

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
            group_name: existingGroup.group_name
          }
        });

        await tx.product_to_group.create({
          data: {
            product_id: newProduct.id,
            group_id: group_id
          }
        });
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