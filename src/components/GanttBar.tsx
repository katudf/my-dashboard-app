// src/components/GanttBar.tsx
import React from 'react';
import { differenceInDays, format } from 'date-fns';
import type { Project, PositionedTask, Task } from '../lib/types';
import { parseDateStr, getTaskBarColor } from '../lib/utils';
import { DATE_CELL_WIDTH, PROJECT_BAR_HEIGHT, TASK_BAR_HEIGHT, ROW_TOP_MARGIN, BAR_V_MARGIN } from '../lib/constants';

interface GanttBarProps {
    item: Project | PositionedTask;
    type: 'project' | 'task';
    viewStartDate: Date;
    color: string; // プロジェクトのデフォルト色
    onMouseDown: (e: React.MouseEvent, item: Project | Task, type: 'project' | 'task', handle: 'move' | 'resize-left' | 'resize-right') => void;
}

export const GanttBar: React.FC<GanttBarProps> = ({ item, type, viewStartDate, color, onMouseDown }) => {
    const isProject = type === 'project';
    const startStr = isProject ? (item as Project).startDate : (item as Task).start;
    const endStr = isProject ? (item as Project).endDate : (item as Task).end;

    if (!startStr || !endStr) return null;

    const startDate = parseDateStr(startStr);
    const endDate = parseDateStr(endStr);

    const startOffset = differenceInDays(startDate, viewStartDate);
    const duration = differenceInDays(endDate, startDate) + 1;

    if (startOffset < 0 && startOffset + duration < 0) return null;
    
    const left = startOffset * DATE_CELL_WIDTH;
    const width = duration * DATE_CELL_WIDTH;

    const barHeight = isProject ? PROJECT_BAR_HEIGHT : TASK_BAR_HEIGHT;
    const barTop = isProject 
        ? ROW_TOP_MARGIN 
        : ROW_TOP_MARGIN + PROJECT_BAR_HEIGHT + ((item as PositionedTask).level * (TASK_BAR_HEIGHT + BAR_V_MARGIN));
    
    // ★★★ 修正: タスク自身のカラーがあればそれを優先し、なければプロジェクトのカラーを薄くして使う ★★★
    const bgColor = isProject 
        ? `${color} opacity-80` 
        : getTaskBarColor((item as Task).color || color);

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
            {isProject ? (
                <span className="truncate px-2 text-white font-bold text-sm">
                    {(item as Project).name} {format(startDate, 'M/d')}～{format(endDate, 'M/d')} ({duration}日間)
                </span>
            ) : (
                <span className="truncate px-2">{(item as Task).text}</span>
            )}
            <div
                className="resize-handle absolute right-0 top-0 h-full w-2 cursor-ew-resize z-20"
                onMouseDown={(e) => { e.stopPropagation(); onMouseDown(e, item, type, 'resize-right'); }}
            />
        </div>
    );
};
