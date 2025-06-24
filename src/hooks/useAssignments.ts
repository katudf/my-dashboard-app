// src/hooks/useAssignments.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { writeBatch, doc } from 'firebase/firestore';
import { db, appId } from '../config/firebase';
import { formatDateStr } from '../lib/utils';
import type { Assignment, Assignments, Worker } from '../lib/types';

export const useAssignments = (
    workers: Worker[],
    dates: Date[],
    initialAssignments: Assignments,
    showNotification: (message: string, type?: 'success' | 'error') => void
) => {
    const [selection, setSelection] = useState<{ startKey: string | null; endKey: string | null }>({ startKey: null, endKey: null });
    const [isSelecting, setIsSelecting] = useState(false);
    const [clipboard, setClipboard] = useState<Assignment[] | null>(null);

    const handleCellInteraction = useCallback((key: string, type: 'down' | 'move' | 'up', openModal: (cellKey: string, selectedKeys: Set<string>) => void) => {
        if (type === 'down') {
            setIsSelecting(true);
            setSelection({ startKey: key, endKey: key });
        } else if (type === 'move' && isSelecting) {
            setSelection(prev => ({ ...prev, endKey: key }));
        } else if (type === 'up') {
            if (isSelecting && selection.startKey === selection.endKey) {
                openModal(key, selectedKeys);
            }
            setIsSelecting(false);
        }
    }, [isSelecting, selection.startKey, selection.endKey]);

    const selectedKeys = useMemo(() => {
        const keys = new Set<string>();
        if (!selection.startKey || !selection.endKey) return keys;

        const [, startWorkerIdStr, startYear, startMonth, startDay] = selection.startKey.split(/w|-/);
        const [, endWorkerIdStr, endYear, endMonth, endDay] = selection.endKey.split(/w|-/);

        const startWorkerIndex = workers.findIndex(w => w.id === startWorkerIdStr);
        const endWorkerIndex = workers.findIndex(w => w.id === endWorkerIdStr);
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

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isCtrlOrCmd = e.ctrlKey || e.metaKey;
            if (isCtrlOrCmd && e.key.toLowerCase() === 'c') {
                e.preventDefault();
                if (selectedKeys.size > 0 && selection.startKey) {
                    setClipboard(initialAssignments[selection.startKey] || []);
                    showNotification('予定をコピーしました');
                }
            }
            if (isCtrlOrCmd && e.key.toLowerCase() === 'v') {
                e.preventDefault();
                if (clipboard !== null && selectedKeys.size > 0) {
                    const batch = writeBatch(db);
                    selectedKeys.forEach(key => {
                        const docRef = doc(db, 'artifacts', appId, 'assignments', key);
                        batch.set(docRef, { assignments: clipboard });
                    });
                    batch.commit()
                        .then(() => showNotification(`${selectedKeys.size}件に貼り付けました`))
                        .catch(err => {
                            console.error(err);
                            showNotification('貼り付けに失敗しました', 'error');
                        });
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedKeys, selection.startKey, clipboard, initialAssignments, showNotification]);

    return {
        selection,
        isSelecting,
        selectedKeys,
        clipboard,
        setClipboard,
        handleCellInteraction
    };
};