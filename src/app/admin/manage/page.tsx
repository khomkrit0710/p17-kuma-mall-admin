'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/component/DashboardLayout';


type Admin = {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
};

export default function AdminManage() {

  const { data: session, status } = useSession();
  const router = useRouter();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newAdmin, setNewAdmin] = useState({ username: '', password: '', role: 'admin' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [passwordReset, setPasswordReset] = useState<{
    adminId: string | null;
    newPassword: string;
    showForm: boolean;
  }>({
    adminId: null,
    newPassword: '',
    showForm: false
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user || session.user.role !== 'superadmin') {
        router.push('/');
    } else {
      fetchAdmins();
    }
  }, [session, status, router]);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/admin');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      }
      const data = await response.json();
      setAdmins(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const addNewAdmin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAdmin),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'เกิดข้อผิดพลาดในการเพิ่มผู้ดูแลระบบ');
      }
      
      setNewAdmin({ username: '', password: '', role: 'admin' });
      setShowAddForm(false);
      fetchAdmins();
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเพิ่มผู้ดูแลระบบ');
    }
  };

  const resetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (!passwordReset.adminId) return;

      const response = await fetch('/api/auth/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: passwordReset.adminId,
          password: passwordReset.newPassword
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
      }
      
      setPasswordReset({ adminId: null, newPassword: '', showForm: false });
      alert('เปลี่ยนรหัสผ่านสำเร็จ');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
    }
  };

  const deleteAdmin = async (adminId: string) => {
    if (!confirm('คุณต้องการลบผู้ดูแลระบบนี้ใช่หรือไม่?')) {
      return;
    }
    
    try {
      const response = await fetch('/api/auth/admin/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'เกิดข้อผิดพลาดในการลบผู้ดูแลระบบ');
      }

      fetchAdmins();
      alert('ลบผู้ดูแลระบบสำเร็จ');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการลบผู้ดูแลระบบ');
    }
  };

  if (status === 'loading' || loading) {
    return <div className="p-8">กำลังโหลด...</div>;
  }

  if (!session?.user || session.user.role !== 'superadmin') {
    return null;
  }

  return (
    <DashboardLayout>
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">จัดการผู้ดูแลระบบ</h1>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="mb-6">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
        >
          {showAddForm ? 'ยกเลิก' : 'เพิ่มผู้ดูแลระบบใหม่'}
        </button>
      </div>
      
      {showAddForm && (
        <div className="bg-white p-6 rounded shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">เพิ่มผู้ดูแลระบบใหม่</h2>
          <form onSubmit={addNewAdmin}>
            <div className="mb-4">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อผู้ใช้
              </label>
              <input
                type="text"
                id="username"
                className="w-full p-2 border border-gray-300 rounded"
                value={newAdmin.username}
                onChange={(e) => setNewAdmin({...newAdmin, username: e.target.value})}
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                รหัสผ่าน
              </label>
              <input
                type="password"
                id="password"
                className="w-full p-2 border border-gray-300 rounded"
                value={newAdmin.password}
                onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                บทบาท
              </label>
              <select
                id="role"
                className="w-full p-2 border border-gray-300 rounded"
                value={newAdmin.role}
                onChange={(e) => setNewAdmin({...newAdmin, role: e.target.value})}
              >
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>
            
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              บันทึก
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อผู้ใช้</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">บทบาท</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">อีเมล</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เปลี่ยนรหัสผ่าน</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ลบ</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {admins.map((admin) => (
              <tr key={admin.id}>
                <td className="px-6 py-4 whitespace-nowrap">{admin.username}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    admin.role === 'superadmin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {admin.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {admin.email || 'ไม่ระบุ'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => setPasswordReset({
                      adminId: admin.id,
                      newPassword: '',
                      showForm: true
                    })}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    เปลี่ยนรหัสผ่าน
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {admin.id !== session.user?.id ? (
                    <button
                      onClick={() => deleteAdmin(admin.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      ลบ
                    </button>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {passwordReset.showForm && (
        <div className="fixed inset-0 backdrop-blur-x bg-white/30 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">เปลี่ยนรหัสผ่าน</h2>
            <form onSubmit={resetPassword}>
              <div className="mb-4">
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  รหัสผ่านใหม่
                </label>
                <input
                  type="password"
                  id="newPassword"
                  className="w-full p-2 border border-gray-300 rounded"
                  value={passwordReset.newPassword}
                  onChange={(e) => setPasswordReset({...passwordReset, newPassword: e.target.value})}
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setPasswordReset({adminId: null, newPassword: '', showForm: false})}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </DashboardLayout>
  );
}