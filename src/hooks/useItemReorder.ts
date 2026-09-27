import { useState, useRef, useCallback, useEffect } from 'react';
import { ListItem } from '../types';

interface UseItemReorderProps {
  items: ListItem[];
  onReorder: (sourceId: string, targetId: string, placement: 'before' | 'after') => void;
}

export function useItemReorder({ items, onReorder }: UseItemReorderProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ id: string; placement: 'before' | 'after' } | null>(null);
  const [touchGhost, setTouchGhost] = useState<{
    name: string;
    unit?: string;
    value: number;
    color: string;
    x: number;
    y: number;
  } | null>(null);

  const draggedIdRef = useRef<string | null>(null);
  const dropTargetRef = useRef<{ id: string; placement: 'before' | 'after' } | null>(null);
  const touchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isTouchDraggingRef = useRef(false);

  draggedIdRef.current = draggedId;
  dropTargetRef.current = dropTarget;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (touchTimerRef.current) {
        clearTimeout(touchTimerRef.current);
      }
    };
  }, []);

  // HTML5 Desktop Drag Handlers
  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedId(id);
    draggedIdRef.current = id;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const currentDragged = draggedIdRef.current;
    if (!currentDragged || currentDragged === targetId) return;

    const targetElem = e.currentTarget as HTMLElement;
    const rect = targetElem.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const placement = offsetY < rect.height / 2 ? 'before' : 'after';

    setDropTarget(prev => {
      if (prev?.id === targetId && prev.placement === placement) return prev;
      return { id: targetId, placement };
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const currentDragged = draggedIdRef.current;
    const currentTarget = dropTargetRef.current;

    if (currentDragged && targetId && currentDragged !== targetId) {
      const placement = currentTarget?.id === targetId ? currentTarget.placement : 'before';
      onReorder(currentDragged, targetId, placement);
    }

    setDraggedId(null);
    setDropTarget(null);
    draggedIdRef.current = null;
    dropTargetRef.current = null;
  }, [onReorder]);

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDropTarget(null);
    draggedIdRef.current = null;
    dropTargetRef.current = null;
  }, []);

  // Mobile / Touch Drag Handlers
  const handleTouchStart = useCallback((e: React.TouchEvent, id: string, fromHandle = false) => {
    const touch = e.touches[0];
    if (!touch) return;

    const startX = touch.clientX;
    const startY = touch.clientY;
    const item = items.find(i => i.id === id);
    if (!item) return;

    // If starting from drag handle, respond faster (150ms). If starting on card body, require 300ms hold so scrolling works.
    const holdTime = fromHandle ? 140 : 320;

    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
    }

    touchTimerRef.current = setTimeout(() => {
      isTouchDraggingRef.current = true;
      setDraggedId(id);
      draggedIdRef.current = id;

      setTouchGhost({
        name: item.name,
        unit: item.unit,
        value: item.value,
        color: item.color || 'emerald',
        x: startX,
        y: startY,
      });

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50);
      }

      // Add window touchmove and touchend listeners
      const onWindowTouchMove = (moveEvt: TouchEvent) => {
        if (!isTouchDraggingRef.current) return;
        const currentTouch = moveEvt.touches[0];
        if (!currentTouch) return;

        // Prevent page scrolling while dragging an item
        moveEvt.preventDefault();

        setTouchGhost(prev => prev ? {
          ...prev,
          x: currentTouch.clientX,
          y: currentTouch.clientY,
        } : null);

        // Find element under touch
        const elemUnderTouch = document.elementFromPoint(currentTouch.clientX, currentTouch.clientY);
        if (!elemUnderTouch) return;

        const cardElem = elemUnderTouch.closest('[data-item-id]') as HTMLElement | null;
        if (cardElem) {
          const targetId = cardElem.getAttribute('data-item-id');
          if (targetId && targetId !== draggedIdRef.current) {
            const rect = cardElem.getBoundingClientRect();
            const offsetY = currentTouch.clientY - rect.top;
            const placement = offsetY < rect.height / 2 ? 'before' : 'after';

            setDropTarget(prev => {
              if (prev?.id === targetId && prev.placement === placement) return prev;
              return { id: targetId, placement };
            });
          }
        }
      };

      const onWindowTouchEnd = () => {
        window.removeEventListener('touchmove', onWindowTouchMove);
        window.removeEventListener('touchend', onWindowTouchEnd);
        window.removeEventListener('touchcancel', onWindowTouchEnd);

        if (isTouchDraggingRef.current) {
          const currentDragged = draggedIdRef.current;
          const currentTarget = dropTargetRef.current;

          if (currentDragged && currentTarget && currentDragged !== currentTarget.id) {
            onReorder(currentDragged, currentTarget.id, currentTarget.placement);
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate(40);
            }
          }
        }

        isTouchDraggingRef.current = false;
        setDraggedId(null);
        setDropTarget(null);
        setTouchGhost(null);
        draggedIdRef.current = null;
        dropTargetRef.current = null;
      };

      window.addEventListener('touchmove', onWindowTouchMove, { passive: false });
      window.addEventListener('touchend', onWindowTouchEnd);
      window.addEventListener('touchcancel', onWindowTouchEnd);
    }, holdTime);
  }, [items, onReorder]);

  const handleTouchEnd = useCallback(() => {
    if (touchTimerRef.current && !isTouchDraggingRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    // If not dragging yet and user moves finger > 10px, cancel long-press to allow scrolling
    if (touchTimerRef.current && !isTouchDraggingRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
  }, []);

  return {
    draggedId,
    dropTarget,
    touchGhost,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
