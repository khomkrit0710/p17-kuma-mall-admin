'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import DashboardLayout from '@/component/DashboardLayout';
import Image from 'next/image';

type GroupProduct = {
  id: number;
  uuid: string;
  group_name: string;
  subname: string;
  description: string;
  main_img_url: string | null;
  create_Date: string;
  products: ProductBrief[];
  total_products: number;
  has_flash_sale?: boolean;
};

type ProductBrief = {
  id: number;
  sku: string;
  name_sku: string;
  price_origin: number;
  quantity: number;
  img_url_sku: string | null;
  flash_sale?: {
    status: string;
  } | null;
};

type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export default function ProductList() {
  const router = useRouter();
  const { status } = useSession();
  const [groups, setGroups] = useState<GroupProduct[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<number | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);
  
  useEffect(() => {
    if (status !== 'authenticated') return;
    
    const fetchGroups = async () => {
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
        
        const response = await fetch(`/api/group-products?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error('ไม่สามารถโหลดข้อมูลกลุ่มสินค้าได้');
        }
        
        const data = await response.json();

        const groupsWithFlashSaleStatus = data.data.map((group: GroupProduct) => {
          const hasFlashSale = group.products.some(product => product.flash_sale !== null);
          return {
            ...group,
            has_flash_sale: hasFlashSale
          };
        });
        
        setGroups(groupsWithFlashSaleStatus);
        setPagination(data.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        setLoading(false);
      }
    };
    
    fetchGroups();
  }, [pagination.page, pagination.limit, search, status]);

  const handlePageChange = (newPage: number) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPagination({ ...pagination, page: 1 }); 
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = parseInt(e.target.value);
    setPagination({ ...pagination, page: 1, limit: newLimit });
  };

  const confirmDeleteGroup = (groupId: number) => {
    setGroupToDelete(groupId);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setGroupToDelete(null);
    setDeleteDialogOpen(false);
  };

  const handleDeleteGroup = async () => {
    if (!groupToDelete) return;
    
    try {
      const response = await fetch(`/api/group-products/${groupToDelete}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการลบกลุ่มสินค้า');
      }

      setSuccess('ลบกลุ่มสินค้าและสินค้าทั้งหมดสำเร็จ');

      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      
      if (search) {
        queryParams.append('search', search);
      }
      
      const fetchResponse = await fetch(`/api/group-products?${queryParams.toString()}`);
      const data = await fetchResponse.json();
      setGroups(data.data);
      setPagination(data.pagination);

      setTimeout(() => {
        setSuccess(null);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการลบกลุ่มสินค้า');
    } finally {
      closeDeleteDialog();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, pagination.page - Math.floor(maxVisiblePages / 2));

    if (Math.min(pagination.totalPages, startPage + maxVisiblePages - 1) - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, Math.min(pagination.totalPages, startPage + maxVisiblePages - 1) - maxVisiblePages + 1);
    }

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

      if (startPage > 2) {
        pages.push(
          <span key="dots1" className="px-3 py-1">
            ...
          </span>
        );
      }
    }

    for (let i = startPage; i <= Math.min(pagination.totalPages, startPage + maxVisiblePages - 1); i++) {
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

    if (Math.min(pagination.totalPages, startPage + maxVisiblePages - 1) < pagination.totalPages) {
      if (Math.min(pagination.totalPages, startPage + maxVisiblePages - 1) < pagination.totalPages - 1) {
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
  
  const getGroupFlashSaleStatus = (group: GroupProduct) => {
    const activeFlashSale = group.products.find(product => 
      product.flash_sale && (product.flash_sale.status === 'active' || product.flash_sale.status === 'pending')
    );
    
    if (activeFlashSale?.flash_sale?.status === 'active') {
      return 'active';
    } else if (activeFlashSale?.flash_sale?.status === 'pending') {
      return 'pending';
    }
    
    return null;
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">รายการกลุ่มสินค้า</h1>
          <Link
            href="/products/add"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
          >
            เพิ่มกลุ่มสินค้าใหม่
          </Link>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <div className="bg-white p-4 rounded shadow mb-6">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-end">
            <div className="flex-grow">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                ค้นหา
              </label>
              <input
                type="text"
                id="search"
                placeholder="ค้นหาตามชื่อกลุ่มสินค้าหรือคำอธิบาย"
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

        {search && (
          <div className="mb-4">
            ผลการค้นหา: <strong>{pagination.total}</strong> รายการ สำหรับคำค้น <strong>&quot;{search}&quot;</strong>
          </div>
        )}

        <div className="bg-white rounded shadow overflow-x-auto mb-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">รูปภาพ</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ชื่อกลุ่มสินค้า</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">คำอธิบาย</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">จำนวนสินค้า</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Flash Sale</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">วันที่สร้าง</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">จัดการ</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {groups.length > 0 ? (
                groups.map((group) => (
                  <tr key={group.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {group.main_img_url ? (
                        <Image 
                          src={group.main_img_url} 
                          alt={group.group_name}
                          width={48}
                          height={48}
                          className="object-cover rounded border"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 flex items-center justify-center rounded border">
                          <span className="text-gray-400 text-xs">ไม่มีรูป</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{group.group_name}</div>
                      {group.subname && (
                        <div className="text-sm text-gray-500">{group.subname}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{group.group_name}</div>
                    </td>
                    <td className="px-4 py-3">
                      {group.description ? (
                        <div className="text-gray-500 truncate max-w-xs">{group.description}</div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {group.total_products} รายการ
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {(() => {
                        const flashSaleStatus = getGroupFlashSaleStatus(group);
                        if (flashSaleStatus === 'active') {
                          return (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                              กำลังดำเนินการ
                            </span>
                          );
                        } else if (flashSaleStatus === 'pending') {
                          return (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                              กำลังจะเริ่ม
                            </span>
                          );
                        } else {
                          return (
                            <span className="text-gray-500">-</span>
                          );
                        }
                      })()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatDate(group.create_Date)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <Link
                          href={`/products/edit/${group.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          แก้ไข
                        </Link>
                        <button
                          onClick={() => confirmDeleteGroup(group.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    ไม่พบกลุ่มสินค้า {search && `สำหรับคำค้น "${search}"`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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

        {deleteDialogOpen && (
          <div className="fixed inset-0 backdrop-blur-x bg-white/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <h3 className="text-lg font-medium mb-4">ยืนยันการลบ</h3>
              <p className="mb-6 text-gray-600">
                คุณต้องการลบกลุ่มสินค้านี้และสินค้าทั้งหมดในกลุ่มใช่หรือไม่? การกระทำนี้ไม่สามารถเรียกคืนได้
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeDeleteDialog}
                  className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleDeleteGroup}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  ลบ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}