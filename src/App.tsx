import React, { useState, useMemo, useRef, useEffect } from 'react';
import { addDays, format, startOfDay } from 'date-fns';

// Hooks
import { useDataFetching } from './hooks/useDataFetching';
import { useGantt } from './hooks/useGantt';

// Components
import { ProjectEditModal } from './modals/ProjectEditModal';
import { AssignmentModal } from './modals/AssignmentModal';
import { GanttBar } from './components/GanttBar';
import { GanttGrid } from './components/GanttGrid';

// Libs & Configs
import { db, appId } from './config/firebase';
import { addDoc, updateDoc, writeBatch, collection, doc, query, where, getDocs, setDoc } from 'firebase/firestore';
import { DAYS_TO_SHOW, STICKY_COL_WIDTH, DATE_CELL_WIDTH } from './lib/constants';
import type { Task, Assignment } from './lib/types';

const today = new Date();
const viewStartDate = startOfDay(addDays(today, -10));

const App: React.FC = () => {
    const {
        projects, workers, tasks, assignments, weatherData, holidays, isLoading,
        setProjects, setTasks, setAssignments, showNotification
    } = useDataFetching();

    // 他のstate
    const [modalState, setModalState] = useState<{ type: string | null; data: any }>({ type: null, data: null });
    const [clipboard, setClipboard] = useState<Assignment[] | null>(null);

    const gridRef = useRef<HTMLDivElement>(null);
    const dates = useMemo(() => Array.from({ length: DAYS_TO_SHOW }, (_, i) => addDays(viewStartDate, i)), []);

    // GanttGrid用の最低限のstateやダミー値
    const [selection, setSelection] = useState<{ startKey: string | null; endKey: string | null }>({ startKey: null, endKey: null });
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
    // --- Ganttバー重なり解消・ドラッグ ---
    // useGanttのpositionedTasksByProject/handleGanttMouseDownを採用し、App.tsx内のdragState/dragOffset/ドラッグリスナーは削除
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

    const handleSaveTask = async (taskToSave: Task) => {
        const { id, ...taskData } = taskToSave;
        const collRef = collection(db, 'artifacts', appId, 'tasks');
        if (taskData.color === undefined) taskData.color = undefined;
        if (id && !id.startsWith("new-")) await updateDoc(doc(collRef, id), taskData);
        else await addDoc(collRef, taskData);
    };

    const handleDeleteProject = async (projectId: string) => {
        const batch = writeBatch(db);
        batch.delete(doc(db, 'artifacts', appId, 'projects', projectId));
        const tasksSnapshot = await getDocs(query(collection(db, 'artifacts', appId, 'tasks'), where("projectId", "==", projectId)));
        tasksSnapshot.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        showNotification('現場を削除しました', 'error');
    };

    useEffect(() => {
        if (gridRef.current) {
            const todayIndex = dates.findIndex(d => format(d, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'));
            if (todayIndex >= 0) {
                gridRef.current.scrollLeft = (todayIndex * DATE_CELL_WIDTH) - (gridRef.current.clientWidth / 2) + STICKY_COL_WIDTH;
            }
        }
    }, [dates]);

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
                    onCellInteraction={() => {}}
                    onProjectClick={() => {}}
                    onWorkerClick={() => {}}
                    onGanttMouseDown={handleGanttMouseDown}
                    onProjectEdit={(projectId) => setModalState({ type: 'project', data: { id: projectId } })}
                    scrollToProjectStart={(startDate) => {
                      if (!gridRef.current) return;
                      const todayIdx = dates.findIndex(d => format(d, 'yyyy-MM-dd') === format(startDate, 'yyyy-MM-dd'));
                      if (todayIdx >= 0) {
                        gridRef.current.scrollLeft = (todayIdx * DATE_CELL_WIDTH) - (gridRef.current.clientWidth / 2) + STICKY_COL_WIDTH;
                      }
                    }}
                />
            </div>

            {/* Modals */}
            <AssignmentModal
                isOpen={modalState.type === 'assignment'}
                onClose={() => setModalState({ type: null, data: null })}
                cellKey={modalState.data?.cellKey}
                selectedKeys={new Set()}
                assignments={assignments}
                projects={projects}
                onSave={handleSaveAssignment}
                clipboard={clipboard}
                onCopy={(data) => { setClipboard(data); }}
                onPaste={() => { }}
            />
            <ProjectEditModal
                isOpen={modalState.type === 'project'}
                onClose={() => setModalState({ type: null, data: null })}
                project={projects.find(p => p.id === modalState.data?.id) || null}
                tasks={tasks.filter(t => t.projectId === modalState.data?.id)}
                onSave={() => { }}
                onDelete={handleDeleteProject}
                onSaveTask={handleSaveTask}
                onDeleteTask={() => { }}
            />
            {/* ... 他モーダル ... */}
        </div>
    );
};

export default App;