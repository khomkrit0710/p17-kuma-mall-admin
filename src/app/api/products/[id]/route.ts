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

    const productId = parseInt((await params).id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "รหัสสินค้าไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
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
        img_product: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "ไม่พบสินค้า" },
        { status: 404 }
      );
    }

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
      img_url: product.img_product?.img_url || null,
      group_name: product.group_name,
      create_Date: product.create_Date,
      update_date: product.update_date,
      categories: product.product_group.length > 0
        ? product.product_group[0].group.group_categories.map((gc) => ({
            id: gc.category.id,
            name: gc.category.name,
          }))
        : [],
      collections: product.product_group.length > 0
        ? product.product_group[0].group.group_collections.map((gc) => ({
            id: gc.collection.id,
            name: gc.collection.name,
          }))
        : [],
      groups: product.product_group.map((pg) => ({
        id: pg.group.id,
        name: pg.group.group_name,
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

    const productId = parseInt((await params).id);
    
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "รหัสสินค้าไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        product_group: true
      }
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
      size = null,
      group_name,
      group_id = null 
    } = await request.json();

    if (price_origin === undefined) {
      return NextResponse.json({ 
        success: false, 
        error: "กรุณาระบุ price_origin" 
      }, { status: 400 });
    }

    let updatedGroupName = group_name || existingProduct.group_name;
    let shouldUpdateGroup = false;
    
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

      const currentGroupId = existingProduct.product_group[0]?.group_id;
      shouldUpdateGroup = currentGroupId !== group_id;
      updatedGroupName = existingGroup.group_name;
    }

    const result = await prisma.$transaction(async (tx) => {
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
          group_name: updatedGroupName
        }
      });

      if (shouldUpdateGroup && group_id) {
        await tx.product_to_group.deleteMany({
          where: { product_id: productId }
        });
        await tx.product_to_group.create({
          data: {
            product_id: productId,
            group_id: group_id
          }
        });
      }

      if (img_url !== null) {
        const existingImage = await tx.img_product.findUnique({
          where: { product_id: productId }
        });
        
        if (existingImage) {
          await tx.img_product.update({
            where: { id: existingImage.id },
            data: {
              img_url,
              update_date: new Date()
            }
          });
        } else {
          await tx.img_product.create({
            data: {
              product_id: productId,
              img_url,
              update_date: new Date()
            }
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

    const productId = parseInt((await params).id);
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "รหัสสินค้าไม่ถูกต้อง" },
        { status: 400 }
      );
    }
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "ไม่พบสินค้า" },
        { status: 404 }
      );
    }
    
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