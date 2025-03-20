'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/component/DashboardLayout';
import { GroupProductData, ProductData, EditableProductData, Category, Collection } from './types';
import GroupFormView from './GroupFormView';

export default function EditGroupForm({ id }: { id: string }) {
  const router = useRouter();
  const { status } = useSession();
  const groupId = id;
  const [groupData, setGroupData] = useState<GroupProductData | null>(null);
  const [editedGroupData, setEditedGroupData] = useState<{
    group_name: string;
    subname: string;
    description: string;
    main_img_url: string[];
  }>({
    group_name: '',
    subname: '',
    description: '',
    main_img_url: []
  });
  const [products, setProducts] = useState<EditableProductData[]>([]);
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
    img_product: null,
    img_url: null,
    size: null,
    categories: [],
    collections: []
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [groupCategories, setGroupCategories] = useState<string[]>([]);
  const [groupCollections, setGroupCollections] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [showDeleteGroupDialog, setShowDeleteGroupDialog] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

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

        setEditedGroupData({
          group_name: data.group_name,
          subname: data.subname || '',
          description: data.description || '',
          main_img_url: Array.isArray(data.main_img_url) ? data.main_img_url : []
        });

        if (data.categories && Array.isArray(data.categories)) {
          setGroupCategories(data.categories.map((cat: { id: { toString: () => string } }): string => cat.id.toString()));
        } else {
          setGroupCategories(["0"]);
        }
        
        if (data.collections && Array.isArray(data.collections)) {
          setGroupCollections(data.collections.map((col: { id: { toString: () => string } }): string => col.id.toString()));
        } else {
          setGroupCollections(["0"]);
        }

        if (data.products && Array.isArray(data.products)) {
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
            img_product: product.img_product || null,
            img_url_sku: product.img_product?.img_url_sku || null,
            size: product.size,
            categories: data.categories.map((cat: { id: { toString: () => string } }): string => cat.id.toString()),
            collections: data.collections.map((col: { id: { toString: () => string } }): string => col.id.toString()),
            isEditing: false,
            isDeleting: false
          }));
          
          setProducts(formattedProducts);
        }
        
        setLoading(false);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
        setLoading(false);
      }
    };
    
    fetchGroupData();
  }, [groupId, status, router]);

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
    setEditedGroupData({
      ...editedGroupData,
      [name]: value
    });
  };
  const handleProductChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const updatedProducts = [...products];
    const product = {...updatedProducts[index]};

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
      switch(name) {
        case 'name_sku':
          product.name_sku = value;
          break;
        case 'sku':
          product.sku = value;
          break;
        case 'img_url':
          product.img_product = value ? { img_url_sku: value } : null;
          break;
        case 'size':
          product.size = value || null;
          break;
      }
    }
    
    updatedProducts[index] = product;
    setProducts(updatedProducts);
  };

  const handleNewProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
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
      const updatedProducts = [...products];
      updatedProducts[productIndex].img_product = {
        img_url_sku: data.url
      };
      updatedProducts[productIndex].img_url = data.url;

      setProducts(updatedProducts);
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
    } finally {
      setUploading(false);
    }
  };

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

      setNewProduct({
        ...newProduct,
        img_product: {
          img_url_sku: data.url
        }
      });
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
    } finally {
      setUploading(false);
    }
  };

  const removeMainImage = (index: number) => {
    const updatedImages = [...editedGroupData.main_img_url];
    updatedImages.splice(index, 1);
    
    setEditedGroupData({
      ...editedGroupData,
      main_img_url: updatedImages
    });
  };

  const toggleEditProduct = (index: number) => {
    const updatedProducts = [...products];
    updatedProducts[index].isEditing = !updatedProducts[index].isEditing;
    setProducts(updatedProducts);
  };

  const toggleDeleteProduct = (index: number) => {
    const updatedProducts = [...products];
    updatedProducts[index].isDeleting = !updatedProducts[index].isDeleting;
    setProducts(updatedProducts);
  };

  const saveGroupEdit = async () => {
    setSubmitting(true);
    setError('');
    
    try {

      if (!editedGroupData.group_name.trim()) {
        throw new Error('กรุณาระบุชื่อกลุ่มสินค้า');
      }
  
      const dataToSend = {
        ...editedGroupData,
        categories: groupCategories,
        collections: groupCollections,
        main_img_url: editedGroupData.main_img_url
      };
      
      const response = await fetch(`/api/group-products/${groupId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการอัปเดตกลุ่มสินค้า');
      }

      if (groupData) {
        const formattedCategories = categories
          .filter(cat => groupCategories.includes(cat.id.toString()))
          .map(cat => ({ id: cat.id, name: cat.name }));
          
        const formattedCollections = collections
          .filter(col => groupCollections.includes(col.id.toString()))
          .map(col => ({ id: col.id, name: col.name }));
      
          setGroupData({
            ...groupData,
            group_name: editedGroupData.group_name,
            subname: editedGroupData.subname,
            description: editedGroupData.description,
            main_img_url: editedGroupData.main_img_url, 
            categories: formattedCategories,
            collections: formattedCollections
          });

        const updatedProducts = products.map(product => ({
          ...product,
          categories: groupCategories,
          collections: groupCollections
        }));
        
        setProducts(updatedProducts);
      }
      
      setSuccess('บันทึกการแก้ไขกลุ่มสินค้าสำเร็จ');
      setIsEditingGroup(false);

      setTimeout(() => {
        setSuccess('');
      }, 1000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการบันทึกการแก้ไข');
    } finally {
      setSubmitting(false);
    }
  };

  const saveProductEdit = async (index: number) => {
    setSubmitting(true);
    setError('');
    
    try {
      const product = products[index];

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
        img_url_sku: product.img_product?.img_url_sku || null,
        size: product.size
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

      const updatedProducts = [...products];
      updatedProducts[index].isEditing = false;
      setProducts(updatedProducts);
      
      setSuccess('บันทึกการแก้ไขสินค้าสำเร็จ');

      setTimeout(() => {
        setSuccess('');
      }, 1000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการบันทึกการแก้ไข');
    } finally {
      setSubmitting(false);
    }
  };

  const addNewProductToGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    try {
      if (!newProduct.sku.trim()) {
        throw new Error('กรุณาระบุ SKU ของสินค้า');
      }
      
      if (!newProduct.name_sku.trim()) {
        throw new Error('กรุณาระบุชื่อสินค้า');
      }
      
      if (newProduct.price_origin <= 0) {
        throw new Error('กรุณาระบุราคาขายที่มากกว่า 0');
      }

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
        img_product: data.data.img_url,
        size: data.data.size,
        categories: groupCategories,
        collections: groupCollections,
        isEditing: false,
        isDeleting: false,
        img_url: undefined
      };
      
      setProducts([...products, newProductData]);

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
        img_product: null,
        img_url: null,
        size: null,
        categories: [],
        collections: []
      });
      
      setShowAddProductForm(false);
      setSuccess('เพิ่มสินค้าสำเร็จ');

      setTimeout(() => {
        setSuccess('');
      }, 1000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการเพิ่มสินค้า');
    } finally {
      setSubmitting(false);
    }
  };

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

      const updatedProducts = [...products];
      updatedProducts.splice(index, 1);
      setProducts(updatedProducts);
      
      setSuccess('ลบสินค้าสำเร็จ');

      setTimeout(() => {
        setSuccess('');
      }, 1000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการลบสินค้า');
    } finally {
      setSubmitting(false);
    }
  };

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
  
  return (
    <DashboardLayout>
      <GroupFormView
        groupData={groupData}
        editedGroupData={editedGroupData}
        isEditingGroup={isEditingGroup}
        setIsEditingGroup={setIsEditingGroup}
        handleGroupChange={handleGroupChange}
        groupCategories={groupCategories}
        setGroupCategories={setGroupCategories}
        groupCollections={groupCollections}
        setGroupCollections={setGroupCollections}
        categories={categories}
        collections={collections}
        uploading={uploading}
        handleMainImageUpload={handleMainImageUpload}
        removeMainImage={removeMainImage}
        saveGroupEdit={saveGroupEdit}
        submitting={submitting}
        products={products}
        toggleEditProduct={toggleEditProduct}
        toggleDeleteProduct={toggleDeleteProduct}
        handleProductChange={handleProductChange}
        handleProductImageUpload={handleProductImageUpload}
        saveProductEdit={saveProductEdit}
        confirmDeleteProduct={confirmDeleteProduct}
        showAddProductForm={showAddProductForm}
        setShowAddProductForm={setShowAddProductForm}
        newProduct={newProduct}
        handleNewProductChange={handleNewProductChange}
        handleNewProductImageUpload={handleNewProductImageUpload}
        addNewProductToGroup={addNewProductToGroup}
        showDeleteGroupDialog={showDeleteGroupDialog}
        setShowDeleteGroupDialog={setShowDeleteGroupDialog}
        deleteEntireGroup={deleteEntireGroup}
        error={error}
        success={success}
        formatDate={formatDate}
      />
    </DashboardLayout>
  );
}