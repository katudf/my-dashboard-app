// src/components/TaskRow.tsx
import React, { useState } from 'react';
import { Save, XCircle, Pencil, Trash2, X } from 'lucide-react';
import type { Task } from '../lib/types';
import { COLOR_OPTIONS } from '../lib/constants';
import { getTaskBarColor } from '../lib/utils';

interface TaskRowProps {
    task: Task;
    onSave: (task: Task) => void;
    onDelete: (id: string) => void;
}

export const TaskRow: React.FC<TaskRowProps> = ({ task, onSave, onDelete }) => {
    const [isEditing, setIsEditing] = useState(!task.id);
    const [text, setText] = useState(task.text);
    const [start, setStart] = useState(task.start);
    const [end, setEnd] = useState(task.end);
    const [color, setColor] = useState(task.color);

    const handleSave = () => {
        if (!text || !start || !end) {
            alert('すべての項目を入力してください。');
            return;
        }
        if (start > end) {
            alert('終了日は開始日以降に設定してください。');
            return;
        }
        onSave({ ...task, text, start, end, color });
        setIsEditing(false);
    };

    const handleCancel = () => {
        if (!task.id) {
            onDelete("0");
        } else {
            setText(task.text);
            setStart(task.start);
            setEnd(task.end);
            setColor(task.color);
            setIsEditing(false);
        }
    };

    if (isEditing) {
        return (
            <div className="p-2 bg-blue-50 rounded-lg space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2 items-center">
                    <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="項目名" className="input text-sm" />
                    <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="input text-sm" />
                    <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="input text-sm" />
                </div>
                <div className="flex justify-between items-center pt-2">
                    <div className="flex flex-wrap gap-2 items-center">
                        {/* カラーパレット */}
                        {COLOR_OPTIONS.map((c, index) => (
                            <button
                                key={index}
                                onClick={() => { setColor(c.color); }}
                                className={`w-6 h-6 rounded-full ${c.color} cursor-pointer transform hover:scale-110 transition-transform ${color === c.color ? 'ring-2 ring-offset-1 ring-blue-500' : ''}`}
                                title={c.color}
                            />
                        ))}
                        {/* デフォルト色に戻すボタン */}
                         <button
                            onClick={() => { setColor(undefined); }}
                            className={`w-6 h-6 rounded-full bg-gray-200 cursor-pointer transform hover:scale-110 transition-transform flex items-center justify-center text-gray-500 ${!color ? 'ring-2 ring-offset-1 ring-blue-500' : ''}`}
                            title="プロジェクトのデフォルト色"
                        >
                            <X size={14}/>
                        </button>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button onClick={handleSave} className="p-2 text-green-600 hover:bg-green-100 rounded-full"><Save size={18} /></button>
                        <button onClick={handleCancel} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full"><XCircle size={18} /></button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto_auto] gap-3 items-center p-2 hover:bg-gray-50 rounded-lg">
            {/* 色のインジケーター */}
            <div className={`w-3 h-6 rounded ${getTaskBarColor(task.color || 'bg-gray-400')}`}></div>
            <span className="font-medium">{task.text}</span>
            <span className="text-sm text-gray-600">{task.start} ~ {task.end}</span>
            <div className="flex items-center space-x-2">
                <button onClick={() => setIsEditing(true)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"><Pencil size={16} /></button>
                <button onClick={() => onDelete(task.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-full"><Trash2 size={16} /></button>
            </div>
        </div>
    );
};
