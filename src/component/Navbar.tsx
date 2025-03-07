'use client';

import React from 'react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { Session } from 'next-auth';

type NavbarProps = {
  session: Session | null;
};


function Navbar({ session }: NavbarProps) {
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
        <span>สวัสดี</span>
        <button 
          onClick={() => signOut({ callbackUrl: '/login' })}
          className='bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors'
        >
          ออกจากระบบ
        </button>
      </div>
    </div>
  );
}

export default Navbar;