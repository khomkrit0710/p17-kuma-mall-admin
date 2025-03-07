'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/component/DashboardLayout';

// กำหนดประเภทของข้อมูลหมวดหมู่
type Category = {
  id: number;
  uuid: string;
  name: string;
  description: string | null;
  create_Date: string;
};

export default function CategoriesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  // สถานะสำหรับรายการหมวดหมู่
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalCategories, setTotalCategories] = useState(0);
  
  // สถานะสำหรับการเพิ่ม/แก้ไขหมวดหมู่
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: 0,
    name: '',
    description: '',
  });
  
  // สถานะสำหรับการโหลดและข้อผิดพลาด
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // ตรวจสอบการเข้าสู่ระบบ
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);
  
  // โหลดข้อมูลหมวดหมู่
  useEffect(() => {
    if (status !== 'authenticated') return;
    
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/categories');
        
        if (!response.ok) {
          throw new Error('ไม่สามารถโหลดข้อมูลหมวดหมู่ได้');
        }
        
        const data = await response.json();
        setCategories(data);
        setTotalCategories(data.length);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCategories();
  }, [status]);
  
  // เปิดฟอร์มเพิ่มหมวดหมู่
  const handleAddCategory = () => {
    if (totalCategories >= 20) {
      setError('ไม่สามารถเพิ่มหมวดหมู่ได้อีก เนื่องจากมีจำนวนหมวดหมู่สูงสุดแล้ว (20 รายการ)');
      return;
    }
    
    setFormData({ id: 0, name: '', description: '' });
    setIsEditing(false);
    setShowForm(true);
    setError(null);
  };
  
  // เปิดฟอร์มแก้ไขหมวดหมู่
  const handleEditCategory = (category: Category) => {
    setFormData({ 
      id: category.id, 
      name: category.name, 
      description: category.description || '' 
    });
    setIsEditing(true);
    setShowForm(true);
    setError(null);
  };
  
  // จัดการการเปลี่ยนแปลงข้อมูลในฟอร์ม
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // บันทึกหมวดหมู่
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    if (!formData.name.trim()) {
      setError('กรุณาระบุชื่อหมวดหมู่');
      setSubmitting(false);
      return;
    }
    
    try {
      let response;
      
      if (isEditing) {
        // แก้ไขหมวดหมู่
        response = await fetch(`/api/categories/${formData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
          }),
        });
      } else {
        // เพิ่มหมวดหมู่ใหม่
        response = await fetch('/api/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
          }),
        });
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการบันทึกหมวดหมู่');
      }
      
      // รีเซ็ตฟอร์ม
      setFormData({ id: 0, name: '', description: '' });
      setShowForm(false);
      
      // แสดงข้อความสำเร็จ
      setSuccess(isEditing ? 'แก้ไขหมวดหมู่สำเร็จ' : 'เพิ่มหมวดหมู่สำเร็จ');
      
      // โหลดข้อมูลหมวดหมู่ใหม่
      const fetchResponse = await fetch('/api/categories');
      const fetchData = await fetchResponse.json();
      setCategories(fetchData);
      setTotalCategories(fetchData.length);
      
      // ลบข้อความสำเร็จหลัง 3 วินาที
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึกหมวดหมู่');
    } finally {
      setSubmitting(false);
    }
  };
  
  // ลบหมวดหมู่
  const handleDeleteCategory = async (id: number) => {
    if (!confirm('คุณต้องการลบหมวดหมู่นี้ใช่หรือไม่?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการลบหมวดหมู่');
      }
      
      // แสดงข้อความสำเร็จ
      setSuccess('ลบหมวดหมู่สำเร็จ');
      
      // โหลดข้อมูลหมวดหมู่ใหม่
      const fetchResponse = await fetch('/api/categories');
      const data = await fetchResponse.json();
      setCategories(data);
      setTotalCategories(data.length);
      
      // ลบข้อความสำเร็จหลัง 3 วินาที
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการลบหมวดหมู่');
      
      // ลบข้อความข้อผิดพลาดหลัง 3 วินาที
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };
  
  // ฟังก์ชันแปลงวันที่ให้อยู่ในรูปแบบไทย
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  if (status === 'loading') {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-xl">กำลังโหลดข้อมูล...</div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="container mx-auto p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">จัดการหมวดหมู่</h1>
          <button
            onClick={handleAddCategory}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
            disabled={totalCategories >= 20}
          >
            เพิ่มหมวดหมู่
          </button>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>ผิดพลาด!</strong> {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <strong>สำเร็จ!</strong> {success}
          </div>
        )}
        
        {/* จำนวนหมวดหมู่ทั้งหมด */}
        <div className="mb-4 text-gray-600">
          จำนวนหมวดหมู่ทั้งหมด: <span className="font-medium">{totalCategories}</span> / <span className="font-medium">20</span> รายการ
        </div>
        
        {/* ฟอร์มเพิ่ม/แก้ไขหมวดหมู่ */}
        {showForm && (
          <div className="bg-white p-6 rounded shadow-md mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{isEditing ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่'}</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อหมวดหมู่ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  คำอธิบาย
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded h-24"
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors mr-2"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  disabled={submitting}
                >
                  {submitting ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* ตารางแสดงข้อมูลหมวดหมู่ */}
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อหมวดหมู่</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">คำอธิบาย</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่สร้าง</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">จัดการ</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center">กำลังโหลดข้อมูล...</td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center">ไม่พบข้อมูลหมวดหมู่</td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{category.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-500">
                        {category.description ? (
                          category.description.length > 100 ? (
                            <span>{category.description.slice(0, 100)}...</span>
                          ) : (
                            category.description
                          )
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">{formatDate(category.create_Date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}