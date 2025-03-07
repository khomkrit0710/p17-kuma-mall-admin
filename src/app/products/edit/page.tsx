'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/component/DashboardLayout';

// กำหนดประเภทของข้อมูลสินค้า
type ProductFormData = {
  sku: string;
  name_sku: string;
  quantity: number;
  make_price: number | null;
  price_origin: number;
  product_width: number | null;
  product_length: number | null; 
  product_heigth: number | null;
  product_weight: number | null;
  img_url: string;
  group_name: string;
  categories: string[];
  collections: string[];
};

// กำหนดประเภทของหมวดหมู่และคอลเลคชัน
type Category = {
  id: number;
  name: string;
};

type Collection = {
  id: number;
  name: string;
};

export default function EditProduct({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const productId = params.id;
  
  // สถานะสำหรับฟอร์ม
  const [formData, setFormData] = useState<ProductFormData>({
    sku: '',
    name_sku: '',
    quantity: 0,
    make_price: null,
    price_origin: 0,
    product_width: null,
    product_length: null,
    product_heigth: null,
    product_weight: null,
    img_url: '',
    group_name: '',
    categories: [],
    collections: []
  });
  
  // สถานะสำหรับข้อผิดพลาดและการโหลด
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  
  // สถานะสำหรับหมวดหมู่และคอลเลคชัน
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  
  // ตรวจสอบการเข้าสู่ระบบ
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);
  
  // โหลดข้อมูลสินค้าที่ต้องการแก้ไข
  useEffect(() => {
    if (status !== 'authenticated') return;
    
    const fetchProductData = async () => {
      try {
        const response = await fetch(`/api/products/${productId}`);
        
        if (!response.ok) {
          throw new Error('ไม่สามารถโหลดข้อมูลสินค้าได้');
        }
        
        const productData = await response.json();
        
        // แปลงข้อมูล categories และ collections ให้อยู่ในรูปแบบของ ID สตริง
        const categoryIds = productData.categories.map((cat: { id: number }) => cat.id.toString());
        const collectionIds = productData.collections.map((col: { id: number }) => col.id.toString());
        
        setFormData({
          sku: productData.sku,
          name_sku: productData.name_sku,
          quantity: productData.quantity,
          make_price: productData.make_price,
          price_origin: productData.price_origin,
          product_width: productData.product_width,
          product_length: productData.product_length,
          product_heigth: productData.product_heigth,
          product_weight: productData.product_weight,
          img_url: productData.img_url || '',
          group_name: productData.group_name || '',
          categories: categoryIds,
          collections: collectionIds
        });
        
        setLoading(false);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
        setLoading(false);
      }
    };
    
    fetchProductData();
  }, [productId, status]);
  
  // โหลดข้อมูลหมวดหมู่และคอลเลคชัน
  useEffect(() => {
    if (status !== 'authenticated') return;
    
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error('ไม่สามารถโหลดหมวดหมู่ได้:', error);
      }
    };
    
    const fetchCollections = async () => {
      try {
        const response = await fetch('/api/collections');
        if (response.ok) {
          const data = await response.json();
          setCollections(data);
        }
      } catch (error) {
        console.error('ไม่สามารถโหลดคอลเลคชันได้:', error);
      }
    };
    
    fetchCategories();
    fetchCollections();
  }, [status]);
  
  // จัดการการเปลี่ยนแปลงข้อมูลในฟอร์ม
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // จัดการกับค่าตัวเลข
    if (type === 'number') {
      const numberValue = value === '' ? null : Number(value);
      setFormData({
        ...formData,
        [name]: numberValue
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  // จัดการการเลือกหมวดหมู่
  const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const categoryId = e.target.value;
    const isChecked = e.target.checked;
    
    if (isChecked) {
      setFormData({
        ...formData,
        categories: [...formData.categories, categoryId]
      });
    } else {
      setFormData({
        ...formData,
        categories: formData.categories.filter(id => id !== categoryId)
      });
    }
  };
  
  // จัดการการเลือกคอลเลคชัน
  const handleCollectionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const collectionId = e.target.value;
    const isChecked = e.target.checked;
    
    if (isChecked) {
      setFormData({
        ...formData,
        collections: [...formData.collections, collectionId]
      });
    } else {
      setFormData({
        ...formData,
        collections: formData.collections.filter(id => id !== collectionId)
      });
    }
  };
  
  // ส่งข้อมูลฟอร์ม
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการอัปเดตสินค้า');
      }
      
      setSuccess('อัปเดตสินค้าสำเร็จ');
      
      // รอสักครู่แล้วเปลี่ยนเส้นทางไปหน้ารายการสินค้า
      setTimeout(() => {
        router.push('/products/list');
      }, 1500);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการอัปเดตสินค้า');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (status === 'loading' || loading) {
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
        <h1 className="text-3xl font-bold mb-6">แก้ไขสินค้า: {formData.name_sku}</h1>
        
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
        
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ข้อมูลพื้นฐาน */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">ข้อมูลพื้นฐาน</h2>
              
              <div>
                <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">
                  รหัสสินค้า (SKU) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="sku"
                  name="sku"
                  value={formData.sku}
                  className="w-full p-2 border border-gray-300 rounded bg-gray-100"
                  disabled
                />
                <p className="text-sm text-gray-500 mt-1">
                  ไม่สามารถแก้ไข SKU ได้
                </p>
              </div>
              
              <div>
                <label htmlFor="name_sku" className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อสินค้า <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name_sku"
                  name="name_sku"
                  value={formData.name_sku}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                  จำนวนในคลัง <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  min="0"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="make_price" className="block text-sm font-medium text-gray-700 mb-1">
                  ต้นทุน
                </label>
                <input
                  type="number"
                  id="make_price"
                  name="make_price"
                  value={formData.make_price === null ? '' : formData.make_price}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  min="0"
                />
              </div>
              
              <div>
                <label htmlFor="price_origin" className="block text-sm font-medium text-gray-700 mb-1">
                  ราคาขาย <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="price_origin"
                  name="price_origin"
                  value={formData.price_origin}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  min="0"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="group_name" className="block text-sm font-medium text-gray-700 mb-1">
                  กลุ่มสินค้า
                </label>
                <input
                  type="text"
                  id="group_name"
                  name="group_name"
                  value={formData.group_name}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              
              <div>
                <label htmlFor="img_url" className="block text-sm font-medium text-gray-700 mb-1">
                  URL รูปภาพ
                </label>
                <input
                  type="text"
                  id="img_url"
                  name="img_url"
                  value={formData.img_url}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                />
                {formData.img_url && (
                  <div className="mt-2">
                    <img 
                      src={formData.img_url} 
                      alt="ตัวอย่างรูปภาพ" 
                      className="w-32 h-32 object-cover border rounded" 
                    />
                  </div>
                )}
              </div>
            </div>
            
            {/* ข้อมูลขนาดและหมวดหมู่ */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">ขนาดและคุณลักษณะ</h2>
              
              <div>
                <label htmlFor="product_width" className="block text-sm font-medium text-gray-700 mb-1">
                  ความกว้าง (ซม.)
                </label>
                <input
                  type="number"
                  id="product_width"
                  name="product_width"
                  value={formData.product_width === null ? '' : formData.product_width}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  min="0"
                />
              </div>
              
              <div>
                <label htmlFor="product_length" className="block text-sm font-medium text-gray-700 mb-1">
                  ความยาว (ซม.)
                </label>
                <input
                  type="number"
                  id="product_length"
                  name="product_length"
                  value={formData.product_length === null ? '' : formData.product_length}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  min="0"
                />
              </div>
              
              <div>
                <label htmlFor="product_heigth" className="block text-sm font-medium text-gray-700 mb-1">
                  ความสูง (ซม.)
                </label>
                <input
                  type="number"
                  id="product_heigth"
                  name="product_heigth"
                  value={formData.product_heigth === null ? '' : formData.product_heigth}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  min="0"
                />
              </div>
              
              <div>
                <label htmlFor="product_weight" className="block text-sm font-medium text-gray-700 mb-1">
                  น้ำหนัก (กรัม)
                </label>
                <input
                  type="number"
                  id="product_weight"
                  name="product_weight"
                  value={formData.product_weight === null ? '' : formData.product_weight}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  min="0"
                />
              </div>
              
              {/* หมวดหมู่ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  หมวดหมู่
                </label>
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded p-2">
                  {categories.length > 0 ? (
                    categories.map((category) => (
                      <div key={category.id} className="flex items-center mb-1">
                        <input
                          type="checkbox"
                          id={`category-${category.id}`}
                          value={String(category.id)}
                          checked={formData.categories.includes(String(category.id))}
                          onChange={handleCategoryChange}
                          className="mr-2"
                        />
                        <label htmlFor={`category-${category.id}`}>{category.name}</label>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">ไม่พบหมวดหมู่</p>
                  )}
                </div>
              </div>
              
              {/* คอลเลคชัน */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  คอลเลคชัน
                </label>
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded p-2">
                  {collections.length > 0 ? (
                    collections.map((collection) => (
                      <div key={collection.id} className="flex items-center mb-1">
                        <input
                          type="checkbox"
                          id={`collection-${collection.id}`}
                          value={String(collection.id)}
                          checked={formData.collections.includes(String(collection.id))}
                          onChange={handleCollectionChange}
                          className="mr-2"
                        />
                        <label htmlFor={`collection-${collection.id}`}>{collection.name}</label>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">ไม่พบคอลเลคชัน</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={() => router.push('/products/list')}
              className="mr-2 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              disabled={submitting}
            >
              {submitting ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}