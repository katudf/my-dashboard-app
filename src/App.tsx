import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { addDays, format, differenceInDays, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Plus, Copy, Clipboard, BrainCircuit, Trash2, X, Bell, Save, XCircle, Pencil, AlertCircle } from 'lucide-react';

// --- 1. 型定義 (Type Definitions) ---
export interface Project {
  id: number;
  name: string;
  color: string;
  borderColor: string;
  startDate: string | null;
  endDate: string | null;
}

export interface Task {
  id: number;
  projectId: number;
  text: string;
  start: string;
  end: string;
}

export interface PositionedTask extends Task {
  level: number;
}

export interface Worker {
  id: number;
  name: string;
}

export interface ProjectAssignment {
  type: 'project';
  id: number;
}

export interface StatusAssignment {
  type: 'status';
  value: '休み' | '半休';
}

export type Assignment = ProjectAssignment | StatusAssignment;

export interface Assignments {
  [key: string]: Assignment[];
}

export interface WeatherData {
  [date: string]: {
    precip: number;
    temp: number;
  };
}

export interface HolidayData {
    [date: string]: string;
}

// --- 初期データ (Initial Data) ---
const initialProjects: Project[] = [
    { id: 1, name: '七の橋 外壁塗装および防水工事', color: 'bg-teal-500', borderColor: 'border-teal-500', startDate: '2025-06-11', endDate: '2025-06-25' },
    { id: 2, name: '工場ダクト修繕', color: 'bg-orange-500', borderColor: 'border-orange-500', startDate: '2025-06-08', endDate: '2025-06-14' },
    { id: 3, name: 'デイサービスひまわり 内装リニューアル', color: 'bg-red-500', borderColor: 'border-red-500', startDate: null, endDate: null },
    { id: 4, name: '金属テック倉庫 新築工事', color: 'bg-yellow-500', borderColor: 'border-yellow-500', startDate: null, endDate: null },
];

const initialWorkers: Worker[] = [
    { id: 1, name: '斎藤' }, { id: 2, name: '鈴木' }, { id: 3, name: '高橋' }, { id: 4, name: '小熊' },
    { id: 5, name: 'ハヤシ' }, { id: 6, name: 'アリエル' }, { id: 7, name: '松田' },
];

const initialTasks: Task[] = [
    { id: 1, projectId: 1, text: '足場設置', start: '2025-06-11', end: '2025-06-14' },
    { id: 2, projectId: 1, text: '水洗い', start: '2025-06-13', end: '2025-06-16' }, 
    { id: 3, projectId: 1, text: '塗装工事', start: '2025-06-17', end: '2025-06-20' },
    { id: 4, projectId: 1, text: '資材搬入', start: '2025-06-13', end: '2025-06-13' },
];

const initialAssignments: Assignments = {
    'w1-2025-06-11': [{ type: 'project', id: 1 }],
    'w1-2025-06-12': [{ type: 'project', id: 1 }],
    'w2-2025-06-11': [{ type: 'project', id: 1 }],
    'w2-2025-06-12': [{ type: 'project', id: 2 }],
    'w3-2025-06-18': [{ type: 'status', value: '休み' }],
    'w4-2025-06-19': [{ type: 'status', value: '半休' }],
};

// --- 定数 (Constants) ---
const API_KEY = '9d87dcc7996d69d1a64804dabb7795df'; 
const LAT = '39.14';
const LON = '141.14';

const STICKY_COL_WIDTH = 250;
const DATE_CELL_WIDTH = 100;
const DAYS_TO_SHOW = 45;
const HEADER_HEIGHT = 60;
const ROW_TOP_MARGIN = 4;
const ROW_BOTTOM_MARGIN = 4;
const PROJECT_BAR_HEIGHT = 22;
const TASK_BAR_HEIGHT = 28;
const BAR_V_MARGIN = 4;
const WORKER_HEADER_HEIGHT = 40;
const WORKER_ROW_HEIGHT = 50;


// --- 日付ヘルパー関数 (Date Helpers) ---
const today = new Date();
const viewStartDate = addDays(today, -10);

const formatDateStr = (date: Date): string => format(date, 'yyyy-MM-dd');
const parseDateStr = (dateStr: string): Date => parseISO(dateStr);

// --- 色ヘルパー関数 ---
const getTaskBarColor = (projectColor: string): string => {
  const colorMap: { [key: string]: string } = {
    'bg-teal-500': 'bg-teal-300',
    'bg-orange-500': 'bg-orange-300',
    'bg-red-500': 'bg-red-300',
    'bg-yellow-500': 'bg-yellow-300',
    'bg-indigo-500': 'bg-indigo-300',
    'bg-purple-500': 'bg-purple-300',
    'bg-pink-500': 'bg-pink-300',
    'bg-blue-500': 'bg-blue-300',
  };
  return colorMap[projectColor] || projectColor;
};

