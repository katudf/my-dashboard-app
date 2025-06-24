// src/hooks/useGantt.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { addDays, differenceInDays } from 'date-fns';
import { writeBatch, doc } from 'firebase/firestore';
import { db, appId } from '../config/firebase';
import { formatDateStr, parseDateStr } from '../lib/utils';
import type { Project, Task, PositionedTask } from '../lib/types';
import { DATE_CELL_WIDTH } from '../lib/constants';

export const useGantt = (
    initialProjects: Project[],
    initialTasks: Task[],
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>,
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>
) => {
    const [dragInfo, setDragInfo] = useState<{
        item: Project | Task;
        type: 'project' | 'task';
        handle: 'move' | 'resize-left' | 'resize-right';
        startX: number;
        originalStart: Date;
        originalEnd: Date;
        originalTaskDates?: { id: string; start: Date; end: Date }[];
    } | null>(null);

    const handleGanttMouseDown = useCallback((e: React.MouseEvent, item: Project | Task, type: 'project' | 'task', handle: 'move' | 'resize-left' | 'resize-right') => {
        e.preventDefault();
        e.stopPropagation();

        const startStr = type === 'project' ? (item as Project).startDate : (item as Task).start;
        const endStr = type === 'project' ? (item as Project).endDate : (item as Task).end;
        if (!startStr || !endStr) return;
        
        document.body.style.cursor = handle === 'move' ? 'grabbing' : 'ew-resize';

        const dragInfoData: any = {
            item, type, handle, startX: e.pageX,
            originalStart: parseDateStr(startStr),
            originalEnd: parseDateStr(endStr)
        };
        
        if (type === 'project' && handle === 'move') {
            dragInfoData.originalTaskDates = initialTasks
                .filter(t => t.projectId === item.id)
                .map(t => ({ id: t.id, start: parseDateStr(t.start), end: parseDateStr(t.end) }));
        }
        setDragInfo(dragInfoData);
    }, [initialTasks]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!dragInfo) return;

            const dx = e.pageX - dragInfo.startX;
            const dayOffset = Math.round(dx / DATE_CELL_WIDTH);

            if (dragInfo.type === 'project' && dragInfo.handle === 'move') {
                const newProjectStart = addDays(dragInfo.originalStart, dayOffset);
                const newProjectEnd = addDays(dragInfo.originalEnd, dayOffset);
                
                setProjects(prev => prev.map(p => 
                    p.id === dragInfo.item.id ? { ...p, startDate: formatDateStr(newProjectStart), endDate: formatDateStr(newProjectEnd) } : p
                ));

                setTasks(prev => prev.map(t => {
                    const originalTaskDate = dragInfo.originalTaskDates?.find(otd => otd.id === t.id);
                    if (originalTaskDate) {
                        const newTaskStart = addDays(originalTaskDate.start, dayOffset);
                        const newTaskEnd = addDays(originalTaskDate.end, dayOffset);
                        return { ...t, start: formatDateStr(newTaskStart), end: formatDateStr(newTaskEnd) };
                    }
                    return t;
                }));
            } else {
                let newStart: Date, newEnd: Date;
                if (dragInfo.handle === 'move') {
                    newStart = addDays(dragInfo.originalStart, dayOffset);
                    newEnd = addDays(newStart, differenceInDays(dragInfo.originalEnd, dragInfo.originalStart));
                } else if (dragInfo.handle === 'resize-left') {
                    newStart = addDays(dragInfo.originalStart, dayOffset);
                    newEnd = dragInfo.originalEnd;
                    if (newStart > newEnd) newStart = newEnd;
                } else { // resize-right
                    newStart = dragInfo.originalStart;
                    newEnd = addDays(dragInfo.originalEnd, dayOffset);
                    if (newEnd < newStart) newEnd = newStart;
                }
                
                const updater = dragInfo.type === 'project' ? setProjects : setTasks;
                updater(prev => prev.map(item => item.id === dragInfo.item.id ? { ...item, [dragInfo.type === 'project' ? 'startDate' : 'start']: formatDateStr(newStart), [dragInfo.type === 'project' ? 'endDate' : 'end']: formatDateStr(newEnd) } : item) as any);
            }
        };

        const handleMouseUp = async (e: MouseEvent) => {
            if (!dragInfo) return;

            const dx = e.pageX - dragInfo.startX;
            const dayOffset = Math.round(dx / DATE_CELL_WIDTH);

            if (dayOffset !== 0) {
                const batch = writeBatch(db);
                // ... (Update logic from App.tsx)
                 await batch.commit().catch(err => console.error("Error writing batch:", err));
            }

            setDragInfo(null);
            document.body.style.cursor = 'auto';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragInfo, setProjects, setTasks]);
    
     const positionedTasksByProject = useMemo(() => {
        const byProject: { [projectId: string]: { positionedTasks: PositionedTask[], maxLevel: number } } = {};

        for (const project of initialProjects) {
            const projectTasks = initialTasks.filter(t => t.projectId === project.id).sort((a, b) => differenceInDays(parseDateStr(a.start), parseDateStr(b.start)));
            const levels: { start: Date; end: Date }[][] = [];
            const positionedTasks: PositionedTask[] = [];

            projectTasks.forEach(task => {
                const taskStart = parseDateStr(task.start);
                const taskEnd = parseDateStr(task.end);
                let level = 0;
                let placed = false;

                while (!placed) {
                    if (!levels[level]) levels[level] = [];
                    
                    const overlaps = levels[level].some(placedTask => taskStart <= placedTask.end && taskEnd >= placedTask.start);

                    if (!overlaps) {
                        levels[level].push({ start: taskStart, end: taskEnd });
                        positionedTasks.push({ ...task, level });
                        placed = true;
                    } else {
                        level++;
                    }
                }
            });
            byProject[project.id] = { positionedTasks, maxLevel: levels.length };
        }
        return byProject;
    }, [initialTasks, initialProjects]);

    return { handleGanttMouseDown, positionedTasksByProject };
};