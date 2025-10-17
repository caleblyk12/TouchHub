import { useMemo, useState, useEffect } from "react";
import WhiteboardCanvas from "../components/WhiteboardCanvas";
import ObjectButton from "../components/ObjectButton";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import PieceSettingsModal from "../components/PieceSettingsModal";

export default function CreatePlay() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("Untitled Play");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  const [frames, setFrames] = useState([{ frame_number: 1, pieces: [] }]);
  const [idx, setIdx] = useState(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [justStartedPlaying, setJustStartedPlaying] = useState(false);
  const [secondsPerFrame, setSecondsPerFrame] = useState(1);

  const [selectedPiece, setSelectedPiece] = useState(null);

  const pieces = useMemo(() => frames[idx]?.pieces ?? [], [frames, idx]);

  useEffect(() => {
    if (!isPlaying || frames.length <= 1) return;

    setIdx(0);
    setJustStartedPlaying(true);
    const resetTimeout = setTimeout(() => setJustStartedPlaying(false), 50);

    let i = 0;
    const t = setInterval(() => {
      i += 1;
      if (i >= frames.length) {
        clearInterval(t);
        setIsPlaying(false);
        return;
      }
      setIdx(i);
    }, secondsPerFrame * 1000);
    return () => {
      clearTimeout(resetTimeout);
      clearInterval(t);
    };
  }, [isPlaying, frames.length, secondsPerFrame]);

  const targetPositionsById = useMemo(() => {
    if (!isPlaying || frames.length < 2 || justStartedPlaying) return null;
    const nextIdx = idx + 1;

    if (nextIdx >= frames.length) return null;

    const nextFramePieces = frames[nextIdx]?.pieces ?? [];
    return nextFramePieces.reduce((acc, p) => {
      acc[p.id] = { x: p.x, y: p.y };
      return acc;
    }, {});
  }, [isPlaying, frames, idx, justStartedPlaying]);

  function addPiece(kind) {
    const color =
      kind === "team1"
        ? "blue"
        : kind === "team2"
        ? "red"
        : kind === "team3"
        ? "green"
        : "yellow";
    const type = kind === "ball" ? "ball" : "player";
    const newObj = {
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
      newFrames.forEach((frame) => {
        frame.pieces.push(structuredClone(newObj));
      });
      return newFrames;
    });
  }

  function onPiecePositionChange(id, x, y) {
    setFrames((prev) => {
      const copy = structuredClone(prev);
      const pieceToUpdate = copy[idx].pieces.find((p) => p.id === id);
      if (pieceToUpdate) {
        pieceToUpdate.x = x;
        pieceToUpdate.y = y;
      }
      return copy;
    });
  }

  function addFrame(copyCurrent = true) {
    setFrames((prev) => {
      const base = copyCurrent
        ? structuredClone(prev[idx])
        : { frame_number: prev.length + 1, pieces: [] };
      const newFrame = {
        frame_number: prev.length + 1,
        pieces: base.pieces ?? [],
      };
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

  function prevFrame() {
    setIdx((i) => (i - 1 + frames.length) % frames.length);
  }
  function nextFrame() {
    setIdx((i) => (i + 1) % frames.length);
  }

  async function handleSave() {
    const payload = {
      title: title || "Untitled Play",
      description: description,
      frame_data: frames.map((f, i) => ({
        frame_number: i + 1,
        duration: secondsPerFrame,
        pieces: f.pieces,
      })),
      is_private: isPrivate,
    };
    try {
      await api.post("/plays/", payload);
      navigate("/plays/me");
    } catch (error) {
      alert("Failed to save play. Please try again.");
    }
  }

  function handlePieceSettings(piece) {
    setSelectedPiece(piece);
  }

  function handleDeletePiece(pieceId) {
    setFrames((prev) =>
      prev.map((frame) => ({
        ...frame,
        pieces: frame.pieces.filter((p) => p.id !== pieceId),
      }))
    );
  }

  function handleUpdatePieceLabel(pieceId, label) {
    setFrames((prev) =>
      prev.map((frame) => ({
        ...frame,
        pieces: frame.pieces.map((p) =>
          p.id === pieceId ? { ...p, label } : p
        ),
      }))
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-700 font-semibold mb-4"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back
      </button>

      <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-blue-700">
        Create New Play
      </h2>

      <input
        type="text"
        placeholder="Play title…"
        className="border rounded-lg w-full p-2 sm:p-3 mb-4 text-base sm:text-lg focus:ring-2 focus:ring-blue-500"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        placeholder="Add a description (optional)..."
        className="border rounded-lg w-full p-2 sm:p-3 mb-4 text-base sm:text-lg focus:ring-2 focus:ring-blue-500"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows="2"
      />

      <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-3 mb-4">
        <ObjectButton
          color="blue"
          label="Team 1"
          onClick={() => addPiece("team1")}
        />
        <ObjectButton
          color="red"
          label="Team 2"
          onClick={() => addPiece("team2")}
        />
        <ObjectButton
          color="green"
          label="Team 3"
          onClick={() => addPiece("team3")}
        />
        <ObjectButton color="yellow" label="Ball" onClick={() => addPiece("ball")} />
      </div>

      <WhiteboardCanvas
        pieces={pieces}
        onPositionChange={onPiecePositionChange}
        targetPositionsById={targetPositionsById}
        frameDurationSec={secondsPerFrame}
        onPieceSettings={handlePieceSettings}
      />

      {selectedPiece && (
        <PieceSettingsModal
          piece={selectedPiece}
          onClose={() => setSelectedPiece(null)}
          onDelete={handleDeletePiece}
          onSave={handleUpdatePieceLabel}
        />
      )}

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={prevFrame}
            className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-sm sm:text-base"
            disabled={isPlaying}
          >
            ◀ Prev
          </button>
          <div className="px-3 py-2 rounded-lg bg-gray-100 text-xs sm:text-sm">
            Frame <b>{idx + 1}</b> / {frames.length}
          </div>
          <button
            onClick={nextFrame}
            className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-sm sm:text-base"
            disabled={isPlaying}
          >
            Next ▶
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => addFrame(true)}
            className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm sm:text-base"
          >
            + New Frame
          </button>
          <button
            onClick={deleteFrame}
            className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm sm:text-base"
            disabled={frames.length === 1}
          >
            Delete
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsPlaying((p) => !p)}
            className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 w-full sm:w-auto text-sm sm:text-base"
            disabled={frames.length < 2}
            title={
              frames.length < 2 ? "Add at least 2 frames to play" : ""
            }
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
          <label className="text-xs sm:text-sm text-gray-700">
            Sec/frame
          </label>
          <select
            className="border rounded-lg px-2 py-1 text-xs sm:text-sm"
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

      <div className="mt-8 flex items-center justify-start gap-3">
        <label
          htmlFor="privacy-toggle"
          className="flex items-center cursor-pointer"
        >
          <div className="relative">
            <input
              type="checkbox"
              id="privacy-toggle"
              className="sr-only"
              checked={isPrivate}
              onChange={() => setIsPrivate(!isPrivate)}
            />
            <div
              className={`block w-12 h-7 sm:w-14 sm:h-8 rounded-full transition-colors ${
                isPrivate ? "bg-blue-600" : "bg-gray-400"
              }`}
            ></div>
            <div
              className={`dot absolute left-1 top-1 bg-white w-5 h-5 sm:w-6 sm:h-6 rounded-full transition-transform ${
                isPrivate ? "transform translate-x-full" : ""
              }`}
            ></div>
          </div>
          <div className="ml-3 text-sm sm:text-base text-gray-700 font-medium">
            Private Play{" "}
            <span className="hidden sm:inline text-sm text-gray-500 font-normal">
              (only you can see it)
            </span>
          </div>
        </label>
      </div>

      <button
        onClick={handleSave}
        className="mt-6 w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
      >
        Save Play
      </button>
    </div>
  );
}