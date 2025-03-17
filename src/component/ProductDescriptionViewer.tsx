import React from 'react';
import Image from 'next/image';

type ProductDescriptionViewerProps = {
  description: {
    text_des?: string[];
    img_url_des?: string[];
  } | null;
  onClose: () => void;
};

const ProductDescriptionViewer: React.FC<ProductDescriptionViewerProps> = ({
  description,
  onClose
}) => {
  if (!description) {
    return null;
  }

  const { text_des = [], img_url_des = [] } = description;

  const maxLength = Math.max(text_des.length, img_url_des.length);

  const sections = [];
  for (let i = 0; i < maxLength; i++) {
    sections.push({
      text: text_des[i] || '',
      img_url: img_url_des[i] || ''
    });
  }

  return (
    <div className="fixed inset-0 backdrop-blur-x bg-white/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">รายละเอียดสินค้า</h2>
            <button
              onClick={onClose}
              className="text-red-900 hover:text-gray-600 text-5xl"
            >
              &times;
            </button>
          </div>
          
          <div className="space-y-6">
            {sections.length === 0 ? (
              <p className="text-gray-500">ไม่มีข้อมูลรายละเอียดสินค้า</p>
            ) : (
              sections.map((section, index) => (
                <div key={index} className="space-y-4">
                  {section.text && (
                    <div className="whitespace-pre-line">{section.text}</div>
                  )}
                  
                  {section.img_url && (
                    <div>
                      <Image
                        src={section.img_url}
                        alt={`รูปภาพประกอบ ${index + 1}`}
                        width={600}
                        height={400}
                        className="object-contain border rounded"
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDescriptionViewer;