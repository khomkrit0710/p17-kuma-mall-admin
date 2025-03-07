import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

// ฟังก์ชันสำหรับดึงข้อมูลสินค้าพร้อม pagination
export async function GET(request: Request) {
  try {
    // ตรวจสอบสิทธิ์การเข้าถึง
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    // รับพารามิเตอร์จาก URL
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const group_id = searchParams.get("group_id");
    
    const skip = (page - 1) * limit;

    // สร้างเงื่อนไขการค้นหา
    let whereCondition: any = {};
    
    if (search) {
      whereCondition.OR = [
        { sku: { contains: search, mode: "insensitive" } },
        { name_sku: { contains: search, mode: "insensitive" } },
        { group_name: { contains: search, mode: "insensitive" } },
      ];
    }
    
    // ถ้ามีการระบุ group_id ให้ดึงเฉพาะสินค้าในกลุ่มนั้น
    if (group_id) {
      const groupIdNum = parseInt(group_id);
      if (!isNaN(groupIdNum)) {
        whereCondition.product_group = {
          some: {
            group_id: groupIdNum
          }
        };
      }
    }

    // ดึงข้อมูลสินค้าพร้อมความสัมพันธ์
    const products = await prisma.product.findMany({
      where: whereCondition,
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
              },
            },
          },
        },
        flash_sale: true,
      },
      orderBy: {
        create_Date: "desc",
      },
      skip,
      take: limit,
    });

    // นับจำนวนสินค้าทั้งหมด
    const totalProducts = await prisma.product.count({
      where: whereCondition,
    });

    const totalPages = Math.ceil(totalProducts / limit);

    // แปลงข้อมูลให้อยู่ในรูปแบบที่เหมาะสมสำหรับการใช้งาน
    const formattedProducts = products.map((product) => {
      return {
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
        })),
        flash_sale: product.flash_sale,
      };
    });

    return NextResponse.json({
      data: formattedProducts,
      pagination: {
        total: totalProducts,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า" },
      { status: 500 }
    );
  }
}

// ฟังก์ชันสำหรับเพิ่มสินค้าใหม่ (รองรับการเพิ่มในกลุ่ม)
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
      group_name = "",
      categories = [],
      collections = [],
      group_id = null  // พารามิเตอร์ใหม่สำหรับเชื่อมกับกลุ่ม
    } = await request.json();

    // ตรวจสอบว่ามีการส่งค่าที่จำเป็นมาหรือไม่
    if (!sku || price_origin === undefined) {
      return NextResponse.json({ 
        success: false, 
        error: "กรุณาระบุ sku และ price_origin" 
      }, { status: 400 });
    }

    // ตรวจสอบว่ามี SKU นี้อยู่แล้วหรือไม่
    const existingProduct = await prisma.product.findUnique({
      where: { sku }
    });

    if (existingProduct) {
      return NextResponse.json({ 
        success: false, 
        error: "รหัสสินค้า (SKU) นี้มีอยู่แล้วในระบบ" 
      }, { status: 400 });
    }

    // ถ้ามี group_id ตรวจสอบว่ากลุ่มมีอยู่จริงหรือไม่
    let realGroupName = group_name;
    if (group_id) {
      const existingGroup = await prisma.group_product.findUnique({
        where: { id: group_id }
      });
      
      if (!existingGroup) {
        return NextResponse.json({ 
          success: false, 
          error: "ไม่พบกลุ่มสินค้าที่ระบุ" 
        }, { status: 404 });
      }
      
      // ใช้ชื่อกลุ่มจริงเพื่อแสดงผล
      realGroupName = existingGroup.group_name;
    }

    // สร้างข้อมูลสินค้าใหม่ด้วย Transaction เพื่อให้ทำงานพร้อมกัน
    const result = await prisma.$transaction(async (tx) => {
      // 1. สร้างสินค้า
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
          group_name: realGroupName
        }
      });

      // 2. เชื่อมความสัมพันธ์กับกลุ่ม (ถ้ามี)
      if (group_id) {
        await tx.product_to_group.create({
          data: {
            product_id: newProduct.id,
            group_id: group_id
          }
        });
      }

      // 3. เชื่อมความสัมพันธ์กับหมวดหมู่
      if (categories.length > 0) {
        const categoryConnections = categories.map((categoryId: string) => ({
          product_id: newProduct.id,
          category_id: parseInt(categoryId)
        }));

        await tx.product_to_category.createMany({
          data: categoryConnections
        });
      }

      // 4. เชื่อมความสัมพันธ์กับคอลเลคชัน
      if (collections.length > 0) {
        const collectionConnections = collections.map((collectionId: string) => ({
          product_id: newProduct.id,
          collection_id: parseInt(collectionId)
        }));

        await tx.product_to_collection.createMany({
          data: collectionConnections
        });
      }

      return newProduct;
    });

    return NextResponse.json({ 
      success: true,
      message: "เพิ่มสินค้าสำเร็จ",
      data: result
    });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({
      success: false,
      error: "เกิดข้อผิดพลาดในการสร้างสินค้า"
    }, { status: 500 });
  }
}