// --- AI機能モック (Mock AI Functions) ---
const aiApi = {
  getTaskSuggestions: async (projectName: string): Promise<{ taskName: string; duration: number }[]> => {
    console.log(`AI API: Fetching task suggestions for "${projectName}"...`);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const suggestions = [
      { taskName: '足場設置', duration: 2 }, { taskName: '下地処理', duration: 3 },
      { taskName: '中塗り', duration: 2 }, { taskName: '上塗り', duration: 2 },
      { taskName: '検査・手直し', duration: 1 }, { taskName: '足場解体', duration: 1 },
    ];
    return suggestions.filter(() => Math.random() > 0.4);
  },
  generateWorkerMemo: async (workerName: string, schedule: string): Promise<string> => {
    console.log(`AI API: Generating memo for ${workerName} with schedule:\n${schedule}`);
    await new Promise(resolve => setTimeout(resolve, 1200));
    return `## ${workerName}さん 申し送りメモ\n\n**【要確認】**\n- 明日の現場入場は8:00厳守でお願いします。\n- 鈴木さんと連携し、高所作業の安全対策を再確認してください。\n\n**【特記事項】**\n${schedule.trim() ? `- 直近の予定は以下の通りです。\n${schedule.replace(/^/gm, '  - ')}` : '- 直近の予定はありません。'}\n\n*This is an AI-generated memo.*`;
  },
  analyzeRisk: async (date: string, weather: string, tasks: string): Promise<string> => {
    console.log(`AI API: Analyzing risk for ${date} with weather "${weather}" and tasks "${tasks}"`);
    await new Promise(resolve => setTimeout(resolve, 1800));
    let riskHtml = `<h3>${date} の潜在リスク分析</h3>`;
    riskHtml += `<p><strong>天候:</strong> ${weather} / <strong>主な作業:</strong> ${tasks || '未定'}</p>`;
    riskHtml += '<ul>';
    if (weather.includes('雨')) {
        riskHtml += '<li><strong class="text-red-500">降雨リスク:</strong> 塗装・防水作業は原則中止。感電防止のため電動工具の管理を徹底。</li>';
    }
    if (parseInt(weather.split('℃')[0].split('/')[1]) >= 30) {
        riskHtml += '<li><strong class="text-orange-500">熱中症リスク:</strong> 定期的な水分補給と塩分摂取を義務付け。作業中の体調変化に注意。</li>';
    }
    if (tasks.includes('塗装') || tasks.includes('防水')) {
        riskHtml += '<li><strong class="text-yellow-500">化学物質リスク:</strong> 有機溶剤の取り扱いに注意。適切な換気と保護具の着用を。</li>';
    }
    if (riskHtml.endsWith('<ul>')) {
        riskHtml += '<li>特筆すべき重大なリスクは検出されませんでした。基本的な安全対策を継続してください。</li>';
    }
    riskHtml += '</ul>';
    return riskHtml;
  },
};

// --- コンポーネント (Components) ---
const GlobalNotification: React.FC<{ notification: { message: string; type: 'success' | 'error' } | null; onClear: () => void }> = ({ notification, onClear }) => {
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                onClear();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [notification, onClear]);

    if (!notification) return null;

    const bgColor = notification.type === 'success' ? 'bg-gray-800' : 'bg-red-600';

    return (
        <div className={`fixed bottom-5 right-5 text-white px-4 py-3 rounded-lg shadow-2xl z-[100] transition-all duration-300 animate-fade-in-up ${bgColor}`}>
            <div className="flex items-center">
                <Bell size={18} className="mr-2" />
                <span>{notification.message}</span>
            </div>
        </div>
    );
};

const GanttBar: React.FC<{
    item: Project | PositionedTask;
    type: 'project' | 'task';
    viewStartDate: Date;
    color: string;
    onMouseDown: (e: React.MouseEvent, item: Project | Task, type: 'project' | 'task', handle: 'move' | 'resize-left' | 'resize-right') => void;
}> = ({ item, type, viewStartDate, color, onMouseDown }) => {
    const isProject = type === 'project';
    const startStr = isProject ? (item as Project).startDate : (item as Task).start;
    const endStr = isProject ? (item as Project).endDate : (item as Task).end;

    if (!startStr || !endStr) return null;

    const startDate = parseDateStr(startStr);
    const endDate = parseDateStr(endStr);

    const startOffset = differenceInDays(startDate, viewStartDate);
    const duration = differenceInDays(endDate, startDate) + 1;

    if (startOffset + duration <= 0 || startOffset >= DAYS_TO_SHOW) return null;
    
    const left = startOffset * DATE_CELL_WIDTH;
    const width = duration * DATE_CELL_WIDTH;

    const barHeight = isProject ? PROJECT_BAR_HEIGHT : TASK_BAR_HEIGHT;
    const barTop = isProject 
        ? ROW_TOP_MARGIN 
        : ROW_TOP_MARGIN + PROJECT_BAR_HEIGHT + BAR_V_MARGIN + ((item as PositionedTask).level * (TASK_BAR_HEIGHT + BAR_V_MARGIN));
    
    const bgColor = isProject ? `${color} opacity-80` : getTaskBarColor(color);
    const textColor = isProject ? 'text-white' : 'text-gray-800';

    return (
        <div
            className={`gantt-bar absolute z-10 rounded flex items-center justify-center font-sans text-xs font-medium whitespace-nowrap overflow-hidden shadow-md cursor-move pointer-events-auto ${bgColor} ${textColor}`}
            onMouseDown={(e) => onMouseDown(e, item, type, 'move')}
            style={{
                left: `${left}px`,
                width: `${width}px`,
                height: `${barHeight}px`,
                top: `${barTop}px`,
            }}
        >
            <div
                className="resize-handle absolute left-0 top-0 h-full w-2 cursor-ew-resize z-20"
                onMouseDown={(e) => { e.stopPropagation(); onMouseDown(e, item, type, 'resize-left'); }}
            />
            {!isProject && <span className="truncate px-2">{(item as Task).text}</span>}
            <div
                className="resize-handle absolute right-0 top-0 h-full w-2 cursor-ew-resize z-20"
                onMouseDown={(e) => { e.stopPropagation(); onMouseDown(e, item, type, 'resize-right'); }}
            />
        </div>
    );
};

