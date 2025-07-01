// c/Users/katuy/OneDrive/my-dashboard-app/src/components/GanttGrid.tsx
import React, { useEffect } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { format } from 'date-fns';
import { DateHeader } from './DateHeader';
import { ProjectRow } from './ProjectRow';
import { WorkerRow } from './WorkerRow';
import type { Project, Task, Worker, Assignments, PositionedTask } from '../lib/types'; // AssignmentはGanttGridでは直接使用しない
import {
  STICKY_COL_WIDTH,
  DATE_CELL_WIDTH,
  HEADER_HEIGHT,
  WORKER_HEADER_HEIGHT,
} from '../lib/constants';

interface GanttGridProps {
  projects: Project[];
  workers: Worker[];
  assignments: Assignments;
  dates: Date[];
  holidays: { [date: string]: string };
  weatherData: { [date: string]: { precip: number; temp: number } };
  positionedTasksByProject: { [projectId: string]: { positionedTasks: PositionedTask[]; maxLevel: number } };
  selection: { startKey: string | null; endKey: string | null };
  selectedKeys: Set<string>;
  onCellInteraction: (key: string, type: 'down' | 'move' | 'up') => void;
  onWorkerClick: (workerId: string) => void;
  onGanttMouseDown: (e: React.MouseEvent, item: Project | Task, type: 'project' | 'task', handle: 'move' | 'resize-left' | 'resize-right') => void;
  onProjectEdit?: (projectId: string) => void;
  onAssignmentEdit: (cellKey: string) => void;
  scrollToProjectStart?: (startDate: Date) => void;
  gridRef?: React.RefObject<HTMLDivElement>;
}

export const GanttGrid: React.FC<GanttGridProps> = ({
  projects, workers, assignments, dates, holidays, weatherData, // tasksはGanttGridでは直接使用しない
  positionedTasksByProject, selection, selectedKeys, 
  onCellInteraction, onWorkerClick, onGanttMouseDown, onProjectEdit, onAssignmentEdit, scrollToProjectStart,
  gridRef, // scrollToToday prop was removed in a previous step
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
      <DateHeader dates={dates} holidays={holidays} weatherData={weatherData} />
      
      {/* 本体グリッド */}
      {/* メイングリッドをフレックスコンテナに変更し、各行が自身のグリッドを持つようにする */}
      <div className="gantt-rows-container flex flex-col" style={{ position: 'relative' }}>
        <SortableContext items={projects.map(p => p.id)} strategy={verticalListSortingStrategy}>
          {projects.map(project => {
            const { positionedTasks, maxLevel } = positionedTasksByProject[project.id] || { positionedTasks: [], maxLevel: 0 };
            return (
              <ProjectRow
                key={project.id}
                project={project}
                positionedTasks={positionedTasks}
                maxLevel={maxLevel}
                viewStartDate={dates[0]}
                onGanttMouseDown={onGanttMouseDown}
                onProjectEdit={onProjectEdit}
                scrollToProjectStart={scrollToProjectStart}
                dates={dates} // ProjectRowにdatesを渡す
                DATE_CELL_WIDTH={DATE_CELL_WIDTH} // ProjectRowにDATE_CELL_WIDTHを渡す
                STICKY_COL_WIDTH={STICKY_COL_WIDTH} // ProjectRowにSTICKY_COL_WIDTHを渡す
              />
            );
          })}
        </SortableContext>
        {/* 作業員ヘッダー */}
        {/* SortableContextの外に配置し、独立したグリッドとして定義 */}
        <div className="worker-header-row grid" style={{ gridTemplateColumns: `${STICKY_COL_WIDTH}px repeat(${dates.length}, ${DATE_CELL_WIDTH}px)` }}>
          <div className="sticky left-0 z-40 bg-gray-200 border-b border-r border-t border-gray-300 p-2 flex items-center" style={{ top: HEADER_HEIGHT, height: WORKER_HEADER_HEIGHT }}>
            <span className="font-bold">作業員</span>
          </div>
          <div className="col-start-2 col-span-full bg-gray-50 border-b border-t border-gray-300" style={{ top: HEADER_HEIGHT, height: WORKER_HEADER_HEIGHT }}></div>
        </div>
        <SortableContext items={workers.map(w => w.id)} strategy={verticalListSortingStrategy}>

          {workers.map(worker => (
            <WorkerRow
              key={worker.id}
              worker={worker}
              dates={dates}
              assignments={assignments}
              projects={projects}
              selection={selection}
              selectedKeys={selectedKeys}
              onWorkerClick={onWorkerClick}
              onCellInteraction={onCellInteraction}
              onAssignmentEdit={onAssignmentEdit}

            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};
