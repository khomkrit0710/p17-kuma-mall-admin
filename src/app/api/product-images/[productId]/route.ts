// src/app/api/product-images/[productId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

// GET - ดึงข้อมูลรูปภาพสินค้า
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    const productId = parseInt((await params).productId);
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "รหัสสินค้าไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const imageData = await prisma.img_product.findUnique({
      where: { product_id: productId }
    });

    if (!imageData) {
      return NextResponse.json(
        { img_url: "" }
      );
    }

    return NextResponse.json(imageData);
  } catch (error) {
    console.error("Error fetching product image:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลรูปภาพสินค้า" },
      { status: 500 }
    );
  }
}

// POST - อัปเดตหรือสร้างข้อมูลรูปภาพสินค้า
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    const productId = parseInt((await params).productId);
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "รหัสสินค้าไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    // ตรวจสอบว่ามีสินค้านี้จริงหรือไม่
    const productExists = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!productExists) {
      return NextResponse.json(
        { error: "ไม่พบสินค้า" },
        { status: 404 }
      );
    }

    const { img_url } = await request.json();

    if (!img_url) {
      return NextResponse.json(
        { error: "กรุณาระบุ URL รูปภาพ" },
        { status: 400 }
      );
    }

    // ตรวจสอบว่ามีข้อมูลรูปภาพอยู่แล้วหรือไม่
    const existingImage = await prisma.img_product.findUnique({
      where: { product_id: productId }
    });

    let imageData;
    
    if (existingImage) {
      // ถ้ามีข้อมูลอยู่แล้วให้อัปเดต
      imageData = await prisma.img_product.update({
        where: { id: existingImage.id },
        data: {
          img_url,
          update_date: new Date()
        }
      });
    } else {
      // ถ้ายังไม่มีให้สร้างใหม่
      imageData = await prisma.img_product.create({
        data: {
          product_id: productId,
          img_url,
          update_date: new Date()
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: "บันทึกรูปภาพสินค้าสำเร็จ",
      data: imageData
    });
  } catch (error) {
    console.error("Error saving product image:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการบันทึกรูปภาพสินค้า" },
      { status: 500 }
    );
  }
}

// DELETE - ลบข้อมูลรูปภาพสินค้า
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    const productId = parseInt((await params).productId);
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "รหัสสินค้าไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const existingImage = await prisma.img_product.findUnique({
      where: { product_id: productId }
    });

    if (!existingImage) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลรูปภาพสินค้า" },
        { status: 404 }
      );
    }

    await prisma.img_product.delete({
      where: { id: existingImage.id }
    });

    return NextResponse.json({
      success: true,
      message: "ลบรูปภาพสินค้าสำเร็จ"
    });
  } catch (error) {
    console.error("Error deleting product image:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการลบรูปภาพสินค้า" },
      { status: 500 }
    );
  }
}