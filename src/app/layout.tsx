// src/app/layout.tsx (อัปเดต)
import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/component/SessionProvider";
import { initializeServices } from "@/lib/init";

if (process.env.ENABLE_FLASH_SALE_CRON === 'true' && typeof window === 'undefined') {
  initializeServices();
  console.log('Server-side services initialized');
}

export const metadata: Metadata = {
  title: 'ระบบหลังบ้าน Kuma-mall',
  description: 'ระบบจัดการร้านค้าออนไลน์ Kuma-mall',
  keywords: 'admin, dashboard, kuma-mall'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}