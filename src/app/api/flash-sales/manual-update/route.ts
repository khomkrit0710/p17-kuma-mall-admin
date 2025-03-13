import { NextResponse } from "next/server";
import { runFlashSaleUpdates } from "@/lib/cronService";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    const results = await runFlashSaleUpdates();

    return NextResponse.json({
      success: true,
      message: "อัปเดตสถานะ Flash Sale สำเร็จ",
      ...results
    });
  } catch (error) {
    console.error("Error manually updating flash sale statuses:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการอัปเดตสถานะ Flash Sale" },
      { status: 500 }
    );
  }
}