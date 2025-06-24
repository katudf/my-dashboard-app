// c/Users/katuy/OneDrive/my-dashboard-app/src/App.tsx
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { addDays, format, startOfWeek, subYears, addYears, isBefore, isAfter } from 'date-fns';

// Hooks
import { useDataFetching } from './hooks/useDataFetching';
import { useGantt } from './hooks/useGantt';

// Components
import { GanttGrid } from './components/GanttGrid';
import { GlobalNotification } from './components/GlobalNotification';
import { ConfirmationModal } from './modals/ConfirmationModal';
import { ProjectEditModal } from './modals/ProjectEditModal';
import { AssignmentModal } from './modals/AssignmentModal';
import { WorkerEditModal } from './modals/WorkerEditModal';

// Libs & Configs
import { db, appId } from './config/firebase';
import { addDoc, updateDoc, writeBatch, collection, doc, query, where, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { STICKY_COL_WIDTH, DATE_CELL_WIDTH, COLOR_OPTIONS } from './lib/constants';
import type { Task, Assignment, Project, Worker } from './lib/types';

const today = new Date();
const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // 月曜始まり
const minDate = subYears(today, 1);
const maxDate = addYears(today, 1);

const App: React.FC = () => {
    const {
        projects, workers, tasks, assignments, weatherData, holidays, isLoading,
        setProjects, setTasks, setAssignments    } = useDataFetching();

    // 他のstate
    const [modalState, setModalState] = useState<{ type: string | null; data: any }>({ type: null, data: null });
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const [confirmation, setConfirmation] = useState<{ isOpen: boolean; message: string; onConfirm: () => void; } | null>(null);
    const [clipboard, setClipboard] = useState<Assignment[] | null>(null);
    const [viewStartDate, setViewStartDate] = useState<Date>(weekStart);
    const [numDays] = useState<number>(35); // 初期表示日数（例: 5週間分）
    const [isSelecting, setIsSelecting] = useState(false);
    const showNotification = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
    }, []);    

    const gridRef = useRef<HTMLDivElement>(null);
    const dates = useMemo(() => Array.from({ length: numDays }, (_, i) => addDays(viewStartDate, i)), [viewStartDate, numDays]);

    const [selection, setSelection] = useState<{ startKey: string | null; endKey: string | null }>({ startKey: null, endKey: null });    
    const selectedKeys = useMemo(() => {
        const keys = new Set<string>();
        if (!selection.startKey || !selection.endKey) return keys;
    
        const parseKey = (key: string) => {
            const parts = key.split('-');
            const workerId = parts[0].substring(1);
            const dateStr = parts.slice(1).join('-');
            return { workerId, dateStr };
        };
    
        const { workerId: startWorkerId, dateStr: startDateStr } = parseKey(selection.startKey);
        const { workerId: endWorkerId, dateStr: endDateStr } = parseKey(selection.endKey);
    
        const startWorkerIndex = workers.findIndex(w => w.id === startWorkerId);
        const endWorkerIndex = workers.findIndex(w => w.id === endWorkerId);
        const startDateIndex = dates.findIndex(d => format(d, 'yyyy-MM-dd') === startDateStr);
        const endDateIndex = dates.findIndex(d => format(d, 'yyyy-MM-dd') === endDateStr);
    
        if (startWorkerIndex === -1 || endWorkerIndex === -1 || startDateIndex === -1 || endDateIndex === -1) return keys;
    
        const minWorkerIndex = Math.min(startWorkerIndex, endWorkerIndex);
        const maxWorkerIndex = Math.max(startWorkerIndex, endWorkerIndex);
        const minDateIndex = Math.min(startDateIndex, endDateIndex);
        const maxDateIndex = Math.max(startDateIndex, endDateIndex);
    
        for (let wIdx = minWorkerIndex; wIdx <= maxWorkerIndex; wIdx++) {
            for (let dIdx = minDateIndex; dIdx <= maxDateIndex; dIdx++) {
                const workerId = workers[wIdx].id;
                const dateStr = format(dates[dIdx], 'yyyy-MM-dd');
                keys.add(`w${workerId}-${dateStr}`);
            }
        }
        return keys;
    }, [selection, workers, dates]);

    // --- Ganttバー重なり解消・ドラッグ ---
    const { handleGanttMouseDown, positionedTasksByProject } = useGantt(
        projects,
        tasks,
        setProjects,
        setTasks
    );

    // --- データ保存・削除ロジック ---
    const handleSaveAssignment = (key: string, newAssignments: Assignment[]) => {
        const docRef = doc(db, 'artifacts', appId, 'assignments', key);
        setDoc(docRef, { assignments: newAssignments })
            .then(() => setAssignments(prev => ({ ...prev, [key]: newAssignments })))
            .catch(() => showNotification('予定の保存に失敗しました。', 'error'));
    };

    const handleSaveProject = async (projectToSave: Project) => {
        const { id, ...projectData } = projectToSave;
        const collRef = collection(db, 'artifacts', appId, 'projects');
        let dataToSave = { ...projectData };

        if (id && id !== "0") {
            await updateDoc(doc(collRef, id), dataToSave);
        } else {
            if (!dataToSave.color) {
                const randomColor = COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)];
                dataToSave.color = randomColor.color;
                dataToSave.borderColor = randomColor.borderColor;
            }
            await addDoc(collRef, dataToSave);
        }
        showNotification('現場情報を保存しました');
    };

    const handleSaveTask = async (taskToSave: Task) => {
        const { id, ...taskData } = taskToSave;
        const dataForFirestore = {
            ...taskData,
            color: taskData.color ?? null,
        };
        const collRef = collection(db, 'artifacts', appId, 'tasks');
        if (id && !id.startsWith("new-")) await updateDoc(doc(collRef, id), dataForFirestore);
        else await addDoc(collRef, dataForFirestore);
    };

    const handleSaveWorker = async (workerToSave: Omit<Worker, 'id'> & { id?: string }) => {
        const { id, ...workerData } = workerToSave;
        const collRef = collection(db, 'artifacts', appId, 'workers');
        const dataToSave = { name: workerData.name, birthDate: workerData.birthDate || null };
        if (id && id !== "0") await updateDoc(doc(collRef, id), dataToSave);
        else await addDoc(collRef, dataToSave);
        showNotification('作業員情報を保存しました');
    };

    const handleDeleteProject = async (projectId: string) => {
        const batch = writeBatch(db);
        batch.delete(doc(db, 'artifacts', appId, 'projects', projectId));
        const tasksSnapshot = await getDocs(query(collection(db, 'artifacts', appId, 'tasks'), where("projectId", "==", projectId)));
        tasksSnapshot.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        showNotification('現場を削除しました', 'error');
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!taskId || taskId.startsWith('new-')) return;
        await deleteDoc(doc(db, 'artifacts', appId, 'tasks', taskId));
        showNotification('タスクを削除しました', 'error');
    };

    const handleDeleteWorker = async (workerId: string) => {
        await deleteDoc(doc(db, 'artifacts', appId, 'workers', workerId));
        showNotification('作業員を削除しました', 'error');
    };

    const handleRequestConfirmation = (message: string, onConfirm: () => void) => {
        setConfirmation({ isOpen: true, message, onConfirm });
    };

    const handleCellInteraction = useCallback((key: string, type: 'down' | 'move' | 'up') => {
        if (type === 'down') {
            setIsSelecting(true);
            setSelection({ startKey: key, endKey: key });
        } else if (type === 'move' && isSelecting) {
            setSelection(prev => ({ ...prev, endKey: key }));
        } else if (type === 'up') {
            if (isSelecting) {
                if (selection.startKey === key && selection.endKey === key) {
                    setModalState({ type: 'assignment', data: { cellKey: key, selectedKeys } });
                }
                setIsSelecting(false);
            }
        }
    }, [isSelecting, selection.startKey, selection.endKey, selectedKeys]);

    useEffect(() => {
        // This effect handles mouse up events globally to stop dragging/selecting.
        const handleMouseUpGlobal = () => { if (isSelecting) setIsSelecting(false); };
        document.addEventListener('mouseup', handleMouseUpGlobal);
        return () => document.removeEventListener('mouseup', handleMouseUpGlobal);
    }, [isSelecting]);

    // ナビゲーション用関数
    const scrollDays = (days: number) => {
        const newStart = addDays(viewStartDate, days);
        if (isBefore(newStart, minDate)) {
            setViewStartDate(minDate);
        } else if (isAfter(addDays(newStart, numDays - 1), maxDate)) {
            setViewStartDate(addDays(maxDate, -numDays + 1));
        } else {
            setViewStartDate(newStart);
        }
    };

    const scrollToDate = (date: Date) => {
        if (!gridRef.current) return;
        const dateIndex = dates.findIndex(d => format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));
        if (dateIndex >= 0) {
            gridRef.current.scrollLeft = (dateIndex * DATE_CELL_WIDTH) - (gridRef.current.clientWidth / 2) + STICKY_COL_WIDTH;
        } else {
            // If the date is not in the current view, navigate to it and then scroll.
            setViewStartDate(startOfWeek(date, { weekStartsOn: 1 }));
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen bg-gray-100">...Loading</div>;
    }

    return (
        <div className="bg-gray-100 text-gray-800 p-4 sm:p-6 h-screen flex flex-col font-sans">
            <header className="mb-4 flex-shrink-0">
                <h1 className="text-2xl font-bold">工事・作業員管理ダッシュボード</h1>
            </header>

            <div ref={gridRef} className="flex-grow overflow-auto bg-white shadow-lg rounded-lg border border-gray-200">
                <GanttGrid
                    dates={dates}
                    projects={projects}
                    tasks={tasks}
                    workers={workers}
                    assignments={assignments}
                    holidays={holidays}
                    weatherData={weatherData}
                    positionedTasksByProject={positionedTasksByProject}
                    selection={selection}
                    selectedKeys={selectedKeys}
                    onCellInteraction={handleCellInteraction}
                    onWorkerClick={(workerId) => setModalState({ type: 'worker', data: { id: workerId } })}
                    onGanttMouseDown={handleGanttMouseDown}
                    onProjectEdit={(projectId) => setModalState({ type: 'project', data: { id: projectId } })}
                    scrollToProjectStart={scrollToDate}
                    gridRef={gridRef as React.RefObject<HTMLDivElement>}
                    scrollToToday={() => scrollToDate(today)}
                />
            </div>

            {/* ナビゲーション例: */}
            <div className="flex gap-2 mt-2">
                <button
                  onClick={() => scrollDays(-numDays)}
                  className="px-2 py-1 bg-gray-200 rounded"
                  disabled={isBefore(addDays(viewStartDate, -numDays), minDate)}
                >前へ</button>
                <button
                  onClick={() => scrollDays(numDays)}
                  className="px-2 py-1 bg-gray-200 rounded"
                  disabled={isAfter(addDays(viewStartDate, numDays + numDays - 1), maxDate)}
                >次へ</button>
            </div>

            {/* Modals */}
            <AssignmentModal
                isOpen={modalState.type === 'assignment'}
                onClose={() => setModalState({ type: null, data: null })}
                cellKey={modalState.data?.cellKey}
                selectedKeys={selectedKeys}
                assignments={assignments}
                projects={projects}
                onSave={handleSaveAssignment}
                clipboard={clipboard}
                onCopy={(data) => { setClipboard(data); showNotification('コピーしました'); }}
                onPaste={(targetKeys) => {
                    if (clipboard !== null) {
                        const batch = writeBatch(db);
                        targetKeys.forEach(key => {
                            const docRef = doc(db, 'artifacts', appId, 'assignments', key);
                            batch.set(docRef, { assignments: clipboard });
                        });
                        batch.commit().then(() => showNotification(`${targetKeys.size}件に貼り付けました`)).catch(err => console.error(err));
                    }
                }}
            />
            <ProjectEditModal
                isOpen={modalState.type === 'project'}
                onClose={() => setModalState({ type: null, data: null })}
                project={projects.find(p => p.id === modalState.data?.id) || null}
                tasks={tasks.filter(t => t.projectId === modalState.data?.id)}
                onSave={handleSaveProject}
                onDelete={(id) => handleRequestConfirmation('この現場を削除しますか？関連するタスクもすべて削除されます。', () => handleDeleteProject(id))}
                onSaveTask={handleSaveTask}
                onDeleteTask={(id) => handleRequestConfirmation('このタスクを削除しますか？', () => handleDeleteTask(id))}
            />
            <WorkerEditModal isOpen={modalState.type === 'worker'} onClose={() => setModalState({ type: null, data: null })} worker={workers.find(w => w.id === modalState.data?.id) || null} onSave={handleSaveWorker} onDelete={(id) => handleRequestConfirmation('この作業員を削除しますか？', () => handleDeleteWorker(id))} />
            <GlobalNotification notification={notification} onClear={() => setNotification(null)} />
            <ConfirmationModal confirmation={confirmation} onCancel={() => setConfirmation(null)} />
        </div>
    );
};

export default App;
