'use client';

import React, { useState } from 'react';

export default function UpdateFlashSaleButton() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async () => {
    setIsUpdating(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch('/api/flash-sales/manual-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการอัปเดตสถานะ');
      }
      
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="mb-6">
      <button
        onClick={handleUpdate}
        disabled={isUpdating}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {isUpdating ? 'กำลังอัปเดตสถานะ...' : 'อัปเดตสถานะ Flash Sale ทั้งหมด'}
      </button>
      
      {result && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
          <h3 className="font-medium text-green-700 mb-2">อัปเดตสถานะสำเร็จ</h3>
          <div>
            <p>อัปเดตสถานะตามเวลา:</p>
            <ul className="list-disc pl-5 text-sm">
              <li>ตรวจสอบทั้งหมด: {result.statusResult.total} รายการ</li>
              <li>เปลี่ยนจาก (กำลังจะเริ่ม) เป็น (เริ่ม): {result.statusResult.pendingToActive} รายการ</li>
              <li>เปลี่ยนจาก (เริ่ม) เป็น (หมดเวลา): {result.statusResult.activeToExpired} รายการ</li>
              <li>ไม่มีการเปลี่ยนแปลง: {result.statusResult.noChange} รายการ</li>
            </ul>
          </div>
          <div className="mt-2">
            <p>อัปเดตสถานะสินค้าหมด:</p>
            <ul className="list-disc pl-5 text-sm">
              <li>พบสินค้าหมด: {result.soldOutResult.total} รายการ</li>
              <li>อัปเดตเป็น จำนวนสินค้า flash sale หมด: {result.soldOutResult.updatedToSoldOut} รายการ</li>
            </ul>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
          <strong>ผิดพลาด!</strong> {error}
        </div>
      )}
    </div>
  );
}