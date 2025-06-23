// src/modals/AssignmentModal.tsx
import React from 'react';
import { Copy, Clipboard, Trash2 } from 'lucide-react';
import { ModalWrapper } from './ModalWrapper';
import type { Assignment, Project, Assignments, StatusAssignment } from '../lib/types';

interface AssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    cellKey: string | null;
    selectedKeys: Set<string>;
    assignments: Assignments;
    projects: Project[];
    onSave: (key: string, assignments: Assignment[]) => void;
    clipboard: Assignment[] | null;
    onCopy: (data: Assignment[]) => void;
    onPaste: (targetKeys: Set<string>) => void;
}

export const AssignmentModal: React.FC<AssignmentModalProps> = ({ isOpen, onClose, cellKey, selectedKeys, assignments, projects, onSave, clipboard, onCopy, onPaste }) => {
    if (!cellKey) return null;
    const currentAssignments = assignments[cellKey] || [];
    const isMultiSelect = selectedKeys.size > 1;
    const title = isMultiSelect ? `予定の管理 (${selectedKeys.size}件選択)` : '予定の管理';
    
    const handleAdd = (assignment: Assignment) => {
        const targets = isMultiSelect ? selectedKeys : new Set([cellKey]);
        let updatedCount = 0;
        targets.forEach(key => {
            const existing = assignments[key] || [];
            if (existing.length < 3) {
                onSave(key, [...existing, assignment]);
                updatedCount++;
            }
        });
        if (updatedCount < targets.size) { alert('一部のセルは予定が3件の上限に達しているため追加できませんでした。'); }
    };

    const handleRemove = (key: string, index: number) => {
        const existing = assignments[key] || [];
        const updated = [...existing];
        updated.splice(index, 1);
        onSave(key, updated);
    };

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-4">
                <div>
                    <h4 className="font-semibold text-gray-700">現在の予定</h4>
                    <div className="mt-2 space-y-2 border rounded-md p-2 min-h-[50px]">
                        {currentAssignments.length > 0 ? currentAssignments.map((a, i) => {
                            const project = a.type === 'project' ? projects.find(p => p.id === a.id) : null;
                            const text = project ? project.name : (a as StatusAssignment).value;
                            const color = project ? project.color : (a as StatusAssignment).value === '休み' ? 'bg-gray-500' : 'bg-yellow-500';
                            return <div key={i} className={`flex justify-between items-center p-2 rounded text-white text-sm ${color}`}><span>{text}</span><button onClick={() => handleRemove(cellKey, i)} className="p-1 bg-red-500 rounded-full hover:bg-red-600"><Trash2 size={14}/></button></div>
                        }) : <p className="text-sm text-gray-500">予定はありません。</p>}
                    </div>
                </div>
                <div className="flex space-x-2">
                    <button onClick={() => onCopy(currentAssignments)} className="flex-1 btn btn-blue"><Copy size={16} className="mr-2"/>コピー</button>
                    <button onClick={() => onPaste(isMultiSelect ? selectedKeys : new Set([cellKey]))} disabled={clipboard === null} className="flex-1 btn btn-green disabled:bg-gray-400"><Clipboard size={16} className="mr-2"/>貼り付け</button>
                </div>
                {currentAssignments.length < 3 && (
                    <div>
                        <h4 className="font-semibold text-gray-700">予定を追加</h4>
                        <div className="mt-2 space-y-2 border-t pt-2">
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {projects.map(p => (
                                    <button key={p.id} onClick={() => handleAdd({type: 'project', id: p.id})} className={`p-2 text-sm text-white rounded truncate ${p.color}`}>{p.name}</button>
                                ))}
                            </div>
                            <div className="flex space-x-2 mt-2">
                                <button onClick={() => handleAdd({type: 'status', value: '休み'})} className="flex-1 btn bg-gray-500">休み</button>
                                <button onClick={() => handleAdd({type: 'status', value: '半休'})} className="flex-1 btn bg-yellow-500">半休</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ModalWrapper>
    );
};