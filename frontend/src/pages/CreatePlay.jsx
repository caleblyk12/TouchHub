import { useEffect, useState } from "react";
import WhiteboardCanvas from "../components/WhiteboardCanvas";
import api from "../api/axios";

export default function CreatePlay() {
  const [frames, setFrames] = useState([{ id: 1, positions: {} }]);
  const [frameIndex, setFrameIndex] = useState(0);
  const [pieces, setPieces] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  // Ensure the current frame has a snapshot for all pieces (no leakage via fallback)
  useEffect(() => {
    if (isPlaying) return;
    setFrames((prev) => {
      const copy = [...prev];
      const current = copy[frameIndex] || { id: frameIndex + 1, positions: {} };
      const positions = { ...(current.positions || {}) };
      let changed = false;
      for (const p of pieces) {
        if (!positions[p.id]) {
          positions[p.id] = { x: p.x, y: p.y };
          changed = true;
        }
      }
      if (changed) copy[frameIndex] = { id: frameIndex + 1, positions };
      return copy;
    });
  }, [pieces, frameIndex, isPlaying]);

  /** play once from first → last frame; animate from current to next */
  useEffect(() => {
    if (!isPlaying || frames.length < 2) return;
    let i = 0;
    setFrameIndex(0);
    // ensure starting pose matches frame 0
    const f0 = frames[0]?.positions || {};
    setPieces((prev) => prev.map((p) => (f0[p.id] ? { ...p, x: f0[p.id].x, y: f0[p.id].y } : p)));

    const timer = setInterval(() => {
      i++;
      // landed on frame i
      if (i >= frames.length) {
        clearInterval(timer);
        setIsPlaying(false);
        return;
      }
      setFrameIndex(i);
      const fx = frames[i]?.positions || {};
      setPieces((prev) => prev.map((p) => (fx[p.id] ? { ...p, x: fx[p.id].x, y: fx[p.id].y } : p)));

      if (i >= frames.length - 1) {
        // last frame; next tick would stop
        clearInterval(timer);
        setIsPlaying(false);
      }
    }, speed * 1000);
    return () => clearInterval(timer);
  }, [isPlaying, speed, frames]);

  /** when not playing, switching frames should immediately reflect that frame's snapshot */
  useEffect(() => {
    if (isPlaying) return;
    const pos = frames[frameIndex]?.positions || {};
    setPieces((prev) => prev.map((p) => (pos[p.id] ? { ...p, x: pos[p.id].x, y: pos[p.id].y } : p)));
  }, [frameIndex, isPlaying, frames]);

  function addPiece(kind) {
    const newPiece = {
      id: Date.now(),
      type: kind === "ball" ? "ball" : "player",
      color: kind,
      x: 0.5,
      y: 0.5,
    };
    setPieces((prev) => [...prev, newPiece]);
    // ensure every frame has a position for this piece to avoid fallback leakage
    setFrames((prev) => prev.map((f, i) => {
      const positions = { ...(f.positions || {}) };
      if (positions[newPiece.id] == null) {
        // copy from current frame if available, otherwise use newPiece default
        const base = (prev[frameIndex]?.positions?.[newPiece.id]) || { x: newPiece.x, y: newPiece.y };
        positions[newPiece.id] = { x: base.x, y: base.y };
      }
      return { id: i + 1, positions };
    }));
  }

  /** snapshot current positions into current frame */
  function saveFrame() {
    const snap = {};
    pieces.forEach((p) => (snap[p.id] = { x: p.x, y: p.y }));
    setFrames((prev) => {
      const copy = [...prev];
      copy[frameIndex] = { id: frameIndex + 1, positions: snap };
      return copy;
    });
  }

  function newFrame() {
    saveFrame();
    const clone = JSON.parse(JSON.stringify(frames[frameIndex]));
    setFrames((prev) => [...prev, clone]);
    setFrameIndex(frames.length);
  }

  /** move to a specific frame index and sync piece positions */
  function goToFrame(nextIdx) {
    // snapshot current before leaving
    const snap = {};
    pieces.forEach((p) => (snap[p.id] = { x: p.x, y: p.y }));
    setFrames((prev) => {
      const copy = [...prev];
      copy[frameIndex] = { id: frameIndex + 1, positions: snap };
      return copy;
    });

    setFrameIndex(nextIdx);

    const targetPositions = frames[nextIdx]?.positions || {};
    setPieces((prev) =>
      prev.map((p) => {
        const pos = targetPositions[p.id];
        return pos ? { ...p, x: pos.x, y: pos.y } : p;
      })
    );
  }

  function prevFrame() {
    const nextIdx = (frameIndex - 1 + frames.length) % frames.length;
    goToFrame(nextIdx);
  }

  function nextFrame() {
    const nextIdx = (frameIndex + 1) % frames.length;
    goToFrame(nextIdx);
  }

  async function handleSave() {
    const payload = {
      title: "My play",
      frame_data: frames.map((f, i) => ({
        frame_number: i + 1,
        duration: speed,
        pieces: pieces.map((p) => ({
          id: p.id,
          type: p.type,
          color: p.color ?? p.team,
          x: f.positions[p.id]?.x ?? p.x,
          y: f.positions[p.id]?.y ?? p.y,
          rotation: 0,
          size: 1,
          label: null,
          opacity: 1,
        })),
      })),
      is_private: false,
      description: "",
    };
    await api.post("/plays/", payload);
  }

  // while playing, animate toward next frame's positions
  const playingFrame = isPlaying ? (frames[frameIndex + 1]?.positions || null) : null;

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
      <div className="flex gap-2 flex-wrap justify-center">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={() => addPiece("team1")}
        >
          + Team1
        </button>
        <button
          className="bg-red-600 text-white px-4 py-2 rounded"
          onClick={() => addPiece("team2")}
        >
          + Team2
        </button>
        <button
          className="bg-green-600 text-white px-4 py-2 rounded"
          onClick={() => addPiece("team3")}
        >
          + Team3
        </button>
        <button
          className="bg-yellow-500 px-4 py-2 rounded"
          onClick={() => addPiece("ball")}
        >
          + Ball
        </button>
      </div>

      <WhiteboardCanvas
        pieces={pieces}
        setPieces={setPieces}
        targetPositionsById={playingFrame}
        frameDurationSec={speed}
        onPositionChange={(id, x, y) => {
          // persist into current frame snapshot immediately
          setFrames((prev) => {
            const copy = [...prev];
            const current = copy[frameIndex] || { id: frameIndex + 1, positions: {} };
            const positions = { ...(current.positions || {}) };
            positions[id] = { x, y };
            copy[frameIndex] = { id: frameIndex + 1, positions };
            return copy;
          });
        }}
      />

      <div className="flex flex-col gap-3 items-center">
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-2 rounded bg-gray-200"
            onClick={prevFrame}
          >
            ◀ Prev
          </button>
          <div className="px-3 py-2 bg-gray-100 rounded text-sm">
            Frame <b>{frameIndex + 1}</b> / {frames.length}
          </div>
          <button
            className="px-3 py-2 rounded bg-gray-200"
            onClick={nextFrame}
          >
            Next ▶
          </button>
        </div>

        <div className="flex gap-2 justify-center">
        <button
          className="bg-gray-200 px-4 py-2 rounded"
          onClick={saveFrame}
        >
          Save Frame
        </button>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={newFrame}
        >
          New Frame
        </button>
          <button
            className="bg-indigo-600 text-white px-4 py-2 rounded"
            onClick={handleSave}
            title="Save this play to your account"
          >
            Save Play
          </button>
        <button
          className="bg-emerald-600 text-white px-4 py-2 rounded"
          onClick={() => setIsPlaying((p) => !p)}
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
          <label className="text-sm text-gray-700 self-center">Sec/frame</label>
          <select
            className="border rounded px-2 py-1"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          >
            <option value={0.25}>0.25</option>
            <option value={0.5}>0.5</option>
            <option value={1}>1</option>
            <option value={2}>2</option>
          </select>
        </div>
      </div>
    </div>
  );
}


