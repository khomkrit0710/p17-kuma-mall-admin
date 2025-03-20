'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';

type Option = {
  id: number | string;
  name: string;
};

type TagMultiSelectProps = {
  options: Option[];
  selectedValues: string[];
  onChange: (selectedValues: string[]) => void;
  placeholder?: string;
  label: React.ReactNode;
  id?: string;
  className?: string;
  showEmptyOption?: boolean;
  emptyOptionLabel?: string; 
};

const TagMultiSelect: React.FC<TagMultiSelectProps> = ({
  options,
  selectedValues,
  onChange,
  placeholder = 'เลือก...',
  label,
  id,
  className = '',
  showEmptyOption = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDropdownClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  const toggleOption = (optionId: string) => {
    const newSelectedValues = [...selectedValues];
    
    if (optionId === '0' && showEmptyOption) {
      onChange(['0']);
      setIsOpen(false);
      return;
    }

    if (newSelectedValues.includes('0') && optionId !== '0') {
      newSelectedValues.splice(newSelectedValues.indexOf('0'), 1);
    }
    
    if (newSelectedValues.includes(optionId)) {
      onChange(newSelectedValues.filter(id => id !== optionId));
    } else {
      onChange([...newSelectedValues, optionId]);
    }
    
    setIsOpen(false);
  };

  const removeOption = (optionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedValues.filter(id => id !== optionId));
  };

  const getSelectedOptions = () => {
    const selected = [...options.filter(option => selectedValues.includes(String(option.id)))];
    
    return selected;
  };

  const filteredOptions = options.filter(option => 
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div
        className="min-h-[42px] w-full px-3 py-2 border border-gray-300 rounded bg-white cursor-pointer"
        onClick={handleDropdownClick}
      >
        <div className="flex flex-wrap gap-1 items-center">
          {selectedValues.length > 0 ? (
            getSelectedOptions().map((option) => (
              <div key={option.id} className="inline-flex items-center bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full">
                {option.name}
                <button
                  type="button"
                  onClick={(e) => removeOption(String(option.id), e)}
                  className="ml-1 focus:outline-none"
                >
                  <X size={14} className="text-blue-600 hover:text-blue-800" />
                </button>
              </div>
            ))
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>
        
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <ChevronDown size={18} className="text-gray-400" />
        </div>
      </div>
      
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg">
          <div className="p-2 border-b">
            <input
              ref={inputRef}
              type="text"
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="ค้นหา..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected = selectedValues.includes(String(option.id));
                return (
                  <div 
                    key={option.id} 
                    className={`px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between ${
                      isSelected ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => toggleOption(String(option.id))}
                  >
                    <span>{option.name}</span>
                    {isSelected && <Check size={16} className="text-blue-600" />}
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-gray-500">
                {searchTerm ? 'ไม่พบข้อมูลที่ค้นหา' : 'ไม่มีตัวเลือก'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TagMultiSelect;