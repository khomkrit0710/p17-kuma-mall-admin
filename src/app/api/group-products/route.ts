import { Prisma, PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

// API สำหรับดึงข้อมูลกลุ่มสินค้าทั้งหมด
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
    
    const skip = (page - 1) * limit;

    // สร้างเงื่อนไขการค้นหา
    const whereCondition: Prisma.group_productWhereInput = search
    ? {
        OR: [
          { group_name: { contains: search } },
          { description: { contains: search } },
        ],
      }
    : {};

    // ดึงข้อมูลกลุ่มสินค้าพร้อมความสัมพันธ์
    const groups = await prisma.group_product.findMany({
      where: whereCondition,
      include: {
        products: {
          include: {
            product: {
              select: {
                id: true,
                name_sku: true,
                sku: true,
                img_url: true,
                price_origin: true,
                quantity: true,
              },
            },
          },
          take: 5, // แสดงสินค้าแค่ 5 รายการต่อกลุ่ม
        },
      },
      orderBy: {
        create_Date: "desc",
      },
      skip,
      take: limit,
    });

    // นับจำนวนกลุ่มสินค้าทั้งหมด
    const totalGroups = await prisma.group_product.count({
      where: whereCondition,
    });

    const totalPages = Math.ceil(totalGroups / limit);

    // แปลงข้อมูลให้อยู่ในรูปแบบที่เหมาะสม
    const formattedGroups = groups.map((group) => {
      return {
        id: group.id,
        uuid: group.uuid,
        group_name: group.group_name,
        description: group.description,
        main_img_url: group.main_img_url,
        create_Date: group.create_Date,
        products: group.products.map((relation) => ({
          id: relation.product.id,
          sku: relation.product.sku,
          name_sku: relation.product.name_sku,
          img_url: relation.product.img_url,
          price_origin: relation.product.price_origin,
          quantity: relation.product.quantity,
        })),
        total_products: group.products.length,
      };
    });

    return NextResponse.json({
      data: formattedGroups,
      pagination: {
        total: totalGroups,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching group products:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลกลุ่มสินค้า" },
      { status: 500 }
    );
  }
}

// API สำหรับสร้างกลุ่มสินค้าใหม่
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
      group_name, 
      description = "", 
      main_img_url = [],
      categories = [], // รับรายการ ID ของหมวดหมู่
      collections = [] // รับรายการ ID ของคอลเลคชัน
    } = await request.json();

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!group_name) {
      return NextResponse.json({ 
        success: false, 
        error: "กรุณาระบุชื่อกลุ่มสินค้า" 
      }, { status: 400 });
    }

    // สร้างกลุ่มสินค้าใหม่พร้อมความสัมพันธ์ใน transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. สร้างกลุ่มสินค้าใหม่
      const newGroup = await tx.group_product.create({
        data: {
          group_name,
          description,
          main_img_url,
        }
      });

      // 2. สร้างความสัมพันธ์กับหมวดหมู่
      if (categories.length > 0) {
        const categoryConnections = categories.map((categoryId: string) => ({
          group_id: newGroup.id,
          category_id: parseInt(categoryId)
        }));

        await tx.group_to_category.createMany({
          data: categoryConnections
        });
      }

      // 3. สร้างความสัมพันธ์กับคอลเลคชัน
      if (collections.length > 0) {
        const collectionConnections = collections.map((collectionId: string) => ({
          group_id: newGroup.id,
          collection_id: parseInt(collectionId)
        }));

        await tx.group_to_collection.createMany({
          data: collectionConnections
        });
      }

      return newGroup;
    });

    return NextResponse.json({ 
      success: true,
      message: "สร้างกลุ่มสินค้าสำเร็จ",
      data: result
    });
  } catch (error) {
    console.error("Error creating group product:", error);
    return NextResponse.json({
      success: false,
      error: "เกิดข้อผิดพลาดในการสร้างกลุ่มสินค้า"
    }, { status: 500 });
  }
}