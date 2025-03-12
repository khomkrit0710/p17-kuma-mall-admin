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

    const allFlashSales = await prisma.flash_sale.findMany();

    const result = {
      total: allFlashSales.length,
      pendingToActive: 0,
      activeToExpired: 0,
      noChange: 0,
      errors: 0,
    };

    const now = new Date();
    
    for (const flashSale of allFlashSales) {
      try {
        const startDate = new Date(flashSale.start_date);
        const endDate = new Date(flashSale.end_date);
        let newStatus = flashSale.status;

        if (now > endDate && flashSale.status !== "expired") {
          newStatus = "expired";
          result.activeToExpired++;
        }

        else if (now >= startDate && now <= endDate && flashSale.status === "pending") {
          newStatus = "active";
          result.pendingToActive++;
        }

        else {
          result.noChange++;
          continue;
        }

        await prisma.flash_sale.update({
          where: { id: flashSale.id },
          data: { status: newStatus }
        });
        
      } catch (error) {
        result.errors++;
        console.error(`Error updating flash sale ID ${flashSale.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Flash Sale statuses updated successfully",
      result
    });
  } catch (error) {
    console.error("Error updating flash sale statuses:", error);
    return NextResponse.json(
      { error: "Failed to update flash sale statuses" },
      { status: 500 }
    );
  }
}