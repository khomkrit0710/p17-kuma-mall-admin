import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

function calculateFlashSaleStatus(startDate: Date, endDate: Date, quantity: number, currentStatus?: string): string {
  const now = new Date();
  
  if (quantity <= 0) {
    return "sold_out";
  } else if (now < startDate) {
    return "pending";
  } else if (now > endDate) {
    return "expired";
  } else {
    return "active";
  }
}

export async function GET(
  request: Request,
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

    const startDate = new Date(flashSale.start_date);
    const endDate = new Date(flashSale.end_date);
    const currentStatus = flashSale.status;
    const newStatus = calculateFlashSaleStatus(startDate, endDate, flashSale.quantity);

    if (currentStatus !== newStatus) {
      await prisma.flash_sale.update({
        where: { id: flashSaleId },
        data: { status: newStatus }
      });

      flashSale.status = newStatus;
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

export async function PUT(
  request: Request,
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

    if (!start_date || !end_date || quantity === undefined || flash_sale_price === undefined || price_origin === undefined || flash_sale_per === undefined) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลให้ครบถ้วน" },
        { status: 400 }
      );
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (startDate >= endDate) {
      return NextResponse.json(
        { error: "วันและเวลาเริ่มต้นต้องน้อยกว่าวันและเวลาสิ้นสุด" },
        { status: 400 }
      );
    }

    let calculatedStatus = status;
    if (!status) {
      calculatedStatus = calculateFlashSaleStatus(startDate, endDate, Number(quantity), existingFlashSale.status);
    }

    const updatedFlashSale = await prisma.flash_sale.update({
      where: { id: flashSaleId },
      data: {
        start_date: startDate,
        end_date: endDate,
        quantity: Number(quantity),
        flash_sale_price: Number(flash_sale_price),
        flash_sale_per: Number(flash_sale_per),
        price_origin: Number(price_origin),
        status: calculatedStatus
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

export async function DELETE(
  request: Request,
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

    const existingFlashSale = await prisma.flash_sale.findUnique({
      where: { id: flashSaleId }
    });

    if (!existingFlashSale) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูล Flash Sale" },
        { status: 404 }
      );
    }

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