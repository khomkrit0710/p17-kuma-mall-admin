'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/component/DashboardLayout';
import Image from 'next/image';
import UpdateFlashSaleButton from '@/component/UpdateFlashSaleButton';

type FlashSale = {
 id: number;
 sku: string;
 start_date: string;
 end_date: string;
 quantity: number;
 flash_sale_price: number;
 flash_sale_per: number;
 price_origin: number;
 status: string;
 create_date: string;
 update_date: string;
 product: {
   name_sku: string;
   img_url_product: string | null;
   quantity: number;
 };
};

type Product = {
 id: number;
 sku: string;
 name_sku: string;
 price_origin: number;
 quantity: number;
 img_url_product: string | null;
};

type Pagination = {
 total: number;
 page: number;
 limit: number;
 totalPages: number;
};

export default function FlashSalesPage() {
  const router = useRouter();
  const { status } = useSession();
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [searchProducts, setSearchProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newFlashSale, setNewFlashSale] = useState({
    sku: '',
    start_date: '',
    start_time: '00:00',
    end_date: '',
    end_time: '23:59',
    quantity: 0,
    flash_sale_price: 0,
    flash_sale_per: 0,
    price_origin: 0,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    
    const fetchFlashSales = async () => {
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

        statusFilter.forEach(status => {
          queryParams.append('status', status);
        });
        
        const response = await fetch(`/api/flash-sales?${queryParams.toString()}`);

        if (!response.ok) {
          throw new Error('ไม่สามารถโหลดข้อมูล Flash Sale ได้');
        }

        const data = await response.json();
        setFlashSales(data.data);
        setPagination(data.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
        console.error('Flash sale fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFlashSales();
  }, [pagination.page, pagination.limit, search, statusFilter, status]);

  useEffect(() => {
    if (!showAddPopup || !productSearch) {
      setSearchProducts([]);
      return;
    }
   
    const searchProductsApi = async () => {
      try {
        const response = await fetch(`/api/products?search=${productSearch}&limit=5`);
        
        if (!response.ok) {
          throw new Error('ไม่สามารถค้นหาสินค้าได้');
        }
        
        const data = await response.json();
        setSearchProducts(data.data);
      } catch (error) {
        console.error('Error searching products:', error);
        setSearchProducts([]);
      }
    };

    const debounce = setTimeout(() => {
      searchProductsApi();
    }, 300);
    
    return () => clearTimeout(debounce);
  }, [productSearch, showAddPopup]);

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

  const handleStatusFilterChange = (status: string) => {
    if (statusFilter.includes(status)) {
      setStatusFilter(statusFilter.filter(s => s !== status));
    } else {
      setStatusFilter([...statusFilter, status]);
    }
    setPagination({ ...pagination, page: 1 });
  };

  const handleSelectProduct = (product: Product) => {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 7);
    const startDate = now.toISOString().split('T')[0];
    const startTime = now.toTimeString().slice(0, 5);
    const endDateStr = endDate.toISOString().split('T')[0];
    const endTime = '23:59';
    
    setSelectedProduct(product);
    setProductSearch('');
    setSearchProducts([]);
    setNewFlashSale({
      sku: product.sku,
      start_date: startDate,
      start_time: startTime,
      end_date: endDateStr,
      end_time: endTime,
      quantity: product.quantity > 0 ? product.quantity : 0,
      flash_sale_price: Math.round(product.price_origin * 0.9),
      flash_sale_per: 10,
      price_origin: product.price_origin,
    });
  };

  const calculateDiscount = (type: 'price' | 'percent', value: number) => {
    if (type === 'price') {
      const discountPercent = Math.round(((newFlashSale.price_origin - value) / newFlashSale.price_origin) * 100);
      return Math.max(0, Math.min(discountPercent, 100));
    } else {
      const discountPrice = Math.round(newFlashSale.price_origin * (1 - value / 100));
      return Math.max(0, discountPrice);
    }
  };

  const handleFlashSaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'flash_sale_price') {
      const numValue = Number(value);
      const newPercent = calculateDiscount('price', numValue);
      
      setNewFlashSale({
        ...newFlashSale,
        flash_sale_price: numValue,
        flash_sale_per: newPercent,
      });
    } else if (name === 'flash_sale_per') {
      const numValue = Number(value);
      const newPrice = calculateDiscount('percent', numValue);
      
      setNewFlashSale({
        ...newFlashSale,
        flash_sale_price: newPrice,
        flash_sale_per: numValue,
      });
    } else {
      setNewFlashSale({
        ...newFlashSale,
        [name]: name === 'quantity' ? Number(value) : value,
      });
    }
  };

  const handleSubmitFlashSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    try {
      const startDateTime = `${newFlashSale.start_date}T${newFlashSale.start_time}:00`;
      const endDateTime = `${newFlashSale.end_date}T${newFlashSale.end_time}:00`;

      if (new Date(startDateTime) >= new Date(endDateTime)) {
        throw new Error('วันและเวลาเริ่มต้นต้องน้อยกว่าวันและเวลาสิ้นสุด');
      }

      const flashSaleData = {
        sku: newFlashSale.sku,
        start_date: startDateTime,
        end_date: endDateTime,
        quantity: newFlashSale.quantity,
        flash_sale_price: newFlashSale.flash_sale_price,
        flash_sale_per: newFlashSale.flash_sale_per,
        price_origin: newFlashSale.price_origin,
      };
      
      const response = await fetch('/api/flash-sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(flashSaleData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการสร้าง Flash Sale');
      }

      setSelectedProduct(null);
      setNewFlashSale({
        sku: '',
        start_date: '',
        start_time: '00:00',
        end_date: '',
        end_time: '23:59',
        quantity: 0,
        flash_sale_price: 0,
        flash_sale_per: 0,
        price_origin: 0,
      });
      setShowAddPopup(false);

      setSuccess('เพิ่ม Flash Sale สำเร็จ');

      setPagination({ ...pagination, page: 1 });

      setTimeout(() => {
        setSuccess(null);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสร้าง Flash Sale');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFlashSale = async (id: number) => {
    if (!confirm('คุณต้องการลบ Flash Sale นี้ใช่หรือไม่?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/flash-sales/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการลบ Flash Sale');
      }

      setSuccess('ลบ Flash Sale สำเร็จ');

      const fetchResponse = await fetch(
        `/api/flash-sales?page=${pagination.page}&limit=${pagination.limit}`
      );
      const data = await fetchResponse.json();
      setFlashSales(data.data);
      setPagination(data.pagination);

      setTimeout(() => {
        setSuccess(null);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการลบ Flash Sale');
    }
  };

  const getFlashSaleStatus = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
            กำลังดำเนินการ
          </span>
        );
      case 'expired':
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
            หมดเวลา
          </span>
        );
      case 'sold_out':
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
            สินค้าหมด
          </span>
        );
      case 'pending':
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
            กำลังจะเริ่ม
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
            {status}
          </span>
        );
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('th-TH') + ' บาท';
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
        <h1 className="text-3xl font-bold">จัดการ Flash Sale</h1>
        <button
          onClick={() => setShowAddPopup(true)}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
        >
          เพิ่ม Flash Sale
        </button>
      </div>

      <UpdateFlashSaleButton />

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

       <div className="bg-white p-4 rounded shadow mb-6">
         <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-end">
           <div className="flex-grow">
             <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
               ค้นหา
             </label>
             <input
               type="text"
               id="search"
               placeholder="ค้นหาตาม SKU สินค้า"
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
         
         <div className="mt-4 border-t pt-4">
           <h3 className="text-sm font-medium text-gray-700 mb-2">กรองตามสถานะ:</h3>
           <div className="flex flex-wrap gap-3">
             <label className="inline-flex items-center">
               <input
                 type="checkbox"
                 checked={statusFilter.includes('active')}
                 onChange={() => handleStatusFilterChange('active')}
                 className="mr-2"
               />
               <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                 กำลังดำเนินการ
               </span>
             </label>
             <label className="inline-flex items-center">
               <input
                 type="checkbox"
                 checked={statusFilter.includes('pending')}
                 onChange={() => handleStatusFilterChange('pending')}
                 className="mr-2"
               />
               <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                 กำลังจะเริ่ม
               </span>
             </label>
             <label className="inline-flex items-center">
               <input
                 type="checkbox"
                 checked={statusFilter.includes('expired')}
                 onChange={() => handleStatusFilterChange('expired')}
                 className="mr-2"
               />
               <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                 หมดเวลา
               </span>
             </label>
             <label className="inline-flex items-center">
               <input
                 type="checkbox"
                 checked={statusFilter.includes('sold_out')}
                 onChange={() => handleStatusFilterChange('sold_out')}
                 className="mr-2"
               />
               <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                 สินค้าหมด
               </span>
             </label>
           </div>
         </div>
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
               <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
               <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ชื่อสินค้า</th>
               <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ราคา</th>
               <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ส่วนลด</th>
               <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ระยะเวลา</th>
               <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">สถานะ</th>
               <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">จัดการ</th>
             </tr>
           </thead>
           <tbody className="bg-white divide-y divide-gray-200">
             {flashSales.length > 0 ? (
               flashSales.map((flashSale) => (
                 <tr key={flashSale.id} className="hover:bg-gray-50">
                   <td className="px-4 py-3 whitespace-nowrap">
                     {flashSale.product.img_url_product ? (
                       <Image 
                         src={flashSale.product.img_url_product} 
                         alt={flashSale.product.name_sku} 
                         width={48}
                         height={48}
                         className="object-cover rounded border"
                         style={{ width: '3rem', height: '3rem' }}
                       />
                     ) : (
                       <div className="w-12 h-12 bg-gray-200 flex items-center justify-center rounded border">
                         <span className="text-gray-500 text-xs">ไม่มีรูป</span>
                       </div>
                     )}
                   </td>
                   <td className="px-4 py-3 whitespace-nowrap">{flashSale.sku}</td>
                   <td className="px-4 py-3">{flashSale.product.name_sku}</td>
                   <td className="px-4 py-3 whitespace-nowrap">
                     <div>
                       <span className="line-through text-gray-500">{formatPrice(flashSale.price_origin)}</span>
                       <br />
                       <span className="text-red-600 font-medium">{formatPrice(flashSale.flash_sale_price)}</span>
                     </div>
                   </td>
                   <td className="px-4 py-3 whitespace-nowrap">
                     <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                     ลด {flashSale.flash_sale_per}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs">
                        <div>เริ่ม: {formatDateTime(flashSale.start_date)}</div>
                        <div>สิ้นสุด: {formatDateTime(flashSale.end_date)}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getFlashSaleStatus(flashSale.status)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button 
                          className="text-indigo-600 hover:text-indigo-900"
                          onClick={() => router.push(`/flash-sales/edit/${flashSale.id}`)}
                        >
                          แก้ไข
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900"
                          onClick={() => handleDeleteFlashSale(flashSale.id)}
                        >
                          ลบ
                        </button>
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
                    ไม่พบข้อมูล Flash Sale {search && `สำหรับคำค้น "${search}"`}
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

        {showAddPopup && (
          <div className="fixed inset-0 backdrop-blur-x bg-white/30 flex items-center justify-center z-50 p-4"> 
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">เพิ่ม Flash Sale</h2>
                  <button
                    onClick={() => {
                      setShowAddPopup(false);
                      setSelectedProduct(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    &times;
                  </button>
                </div>
                
                {!selectedProduct ? (
                  <div>
                    <div className="mb-4">
                      <label htmlFor="productSearch" className="block text-sm font-medium text-gray-700 mb-1">
                        ค้นหาสินค้า
                      </label>
                      <input
                        type="text"
                        id="productSearch"
                        placeholder="ค้นหาตาม SKU หรือชื่อสินค้า"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    </div>
                    
                    {searchProducts.length > 0 ? (
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">ผลการค้นหา ({searchProducts.length})</h3>
                        <div className="border border-gray-300 rounded divide-y max-h-60 overflow-y-auto">
                          {searchProducts.map((product) => (
                            <div
                              key={product.id}
                              className="p-3 hover:bg-gray-50 cursor-pointer flex items-center"
                              onClick={() => handleSelectProduct(product)}
                            >
                              <div className="mr-3">
                                {product.img_url_product ? (
                                  <Image
                                    src={product.img_url_product}
                                    alt={product.name_sku}
                                    width={40}
                                    height={40}
                                    className="object-cover rounded border"
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-gray-200 flex items-center justify-center rounded border">
                                    <span className="text-gray-500 text-xs">ไม่มีรูป</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex-grow">
                                <div className="font-medium">{product.name_sku}</div>
                                <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">{formatPrice(product.price_origin)}</div>
                                <div className="text-sm text-gray-500">คงเหลือ: {product.quantity} ชิ้น</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : productSearch.length > 0 ? (
                      <div className="mb-4 text-gray-500 text-center py-4">
                        ไม่พบสินค้าที่ตรงกับคำค้นหา
                      </div>
                    ) : null}
                    
                    <div className="text-center text-gray-500 text-sm">
                      พิมพ์ค้นหาสินค้าที่ต้องการเพิ่ม Flash Sale
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mb-6">
                      <div className="flex items-center mb-4">
                        <div className="mr-4">
                          {selectedProduct.img_url_product ? (
                            <Image
                              src={selectedProduct.img_url_product}
                              alt={selectedProduct.name_sku}
                              width={64}
                              height={64}
                              className="object-cover rounded border"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-200 flex items-center justify-center rounded border">
                              <span className="text-gray-500 text-xs">ไม่มีรูป</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium">{selectedProduct.name_sku}</h3>
                          <div className="text-sm text-gray-500">SKU: {selectedProduct.sku}</div>
                          <div className="text-sm">ราคาปกติ: {formatPrice(selectedProduct.price_origin)}</div>
                          <div className="text-sm">คงเหลือ: {selectedProduct.quantity} ชิ้น</div>
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => setSelectedProduct(null)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        เปลี่ยนสินค้า
                      </button>
                    </div>
                    
                    <form onSubmit={handleSubmitFlashSale}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                          <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                            วันที่เริ่มต้น <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            id="start_date"
                            name="start_date"
                            value={newFlashSale.start_date}
                            onChange={handleFlashSaleChange}
                            className="w-full p-2 border border-gray-300 rounded"
                            required
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-1">
                            เวลาเริ่มต้น <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="time"
                            id="start_time"
                            name="start_time"
                            value={newFlashSale.start_time}
                            onChange={handleFlashSaleChange}
                            className="w-full p-2 border border-gray-300 rounded"
                            required
                          />
                        </div>

                        <div>
                          <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                            วันที่สิ้นสุด <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            id="end_date"
                            name="end_date"
                            value={newFlashSale.end_date}
                            onChange={handleFlashSaleChange}
                            className="w-full p-2 border border-gray-300 rounded"
                            required
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 mb-1">
                            เวลาสิ้นสุด <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="time"
                            id="end_time"
                            name="end_time"
                            value={newFlashSale.end_time}
                            onChange={handleFlashSaleChange}
                            className="w-full p-2 border border-gray-300 rounded"
                            required
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                            จำนวนที่ต้องการขาย <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            id="quantity"
                            name="quantity"
                            value={newFlashSale.quantity}
                            onChange={handleFlashSaleChange}
                            className="w-full p-2 border border-gray-300 rounded"
                            min="1"
                            max={selectedProduct.quantity}
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">สูงสุด: {selectedProduct.quantity} ชิ้น</p>
                        </div>
                        
                        <div>
                          <label htmlFor="flash_sale_per" className="block text-sm font-medium text-gray-700 mb-1">
                            เปอร์เซ็นต์ส่วนลด <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            id="flash_sale_per"
                            name="flash_sale_per"
                            value={newFlashSale.flash_sale_per}
                            onChange={handleFlashSaleChange}
                            className="w-full p-2 border border-gray-300 rounded"
                            min="1"
                            max="99"
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">ส่วนลด: {newFlashSale.flash_sale_per}%</p>
                        </div>
                        
                        <div>
                          <label htmlFor="flash_sale_price" className="block text-sm font-medium text-gray-700 mb-1">
                            ราคาโปรโมชัน <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            id="flash_sale_price"
                            name="flash_sale_price"
                            value={newFlashSale.flash_sale_price}
                            onChange={handleFlashSaleChange}
                            className="w-full p-2 border border-gray-300 rounded"
                            min="1"
                            max={selectedProduct.price_origin - 1}
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">ราคาปกติ: {formatPrice(selectedProduct.price_origin)}</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between border-t pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddPopup(false);
                            setSelectedProduct(null);
                          }}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                        >
                          ยกเลิก
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          disabled={submitting}
                        >
                          {submitting ? 'กำลังบันทึก...' : 'บันทึก Flash Sale'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}