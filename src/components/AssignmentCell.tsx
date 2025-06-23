// src/components/AssignmentCell.tsx
import React from 'react';
import type { Assignment, Project, StatusAssignment } from '../lib/types';

interface AssignmentCellProps {
    assignments: Assignment[];
    projects: Project[];
    isSelected: boolean;
    isActive: boolean;
}

export const AssignmentCell: React.FC<AssignmentCellProps> = React.memo(({ assignments, projects, isSelected, isActive }) => {
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
                        content = (assignment as StatusAssignment).value;
                        color = (assignment as StatusAssignment).value === '休み' ? 'bg-gray-500' : 'bg-yellow-500';
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