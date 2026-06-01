/**
 * Creation/modification date: 01/06/2026
 * Path: src/components/sat/work-orders/WorkOrderKanban/useKanbanPan.ts
 * Description: Click-and-drag horizontal panning for the board scroll container.
 *              Returns ref + handlers to spread on the board div.
 *              Pan is only triggered when clicking the board background,
 *              not when clicking on cards or buttons.
 */

"use client";

import { useCallback, useRef, useState } from "react";

export function useKanbanPan<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, scrollLeft: 0 });

  const onMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("[data-kanban-card]")) return;
    if (target.closest("button")) return;

    const board = ref.current;
    if (!board) return;

    setIsPanning(true);
    panStart.current = {
      x: e.clientX,
      scrollLeft: board.scrollLeft,
    };
  };

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning || !ref.current) return;
    const dx = e.clientX - panStart.current.x;
    ref.current.scrollLeft = panStart.current.scrollLeft - dx;
  }, [isPanning]);

  const onMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  return {
    ref,
    isPanning,
    panHandlers: {
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onMouseLeave: onMouseUp,
    },
  };
}
