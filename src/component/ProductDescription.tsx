'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

type ProductDescriptionProps = {
  groupId: number;
  initialDescription?: {
    text_des: string[];
    img_url_des: string[];
  };
  readOnly?: boolean;
};

type DescriptionSection = {
  text: string;
  img_url: string;
};

const ProductDescription: React.FC<ProductDescriptionProps> = ({
  groupId,
  initialDescription,
  readOnly = false
}) => {
  const [sections, setSections] = useState<DescriptionSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState<number | null>(null);
  const [showFullDescription, setShowFullDescription] = useState(false);

  useEffect(() => {
    if (initialDescription) {
      const { text_des, img_url_des } = initialDescription;
      const newSections: DescriptionSection[] = [];

      const maxLength = Math.max(text_des.length, img_url_des.length);
      
      for (let i = 0; i < maxLength; i++) {
        newSections.push({
          text: text_des[i] || '',
          img_url: img_url_des[i] || ''
        });
      }

      if (newSections.length === 0) {
        newSections.push({ text: '', img_url: '' });
      }
      
      setSections(newSections);
    } else {
      fetchDescription();
    }
  }, [initialDescription, groupId]);

  const fetchDescription = async () => {
    if (!groupId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/product-descriptions/${groupId}`);
      
      if (!response.ok) {
        throw new Error('ไม่สามารถโหลดข้อมูลคำอธิบายได้');
      }
      
      const data = await response.json();
      const { text_des = [], img_url_des = [] } = data;
      
      const newSections: DescriptionSection[] = [];
      const maxLength = Math.max(text_des.length, img_url_des.length);
      
      for (let i = 0; i < maxLength; i++) {
        newSections.push({
          text: text_des[i] || '',
          img_url: img_url_des[i] || ''
        });
      }

      if (newSections.length === 0) {
        newSections.push({ text: '', img_url: '' });
      }
      
      setSections(newSections);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      console.error('Error fetching description:', error);
      setSections([{ text: '', img_url: '' }]);
    } finally {
      setLoading(false);
    }
  };

  const addSection = () => {
    setSections([...sections, { text: '', img_url: '' }]);
  };

  const removeSection = (index: number) => {
    if (sections.length <= 1) {
      setError('ต้องมีส่วนคำอธิบายอย่างน้อย 1 ส่วน');
      return;
    }
    
    const newSections = [...sections];
    newSections.splice(index, 1);
    setSections(newSections);
  };

  const updateText = (index: number, value: string) => {
    const newSections = [...sections];
    newSections[index].text = value;
    setSections(newSections);
  };

  const handleImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    
    setUploading(index);
    setError(null);
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
      }
      
      const newSections = [...sections];
      newSections[index].img_url = data.url;
      setSections(newSections);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
    } finally {
      setUploading(null);
    }
  };

  const removeImage = (index: number) => {
    const newSections = [...sections];
    newSections[index].img_url = '';
    setSections(newSections);
  };

  const saveDescription = async () => {
    if (!groupId) return;
    
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      const text_des = sections.map(section => section.text);
      const img_url_des = sections.map(section => section.img_url);
      
      const response = await fetch(`/api/product-descriptions/${groupId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text_des,
          img_url_des
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการบันทึกคำอธิบาย');
      }
      
      setSuccess('บันทึกคำอธิบายสำเร็จ');
      
      setTimeout(() => {
        setSuccess(null);
      }, 1000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการบันทึกคำอธิบาย');
    } finally {
      setSaving(false);
    }
  };

  const toggleFullDescription = () => {
    setShowFullDescription(!showFullDescription);
  };

  const renderFullDescription = () => {
    return (
      <div className="bg-white rounded shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">คำอธิบายสินค้า (แบบเต็ม)</h2>
          <button
            type="button"
            onClick={toggleFullDescription}
            className="text-blue-600 hover:text-blue-800 text-sm underline"
          >
            กลับไปแบบแก้ไขได้
          </button>
        </div>

        <div 
          className="border rounded p-4 bg-gray-50 whitespace-pre-line cursor-pointer"
          onClick={toggleFullDescription}
        >
          {sections.length === 0 ? (
            <p className="text-gray-500">ไม่มีข้อมูลคำอธิบาย</p>
          ) : (
            <>
              {sections.map((section, index) => (
                <React.Fragment key={index}>
                  {section.text && <div className="mb-4">{section.text}</div>}
                  
                  {section.img_url && (
                    <div className="my-4">
                      <Image
                        src={section.img_url}
                        alt={`รูปภาพประกอบส่วนที่ ${index + 1}`}
                        width={400}
                        height={400}
                        className="object-contain border rounded mx-auto"
                      />
                    </div>
                  )}
                  
                  {index < sections.length - 1 && section.text && <hr className="my-4" />}
                </React.Fragment>
              ))}
            </>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="p-4 text-center">กำลังโหลดข้อมูลคำอธิบาย...</div>;
  }

  if (showFullDescription) {
    return renderFullDescription();
  }

  return (
    <div className="bg-white p-6 rounded shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">คำอธิบายสินค้า</h2>
        
        {/* ปุ่มดูคำอธิบายทั้งหมด */}
        {!readOnly && (
          <div className="flex space-x-2">
            <button
              type="button" 
              onClick={toggleFullDescription}
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              ดูคำอธิบายทั้งหมด
            </button>
          </div>
        )}
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
      
      {sections.map((section, index) => (
        <div 
          key={index} 
          className="mb-6 pb-6 border-b border-gray-200"
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">ส่วนที่ {index + 1}</h3>
            {!readOnly && (
              <button
                type="button"
                onClick={() => removeSection(index)}
                className="text-red-600 hover:text-red-800"
                disabled={sections.length <= 1}
              >
                ลบส่วนนี้
              </button>
            )}
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ข้อความคำอธิบาย
            </label>
            {readOnly ? (
              <div className="p-2 border border-gray-300 rounded bg-gray-50 min-h-[100px] whitespace-pre-line">
                {section.text || <span className="text-gray-400">ไม่มีข้อความคำอธิบาย</span>}
              </div>
            ) : (
              <textarea
                value={section.text}
                onChange={(e) => updateText(index, e.target.value)}
                className="w-full p-2 border border-gray-300 rounded h-24"
                placeholder="กรอกคำอธิบายสินค้าส่วนนี้..."
              />
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              รูปภาพประกอบ
            </label>
            
            {readOnly ? (
              section.img_url ? (
                <div className="mt-2">
                  <Image
                    src={section.img_url}
                    alt={`รูปภาพประกอบส่วนที่ ${index + 1}`}
                    width={200}
                    height={200}
                    className="object-contain border rounded"
                  />
                </div>
              ) : (
                <div className="text-gray-400">ไม่มีรูปภาพประกอบ</div>
              )
            ) : (
              <div>
                {section.img_url ? (
                  <div className="mt-2 relative group inline-block">
                    <Image
                      src={section.img_url}
                      alt={`รูปภาพประกอบส่วนที่ ${index + 1}`}
                      width={200}
                      height={200}
                      className="object-contain border rounded"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      &times;
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      onChange={(e) => handleImageUpload(index, e)}
                      accept="image/*"
                      className="block w-full text-sm text-gray-500 
                        file:mr-4 file:py-2 file:px-4 
                        file:rounded file:border-0 
                        file:text-sm file:font-semibold 
                        file:bg-blue-50 file:text-blue-700 
                        hover:file:bg-blue-100"
                      disabled={uploading !== null}
                    />
                    {uploading === index && (
                      <p className="text-blue-600 text-sm mt-1">กำลังอัปโหลด...</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">รองรับไฟล์รูปภาพ (ขนาดไม่เกิน 5MB)</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
      
      {!readOnly && (
        <div className="mt-4 flex justify-between">
          <button
            type="button"
            onClick={addSection}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
          >
            + เพิ่มส่วนคำอธิบาย
          </button>
          
          <button
            type="button"
            onClick={saveDescription}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            disabled={saving}
          >
            {saving ? 'กำลังบันทึก...' : 'บันทึกคำอธิบาย'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductDescription;