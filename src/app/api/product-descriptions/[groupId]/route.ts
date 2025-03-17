import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    const groupId = parseInt((await params).groupId);
    if (isNaN(groupId)) {
      return NextResponse.json(
        { error: "รหัสกลุ่มสินค้าไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const description = await prisma.product_description.findUnique({
      where: { group_id: groupId }
    });

    if (!description) {
      return NextResponse.json(
        { 
          text_des: [],
          img_url_des: []
        }
      );
    }

    return NextResponse.json(description);
  } catch (error) {
    console.error("Error fetching product description:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลคำอธิบาย" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    const groupId = parseInt((await params).groupId);
    if (isNaN(groupId)) {
      return NextResponse.json(
        { error: "รหัสกลุ่มสินค้าไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const groupExists = await prisma.group_product.findUnique({
      where: { id: groupId }
    });

    if (!groupExists) {
      return NextResponse.json(
        { error: "ไม่พบกลุ่มสินค้า" },
        { status: 404 }
      );
    }

    const { text_des, img_url_des } = await request.json();
    const existingDescription = await prisma.product_description.findUnique({
      where: { group_id: groupId }
    });

    let description;
    
    if (existingDescription) {
      description = await prisma.product_description.update({
        where: { id: existingDescription.id },
        data: {
          text_des,
          img_url_des,
          update_date: new Date()
        }
      });
    } else {
      description = await prisma.product_description.create({
        data: {
          group_id: groupId,
          text_des,
          img_url_des,
          update_date: new Date()
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: "บันทึกคำอธิบายสำเร็จ",
      data: description
    });
  } catch (error) {
    console.error("Error saving product description:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการบันทึกคำอธิบาย" },
      { status: 500 }
    );
  }
}