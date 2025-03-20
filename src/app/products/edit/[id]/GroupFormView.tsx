import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import TagMultiSelect from '@/component/TagMultiSelect';
import ProductDescription from '@/component/ProductDescription';
import ProductDescriptionViewer from '@/component/ProductDescriptionViewer';
import { 
  GroupProductData, 
  EditableProductData, 
  Category, 
  Collection 
} from './types';

type GroupFormViewProps = {
  groupData: GroupProductData | null;
  editedGroupData: {
    group_name: string;
    subname: string;
    description: string;
    img_url_group: string[];
  };
  isEditingGroup: boolean;
  setIsEditingGroup: (value: boolean) => void;
  handleGroupChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  groupCategories: string[];
  setGroupCategories: (categories: string[]) => void;
  groupCollections: string[];
  setGroupCollections: (collections: string[]) => void;
  categories: Category[];
  collections: Collection[];
  uploading: boolean;
  handleMainImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeMainImage: (index: number) => void;
  saveGroupEdit: () => void;
  submitting: boolean;
  products: EditableProductData[];
  toggleEditProduct: (index: number) => void;
  toggleDeleteProduct: (index: number) => void;
  handleProductChange: (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleProductImageUpload: (productIndex: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  saveProductEdit: (index: number) => void;
  confirmDeleteProduct: (index: number) => void;
  showAddProductForm: boolean;
  setShowAddProductForm: (value: boolean) => void;
  newProduct: Omit<EditableProductData, 'id' | 'isEditing' | 'isDeleting'>;
  handleNewProductChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleNewProductImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  addNewProductToGroup: (e: React.FormEvent) => void;
  showDeleteGroupDialog: boolean;
  setShowDeleteGroupDialog: (value: boolean) => void;
  deleteEntireGroup: () => void;
  error: string;
  success: string;
  formatDate: (dateString: string) => string;
};

const GroupFormView: React.FC<GroupFormViewProps> = ({
  groupData,
  editedGroupData,
  isEditingGroup,
  setIsEditingGroup,
  handleGroupChange,
  groupCategories,
  setGroupCategories,
  groupCollections,
  setGroupCollections,
  categories,
  collections,
  uploading,
  handleMainImageUpload,
  removeMainImage,
  saveGroupEdit,
  submitting,
  products,
  toggleEditProduct,
  toggleDeleteProduct,
  handleProductChange,
  handleProductImageUpload,
  saveProductEdit,
  confirmDeleteProduct,
  showAddProductForm,
  setShowAddProductForm,
  newProduct,
  handleNewProductChange,
  handleNewProductImageUpload,
  addNewProductToGroup,
  showDeleteGroupDialog,
  setShowDeleteGroupDialog,
  deleteEntireGroup,
  error,
  success,
  formatDate
}) => {
  const [showDescriptionViewer, setShowDescriptionViewer] = useState(false);

  if (!groupData) {
    return (
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
    );
  }

  return (
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

      <div className="bg-white p-6 rounded shadow-md mb-8">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold">ข้อมูลสินค้า</h2>
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
              <label htmlFor="subname" className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อรอง
              </label>
              <input
                type="text"
                id="subname"
                name="subname"
                value={editedGroupData.subname}
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

              {editedGroupData.img_url_group && Array.isArray(editedGroupData.img_url_group) && editedGroupData.img_url_group.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">รูปภาพที่อัปโหลดแล้ว:</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {editedGroupData.img_url_group.map((url, index) => (
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

            <div className="mb-4">
              <TagMultiSelect
                id="group-categories"
                label="หมวดหมู่"
                options={categories}
                selectedValues={groupCategories}
                onChange={(selectedValues) => setGroupCategories(selectedValues)}
                placeholder="เลือกหมวดหมู่..."
                showEmptyOption={true}
                emptyOptionLabel="ไม่มีหมวดหมู่"
              />
            </div>

            <div className="mb-4">
              <TagMultiSelect
                id="group-collections"
                label="คอลเลคชันของกลุ่ม"
                options={collections}
                selectedValues={groupCollections}
                onChange={(selectedValues) => setGroupCollections(selectedValues)}
                placeholder="เลือกคอลเลคชัน..."
                showEmptyOption={true}
                emptyOptionLabel="ไม่มีคอลเลคชัน"
              />
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
              
              <div className="mb-4">
                <span className="text-sm text-gray-500">จำนวนสินค้าในกลุ่ม:</span>
                <div>{Array.isArray(products) ? products.length : 0} รายการ</div>
              </div>

              {groupData.categories && Array.isArray(groupData.categories) && groupData.categories.length > 0 ? (
                <div className="mt-4">
                  <span className="text-sm text-gray-500 block mb-2">หมวดหมู่ของกลุ่ม:</span>
                  <div className="flex flex-wrap gap-1">
                    {groupData.categories.map(category => (
                      <span 
                        key={category.id} 
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {category.name}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-4">
                  <span className="text-sm text-gray-500 block mb-2">หมวดหมู่ของกลุ่ม:</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">ไม่มีหมวดหมู่</span>
                </div>
              )}

              {groupData.collections && Array.isArray(groupData.collections) && groupData.collections.length > 0 && (
                <div className="mt-4">
                  <span className="text-sm text-gray-500 block mb-2">คอลเลคชันของกลุ่ม:</span>
                  <div className="flex flex-wrap gap-1">
                    {groupData.collections.map(collection => (
                      <span 
                        key={collection.id} 
                        className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                      >
                        {collection.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {groupData.product_description && (
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setShowDescriptionViewer(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                  >
                    ดูรายละเอียดสินค้า
                  </button>
                </div>
              )}
            </div>
            
            <div>
              {groupData.img_url_group && Array.isArray(groupData.img_url_group) && groupData.img_url_group.length > 0 && (
                <div>
                  <span className="text-sm text-gray-500 block mb-2">รูปภาพหลัก:</span>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {groupData.img_url_group.map((url, index) => (
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

      {showDescriptionViewer && (
        <ProductDescriptionViewer
          description={groupData.product_description || null}
          onClose={() => setShowDescriptionViewer(false)}
        />
      )}

      {isEditingGroup && (
        <div className="mb-8">
          <ProductDescription 
            groupId={groupData.id} 
            initialDescription={groupData.product_description || undefined}
            readOnly={false}
          />
        </div>
      )}

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

        {showAddProductForm && (
          <div className="mb-8 p-4 border border-green-200 rounded bg-green-50">
            <h3 className="text-lg font-medium mb-4">เพิ่มสินค้าใหม่ในกลุ่ม</h3>
            <form onSubmit={addNewProductToGroup}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <label htmlFor="new_size" className="block text-sm font-medium text-gray-700 mb-1">
                      ขนาด
                    </label>
                    <input
                      type="text"
                      id="new_size"
                      name="size"
                      value={newProduct.size || ''}
                      onChange={handleNewProductChange}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="เช่น S, M, L, XL หรือ 40x60 ซม."
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
                    
                    {newProduct.img_product && newProduct.img_product.img_url_product && (
                      <div className="mt-2">
                        <Image
                          src={newProduct.img_product.img_url_product} 
                          alt="ตัวอย่างรูปภาพ" 
                          width={96}
                          height={96}
                          className="object-cover border rounded" 
                        />
                      </div>
                    )}
                  </div>
                </div>

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

                  <div className="p-4 bg-blue-50 border border-blue-100 text-blue-700 rounded mt-4">
                    <p className="font-medium mb-2">หมายเหตุ:</p>
                    <p className="text-sm">สินค้าใหม่จะใช้หมวดหมู่และคอลเลคชันจากกลุ่มสินค้านี้โดยอัตโนมัติ</p>
                    {groupData.categories && groupData.categories.length > 0 && (
                      <div className="mt-2">
                        <span className="text-sm font-medium">หมวดหมู่:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {groupData.categories.map(category => (
                            <span 
                              key={category.id} 
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                            >
                              {category.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {groupData.collections && groupData.collections.length > 0 && (
                      <div className="mt-2">
                        <span className="text-sm font-medium">คอลเลคชัน:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {groupData.collections.map(collection => (
                            <span 
                              key={collection.id} 
                              className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                            >
                              {collection.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
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

      {Array.isArray(products) && products.length > 0 ? (
        <div className="space-y-4">
          {products.map((product, index) => (
            <div key={product.id} className="border rounded overflow-hidden">
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

                  {product.isEditing ? (
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            <label htmlFor={`size-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                              ขนาด
                            </label>
                            <input
                              type="text"
                              id={`size-${index}`}
                              name="size"
                              value={product.size || ''}
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
                            
                            {product.img_product && product.img_product.img_url_product && (
                              <div className="mt-2">
                                <Image 
                                  src={product.img_product.img_url_product} 
                                  alt={product.name_sku} 
                                  width={96}
                                  height={96}
                                  className="object-cover border rounded" 
                                />
                              </div>
                            )}
                          </div>
                        </div>

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

                          <div className="p-4 bg-blue-50 border border-blue-100 text-blue-700 rounded mt-4">
                            <p className="text-sm">สินค้านี้ใช้หมวดหมู่และคอลเลคชันจากกลุ่มสินค้าโดยอัตโนมัติ</p>
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <div className="space-y-4">
                            <div>
                              <span className="text-sm text-gray-500">ชื่อสินค้า:</span>
                              <div className="font-medium">{product.name_sku}</div>
                            </div>

                            <div>
                              <span className="text-sm text-gray-500">ขนาด:</span>
                              <div>{product.size ? product.size : '-'}</div>
                            </div>

                            <div>
                              <span className="text-sm text-gray-500">จำนวนในคลัง:</span>
                              <div className={product.quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                                {product.quantity} ชิ้น
                              </div>
                            </div>
                            
                            <div>
                              <span className="text-sm text-gray-500">ต้นทุน:</span>
                              <div>{product.make_price !== null ? `${product.make_price.toLocaleString('th-TH')} บาท` : '-'}</div>
                            </div>
                            
                            <div>
                              <span className="text-sm text-gray-500">ราคาขาย:</span>
                              <div className="font-medium">{product.price_origin.toLocaleString('th-TH')} บาท</div>
                            </div>
                            
                            <div>
                              <span className="text-sm text-gray-500">หมวดหมู่:</span>
                              <div>
                                {groupCategories.length > 0 ? (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {categories
                                      .filter(cat => groupCategories.includes(String(cat.id)))
                                      .map(cat => (
                                        <span key={cat.id} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                          {cat.name}
                                        </span>
                                      ))}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="space-y-4">
                            <div>
                              <span className="text-sm text-gray-500">ความกว้าง (ซม.):</span>
                              <div>{product.product_width !== null ? product.product_width : '-'}</div>
                            </div>
                            
                            <div>
                              <span className="text-sm text-gray-500">ความยาว (ซม.):</span>
                              <div>{product.product_length !== null ? product.product_length : '-'}</div>
                            </div>
                            
                            <div>
                              <span className="text-sm text-gray-500">ความสูง (ซม.):</span>
                              <div>{product.product_heigth !== null ? product.product_heigth : '-'}</div>
                            </div>
                            
                            <div>
                              <span className="text-sm text-gray-500">น้ำหนัก (กรัม):</span>
                              <div>{product.product_weight !== null ? product.product_weight : '-'}</div>
                            </div>
                            
                            <div>
                              <span className="text-sm text-gray-500">คอลเลคชัน:</span>
                              <div>
                                {groupCollections.length > 0 ? (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {collections
                                      .filter(col => groupCollections.includes(String(col.id)))
                                      .map(col => (
                                        <span key={col.id} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                          {col.name}
                                        </span>
                                      ))}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6">
                        <span className="text-sm text-gray-500">รูปภาพสินค้า:</span>
                        <div className="mt-2">
                        {product.img_product && product.img_product.img_url_product ?  (
                            <Image 
                              src={product.img_product.img_url_product} 
                              alt={product.name_sku} 
                              width={200}
                              height={200}
                              className="object-contain border rounded" 
                            />
                          ) : (
                            <div className="w-48 h-48 bg-gray-100 flex items-center justify-center border rounded">
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
        
        {showDeleteGroupDialog && (
        <div className="fixed inset-0 backdrop-blur-x bg-white/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">ยืนยันการลบกลุ่มสินค้า</h3>
            <p className="mb-6 text-gray-600">
              คุณกำลังจะลบกลุ่มสินค้า <strong>{groupData.group_name}</strong> และสินค้าทั้งหมด {Array.isArray(products) ? products.length : 0} รายการในกลุ่มนี้ 
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
  );
};

export default GroupFormView;