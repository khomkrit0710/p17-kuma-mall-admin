import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

function calculateFlashSaleStatus(startDate: Date, endDate: Date, quantity: number): string {
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

export async function GET(request: Request) {
  try {
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
    const statusParams = searchParams.getAll("status");
    const skip = (page - 1) * limit;
    const whereCondition: Record<string, unknown> = {};
    
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

    const flashSales = await prisma.flash_sale.findMany({
      where: whereCondition,
      include: {
        product: {
          select: {
            name_sku: true,
            img_product: true,
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

    const updatedFlashSales = [];
    for (const flashSale of flashSales) {
      const startDate = new Date(flashSale.start_date);
      const endDate = new Date(flashSale.end_date);
      const currentStatus = flashSale.status;
      const newStatus = calculateFlashSaleStatus(startDate, endDate, flashSale.quantity);
      
      if (currentStatus !== newStatus) {
        await prisma.flash_sale.update({
          where: { id: flashSale.id },
          data: { status: newStatus }
        });

        updatedFlashSales.push({
          ...flashSale,
          status: newStatus
        });
      } else {
        updatedFlashSales.push(flashSale);
      }
    }

    const totalFlashSales = await prisma.flash_sale.count({
      where: whereCondition
    });

    const totalPages = Math.ceil(totalFlashSales / limit);

    return NextResponse.json({
      data: updatedFlashSales.map(sale => ({
        ...sale,
        product: {
          ...sale.product,
          img_url_product: sale.product.img_product?.img_url_product || null,
        }
      })),
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


export async function POST(request: Request) {
  try {
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
      price_origin
    } = await request.json();

    if (!sku || !start_date || !end_date || quantity === undefined || flash_sale_price === undefined || price_origin === undefined || flash_sale_per === undefined) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลให้ครบถ้วน" },
        { status: 400 }
      );
    }

    const existingProduct = await prisma.product.findUnique({
      where: { sku }
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "ไม่พบสินค้าที่ระบุ" },
        { status: 404 }
      );
    }

    const existingFlashSale = await prisma.flash_sale.findUnique({
      where: { sku }
    });
    
    if (existingFlashSale) {
      if (existingFlashSale.status === 'active' || existingFlashSale.status === 'pending') {
        return NextResponse.json(
          { error: "สินค้านี้มี Flash Sale ที่กำลังดำเนินการหรือกำลังจะเริ่มอยู่แล้ว" },
          { status: 400 }
        );
      }

      if (existingFlashSale.status === 'expired' || existingFlashSale.status === 'sold_out') {
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);
        const status = calculateFlashSaleStatus(startDate, endDate, Number(quantity));
        
        const updatedFlashSale = await prisma.flash_sale.update({
          where: { id: existingFlashSale.id },
          data: {
            start_date: startDate,
            end_date: endDate,
            quantity: Number(quantity),
            flash_sale_price: Number(flash_sale_price),
            flash_sale_per: Number(flash_sale_per),
            price_origin: Number(price_origin),
            status: status
          }
        });
    
        return NextResponse.json({
          success: true,
          message: `อัปเดต Flash Sale จากเดิมที่${existingFlashSale.status === 'expired' ? "หมดเวลา" : "สินค้าหมด"}แล้วสำเร็จ`,
          data: updatedFlashSale
        });
      }

      return NextResponse.json(
        { error: "สินค้านี้มี Flash Sale อยู่แล้ว" },
        { status: 400 }
      );
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const status = calculateFlashSaleStatus(startDate, endDate, Number(quantity));

    const newFlashSale = await prisma.flash_sale.create({
      data: {
        sku,
        start_date: startDate,
        end_date: endDate,
        quantity: Number(quantity),
        flash_sale_price: Number(flash_sale_price),
        flash_sale_per: Number(flash_sale_per),
        price_origin: Number(price_origin),
        status
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