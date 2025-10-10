// src/pages/EditPlay.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import WhiteboardCanvas from "../components/WhiteboardCanvas";
import ObjectButton from "../components/ObjectButton";

export default function EditPlay() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loaded, setLoaded] = useState(false);
  const [title, setTitle] = useState("");

  const [frames, setFrames] = useState([{ frame_number: 1, pieces: [] }]);
  const [idx, setIdx] = useState(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [secondsPerFrame, setSecondsPerFrame] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/plays/${id}`);
        setTitle(data.title);
        const f = data.frame_data?.length
          ? data.frame_data.map((fr, i) => ({
              frame_number: i + 1,
              pieces: fr.pieces || [],
            }))
          : [{ frame_number: 1, pieces: [] }];
        setFrames(f);
        // try to derive duration from first frame (fallback 1)
        if (data.frame_data?.[0]?.duration) setSecondsPerFrame(data.frame_data[0].duration);
        setLoaded(true);
      } catch {
        alert("Failed to load play");
        navigate("/plays/me");
      }
    })();
  }, [id, navigate]);

  /** Logic for advancing frames during playback. Plays once from first to last frame. */
  useEffect(() => {
    if (!isPlaying || frames.length <= 1) return;
    
    // FIX: Always reset to frame 0 (index 0) immediately when playback starts
    setIdx(0); 
    let i = 0;
    
    // Set up the interval for frame transitions
    const t = setInterval(() => {
      i += 1;
      if (i >= frames.length) {
        clearInterval(t);
        setIsPlaying(false);
        return;
      }
      setIdx(i);
    }, secondsPerFrame * 1000);
    return () => clearInterval(t);
  }, [isPlaying, frames.length, secondsPerFrame]);

  // Current frame's piece data for display
  const pieces = useMemo(() => frames[idx]?.pieces ?? [], [frames, idx]);

  /** * Target positions for smooth animation: positions of the *next* frame.
   * This is the key for smooth animation.
   */
  const targetPositionsById = useMemo(() => {
    if (!isPlaying || frames.length < 2) return null;
    const nextIdx = idx + 1;

    // Stop animation when the next frame is the end of the array
    if (nextIdx >= frames.length) return null; 

    const nextFramePieces = frames[nextIdx]?.pieces ?? [];
    return nextFramePieces.reduce((acc, p) => {
      acc[p.id] = { x: p.x, y: p.y };
      return acc;
    }, {});
  }, [isPlaying, frames, idx]);


  /**
   * Adds a new piece to ALL frames at its initial position (0.5, 0.5).
   */
  function addPiece(kind) {
    const color = kind === "team1" ? "blue" : kind === "team2" ? "red" : kind === "team3" ? "green" : "yellow";
    const type = kind === "ball" ? "ball" : "player";
    const newObj = { 
        // Ensure ID is an integer to satisfy Pydantic schema
        id: Math.round(Date.now() + Math.random()), 
        type, 
        color, 
        x: 0.5, 
        y: 0.5, 
        rotation: 0,
        size: 1,
        label: null,
        opacity: 1,
    };

    setFrames((prev) => {
      const newFrames = structuredClone(prev); 

      newFrames.forEach(frame => {
          // Push a deep copy of the new piece to every frame's pieces list
          frame.pieces.push(structuredClone(newObj)); 
      });

      return newFrames;
    });
  }
  
  /**
   * Handler for drag event from WhiteboardCanvas. Updates position for piece ID in current frame.
   */
  function onPiecePositionChange(id, x, y) {
    setFrames((prev) => {
      const copy = structuredClone(prev);
      const pieceToUpdate = copy[idx].pieces.find(p => p.id === id);
      if (pieceToUpdate) {
        pieceToUpdate.x = x;
        pieceToUpdate.y = y;
      }
      return copy;
    });
  }

  function addFrame(copyCurrent = true) {
    setFrames((prev) => {
      // structuredClone ensures a deep copy of the previous frame's pieces
      const base = copyCurrent ? structuredClone(prev[idx]) : { frame_number: prev.length + 1, pieces: [] };
      const newFrame = { frame_number: prev.length + 1, pieces: base.pieces ?? [] };
      return [...prev, newFrame];
    });
    setIdx((i) => i + 1);
  }

  function deleteFrame() {
    setFrames((prev) => {
      if (prev.length === 1) return prev;
      const next = prev.slice();
      next.splice(idx, 1);
      next.forEach((f, i) => (f.frame_number = i + 1));
      return next;
    });
    setIdx((i) => Math.max(0, i - 1));
  }

  function prevFrame() { setIdx((i) => (i - 1 + frames.length) % frames.length); }
  function nextFrame() { setIdx((i) => (i + 1) % frames.length); }

  async function handleSave() {
    const payload = {
      title: title || "Untitled Play",
      description: "Edited in whiteboard",
      frame_data: frames.map((f, i) => ({
        frame_number: i + 1,
        duration: secondsPerFrame,
        pieces: f.pieces,
      })),
      is_private: false,
    };
    await api.put(`/plays/${id}`, payload);
    navigate("/plays/me");
  }

  if (!loaded) return <div className="text-center text-gray-500 mt-10">Loading…</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      <h2 className="text-3xl font-bold mb-6 text-blue-700">Edit Play</h2>

      <input
        type="text"
        placeholder="Play title…"
        className="border rounded-lg w-full p-3 mb-4 text-lg focus:ring-2 focus:ring-blue-500"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <div className="grid grid-cols-2 sm:flex gap-3 mb-4">
        <ObjectButton color="blue" label="Add Team 1 Player" onClick={() => addPiece("team1")} />
        <ObjectButton color="red" label="Add Team 2 Player" onClick={() => addPiece("team2")} />
        <ObjectButton color="green" label="Add Team 3 Player" onClick={() => addPiece("team3")} />
        <ObjectButton color="yellow" label="Add Ball" onClick={() => addPiece("ball")} />
      </div>

    
      <WhiteboardCanvas
        pieces={pieces}
        onPositionChange={onPiecePositionChange} // Corrected to match the function name
        targetPositionsById={targetPositionsById} 
        frameDurationSec={secondsPerFrame}
      />

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button 
            onClick={prevFrame} 
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
            disabled={isPlaying}
          >
            ◀ Prev
          </button>
          <div className="px-3 py-2 rounded-lg bg-gray-100 text-sm">Frame <b>{idx + 1}</b> / {frames.length}</div>
          <button 
            onClick={nextFrame} 
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
            disabled={isPlaying}
          >
            Next ▶
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => addFrame(true)} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">+ New Frame (copy)</button>
          <button onClick={deleteFrame} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700" disabled={frames.length === 1}>Delete Frame</button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlaying((p) => !p)}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 w-full sm:w-auto"
            disabled={frames.length < 2}
            title={frames.length < 2 ? "Add at least 2 frames to play" : ""}
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
          <label className="text-sm text-gray-700">Sec/frame</label>
          <select
            className="border rounded-lg px-2 py-1"
            value={secondsPerFrame}
            onChange={(e) => setSecondsPerFrame(Number(e.target.value))}
            disabled={isPlaying}
          >
            <option value={0.25}>0.25</option>
            <option value={0.5}>0.5</option>
            <option value={1}>1</option>
            <option value={2}>2</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleSave}
        className="mt-8 w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
      >
        Save Changes
      </button>
    </div>
  );
}