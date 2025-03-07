import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // ตรวจสอบสิทธิ์การเข้าถึง
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    const productId = parseInt(params.id);
    
    // ตรวจสอบว่า ID เป็นตัวเลขหรือไม่
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "รหัสสินค้าไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    // ดึงข้อมูลสินค้าพร้อมความสัมพันธ์ทั้งหมด
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        product_categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        product_collections: {
          include: {
            collection: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        product_group: {
          include: {
            group: {
              select: {
                id: true,
                group_name: true,
                description: true,
                main_img_url: true,
              },
            },
          },
        },
        flash_sale: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "ไม่พบสินค้า" },
        { status: 404 }
      );
    }

    // แปลงข้อมูลให้อยู่ในรูปแบบที่เหมาะสม
    const formattedProduct = {
      id: product.id,
      uuid: product.uuid,
      sku: product.sku,
      name_sku: product.name_sku,
      quantity: product.quantity,
      make_price: product.make_price,
      price_origin: product.price_origin,
      product_width: product.product_width,
      product_length: product.product_length,
      product_heigth: product.product_heigth,
      product_weight: product.product_weight,
      img_url: product.img_url,
      group_name: product.group_name,
      create_Date: product.create_Date,
      update_date: product.update_date,
      categories: product.product_categories.map((pc) => ({
        id: pc.category.id,
        name: pc.category.name,
      })),
      collections: product.product_collections.map((pc) => ({
        id: pc.collection.id,
        name: pc.collection.name,
      })),
      groups: product.product_group.map((pg) => ({
        id: pg.group.id,
        name: pg.group.group_name,
        description: pg.group.description,
        images: pg.group.main_img_url,
      })),
      flash_sale: product.flash_sale,
    };

    return NextResponse.json(formattedProduct);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า" },
      { status: 500 }
    );
  }
}

// ฟังก์ชันสำหรับอัปเดตข้อมูลสินค้า
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // ตรวจสอบสิทธิ์การเข้าถึง
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    const productId = parseInt(params.id);
    
    // ตรวจสอบว่า ID เป็นตัวเลขหรือไม่
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "รหัสสินค้าไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    // ตรวจสอบว่ามีสินค้านี้อยู่จริงหรือไม่
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "ไม่พบสินค้า" },
        { status: 404 }
      );
    }

    const { 
      name_sku = "",
      quantity = 0,
      make_price = null, 
      price_origin,
      product_width = null,
      product_length = null,
      product_heigth = null, 
      product_weight = null,  
      img_url = null,
      group_name = "",
      categories = [],
      collections = []
    } = await request.json();

    // ตรวจสอบว่ามีการส่งค่าที่จำเป็นมาหรือไม่
    if (price_origin === undefined) {
      return NextResponse.json({ 
        success: false, 
        error: "กรุณาระบุ price_origin" 
      }, { status: 400 });
    }

    // อัปเดตข้อมูลสินค้าด้วย Transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. อัปเดตข้อมูลสินค้า
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          name_sku,
          quantity,
          make_price,
          price_origin,
          product_width,
          product_length,
          product_heigth,
          product_weight,
          img_url,
          group_name
        }
      });

      // 2. ลบความสัมพันธ์กับหมวดหมู่เดิมแล้วสร้างใหม่
      if (categories.length >= 0) {
        // ลบความสัมพันธ์เดิม
        await tx.product_to_category.deleteMany({
          where: { product_id: productId }
        });

        // สร้างความสัมพันธ์ใหม่
        if (categories.length > 0) {
          const categoryConnections = categories.map((categoryId: string) => ({
            product_id: productId,
            category_id: parseInt(categoryId)
          }));

          await tx.product_to_category.createMany({
            data: categoryConnections
          });
        }
      }

      // 3. ลบความสัมพันธ์กับคอลเลคชันเดิมแล้วสร้างใหม่
      if (collections.length >= 0) {
        // ลบความสัมพันธ์เดิม
        await tx.product_to_collection.deleteMany({
          where: { product_id: productId }
        });

        // สร้างความสัมพันธ์ใหม่
        if (collections.length > 0) {
          const collectionConnections = collections.map((collectionId: string) => ({
            product_id: productId,
            collection_id: parseInt(collectionId)
          }));

          await tx.product_to_collection.createMany({
            data: collectionConnections
          });
        }
      }

      return updatedProduct;
    });

    return NextResponse.json({ 
      success: true,
      message: "อัปเดตสินค้าสำเร็จ",
      data: result
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({
      success: false,
      error: "เกิดข้อผิดพลาดในการอัปเดตสินค้า"
    }, { status: 500 });
  }
}

// ฟังก์ชันสำหรับลบสินค้า
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // ตรวจสอบสิทธิ์การเข้าถึง
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    const productId = parseInt(params.id);
    
    // ตรวจสอบว่า ID เป็นตัวเลขหรือไม่
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "รหัสสินค้าไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    // ตรวจสอบว่ามีสินค้านี้อยู่จริงหรือไม่
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "ไม่พบสินค้า" },
        { status: 404 }
      );
    }

    // ลบสินค้า (ใน Schema มีการกำหนด onDelete: Cascade ทำให้ความสัมพันธ์ถูกลบอัตโนมัติ)
    await prisma.product.delete({
      where: { id: productId }
    });

    return NextResponse.json({ 
      success: true,
      message: "ลบสินค้าสำเร็จ"
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({
      success: false,
      error: "เกิดข้อผิดพลาดในการลบสินค้า"
    }, { status: 500 });
  }
}