import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/component/Navbar";
import Sidebar from "@/component/Sidebar";

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
    <html lang="en">
      <body>
        <Navbar session={null} />
      <main className="w-full min-h-screen">
        {children}
      </main>
        <Sidebar session={null} />
      </body>
    </html>
  );
}
