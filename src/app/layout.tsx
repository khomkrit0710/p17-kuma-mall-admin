import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/component/SessionProvider";

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