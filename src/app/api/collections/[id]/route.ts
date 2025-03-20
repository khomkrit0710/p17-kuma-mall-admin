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

    const collectionId = parseInt((await params).id);

    if (isNaN(collectionId)) {
      return NextResponse.json(
        { error: "รหัสคอลเลคชันไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const collection = await prisma.collection.findUnique({
      where: { id: collectionId }
    });

    if (!collection) {
      return NextResponse.json(
        { error: "ไม่พบคอลเลคชัน" },
        { status: 404 }
      );
    }

    return NextResponse.json(collection);
  } catch (error) {
    console.error("Error fetching collection:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลคอลเลคชัน" },
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

    const collectionId = parseInt((await params).id);

    if (isNaN(collectionId)) {
      return NextResponse.json(
        { error: "รหัสคอลเลคชันไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const existingCollection = await prisma.collection.findUnique({
      where: { id: collectionId }
    });

    if (!existingCollection) {
      return NextResponse.json(
        { error: "ไม่พบคอลเลคชัน" },
        { status: 404 }
      );
    }

    const { name, description = "", img_url_collection = null } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "กรุณาระบุชื่อคอลเลคชัน" },
        { status: 400 }
      );
    }

    const duplicateName = await prisma.collection.findFirst({
      where: {
        name,
        id: { not: collectionId }
      }
    });

    if (duplicateName) {
      return NextResponse.json(
        { error: "มีคอลเลคชันชื่อนี้อยู่แล้ว" },
        { status: 400 }
      );
    }

    const updatedCollection = await prisma.collection.update({
      where: { id: collectionId },
      data: {
        name,
        description,
        img_url_collection
      }
    });

    return NextResponse.json({
      success: true,
      message: "อัปเดตคอลเลคชันสำเร็จ",
      data: updatedCollection
    });
  } catch (error) {
    console.error("Error updating collection:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการอัปเดตคอลเลคชัน" },
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

    const collectionId = parseInt((await params).id);

    if (isNaN(collectionId)) {
      return NextResponse.json(
        { error: "รหัสคอลเลคชันไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const existingCollection = await prisma.collection.findUnique({
      where: { id: collectionId }
    });

    if (!existingCollection) {
      return NextResponse.json(
        { error: "ไม่พบคอลเลคชัน" },
        { status: 404 }
      );
    }

    await prisma.collection.delete({
      where: { id: collectionId }
    });

    return NextResponse.json({
      success: true,
      message: "ลบคอลเลคชันสำเร็จ"
    });
  } catch (error) {
    console.error("Error deleting collection:", error);

    if (error instanceof Error && error.message.includes('Foreign key constraint failed')) {
      return NextResponse.json(
        { error: "ไม่สามารถลบคอลเลคชันนี้ได้ เนื่องจากมีสินค้าที่เกี่ยวข้อง กรุณาลบความสัมพันธ์ก่อน" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการลบคอลเลคชัน" },
      { status: 500 }
    );
  }
}