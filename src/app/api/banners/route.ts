import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    const bannerData = await prisma.$queryRaw`SELECT * FROM "banner_silder" LIMIT 1`;

    const result = Array.isArray(bannerData) && bannerData.length > 0 ? bannerData[0] : null;
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching banner data:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลแบนเนอร์" },
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

    const existingBannerResult = await prisma.$queryRaw`SELECT id FROM "banner_silder" LIMIT 1`;
    const existingBanner = Array.isArray(existingBannerResult) && existingBannerResult.length > 0;
    
    if (existingBanner) {
      return NextResponse.json(
        { error: "มีข้อมูลแบนเนอร์อยู่แล้ว โปรดใช้ PUT เพื่ออัปเดต" },
        { status: 400 }
      );
    }

    const bannerData = await request.json();

    const result = await prisma.$executeRaw`
      INSERT INTO "banner_silder" (
        logo_main, 
        popup_normolly, 
        banner_login_register, 
        banner_slider_homepage, 
        banner_coupon_homepage_sec_1, 
        banner_coupon_homepage_sec_2, 
        banner_coupon_homepage_body,
        create_date,
        update_date
      ) VALUES (
        ${bannerData.logo_main || null},
        ${bannerData.popup_normolly || null},
        ${bannerData.banner_login_register || null},
        ${bannerData.banner_slider_homepage || []},
        ${bannerData.banner_coupon_homepage_sec_1 || null},
        ${bannerData.banner_coupon_homepage_sec_2 || null},
        ${bannerData.banner_coupon_homepage_body || null},
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      RETURNING *;
    `;

    const newBannerData = await prisma.$queryRaw`SELECT * FROM "banner_silder" ORDER BY id DESC LIMIT 1`;
    const newBanner = Array.isArray(newBannerData) && newBannerData.length > 0 ? newBannerData[0] : null;

    return NextResponse.json({
      success: true,
      message: "สร้างข้อมูลแบนเนอร์สำเร็จ",
      data: newBanner,
    });
  } catch (error) {
    console.error("Error creating banner data:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสร้างข้อมูลแบนเนอร์" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    const bannerData = await request.json();
    
    // ตรวจสอบว่ามีข้อมูลแบนเนอร์อยู่แล้วหรือไม่
    const existingBannerResult = await prisma.$queryRaw`SELECT id FROM "banner_silder" LIMIT 1`;
    const existingBanner = Array.isArray(existingBannerResult) && existingBannerResult.length > 0 
      ? existingBannerResult[0] 
      : null;
    
    let updatedBanner;
    
    if (existingBanner) {
      // อัปเดตข้อมูลที่มีอยู่
      await prisma.$executeRaw`
        UPDATE "banner_silder" 
        SET 
          logo_main = ${bannerData.logo_main},
          popup_normolly = ${bannerData.popup_normolly},
          banner_login_register = ${bannerData.banner_login_register},
          banner_slider_homepage = ${bannerData.banner_slider_homepage || []},
          banner_coupon_homepage_sec_1 = ${bannerData.banner_coupon_homepage_sec_1},
          banner_coupon_homepage_sec_2 = ${bannerData.banner_coupon_homepage_sec_2},
          banner_coupon_homepage_body = ${bannerData.banner_coupon_homepage_body},
          update_date = CURRENT_TIMESTAMP
        WHERE id = ${existingBanner.id}
      `;
      
      // ดึงข้อมูลที่อัปเดตแล้ว
      const updatedResult = await prisma.$queryRaw`SELECT * FROM "banner_silder" WHERE id = ${existingBanner.id}`;
      updatedBanner = Array.isArray(updatedResult) && updatedResult.length > 0 ? updatedResult[0] : null;
    } else {
      // สร้างข้อมูลใหม่ถ้ายังไม่มี
      await prisma.$executeRaw`
        INSERT INTO "banner_silder" (
          logo_main, 
          popup_normolly, 
          banner_login_register, 
          banner_slider_homepage, 
          banner_coupon_homepage_sec_1, 
          banner_coupon_homepage_sec_2, 
          banner_coupon_homepage_body,
          create_date,
          update_date
        ) VALUES (
          ${bannerData.logo_main || null},
          ${bannerData.popup_normolly || null},
          ${bannerData.banner_login_register || null},
          ${bannerData.banner_slider_homepage || []},
          ${bannerData.banner_coupon_homepage_sec_1 || null},
          ${bannerData.banner_coupon_homepage_sec_2 || null},
          ${bannerData.banner_coupon_homepage_body || null},
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
      `;
      
      // ดึงข้อมูลที่เพิ่งสร้าง
      const newResult = await prisma.$queryRaw`SELECT * FROM "banner_silder" ORDER BY id DESC LIMIT 1`;
      updatedBanner = Array.isArray(newResult) && newResult.length > 0 ? newResult[0] : null;
    }

    return NextResponse.json({
      success: true,
      message: "อัปเดตข้อมูลแบนเนอร์สำเร็จ",
      data: updatedBanner,
    });
  } catch (error) {
    console.error("Error updating banner data:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการอัปเดตข้อมูลแบนเนอร์" },
      { status: 500 }
    );
  }
}