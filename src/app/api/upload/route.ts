import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { existsSync } from "fs";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/minio";


const ALLOWED_FILE_TYPES = [

  "image/jpeg", 
  "image/png", 
  "image/webp", 
  "image/gif",

  "video/mp4",
  "video/webm",
  "video/quicktime" 
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "ไม่พบไฟล์ที่อัปโหลด" },
        { status: 400 }
      );
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "ประเภทไฟล์ไม่ได้รับอนุญาต รองรับเฉพาะไฟล์รูปภาพ (JPEG, PNG, WebP, GIF) และวิดีโอ (MP4, WebM, MOV)" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "ขนาดไฟล์ใหญ่เกินไป (สูงสุด 10MB)" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const originalName = file.name;
    const fileExtension = originalName.split('.').pop();
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const fileName = `${timestamp}${randomNum}.${fileExtension}`;
 
    const bucketName = "product-images";

    const uploadCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
    });

    await s3Client.send(uploadCommand);

    
    // const uploadDir = join(process.cwd(), 'public/uploads');
    // if (!existsSync(uploadDir)) {
    //   try {
    //     await mkdir(uploadDir, { recursive: true });
    //   } catch (error) {
    //     console.error('Error creating upload directory:', error);
    //     return NextResponse.json(
    //       { error: "เกิดข้อผิดพลาดในการสร้างโฟลเดอร์อัปโหลด" },
    //       { status: 500 }
    //     );
    //   }
    // }
    
    // try {
    //   await writeFile(`${uploadDir}/${fileName}`, buffer);
    // } catch (error) {
    //   console.error('Error saving file:', error);
    //   return NextResponse.json(
    //     { error: "เกิดข้อผิดพลาดในการบันทึกไฟล์" },
    //     { status: 500 }
    //   );
    // }
    // const fileUrl = `/uploads/${fileName}`;
    const fileUrl = `http://localhost:9000/${bucketName}/${fileName}`;
    
    console.log("recent file path:",fileUrl)

    const isVideo = file.type.startsWith('video/');
    
    return NextResponse.json({
      success: true,
      message: `อัปโหลด${isVideo ? 'วิดีโอ' : 'รูปภาพ'}สำเร็จ`,
      url: fileUrl,
      fileName: fileName,
      originalName: originalName,
      fileType: file.type,
      isVideo: isVideo
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการอัปโหลดไฟล์" },
      { status: 500 }
    );
  }
}