import React from 'react';
import { GanttBar } from './GanttBar';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Project, Task, PositionedTask } from '../lib/types';
import {
  ROW_TOP_MARGIN,
  ROW_BOTTOM_MARGIN,
  PROJECT_BAR_HEIGHT,
  TASK_BAR_HEIGHT,
  BAR_V_MARGIN,
} from '../lib/constants';

interface ProjectRowProps {
  project: Project;
  positionedTasks: PositionedTask[];
  maxLevel: number;
  viewStartDate: Date;
  onGanttMouseDown: (e: React.MouseEvent, item: Project | Task, type: 'project' | 'task', handle: 'move' | 'resize-left' | 'resize-right') => void;
  onProjectEdit?: (projectId: string) => void;
  scrollToProjectStart?: (startDate: Date) => void;
  dates: Date[];
  DATE_CELL_WIDTH: number;
  STICKY_COL_WIDTH: number;
}

export const ProjectRow: React.FC<ProjectRowProps> = React.memo(({
  project, positionedTasks, maxLevel, viewStartDate, onGanttMouseDown, onProjectEdit, scrollToProjectStart, dates, DATE_CELL_WIDTH, STICKY_COL_WIDTH
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 10,
    gridTemplateColumns: `${STICKY_COL_WIDTH}px 1fr`,
  };

  const tasksHeight = maxLevel > 0 ? BAR_V_MARGIN + (maxLevel * (TASK_BAR_HEIGHT + BAR_V_MARGIN)) - BAR_V_MARGIN : 0;
  const projectRowHeight = ROW_TOP_MARGIN + PROJECT_BAR_HEIGHT + tasksHeight + ROW_BOTTOM_MARGIN;

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="project-row-container grid relative" >
        <div className="grid" style={{ gridTemplateColumns: `${STICKY_COL_WIDTH}px 1fr` }}>
            <div
                style={{ height: `${projectRowHeight}px` }}
                className={`sticky left-0 z-20 bg-white border-b border-r border-gray-300 flex items-center border-l-4 ${project.borderColor}`}
            >
                <div {...listeners} className="p-1 cursor-grab touch-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" />
                        <path d="M5 3a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" />
                        <path d="M5 17a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" />
                    </svg>
                </div>
                <div
                    className="flex-grow cursor-pointer overflow-hidden p-2 flex flex-col justify-center" // ★★★ 修正点1 ★★★
                    onClick={() => { if (typeof scrollToProjectStart === 'function' && project.startDate) { scrollToProjectStart(new Date(project.startDate)); } }}
                    onContextMenu={e => { e.preventDefault(); e.stopPropagation(); if (typeof onProjectEdit === 'function') onProjectEdit(project.id); }}
                >
                    {/* ★★★ 修正点2 ★★★ */}
                    <p className="font-bold truncate m-0" style={{ lineHeight: 0.9 }} title={project.name}>{project.name}</p>
                    <p className="text-xs text-gray-500 m-0" style={{ lineHeight: 0.9 }}>{project.startDate && project.endDate ? `${project.startDate} ~ ${project.endDate}` : '工期未設定'}</p>
                </div>
            </div>

            {/* --- 右側のスクロールするガントチャート部分 --- */}
            <div className="relative border-b border-gray-300" style={{ width: `${dates.length * DATE_CELL_WIDTH}px`, height: `${projectRowHeight}px` }}>
                 <div className="absolute inset-0 flex pointer-events-none" aria-hidden="true">
                    {Array.from({ length: dates.length }).map((_, index) => (
                        <div
                            key={index}
                            className="h-full border-r border-gray-200"
                            style={{ width: `${DATE_CELL_WIDTH}px` }}
                        />
                    ))}
                 </div>

                 <GanttBar item={project} type="project" viewStartDate={viewStartDate} onMouseDown={onGanttMouseDown} color={project.color} />
                 {positionedTasks.map(task => (<GanttBar key={task.id} item={task} type="task" viewStartDate={viewStartDate} onMouseDown={onGanttMouseDown} color={project.color} />))}
            </div>
        </div>
    </div>
  );
});
