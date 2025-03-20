'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import DashboardLayout from '@/component/DashboardLayout';

interface BannerSlider {
  id: number;
  logo_main: string | null;
  popup_normolly: string | null;
  banner_login_register: string | null;
  banner_slider_homepage: string[];
  banner_coupon_homepage_sec_1: string | null;
  banner_coupon_homepage_sec_2: string | null;
  banner_coupon_homepage_body: string | null;
  create_date: string;
  update_date: string;
  [key: string]: any; 
}

export default function BannerManagement() {
  const router = useRouter();
  const { status } = useSession();
  const [bannerData, setBannerData] = useState<BannerSlider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadType, setUploadType] = useState<'image' | 'video'>('image');
  const [hasSliderVideo, setHasSliderVideo] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentEditField, setCurrentEditField] = useState<string | null>(null);
  const [tempUploadFile, setTempUploadFile] = useState<File | null>(null);
  const [tempUploadPreview, setTempUploadPreview] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    
    const fetchBannerData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/banners');
        
        if (!response.ok) {
          throw new Error('ไม่สามารถโหลดข้อมูล Banner ได้');
        }
        
        const data = await response.json();
        setBannerData(data);

        if (data && Array.isArray(data.banner_slider_homepage)) {
          const hasVideo = data.banner_slider_homepage.some((item: string) => 
            typeof item === 'string' && (item.endsWith('.mp4') || item.endsWith('.webm') || item.endsWith('.mov'))
          );
          setHasSliderVideo(hasVideo);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
        console.error('Error fetching banner data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBannerData();
  }, [status, router]);

  const openEditModal = (field: string) => {
    setCurrentEditField(field);
    setTempUploadFile(null);
    setTempUploadPreview(null);
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setCurrentEditField(null);
    setTempUploadFile(null);
    setTempUploadPreview(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setTempUploadFile(file);
    
    const objectUrl = URL.createObjectURL(file);
    setTempUploadPreview(objectUrl);
    
    return () => URL.revokeObjectURL(objectUrl);
  };

  const handleFileUploadFromModal = async () => {
    if (!tempUploadFile || !currentEditField) {
      setError('ไม่พบไฟล์ที่จะอัปโหลดหรือฟิลด์ที่จะแก้ไข');
      return;
    }
    
    setUploading(currentEditField);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', tempUploadFile);
      
      const isVideo = tempUploadFile.type.startsWith('video/');
      
      if (currentEditField === 'banner_slider_homepage') {
        if (isVideo && hasSliderVideo) {
          throw new Error('สามารถอัปโหลดวิดีโอได้เพียง 1 ไฟล์เท่านั้น');
        }
      } else if (isVideo) {
        throw new Error('เฉพาะ banner_slider_homepage เท่านั้นที่รองรับการอัปโหลดวิดีโอ');
      }
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์');
      }

      const updatedBannerData = { ...bannerData } as BannerSlider;
      
      if (currentEditField === 'banner_slider_homepage') {
        if (!updatedBannerData.banner_slider_homepage) {
          updatedBannerData.banner_slider_homepage = [];
        }
        updatedBannerData.banner_slider_homepage = [...updatedBannerData.banner_slider_homepage, data.url];
        
        if (isVideo) {
          setHasSliderVideo(true);
        }
      } else {
        (updatedBannerData as any)[currentEditField] = data.url;
      }
      
      setBannerData(updatedBannerData);
      
      await saveBannerData({
        ...updatedBannerData,
        [currentEditField]: currentEditField === 'banner_slider_homepage' ? updatedBannerData.banner_slider_homepage : data.url
      });
      
      setSuccess(`อัปโหลด${isVideo ? 'วิดีโอ' : 'รูปภาพ'}สำหรับ ${formatFieldName(currentEditField)} สำเร็จ`);
      setTimeout(() => setSuccess(null), 3000);
      
      closeEditModal();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์');
    } finally {
      setUploading(null);
    }
  };

  const openAddSliderItemModal = (type: 'image' | 'video') => {
    setUploadType(type);
    openEditModal('banner_slider_homepage');
  };

  const saveBannerData = async (data: any) => {
    try {
      const response = await fetch('/api/banners', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
      
      return await response.json();
    } catch (error) {
      throw error;
    }
  };

  const formatFieldName = (field: string): string => {
    switch(field) {
      case 'logo_main': return 'โลโก้หลัก';
      case 'popup_normolly': return 'ป๊อปอัพปกติ';
      case 'banner_login_register': return 'แบนเนอร์หน้าล็อกอิน/สมัครสมาชิก';
      case 'banner_slider_homepage': return 'แบนเนอร์สไลด์เดอร์หน้าแรก';
      case 'banner_coupon_homepage_sec_1': return 'แบนเนอร์คูปองหน้าแรกส่วนที่ 1';
      case 'banner_coupon_homepage_sec_2': return 'แบนเนอร์คูปองหน้าแรกส่วนที่ 2';
      case 'banner_coupon_homepage_body': return 'แบนเนอร์คูปองหน้าแรกส่วนเนื้อหา';
      default: return field;
    }
  };

  const isVideo = (url: string) => {
    return url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.mov');
  };

  const bannerOrder = [
    'logo_main',
    'banner_slider_homepage',
    'popup_normolly',
    'banner_coupon_homepage_sec_1', 
    'banner_coupon_homepage_sec_2', 
    'banner_coupon_homepage_body',
    'banner_login_register'
  ];

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-xl">กำลังโหลดข้อมูล...</div>
        </div>
      </DashboardLayout>
    );
  }

  const renderBannerItem = (field: string) => {
    if (field === 'banner_slider_homepage') {
      return (
        <div key={field} className="mb-4 border rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold">{formatFieldName(field)}</h2>
            <div>
              <button
                onClick={() => openAddSliderItemModal('image')}
                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 mr-2"
              >
                เพิ่มรูปภาพ
              </button>
              <button
                onClick={() => openAddSliderItemModal('video')}
                className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
                disabled={hasSliderVideo}
              >
                เพิ่มวิดีโอ {hasSliderVideo && '(มีแล้ว)'}
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {bannerData?.banner_slider_homepage && bannerData.banner_slider_homepage.length > 0 ? (
              bannerData.banner_slider_homepage.map((url, index) => (
                <div key={index} className="relative border rounded p-2">
                  {isVideo(url) ? (
                    <div>
                      <video
                        controls
                        className="max-w-full"
                        style={{ maxHeight: '200px' }}
                      >
                        <source src={url} type={`video/${url.split('.').pop()}`} />
                        Your browser does not support the video tag.
                      </video>
                      <div className="absolute top-4 right-4 bg-blue-500 text-white rounded px-2 py-1 text-xs">
                        Video
                      </div>
                    </div>
                  ) : (
                    <Image
                      src={url}
                      alt={`แบนเนอร์สไลด์เดอร์ ${index + 1}`}
                      width={0}
                      height={0}
                      sizes="100vw"
                      className="rounded"
                      style={{ width: 'auto', height: 'auto', maxHeight: '200px', maxWidth: '100%' }}
                      unoptimized
                    />
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 border rounded-lg border-dashed border-gray-300 text-center col-span-3">
                <p className="text-gray-500">ยังไม่มีไฟล์สไลด์เดอร์</p>
              </div>
            )}
          </div>
        </div>
      );
    } else if (field === 'banner_coupon_homepage_sec_1' || field === 'banner_coupon_homepage_sec_2') {
      if (field === 'banner_coupon_homepage_sec_1') {
        return (
          <div key="coupon_sections" className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold">{formatFieldName('banner_coupon_homepage_sec_1')}</h2>
                <button
                  onClick={() => openEditModal('banner_coupon_homepage_sec_1')}
                  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                >
                  แก้ไข
                </button>
              </div>
              
              {bannerData?.banner_coupon_homepage_sec_1 ? (
                <div className="relative inline-block">
                  <Image
                    src={bannerData.banner_coupon_homepage_sec_1}
                    alt={formatFieldName('banner_coupon_homepage_sec_1')}
                    width={0}
                    height={0}
                    sizes="100vw"
                    className="border rounded"
                    style={{ width: 'auto', height: 'auto', maxHeight: '200px', maxWidth: '100%' }}
                    unoptimized
                  />
                </div>
              ) : (
                <div className="p-8 border rounded-lg border-dashed border-gray-300 text-center">
                  <p className="text-gray-500">ยังไม่มีรูปภาพ</p>
                  <button
                    onClick={() => openEditModal('banner_coupon_homepage_sec_1')}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    เพิ่มรูปภาพ
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold">{formatFieldName('banner_coupon_homepage_sec_2')}</h2>
                <button
                  onClick={() => openEditModal('banner_coupon_homepage_sec_2')}
                  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                >
                  แก้ไข
                </button>
              </div>
              
              {bannerData?.banner_coupon_homepage_sec_2 ? (
                <div className="relative inline-block">
                  <Image
                    src={bannerData.banner_coupon_homepage_sec_2}
                    alt={formatFieldName('banner_coupon_homepage_sec_2')}
                    width={0}
                    height={0}
                    sizes="100vw"
                    className="border rounded"
                    style={{ width: 'auto', height: 'auto', maxHeight: '200px', maxWidth: '100%' }}
                    unoptimized
                  />
                </div>
              ) : (
                <div className="p-8 border rounded-lg border-dashed border-gray-300 text-center">
                  <p className="text-gray-500">ยังไม่มีรูปภาพ</p>
                  <button
                    onClick={() => openEditModal('banner_coupon_homepage_sec_2')}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    เพิ่มรูปภาพ
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      }
      return null;
    } else {
      return (
        <div key={field} className="mb-4 border rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold">{formatFieldName(field)}</h2>
            <button
              onClick={() => openEditModal(field)}
              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            >
              แก้ไข
            </button>
          </div>
          
          {bannerData && bannerData[field] ? (
            <div className="relative inline-block">
              <Image
                src={bannerData[field]}
                alt={formatFieldName(field)}
                width={0}
                height={0}
                sizes="100vw"
                className="border rounded"
                style={{ width: 'auto', height: 'auto', maxHeight: '200px', maxWidth: '100%' }}
                unoptimized
              />
            </div>
          ) : (
            <div className="p-8 border rounded-lg border-dashed border-gray-300 text-center">
              <p className="text-gray-500">ยังไม่มีรูปภาพ</p>
              <button
                onClick={() => openEditModal(field)}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                เพิ่มรูปภาพ
              </button>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">จัดการแบนเนอร์</h1>
        
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

        <div className="rounded shadow-md">
          {bannerData ? (
            <div className="space-y-4">
              {bannerOrder.map(field => renderBannerItem(field))}
              
              <div className="text-sm text-gray-500">
                <p>อัปเดตล่าสุด: {new Date(bannerData.update_date).toLocaleString('th-TH')}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">ยังไม่มีข้อมูลแบนเนอร์</p>
              <button
                onClick={async () => {
                  try {
                    const result = await saveBannerData({
                      logo_main: null,
                      popup_normolly: null,
                      banner_login_register: null,
                      banner_slider_homepage: [],
                      banner_coupon_homepage_sec_1: null,
                      banner_coupon_homepage_sec_2: null,
                      banner_coupon_homepage_body: null
                    });
                    setBannerData(result.data);
                    setSuccess('สร้างข้อมูลแบนเนอร์สำเร็จ');
                    setTimeout(() => setSuccess(null), 3000);
                  } catch (error) {
                    setError(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการสร้างข้อมูลแบนเนอร์');
                  }
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                สร้างข้อมูลแบนเนอร์
              </button>
            </div>
          )}
        </div>
      </div>

      {editModalOpen && currentEditField && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {currentEditField === 'banner_slider_homepage' 
                  ? `เพิ่ม${uploadType === 'image' ? 'รูปภาพ' : 'วิดีโอ'}สไลด์เดอร์` 
                  : `แก้ไข ${formatFieldName(currentEditField)}`}
              </h2>
              <button 
                onClick={closeEditModal}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>
            
            <p className="mb-4 text-gray-600">
              {currentEditField === 'banner_slider_homepage'
                ? `เลือกไฟล์${uploadType === 'image' ? 'รูปภาพ' : 'วิดีโอ'}ที่ต้องการเพิ่มลงในสไลด์เดอร์`
                : `เลือกรูปภาพใหม่เพื่อแทนที่ ${formatFieldName(currentEditField)} ปัจจุบัน`}
            </p>
            
            <div className="mb-4">
              <input
                type="file"
                onChange={handleFileSelect}
                accept={currentEditField === 'banner_slider_homepage' && uploadType === 'video' 
                  ? "video/*" 
                  : "image/*"}
                className="block w-full text-sm text-gray-500 
                  file:mr-4 file:py-2 file:px-4 
                  file:rounded file:border-0 
                  file:text-sm file:font-semibold 
                  file:bg-blue-50 file:text-blue-700 
                  hover:file:bg-blue-100"
              />
            </div>
            
            {tempUploadPreview && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">ตัวอย่าง:</p>
                {currentEditField === 'banner_slider_homepage' && uploadType === 'video' ? (
                  <video
                    src={tempUploadPreview}
                    controls
                    className="max-w-full h-auto border rounded"
                    style={{ maxHeight: '200px' }}
                  />
                ) : (
                  <img
                    src={tempUploadPreview}
                    alt="ตัวอย่าง"
                    className="max-w-full h-auto border rounded"
                    style={{ maxHeight: '200px' }}
                  />
                )}
              </div>
            )}
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={closeEditModal}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                disabled={uploading !== null}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleFileUploadFromModal}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={!tempUploadFile || uploading !== null}
              >
                {uploading ? 'กำลังอัปโหลด...' : 'ยืนยัน'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}