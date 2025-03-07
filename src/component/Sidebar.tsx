// app/components/Sidebar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Session } from 'next-auth';

type SidebarProps = {
  session: Session | null;
};

function Sidebar({ session }: SidebarProps) {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';

  return (
    <div className='bg-[#26292c] text-white min-h-screen'>
      <ul className='space-y-2'>
        <li>
          <Link 
            href="/products/add" 
            className={`block py-2 px-4 hover:bg-gray-700 ${isActive('/products/add') ? 'bg-gray-700' : ''}`} 
            style={{borderBottom:"2px solid gray"}}
          >
            เพิ่มสินค้า
          </Link>
        </li>
        <li>
          <Link 
            href="/products/list" 
            className={`block py-2 px-4 hover:bg-gray-700 ${isActive('/products/list') ? 'bg-gray-700' : ''}`} 
            style={{borderBottom:"2px solid gray"}}
          >
            รายการสินค้า
          </Link>
        </li>
        
        {/* แสดงเฉพาะผู้ใช้ที่มีสิทธิ์ Super Admin */}
        {isSuperAdmin && (
          <li>
            <Link 
              href="/admin/manage" 
              className={`block py-2 px-4 hover:bg-gray-700 ${isActive('/admin/manage') ? 'bg-gray-700' : ''}`} 
              style={{borderBottom:"2px solid gray"}}
            >
              Super Admin
            </Link>
          </li>
        )}
      </ul>
    </div>
  );
}

export default Sidebar;