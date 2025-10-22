// src/components/WhiteboardCanvas.jsx

import { motion } from "framer-motion";
import { useRef, useCallback, useEffect, useState, useMemo } from "react";

const colorMap = {
  blue: "#2563eb",
  red: "#dc2626",
  green: "#16a34a",
  yellow: "#f59e0b",
  purple: "#c026d3", // New Team 4 color (Fuchsia-600 equivalent)
};

// Base sizes (adjust as needed)
const baseBallSize = { w: '18px', h: '18px', labelOffset: '-bottom-5' }; // sm:w-[18px] sm:h-[18px]
const basePlayerSize = { w: '26px', h: '26px', labelOffset: '-bottom-5' }; // sm:w-[26px] sm:h-[26px]
const baseConeSize = { w: '20px', h: '20px', labelOffset: '-bottom-6' }; // Adjusted cone size for visibility as triangle
const mobileScaleFactor = 0.5; // Make pieces smaller on mobile 

function clamp(v) {
  return Math.max(0, Math.min(1, v));
}

export default function WhiteboardCanvas({
  pieces, // These are the potentially interpolated pieces for display
  onPositionChange, // For drag end
  onPieceSettings,
  // New prop to get the non-interpolated piece state for drag start
  getOriginalPieceState,
}) {
  const fieldRef = useRef(null);
  const activeDragRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const longPressTimeout = useRef(null);
  const dragHandlers = useRef({});

  useEffect(() => {
    function handleResize() { setIsMobile(window.innerWidth < 640); }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Use the 'pieces' prop directly for rendering, apply mobile transform if needed
  const transformedPieces = useMemo(() => {
    if (!isMobile) return pieces;
    // Map based on the currently displayed pieces
    return pieces.map((p) => ({ ...p, x: p.y, y: 1 - p.x }));
  }, [pieces, isMobile]);


  const toNormalized = useCallback((pointX, pointY) => {
    if (!fieldRef.current) return { x: 0.5, y: 0.5 };
    const rect = fieldRef.current.getBoundingClientRect();
    const x = (pointX - rect.left) / rect.width;
    const y = (pointY - rect.top) / rect.height;
    return { x: clamp(x), y: clamp(y) };
  }, []);

  // Check only for onPositionChange now
  const isDraggable = !!onPositionChange && !!getOriginalPieceState;

  // Transform coordinates back to original orientation if mobile
  const onPositionChangeTransformed = useCallback((id, x, y) => {
    if (onPositionChange) {
      if (isMobile) onPositionChange(id, 1 - y, x);
      else onPositionChange(id, x, y);
    }
  }, [onPositionChange, isMobile]);


  useEffect(() => {
    const currentHandlers = dragHandlers.current;

    // 1. handleDrag: Simplified - only uses CSS transform for visual feedback during drag
    currentHandlers.handleDrag = (e) => {
      if (!currentHandlers.activeDragRef.current) return;
      if (longPressTimeout.current) {
        clearTimeout(longPressTimeout.current);
        longPressTimeout.current = null;
      }
      e.preventDefault();

      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      if (clientX === undefined || clientY === undefined) return;

       const { element, initialClientX, initialClientY } = currentHandlers.activeDragRef.current;

      const dx = clientX - initialClientX;
      const dy = clientY - initialClientY;

      // Apply the movement directly using CSS transform (visual update ONLY)
      // The `translate(-50%, -50%)` is for centering the piece.
      element.style.transform = `translate(${dx}px, ${dy}px) translate(-50%, -50%)`;

    };

    // 2. handleDragEnd: Calculate final normalized position and call onPositionChange
    currentHandlers.handleDragEnd = (e) => {
      if (longPressTimeout.current) {
        clearTimeout(longPressTimeout.current);
        longPressTimeout.current = null;
      }
      if (!currentHandlers.activeDragRef.current) return;

      const { element, id, initialX, initialY, initialClientX, initialClientY } = currentHandlers.activeDragRef.current;


      const finalClientX = e.clientX || (e.changedTouches && e.changedTouches[0].clientX);
      const finalClientY = e.clientY || (e.changedTouches && e.changedTouches[0].clientY);

      if (finalClientX !== undefined && finalClientY !== undefined && currentHandlers.onPositionChange) {
        // Calculate total drag offset in pixels
        const totalDx = finalClientX - initialClientX;
        const totalDy = finalClientY - initialClientY;
        const fieldRect = currentHandlers.fieldRef.current.getBoundingClientRect();

        // Calculate final normalized position based on the *initial* normalized state + drag offset
        const finalX = clamp(initialX + totalDx / fieldRect.width);
        const finalY = clamp(initialY + totalDy / fieldRect.height);

        // Call the final commit handler
        currentHandlers.onPositionChange(id, finalX, finalY);
      }
       // Reset the element's transform
       element.style.transform = "translate(-50%, -50%)";

      element.classList.remove("dragging-piece");
      document.body.style.cursor = "default";
      currentHandlers.activeDragRef.current = null;

      document.removeEventListener("mousemove", currentHandlers.handleDrag);
      document.removeEventListener("mouseup", currentHandlers.handleDragEnd);
      document.removeEventListener("touchmove", currentHandlers.handleDrag);
      document.removeEventListener("touchend", currentHandlers.handleDragEnd);
    };

    // 3. handleDragStart: Store initial state using getOriginalPieceState
    currentHandlers.handleDragStart = (e, piece) => {
      if (!isDraggable) return;
      if (e.type === "mousedown" && e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();

      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      if (clientX === undefined || clientY === undefined) return;

      // Use the provided function to get the base state for this piece ID
      const originalPieceState = currentHandlers.getOriginalPieceState(piece.id);
      if (!originalPieceState) return;


      if (e.type === "touchstart") {
        longPressTimeout.current = setTimeout(() => {
          onPieceSettings(originalPieceState);
          longPressTimeout.current = null;
        }, 500);
      }

      document.body.style.cursor = "grabbing";
      const element = e.currentTarget;
      element.classList.add("dragging-piece");

      // Store initial client coordinates AND initial normalized position
      currentHandlers.activeDragRef.current = {
        id: piece.id,
        element: element,
        initialClientX: clientX,
        initialClientY: clientY,
         // Store the initial *normalized* position from the original frame data, transformed if mobile
        initialX: isMobile ? originalPieceState.y : originalPieceState.x,
        initialY: isMobile ? 1 - originalPieceState.x : originalPieceState.y,
      };

      document.addEventListener("mousemove", currentHandlers.handleDrag);
      document.addEventListener("mouseup", currentHandlers.handleDragEnd);
      document.addEventListener("touchmove", currentHandlers.handleDrag);
      document.addEventListener("touchend", currentHandlers.handleDragEnd);
    };

    // Store latest props/refs/helpers
    currentHandlers.onPositionChange = onPositionChangeTransformed;
    // No onPieceDrag in this version
    currentHandlers.fieldRef = fieldRef;
    currentHandlers.activeDragRef = activeDragRef;
    currentHandlers.toNormalized = toNormalized;
    currentHandlers.getOriginalPieceState = getOriginalPieceState;

    return () => {
      document.removeEventListener("mousemove", currentHandlers.handleDrag);
      document.removeEventListener("mouseup", currentHandlers.handleDragEnd);
      document.removeEventListener("touchmove", currentHandlers.handleDrag);
      document.removeEventListener("touchend", currentHandlers.handleDragEnd);
    };

  }, [
    onPositionChangeTransformed,
    isDraggable,
    toNormalized,
    onPieceSettings,
    getOriginalPieceState,
    isMobile,
  ]);

  const handleRightClick = (e, piece) => {
     e.preventDefault();
    if (onPieceSettings && getOriginalPieceState) {
      const originalPiece = getOriginalPieceState(piece.id) || piece;
      onPieceSettings(originalPiece);
    }
  };

  // Helper to calculate size based on type, size prop, and mobile status
  const getPieceStyle = (piece) => {
    let baseSize;
    if (piece.type === 'ball') {
      baseSize = baseBallSize;
    } else if (piece.type === 'cone') {
      baseSize = baseConeSize;
    } else {
      baseSize = basePlayerSize;
    }

    // Apply mobile scale factor *before* applying the piece's size setting
    const scale = (piece.size || 1.0) * (isMobile ? mobileScaleFactor : 1.0);
    
    const style = {
        width: `calc(${baseSize.w} * ${scale})`,
        height: `calc(${baseSize.h} * ${scale})`,
        transform: "translate(-50%, -50%)", // Base centering transform
        opacity: piece.opacity !== undefined ? piece.opacity : 1.0, // Apply Opacity
    };

    if (piece.type === 'cone') {
        // Cone visual: a triangle pointing up
        style.backgroundColor = colorMap[piece.color] || "#d97706";
        style.clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)';
        style.borderRadius = '0'; 
        style.boxShadow = 'none';
        style.color = '#000000'; // Ensure label text is black
    } else {
        // Player and Ball remain circles
        style.backgroundColor = colorMap[piece.color] || "transparent";
        style.borderRadius = '9999px'; // rounded-full
        style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)'; // shadow
    }

    return style;
  };
   // Helper to get label offset class
   const getLabelOffsetClass = (piece) => {
       // Also consider mobile scale here for positioning the label correctly relative to the piece size
       const scale = (piece.size || 1.0) * (isMobile ? mobileScaleFactor : 1.0);
       let baseOffset;

       if (piece.type === 'cone') {
           baseOffset = baseConeSize.labelOffset;
       } else if (piece.type === 'ball') {
           baseOffset = baseBallSize.labelOffset;
       } else {
           baseOffset = basePlayerSize.labelOffset;
       }

       // Simplified scaling for label offset to keep it reasonable
       if (scale < 0.7) return "-bottom-2 sm:-bottom-3";
       if (scale > 1.2) return "-bottom-4 sm:-bottom-6";
       return "-bottom-3 sm:-bottom-5"; 
   }


  return (
    <div
      ref={fieldRef}
      className={`relative w-full max-w-4xl mx-auto bg-green-100 border-4 border-green-700 rounded-xl overflow-hidden select-none ${
        isMobile ? "aspect-[2/3]" : "aspect-[3/2]"
      }`}
      style={{ touchAction: "none" }} // Prevent page scroll on touch drag
    >
       <div
        className={`absolute ${
          isMobile
            ? "h-1/2 w-full top-1/2 left-0 -translate-y-1/2"
            : "left-1/2 top-0 -translate-x-1/2 h-full w-1"
        } bg-green-700/20`}
      />

      {/* Render based on transformedPieces */}
      {transformedPieces.map((p) => (
        <motion.div
          key={p.id}
          onMouseDown={
            isDraggable
              ? (e) => dragHandlers.current.handleDragStart(e, p)
              : undefined
          }
          onTouchStart={
            isDraggable
              ? (e) => dragHandlers.current.handleDragStart(e, p)
              : undefined
          }
          onContextMenu={
            isDraggable ? (e) => handleRightClick(e, p) : undefined
          }
          // Animate position based on interpolatedPieces prop
          animate={{
            left: `${p.x * 100}%`,
            top: `${p.y * 100}%`,
          }}
          transition={{
            duration: 0.05, // Keep short duration for smoothness between updates
            ease: "linear",
          }}
          className={`absolute select-none ${
            isDraggable ? "cursor-grab" : "cursor-default"
          } dragging-piece:cursor-grabbing dragging-piece:z-10
          `} // Removed hardcoded rounded-full and shadow classes
          // Apply dynamic style for size, shape, color, and opacity
          style={getPieceStyle(p)}
        >
           {p.label && (
            <div className={`absolute left-1/2 -translate-x-1/2 text-[0.5rem] sm:text-xs font-semibold text-black ${getLabelOffsetClass(p)}`}>
              {p.label}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}