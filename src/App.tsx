// c/Users/katuy/OneDrive/my-dashboard-app/src/App.tsx
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

import { UIStateProvider, useUIState } from './contexts/UIStateContext';
import { addDays, format, startOfWeek, subYears, addYears, isBefore, isAfter } from 'date-fns';

// Hooks
import { useDataFetching } from './hooks/useDataFetching';
import { useGantt } from './hooks/useGantt';
import { useDragToScroll } from './hooks/useDragToScroll';

// Components
import { GanttGrid } from './components/GanttGrid';
import { GlobalNotification } from './components/GlobalNotification';
import { ConfirmationModal } from './modals/ConfirmationModal';
import { ProjectEditModal } from './modals/ProjectEditModal';
import { AssignmentModal } from './modals/AssignmentModal';
import { WorkerEditModal } from './modals/WorkerEditModal';
import { ProjectRow } from './components/ProjectRow';
import { WorkerRow } from './components/WorkerRow';

// Libs & Configs
import {
    saveProject, saveTask, saveWorker, saveAssignment as saveAssignmentAPI,
    deleteProject, deleteTask, deleteWorker,
    // ★★★ インポートを追加 ★★★
    updateItemsOrder
} from './services/firestoreService';
import { writeBatch, doc } from 'firebase/firestore';
import { db, appId } from './config/firebase';

import { STICKY_COL_WIDTH, DATE_CELL_WIDTH } from './lib/constants';
import type { Assignment, Project, Worker } from './lib/types';

const today = new Date();
const weekStart = startOfWeek(today, { weekStartsOn: 1 });
const minDate = subYears(today, 1);
const maxDate = addYears(today, 1);

