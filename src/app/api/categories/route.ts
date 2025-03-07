import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // ตรวจสอบสิทธิ์การเข้าถึง
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    // ดึงข้อมูลหมวดหมู่ทั้งหมด
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        uuid: true,
        name: true,
        description: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่" },
      { status: 500 }
    );
  }
}

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

    const { name, description = "" } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "กรุณาระบุชื่อหมวดหมู่" },
        { status: 400 }
      );
    }

    // ตรวจสอบว่ามีหมวดหมู่ชื่อนี้อยู่แล้วหรือไม่
    const existingCategory = await prisma.category.findUnique({
      where: { name },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "มีหมวดหมู่นี้อยู่แล้ว" },
        { status: 400 }
      );
    }

    // สร้างหมวดหมู่ใหม่
    const newCategory = await prisma.category.create({
      data: {
        name,
        description,
      },
    });

    return NextResponse.json({
      success: true,
      data: newCategory,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสร้างหมวดหมู่" },
      { status: 500 }
    );
  }
}