const AssignmentCell: React.FC<{
    assignments: Assignment[];
    projects: Project[];
    isSelected: boolean;
    isActive: boolean;
}> = React.memo(({ assignments, projects, isSelected, isActive }) => {
    let cellClasses = 'assignment-day-cell relative border-b border-r border-gray-300 p-0 cursor-pointer h-full';
    if (isActive) {
        cellClasses += ' bg-orange-100 ring-2 ring-orange-500 z-10';
    } else if (isSelected) {
        cellClasses += ' bg-blue-100 ring-2 ring-blue-500 z-10';
    }

    return (
        <div className={cellClasses}>
            <div className="flex flex-col h-full w-full">
                {assignments.map((assignment, index) => {
                    let content = '', color = 'bg-gray-400';
                    if (assignment.type === 'project') {
                        const project = projects.find(p => p.id === assignment.id);
                        if (project) {
                            content = project.name;
                            color = project.color;
                        }
                    } else {
                        content = assignment.value;
                        color = assignment.value === '休み' ? 'bg-gray-500' : 'bg-yellow-500';
                    }
                    return (
                        <div key={index} className={`assignment-block flex-grow flex items-center justify-center text-xs font-bold text-white overflow-hidden ${color}`}>
                            <span className="truncate px-1">{content}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
});

// App.tsx: 全体のエントリーポイント。
const App: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>(initialProjects);
    const [workers, setWorkers] = useState<Worker[]>(initialWorkers);
    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const [assignments, setAssignments] = useState<Assignments>(initialAssignments);
    const [weatherData, setWeatherData] = useState<WeatherData>({});
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [modalState, setModalState] = useState<{ type: 'assignment' | 'project' | 'worker' | 'ai' | null; data: any }>({ type: null, data: null });
    const [confirmation, setConfirmation] = useState<{ isOpen: boolean; message: string; onConfirm: () => void; } | null>(null);

    const [selection, setSelection] = useState<{ startKey: string | null, endKey: string | null }>({ startKey: null, endKey: null });
    const [isSelecting, setIsSelecting] = useState(false);
    const [clipboard, setClipboard] = useState<Assignment[] | null>(null);
    const [dragInfo, setDragInfo] = useState<{ item: Project | Task; type: 'project' | 'task'; handle: 'move' | 'resize-left' | 'resize-right'; startX: number; originalStart: Date; originalEnd: Date; } | null>(null);
    // ★修正: スクロール用の状態を追加
    const [scrollDrag, setScrollDrag] = useState<{ isDragging: boolean; startX: number; scrollLeftStart: number; } | null>(null);
    
    const gridRef = useRef<HTMLDivElement>(null);
    const dates = useMemo(() => Array.from({ length: DAYS_TO_SHOW }, (_, i) => addDays(viewStartDate, i)), []);
    const [holidays, setHolidays] = useState<HolidayData>({});

    const showNotification = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
    }, []);

    useEffect(() => {
        const fetchHolidays = async () => {
            try {
                const response = await fetch('https://holidays-jp.github.io/api/v1/date.json');
                if (!response.ok) throw new Error('祝日データの取得に失敗しました');
                const data: HolidayData = await response.json();
                setHolidays(data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchHolidays();
    }, []);
    
    useEffect(() => {
        const fetchWeather = async () => {
            if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
                console.warn('OpenWeatherMap APIキーが設定されていません。ダミーデータを表示します。');
                return;
            }
            try {
                const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=metric`;
                const response = await fetch(url);
                if (!response.ok) throw new Error('天気データの取得に失敗しました');
                const data = await response.json();
                
                const dailyData: { [key: string]: { temps: number[], pops: number[] } } = {};
                data.list.forEach((item: any) => {
                    const date = item.dt_txt.split(' ')[0];
                    if (!dailyData[date]) {
                        dailyData[date] = { temps: [], pops: [] };
                    }
                    dailyData[date].temps.push(item.main.temp_max);
                    dailyData[date].pops.push(item.pop);
                });

                const newWeatherData: WeatherData = {};
                Object.keys(dailyData).forEach(date => {
                    const maxTemp = Math.round(Math.max(...dailyData[date].temps));
                    const maxPop = Math.round(Math.max(...dailyData[date].pops) * 100);
                    newWeatherData[date] = { temp: maxTemp, precip: maxPop };
                });
                
                setWeatherData(newWeatherData);
            } catch (error) {
                console.error(error);
                showNotification('天気データの取得に失敗しました。', 'error');
            }
        };
        fetchWeather();
    }, [showNotification]);


    const selectedKeys = useMemo(() => {
        const keys = new Set<string>();
        if (!selection.startKey || !selection.endKey) return keys;
        const [, startWorkerIdStr, startYear, startMonth, startDay] = selection.startKey.split(/w|-/);
        const [, endWorkerIdStr, endYear, endMonth, endDay] = selection.endKey.split(/w|-/);
        const startWorkerIndex = workers.findIndex(w => w.id === parseInt(startWorkerIdStr));
        const endWorkerIndex = workers.findIndex(w => w.id === parseInt(endWorkerIdStr));
        const startDateIndex = dates.findIndex(d => formatDateStr(d) === `${startYear}-${startMonth}-${startDay}`);
        const endDateIndex = dates.findIndex(d => formatDateStr(d) === `${endYear}-${endMonth}-${endDay}`);
        if (startWorkerIndex === -1 || endWorkerIndex === -1 || startDateIndex === -1 || endDateIndex === -1) return keys;
        const minWorkerIndex = Math.min(startWorkerIndex, endWorkerIndex);
        const maxWorkerIndex = Math.max(startWorkerIndex, endWorkerIndex);
        const minDateIndex = Math.min(startDateIndex, endDateIndex);
        const maxDateIndex = Math.max(startDateIndex, endDateIndex);
        for (let wIdx = minWorkerIndex; wIdx <= maxWorkerIndex; wIdx++) {
            for (let dIdx = minDateIndex; dIdx <= maxDateIndex; dIdx++) {
                const workerId = workers[wIdx].id;
                const dateStr = formatDateStr(dates[dIdx]);
                keys.add(`w${workerId}-${dateStr}`);
            }
        }
        return keys;
    }, [selection, workers, dates]);

    const positionedTasksByProject = useMemo(() => {
        const byProject: { [projectId: number]: { positionedTasks: PositionedTask[], maxLevel: number } } = {};

        for (const project of projects) {
            const projectTasks = tasks.filter(t => t.projectId === project.id).sort((a, b) => differenceInDays(parseDateStr(a.start), parseDateStr(b.start)));
            const levels: { start: Date; end: Date }[][] = [];
            const positionedTasks: PositionedTask[] = [];

            projectTasks.forEach(task => {
                const taskStart = parseDateStr(task.start);
                const taskEnd = parseDateStr(task.end);
                let level = 0;
                let placed = false;

                while (!placed) {
                    if (!levels[level]) {
                        levels[level] = [];
                    }
                    
                    const overlaps = levels[level].some(placedTask => 
                        taskStart <= placedTask.end && taskEnd >= placedTask.start
                    );

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
    }, [tasks, projects]);
    
    
    const handleGanttMouseDown = useCallback((e: React.MouseEvent, item: Project | Task, type: 'project' | 'task', handle: 'move' | 'resize-left' | 'resize-right') => {
        e.preventDefault();
        e.stopPropagation();
        const startStr = type === 'project' ? (item as Project).startDate : (item as Task).start;
        const endStr = type === 'project' ? (item as Project).endDate : (item as Task).end;
        if (!startStr || !endStr) return;
        document.body.style.cursor = handle === 'move' ? 'grabbing' : 'ew-resize';
        setDragInfo({ item, type, handle, startX: e.pageX, originalStart: parseDateStr(startStr), originalEnd: parseDateStr(endStr) });
    }, []);
    
    const handleCellInteraction = useCallback((key: string, type: 'down' | 'move' | 'up') => {
        if (type === 'down') {
            setIsSelecting(true);
            setSelection({ startKey: key, endKey: key });
        } else if (type === 'move' && isSelecting) {
            setSelection(prev => ({ ...prev, endKey: key }));
        } else if (type === 'up') {
            if (isSelecting && selection.startKey === selection.endKey) {
                setModalState({ type: 'assignment', data: { cellKey: key, selectedKeys } });
            }
            setIsSelecting(false);
        }
    }, [isSelecting, selection.startKey, selection.endKey, selectedKeys]);
    
    // ★修正: グリッドの空白エリアでのマウスダウンイベント
    const handleGridMouseDown = (e: React.MouseEvent) => {
        if (
            (e.target as HTMLElement).closest('.gantt-bar') ||
            (e.target as HTMLElement).closest('.assignment-cell-wrapper') ||
            (e.target as HTMLElement).closest('.sticky')
        ) {
            return;
        }

        e.preventDefault();
        if (gridRef.current) {
            setScrollDrag({
                isDragging: true,
                startX: e.pageX - gridRef.current.offsetLeft,
                scrollLeftStart: gridRef.current.scrollLeft,
            });
            gridRef.current.style.cursor = 'grabbing';
        }
    };
    
    useEffect(() => {
        const gridElement = gridRef.current;
        const handleMouseMove = (e: MouseEvent) => {
            // Gantt bar drag logic
            if (dragInfo) {
                const dx = e.pageX - dragInfo.startX;
                const dayOffset = Math.round(dx / DATE_CELL_WIDTH);
                let newStart: Date, newEnd: Date;
                if (dragInfo.handle === 'move') {
                    const duration = differenceInDays(dragInfo.originalEnd, dragInfo.originalStart);
                    newStart = addDays(dragInfo.originalStart, dayOffset);
                    newEnd = addDays(newStart, duration);
                } else if (dragInfo.handle === 'resize-left') {
                    newStart = addDays(dragInfo.originalStart, dayOffset);
                    newEnd = dragInfo.originalEnd;
                    if (newStart > newEnd) newStart = newEnd;
                } else {
                    newStart = dragInfo.originalStart;
                    newEnd = addDays(dragInfo.originalEnd, dayOffset);
                    if (newEnd < newStart) newEnd = newStart;
                }
                const updateState = (items: any[], setter: Function) => {
                    setter(items.map(p => p.id === dragInfo.item.id ? { ...p, startDate: formatDateStr(newStart), endDate: formatDateStr(newEnd), start: formatDateStr(newStart), end: formatDateStr(newEnd) } : p));
                };
                if (dragInfo.type === 'project') updateState(projects, setProjects);
                else updateState(tasks, setTasks);
            }

            // ★修正: Scroll drag logic
            if (scrollDrag?.isDragging && gridElement) {
                e.preventDefault();
                const x = e.pageX - gridElement.offsetLeft;
                const walk = x - scrollDrag.startX;
                gridElement.scrollLeft = scrollDrag.scrollLeftStart - walk;
            }
        };

        const handleMouseUpGlobal = () => {
            if (isSelecting) setIsSelecting(false);
            if (dragInfo) {
                setDragInfo(null);
                document.body.style.cursor = 'auto';
            }
            if (scrollDrag?.isDragging && gridElement) {
                setScrollDrag(null);
                gridElement.style.cursor = 'auto';
            }
        };
        
        const handleKeyDown = (e: KeyboardEvent) => {
            const isCtrlOrCmd = e.ctrlKey || e.metaKey;
            if (isCtrlOrCmd && e.key.toLowerCase() === 'c') {
                e.preventDefault();
                if (selectedKeys.size > 0 && selection.startKey) {
                    setClipboard(assignments[selection.startKey] || []);
                    showNotification('予定をコピーしました');
                }
            }
            if (isCtrlOrCmd && e.key.toLowerCase() === 'v') {
                e.preventDefault();
                if (clipboard !== null && selectedKeys.size > 0) {
                    setAssignments(prev => {
                        const newAssignments = { ...prev };
                        selectedKeys.forEach(key => { newAssignments[key] = [...clipboard] });
                        return newAssignments;
                    });
                    showNotification(`${selectedKeys.size}件に貼り付けました`);
                }
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUpGlobal);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUpGlobal);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [dragInfo, isSelecting, projects, tasks, assignments, selectedKeys, selection.startKey, clipboard, showNotification, scrollDrag]);

    const handleSaveAssignment = (key: string, newAssignments: Assignment[]) => {
      setAssignments(prev => ({ ...prev, [key]: newAssignments }));
    };

    const handleSaveTask = (taskToSave: Task) => {
        if (taskToSave.id) {
            setTasks(tasks.map(t => t.id === taskToSave.id ? taskToSave : t));
        } else {
            const newId = Math.max(0, ...tasks.map(t => t.id)) + 1;
            setTasks([...tasks, { ...taskToSave, id: newId }]);
        }
    };

    const handleDeleteTask = (taskId: number) => {
        setTasks(tasks.filter(t => t.id !== taskId));
    };

    const handleRequestConfirmation = (message: string, onConfirm: () => void) => {
        setConfirmation({ isOpen: true, message, onConfirm });
    };

    const closeConfirmation = () => {
        setConfirmation(null);
    };
    
    useEffect(() => {
        if (gridRef.current) {
            const todayIndex = differenceInDays(today, viewStartDate);
            if (todayIndex >= 0) {
                gridRef.current.scrollLeft = (todayIndex * DATE_CELL_WIDTH) - (gridRef.current.clientWidth / 2) + STICKY_COL_WIDTH;
            }
        }
    }, [viewStartDate]);

    return (
        <div className="bg-gray-100 text-gray-800 p-4 sm:p-6 h-screen flex flex-col font-sans">
            <header className="mb-4 flex-shrink-0">
                <h1 className="text-2xl font-bold">工事・作業員管理ダッシュボード</h1>
                <p className="text-sm text-gray-600">Vite + React + TypeScript + Tailwind CSS</p>
            </header>
            
            <div ref={gridRef} className="flex-grow overflow-auto bg-white shadow-lg rounded-lg border border-gray-200" onMouseDown={handleGridMouseDown}>
                <div className="grid" style={{ gridTemplateColumns: `${STICKY_COL_WIDTH}px repeat(${DAYS_TO_SHOW}, ${DATE_CELL_WIDTH}px)` }}>
                    
                    <div className="sticky top-0 left-0 z-40 bg-gray-200 border-b border-r border-gray-300 p-2 flex items-center justify-between" style={{ height: HEADER_HEIGHT }}>
                        <span className="font-bold">現場名</span>
                        <button onClick={() => setModalState({ type: 'project', data: { id: null } })} className="flex items-center justify-center w-6 h-6 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-transform transform hover:scale-110" title="新規現場を追加"><Plus size={16} /></button>
                    </div>
                    {dates.map(date => {
                        const dateStr = formatDateStr(date);
                        const holidayName = holidays[dateStr];
                        const weather = weatherData[dateStr];
                        const day = date.getDay();
                        const isToday = format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
                        
                        let dayColor = day === 0 || holidayName ? 'text-red-500' : day === 6 ? 'text-blue-500' : '';
                        let bgColor = isToday ? 'bg-blue-100' : 'bg-gray-50';
                        if (holidayName) {
                            bgColor = 'bg-red-100';
                        }
                        
                        return (
                            <div key={dateStr} onClick={() => setModalState({ type: 'ai', data: { type: 'risk', date: dateStr } })} className={`sticky top-0 z-30 flex flex-col justify-center items-center border-b border-r border-gray-300 text-center p-1 cursor-pointer hover:bg-gray-200 ${bgColor}`} style={{ height: HEADER_HEIGHT }}>
                                <span className={`font-semibold ${dayColor}`}>{format(date, 'M/d')} ({format(date, 'E', { locale: ja })})</span>
                                <div className="text-xs font-normal mt-1 flex-grow flex flex-col justify-center">
                                    {holidayName ? (
                                        <span className="text-red-700 font-medium truncate" title={holidayName}>{holidayName}</span>
                                    ) : (
                                        weather ? (
                                        <div>
                                            <span className="text-blue-600">💧{weather.precip}%</span>
                                            <span className="text-red-600 ml-2">🌡️{weather.temp}°C</span>
                                        </div>
                                        ) : (
                                        <div className="text-gray-400">--</div>
                                        )
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {projects.map(project => {
                        const { positionedTasks, maxLevel } = positionedTasksByProject[project.id] || { positionedTasks: [], maxLevel: 0 };
                        const tasksHeight = maxLevel > 0 ? BAR_V_MARGIN + (maxLevel * (TASK_BAR_HEIGHT + BAR_V_MARGIN)) - BAR_V_MARGIN : 0;
                        const projectRowHeight = ROW_TOP_MARGIN + PROJECT_BAR_HEIGHT + tasksHeight + ROW_BOTTOM_MARGIN;

                        return (
                        <React.Fragment key={project.id}>
                            <div style={{height: `${projectRowHeight}px`}} className={`sticky left-0 z-20 bg-white border-b border-r border-gray-300 p-2 flex items-start pt-2 cursor-pointer border-l-4 ${project.borderColor}`} onClick={() => setModalState({ type: 'project', data: { id: project.id } })}>
                                <div className="overflow-hidden">
                                    <p className="font-bold truncate" title={project.name}>{project.name}</p>
                                    <p className="text-xs text-gray-500">{project.startDate && project.endDate ? `${project.startDate} ~ ${project.endDate}` : '工期未設定'}</p>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); setModalState({ type: 'ai', data: { type: 'task', project } }); }} className="p-1 rounded-full hover:bg-gray-200 flex-shrink-0" title="AIでタスク提案"><BrainCircuit size={18} className="text-purple-600" /></button>
                            </div>
                            <div className="col-start-2 col-span-full relative border-b border-gray-300" style={{height: `${projectRowHeight}px`}}>
                                <GanttBar item={project} type="project" viewStartDate={viewStartDate} onMouseDown={handleGanttMouseDown} color={project.color} />
                                {positionedTasks.map(task => (
                                    <GanttBar key={task.id} item={task} type="task" viewStartDate={viewStartDate} onMouseDown={handleGanttMouseDown} color={project.color} />
                                ))}
                            </div>
                        </React.Fragment>
                    )})}
                    
                    <div className="sticky left-0 z-20 bg-gray-200 border-b border-r border-t border-gray-300 p-2 flex items-center justify-between" style={{ top: HEADER_HEIGHT, height: WORKER_HEADER_HEIGHT }}>
                        <span className="font-bold">作業員</span>
                        <button onClick={() => setModalState({ type: 'worker', data: { id: null } })} className="flex items-center justify-center w-6 h-6 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-transform transform hover:scale-110" title="新規作業員を追加"><Plus size={16} /></button>
                    </div>
                    <div className="sticky col-start-2 col-span-full bg-gray-50 border-b border-t border-gray-300" style={{ top: HEADER_HEIGHT, height: WORKER_HEADER_HEIGHT }}></div>

                    {workers.map(worker => (
                        <React.Fragment key={worker.id}>
                            <div style={{height: `${WORKER_ROW_HEIGHT}px`}} className="sticky left-0 z-20 bg-white border-b border-r border-gray-300 p-2 font-semibold flex items-center justify-between cursor-pointer" onClick={() => setModalState({ type: 'worker', data: { id: worker.id } })}>
                                <span>{worker.name}</span>
                                <button onClick={(e) => { e.stopPropagation(); setModalState({ type: 'ai', data: { type: 'memo', worker } }); }} className="p-1 rounded-full hover:bg-gray-200 flex-shrink-0" title="AIで申し送りメモ作成"><BrainCircuit size={18} className="text-blue-600" /></button>
                            </div>
                            {dates.map(date => {
                                const cellKey = `w${worker.id}-${formatDateStr(date)}`;
                                return (
                                    <div key={cellKey} className="assignment-cell-wrapper" onMouseDown={() => handleCellInteraction(cellKey, 'down')} onMouseMove={() => handleCellInteraction(cellKey, 'move')} onMouseUp={() => handleCellInteraction(cellKey, 'up')} >
                                        <AssignmentCell assignments={assignments[cellKey] || []} projects={projects} isSelected={selectedKeys.has(cellKey)} isActive={selection.startKey === cellKey} />
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            <AssignmentModal isOpen={modalState.type === 'assignment'} onClose={() => setModalState({ type: null, data: null })} cellKey={modalState.data?.cellKey} selectedKeys={modalState.data?.selectedKeys || new Set()} assignments={assignments} projects={projects} onSave={handleSaveAssignment} clipboard={clipboard} onCopy={(data) => { setClipboard(data); showNotification('コピーしました'); }} onPaste={(targetKeys) => { if (clipboard !== null) { setAssignments(prev => { const newAssignments = { ...prev }; targetKeys.forEach(key => { newAssignments[key] = [...clipboard] }); return newAssignments; }); showNotification(`${targetKeys.size}件に貼り付けました`); } }} />
            <ProjectEditModal
                isOpen={modalState.type === 'project'}
                onClose={() => setModalState({ type: null, data: null })}
                project={projects.find(p => p.id === modalState.data?.id) || null}
                tasks={tasks.filter(t => t.projectId === modalState.data?.id)}
                onSave={(project) => { if (project.id) { setProjects(projects.map(p => p.id === project.id ? project : p)); } else { const newId = Math.max(0, ...projects.map(p => p.id)) + 1; const colors = ['bg-red-500', 'bg-yellow-500', 'bg-green-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500']; const randomColor = colors[newId % colors.length]; const newProject = { ...project, id: newId, color: randomColor, borderColor: randomColor.replace('bg-', 'border-') }; setProjects([...projects, newProject]); } showNotification('現場情報を保存しました'); }}
                onDelete={(id) => handleRequestConfirmation('この現場を削除しますか？関連するタスクもすべて削除されます。', () => { setProjects(projects.filter(p => p.id !== id)); setTasks(tasks.filter(t => t.projectId !== id)); setAssignments(prev => { const newAssignments = { ...prev }; Object.keys(newAssignments).forEach(key => { newAssignments[key] = newAssignments[key].filter(a => a.type !== 'project' || a.id !== id); if (newAssignments[key].length === 0) delete newAssignments[key]; }); return newAssignments; }); showNotification('現場を削除しました', 'error'); })}
                onSaveTask={handleSaveTask}
                onDeleteTask={(id) => handleRequestConfirmation('この項目を削除しますか？', () => handleDeleteTask(id))}
            />
            <WorkerEditModal
                isOpen={modalState.type === 'worker'}
                onClose={() => setModalState({ type: null, data: null })}
                worker={workers.find(w => w.id === modalState.data?.id) || null}
                onSave={(worker) => { if (worker.id) { setWorkers(workers.map(w => w.id === worker.id ? worker : w)); } else { const newId = Math.max(0, ...workers.map(w => w.id)) + 1; setWorkers([...workers, { ...worker, id: newId }]); } showNotification('作業員情報を保存しました'); }}
                onDelete={(id) => handleRequestConfirmation('この作業員を削除しますか？', () => { setWorkers(workers.filter(w => w.id !== id)); setAssignments(prev => { const newAssignments = { ...prev }; Object.keys(newAssignments).forEach(key => { if (key.startsWith(`w${id}-`)) delete newAssignments[key]; }); return newAssignments; }); showNotification('作業員を削除しました', 'error'); })}
            />
            <AiModal isOpen={modalState.type === 'ai'} onClose={() => setModalState({ type: null, data: null })} data={modalState.data} weatherData={weatherData} assignments={assignments} workers={workers} projects={projects} tasks={tasks} onAddTask={(task) => { setTasks(prev => [...prev, task]); showNotification(`タスク「${task.text}」を追加しました`); }} />
            <GlobalNotification notification={notification} onClear={() => setNotification(null)} />
            <ConfirmationModal confirmation={confirmation} onCancel={closeConfirmation} />
        </div>
    );
};

// --- Modal Components ---
const ModalWrapper: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode; title: string, size?: 'md' | 'lg' | 'xl' }> = ({ isOpen, onClose, children, title, size = 'md' }) => {
    if (!isOpen) return null;
    const sizeClasses = {
        md: 'md:w-1/3 max-w-lg',
        lg: 'md:w-1/2 max-w-2xl',
        xl: 'md:w-2/3 max-w-4xl',
    };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in" onMouseDown={onClose}>
            <div className={`bg-white rounded-lg shadow-xl w-11/12 ${sizeClasses[size]} animate-scale-in flex flex-col`} onMouseDown={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 p-6 border-b">
                    <h3 className="text-xl font-bold">{title}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><X size={20} /></button>
                </div>
                <div className="p-6 overflow-y-auto">{children}</div>
            </div>
        </div>
    );
};

const AssignmentModal: React.FC<{
    isOpen: boolean; onClose: () => void; cellKey: string | null; selectedKeys: Set<string>;
    assignments: Assignments; projects: Project[]; onSave: (key: string, assignments: Assignment[]) => void;
    clipboard: Assignment[] | null; onCopy: (data: Assignment[]) => void; onPaste: (targetKeys: Set<string>) => void;
}> = ({ isOpen, onClose, cellKey, selectedKeys, assignments, projects, onSave, clipboard, onCopy, onPaste }) => {
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

const TaskRow: React.FC<{
    task: Task;
    onSave: (task: Task) => void;
    onDelete: (id: number) => void;
}> = ({ task, onSave, onDelete }) => {
    const [isEditing, setIsEditing] = useState(!task.id);
    const [text, setText] = useState(task.text);
    const [start, setStart] = useState(task.start);
    const [end, setEnd] = useState(task.end);

    const handleSave = () => {
        if (!text || !start || !end) {
            alert('すべての項目を入力してください。');
            return;
        }
        if (start > end) {
            alert('終了日は開始日以降に設定してください。');
            return;
        }
        onSave({ ...task, text, start, end });
        setIsEditing(false);
    };

    const handleCancel = () => {
        if (!task.id) {
            onDelete(0);
        } else {
            setText(task.text);
            setStart(task.start);
            setEnd(task.end);
            setIsEditing(false);
        }
    };

    if (isEditing) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-2 items-center p-2 bg-blue-50 rounded-lg">
                <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="項目名" className="input text-sm" />
                <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="input text-sm" />
                <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="input text-sm" />
                <div className="flex items-center space-x-2">
                    <button onClick={handleSave} className="p-2 text-green-600 hover:bg-green-100 rounded-full"><Save size={18} /></button>
                    <button onClick={handleCancel} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full"><XCircle size={18} /></button>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2 items-center p-2 hover:bg-gray-50 rounded-lg">
            <span className="font-medium">{task.text}</span>
            <span className="text-sm text-gray-600">{task.start} ~ {task.end}</span>
            <div className="flex items-center space-x-2">
                <button onClick={() => setIsEditing(true)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"><Pencil size={16} /></button>
                <button onClick={() => onDelete(task.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-full"><Trash2 size={16} /></button>
            </div>
        </div>
    );
};


const ProjectEditModal: React.FC<{
    isOpen: boolean; onClose: () => void; project: Project | null;
    tasks: Task[];
    onSave: (project: Project) => void; onDelete: (id: number) => void;
    onSaveTask: (task: Task) => void; onDeleteTask: (id: number) => void;
}> = ({ isOpen, onClose, project, tasks, onSave, onDelete, onSaveTask, onDeleteTask }) => {
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [localTasks, setLocalTasks] = useState<Task[]>([]);

    useEffect(() => {
        if (project) {
            setName(project.name);
            setStartDate(project.startDate || '');
            setEndDate(project.endDate || '');
            setLocalTasks(tasks);
        } else {
             setName('');
            setStartDate('');
            setEndDate('');
            setLocalTasks([]);
        }
    }, [project, tasks, isOpen]);

    const handleProjectSave = () => {
        if (!name) { alert('現場名を入力してください。'); return; }
        if (startDate && endDate && startDate > endDate) { alert('終了日は開始日以降に設定してください。'); return; }
        onSave({ ...project, id: project?.id || 0, name, startDate: startDate || null, endDate: endDate || null, color: project?.color || '', borderColor: project?.borderColor || '' });
        onClose();
    };
    
    const handleAddNewTaskRow = () => {
        const newTask: Task = { id: 0, projectId: project!.id, text: '', start: '', end: '' };
        setLocalTasks([...localTasks, newTask]);
    };

    const handleTaskSave = (task: Task) => {
        onSaveTask(task);
        if(!task.id) {
             setLocalTasks(prev => prev.filter(t => t.id !== 0));
        }
    };
    
    const handleTaskDelete = (id: number) => {
        if (id === 0) {
            setLocalTasks(prev => prev.filter(t => t.id !== 0));
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
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input flex-1" title="終了日"/>
                        </div>
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


const WorkerEditModal: React.FC<{
    isOpen: boolean; onClose: () => void; worker: Worker | null;
    onSave: (worker: Worker) => void; onDelete: (id: number) => void;
}> = ({ isOpen, onClose, worker, onSave, onDelete }) => {
    const [name, setName] = useState('');
    useEffect(() => { setName(worker?.name || ''); }, [worker]);
    const handleSave = () => {
        if (!name) { alert('作業員名を入力してください。'); return; }
        onSave({ ...worker, id: worker?.id || 0, name });
        onClose();
    };
    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose} title={worker ? '作業員情報の編集' : '新規作業員の追加'}>
            <input type="text" placeholder="作業員名" value={name} onChange={e => setName(e.target.value)} className="input" />
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

const AiModal: React.FC<{
    isOpen: boolean; onClose: () => void; data: any; weatherData: WeatherData;
    assignments: Assignments; workers: Worker[]; projects: Project[]; tasks: Task[];
    onAddTask: (task: Task) => void;
}> = ({ isOpen, onClose, data, weatherData, assignments, workers, projects, tasks, onAddTask }) => {
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
                            scheduleText += dayAssignments.map(a => a.type === 'project' ? projects.find(p=>p.id===a.id)?.name || '不明' : a.value).join(', ') + '\n';
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
                        dayAssignments.forEach(a => {
                            if (a.type === 'project') {
                                const project = projects.find(p => p.id === a.id);
                                if(project) dailyTasks.add(project.name);
                            }
                        });
                    });
                    const result = await aiApi.analyzeRisk(data.date, `降水 ${weather.precip}% / 気温 ${weather.temp}°C`, Array.from(dailyTasks).join('、'));
                    setContent(result);
                    setSubtitle('AIによるリスク分析結果です。');
                }
            } catch (error) {
                console.error("AI API call failed", error);
                setContent('<p class="text-red-500">AIの応答取得中にエラーが発生しました。</p>');
            } finally { setIsLoading(false); }
        };
        processRequest();
    }, [isOpen, data, weatherData, assignments, workers, projects]);
    
    const handleAddTask = (taskName: string, duration: number) => {
        if (!data?.project) return;
        const newTaskId = Math.max(0, ...tasks.map(t => t.id)) + 1;
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
                    {data.type === 'task' && Array.isArray(content) && content.map((t, i) => (
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

const ConfirmationModal: React.FC<{
    confirmation: { isOpen: boolean; message: string; onConfirm: () => void; } | null;
    onCancel: () => void;
}> = ({ confirmation, onCancel }) => {
    if (!confirmation?.isOpen) return null;

    const handleConfirm = () => {
        confirmation.onConfirm();
        onCancel();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] animate-fade-in">
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


export default App;
