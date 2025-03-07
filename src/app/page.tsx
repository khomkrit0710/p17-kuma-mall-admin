// app/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function Home() {
  const { data: session } = useSession();
  
  return (
    <div className="container mx-auto px-8 py-12">
      <h1 className="text-3xl font-bold mb-6">ยินดีต้อนรับสู่ระบบหลังบ้าน Kuma-mall</h1>
      
      {session ? (
        <div className="bg-white p-6 rounded shadow-md">
          <h2 className="text-xl font-semibold mb-4">สวัสดี, {session.user.username}</h2>
          
          <p className="mb-4">
            คุณสามารถจัดการร้านค้าได้โดยใช้เมนูด้านซ้าย เพื่อเข้าถึงฟังก์ชันต่างๆ:
          </p>
          
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>เพิ่มสินค้าใหม่เข้าสู่ระบบ</li>
            <li>ดูและแก้ไขรายการสินค้าที่มีอยู่</li>
            {session.user.role === 'SUPER_ADMIN' && (
              <li>จัดการผู้ดูแลระบบ (สำหรับ Super Admin เท่านั้น)</li>
            )}
          </ul>
          
          <div className="p-4 bg-blue-50 rounded border border-blue-200">
            <h3 className="text-lg font-medium text-blue-700 mb-2">สิทธิ์การใช้งานของคุณ: {session.user.role}</h3>
            
            {session.user.role === 'SUPER_ADMIN' ? (
              <p className="text-blue-600">
                คุณมีสิทธิ์ Super Admin ซึ่งสามารถเข้าถึงทุกฟังก์ชันในระบบ รวมถึงการจัดการผู้ดูแลระบบอื่นๆ
              </p>
            ) : (
              <p className="text-blue-600">
                คุณมีสิทธิ์ Admin ซึ่งสามารถจัดการสินค้าและดูรายงานต่าง ๆ หากต้องการสิทธิ์เพิ่มเติม กรุณาติดต่อ Super Admin
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 p-6 rounded shadow-md border border-yellow-200">
          <p className="text-yellow-700">
            กรุณาเข้าสู่ระบบเพื่อใช้งานระบบหลังบ้าน 
          </p>
          <Link href={"./login"}> เข้าสู่ระบบ </Link>
        </div>
      )}
    </div>
  );
}