import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {

    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get("api_key");
    const secretKey = process.env.UPDATE_FLASH_SALE_API_KEY;

    if (!secretKey || apiKey !== secretKey) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    const soldOutFlashSales = await prisma.flash_sale.findMany({
      where: {
        status: "active",
        quantity: {
          lte: 0
        }
      }
    });

    const result = {
      total: soldOutFlashSales.length,
      updatedToSoldOut: 0,
      errors: 0,
    };

    for (const flashSale of soldOutFlashSales) {
      try {
        await prisma.flash_sale.update({
          where: { id: flashSale.id },
          data: { status: "sold_out" }
        });
        
        result.updatedToSoldOut++;
      } catch (error) {
        result.errors++;
        console.error(`Error updating sold out flash sale ID ${flashSale.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Sold out flash sales updated successfully",
      result
    });
  } catch (error) {
    console.error("Error updating sold out flash sales:", error);
    return NextResponse.json(
      { error: "Failed to update sold out flash sales" },
      { status: 500 }
    );
  }
}