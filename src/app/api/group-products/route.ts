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

    const formattedGroups = await Promise.all(groups.map(async (group) => {
      const productSkus = group.products.map(rel => rel.product.sku);
      const flashSales = await prisma.flash_sale.findMany({
        where: {
          sku: {
            in: productSkus
          }
        },
        select: {
          sku: true,
          status: true,
          flash_sale_price: true,
          flash_sale_per: true
        }
      });

      const flashSaleMap = new Map();
      flashSales.forEach(fs => {
        flashSaleMap.set(fs.sku, fs);
      });

      const productsWithFlashSale = group.products.map(relation => {
        const product = relation.product;
        const flashSale = flashSaleMap.get(product.sku) || null;
        
        return {
          id: product.id,
          sku: product.sku,
          name_sku: product.name_sku,
          img_url: product.img_url,
          price_origin: product.price_origin,
          quantity: product.quantity,
          flash_sale: flashSale
        };
      });
      
      const hasFlashSale = flashSales.length > 0;
      
      return {
        id: group.id,
        uuid: group.uuid,
        group_name: group.group_name,
        description: group.description,
        main_img_url: group.main_img_url,
        create_Date: group.create_Date,
        products: productsWithFlashSale,
        total_products: group.products.length,
        has_flash_sale: hasFlashSale
      };
    }));

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
      subname = "",
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
          subname,
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