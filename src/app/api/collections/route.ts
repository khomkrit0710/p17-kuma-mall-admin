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

    // ดึงข้อมูลคอลเลคชันทั้งหมด
    const collections = await prisma.collection.findMany({
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

    return NextResponse.json(collections);
  } catch (error) {
    console.error("Error fetching collections:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลคอลเลคชัน" },
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
        { error: "กรุณาระบุชื่อคอลเลคชัน" },
        { status: 400 }
      );
    }

    // ตรวจสอบว่ามีคอลเลคชันชื่อนี้อยู่แล้วหรือไม่
    const existingCollection = await prisma.collection.findUnique({
      where: { name },
    });

    if (existingCollection) {
      return NextResponse.json(
        { error: "มีคอลเลคชันนี้อยู่แล้ว" },
        { status: 400 }
      );
    }

    // สร้างคอลเลคชันใหม่
    const newCollection = await prisma.collection.create({
      data: {
        name,
        description,
      },
    });

    return NextResponse.json({
      success: true,
      data: newCollection,
    });
  } catch (error) {
    console.error("Error creating collection:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสร้างคอลเลคชัน" },
      { status: 500 }
    );
  }
}