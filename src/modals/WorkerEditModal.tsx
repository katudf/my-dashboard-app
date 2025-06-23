// src/modals/WorkerEditModal.tsx
import React, { useState, useEffect } from 'react';
import { ModalWrapper } from './ModalWrapper';
import type { Worker } from '../lib/types';

interface WorkerEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    worker: Worker | null;
    onSave: (worker: Omit<Worker, 'id'> & { id?: string; birthDate?: string }) => void;
    onDelete: (id: string) => void;
}

export const WorkerEditModal: React.FC<WorkerEditModalProps> = ({ isOpen, onClose, worker, onSave, onDelete }) => {
    const [name, setName] = useState('');
    const [birthDate, setBirthDate] = useState<string>('');

    useEffect(() => {
        if (isOpen) {
            if (worker) {
                setName(worker.name || '');
                setBirthDate(worker.birthDate || '');
            } else {
                setName('');
                setBirthDate('');
            }
        }
    }, [worker, isOpen]);
    
    const handleSave = () => {
        if (!name) { alert('作業員名を入力してください。'); return; }
        onSave({ ...worker, name, birthDate });
        onClose();
    };

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose} title={worker ? '作業員情報の編集' : '新規作業員の追加'}>
            <div className="space-y-4">
                <div>
                    <label htmlFor="worker-name" className="block text-sm font-medium text-gray-700">作業員名</label>
                    <input
                        id="worker-name"
                        type="text"
                        placeholder="作業員名"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="input mt-1"
                    />
                </div>
                <div>
                    <label htmlFor="worker-birthdate" className="block text-sm font-medium text-gray-700">生年月日</label>
                    <input
                        id="worker-birthdate"
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="input mt-1"
                    />
                </div>
            </div>
            <div className={`mt-6 flex ${worker ? 'justify-between' : 'justify-end'}`}>
                {worker && <button onClick={() => onDelete(worker.id)} className="btn btn-red">削除</button>}
                <div className="space-x-2">
                    <button onClick={onClose} className="btn btn-gray">キャンセル</button>
                    <button onClick={handleSave} className="btn btn-blue">保存</button>
                </div>
            </div>
        </ModalWrapper>
    );
};
