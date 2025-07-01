import { useEffect, useCallback } from 'react';
import type { RefObject } from 'react';

export const useDragToScroll = (scrollContainerRef: RefObject<HTMLElement | null>) => {

    const handlePointerDown = useCallback((e: PointerEvent) => {
        const element = scrollContainerRef.current;

        if (!element) return;

        // タスクバーやボタン、各種ヘッダーなど、インタラクティブな要素の上では発動しない
        if ((e.target as HTMLElement).closest('.gantt-bar, button, .assignment-cell-wrapper, .sticky')) {

            return;
        }

        e.preventDefault(); // テキスト選択などのデフォルト動作を防止

        const startX = e.pageX - element.offsetLeft;
        const startY = e.pageY - element.offsetTop;
        const scrollLeftStart = element.scrollLeft;
        const scrollTopStart = element.scrollTop;

        element.style.cursor = 'grabbing';
        element.style.userSelect = 'none';

        const handlePointerMove = (moveEvent: PointerEvent) => {
            const x = moveEvent.pageX - element.offsetLeft;
            const y = moveEvent.pageY - element.offsetTop;
            moveEvent.preventDefault(); // ここに preventDefault を追加
            const walkX = x - startX;
            const walkY = y - startY;
            element.scrollLeft = scrollLeftStart - walkX;
            element.scrollTop = scrollTopStart - walkY;
        };

        const handlePointerUp = () => {
            document.removeEventListener('pointermove', handlePointerMove);
            document.removeEventListener('pointerup', handlePointerUp);

            if (element) {
                element.style.cursor = 'grab';
                element.style.userSelect = 'auto';
            }
        };

        document.addEventListener('pointermove', handlePointerMove);
        document.addEventListener('pointerup', handlePointerUp);
    }, [scrollContainerRef]);

    useEffect(() => {
        const element = scrollContainerRef.current;
        if (!element) return;

        element.addEventListener('pointerdown', handlePointerDown);
        element.style.cursor = 'grab';

        return () => {
            element.removeEventListener('pointerdown', handlePointerDown);
        };
    }, [scrollContainerRef, handlePointerDown]);
};