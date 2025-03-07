'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import DashboardLayout from '@/component/DashboardLayout';

// กำหนดประเภทข้อมูลสินค้า
type Product = {
  id: number;
  uuid: string;
  sku: string;
  name_sku: string;
  quantity: number;
  price_origin: number;
  make_price: number | null;
  img_url: string | null;
  group_name: string;
  create_Date: string;
  update_date: string;
  categories: { id: number; name: string }[];
  collections: { id: number; name: string }[];
  flash_sale: {
    id: number;
    flash_sale_price: number;
    end_date: string;
    status: string;
  } | null;
};

// กำหนดประเภทข้อมูล pagination
type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export default function ProductList() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  // สถานะสำหรับรายการสินค้า
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  
  // สถานะสำหรับการค้นหาและกรอง
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  
  // สถานะสำหรับการโหลดและข้อผิดพลาด
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // ตรวจสอบการเข้าสู่ระบบ
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);
  
  // โหลดข้อมูลสินค้า
  useEffect(() => {
    if (status !== 'authenticated') return;
    
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const queryParams = new URLSearchParams({
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
        });
        
        if (search) {
          queryParams.append('search', search);
        }
        
        const response = await fetch(`/api/products?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error('ไม่สามารถโหลดข้อมูลสินค้าได้');
        }
        
        const data = await response.json();
        setProducts(data.data);
        setPagination(data.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [pagination.page, pagination.limit, search, status]);
  
  // จัดการการเปลี่ยนหน้า
  const handlePageChange = (newPage: number) => {
    setPagination({ ...pagination, page: newPage });
  };
  
  // จัดการการค้นหา
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPagination({ ...pagination, page: 1 }); // รีเซ็ตกลับไปหน้าแรกเมื่อค้นหา
  };
  
  // จัดการการเปลี่ยนจำนวนรายการต่อหน้า
  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = parseInt(e.target.value);
    setPagination({ ...pagination, page: 1, limit: newLimit });
  };
  
  // ฟังก์ชันสำหรับแสดงคำอธิบายของสถานะแฟลชเซลล์
  const getFlashSaleStatus = (status: string) => {
    switch (status) {
      case 'active':
        return 'กำลังดำเนินการ';
      case 'expired':
        return 'หมดเวลา';
      case 'sold_out':
        return 'สินค้าหมด';
      default:
        return status;
    }
  };
  
  // คำนวณราคาส่วนลด
  const calculateDiscountPercentage = (original: number, sale: number) => {
    return Math.round(((original - sale) / original) * 100);
  };
  
  // สร้างตัวเลือกสำหรับ pagination
  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, pagination.page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);
    
    // ปรับ startPage ถ้า endPage ใกล้สุดท้าย
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // ปุ่มย้อนกลับ
    pages.push(
      <button
        key="prev"
        onClick={() => handlePageChange(pagination.page - 1)}
        disabled={pagination.page === 1}
        className="px-3 py-1 mx-1 rounded border bg-white disabled:opacity-50"
      >
        &laquo;
      </button>
    );
    
    // หน้าแรก (ถ้าไม่ได้แสดงอยู่แล้ว)
    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className={`px-3 py-1 mx-1 rounded border ${
            pagination.page === 1 ? 'bg-blue-500 text-white' : 'bg-white'
          }`}
        >
          1
        </button>
      );
      
      // แสดงจุดไข่ปลาถ้ามีช่องว่างระหว่างหน้าแรกกับหน้าถัดไป
      if (startPage > 2) {
        pages.push(
          <span key="dots1" className="px-3 py-1">
            ...
          </span>
        );
      }
    }
    
    // หน้าในช่วงที่ต้องการแสดง
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 mx-1 rounded border ${
            pagination.page === i ? 'bg-blue-500 text-white' : 'bg-white'
          }`}
        >
          {i}
        </button>
      );
    }
    
    // หน้าสุดท้าย (ถ้าไม่ได้แสดงอยู่แล้ว)
    if (endPage < pagination.totalPages) {
      // แสดงจุดไข่ปลาถ้ามีช่องว่างระหว่างหน้าสุดท้ายที่แสดงกับหน้าสุดท้ายจริง
      if (endPage < pagination.totalPages - 1) {
        pages.push(
          <span key="dots2" className="px-3 py-1">
            ...
          </span>
        );
      }
      
      pages.push(
        <button
          key={pagination.totalPages}
          onClick={() => handlePageChange(pagination.totalPages)}
          className={`px-3 py-1 mx-1 rounded border ${
            pagination.page === pagination.totalPages ? 'bg-blue-500 text-white' : 'bg-white'
          }`}
        >
          {pagination.totalPages}
        </button>
      );
    }
    
    // ปุ่มไปข้างหน้า
    pages.push(
      <button
        key="next"
        onClick={() => handlePageChange(pagination.page + 1)}
        disabled={pagination.page === pagination.totalPages}
        className="px-3 py-1 mx-1 rounded border bg-white disabled:opacity-50"
      >
        &raquo;
      </button>
    );
    
    return pages;
  };
  
  if (status === 'loading' || (status === 'authenticated' && loading && pagination.page === 1)) {
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
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">รายการสินค้าทั้งหมด</h1>
          <Link
            href="/products/add"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
          >
            เพิ่มสินค้าใหม่
          </Link>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {/* ส่วนค้นหาและกรอง */}
        <div className="bg-white p-4 rounded shadow mb-6">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-end">
            <div className="flex-grow">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                ค้นหา
              </label>
              <input
                type="text"
                id="search"
                placeholder="ค้นหาตาม SKU, ชื่อสินค้า, หรือกลุ่มสินค้า"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label htmlFor="limit" className="block text-sm font-medium text-gray-700 mb-1">
                แสดง
              </label>
              <select
                id="limit"
                value={pagination.limit}
                onChange={handleLimitChange}
                className="p-2 border border-gray-300 rounded"
              >
                <option value="10">10 รายการ</option>
                <option value="20">20 รายการ</option>
                <option value="50">50 รายการ</option>
                <option value="100">100 รายการ</option>
              </select>
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              ค้นหา
            </button>
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSearchInput('');
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
              >
                ล้าง
              </button>
            )}
          </form>
        </div>
        
        {/* แสดงผลลัพธ์การค้นหา */}
        {search && (
          <div className="mb-4">
            ผลการค้นหา: <strong>{pagination.total}</strong> รายการ สำหรับคำค้น <strong>"{search}"</strong>
          </div>
        )}
        
        {/* ตารางแสดงข้อมูลสินค้า */}
        <div className="bg-white rounded shadow overflow-x-auto mb-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">รูปภาพ</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ชื่อสินค้า</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ราคา</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">คงเหลือ</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">หมวดหมู่</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">กลุ่ม</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">จัดการ</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.length > 0 ? (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {product.img_url ? (
                        <img 
                          src={product.img_url} 
                          alt={product.name_sku} 
                          className="w-12 h-12 object-cover rounded border"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 flex items-center justify-center rounded border">
                          <span className="text-gray-500 text-xs">ไม่มีรูป</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{product.sku}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{product.name_sku}</div>
                      {product.flash_sale && product.flash_sale.status === 'active' && (
                        <div className="text-xs mt-1">
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full">
                            Flash Sale: {calculateDiscountPercentage(product.price_origin, product.flash_sale.flash_sale_price)}% off
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {product.flash_sale && product.flash_sale.status === 'active' ? (
                        <div>
                          <span className="line-through text-gray-500">{product.price_origin.toLocaleString()} บาท</span>
                          <br />
                          <span className="text-red-600 font-medium">{product.flash_sale.flash_sale_price.toLocaleString()} บาท</span>
                        </div>
                      ) : (
                        <span>{product.price_origin.toLocaleString()} บาท</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`${product.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {product.quantity} ชิ้น
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {product.categories.length > 0 ? (
                          product.categories.map((category) => (
                            <span 
                              key={category.id} 
                              className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                            >
                              {category.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500 text-xs">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {product.group_name || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <Link 
                          href={`/products/edit/${product.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          แก้ไข
                        </Link>
                        <Link 
                          href={`/products/view/${product.id}`}
                          className="text-green-600 hover:text-green-900"
                        >
                          ดู
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    ไม่พบสินค้า {search && `สำหรับคำค้น "${search}"`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* แสดง Pagination */}
        {pagination.totalPages > 0 && (
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-700">
              แสดง {((pagination.page - 1) * pagination.limit) + 1} ถึง{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} จาก {pagination.total} รายการ
            </div>
            <div className="flex flex-wrap justify-center">
              {renderPagination()}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}