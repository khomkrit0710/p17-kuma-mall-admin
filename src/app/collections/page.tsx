'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/component/DashboardLayout';

    //<<-------------------Type------------------->>
type Collection = {
  id: number;
  uuid: string;
  name: string;
  description: string | null;
  create_Date: string;
};

export default function CollectionsPage() {

    //<<-------------------State------------------->>
  const router = useRouter();
  const { status } = useSession();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [totalCollections, setTotalCollections] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({id: 0,name: '',description: '',});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);


    //<<-------------------useEffect------------------->>
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    
    const fetchCollections = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/collections');
        
        if (!response.ok) {
          throw new Error('ไม่สามารถโหลดข้อมูลคอลเลคชันได้');
        }
        
        const data = await response.json();
        setCollections(data);
        setTotalCollections(data.length);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCollections();
  }, [status]);


    //<<-------------------handle------------------->>
  const handleAddCollection = () => {
    if (totalCollections >= 20) {
      setError('ไม่สามารถเพิ่มคอลเลคชันได้อีก เนื่องจากมีจำนวนคอลเลคชันสูงสุดแล้ว (20 รายการ)');
      return;
    }
    setFormData({ id: 0, name: '', description: '' });
    setIsEditing(false);
    setShowForm(true);
    setError(null);
  };
  
  const handleEditCollection = (collection: Collection) => {
    setFormData({ 
      id: collection.id, 
      name: collection.name, 
      description: collection.description || '' 
    });
    setIsEditing(true);
    setShowForm(true);
    setError(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    if (!formData.name.trim()) {
      setError('กรุณาระบุชื่อคอลเลคชัน');
      setSubmitting(false);
      return;
    }
    
    try {
      let response;
      
      if (isEditing) {
        response = await fetch(`/api/collections/${formData.id}`, {
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
        response = await fetch('/api/collections', {
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
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการบันทึกคอลเลคชัน');
      }
    
      setFormData({ id: 0, name: '', description: '' });
      setShowForm(false);
      setSuccess(isEditing ? 'แก้ไขคอลเลคชันสำเร็จ' : 'เพิ่มคอลเลคชันสำเร็จ');

      const fetchResponse = await fetch('/api/collections');
      const fetchData = await fetchResponse.json();

      setCollections(fetchData);
      setTotalCollections(fetchData.length);

      setTimeout(() => {
        setSuccess(null);
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึกคอลเลคชัน');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCollection = async (id: number) => {
    if (!confirm('คุณต้องการลบคอลเลคชันนี้ใช่หรือไม่?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/collections/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการลบคอลเลคชัน');
      }

      setSuccess('ลบคอลเลคชันสำเร็จ');

      const fetchResponse = await fetch('/api/collections');
      const data = await fetchResponse.json();

      setCollections(data);
      setTotalCollections(data.length);

      setTimeout(() => {
        setSuccess(null);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการลบคอลเลคชัน');

      setTimeout(() => {
        setError(null);
      }, 2000);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">จัดการคอลเลคชัน</h1>
          <button
            onClick={handleAddCollection}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
            disabled={totalCollections >= 20}
          >
            เพิ่มคอลเลคชัน
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

        <div className="mb-4 text-gray-600">
          จำนวนคอลเลคชันทั้งหมด: <span className="font-medium">{totalCollections}</span> / <span className="font-medium">20</span> รายการ
        </div>

        {showForm && (
          <div className="bg-white p-6 rounded shadow-md mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{isEditing ? 'แก้ไขคอลเลคชัน' : 'เพิ่มคอลเลคชัน'}</h2>
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
                  ชื่อคอลเลคชัน <span className="text-red-500">*</span>
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

        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อคอลเลคชัน</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">คำอธิบาย</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">จัดการ</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center">กำลังโหลดข้อมูล...</td>
                </tr>
              ) : collections.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center">ไม่พบข้อมูลคอลเลคชัน</td>
                </tr>
              ) : (
                collections.map((collection) => (
                  <tr key={collection.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{collection.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-500">
                        {collection.description ? (
                          collection.description.length > 100 ? (
                            <span>{collection.description.slice(0, 100)}...</span>
                          ) : (
                            collection.description
                          )
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditCollection(collection)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleDeleteCollection(collection.id)}
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