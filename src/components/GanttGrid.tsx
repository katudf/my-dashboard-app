// c/Users/katuy/OneDrive/my-dashboard-app/src/components/GanttGrid.tsx
import React, { useEffect } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { GanttBar } from './GanttBar';
import { AssignmentCell } from './AssignmentCell';
import type { Project, Task, Worker, Assignment, Assignments, PositionedTask } from '../lib/types';
import {
  STICKY_COL_WIDTH,
  DATE_CELL_WIDTH,
  HEADER_HEIGHT,
  WORKER_HEADER_HEIGHT,
  WORKER_ROW_HEIGHT,
  ROW_TOP_MARGIN,
  ROW_BOTTOM_MARGIN,
  PROJECT_BAR_HEIGHT,
  TASK_BAR_HEIGHT,
  BAR_V_MARGIN,
} from '../lib/constants';

interface GanttGridProps {
  projects: Project[];
  tasks: Task[];
  workers: Worker[];
  assignments: Assignments;
  dates: Date[];
  holidays: { [date: string]: string };
  weatherData: { [date: string]: { precip: number; temp: number } };
  positionedTasksByProject: { [projectId: string]: { positionedTasks: PositionedTask[]; maxLevel: number } };
  selection: { startKey: string | null; endKey: string | null };
  selectedKeys: Set<string>;
  onCellInteraction: (key: string, type: 'down' | 'move' | 'up') => void;
  // onProjectClick: (projectId: string) => void;
  onWorkerClick: (workerId: string) => void;
  onGanttMouseDown: (e: React.MouseEvent, item: Project | Task, type: 'project' | 'task', handle: 'move' | 'resize-left' | 'resize-right') => void;
  onProjectEdit?: (projectId: string) => void;
  scrollToProjectStart?: (startDate: Date) => void;
  scrollToToday?: () => void;
  gridRef?: React.RefObject<HTMLDivElement>;
}

