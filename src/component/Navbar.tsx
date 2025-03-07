'use client';

import React from 'react';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';

function Navbar() {
  const { data: session } = useSession();

  return (
    <div 
      className='bg-[#3c434a] p-1 flex items-center justify-between' 
      style={{borderBottom:"2px solid black"}}
    >
      <div className='text-white'>
        <Link href="/">หน้าหลัก</Link>
      </div>
      <div className='text-white'>ระบบหลังบ้าน Kuma-mall</div>
      <div className='text-white flex items-center gap-4'>
        {session ? (
          <>
            <span>สวัสดี, {session.user?.name || session.user?.email}</span>
            <button 
              onClick={() => signOut({ callbackUrl: '/login' })}
              className='bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors'
            >
              ออกจากระบบ
            </button>
          </>
        ) : (
          <Link 
            href="/login"
            className='bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors'
          >
            เข้าสู่ระบบ
          </Link>
        )}
      </div>
    </div>
  );
}

export default Navbar;