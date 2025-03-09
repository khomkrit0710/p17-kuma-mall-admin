// src/component/DashboardLayout.tsx
'use client';

import React from 'react';
import Navbar from '@/component/Navbar';
import Sidebar from '@/component/Sidebar';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex flex-1 h-full">
          <aside className="w-64">
            <Sidebar />
          </aside>
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}