export const GanttGrid: React.FC<GanttGridProps> = ({
  projects, tasks, workers, assignments, dates, holidays, weatherData,
  positionedTasksByProject, selection, selectedKeys, 
  onCellInteraction, onWorkerClick, onGanttMouseDown, onProjectEdit, scrollToProjectStart,
  scrollToToday,
  gridRef,
}) => {
  // ナビゲーションで日付範囲が変わったときに今日が表示範囲内なら自動でジャンプ
  useEffect(() => {
    if (!gridRef || !gridRef.current) return;
    const todayIdx = dates.findIndex(d => format(d, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'));
    if (todayIdx >= 0) {
      gridRef.current.scrollLeft = (todayIdx * DATE_CELL_WIDTH) - (gridRef.current.clientWidth / 2) + STICKY_COL_WIDTH;
    }
  }, [dates, gridRef]);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* ヘッダーラッパー: 横スクロール時もstickyを維持 */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="grid" style={{ gridTemplateColumns: `${STICKY_COL_WIDTH}px repeat(${dates.length}, ${DATE_CELL_WIDTH}px)` }}>
          <div className="sticky top-0 left-0 z-50 bg-gray-200 border-b border-r border-gray-300 p-2 flex items-center justify-between" style={{ height: HEADER_HEIGHT }}>
            <span className="font-bold">現場名</span>
            <button
              className="ml-2 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition"
              onClick={() => {
                if (!gridRef || !gridRef.current) return;
                // 今日が範囲外なら今日を含む範囲にナビゲーション
                const today = new Date();
                const todayIdx = dates.findIndex(d => format(d, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'));
                if (todayIdx === -1) {
                  // App.tsxのscrollToTodayを呼ぶ（props経由）
                  if (scrollToToday) scrollToToday();
                } else {
                  gridRef.current.scrollLeft = (todayIdx * DATE_CELL_WIDTH) - (gridRef.current.clientWidth / 2) + STICKY_COL_WIDTH;
                }
              }}
            >今日へ</button>
          </div>
          {dates.map(date => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const holidayName = holidays[dateStr];
            const weather = weatherData[dateStr];
            const day = date.getDay();
            const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
            let dayColor = day === 0 || holidayName ? 'text-red-500' : day === 6 ? 'text-blue-500' : '';
            let bgColor = isToday ? 'bg-blue-100' : 'bg-gray-50';
            if (holidayName) bgColor = 'bg-red-100';
            return (
              <div key={dateStr} className={`sticky top-0 z-30 flex flex-col justify-center items-center border-b border-r border-gray-300 text-center p-1 ${bgColor}`} style={{ height: HEADER_HEIGHT }}>
                <span className={`font-semibold ${dayColor}`}>
                  {format(date, 'M/d')}（{format(date, 'EEEE', { locale: ja }).slice(0,1)}）
                </span>
                <div className="text-xs font-normal mt-1 flex-grow flex flex-col justify-center">
                  {holidayName ? (
                    <span className="text-red-700 font-medium truncate" title={holidayName}>{holidayName}</span>
                  ) : weather ? (
                    <div>
                      <span className="text-blue-600">💧{weather.precip}%</span>
                      <span className="text-red-600 ml-2">🌡️{weather.temp}°C</span>
                    </div>
                  ) : (
                    <div className="text-gray-400">--</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* 本体グリッド */}
      <div className="grid" style={{ gridTemplateColumns: `${STICKY_COL_WIDTH}px repeat(${dates.length}, ${DATE_CELL_WIDTH}px)`, position: 'relative' }}>
        {/* プロジェクト行 */}
        {projects.map(project => {
          const { positionedTasks, maxLevel } = positionedTasksByProject[project.id] || { positionedTasks: [], maxLevel: 0 };
          const tasksHeight = maxLevel > 0 ? BAR_V_MARGIN + (maxLevel * (TASK_BAR_HEIGHT + BAR_V_MARGIN)) - BAR_V_MARGIN : 0;
          const projectRowHeight = ROW_TOP_MARGIN + PROJECT_BAR_HEIGHT + tasksHeight + ROW_BOTTOM_MARGIN;
          return (
            <React.Fragment key={project.id}>
              <div
                style={{ height: `${projectRowHeight}px`, left: 0, zIndex: 40 }}
                className={`sticky left-0 bg-white border-b border-r border-gray-300 p-2 flex items-start pt-2 cursor-pointer border-l-4 ${project.borderColor}`} 
                onClick={e => {
                  // 工期開始日ジャンプ処理
                  if (typeof scrollToProjectStart === 'function' && project.startDate) {
                    const date = new Date(project.startDate);
                    scrollToProjectStart(date);
                  }
                }}
                onContextMenu={e => {
                  e.preventDefault();
                  if (typeof onProjectEdit === 'function') onProjectEdit(project.id);
                }}
              >
                <div className="overflow-hidden">
                  <p className="font-bold truncate" title={project.name}>{project.name}</p>
                  <p className="text-xs text-gray-500">{project.startDate && project.endDate ? `${project.startDate} ~ ${project.endDate}` : '工期未設定'}</p>
                </div>
              </div>
              <div className="col-start-2 col-span-full relative border-b border-gray-300" style={{ height: `${projectRowHeight}px` }}>
                <GanttBar item={project} type="project" viewStartDate={dates[0]} onMouseDown={onGanttMouseDown} color={project.color} />
                {positionedTasks.map(task => (
                  <GanttBar key={task.id} item={task} type="task" viewStartDate={dates[0]} onMouseDown={onGanttMouseDown} color={project.color} />
                ))}
              </div>
            </React.Fragment>
          );
        })}

        {/* 作業員ヘッダー */}
        <div className="sticky left-0 z-40 bg-gray-200 border-b border-r border-t border-gray-300 p-2 flex items-center" style={{ top: HEADER_HEIGHT, height: WORKER_HEADER_HEIGHT }}>
          <span className="font-bold">作業員</span>
        </div>
        <div className="sticky col-start-2 col-span-full bg-gray-50 border-b border-t border-gray-300" style={{ top: HEADER_HEIGHT, height: WORKER_HEADER_HEIGHT }}></div>

        {/* 作業員行 */}
        {workers.map(worker => (
          <React.Fragment key={worker.id}>
            <div style={{ height: `${WORKER_ROW_HEIGHT}px`, left: 0, zIndex: 30 }} className="sticky left-0 bg-white border-b border-r border-gray-300 p-2 font-semibold flex items-center cursor-pointer"
              onClick={() => onWorkerClick(worker.id)}>
              <span>{worker.name}</span>
            </div>
            {dates.map(date => {
              const cellKey = `w${worker.id}-${format(date, 'yyyy-MM-dd')}`;
              return (
                <div key={cellKey} className="assignment-cell-wrapper"
                  onMouseDown={() => onCellInteraction(cellKey, 'down')}
                  onMouseMove={() => onCellInteraction(cellKey, 'move')}
                  onMouseUp={() => onCellInteraction(cellKey, 'up')}
                >
                  <AssignmentCell
                    assignments={assignments[cellKey] || []}
                    projects={projects}
                    isSelected={selectedKeys.has(cellKey)}
                    isActive={selection.startKey === cellKey}
                  />
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
