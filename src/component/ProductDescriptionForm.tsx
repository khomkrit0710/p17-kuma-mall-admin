import React, { useState } from 'react';
import Image from 'next/image';

type DescriptionSection = {
  text: string;
  img_url: string;
};

type ProductDescriptionFormProps = {
  sections: DescriptionSection[];
  setSections: React.Dispatch<React.SetStateAction<DescriptionSection[]>>;
  uploading: boolean;
  handleImageUpload: (sectionIndex: number, e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
};

const ProductDescriptionForm: React.FC<ProductDescriptionFormProps> = ({
  sections,
  setSections,
  uploading,
  handleImageUpload
}) => {
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
  };

  const updateText = (index: number, value: string) => {
    const newSections = [...sections];
    newSections[index].text = value;
    setSections(newSections);
  };

  const removeImage = (index: number) => {
    const newSections = [...sections];
    newSections[index].img_url = '';
    setSections(newSections);
  };

  return (
    <div className="bg-white p-6 rounded shadow-md mb-6">
      <h2 className="text-xl font-semibold mb-4">คำอธิบายสินค้าโดยละเอียด</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>ผิดพลาด!</strong> {error}
        </div>
      )}
      
      {sections.map((section, index) => (
        <div 
          key={index} 
          className="mb-6 pb-6 border-b border-gray-200"
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">ส่วนที่ {index + 1}</h3>
            <button
              type="button"
              onClick={() => removeSection(index)}
              className="text-red-600 hover:text-red-800"
              disabled={sections.length <= 1}
            >
              ลบส่วนนี้
            </button>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ข้อความคำอธิบาย
            </label>
            <textarea
              value={section.text}
              onChange={(e) => updateText(index, e.target.value)}
              className="w-full p-2 border border-gray-300 rounded h-24"
              placeholder="กรอกคำอธิบายสินค้าส่วนนี้..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              รูปภาพประกอบ
            </label>
            
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
                  disabled={uploading}
                />
                {uploading && (
                  <p className="text-blue-600 text-sm mt-1">กำลังอัปโหลด...</p>
                )}
                <p className="text-xs text-gray-500 mt-1">รองรับไฟล์รูปภาพ (ขนาดไม่เกิน 5MB)</p>
              </div>
            )}
          </div>
        </div>
      ))}
      
      <div className="mt-4">
        <button
          type="button"
          onClick={addSection}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
        >
          + เพิ่มส่วนคำอธิบาย
        </button>
      </div>
    </div>
  );
};

export default ProductDescriptionForm;