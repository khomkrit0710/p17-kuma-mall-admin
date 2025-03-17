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

      const imageData = await prisma.img_group_product.findUnique({
        where: { group_id: groupId }
      });

      if (!imageData) {
        return NextResponse.json(
          { img_url: [] }
        );
      }

      return NextResponse.json(imageData);
    } catch (error) {
      console.error("Error fetching group product images:", error);
      return NextResponse.json(
        { error: "เกิดข้อผิดพลาดในการดึงข้อมูลรูปภาพกลุ่มสินค้า" },
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

    const { img_url } = await request.json();

    if (!img_url || !Array.isArray(img_url)) {
      return NextResponse.json(
        { error: "กรุณาระบุ URL รูปภาพในรูปแบบ array" },
        { status: 400 }
      );
    }

    const existingImages = await prisma.img_group_product.findUnique({
      where: { group_id: groupId }
    });

    let imageData;
    
    if (existingImages) {
      imageData = await prisma.img_group_product.update({
        where: { id: existingImages.id },
        data: {
          img_url,
          update_date: new Date()
        }
      });
    } else {
      imageData = await prisma.img_group_product.create({
        data: {
          group_id: groupId,
          img_url,
          update_date: new Date()
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: "บันทึกรูปภาพกลุ่มสินค้าสำเร็จ",
      data: imageData
    });
  } catch (error) {
    console.error("Error saving group product images:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการบันทึกรูปภาพกลุ่มสินค้า" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const existingImages = await prisma.img_group_product.findUnique({
      where: { group_id: groupId }
    });

    if (!existingImages) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลรูปภาพกลุ่มสินค้า" },
        { status: 404 }
      );
    }

    await prisma.img_group_product.delete({
      where: { id: existingImages.id }
    });

    return NextResponse.json({
      success: true,
      message: "ลบรูปภาพกลุ่มสินค้าสำเร็จ"
    });
  } catch (error) {
    console.error("Error deleting group product images:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการลบรูปภาพกลุ่มสินค้า" },
      { status: 500 }
    );
  }
}