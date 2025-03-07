import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

// ดึงข้อมูล Flash Sale ตาม ID
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

    const flashSaleId = parseInt(params.id);
    
    // ตรวจสอบว่า ID เป็นตัวเลขหรือไม่
    if (isNaN(flashSaleId)) {
      return NextResponse.json(
        { error: "รหัส Flash Sale ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    // ดึงข้อมูล Flash Sale พร้อมข้อมูลสินค้า
    const flashSale = await prisma.flash_sale.findUnique({
      where: { id: flashSaleId },
      include: {
        product: {
          select: {
            id: true,
            name_sku: true,
            sku: true,
            img_url: true,
            quantity: true,
            price_origin: true
          }
        }
      }
    });

    if (!flashSale) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูล Flash Sale" },
        { status: 404 }
      );
    }

    return NextResponse.json(flashSale);
  } catch (error) {
    console.error("Error fetching flash sale:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูล Flash Sale" },
      { status: 500 }
    );
  }
}

// อัปเดตข้อมูล Flash Sale
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

    const flashSaleId = parseInt(params.id);
    
    // ตรวจสอบว่า ID เป็นตัวเลขหรือไม่
    if (isNaN(flashSaleId)) {
      return NextResponse.json(
        { error: "รหัส Flash Sale ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    // ตรวจสอบว่ามี Flash Sale นี้อยู่จริงหรือไม่
    const existingFlashSale = await prisma.flash_sale.findUnique({
      where: { id: flashSaleId }
    });

    if (!existingFlashSale) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูล Flash Sale" },
        { status: 404 }
      );
    }

    const {
      start_date,
      end_date,
      quantity,
      flash_sale_price,
      flash_sale_per,
      price_origin,
      status = null
    } = await request.json();

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!start_date || !end_date || quantity === undefined || flash_sale_price === undefined || price_origin === undefined || flash_sale_per === undefined) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลให้ครบถ้วน" },
        { status: 400 }
      );
    }

    // กำหนดสถานะ Flash Sale โดยอัตโนมัติ
    let calculatedStatus = status;
    
    if (!status) {
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      const now = new Date();

      if (startDate > now) {
        calculatedStatus = "pending"; // กำลังจะเริ่ม
      } else if (endDate < now) {
        calculatedStatus = "expired"; // หมดเวลา
      } else {
        calculatedStatus = "active"; // กำลังดำเนินการ
      }
    }

    // อัปเดตข้อมูล Flash Sale
    const updatedFlashSale = await prisma.flash_sale.update({
      where: { id: flashSaleId },
      data: {
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        quantity: Number(quantity),
        flash_sale_price: Number(flash_sale_price),
        flash_sale_per: Number(flash_sale_per),
        price_origin: Number(price_origin),
        status: calculatedStatus || existingFlashSale.status
      }
    });

    return NextResponse.json({
      success: true,
      message: "อัปเดต Flash Sale สำเร็จ",
      data: updatedFlashSale
    });
  } catch (error) {
    console.error("Error updating flash sale:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการอัปเดต Flash Sale" },
      { status: 500 }
    );
  }
}

// ลบ Flash Sale
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

    const flashSaleId = parseInt(params.id);
    
    // ตรวจสอบว่า ID เป็นตัวเลขหรือไม่
    if (isNaN(flashSaleId)) {
      return NextResponse.json(
        { error: "รหัส Flash Sale ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    // ตรวจสอบว่ามี Flash Sale นี้อยู่จริงหรือไม่
    const existingFlashSale = await prisma.flash_sale.findUnique({
      where: { id: flashSaleId }
    });

    if (!existingFlashSale) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูล Flash Sale" },
        { status: 404 }
      );
    }

    // ลบ Flash Sale
    await prisma.flash_sale.delete({
      where: { id: flashSaleId }
    });

    return NextResponse.json({
      success: true,
      message: "ลบ Flash Sale สำเร็จ"
    });
  } catch (error) {
    console.error("Error deleting flash sale:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการลบ Flash Sale" },
      { status: 500 }
    );
  }
}