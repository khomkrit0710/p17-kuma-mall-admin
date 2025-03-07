import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient()

export async function GET() {
    const posts = await prisma.product.findMany()
    return Response.json(posts)
}

export async function POST(request: Request) {
    try {
        const { 
            sku,
            name_sku = "",
            quantity = 0,
            make_price = null, 
            price_origin,
            product_width = null,
            product_length = null,
            product_heigth = null, 
            product_weight = null,  
            img_url = null 
        } = await request.json()

        // ตรวจสอบว่ามีการส่งค่าที่จำเป็นมาหรือไม่
        if (!sku || price_origin === undefined) {
            return NextResponse.json({ 
                success: false, 
                error: "กรุณาระบุ sku และ price_origin" 
            }, { status: 400 });
        }

        const newProduct = await prisma.product.create({
            data: {
                sku,
                name_sku,
                quantity,
                make_price,
                price_origin,
                product_width,
                product_length,
                product_heigth,
                product_weight,
                img_url
            }
        })
        
        return NextResponse.json({ 
            success: true,
            data: newProduct 
        });
    } catch (error) {
        console.error("Error creating product:", error);
        return NextResponse.json({
            success: false,
            error: "เกิดข้อผิดพลาดในการสร้างสินค้า"
        }, { status: 500 });
    }
}