import React from 'react';
import { format } from 'date-fns';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AssignmentCell } from './AssignmentCell';
import type { Worker, Assignments, Project } from '../lib/types';
import { WORKER_ROW_HEIGHT, STICKY_COL_WIDTH, DATE_CELL_WIDTH } from '../lib/constants';
import { calculateAge } from '../lib/utils';

interface WorkerRowProps {
  worker: Worker;
  dates: Date[];
  assignments: Assignments;
  projects: Project[];
  selection: { startKey: string | null; endKey: string | null };
  selectedKeys: Set<string>;
  onWorkerClick: (workerId: string) => void;
  onCellInteraction: (key: string, type: 'down' | 'move' | 'up') => void;
  onAssignmentEdit: (cellKey: string) => void;
}

export const WorkerRow: React.FC<WorkerRowProps> = React.memo(({
  worker, dates, assignments, projects, selection, selectedKeys, onWorkerClick, onCellInteraction, onAssignmentEdit
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: worker.id });

  const combinedStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 10,
    gridTemplateColumns: `${STICKY_COL_WIDTH}px 1fr`,
  };

  const age = calculateAge(worker.birthDate);

  return (
    <div ref={setNodeRef} style={combinedStyle} {...attributes} className="worker-row-container grid">
      {/* --- 左側の固定列 --- */}
      <div
        style={{ height: `${WORKER_ROW_HEIGHT}px` }}
        className="sticky left-0 z-20 bg-white border-b border-r border-gray-300 flex items-center"
      >
        <div {...listeners} className="p-1 cursor-grab touch-none">
          {/* ★★★ 修正点: SVGアイコンを3本線に変更 ★★★ */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" />
            <path d="M5 3a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" />
            <path d="M5 17a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" />
          </svg>
        </div>
        <div
          className="flex-grow cursor-pointer p-2"
          onContextMenu={(e: React.MouseEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); onWorkerClick(worker.id); }}
        >
          <span>{worker.name}</span>
          {age !== null && <span className="text-sm text-gray-500 ml-2">({age}歳)</span>}
        </div>
      </div>

      {/* --- 右側のスクロールするアサインメント部分 --- */}
      <div className="flex" style={{ width: `${dates.length * DATE_CELL_WIDTH}px` }}>
        {dates.map(date => {
          const cellKey = `w${worker.id}-${format(date, 'yyyy-MM-dd')}`;
          return (
            <div
              key={cellKey}
              className="assignment-cell-wrapper"
              style={{ minWidth: `${DATE_CELL_WIDTH}px`, height: `${WORKER_ROW_HEIGHT}px` }}
              onMouseDown={() => onCellInteraction(cellKey, 'down')}
              onMouseMove={() => onCellInteraction(cellKey, 'move')}
              onMouseUp={() => onCellInteraction(cellKey, 'up')}
              onContextMenu={(e) => { e.preventDefault(); onAssignmentEdit(cellKey); }}
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
      </div>
    </div>
  );
});
