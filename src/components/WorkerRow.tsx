import React from 'react';
import { format } from 'date-fns';
import { useSortable } from '@dnd-kit/sortable';
import { useDndContext } from '@dnd-kit/core';
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
  } = useSortable({ id: worker.id });
  const { active } = useDndContext();
  const isCurrentDraggedItem = active && active.id === worker.id;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isCurrentDraggedItem ? 0 : 1,
    zIndex: isCurrentDraggedItem ? 50 : 30,
    gridTemplateColumns: `${STICKY_COL_WIDTH}px repeat(${dates.length}, ${DATE_CELL_WIDTH}px)`,
    height: `${WORKER_ROW_HEIGHT}px`,
  };
  const age = calculateAge(worker.birthDate);
  return (
    <div ref={setNodeRef} style={style} className="worker-row-container grid">
      <div
        style={{ height: `${WORKER_ROW_HEIGHT}px`, left: 0, zIndex: 30 }}
        className="sticky left-0 bg-white border-b border-r border-gray-300 font-semibold flex items-center"
      >
        <div {...attributes} {...listeners} className="p-2 cursor-grab touch-none">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
        </div>
        <div className="flex-grow cursor-pointer p-2" onContextMenu={(e: React.MouseEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); onWorkerClick(worker.id); }}>
          <span>{worker.name}</span>
          {age !== null && <span className="text-sm text-gray-500 ml-2">({age}歳)</span>}
        </div>
      </div>
      {dates.map(date => {
        const cellKey = `w${worker.id}-${format(date, 'yyyy-MM-dd')}`;
        return (
          <div key={cellKey} className="assignment-cell-wrapper col-start-2"
            onMouseDown={() => onCellInteraction(cellKey, 'down')}
            onMouseMove={() => onCellInteraction(cellKey, 'move')}
            onMouseUp={() => onCellInteraction(cellKey, 'up')}
            onContextMenu={(e: React.MouseEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); onAssignmentEdit(cellKey); }}
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
  );
});

