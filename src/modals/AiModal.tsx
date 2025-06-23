// src/modals/AiModal.tsx
import React, { useState, useEffect } from 'react';
import { addDays, format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ModalWrapper } from './ModalWrapper';
import { aiApi } from '../api/ai';
import { formatDateStr } from '../lib/utils';
import type { Assignment, Assignments, Project, Task, WeatherData, Worker, StatusAssignment } from '../lib/types';

interface AiModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: any;
    weatherData: WeatherData;
    assignments: Assignments;
    workers: Worker[];
    projects: Project[];
    onAddTask: (task: Task) => void;
}

export const AiModal: React.FC<AiModalProps> = ({ isOpen, onClose, data, weatherData, assignments, workers, projects, onAddTask }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [content, setContent] = useState<any>(null);
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    
    useEffect(() => {
        if (!isOpen || !data?.type) {
            return;
        }

        setIsLoading(true);
        setContent(null);
        const processRequest = async () => {
            try {
                if (data.type === 'task') {
                    setTitle('✨ AIによるタスク提案');
                    setSubtitle(`「${data.project.name}」に関するタスクを生成中...`);
                    const result = await aiApi.getTaskSuggestions(data.project.name);
                    setContent(result);
                    setSubtitle(`「${data.project.name}」に追加するタスクを選択してください。`);
                } else if (data.type === 'memo') {
                    setTitle(`✨ ${data.worker.name}さんの作業メモ`);
                    setSubtitle('今後3日間の予定をまとめています...');
                    let scheduleText = '';
                    for (let i = 0; i < 3; i++) {
                        const date = addDays(new Date(), i);
                        const dayAssignments = assignments[`w${data.worker.id}-${formatDateStr(date)}`] || [];
                        scheduleText += `${format(date, 'M/d(E)', {locale: ja})}: `;
                        if (dayAssignments.length > 0) {
                            scheduleText += dayAssignments.map((a: Assignment) => a.type === 'project' ? projects.find(p=>p.id===a.id)?.name || '不明' : (a as StatusAssignment).value).join(', ') + '\n';
                        } else { scheduleText += '予定なし\n'; }
                    }
                    const result = await aiApi.generateWorkerMemo(data.worker.name, scheduleText);
                    setContent(result);
                    setSubtitle('AIが生成した申し送りメモです。');
                } else if (data.type === 'risk') {
                    setTitle(`✨ ${data.date}のリスク分析`);
                    setSubtitle('天候と作業内容からリスクを分析しています...');
                    const weather = weatherData[data.date];
                    const dailyTasks = new Set<string>();
                    workers.forEach(w => {
                        const dayAssignments = assignments[`w${w.id}-${data.date}`] || [];
                        dayAssignments.forEach((a: Assignment) => {
                            if (a.type === 'project') {
                                const project = projects.find(p => p.id === a.id);
                                if(project) dailyTasks.add(project.name);
                            }
                        });
                    });
                    const weatherString = weather ? `降水 ${weather.precip}% / 気温 ${weather.temp}°C` : 'データなし';
                    const result = await aiApi.analyzeRisk(data.date, weatherString, Array.from(dailyTasks).join('、'));
                    setContent(result);
                    setSubtitle('AIによるリスク分析結果です。');
                }
            } catch (error) {
                console.error("AI API call failed", error);
                setContent('<p class="text-red-500">AIの応答取得中にエラーが発生しました。</p>');
            } finally { setIsLoading(false); }
        };
        processRequest();
    }, [isOpen, data, weatherData, assignments, workers, projects, onAddTask]);
    
    const handleAddTask = (taskName: string, duration: number) => {
        if (!data?.project) return;
        const newTaskId = "0"; // Firestore will generate ID
        const startDate = new Date();
        const endDate = addDays(startDate, duration - 1);
        onAddTask({ id: newTaskId, projectId: data.project.id, text: taskName, start: formatDateStr(startDate), end: formatDateStr(endDate) });
        setContent((prev: any[]) => prev.filter(p => p.taskName !== taskName));
    };

    if (!isOpen || !data) {
        return null;
    }

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose} title={title}>
            <p className="text-sm text-gray-600 mb-4">{subtitle}</p>
            {isLoading && <div className="flex justify-center items-center h-40"><div className="loader"></div></div>}
            {content && (
                 <div className="space-y-2 max-h-80 overflow-y-auto p-2 bg-gray-50 rounded">
                    {data.type === 'task' && Array.isArray(content) && content.map((t: {taskName: string, duration: number}, i: number) => (
                        <div key={i} className="bg-white p-3 rounded-md flex justify-between items-center shadow-sm">
                            <span>{t.taskName} ({t.duration}日間)</span>
                            <button onClick={() => handleAddTask(t.taskName, t.duration)} className="btn btn-blue text-sm">追加</button>
                        </div>
                    ))}
                    {(data.type === 'memo' || data.type === 'risk') && typeof content === 'string' && (
                        <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
                    )}
                 </div>
            )}
            <div className="mt-6 text-right">
                <button onClick={onClose} className="btn btn-gray">閉じる</button>
            </div>
        </ModalWrapper>
    );
};