const GanttDashboard: React.FC = () => {
    const {
        projects, workers, tasks, assignments, weatherData, holidays, isLoading,
        setProjects, setTasks, setAssignments
    } = useDataFetching();
    const { uiState, openModal, closeModal, showNotification, hideNotification, requestConfirmation, closeConfirmation } = useUIState();

    const [clipboard, setClipboard] = useState<Assignment[] | null>(null);
    const [viewStartDate, setViewStartDate] = useState<Date>(weekStart);
    const [numDays] = useState<number>(35);
    const [isSelecting, setIsSelecting] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);

    const [orderedProjects, setOrderedProjects] = useState<Project[]>([]);
    const [orderedWorkers, setOrderedWorkers] = useState<Worker[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const gridRef = useRef<HTMLDivElement>(null);
    useDragToScroll(gridRef);
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

    const filteredProjects = useMemo(() => {
        if (!searchTerm) return orderedProjects;
        const lowercasedFilter = searchTerm.toLowerCase();
        return orderedProjects.filter(p =>
            p.name.toLowerCase().includes(lowercasedFilter)
        );
    }, [orderedProjects, searchTerm]);

    const filteredWorkers = useMemo(() => {
        if (!searchTerm) return orderedWorkers;
        const lowercasedFilter = searchTerm.toLowerCase();
        return orderedWorkers.filter(w =>
            w.name.toLowerCase().includes(lowercasedFilter) || (w.nameKana && w.nameKana.includes(searchTerm))
        );
    }, [orderedWorkers, searchTerm]);

    const { handleGanttMouseDown, positionedTasksByProject } = useGantt(
        projects,
        tasks,
        setProjects,
        setTasks
    );

    // ★★★ 修正点: orderフィールドでソートする ★★★
    useEffect(() => {
        const sortByOrder = (a: { order?: number }, b: { order?: number }) => (a.order ?? Infinity) - (b.order ?? Infinity);
        setOrderedProjects([...projects].sort(sortByOrder));
        setOrderedWorkers([...workers].sort(sortByOrder));
    }, [projects, workers]);


    const activeItem = useMemo(() => {
        if (!activeId) return null;
        return orderedProjects.find(p => p.id === activeId) || orderedWorkers.find(w => w.id === activeId);
    }, [activeId, orderedProjects, orderedWorkers]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor)
     );

    const handleSaveAssignment = async (key: string, newAssignments: Assignment[]) => {
        try {
            await saveAssignmentAPI(key, newAssignments);
            setAssignments(prev => ({ ...prev, [key]: newAssignments }));
        } catch {
            showNotification('予定の保存に失敗しました。', 'error');
        }
    };

    const wrapWithNotification = async (promise: Promise<any>, successMessage: string, type: 'success' | 'error' = 'success') => {
        try {
            await promise;
            showNotification(successMessage, type);
        } catch (error) {
            console.error(error);
            showNotification('操作に失敗しました。', 'error');
        }
    };

    const handleAssignmentEdit = (cellKey: string) => {
        openModal('assignment', { cellKey });
    };

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
    };

    // ★★★ 修正点: ドラッグ終了時にFirestoreに保存する処理を追加 ★★★
    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over || active.id === over.id) {
            return;
        }

        // プロジェクトの並べ替え
        const isProject = orderedProjects.some(p => p.id === active.id);
        if (isProject) {
            const oldIndex = orderedProjects.findIndex(p => p.id === active.id);
            const newIndex = orderedProjects.findIndex(p => p.id === over.id);
            if (oldIndex !== -1 && newIndex !== -1) {
                const newOrderedProjects = arrayMove(orderedProjects, oldIndex, newIndex);
                setOrderedProjects(newOrderedProjects);
                wrapWithNotification(
                    updateItemsOrder(newOrderedProjects, 'projects'),
                    '現場の並び順を更新しました'
                );
            }
            return;
        }

        // 作業員の並べ替え
        const isWorker = orderedWorkers.some(w => w.id === active.id);
        if (isWorker) {
            const oldIndex = orderedWorkers.findIndex(w => w.id === active.id);
            const newIndex = orderedWorkers.findIndex(w => w.id === over.id);
            if (oldIndex !== -1 && newIndex !== -1) {
                const newOrderedWorkers = arrayMove(orderedWorkers, oldIndex, newIndex);
                setOrderedWorkers(newOrderedWorkers);
                wrapWithNotification(
                    updateItemsOrder(newOrderedWorkers, 'workers'),
                    '作業員の並び順を更新しました'
                );
            }
        }
    };


    const handleCellInteraction = useCallback((key: string, type: 'down' | 'move' | 'up') => {
        if (type === 'down') {
            setIsSelecting(true);
            setSelection({ startKey: key, endKey: key });
        } else if (type === 'move' && isSelecting) {
            setSelection(prev => ({ ...prev, endKey: key }));
        } else if (type === 'up') {
            if (isSelecting) {
                setIsSelecting(false);
            }
        }
    }, [isSelecting]);

    useEffect(() => {
        const handleMouseUpGlobal = () => { if (isSelecting) setIsSelecting(false); };
        document.addEventListener('mouseup', handleMouseUpGlobal);
        return () => document.removeEventListener('mouseup', handleMouseUpGlobal);
    }, [isSelecting]);

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
            setViewStartDate(startOfWeek(date, { weekStartsOn: 1 }));
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen bg-gray-100">...Loading</div>;
    }

    return (
        <div className="bg-gray-100 text-gray-800 p-4 sm:p-6 h-screen flex flex-col font-sans">
             <header className="mb-4 flex-shrink-0">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">工事・作業員管理ダッシュボード</h1>
                    <button onClick={() => scrollToDate(today)}
                        className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-semibold rounded-md shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >                    今日へ
                    </button>
                </div>
                <div className="mt-2">
                    <input
                        type="text"
                        placeholder="現場名・作業員名で検索..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="block w-full md:w-1/3 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>
            </header>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div ref={gridRef} className="flex-grow overflow-auto bg-white shadow-lg rounded-lg border border-gray-200">
                    <GanttGrid
                        dates={dates}
                        projects={filteredProjects}
                        workers={filteredWorkers}
                        assignments={assignments}
                        holidays={holidays}
                        weatherData={weatherData}
                        positionedTasksByProject={positionedTasksByProject}
                        selection={selection}
                        selectedKeys={selectedKeys}
                        onCellInteraction={handleCellInteraction}
                        onWorkerClick={(workerId) => openModal('worker', { id: workerId })}
                        onGanttMouseDown={handleGanttMouseDown}
                        onProjectEdit={(projectId) => openModal('project', { id: projectId })}
                        onAssignmentEdit={handleAssignmentEdit}
                        scrollToProjectStart={scrollToDate}
                        // ★★★ ここから2行を追加 ★★★
                        onProjectAdd={() => openModal('project', { id: null })}
                        onWorkerAdd={() => openModal('worker', { id: null })}
                    />
                    <DragOverlay>
                        {activeId && activeItem && ('birthDate' in activeItem || 'nameKana' in activeItem ? (
                            <WorkerRow
                                worker={activeItem as Worker}
                                dates={dates}
                                assignments={assignments}
                                projects={projects}
                                selection={selection}
                                selectedKeys={selectedKeys}
                                onWorkerClick={() => {}}
                                onCellInteraction={() => {}}
                                onAssignmentEdit={() => {}}
                            />
                        ) : (
                            <ProjectRow
                                project={activeItem as Project}
                                positionedTasks={positionedTasksByProject[activeItem.id]?.positionedTasks || []}
                                maxLevel={positionedTasksByProject[activeItem.id]?.maxLevel || 0}
                                viewStartDate={dates[0]}
                                onGanttMouseDown={handleGanttMouseDown}
                                dates={dates}
                                DATE_CELL_WIDTH={DATE_CELL_WIDTH}
                                STICKY_COL_WIDTH={STICKY_COL_WIDTH}
                            />
                        ))}
                    </DragOverlay>
                </div>
            </DndContext>

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

            <AssignmentModal
                isOpen={uiState.modal.type === 'assignment'}
                onClose={closeModal}
                cellKey={(uiState.modal.data as any)?.cellKey}
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
                isOpen={uiState.modal.type === 'project'}
                onClose={closeModal}
                project={projects.find(p => p.id === (uiState.modal.data as any)?.id) || null}
                tasks={tasks.filter(t => t.projectId === (uiState.modal.data as any)?.id)}
                // ★★★ 修正点: onSaveに現在のリストを渡す ★★★
                onSave={(project) => wrapWithNotification(saveProject(project, projects), '現場情報を保存しました')}
                onDelete={(id) => requestConfirmation(
                    'この現場を削除しますか？関連するタスクもすべて削除されます。',
                    () => wrapWithNotification(deleteProject(id), '現場を削除しました', 'error')
                )}
                onSaveTask={(task) => wrapWithNotification(saveTask(task), 'タスクを保存しました')}
                onDeleteTask={(id) => requestConfirmation(
                    'このタスクを削除しますか？',
                    () => wrapWithNotification(deleteTask(id), 'タスクを削除しました', 'error')
                )}            />
            <WorkerEditModal
                isOpen={uiState.modal.type === 'worker'}
                onClose={closeModal}
                worker={workers.find(w => w.id === (uiState.modal.data as any)?.id) || null}
                 // ★★★ 修正点: onSaveに現在のリストを渡す ★★★
                onSave={(worker) => wrapWithNotification(saveWorker(worker, workers), '作業員情報を保存しました')}
                onDelete={(id) => requestConfirmation('この作業員を削除しますか？', () => wrapWithNotification(deleteWorker(id), '作業員を削除しました', 'error'))}
            />
            <GlobalNotification notification={uiState.notification} onClear={hideNotification} />
            <ConfirmationModal
                confirmation={uiState.confirmation ? { ...uiState.confirmation, isOpen: true } : null}
                onCancel={closeConfirmation}
            />
        </div>
    );
};

const App: React.FC = () => (
    <UIStateProvider>
        <GanttDashboard />
    </UIStateProvider>
);

export default App;
