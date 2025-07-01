// src/components/GanttGrid.tsx
import React from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { DateHeader } from './DateHeader';
import { ProjectRow } from './ProjectRow';
import { WorkerRow } from './WorkerRow';
import type { Project, Task, Worker, Assignments, PositionedTask } from '../lib/types';
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
  onProjectAdd: () => void;
  onWorkerAdd: () => void;
}

export const GanttGrid: React.FC<GanttGridProps> = ({
  projects, workers, assignments, dates, holidays, weatherData,
  positionedTasksByProject, selection, selectedKeys,
  onCellInteraction, onWorkerClick, onGanttMouseDown, onProjectEdit, onAssignmentEdit, scrollToProjectStart,
  onProjectAdd, onWorkerAdd
}) => {
  return (
    <div className="relative" style={{ width: '100%' }}>
      <DateHeader
        dates={dates}
        holidays={holidays}
        weatherData={weatherData}
        onProjectAdd={onProjectAdd}
      />
      
      {/* ★★★ 修正点: 外側のグリッドコンテナを削除し、各要素が独立して並ぶようにする ★★★ */}
      
      {/* --- プロジェクト行 --- */}
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
              dates={dates}
              DATE_CELL_WIDTH={DATE_CELL_WIDTH}
              STICKY_COL_WIDTH={STICKY_COL_WIDTH}
            />
          );
        })}
      </SortableContext>
      
      {/* --- 作業員ヘッダー行 --- */}
      <div className="worker-header-row grid" style={{ gridTemplateColumns: `${STICKY_COL_WIDTH}px 1fr` }}>
        <div className="sticky left-0 z-40 bg-gray-200 border-b border-r border-t border-gray-300 p-2 flex items-center justify-between" style={{ top: `${HEADER_HEIGHT}px`, height: `${WORKER_HEADER_HEIGHT}px` }}>
          <span className="font-bold">作業員</span>
          <button
            onClick={onWorkerAdd}
            className="flex items-center justify-center w-6 h-6 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-transform transform hover:scale-110"
            title="新規作業員を追加"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="bg-gray-50 border-b border-t border-gray-300" style={{ top: `${HEADER_HEIGHT}px`, height: `${WORKER_HEADER_HEIGHT}px` }}></div>
      </div>

      {/* --- 作業員行 --- */}
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
  );
};
