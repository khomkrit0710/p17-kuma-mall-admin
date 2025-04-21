import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    const { skus } = await request.json();

    if (!skus || !Array.isArray(skus) || skus.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "กรุณาระบุรายการ SKU ที่ต้องการตรวจสอบ" 
      }, { status: 400 });
    }

    const existingProducts = await prisma.product.findMany({
      where: { 
        sku: { 
          in: skus 
        } 
      },
      select: {
        sku: true
      }
    });

    if (existingProducts.length > 0) {
      const duplicateSKUs = existingProducts.map(product => product.sku);
      return NextResponse.json({ 
        success: false, 
        duplicates: duplicateSKUs
      });
    }

    return NextResponse.json({ 
      success: true,
      duplicates: []
    });
  } catch (error) {
    console.error("Error checking duplicate SKUs:", error);
    return NextResponse.json({
      success: false,
      error: "เกิดข้อผิดพลาดในการตรวจสอบรหัสสินค้า"
    }, { status: 500 });
  }
} 