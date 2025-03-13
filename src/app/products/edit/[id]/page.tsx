import { Suspense } from 'react';
import EditGroupForm from './EditGroupForm';

export default async function ProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64">กำลังโหลดข้อมูล...</div>}>
      <EditGroupForm id={(await params).id} />
    </Suspense>
  );
}