import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const groupId = parseInt(id);

    if (isNaN(groupId)) {
      return NextResponse.json(
        { error: "รหัสกลุ่มสินค้าไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const group = await prisma.group_product.findUnique({
      where: { id: groupId },
      include: {
        products: {
          include: {
            product: {
              select: {
                id: true,
                uuid: true,
                sku: true,
                name_sku: true,
                quantity: true,
                price_origin: true,
                img_url: true,
                make_price: true,
                product_width: true,
                product_length: true,
                product_heigth: true,
                product_weight: true,
                group_name: true,
                create_Date: true,
                update_date: true,
                flash_sale: true
              }
            }
          }
        },
        group_categories: {
          include: {
            category: true
          }
        },
        group_collections: {
          include: {
            collection: true
          }
        }
      }
    });

    if (!group) {
      return NextResponse.json(
        { error: "ไม่พบกลุ่มสินค้า" },
        { status: 404 }
      );
    }

    const formattedProducts = group.products.map(relation => {
      const product = relation.product;

      const categories = group.group_categories.map(gc => ({
        id: gc.category.id,
        name: gc.category.name
      }));
      
      const collections = group.group_collections.map(gc => ({
        id: gc.collection.id,
        name: gc.collection.name
      }));

      return {
        id: product.id,
        uuid: product.uuid,
        sku: product.sku,
        name_sku: product.name_sku,
        quantity: product.quantity,
        price_origin: product.price_origin,
        make_price: product.make_price,
        product_width: product.product_width,
        product_length: product.product_length,
        product_heigth: product.product_heigth,
        product_weight: product.product_weight,
        img_url: product.img_url,
        group_name: product.group_name,
        create_Date: product.create_Date,
        update_date: product.update_date,
        categories,
        collections,
        flash_sale: product.flash_sale
      };
    });

    const groupCategories = group.group_categories.map(gc => ({
      id: gc.category.id,
      name: gc.category.name
    }));

    const groupCollections = group.group_collections.map(gc => ({
      id: gc.collection.id,
      name: gc.collection.name
    }));

    return NextResponse.json({
      id: group.id,
      uuid: group.uuid,
      group_name: group.group_name,
      description: group.description,
      main_img_url: group.main_img_url,
      create_Date: group.create_Date,
      products: formattedProducts,
      categories: groupCategories,
      collections: groupCollections
    });
  } catch (error) {
    console.error("Error fetching group product:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลกลุ่มสินค้า" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const groupId = parseInt(id);

    if (isNaN(groupId)) {
      return NextResponse.json(
        { error: "รหัสกลุ่มสินค้าไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const existingGroup = await prisma.group_product.findUnique({
      where: { id: groupId }
    });

    if (!existingGroup) {
      return NextResponse.json(
        { error: "ไม่พบกลุ่มสินค้า" },
        { status: 404 }
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
      return NextResponse.json(
        { error: "กรุณาระบุชื่อกลุ่มสินค้า" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedGroup = await tx.group_product.update({
        where: { id: groupId },
        data: {
          group_name,
          subname,
          description,
          main_img_url
        }
      });

      await tx.product.updateMany({
        where: {
          product_group: {
            some: {
              group_id: groupId
            }
          }
        },
        data: {
          group_name: group_name
        }
      });

      await tx.group_to_category.deleteMany({
        where: { group_id: groupId }
      });

      if (categories.length > 0) {
        const categoryConnections = categories.map((categoryId: string) => ({
          group_id: groupId,
          category_id: parseInt(categoryId)
        }));

        await tx.group_to_category.createMany({
          data: categoryConnections
        });
      }

      await tx.group_to_collection.deleteMany({
        where: { group_id: groupId }
      });

      if (collections.length > 0) {
        const collectionConnections = collections.map((collectionId: string) => ({
          group_id: groupId,
          collection_id: parseInt(collectionId)
        }));

        await tx.group_to_collection.createMany({
          data: collectionConnections
        });
      }

      return updatedGroup;
    });

    return NextResponse.json({
      success: true,
      message: "อัปเดตกลุ่มสินค้าสำเร็จ",
      data: result
    });
  } catch (error) {
    console.error("Error updating group product:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการอัปเดตกลุ่มสินค้า" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const groupId = parseInt(id);

    if (isNaN(groupId)) {
      return NextResponse.json(
        { error: "รหัสกลุ่มสินค้าไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const existingGroup = await prisma.group_product.findUnique({
      where: { id: groupId },
      include: {
        products: true
      }
    });

    if (!existingGroup) {
      return NextResponse.json(
        { error: "ไม่พบกลุ่มสินค้า" },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      const productRelations = await tx.product_to_group.findMany({
        where: { group_id: groupId },
        select: { product_id: true }
      });
      
      const productIds = productRelations.map(rel => rel.product_id);

      await tx.product_to_group.deleteMany({
        where: { group_id: groupId }
      });

      if (productIds.length > 0) {
        await tx.product.deleteMany({
          where: { id: { in: productIds } }
        });
      }

      await tx.group_product.delete({
        where: { id: groupId }
      });
    });

    return NextResponse.json({
      success: true,
      message: "ลบกลุ่มสินค้าและสินค้าที่เกี่ยวข้องสำเร็จ"
    });
  } catch (error) {
    console.error("Error deleting group product:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการลบกลุ่มสินค้า" },
      { status: 500 }
    );
  }
}