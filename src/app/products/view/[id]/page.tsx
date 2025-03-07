'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import DashboardLayout from '@/component/DashboardLayout';

// กำหนดประเภทของข้อมูลสินค้า
type Product = {
  id: number;
  uuid: string;
  sku: string;
  name_sku: string;
  quantity: number;
  make_price: number | null;
  price_origin: number;
  product_width: number | null;
  product_length: number | null; 
  product_heigth: number | null;
  product_weight: number | null;
  img_url: string | null;
  group_name: string;
  create_Date: string;
  update_date: string;
  categories: { id: number; name: string }[];
  collections: { id: number; name: string }[];
  groups: { id: number; name: string; description: string; images: string[] }[];
  flash_sale: {
    id: number;
    flash_sale_price: number;
    flash_sale_per: number;
    start_date: string;
    end_date: string;
    quantity: number;
    status: string;
  } | null;
};

export default function ViewProduct({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const productId = params.id;
  
  // สถานะสำหรับข้อมูลสินค้า
  const [product, setProduct] = useState<Product | null>(null);
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
    
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${productId}`);
        
        if (!response.ok) {
          throw new Error('ไม่สามารถโหลดข้อมูลสินค้าได้');
        }
        
        const data = await response.json();
        setProduct(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [productId, status]);
  
  // ฟังก์ชันสำหรับแสดงราคา
  const formatPrice = (price: number) => {
    return price.toLocaleString('th-TH') + ' บาท';
  };
  
  // ฟังก์ชันแปลงวันที่ให้อยู่ในรูปแบบไทย
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // ฟังก์ชันแสดงสถานะ Flash Sale
  const getFlashSaleStatus = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">กำลังดำเนินการ</span>;
      case 'expired':
        return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full">หมดเวลา</span>;
      case 'sold_out':
        return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full">สินค้าหมด</span>;
      default:
        return <span>{status}</span>;
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
  
  if (error || !product) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>ผิดพลาด!</strong> {error || 'ไม่พบข้อมูลสินค้า'}
          </div>
          <div className="mt-4">
            <Link
              href="/products/list"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              กลับไปยังรายการสินค้า
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="container mx-auto p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">รายละเอียดสินค้า</h1>
          <div className="space-x-2">
            <Link
              href={`/products/edit/${product.id}`}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              แก้ไขสินค้า
            </Link>
            <Link
              href="/products/list"
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
            >
              กลับไปยังรายการสินค้า
            </Link>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* คอลัมน์ซ้าย - รูปภาพสินค้า */}
            <div className="md:col-span-1 p-6 bg-gray-50">
              <div className="aspect-square relative overflow-hidden rounded-lg border mb-4">
                {product.img_url ? (
                  <img
                    src={product.img_url}
                    alt={product.name_sku}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <span className="text-gray-500">ไม่มีรูปภาพ</span>
                  </div>
                )}
              </div>
              
              <h2 className="text-xl font-bold mb-2">{product.name_sku}</h2>
              <p className="text-gray-500 mb-4">รหัสสินค้า: {product.sku}</p>
              
              {product.flash_sale ? (
                <div className="mb-4">
                  <div className="text-lg">
                    <span className="line-through text-gray-500">
                      ราคาปกติ: {formatPrice(product.price_origin)}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    ราคาโปรโมชัน: {formatPrice(product.flash_sale.flash_sale_price)}
                  </div>
                  <div className="mt-1 inline-block">
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm">
                      ลด {product.flash_sale.flash_sale_per}%
                    </span>
                  </div>
                  <div className="mt-2">
                    {getFlashSaleStatus(product.flash_sale.status)}
                  </div>
                  <div className="mt-2 text-sm">
                    <div>เริ่ม: {formatDate(product.flash_sale.start_date)}</div>
                    <div>สิ้นสุด: {formatDate(product.flash_sale.end_date)}</div>
                  </div>
                </div>
              ) : (
                <div className="text-xl font-bold mb-4">
                  ราคา: {formatPrice(product.price_origin)}
                </div>
              )}
              
              <div className="py-2 border-t border-b border-gray-200 my-4">
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">สถานะ:</span>
                  <span className={`font-medium ${product.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {product.quantity > 0 ? 'มีสินค้า' : 'สินค้าหมด'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">จำนวนคงเหลือ:</span>
                  <span className="font-medium">{product.quantity} ชิ้น</span>
                </div>
              </div>
              
              <div className="mt-4">
                <h3 className="font-medium mb-2">หมวดหมู่:</h3>
                <div className="flex flex-wrap gap-1">
                  {product.categories.length > 0 ? (
                    product.categories.map((category) => (
                      <span 
                        key={category.id} 
                        className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full"
                      >
                        {category.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">ไม่มีหมวดหมู่</span>
                  )}
                </div>
              </div>
              
              <div className="mt-4">
                <h3 className="font-medium mb-2">คอลเลคชัน:</h3>
                <div className="flex flex-wrap gap-1">
                  {product.collections.length > 0 ? (
                    product.collections.map((collection) => (
                      <span 
                        key={collection.id} 
                        className="bg-purple-100 text-purple-800 text-sm px-2 py-1 rounded-full"
                      >
                        {collection.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">ไม่มีคอลเลคชัน</span>
                  )}
                </div>
              </div>
            </div>
            
            {/* คอลัมน์ขวา - รายละเอียดสินค้า */}
            <div className="md:col-span-2 p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3">รายละเอียดสินค้า</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm text-gray-500">รหัสสินค้า (SKU)</h3>
                      <p>{product.sku}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm text-gray-500">ชื่อสินค้า</h3>
                      <p>{product.name_sku}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm text-gray-500">ราคาขาย</h3>
                      <p>{formatPrice(product.price_origin)}</p>
                    </div>
                    
                    {product.make_price !== null && (
                      <div>
                        <h3 className="text-sm text-gray-500">ต้นทุน</h3>
                        <p>{formatPrice(product.make_price)}</p>
                      </div>
                    )}
                    
                    <div>
                      <h3 className="text-sm text-gray-500">กลุ่มสินค้า</h3>
                      <p>{product.group_name || '-'}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm text-gray-500">จำนวนในคลัง</h3>
                      <p>{product.quantity} ชิ้น</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm text-gray-500">วันที่สร้าง</h3>
                      <p>{formatDate(product.create_Date)}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm text-gray-500">อัปเดตล่าสุด</h3>
                      <p>{formatDate(product.update_date)}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3">ข้อมูลขนาดและน้ำหนัก</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    {product.product_width !== null && (
                      <div>
                        <h3 className="text-sm text-gray-500">ความกว้าง</h3>
                        <p>{product.product_width} ซม.</p>
                      </div>
                    )}
                    
                    {product.product_length !== null && (
                      <div>
                        <h3 className="text-sm text-gray-500">ความยาว</h3>
                        <p>{product.product_length} ซม.</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {product.product_heigth !== null && (
                      <div>
                        <h3 className="text-sm text-gray-500">ความสูง</h3>
                        <p>{product.product_heigth} ซม.</p>
                      </div>
                    )}
                    
                    {product.product_weight !== null && (
                      <div>
                        <h3 className="text-sm text-gray-500">น้ำหนัก</h3>
                        <p>{product.product_weight} กรัม</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {product.product_width === null && 
                 product.product_length === null && 
                 product.product_heigth === null && 
                 product.product_weight === null && (
                  <p className="text-gray-500 mt-2">ไม่มีข้อมูลขนาดและน้ำหนัก</p>
                )}
              </div>
              
              {product.groups && product.groups.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-3">กลุ่มสินค้า</h2>
                  
                  {product.groups.map((group) => (
                    <div key={group.id} className="bg-gray-50 p-4 rounded-lg mb-4">
                      <h3 className="font-medium mb-2">{group.name}</h3>
                      
                      {group.description && (
                        <p className="text-gray-700 mb-3">{group.description}</p>
                      )}
                      
                      {group.images && group.images.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                          {group.images.map((img, index) => (
                            <div key={index} className="aspect-square rounded overflow-hidden border">
                              <img 
                                src={img} 
                                alt={`${group.name} - รูปที่ ${index + 1}`} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {product.flash_sale && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-3">ข้อมูลแฟลชเซล</h2>
                  
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-sm text-gray-500">ราคาแฟลชเซล</h3>
                          <p className="text-red-600 font-medium">{formatPrice(product.flash_sale.flash_sale_price)}</p>
                        </div>
                        
                        <div>
                          <h3 className="text-sm text-gray-500">เปอร์เซ็นต์ส่วนลด</h3>
                          <p>{product.flash_sale.flash_sale_per}%</p>
                        </div>
                        
                        <div>
                          <h3 className="text-sm text-gray-500">จำนวนที่ตั้งไว้</h3>
                          <p>{product.flash_sale.quantity} ชิ้น</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-sm text-gray-500">สถานะ</h3>
                          <div className="mt-1">{getFlashSaleStatus(product.flash_sale.status)}</div>
                        </div>
                        
                        <div>
                          <h3 className="text-sm text-gray-500">วันที่เริ่มต้น</h3>
                          <p>{formatDate(product.flash_sale.start_date)}</p>
                        </div>
                        
                        <div>
                          <h3 className="text-sm text-gray-500">วันที่สิ้นสุด</h3>
                          <p>{formatDate(product.flash_sale.end_date)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}