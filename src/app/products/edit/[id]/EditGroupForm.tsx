'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import DashboardLayout from '@/component/DashboardLayout';
import Image from 'next/image';
import { GroupProductData, ProductData, EditableProductData, Category, Collection } from './types';

export default function EditGroupForm({ id }: { id: string }) {
  const router = useRouter();
  const { status } = useSession();
  const groupId = id;
  
  // สถานะสำหรับข้อมูลกลุ่มสินค้า
  const [groupData, setGroupData] = useState<GroupProductData | null>(null);
  const [editedGroupData, setEditedGroupData] = useState<{
    group_name: string;
    description: string;
    main_img_url: string[];
  }>({
    group_name: '',
    description: '',
    main_img_url: []
  });
  
  // สถานะสำหรับการแก้ไขสินค้า
  const [products, setProducts] = useState<EditableProductData[]>([]);
  
  // สถานะสำหรับเพิ่มสินค้าใหม่
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [newProduct, setNewProduct] = useState<Omit<EditableProductData, 'id' | 'isEditing' | 'isDeleting'>>({
    sku: '',
    name_sku: '',
    quantity: 0,
    make_price: null,
    price_origin: 0,
    product_width: null,
    product_length: null,
    product_heigth: null,
    product_weight: null,
    img_url: null,
    categories: [],
    collections: []
  });
  
  // สถานะสำหรับหมวดหมู่และคอลเลคชัน
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  
  // สถานะสำหรับการโหลดและข้อผิดพลาด
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  
  // สถานะสำหรับการแก้ไขกลุ่ม
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  
  // สถานะสำหรับ dialog ลบกลุ่ม
  const [showDeleteGroupDialog, setShowDeleteGroupDialog] = useState(false);
  
  // สถานะสำหรับการอัปโหลดรูปภาพ
  const [uploading, setUploading] = useState(false);
  
  // ตรวจสอบการเข้าสู่ระบบ
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);
  
  // โหลดข้อมูลกลุ่มสินค้าและสินค้าในกลุ่ม
  useEffect(() => {
    if (status !== 'authenticated') return;
    
    const fetchGroupData = async () => {
      try {
        const response = await fetch(`/api/group-products/${groupId}`);
        
        if (!response.ok) {
          throw new Error('ไม่สามารถโหลดข้อมูลกลุ่มสินค้าได้');
        }
        
        const data = await response.json();
        setGroupData(data);
        
        // ตั้งค่าข้อมูลกลุ่มสำหรับการแก้ไข
        setEditedGroupData({
          group_name: data.group_name,
          description: data.description || '',
          main_img_url: data.main_img_url || []
        });
        
        // แปลงข้อมูลสินค้าให้เหมาะกับการแก้ไข
        const formattedProducts = data.products.map((product: ProductData) => ({
          id: product.id,
          sku: product.sku,
          name_sku: product.name_sku,
          quantity: product.quantity,
          make_price: product.make_price,
          price_origin: product.price_origin,
          product_width: product.product_width,
          product_length: product.product_length,
          product_heigth: product.product_heigth,
          product_weight: product.product_weight,
          img_url: product.img_url,
          categories: product.categories.map(cat => cat.id.toString()),
          collections: product.collections.map(col => col.id.toString()),
          isEditing: false,
          isDeleting: false
        }));
        
        setProducts(formattedProducts);
        setLoading(false);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
        setLoading(false);
      }
    };
    
    fetchGroupData();
  }, [groupId, status]);
  
  // โหลดข้อมูลหมวดหมู่และคอลเลคชัน
  useEffect(() => {
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
  }, []);
  
  // จัดการการเปลี่ยนแปลงข้อมูลกลุ่มสินค้า
  const handleGroupChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedGroupData({
      ...editedGroupData,
      [name]: value
    });
  };
  
  // จัดการการเปลี่ยนแปลงข้อมูลสินค้า
  const handleProductChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    const updatedProducts = [...products];
    const product = {...updatedProducts[index]};
    
    // จัดการกับค่าตัวเลข
    if (type === 'number') {
      switch(name) {
        case 'quantity':
          product.quantity = Number(value);
          break;
        case 'price_origin':
          product.price_origin = Number(value);
          break;
        case 'make_price':
          product.make_price = value === '' ? null : Number(value);
          break;
        case 'product_width':
          product.product_width = value === '' ? null : Number(value);
          break;
        case 'product_length':
          product.product_length = value === '' ? null : Number(value);
          break;
        case 'product_heigth':
          product.product_heigth = value === '' ? null : Number(value);
          break;
        case 'product_weight':
          product.product_weight = value === '' ? null : Number(value);
          break;
      }
    } else {
      // สำหรับช่องข้อความ (ไม่ใช่ตัวเลข)
      switch(name) {
        case 'name_sku':
          product.name_sku = value;
          break;
        case 'sku':
          product.sku = value;
          break;
        case 'img_url':
          product.img_url = value || null;
          break;
      }
    }
    
    updatedProducts[index] = product;
    setProducts(updatedProducts);
  };
  
  // จัดการการเปลี่ยนแปลงข้อมูลสินค้าใหม่
  const handleNewProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // จัดการกับค่าตัวเลข
    if (type === 'number') {
      setNewProduct({
        ...newProduct,
        [name]: value === '' ? null : Number(value)
      });
    } else {
      setNewProduct({
        ...newProduct,
        [name]: value
      });
    }
  };
  
  // จัดการการเลือกหมวดหมู่สำหรับสินค้าที่มีอยู่
  const handleCategoryChange = (productIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const categoryId = e.target.value;
    const isChecked = e.target.checked;
    
    const updatedProducts = [...products];
    
    if (isChecked) {
      updatedProducts[productIndex].categories = [
        ...updatedProducts[productIndex].categories,
        categoryId
      ];
    } else {
      updatedProducts[productIndex].categories = 
        updatedProducts[productIndex].categories.filter(id => id !== categoryId);
    }
    
    setProducts(updatedProducts);
  };
  
  // จัดการการเลือกคอลเลคชันสำหรับสินค้าที่มีอยู่
  const handleCollectionChange = (productIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const collectionId = e.target.value;
    const isChecked = e.target.checked;
    
    const updatedProducts = [...products];
    
    if (isChecked) {
      updatedProducts[productIndex].collections = [
        ...updatedProducts[productIndex].collections,
        collectionId
      ];
    } else {
      updatedProducts[productIndex].collections = 
        updatedProducts[productIndex].collections.filter(id => id !== collectionId);
    }
    
    setProducts(updatedProducts);
  };
  
  // จัดการการเลือกหมวดหมู่สำหรับสินค้าใหม่
  const handleNewProductCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const categoryId = e.target.value;
    const isChecked = e.target.checked;
    
    if (isChecked) {
      setNewProduct({
        ...newProduct,
        categories: [...newProduct.categories, categoryId]
      });
    } else {
      setNewProduct({
        ...newProduct,
        categories: newProduct.categories.filter(id => id !== categoryId)
      });
    }
  };
  
  // จัดการการเลือกคอลเลคชันสำหรับสินค้าใหม่
  const handleNewProductCollectionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const collectionId = e.target.value;
    const isChecked = e.target.checked;
    
    if (isChecked) {
      setNewProduct({
        ...newProduct,
        collections: [...newProduct.collections, collectionId]
      });
    } else {
      setNewProduct({
        ...newProduct,
        collections: newProduct.collections.filter(id => id !== collectionId)
      });
    }
  };
  
  // อัปโหลดรูปภาพหลักของกลุ่มสินค้า
  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    
    setUploading(true);
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
      }
      
      // เพิ่ม URL รูปภาพใหม่เข้าไปในอาร์เรย์
      const newImageUrl = data.url;
      setEditedGroupData({
        ...editedGroupData,
        main_img_url: [...editedGroupData.main_img_url, newImageUrl]
      });
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
    } finally {
      setUploading(false);
    }
  };
  
  // อัปโหลดรูปภาพสินค้า
  const handleProductImageUpload = async (productIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    
    setUploading(true);
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
      }
      
      // อัปเดตรูปภาพของสินค้า
      const updatedProducts = [...products];
      updatedProducts[productIndex].img_url = data.url;
      setProducts(updatedProducts);
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
    } finally {
      setUploading(false);
    }
  };
  
  // อัปโหลดรูปภาพสินค้าใหม่
  const handleNewProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    
    setUploading(true);
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
      }
      
      // อัปเดตรูปภาพของสินค้าใหม่
      setNewProduct({
        ...newProduct,
        img_url: data.url
      });
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
    } finally {
      setUploading(false);
    }
  };
  
  // ลบรูปภาพหลักของกลุ่มสินค้า
  const removeMainImage = (index: number) => {
    const updatedImages = [...editedGroupData.main_img_url];
    updatedImages.splice(index, 1);
    
    setEditedGroupData({
      ...editedGroupData,
      main_img_url: updatedImages
    });
  };
  
  // เปิด/ปิดโหมดแก้ไขสินค้า
  const toggleEditProduct = (index: number) => {
    const updatedProducts = [...products];
    updatedProducts[index].isEditing = !updatedProducts[index].isEditing;
    setProducts(updatedProducts);
  };
  
  // เปิด/ปิดโหมดการลบสินค้า
  const toggleDeleteProduct = (index: number) => {
    const updatedProducts = [...products];
    updatedProducts[index].isDeleting = !updatedProducts[index].isDeleting;
    setProducts(updatedProducts);
  };
  
  // บันทึกการแก้ไขกลุ่มสินค้า
  const saveGroupEdit = async () => {
    setSubmitting(true);
    setError('');
    
    try {
      // ตรวจสอบข้อมูลที่จำเป็น
      if (!editedGroupData.group_name.trim()) {
        throw new Error('กรุณาระบุชื่อกลุ่มสินค้า');
      }
      
      const response = await fetch(`/api/group-products/${groupId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedGroupData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการอัปเดตกลุ่มสินค้า');
      }
      
      // อัปเดตข้อมูลกลุ่มในหน้าจอ
      if (groupData) {
        setGroupData({
          ...groupData,
          group_name: editedGroupData.group_name,
          description: editedGroupData.description,
          main_img_url: editedGroupData.main_img_url
        });
      }
      
      setSuccess('บันทึกการแก้ไขกลุ่มสินค้าสำเร็จ');
      setIsEditingGroup(false);
      
      // ลบข้อความสำเร็จหลัง 3 วินาที
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการบันทึกการแก้ไข');
    } finally {
      setSubmitting(false);
    }
  };
  
  // บันทึกการแก้ไขสินค้า
  const saveProductEdit = async (index: number) => {
    setSubmitting(true);
    setError('');
    
    try {
      const product = products[index];
      
      // ตรวจสอบข้อมูลที่จำเป็น
      if (!product.name_sku.trim()) {
        throw new Error('กรุณาระบุชื่อสินค้า');
      }
      
      if (product.price_origin <= 0) {
        throw new Error('กรุณาระบุราคาขายที่มากกว่า 0');
      }
      
      const productData = {
        name_sku: product.name_sku,
        quantity: product.quantity,
        make_price: product.make_price,
        price_origin: product.price_origin,
        product_width: product.product_width,
        product_length: product.product_length,
        product_heigth: product.product_heigth,
        product_weight: product.product_weight,
        img_url: product.img_url,
        categories: product.categories,
        collections: product.collections
      };
      
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการอัปเดตสินค้า');
      }
      
      // ปิดโหมดแก้ไข
      const updatedProducts = [...products];
      updatedProducts[index].isEditing = false;
      setProducts(updatedProducts);
      
      setSuccess('บันทึกการแก้ไขสินค้าสำเร็จ');
      
      // ลบข้อความสำเร็จหลัง 3 วินาที
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการบันทึกการแก้ไข');
    } finally {
      setSubmitting(false);
    }
  };
  
  // เพิ่มสินค้าใหม่ในกลุ่ม
  const addNewProductToGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    try {
      // ตรวจสอบข้อมูลที่จำเป็น
      if (!newProduct.sku.trim()) {
        throw new Error('กรุณาระบุ SKU ของสินค้า');
      }
      
      if (!newProduct.name_sku.trim()) {
        throw new Error('กรุณาระบุชื่อสินค้า');
      }
      
      if (newProduct.price_origin <= 0) {
        throw new Error('กรุณาระบุราคาขายที่มากกว่า 0');
      }
      
      // เพิ่ม group_id เข้าไปในข้อมูล
      const productWithGroup = {
        ...newProduct,
        group_id: parseInt(groupId)
      };
      
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productWithGroup),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการเพิ่มสินค้า');
      }
      
      // อัปเดตรายการสินค้าในหน้าจอ
      const newProductData: EditableProductData = {
        id: data.data.id,
        sku: data.data.sku,
        name_sku: data.data.name_sku,
        quantity: data.data.quantity,
        make_price: data.data.make_price,
        price_origin: data.data.price_origin,
        product_width: data.data.product_width,
        product_length: data.data.product_length,
        product_heigth: data.data.product_heigth,
        product_weight: data.data.product_weight,
        img_url: data.data.img_url,
        categories: newProduct.categories,
        collections: newProduct.collections,
        isEditing: false,
        isDeleting: false
      };
      
      setProducts([...products, newProductData]);
      
      // รีเซ็ตฟอร์มเพิ่มสินค้า
      setNewProduct({
        sku: '',
        name_sku: '',
        quantity: 0,
        make_price: null,
        price_origin: 0,
        product_width: null,
        product_length: null,
        product_heigth: null,
        product_weight: null,
        img_url: null,
        categories: [],
        collections: []
      });
      
      setShowAddProductForm(false);
      setSuccess('เพิ่มสินค้าสำเร็จ');
      
      // ลบข้อความสำเร็จหลัง 3 วินาที
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการเพิ่มสินค้า');
    } finally {
      setSubmitting(false);
    }
  };
  
  // ลบสินค้า
  const confirmDeleteProduct = async (index: number) => {
    setSubmitting(true);
    setError('');
    
    try {
      const product = products[index];
      
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการลบสินค้า');
      }
      
      // ลบสินค้าออกจากรายการ
      const updatedProducts = [...products];
      updatedProducts.splice(index, 1);
      setProducts(updatedProducts);
      
      setSuccess('ลบสินค้าสำเร็จ');
      
      // ลบข้อความสำเร็จหลัง 3 วินาที
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการลบสินค้า');
    } finally {
      setSubmitting(false);
    }
  };
  
  // ลบกลุ่มสินค้าและสินค้าทั้งหมด
  const deleteEntireGroup = async () => {
    setSubmitting(true);
    setError('');
    
    try {
      const response = await fetch(`/api/group-products/${groupId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการลบกลุ่มสินค้า');
      }
      
      setSuccess('ลบกลุ่มสินค้าและสินค้าทั้งหมดสำเร็จ');
      
      // รอสักครู่แล้วกลับไปหน้ารายการสินค้า
      setTimeout(() => {
        router.push('/products/list');
      }, 1500);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการลบกลุ่มสินค้า');
    } finally {
      setSubmitting(false);
      setShowDeleteGroupDialog(false);
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
  
  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-xl">กำลังโหลดข้อมูล...</div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (!groupData) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>ผิดพลาด!</strong> ไม่พบข้อมูลกลุ่มสินค้า
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
          <h1 className="text-3xl font-bold">{isEditingGroup ? 'แก้ไขกลุ่มสินค้า' : groupData.group_name}</h1>
          <div className="space-x-2">
            <Link
              href="/products/list"
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
            >
              กลับไปยังรายการสินค้า
            </Link>
          </div>
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
        
        {/* ส่วนข้อมูลกลุ่มสินค้า */}
        <div className="bg-white p-6 rounded shadow-md mb-8">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold">ข้อมูลกลุ่มสินค้า</h2>
            <div className="space-x-2">
              {isEditingGroup ? (
                <>
                  <button
                    onClick={() => setIsEditingGroup(false)}
                    className="bg-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-400 transition-colors text-sm"
                    disabled={submitting}
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={saveGroupEdit}
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors text-sm"
                    disabled={submitting}
                  >
                    {submitting ? 'กำลังบันทึก...' : 'บันทึก'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditingGroup(true)}
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors text-sm"
                  >
                    แก้ไขกลุ่ม
                  </button>
                  <button
                    onClick={() => setShowDeleteGroupDialog(true)}
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors text-sm"
                  >
                    ลบกลุ่ม
                  </button>
                </>
              )}
            </div>
          </div>
          
          {isEditingGroup ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="group_name" className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อกลุ่มสินค้า <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="group_name"
                  name="group_name"
                  value={editedGroupData.group_name}
                  onChange={handleGroupChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  คำอธิบายกลุ่มสินค้า
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={editedGroupData.description}
                  onChange={handleGroupChange}
                  className="w-full p-2 border border-gray-300 rounded h-24"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รูปภาพหลักของกลุ่มสินค้า
                </label>
                <input
                  type="file"
                  onChange={handleMainImageUpload}
                  accept="image/*"
                  className="block w-full text-sm text-gray-500 
                    file:mr-4 file:py-2 file:px-4 
                    file:rounded file:border-0 
                    file:text-sm file:font-semibold 
                    file:bg-blue-50 file:text-blue-700 
                    hover:file:bg-blue-100"
                  disabled={uploading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  สามารถอัปโหลดรูปภาพหลายรูปได้ (ขนาดไฟล์ไม่เกิน 5MB ต่อรูป)
                </p>
                
                {/* แสดงตัวอย่างรูปภาพที่อัปโหลด */}
                {editedGroupData.main_img_url.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">รูปภาพที่อัปโหลดแล้ว:</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {editedGroupData.main_img_url.map((url, index) => (
                        <div key={index} className="relative group">
                          <Image
                            src={url} 
                            alt={`รูปภาพ ${index + 1}`} 
                            width={96}
                            height={96}
                            className="object-cover border rounded"
                          />
                          <button
                            type="button"
                            onClick={() => removeMainImage(index)}
                            className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <span className="text-sm text-gray-500">ชื่อกลุ่มสินค้า:</span>
                  <div className="font-medium">{groupData.group_name}</div>
                </div>
                
                {groupData.description && (
                  <div className="mb-4">
                    <span className="text-sm text-gray-500">คำอธิบาย:</span>
                    <div className="whitespace-pre-line">{groupData.description}</div>
                  </div>
                )}
                
                <div className="mb-4">
                  <span className="text-sm text-gray-500">วันที่สร้าง:</span>
                  <div>{formatDate(groupData.create_Date)}</div>
                </div>
                
                <div>
                  <span className="text-sm text-gray-500">จำนวนสินค้าในกลุ่ม:</span>
                  <div>{products.length} รายการ</div>
                </div>
              </div>
              
              <div>
                {groupData.main_img_url && groupData.main_img_url.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-500 block mb-2">รูปภาพหลัก:</span>
                    <div className="grid grid-cols-2 gap-2">
                      {groupData.main_img_url.map((url, index) => (
                        <div key={index} className="aspect-square">
                          <Image
                            src={url} 
                            alt={`รูปภาพ ${index + 1}`} 
                            width={200}
                            height={200}
                            className="object-cover border rounded" 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* ส่วนรายการสินค้าในกลุ่ม */}
        <div className="bg-white p-6 rounded shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">รายการสินค้าในกลุ่ม</h2>
            <button
              onClick={() => setShowAddProductForm(!showAddProductForm)}
              className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors"
            >
              {showAddProductForm ? 'ยกเลิก' : '+ เพิ่มสินค้าใหม่'}
            </button>
          </div>
          
          {/* ฟอร์มเพิ่มสินค้าใหม่ */}
          {showAddProductForm && (
            <div className="mb-8 p-4 border border-green-200 rounded bg-green-50">
              <h3 className="text-lg font-medium mb-4">เพิ่มสินค้าใหม่ในกลุ่ม</h3>
              <form onSubmit={addNewProductToGroup}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* ข้อมูลพื้นฐาน */}
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="new_sku" className="block text-sm font-medium text-gray-700 mb-1">
                        รหัสสินค้า (SKU) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="new_sku"
                        name="sku"
                        value={newProduct.sku}
                        onChange={handleNewProductChange}
                        className="w-full p-2 border border-gray-300 rounded"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="new_name_sku" className="block text-sm font-medium text-gray-700 mb-1">
                        ชื่อสินค้า <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="new_name_sku"
                        name="name_sku"
                        value={newProduct.name_sku}
                        onChange={handleNewProductChange}
                        className="w-full p-2 border border-gray-300 rounded"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="new_quantity" className="block text-sm font-medium text-gray-700 mb-1">
                        จำนวนในคลัง <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        id="new_quantity"
                        name="quantity"
                        value={newProduct.quantity}
                        onChange={handleNewProductChange}
                        className="w-full p-2 border border-gray-300 rounded"
                        min="0"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="new_make_price" className="block text-sm font-medium text-gray-700 mb-1">
                        ต้นทุน
                      </label>
                      <input
                        type="number"
                        id="new_make_price"
                        name="make_price"
                        value={newProduct.make_price === null ? '' : newProduct.make_price}
                        onChange={handleNewProductChange}
                        className="w-full p-2 border border-gray-300 rounded"
                        min="0"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="new_price_origin" className="block text-sm font-medium text-gray-700 mb-1">
                        ราคาขาย <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        id="new_price_origin"
                        name="price_origin"
                        value={newProduct.price_origin}
                        onChange={handleNewProductChange}
                        className="w-full p-2 border border-gray-300 rounded"
                        min="0"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="new_image" className="block text-sm font-medium text-gray-700 mb-1">
                        รูปภาพสินค้า
                      </label>
                      <input
                        type="file"
                        id="new_image"
                        onChange={handleNewProductImageUpload}
                        accept="image/*"
                        className="block w-full text-sm text-gray-500 
                          file:mr-4 file:py-2 file:px-4 
                          file:rounded file:border-0 
                          file:text-sm file:font-semibold 
                          file:bg-blue-50 file:text-blue-700 
                          hover:file:bg-blue-100"
                        disabled={uploading}
                      />
                      
                      {newProduct.img_url && (
                        <div className="mt-2">
                          <Image
                            src={newProduct.img_url} 
                            alt="ตัวอย่างรูปภาพ" 
                            width={96}
                            height={96}
                            className="object-cover border rounded" 
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* ข้อมูลขนาดและหมวดหมู่ */}
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="new_product_width" className="block text-sm font-medium text-gray-700 mb-1">
                        ความกว้าง (ซม.)
                      </label>
                      <input
                        type="number"
                        id="new_product_width"
                        name="product_width"
                        value={newProduct.product_width === null ? '' : newProduct.product_width}
                        onChange={handleNewProductChange}
                        className="w-full p-2 border border-gray-300 rounded"
                        min="0"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="new_product_length" className="block text-sm font-medium text-gray-700 mb-1">
                        ความยาว (ซม.)
                      </label>
                      <input
                        type="number"
                        id="new_product_length"
                        name="product_length"
                        value={newProduct.product_length === null ? '' : newProduct.product_length}
                        onChange={handleNewProductChange}
                        className="w-full p-2 border border-gray-300 rounded"
                        min="0"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="new_product_heigth" className="block text-sm font-medium text-gray-700 mb-1">
                        ความสูง (ซม.)
                      </label>
                      <input
                        type="number"
                        id="new_product_heigth"
                        name="product_heigth"
                        value={newProduct.product_heigth === null ? '' : newProduct.product_heigth}
                        onChange={handleNewProductChange}
                        className="w-full p-2 border border-gray-300 rounded"
                        min="0"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="new_product_weight" className="block text-sm font-medium text-gray-700 mb-1">
                        น้ำหนัก (กรัม)
                      </label>
                      <input
                        type="number"
                        id="new_product_weight"
                        name="product_weight"
                        value={newProduct.product_weight === null ? '' : newProduct.product_weight}
                        onChange={handleNewProductChange}
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
                                id={`new_category-${category.id}`}
                                value={String(category.id)}
                                checked={newProduct.categories.includes(String(category.id))}
                                onChange={handleNewProductCategoryChange}
                                className="mr-2"
                              />
                              <label htmlFor={`new_category-${category.id}`}>{category.name}</label>
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
                                id={`new_collection-${collection.id}`}
                                value={String(collection.id)}
                                checked={newProduct.collections.includes(String(collection.id))}
                                onChange={handleNewProductCollectionChange}
                                className="mr-2"
                              />
                              <label htmlFor={`new_collection-${collection.id}`}>{collection.name}</label>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500">ไม่พบคอลเลคชัน</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAddProductForm(false)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors mr-2"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                    disabled={submitting || uploading}
                  >
                    {submitting ? 'กำลังบันทึก...' : 'เพิ่มสินค้า'}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* รายการสินค้า */}
          {products.length > 0 ? (
            <div className="space-y-4">
              {products.map((product, index) => (
                <div key={product.id} className="border rounded overflow-hidden">
                  {/* ส่วนหัวสินค้า */}
                  <div className="bg-gray-50 p-3 flex justify-between items-center">
                    <div className="font-medium">{product.name_sku} <span className="text-gray-500 text-sm">({product.sku})</span></div>
                    <div className="flex space-x-2">
                      {product.isEditing ? (
                        <>
                          <button
                            onClick={() => toggleEditProduct(index)}
                            className="bg-gray-300 text-gray-700 px-2 py-1 rounded text-sm hover:bg-gray-400 transition-colors"
                          >
                            ยกเลิก
                          </button>
                          <button
                            onClick={() => saveProductEdit(index)}
                            className="bg-blue-600 text-white px-2 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                            disabled={submitting}
                          >
                            {submitting ? 'กำลังบันทึก...' : 'บันทึก'}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => toggleEditProduct(index)}
                            className="bg-blue-600 text-white px-2 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                          >
                            แก้ไข
                          </button>
                          <button
                            onClick={() => toggleDeleteProduct(index)}
                            className="bg-red-600 text-white px-2 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                          >
                            ลบ
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* ส่วนเนื้อหาสินค้า */}
                  {product.isEditing ? (
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* ข้อมูลพื้นฐาน */}
                        <div className="space-y-4">
                          <div>
                            <label htmlFor={`name_sku-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                              ชื่อสินค้า <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              id={`name_sku-${index}`}
                              name="name_sku"
                              value={product.name_sku}
                              onChange={(e) => handleProductChange(index, e)}
                              className="w-full p-2 border border-gray-300 rounded"
                              required
                            />
                          </div>
                          
                          <div>
                            <label htmlFor={`quantity-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                              จำนวนในคลัง <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              id={`quantity-${index}`}
                              name="quantity"
                              value={product.quantity}
                              onChange={(e) => handleProductChange(index, e)}
                              className="w-full p-2 border border-gray-300 rounded"
                              min="0"
                              required
                            />
                          </div>
                          
                          <div>
                            <label htmlFor={`make_price-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                              ต้นทุน
                            </label>
                            <input
                              type="number"
                              id={`make_price-${index}`}
                              name="make_price"
                              value={product.make_price === null ? '' : product.make_price}
                              onChange={(e) => handleProductChange(index, e)}
                              className="w-full p-2 border border-gray-300 rounded"
                              min="0"
                            />
                          </div>
                          
                          <div>
                            <label htmlFor={`price_origin-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                              ราคาขาย <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              id={`price_origin-${index}`}
                              name="price_origin"
                              value={product.price_origin}
                              onChange={(e) => handleProductChange(index, e)}
                              className="w-full p-2 border border-gray-300 rounded"
                              min="0"
                              required
                            />
                          </div>
                          
                          <div>
                            <label htmlFor={`image-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                              รูปภาพสินค้า
                            </label>
                            <input
                              type="file"
                              id={`image-${index}`}
                              onChange={(e) => handleProductImageUpload(index, e)}
                              accept="image/*"
                              className="block w-full text-sm text-gray-500 
                                file:mr-4 file:py-2 file:px-4 
                                file:rounded file:border-0 
                                file:text-sm file:font-semibold 
                                file:bg-blue-50 file:text-blue-700 
                                hover:file:bg-blue-100"
                              disabled={uploading}
                            />
                            
                            {product.img_url && (
                              <div className="mt-2">
                                <Image 
                                  src={product.img_url} 
                                  alt={product.name_sku} 
                                  width={96}
                                  height={96}
                                  className="object-cover border rounded" 
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* ข้อมูลขนาดและหมวดหมู่ */}
                        <div className="space-y-4">
                          <div>
                            <label htmlFor={`product_width-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                              ความกว้าง (ซม.)
                            </label>
                            <input
                              type="number"
                              id={`product_width-${index}`}
                              name="product_width"
                              value={product.product_width === null ? '' : product.product_width}
                              onChange={(e) => handleProductChange(index, e)}
                              className="w-full p-2 border border-gray-300 rounded"
                              min="0"
                            />
                          </div>
                          
                          <div>
                            <label htmlFor={`product_length-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                              ความยาว (ซม.)
                            </label>
                            <input
                              type="number"
                              id={`product_length-${index}`}
                              name="product_length"
                              value={product.product_length === null ? '' : product.product_length}
                              onChange={(e) => handleProductChange(index, e)}
                              className="w-full p-2 border border-gray-300 rounded"
                              min="0"
                            />
                          </div>
                          
                          <div>
                            <label htmlFor={`product_heigth-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                              ความสูง (ซม.)
                            </label>
                            <input
                              type="number"
                              id={`product_heigth-${index}`}
                              name="product_heigth"
                              value={product.product_heigth === null ? '' : product.product_heigth}
                              onChange={(e) => handleProductChange(index, e)}
                              className="w-full p-2 border border-gray-300 rounded"
                              min="0"
                            />
                          </div>
                          
                          <div>
                            <label htmlFor={`product_weight-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                              น้ำหนัก (กรัม)
                            </label>
                            <input
                              type="number"
                              id={`product_weight-${index}`}
                              name="product_weight"
                              value={product.product_weight === null ? '' : product.product_weight}
                              onChange={(e) => handleProductChange(index, e)}
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
                                      id={`category-${index}-${category.id}`}
                                      value={String(category.id)}
                                      checked={product.categories.includes(String(category.id))}
                                      onChange={(e) => handleCategoryChange(index, e)}
                                      className="mr-2"
                                    />
                                    <label htmlFor={`category-${index}-${category.id}`}>{category.name}</label>
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
                                      id={`collection-${index}-${collection.id}`}
                                      value={String(collection.id)}
                                      checked={product.collections.includes(String(collection.id))}
                                      onChange={(e) => handleCollectionChange(index, e)}
                                      className="mr-2"
                                    />
                                    <label htmlFor={`collection-${index}-${collection.id}`}>{collection.name}</label>
                                  </div>
                                ))
                              ) : (
                                <p className="text-gray-500">ไม่พบคอลเลคชัน</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : product.isDeleting ? (
                    <div className="p-4 bg-red-50">
                      <div className="text-center">
                        <p className="text-red-700 mb-4">คุณแน่ใจหรือไม่ที่จะลบสินค้านี้? การกระทำนี้ไม่สามารถเรียกคืนได้</p>
                        <div className="flex justify-center space-x-4">
                          <button
                            onClick={() => toggleDeleteProduct(index)}
                            className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
                          >
                            ยกเลิก
                          </button>
                          <button
                            onClick={() => confirmDeleteProduct(index)}
                            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                            disabled={submitting}
                          >
                            {submitting ? 'กำลังลบ...' : 'ยืนยันการลบ'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <span className="text-sm text-gray-500">ราคาขาย:</span>
                              <div className="font-medium">{product.price_origin.toLocaleString('th-TH')} บาท</div>
                            </div>
                            <div>
                              <span className="text-sm text-gray-500">จำนวนในคลัง:</span>
                              <div className={product.quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                                {product.quantity} ชิ้น
                              </div>
                            </div>
                            {product.make_price !== null && (
                              <div>
                                <span className="text-sm text-gray-500">ต้นทุน:</span>
                                <div>{product.make_price.toLocaleString('th-TH')} บาท</div>
                              </div>
                            )}
                            {product.categories.length > 0 && (
                              <div>
                                <span className="text-sm text-gray-500">หมวดหมู่:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {categories
                                    .filter(cat => product.categories.includes(String(cat.id)))
                                    .map(cat => (
                                      <span key={cat.id} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                        {cat.name}
                                      </span>
                                    ))
                                  }
                                </div>
                              </div>
                            )}
                            {product.collections.length > 0 && (
                              <div>
                                <span className="text-sm text-gray-500">คอลเลคชัน:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {collections
                                    .filter(col => product.collections.includes(String(col.id)))
                                    .map(col => (
                                      <span key={col.id} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                        {col.name}
                                      </span>
                                    ))
                                  }
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          {product.img_url ? (
                            <div>
                              <Image 
                                src={product.img_url} 
                                alt={product.name_sku} 
                                width={200}
                                height={200}
                                className="object-contain border rounded" 
                              />
                            </div>
                          ) : (
                            <div className="w-full h-32 bg-gray-100 flex items-center justify-center border rounded">
                              <span className="text-gray-400">ไม่มีรูปภาพ</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              ยังไม่มีสินค้าในกลุ่มนี้ คลิกที่ปุ่ม เพิ่มสินค้าใหม่ เพื่อเพิ่มสินค้า
            </div>
          )}
        </div>
        
        {/* กล่องยืนยันการลบกลุ่ม */}
        {showDeleteGroupDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-medium mb-4">ยืนยันการลบกลุ่มสินค้า</h3>
              <p className="mb-6 text-gray-600">
                คุณกำลังจะลบกลุ่มสินค้า <strong>{groupData.group_name}</strong> และสินค้าทั้งหมด {products.length} รายการในกลุ่มนี้ 
                การกระทำนี้ไม่สามารถเรียกคืนได้ คุณแน่ใจหรือไม่?
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteGroupDialog(false)}
                  className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={deleteEntireGroup}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  disabled={submitting}
                >
                  {submitting ? 'กำลังลบ...' : 'ยืนยันการลบ'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}