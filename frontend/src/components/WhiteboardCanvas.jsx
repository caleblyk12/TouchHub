// src/components/WhiteboardCanvas.jsx

import { motion } from "framer-motion";
import { useRef, useCallback, useEffect } from "react";

const colorMap = {
  blue: "#2563eb",
  red: "#dc2626",
  green: "#16a34a",
  yellow: "#f59e0b",
};

function clamp(v) {
  return Math.max(0, Math.min(1, v));
}

/**
 * pieces: [{id, type, color|team, x, y, ...}]  x,y in 0–1 field coords
 * targetPositionsById: optional map { [id]: { x, y } } used for smooth playback/preview
 * onPositionChange: (id, x, y) => void - Callback to notify parent of new position
 */
export default function WhiteboardCanvas({ pieces, targetPositionsById, frameDurationSec = 1, onPositionChange }) {
  const fieldRef = useRef(null);
  const activeDragRef = useRef(null); 
  
  // CRITICAL FIX: The dragHandlers ref holds the latest functions and props 
  // so global event listeners don't get stale closures or ReferenceErrors.
  const dragHandlers = useRef({}); 

  /** Helper to convert absolute cursor position to normalized 0–1 within field */
  const toNormalized = useCallback((pointX, pointY) => {
    if (!fieldRef.current) return { x: 0.5, y: 0.5 };
    const rect = fieldRef.current.getBoundingClientRect();
    const x = (pointX - rect.left) / rect.width;
    const y = (pointY - rect.top) / rect.height;
    return { x: clamp(x), y: clamp(y) };
  }, []);

  /** Helper to convert normalized (0-1) piece center to screen pixel coordinates */
  const toScreen = useCallback((normalizedX, normalizedY) => {
    if (!fieldRef.current) return { x: 0, y: 0 };
    const rect = fieldRef.current.getBoundingClientRect();
    const x = normalizedX * rect.width + rect.left;
    const y = normalizedY * rect.height + rect.top;
    return { x, y };
  }, []);

  const isDraggable = !!onPositionChange && !targetPositionsById; 

  // CRITICAL FIX: Use useEffect to define and store event handlers, 
  // guaranteeing access to the latest props/refs/functions.
  useEffect(() => {
    
    const current = dragHandlers.current;

    // 1. handleDrag (Continuous Move Logic)
    current.handleDrag = (e) => {
      if (!current.activeDragRef.current) return;
      
      e.preventDefault(); 

      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);

      if (clientX === undefined || clientY === undefined) return;

      const { element, initialClientX, initialClientY } = current.activeDragRef.current;
      
      const dx = clientX - initialClientX;
      const dy = clientY - initialClientY;
      
      // Apply the movement directly using CSS transform (visual update)
      element.style.transform = `translate(${dx}px, ${dy}px) translate(-50%, -50%)`;
    };

    // 2. handleDragEnd (Final Commit Logic)
    current.handleDragEnd = (e) => { 
      if (!current.activeDragRef.current) return;
      
      const { element, id, initialX, initialY, initialClientX, initialClientY } = current.activeDragRef.current;

      // Get final mouse/touch position from the 'mouseup' or 'touchend' event
      const finalClientX = e.clientX || (e.changedTouches && e.changedTouches[0].clientX);
      const finalClientY = e.clientY || (e.changedTouches && e.changedTouches[0].clientY);
      
      // Only proceed if coordinates are valid AND onPositionChange is available
      if (finalClientX !== undefined && finalClientY !== undefined && current.onPositionChange) {
          // Calculate total drag offset in pixels
          const totalDx = finalClientX - initialClientX;
          const totalDy = finalClientY - initialClientY;
          
          const fieldRect = current.fieldRef.current.getBoundingClientRect();

          // Final normalized position = Initial normalized position + Normalized drag change
          const newX = clamp(initialX + (totalDx / fieldRect.width));
          const newY = clamp(initialY + (totalDy / fieldRect.height));
          
          // CRITICAL: Call the latest onPositionChange handler
          current.onPositionChange(id, newX, newY);
          
          // Reset the DOM transform after state update.
          element.style.transform = 'translate(-50%, -50%)'; 
      } else {
          // Reset visual state if operation failed or component is read-only
          element.style.transform = 'translate(-50%, -50%)'; 
      }
      
      element.classList.remove('dragging-piece');
      document.body.style.cursor = 'default';
      current.activeDragRef.current = null;

      // Remove global event listeners
      document.removeEventListener('mousemove', current.handleDrag);
      document.removeEventListener('mouseup', current.handleDragEnd);
      document.removeEventListener('touchmove', current.handleDrag);
      document.removeEventListener('touchend', current.handleDragEnd);
    };

    // 3. handleDragStart (Setup Logic)
    current.handleDragStart = (e, piece) => {
        if (!isDraggable) return;
        if (e.type === 'mousedown' && e.button !== 0) return;
        
        e.preventDefault(); 
        e.stopPropagation(); 
        
        document.body.style.cursor = 'grabbing';
        
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        if (clientX === undefined || clientY === undefined) return;

        const element = e.currentTarget;
        element.classList.add('dragging-piece');
        
        // Calculate piece center in screen pixels
        const pieceCenter = current.toScreen(piece.x, piece.y);

        // Store drag context
        current.activeDragRef.current = {
            id: piece.id,
            element: element,
            initialClientX: clientX,
            initialClientY: clientY,
            initialX: piece.x, 
            initialY: piece.y,
        };

        // Attach listeners using the functions defined above in the same closure
        document.addEventListener('mousemove', current.handleDrag);
        document.addEventListener('mouseup', current.handleDragEnd);
        document.addEventListener('touchmove', current.handleDrag);
        document.addEventListener('touchend', current.handleDragEnd);
    };


    // Store latest props/refs/helpers onto the ref
    current.onPositionChange = onPositionChange;
    current.fieldRef = fieldRef;
    current.activeDragRef = activeDragRef;
    current.toNormalized = toNormalized;
    current.toScreen = toScreen;

    // The cleanup function handles global listener removal
    return () => {
        document.removeEventListener('mousemove', current.handleDrag);
        document.removeEventListener('mouseup', current.handleDragEnd);
        document.removeEventListener('touchmove', current.handleDrag);
        document.removeEventListener('touchend', current.handleDragEnd);
    };

  // Rerun effect when props/dependencies change
  }, [onPositionChange, isDraggable, toNormalized, toScreen]); 


  return (
    <div
      ref={fieldRef}
      className="relative w-full max-w-4xl mx-auto aspect-[3/2] bg-green-100 border-4 border-green-700 rounded-xl overflow-hidden select-none"
    >
      <div className="absolute left-1/2 top-0 -translate-x-1/2 h-full w-1 bg-green-700/20" />

      {pieces.map((p) => (
        <motion.div
          key={p.id}
          // Call the stable handleDragStart function stored in the ref
          onMouseDown={isDraggable ? (e) => dragHandlers.current.handleDragStart(e, p) : undefined}
          onTouchStart={isDraggable ? (e) => dragHandlers.current.handleDragStart(e, p) : undefined}

          // Framer Motion for positional update and animation
          animate={{
            left: `${p.x * 100}%`,
            top: `${p.y * 100}%`,
            ...(targetPositionsById?.[p.id] && {
              left: `${targetPositionsById[p.id].x * 100}%`,
              top: `${targetPositionsById[p.id].y * 100}%`,
            })
          }}
          transition={{ 
            duration: targetPositionsById ? frameDurationSec : 0, 
            ease: "linear",
          }}
          className={`absolute rounded-full shadow select-none ${isDraggable ? "cursor-grab" : "cursor-default"}`}
          // Base transform is -50% to center the piece
          style={{
            width: p.type === "ball" ? 18 : 26,
            height: p.type === "ball" ? 18 : 26,
            transform: 'translate(-50%, -50%)', // Base style for centering
            backgroundColor: colorMap[p.color] || "transparent", 
          }}
        />
      ))}
    </div>
  );
}