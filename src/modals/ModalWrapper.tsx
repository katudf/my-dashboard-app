// src/modals/ModalWrapper.tsx
import React from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title: string;
  size?: 'md' | 'lg' | 'xl';
}

export const ModalWrapper: React.FC<ModalWrapperProps> = ({ isOpen, onClose, children, title, size = 'md' }) => {
    if (!isOpen) return null;
    const sizeClasses = {
        md: 'md:w-1/3 max-w-lg',
        lg: 'md:w-1/2 max-w-2xl',
        xl: 'md:w-2/3 max-w-4xl',
    };
    return (
        // ★★★ 修正点: z-indexを z-50 から z-[150] に変更 ★★★
        // これで、z-100を使っている日付ヘッダーよりも手前に表示される
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[150] animate-fade-in"
            onMouseDown={onClose}
        >
            <div
                className={`bg-white rounded-lg shadow-xl w-11/12 ${sizeClasses[size]} animate-scale-in flex flex-col`}
                onMouseDown={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4 p-6 border-b">
                    <h3 className="text-xl font-bold">{title}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><X size={20} /></button>
                </div>
                <div className="p-6 overflow-y-auto">{children}</div>
            </div>
        </div>
    );
};
