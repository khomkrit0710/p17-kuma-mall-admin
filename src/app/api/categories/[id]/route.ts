import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
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

    const categoryId = parseInt((await params).id);

    if (isNaN(categoryId)) {
      return NextResponse.json(
        { error: "รหัสหมวดหมู่ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return NextResponse.json(
        { error: "ไม่พบหมวดหมู่" },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
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

    const categoryId = parseInt((await params).id);

    if (isNaN(categoryId)) {
      return NextResponse.json(
        { error: "รหัสหมวดหมู่ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "ไม่พบหมวดหมู่" },
        { status: 404 }
      );
    }

    const { name, description = "" } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "กรุณาระบุชื่อหมวดหมู่" },
        { status: 400 }
      );
    }

    const duplicateName = await prisma.category.findFirst({
      where: {
        name,
        id: { not: categoryId }
      }
    });

    if (duplicateName) {
      return NextResponse.json(
        { error: "มีหมวดหมู่ชื่อนี้อยู่แล้ว" },
        { status: 400 }
      );
    }

    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: {
        name,
        description
      }
    });

    return NextResponse.json({
      success: true,
      message: "อัปเดตหมวดหมู่สำเร็จ",
      data: updatedCategory
    });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการอัปเดตหมวดหมู่" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
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

    const categoryId = parseInt((await params).id);
    
    if (isNaN(categoryId)) {
      return NextResponse.json(
        { error: "รหัสหมวดหมู่ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "ไม่พบหมวดหมู่" },
        { status: 404 }
      );
    }

    await prisma.category.delete({
      where: { id: categoryId }
    });

    return NextResponse.json({
      success: true,
      message: "ลบหมวดหมู่สำเร็จ"
    });
  } catch (error) {
    console.error("Error deleting category:", error);

    if (error instanceof Error && error.message.includes('Foreign key constraint failed')) {
      return NextResponse.json(
        { error: "ไม่สามารถลบหมวดหมู่นี้ได้ เนื่องจากมีสินค้าที่เกี่ยวข้อง กรุณาลบความสัมพันธ์ก่อน" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการลบหมวดหมู่" },
      { status: 500 }
    );
  }
}