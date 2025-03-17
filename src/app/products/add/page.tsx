'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/component/DashboardLayout';
import Image from 'next/image';
import TagMultiSelect from '@/component/TagMultiSelect';


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
  size: string;
  categories: string[];
  collections: string[];
};

type Category = {
  id: number;
  name: string;
};

type Collection = {
  id: number;
  name: string;
};

export default function AddProductPage() {
  const router = useRouter();
  const { status } = useSession();
  const [currentStep, setCurrentStep] = useState<'group' | 'products'>('group');
  const [groupData, setGroupData] = useState<{
    group_name: string;
    subname: string;
    description: string;
    main_img_url: string[];
    categories: string[];
    collections: string[];
  }>({
    group_name: '',
    subname: '',
    description: '',
    main_img_url: [],
    categories: [],
    collections: []
  });
  const [productsList, setProductsList] = useState<ProductFormData[]>([{
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
    size: '',
    categories: [],
    collections: []
  }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [uploading, setUploading] = useState(false);
  const [mainImagePreview, setMainImagePreview] = useState<string[]>([]);
const [groupCategories, setGroupCategories] = useState<string[]>(["0"]);
const [groupCollections, setGroupCollections] = useState<string[]>(["0"]);
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);
  
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

  const handleGroupChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setGroupData({
      ...groupData,
      [name]: value
    });
  };

  const handleProductChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    const updatedProducts = [...productsList];

    if (name === 'product_width') {
      updatedProducts[index].product_width = value === '' ? null : Number(value);
    } else if (name === 'product_length') {
      updatedProducts[index].product_length = value === '' ? null : Number(value);
    } else if (name === 'product_heigth') {
      updatedProducts[index].product_heigth = value === '' ? null : Number(value);
    } else if (name === 'product_weight') {
      updatedProducts[index].product_weight = value === '' ? null : Number(value);
    } else if (name === 'make_price') {
      updatedProducts[index].make_price = value === '' ? null : Number(value);
    } else if (name === 'quantity') {
      updatedProducts[index].quantity = Number(value);
    } else if (name === 'price_origin') {
      updatedProducts[index].price_origin = Number(value);
    } else {
      updatedProducts[index] = {
        ...updatedProducts[index],
        [name]: value
      };
    }
    
    setProductsList(updatedProducts);
  };
  
  const addNewProduct = () => {
    setProductsList([
      ...productsList,
      {
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
        size: '',
        categories: [],
        collections: []
      }
    ]);
  };

  const removeProduct = (index: number) => {
    if (productsList.length === 1) {
      setError('ต้องมีสินค้าอย่างน้อย 1 รายการ');
      return;
    }
    
    const updatedProducts = [...productsList];
    updatedProducts.splice(index, 1);
    setProductsList(updatedProducts);
  };

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

      const newImageUrl = data.url;
      setGroupData({
        ...groupData,
        main_img_url: [...groupData.main_img_url, newImageUrl]
      });

      setMainImagePreview([...mainImagePreview, newImageUrl]);
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
    } finally {
      setUploading(false);
    }
  };

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

      const updatedProducts = [...productsList];
      updatedProducts[productIndex].img_url = data.url;
      setProductsList(updatedProducts);
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
    } finally {
      setUploading(false);
    }
  };

  const removeMainImage = (index: number) => {
    const updatedImages = [...groupData.main_img_url];
    updatedImages.splice(index, 1);
    
    setGroupData({
      ...groupData,
      main_img_url: updatedImages
    });
    
    const updatedPreviews = [...mainImagePreview];
    updatedPreviews.splice(index, 1);
    setMainImagePreview(updatedPreviews);
  };

  const handleContinueToProducts = () => {

    if (!groupData.group_name.trim()) {
      setError('กรุณาระบุชื่อกลุ่มสินค้า');
      return;
    }
    
    setError('');
    setCurrentStep('products');
  };

  const goBackToGroupEdit = () => {
    setCurrentStep('group');
  };

  const cancelGroupCreation = () => {
    if (confirm('คุณต้องการยกเลิกการสร้างกลุ่มสินค้าใช่หรือไม่?')) {
      router.push('/products/list');
    }
  };

  const handleSubmitAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    try {

      if (!groupData.group_name.trim()) {
        throw new Error('กรุณาระบุชื่อกลุ่มสินค้า');
      }

      for (let i = 0; i < productsList.length; i++) {
        const product = productsList[i];
        if (!product.sku.trim()) {
          throw new Error(`กรุณาระบุ SKU ของสินค้าลำดับที่ ${i + 1}`);
        }
        if (!product.name_sku.trim()) {
          throw new Error(`กรุณาระบุชื่อสินค้าลำดับที่ ${i + 1}`);
        }
        if (product.price_origin <= 0) {
          throw new Error(`กรุณาระบุราคาขายของสินค้าลำดับที่ ${i + 1}`);
        }
      }

      const groupPostData = {
        ...groupData,
        categories: groupCategories,
        collections: groupCollections
      };
      
      const groupResponse = await fetch('/api/group-products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(groupPostData),
      });
      
      if (!groupResponse.ok) {
        const groupData = await groupResponse.json();
        throw new Error(groupData.error || 'เกิดข้อผิดพลาดในการสร้างกลุ่มสินค้า');
      }
      
      const groupResult = await groupResponse.json();
      const createdGroupId = groupResult.data.id;

      const productsWithGroup = productsList.map(product => ({
        ...product,
        group_id: createdGroupId
      }));

      const productsResponse = await fetch('/api/products/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          products: productsWithGroup,
          group_id: createdGroupId
        }),
      });
      
      if (!productsResponse.ok) {
        const productsData = await productsResponse.json();
        throw new Error(productsData.error || 'เกิดข้อผิดพลาดในการเพิ่มสินค้า');
      }
      
      setSuccess('เพิ่มกลุ่มสินค้าและสินค้าสำเร็จ');

      setTimeout(() => {
        router.push('/products/list');
      }, 1500);
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setSubmitting(false);
    }
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
        <h1 className="text-3xl font-bold mb-6">
          {currentStep === 'group' ? 'สร้างกลุ่มสินค้าใหม่' : 'เพิ่มสินค้าในกลุ่ม'}
        </h1>
        
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
        
        {/* แสดงตัวบอกขั้นตอน */}
        <div className="flex mb-6">
          <div className={`flex-1 text-center py-2 ${currentStep === 'group' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
            1. สร้างกลุ่มสินค้า
          </div>
          <div className={`flex-1 text-center py-2 ${currentStep === 'products' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
            2. เพิ่มสินค้าในกลุ่ม
          </div>
        </div>
        
        {/* ส่วนสร้างกลุ่มสินค้า */}
        {currentStep === 'group' && (
          <div className="bg-white p-6 rounded shadow-md">
            <h2 className="text-xl font-semibold mb-4">ข้อมูลสินค้า</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="group_name" className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อสินค้าหลัก <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="group_name"
                  name="group_name"
                  value={groupData.group_name}
                  onChange={handleGroupChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              <div>
                <label htmlFor="subname" className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อรอง
                </label>
                <input
                  type="text"
                  id="subname"
                  name="subname"
                  value={groupData.subname}
                  onChange={handleGroupChange}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  คำอธิบายสินค้า
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={groupData.description}
                  onChange={handleGroupChange}
                  className="w-full p-2 border border-gray-300 rounded h-24"
                />
              </div>

              <div>
                <TagMultiSelect
                  id="group-categories"
                  label="หมวดหมู่ของกลุ่ม"
                  options={categories}
                  selectedValues={groupCategories}
                  onChange={(selectedValues) => {
                    setGroupCategories(selectedValues);
                    setGroupData({
                      ...groupData,
                      categories: selectedValues
                    });
                  }}
                  placeholder="เลือกหมวดหมู่..."
                  showEmptyOption={true}
                  emptyOptionLabel="ไม่มีหมวดหมู่"
                />
              </div>

              <div>
                <TagMultiSelect
                  id="group-collections"
                  label="คอลเลคชันของกลุ่ม"
                  options={collections}
                  selectedValues={groupCollections}
                  onChange={(selectedValues) => {
                    setGroupCollections(selectedValues);
                    setGroupData({
                      ...groupData,
                      collections: selectedValues
                    });
                  }}
                  placeholder="เลือกคอลเลคชัน..."
                  showEmptyOption={true}
                  emptyOptionLabel="ไม่มีคอลเลคชัน"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รูปภาพหลักสินค้า
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

                {groupData.main_img_url.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">รูปภาพที่อัปโหลดแล้ว:</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {groupData.main_img_url.map((url, index) => (
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
            
            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={cancelGroupCreation}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleContinueToProducts}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                disabled={uploading}
              >
                ถัดไป: เพิ่มรายการสินค้า
              </button>
            </div>
          </div>
        )}
        
        {currentStep === 'products' && (
          <div>
            <div className="bg-blue-50 p-4 rounded border border-blue-200 mb-6">
              <h2 className="text-lg font-semibold mb-2">ข้อมูลสินค้า:</h2>
              <p><strong>ชื่อสินค้า:</strong> {groupData.group_name}</p>
              {groupData.description && (
                <p><strong>คำอธิบาย:</strong> <span className="whitespace-pre-line">{groupData.description}</span></p>
              )}
              <div className="mt-2">
                <button
                  type="button"
                  onClick={goBackToGroupEdit}
                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  แก้ไขข้อมูลกลุ่มสินค้า
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmitAll} className="bg-white p-6 rounded shadow-md">
              <h2 className="text-xl font-semibold mb-4">เพิ่มตัวเลือก</h2>
              
              {productsList.map((product, index) => (
                <div key={index} className="mb-8 pb-6 border-b border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">ตัวเลือกที่ {index + 1}</h3>
                    {productsList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeProduct(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ลบรายการนี้
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label htmlFor={`sku-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                          รหัสสินค้า (SKU) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id={`sku-${index}`}
                          name="sku"
                          value={product.sku}
                          onChange={(e) => handleProductChange(index, e)}
                          className="w-full p-2 border border-gray-300 rounded"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor={`name_sku-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                          ชื่อตัวเลือกสินค้า <span className="text-red-500">*</span>
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
                        <label htmlFor={`size-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                          ขนาด
                        </label>
                        <input
                          type="text"
                          id={`size-${index}`}
                          name="size"
                          value={product.size}
                          onChange={(e) => handleProductChange(index, e)}
                          className="w-full p-2 border border-gray-300 rounded"
                          placeholder="เช่น S, M, L, XL หรือ 40x60 ซม."
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
                          ราคาเต็ม
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
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="mb-6">
                <button
                  type="button"
                  onClick={addNewProduct}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                >
                  + เพิ่มสินค้าอีกชิ้น
                </button>
              </div>
              
              <div className="mt-8 flex justify-between">
                <button
                  type="button"
                  onClick={goBackToGroupEdit}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
                >
                  กลับไปแก้ไขข้อมูลกลุ่ม
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                  disabled={submitting || uploading}
                >
                  {submitting ? 'กำลังบันทึก...' : 'บันทึกทั้งหมด'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}