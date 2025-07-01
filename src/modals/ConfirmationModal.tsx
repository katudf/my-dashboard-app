// src/modals/ConfirmationModal.tsx
import React from 'react';
import type { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface ConfirmationModalProps {
    confirmation: { isOpen: boolean; message: string; onConfirm: () => void; } | null;
    onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ confirmation, onCancel }) => {
    if (!confirmation?.isOpen) return null;

    const handleConfirm = () => {
        confirmation.onConfirm();
        onCancel();
    };

    return (
        // ★★★ 修正点: z-indexを z-[60] から z-[200] に変更 ★★★
        // これで、z-[150]の編集モーダルよりも、さらに手前に表示される
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[200] animate-fade-in">
            <div className="bg-white rounded-lg p-6 shadow-xl w-11/12 max-w-sm animate-scale-in">
                <div className="flex items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                        <AlertCircle className="h-6 w-6 text-red-600" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            確認
                        </h3>
                        <div className="mt-2">
                            <p className="text-sm text-gray-500">
                                {confirmation.message}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                        type="button"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                        onClick={handleConfirm}
                    >
                        はい
                    </button>
                    <button
                        type="button"
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                        onClick={onCancel}
                    >
                        キャンセル
                    </button>
                </div>
            </div>
        </div>
    );
};
