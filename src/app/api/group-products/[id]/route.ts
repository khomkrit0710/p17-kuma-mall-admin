import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

// ดึงข้อมูลกลุ่มสินค้าตาม ID
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

    const groupId = parseInt(params.id);
    
    // ตรวจสอบว่า ID เป็นตัวเลขหรือไม่
    if (isNaN(groupId)) {
      return NextResponse.json(
        { error: "รหัสกลุ่มสินค้าไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    // ดึงข้อมูลกลุ่มสินค้าพร้อมสินค้าในกลุ่ม
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
                product_categories: {
                  include: {
                    category: true
                  }
                },
                product_collections: {
                  include: {
                    collection: true
                  }
                },
                flash_sale: true
              }
            }
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

    // จัดรูปแบบข้อมูลเพื่อส่งกลับไปยังไคลเอนต์
    const formattedProducts = group.products.map(relation => {
      const product = relation.product;
      
      // จัดรูปแบบหมวดหมู่
      const categories = product.product_categories.map(pc => ({
        id: pc.category.id,
        name: pc.category.name
      }));
      
      // จัดรูปแบบคอลเลคชัน
      const collections = product.product_collections.map(pc => ({
        id: pc.collection.id,
        name: pc.collection.name
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

    // ส่งข้อมูลกลับไปยังไคลเอนต์
    return NextResponse.json({
      id: group.id,
      uuid: group.uuid,
      group_name: group.group_name,
      description: group.description,
      main_img_url: group.main_img_url,
      create_Date: group.create_Date,
      products: formattedProducts
    });
  } catch (error) {
    console.error("Error fetching group product:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลกลุ่มสินค้า" },
      { status: 500 }
    );
  }
}

// อัปเดตข้อมูลกลุ่มสินค้า
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

    const groupId = parseInt(params.id);
    
    // ตรวจสอบว่า ID เป็นตัวเลขหรือไม่
    if (isNaN(groupId)) {
      return NextResponse.json(
        { error: "รหัสกลุ่มสินค้าไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    // ตรวจสอบว่ามีกลุ่มสินค้านี้อยู่จริงหรือไม่
    const existingGroup = await prisma.group_product.findUnique({
      where: { id: groupId }
    });

    if (!existingGroup) {
      return NextResponse.json(
        { error: "ไม่พบกลุ่มสินค้า" },
        { status: 404 }
      );
    }

    const { group_name, description = "", main_img_url = [] } = await request.json();

    if (!group_name) {
      return NextResponse.json(
        { error: "กรุณาระบุชื่อกลุ่มสินค้า" },
        { status: 400 }
      );
    }

    // อัปเดตข้อมูลกลุ่มสินค้า
    const updatedGroup = await prisma.group_product.update({
      where: { id: groupId },
      data: {
        group_name,
        description,
        main_img_url
      }
    });

    // อัปเดตชื่อกลุ่มในสินค้าทุกตัวที่อยู่ในกลุ่มนี้
    await prisma.product.updateMany({
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

    return NextResponse.json({
      success: true,
      message: "อัปเดตกลุ่มสินค้าสำเร็จ",
      data: updatedGroup
    });
  } catch (error) {
    console.error("Error updating group product:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการอัปเดตกลุ่มสินค้า" },
      { status: 500 }
    );
  }
}

// ลบกลุ่มสินค้า
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

    const groupId = parseInt(params.id);
    
    // ตรวจสอบว่า ID เป็นตัวเลขหรือไม่
    if (isNaN(groupId)) {
      return NextResponse.json(
        { error: "รหัสกลุ่มสินค้าไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    // ตรวจสอบว่ามีกลุ่มสินค้านี้อยู่จริงหรือไม่
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

    // ทำ transaction เพื่อลบข้อมูลที่เกี่ยวข้องทั้งหมด
    await prisma.$transaction(async (tx) => {
      // ดึงรายการ product_id ที่อยู่ในกลุ่มนี้
      const productRelations = await tx.product_to_group.findMany({
        where: { group_id: groupId },
        select: { product_id: true }
      });
      
      const productIds = productRelations.map(rel => rel.product_id);
      
      // ลบความสัมพันธ์ระหว่างสินค้ากับกลุ่มสินค้า
      await tx.product_to_group.deleteMany({
        where: { group_id: groupId }
      });
      
      // ลบสินค้าที่อยู่ในกลุ่มนี้
      if (productIds.length > 0) {
        await tx.product.deleteMany({
          where: { id: { in: productIds } }
        });
      }
      
      // ลบกลุ่มสินค้า
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