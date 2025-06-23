// src/modals/ProjectEditModal.tsx
import React, { useState, useEffect } from 'react';
import { Palette } from 'lucide-react';
import { ModalWrapper } from './ModalWrapper';
import { TaskRow } from '../components/TaskRow';
import type { Project, Task } from '../lib/types';
import { COLOR_OPTIONS } from '../lib/constants';

interface ProjectEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project | null;
    tasks: Task[];
    onSave: (project: Project) => void;
    onDelete: (id: string) => void;
    onSaveTask: (task: Task) => void;
    onDeleteTask: (id: string) => void;
}

export const ProjectEditModal: React.FC<ProjectEditModalProps> = ({ isOpen, onClose, project, tasks, onSave, onDelete, onSaveTask, onDeleteTask }) => {
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [color, setColor] = useState('');
    const [borderColor, setBorderColor] = useState('');
    const [localTasks, setLocalTasks] = useState<Task[]>([]);

    useEffect(() => {
        if (isOpen) {
            if (project) {
                setName(project.name);
                setStartDate(project.startDate || '');
                setEndDate(project.endDate || '');
                setColor(project.color || '');
                setBorderColor(project.borderColor || '');
            } else {
                setName('');
                setStartDate('');
                setEndDate('');
                const defaultColor = COLOR_OPTIONS[0];
                setColor(defaultColor.color);
                setBorderColor(defaultColor.borderColor);
            }
        }
    }, [isOpen, project]);

    useEffect(() => {
        if (isOpen) {
            setLocalTasks(tasks);
        }
    }, [isOpen, tasks]);


    const handleProjectSave = () => {
        if (!name) { alert('現場名を入力してください。'); return; }
        if (startDate && endDate && startDate > endDate) { alert('終了日は開始日以降に設定してください。'); return; }
        onSave({ ...project, id: project?.id || "0", name, startDate: startDate || null, endDate: endDate || null, color, borderColor });
        onClose();
    };
    
    const handleAddNewTaskRow = () => {
        const newTask: Task = { id: "0", projectId: project!.id, text: '', start: '', end: '' };
        setLocalTasks([...localTasks, newTask]);
    };

    const handleTaskSave = (task: Task) => {
        onSaveTask(task);
        if(!task.id) {
             setLocalTasks(prev => prev.filter(t => t.id !== "0"));
        }
    };
    
    const handleTaskDelete = (id: string) => {
        if (id === "0") {
            setLocalTasks(prev => prev.filter(t => t.id !== "0"));
        } else {
            onDeleteTask(id);
        }
    };

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose} title={project ? '現場情報の編集' : '新規現場の追加'} size="lg">
            <div className="space-y-6">
                <div className="p-4 border rounded-lg">
                    <h4 className="text-lg font-semibold mb-2">現場情報</h4>
                    <div className="space-y-4">
                        <input type="text" placeholder="現場名" value={name} onChange={e => setName(e.target.value)} className="input" />
                        <div className="flex space-x-2">
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input flex-1" title="開始日"/>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input flex-1" title="終了日"/>
                        </div>
                    </div>
                </div>

                <div className="p-4 border rounded-lg">
                    <h4 className="text-lg font-semibold mb-3 flex items-center"><Palette size={20} className="mr-2" />色を選択</h4>
                    <div className="flex flex-wrap gap-3">
                        {COLOR_OPTIONS.map((c, index) => (
                            <button
                                key={index}
                                onClick={() => { setColor(c.color); setBorderColor(c.borderColor); }}
                                className={`w-8 h-8 rounded-full ${c.color} cursor-pointer transform hover:scale-110 transition-transform ${borderColor === c.borderColor ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                                title={c.color}
                            />
                        ))}
                    </div>
                </div>

                {project && (
                    <div className="p-4 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-lg font-semibold">項目リスト</h4>
                            <button onClick={handleAddNewTaskRow} className="btn btn-blue text-sm">項目を新規追加</button>
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {localTasks.map(task => (
                                <TaskRow key={task.id || `new-${Date.now()}`} task={task} onSave={handleTaskSave} onDelete={handleTaskDelete} />
                            ))}
                            {localTasks.length === 0 && <p className="text-sm text-gray-500 text-center py-4">項目はありません。</p>}
                        </div>
                    </div>
                )}
            </div>
            <div className={`mt-6 pt-4 border-t flex ${project ? 'justify-between' : 'justify-end'}`}>
                {project && <button onClick={() => onDelete(project.id)} className="btn btn-red">この現場を削除</button>}
                <div className="space-x-2">
                    <button onClick={onClose} className="btn btn-gray">キャンセル</button>
                    <button onClick={handleProjectSave} className="btn btn-blue">保存して閉じる</button>
                </div>
            </div>
        </ModalWrapper>
    );
};