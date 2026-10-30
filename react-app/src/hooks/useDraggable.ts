import { useEffect, useRef } from 'react';

interface DraggableOptions {
  handleRef: React.RefObject<HTMLElement | null>;
  onDrag: (x: number, y: number) => void;
  initialX: number;
  initialY: number;
}

export const useDraggable = ({ handleRef, onDrag, initialX, initialY }: DraggableOptions) => {
  const isDragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (!handleRef.current) return;
      
      isDragging.current = true;
      offset.current = {
        x: e.clientX - initialX,
        y: e.clientY - initialY,
      };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;

      const newX = e.clientX - offset.current.x;
      const newY = e.clientY - offset.current.y;

      // 确保窗口不会超出屏幕
      const maxX = window.innerWidth - 100;
      const maxY = window.innerHeight - 100;

      onDrag(
        Math.max(0, Math.min(newX, maxX)),
        Math.max(0, Math.min(newY, maxY))
      );
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    if (handleRef.current) {
      handleRef.current.addEventListener('mousedown', handleMouseDown);
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      if (handleRef.current) {
        handleRef.current.removeEventListener('mousedown', handleMouseDown);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleRef, onDrag, initialX, initialY]);
};
