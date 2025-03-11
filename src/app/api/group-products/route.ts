import { Prisma, PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;
    const whereCondition: Prisma.group_productWhereInput = search
    ? {
        OR: [
          { group_name: { contains: search } },
          { description: { contains: search } },
        ],
      }
    : {};
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
          take: 5,
        },
      },
      orderBy: {
        create_Date: "desc",
      },
      skip,
      take: limit,
    });

    const totalGroups = await prisma.group_product.count({
      where: whereCondition,
    });

    const totalPages = Math.ceil(totalGroups / limit);

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

export async function POST(request: Request) {
  try {
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
      categories = [],
      collections = []
    } = await request.json();

    if (!group_name) {
      return NextResponse.json({ 
        success: false, 
        error: "กรุณาระบุชื่อกลุ่มสินค้า" 
      }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const newGroup = await tx.group_product.create({
        data: {
          group_name,
          description,
          main_img_url,
        }
      });

      if (categories.length > 0) {
        const categoryConnections = categories.map((categoryId: string) => ({
          group_id: newGroup.id,
          category_id: parseInt(categoryId)
        }));

        await tx.group_to_category.createMany({
          data: categoryConnections
        });
      }

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