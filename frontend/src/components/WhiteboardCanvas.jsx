import { motion } from "framer-motion";
import { useRef } from "react";

const colors = {
  team1: "#2563eb",
  team2: "#dc2626",
  team3: "#16a34a",
  ball: "#f59e0b",
};

/**
 * pieces: [{id, type, color|team, x, y}]  x,y in 0–1 field coords
 * targetPositionsById: optional map { [id]: { x, y } } used for playback/preview
 */
export default function WhiteboardCanvas({ pieces, setPieces, targetPositionsById, frameDurationSec = 1, onPositionChange }) {
  const fieldRef = useRef(null);

  /** Convert absolute pointer position to normalized 0–1 within field */
  function toNormalized(point) {
    const rect = fieldRef.current.getBoundingClientRect();
    const x = (point.x - rect.left) / rect.width;
    const y = (point.y - rect.top) / rect.height;
    return { x: clamp(x), y: clamp(y) };
  }

  /** update continuously while dragging for responsive feel */
  function handleDrag(id, _, info) {
    const { x, y } = toNormalized(info.point);
    setPieces((prev) => prev.map((p) => (p.id === id ? { ...p, x, y } : p)));
    if (onPositionChange) onPositionChange(id, x, y);
  }

  /** snap once at end (safety) */
  function handleDragEnd(id, _, info) {
    const { x, y } = toNormalized(info.point);
    setPieces((prev) => prev.map((p) => (p.id === id ? { ...p, x, y } : p)));
    if (onPositionChange) onPositionChange(id, x, y);
  }

  function clamp(v) {
    return Math.max(0, Math.min(1, v));
  }

  return (
    <div
      ref={fieldRef}
      className="relative w-full max-w-4xl mx-auto aspect-[3/2] bg-green-100 border-4 border-green-700 rounded-xl overflow-hidden select-none"
    >
      <div className="absolute left-1/2 top-0 -translate-x-1/2 h-full w-1 bg-green-700/20" />

      {pieces.map((p) => (
        <motion.div
          key={p.id}
          drag
          dragMomentum={false}
          dragConstraints={fieldRef}
          onDrag={(e, info) => handleDrag(p.id, e, info)}
          onDragEnd={(e, info) => handleDragEnd(p.id, e, info)}
          animate={{
            left: `${(targetPositionsById?.[p.id]?.x ?? p.x) * 100}%`,
            top: `${(targetPositionsById?.[p.id]?.y ?? p.y) * 100}%`,
          }}
          transition={{ duration: targetPositionsById ? frameDurationSec : 0, ease: "linear" }}
          className="absolute rounded-full shadow cursor-grab active:cursor-grabbing"
          style={{
            width: p.type === "ball" ? 18 : 26,
            height: p.type === "ball" ? 18 : 26,
            translateX: "-50%",
            translateY: "-50%",
            backgroundColor:
              p.type === "ball" ? colors.ball : colors[p.color] ?? colors[p.team],
          }}
        />
      ))}
    </div>
  );
}
