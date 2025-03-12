import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(
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

    const flashSaleId = parseInt((await params).id);
    if (isNaN(flashSaleId)) {
      return NextResponse.json(
        { error: "รหัส Flash Sale ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const { purchaseQuantity = 1 } = await request.json();
    
    const flashSale = await prisma.flash_sale.findUnique({
      where: { id: flashSaleId }
    });

    if (!flashSale) {
      return NextResponse.json(
        { error: "ไม่พบ Flash Sale" },
        { status: 404 }
      );
    }

    if (flashSale.status !== "active") {
      return NextResponse.json(
        { error: `Flash Sale ไม่พร้อมให้ซื้อ (สถานะปัจจุบัน: ${flashSale.status})` },
        { status: 400 }
      );
    }

    if (purchaseQuantity > flashSale.quantity) {
      return NextResponse.json(
        { error: `จำนวนสินค้าไม่เพียงพอ (เหลือ: ${flashSale.quantity})` },
        { status: 400 }
      );
    }

    const updatedQuantity = flashSale.quantity - purchaseQuantity;
    const newStatus = updatedQuantity <= 0 ? "sold_out" : "active";

    const updatedFlashSale = await prisma.flash_sale.update({
      where: { id: flashSaleId },
      data: {
        quantity: updatedQuantity,
        status: newStatus
      }
    });

    await prisma.product.update({
      where: { sku: flashSale.sku },
      data: {
        quantity: {
          decrement: purchaseQuantity
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: "อัปเดตจำนวนสินค้า Flash Sale สำเร็จ",
      data: {
        id: updatedFlashSale.id,
        remainingQuantity: updatedFlashSale.quantity,
        status: updatedFlashSale.status
      }
    });
  } catch (error) {
    console.error("Error purchasing flash sale:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการซื้อสินค้า Flash Sale" },
      { status: 500 }
    );
  }
}