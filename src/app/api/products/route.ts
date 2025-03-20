import { PrismaClient } from "@prisma/client";
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
    const group_id = searchParams.get("group_id");
    const skip = (page - 1) * limit;
    const whereCondition: Record<string, unknown> = {};
    
    if (search) {
      whereCondition.OR = [
        { sku: { contains: search, mode: "insensitive" } },
        { name_sku: { contains: search, mode: "insensitive" } },
        { group_name: { contains: search, mode: "insensitive" } },
      ];
    }

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

    const products = await prisma.product.findMany({
      where: whereCondition,
      include: {
        product_group: {
          include: {
            group: {
              include: {
                group_categories: {
                  include: {
                    category: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
                group_collections: {
                  include: {
                    collection: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
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

    const totalProducts = await prisma.product.count({
      where: whereCondition,
    });

    const totalPages = Math.ceil(totalProducts / limit);

    const formattedProducts = products.map((product) => {
      const categories = product.product_group.length > 0
        ? product.product_group[0].group.group_categories.map((gc) => ({
            id: gc.category.id,
            name: gc.category.name,
          }))
        : [];
        
      const collections = product.product_group.length > 0
        ? product.product_group[0].group.group_collections.map((gc) => ({
            id: gc.collection.id,
            name: gc.collection.name,
          }))
        : [];

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
        size: product.size,
        group_name: product.group_name,
        create_Date: product.create_Date,
        update_date: product.update_date,
        categories,
        collections,
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
      sku,
      name_sku = "",
      quantity = 0,
      make_price = null, 
      price_origin,
      product_width = null,
      product_length = null,
      product_heigth = null, 
      product_weight = null,  
      img_url_product = null,
      group_name = "",
      size = null,
      group_id = null
    } = await request.json();

    if (!sku || price_origin === undefined) {
      return NextResponse.json({ 
        success: false, 
        error: "กรุณาระบุ sku และ price_origin" 
      }, { status: 400 });
    }

    const existingProduct = await prisma.product.findUnique({
      where: { sku }
    });

    if (existingProduct) {
      return NextResponse.json({ 
        success: false, 
        error: "รหัสสินค้า (SKU) นี้มีอยู่แล้วในระบบ" 
      }, { status: 400 });
    }

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

      realGroupName = existingGroup.group_name;
    }

    const result = await prisma.$transaction(async (tx) => {
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
          group_name: realGroupName,
          size
        }
      });

      if (img_url_product) {
        await tx.img_product.create({
          data: {
            product_id: newProduct.id,
            img_url_product: img_url_product,
            update_date: new Date()
          }
        });
      }

      if (group_id) {
        await tx.product_to_group.create({
          data: {
            product_id: newProduct.id,
            group_id: group_id
          }
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