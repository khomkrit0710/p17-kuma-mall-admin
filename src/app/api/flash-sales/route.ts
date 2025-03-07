import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

// ดึงข้อมูล Flash Sale ทั้งหมด
export async function GET(request: Request) {
  try {
    // ตรวจสอบสิทธิ์การเข้าถึง
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    
    // สถานะที่เลือก
    const statusParams = searchParams.getAll("status");
    
    const skip = (page - 1) * limit;

    // สร้างเงื่อนไขการค้นหา
    let whereCondition: any = {};
    
    if (search) {
      whereCondition.sku = {
        contains: search,
        mode: "insensitive"
      };
    }
    
    if (statusParams.length > 0) {
      whereCondition.status = {
        in: statusParams
      };
    }

    // ดึงข้อมูล Flash Sale พร้อมข้อมูลสินค้า
    const flashSales = await prisma.flash_sale.findMany({
      where: whereCondition,
      include: {
        product: {
          select: {
            name_sku: true,
            img_url: true,
            quantity: true
          }
        }
      },
      orderBy: {
        create_date: "desc"
      },
      skip,
      take: limit
    });

    // นับจำนวน Flash Sale ทั้งหมด
    const totalFlashSales = await prisma.flash_sale.count({
      where: whereCondition
    });

    const totalPages = Math.ceil(totalFlashSales / limit);

    return NextResponse.json({
      data: flashSales,
      pagination: {
        total: totalFlashSales,
        page,
        limit,
        totalPages
      }
    });
  } catch (error) {
    console.error("Error fetching flash sales:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลแฟลชเซล" },
      { status: 500 }
    );
  }
}

// สร้าง Flash Sale ใหม่
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

    const {
      sku,
      start_date,
      end_date,
      quantity,
      flash_sale_price,
      flash_sale_per,
      price_origin,
      status = "active"
    } = await request.json();

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!sku || !start_date || !end_date || quantity === undefined || flash_sale_price === undefined || price_origin === undefined || flash_sale_per === undefined) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลให้ครบถ้วน" },
        { status: 400 }
      );
    }

    // ตรวจสอบว่ามีสินค้านี้อยู่จริงหรือไม่
    const existingProduct = await prisma.product.findUnique({
      where: { sku }
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "ไม่พบสินค้าที่ระบุ" },
        { status: 404 }
      );
    }

    // ตรวจสอบว่ามี Flash Sale สำหรับสินค้านี้อยู่แล้วหรือไม่
    const existingFlashSale = await prisma.flash_sale.findUnique({
      where: { sku }
    });

    if (existingFlashSale) {
      return NextResponse.json(
        { error: "สินค้านี้มี Flash Sale อยู่แล้ว" },
        { status: 400 }
      );
    }

    // กำหนดสถานะ Flash Sale โดยอัตโนมัติ
    let calculatedStatus = status;
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

    // สร้าง Flash Sale ใหม่
    const newFlashSale = await prisma.flash_sale.create({
      data: {
        sku,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        quantity: Number(quantity),
        flash_sale_price: Number(flash_sale_price),
        flash_sale_per: Number(flash_sale_per),
        price_origin: Number(price_origin),
        status: calculatedStatus
      }
    });

    return NextResponse.json({
      success: true,
      message: "สร้าง Flash Sale สำเร็จ",
      data: newFlashSale
    });
  } catch (error) {
    console.error("Error creating flash sale:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสร้าง Flash Sale" },
      { status: 500 }
    );
  }
}