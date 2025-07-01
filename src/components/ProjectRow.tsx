import React from 'react';
import { GanttBar } from './GanttBar';
import { useSortable } from '@dnd-kit/sortable';
import { useDndContext } from '@dnd-kit/core'; // useDndContextをインポート
import { CSS } from '@dnd-kit/utilities';
import type { Project, Task, PositionedTask } from '../lib/types';
import {
  ROW_TOP_MARGIN,
  ROW_BOTTOM_MARGIN,
  PROJECT_BAR_HEIGHT,
  TASK_BAR_HEIGHT,
  BAR_V_MARGIN,
    // 新しいpropsとして受け取る定数をインポート
  STICKY_COL_WIDTH,
  DATE_CELL_WIDTH,
} from '../lib/constants';

interface ProjectRowProps {
  project: Project; // project.idがuseSortableのidになる
  positionedTasks: PositionedTask[];
  maxLevel: number;
  viewStartDate: Date;
  onGanttMouseDown: (e: React.MouseEvent, item: Project | Task, type: 'project' | 'task', handle: 'move' | 'resize-left' | 'resize-right') => void;
  onProjectEdit?: (projectId: string) => void;
  scrollToProjectStart?: (startDate: Date) => void;
  // 新しいpropsを追加
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
  const { active } = useDndContext(); // ドラッグ中のアイテムを取得
  const isCurrentDraggedItem = active && active.id === project.id; // このアイテムが現在ドラッグされているか


  const style = {
    transform: CSS.Transform.toString(transform), // dnd-kitによる移動
    transition, // dnd-kitによるアニメーション
    opacity: isCurrentDraggedItem ? 0 : 1, // ドラッグ中の元のアイテムを透明にする
    zIndex: isCurrentDraggedItem ? 50 : 40, // ドラッグ中のアイテムのz-indexを高くする
  };

  const tasksHeight = maxLevel > 0 ? BAR_V_MARGIN + (maxLevel * (TASK_BAR_HEIGHT + BAR_V_MARGIN)) - BAR_V_MARGIN : 0;
  const projectRowHeight = ROW_TOP_MARGIN + PROJECT_BAR_HEIGHT + tasksHeight + ROW_BOTTOM_MARGIN;

  return (
    // dnd-kit用のラッパーdivを追加し、ドラッグ操作とレイアウトの責務を分離する
    <div ref={setNodeRef} {...attributes} style={style}>
      <div className="project-row-container grid"
        style={{ gridTemplateColumns: `${STICKY_COL_WIDTH}px repeat(${dates.length}, ${DATE_CELL_WIDTH}px)`, height: `${projectRowHeight}px` }}>

        <div
          style={{ height: `${projectRowHeight}px`, left: 0, zIndex: isCurrentDraggedItem ? 50 : 40 }} // zIndexを内側の要素に移動
          className={`sticky left-0 bg-white border-b border-r border-gray-300 p-2 flex items-start border-l-4 ${project.borderColor}`} // スティッキーな名前部分
        >
          <div {...listeners} className="p-2 cursor-grab touch-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
          </div>
        {/* このdivは内部グリッドの2列目から最終列までを占める */}
        <div className="col-start-2 col-span-full relative border-b border-gray-300" style={{ height: `${projectRowHeight}px` }}>
          <GanttBar item={project} type="project" viewStartDate={viewStartDate} onMouseDown={onGanttMouseDown} color={project.color} />
          {positionedTasks.map(task => (<GanttBar key={task.id} item={task} type="task" viewStartDate={viewStartDate} onMouseDown={onGanttMouseDown} color={project.color} />))}
          </div>        </div>
        <div className="overflow-hidden flex-grow cursor-pointer" onClick={() => { if (typeof scrollToProjectStart === 'function' && project.startDate) { scrollToProjectStart(new Date(project.startDate)); } }} onContextMenu={e => { e.preventDefault(); e.stopPropagation(); if (typeof onProjectEdit === 'function') onProjectEdit(project.id); }}>

          <p className="font-bold truncate" title={project.name}>{project.name}</p>
          <p className="text-xs text-gray-500">{project.startDate && project.endDate ? `${project.startDate} ~ ${project.endDate}` : '工期未設定'}</p>
        </div>
      </div>

    </div>
  );
});

