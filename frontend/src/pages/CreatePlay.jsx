import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import WhiteboardCanvas from "../components/WhiteboardCanvas";
import ObjectButton from "../components/ObjectButton";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import PieceSettingsModal from "../components/PieceSettingsModal";
import { useMotionValue, animate } from "framer-motion";

const lerp = (a, b, t) => a + (b - a) * t;
const epsilon = 0.001; // Small tolerance for floating point comparison

// SVG Icons for Frame Navigation
const PrevIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

const NextIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);


export default function CreatePlay() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("Untitled Play");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  const [frames, setFrames] = useState([{ frame_number: 1, pieces: [] }]);
  const [fps, setFps] = useState(1);
  const [selectedPiece, setSelectedPiece] = useState(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const animationProgress = useMotionValue(0);
  const [sliderValue, setSliderValue] = useState(0);
  const [interpolatedPieces, setInterpolatedPieces] = useState(frames[0].pieces);

  const updateInterpolatedPieces = useCallback((latestProgress) => {
        if (!frames.length) return;
        const currentIdx = Math.floor(latestProgress);
        const nextIdx = Math.min(frames.length - 1, Math.ceil(latestProgress));
        const t = latestProgress % 1;
        setSliderValue(latestProgress);
        if (currentIdx === nextIdx || t === 0) {
            if (frames[currentIdx]) setInterpolatedPieces(frames[currentIdx].pieces);
            return;
        }
        const currentPieces = frames[currentIdx]?.pieces || [];
        const nextPieces = frames[nextIdx]?.pieces || [];
        const nextPiecesById = new Map(nextPieces.map((p) => [p.id, p]));
        const newPieces = currentPieces.map((p1) => {
            const p2 = nextPiecesById.get(p1.id);
            if (!p2) return p1;
            // Carry over size during interpolation
            return { ...p1, x: lerp(p1.x, p2.x, t), y: lerp(p1.y, p2.y, t), size: p1.size };
        });
        setInterpolatedPieces(newPieces);
    },
    [frames]
  );

  useEffect(() => {
    if (frames.length > 0) {
         updateInterpolatedPieces(animationProgress.get());
    }
    const unsubscribe = animationProgress.on("change", updateInterpolatedPieces);
    return () => unsubscribe();
  }, [animationProgress, frames, updateInterpolatedPieces]);

  function handlePlayToggle() {
    if (frames.length < 2) return;
    const newIsPlaying = !isPlaying;
    setIsPlaying(newIsPlaying);
    if (newIsPlaying) {
      let currentProgress = animationProgress.get();
      if (currentProgress >= frames.length - 1) { currentProgress = 0; animationProgress.set(0); }
      const totalFrames = frames.length - 1;
      const frameDuration = 1 / fps;
      const remainingProgress = totalFrames - currentProgress;
      const remainingDuration = remainingProgress * frameDuration;
      animate(animationProgress, totalFrames, { duration: remainingDuration, ease: "linear", onComplete: () => setIsPlaying(false) });
    } else {
      animationProgress.stop();
    }
  }

  function addPiece(kind) {
     const color =
      kind === "team1" ? "blue" : kind === "team2" ? "red" : kind === "team3" ? "green" : "yellow";
    const type = kind === "ball" ? "ball" : "player";
    const newObj = {
      id: Math.round(Date.now() + Math.random()), type, color, x: 0.5, y: 0.5,
      rotation: 0, size: 1.0, label: null, opacity: 1, // Add default size
    };
    setFrames((prev) => {
      const newFrames = structuredClone(prev);
      newFrames.forEach((frame) => { frame.pieces.push(structuredClone(newObj)); });
      const currentIdx = Math.round(animationProgress.get());
       if (newFrames[currentIdx]) {
          setInterpolatedPieces(newFrames[currentIdx].pieces);
      }
      return newFrames;
    });
  }

  const getOriginalPieceState = useCallback((pieceId) => {
    const currentFrameIdx = Math.round(animationProgress.get());
    const currentFrame = frames[currentFrameIdx];
    return currentFrame?.pieces.find(p => p.id === pieceId);
  }, [frames, animationProgress]);

  function onPiecePositionChange(id, x, y) {
      const nearestFrameIdx = Math.round(animationProgress.get());
      animationProgress.set(nearestFrameIdx); // Snap visual progress

      setFrames((prev) => {
          const copy = structuredClone(prev);
          if (copy[nearestFrameIdx]) {
              const pieceToUpdate = copy[nearestFrameIdx].pieces.find((p) => p.id === id);
              if (pieceToUpdate) { pieceToUpdate.x = x; pieceToUpdate.y = y; }
          }
          if (copy[nearestFrameIdx]) {
             setInterpolatedPieces(copy[nearestFrameIdx].pieces); // Update visuals
         }
          return copy;
      });
  }

  function addFrame(copyCurrent = true) {
    const currentFrameIdx = Math.round(animationProgress.get());
    setFrames((prev) => {
      const base = copyCurrent ? structuredClone(prev[currentFrameIdx]) : { frame_number: 0, pieces: [] };
      const newFrame = { ...base, frame_number: 0 };
      const newFrames = [...prev];
      newFrames.splice(currentFrameIdx + 1, 0, newFrame);
      const finalFrames = newFrames.map((f, i) => ({ ...f, frame_number: i + 1 }));
      setInterpolatedPieces(finalFrames[currentFrameIdx + 1].pieces);
      return finalFrames;
    });
    animationProgress.set(currentFrameIdx + 1);
  }

  function deleteFrame() {
    if (frames.length === 1) return;
    const currentFrameIdx = Math.round(animationProgress.get());
    const newIdx = Math.max(0, currentFrameIdx - 1);
    setFrames((prev) => {
      const next = prev.slice();
      next.splice(currentFrameIdx, 1);
      const finalFrames = next.map((f, i) => ({ ...f, frame_number: i + 1 }));
       setInterpolatedPieces(finalFrames[newIdx].pieces);
      return finalFrames;
    });
    animationProgress.set(newIdx);
  }

 function prevFrame() {
     const targetIdx = Math.max(0, Math.floor(animationProgress.get() - 0.01));
     animationProgress.set(targetIdx);
     setInterpolatedPieces(frames[targetIdx]?.pieces || []);
  }
  function nextFrame() {
     const targetIdx = Math.min(frames.length - 1, Math.floor(animationProgress.get() + 1));
     animationProgress.set(targetIdx);
     setInterpolatedPieces(frames[targetIdx]?.pieces || []);
  }

  async function handleSave() {
    const payload = {
      title: title || "Untitled Play", description: description,
      frame_data: frames.map((f, i) => ({
          frame_number: i + 1,
          duration: 1 / fps,
          pieces: f.pieces.map(p => ({...p, size: p.size || 1.0 })) // Ensure size defaults to 1.0
      })),
      is_private: isPrivate,
    };
    try {
      await api.post("/plays/", payload);
      navigate("/plays/me");
    } catch (error) {
      console.error("Save failed:", error);
      alert("Failed to save play. Please try again.");
    }
  }

 function handlePieceSettings(piece) { setSelectedPiece(piece); }
  function handleDeletePiece(pieceId) {
    setFrames((prev) => {
       const newFrames = prev.map((frame) => ({ ...frame, pieces: frame.pieces.filter((p) => p.id !== pieceId) }));
       const currentIdx = Math.round(animationProgress.get());
       if (newFrames[currentIdx]) {
           setInterpolatedPieces(newFrames[currentIdx].pieces);
       }
       return newFrames;
    });
  }

  function handleUpdatePieceSettings(pieceId, label, size) {
     setFrames((prev) => {
      const newFrames = prev.map((frame) => ({
        ...frame,
        pieces: frame.pieces.map((p) =>
          p.id === pieceId ? { ...p, label, size } : p
        ),
      }));
       const currentIdx = Math.round(animationProgress.get());
       if (newFrames[currentIdx]) {
           const updatedPiece = newFrames[currentIdx].pieces.find(p => p.id === pieceId);
           if (updatedPiece) {
               setInterpolatedPieces(currentPieces =>
                   currentPieces.map(cp => cp.id === pieceId ? updatedPiece : cp)
               );
           } else {
               setInterpolatedPieces(newFrames[currentIdx].pieces);
           }
       }
       return newFrames;
     });
  }

  // Calculate slider progress percentage
  const sliderProgressPercent = frames.length > 1 ? (sliderValue / (frames.length - 1)) * 100 : 0;


  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
       <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-700 font-semibold mb-4"> <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg> Back </button>
      <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-blue-700"> Create New Play </h2> {/* Reverted Title Size */}
      <input type="text" placeholder="Play title…" className="border rounded-lg w-full p-2 sm:p-3 mb-4 text-base sm:text-lg focus:ring-2 focus:ring-blue-500" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea placeholder="Add a description (optional)..." className="border rounded-lg w-full p-2 sm:p-3 mb-4 text-sm sm:text-lg focus:ring-2 focus:ring-blue-500" value={description} onChange={(e) => setDescription(e.target.value)} rows="2" /> {/* Reverted Description Size */}
       <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3 mb-4">
        <ObjectButton color="blue" label="Team 1" onClick={() => addPiece("team1")}/>
        <ObjectButton color="red" label="Team 2" onClick={() => addPiece("team2")}/>
        <ObjectButton color="green" label="Team 3" onClick={() => addPiece("team3")}/>
        <ObjectButton color="yellow" label="Ball" onClick={() => addPiece("ball")} />
      </div>

      <WhiteboardCanvas
        pieces={interpolatedPieces}
        onPositionChange={onPiecePositionChange}
        onPieceSettings={handlePieceSettings}
        getOriginalPieceState={getOriginalPieceState}
      />

      {selectedPiece && (
          <PieceSettingsModal
              piece={selectedPiece}
              onClose={() => setSelectedPiece(null)}
              onDelete={handleDeletePiece}
              onSave={handleUpdatePieceSettings}
          />
       )}

      {/* --- UPDATED Controls Section --- */}
      <div className="mt-6 space-y-4">
          {/* Row 1: Slider (No Knobs) */}
          <div className="flex items-center gap-3">
              <span className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">
                  Frame {Math.floor(sliderValue) + 1} / {frames.length}
              </span>
              <input
                  type="range" min="0" max={frames.length > 1 ? frames.length - 1 : 0} step={0.01} value={sliderValue}
                  onChange={(e) => {
                      if (isPlaying) { animationProgress.stop(); setIsPlaying(false); }
                      const val = Number(e.target.value);
                      animationProgress.set(val);
                      updateInterpolatedPieces(val);
                  }}
                  disabled={frames.length < 2} className="timeline-slider w-full"
                  style={{ '--progress': `${sliderProgressPercent}%` }} title="Scrub through animation"
              />
          </div>

          {/* Row 2: Buttons - Responsive Layout */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">

              {/* Group 1: Frame Nav (Always first, full width row on mobile) */}
              <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto order-1">
                  <button onClick={prevFrame} className="flex-1 sm:flex-none px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-sm sm:text-base" disabled={isPlaying}><PrevIcon /> Prev Frame</button> {/* Added Icon, Reverted Font Size & Height */}
                  <button onClick={nextFrame} className="flex-1 sm:flex-none px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-sm sm:text-base" disabled={isPlaying}>Next Frame <NextIcon /></button> {/* Added Icon, Reverted Font Size & Height */}
              </div>

              {/* Group 2: Frame Edit (Second row on mobile, middle group on desktop) */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-center order-2 sm:order-2">
                  <button onClick={() => addFrame(true)} className="flex-1 sm:flex-none px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm sm:text-base"> + New Frame </button> {/* Reverted Font Size & Height */}
                  <button onClick={deleteFrame} className="flex-1 sm:flex-none px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm sm:text-base" disabled={frames.length === 1}> Delete Frame </button> {/* Reverted Font Size & Height */}
              </div>

              {/* Group 3: Play/Speed (Third row on mobile, right group on desktop) */}
              {/* Added justify-start for mobile left alignment, increased top margin */}
              <div className="flex items-center justify-start sm:justify-end gap-2 sm:gap-3 mt-4 sm:mt-0 w-full sm:w-auto order-3 sm:order-3"> {/* Added mt-4 sm:mt-0 */}
                  <button onClick={handlePlayToggle} className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-sm sm:text-base" disabled={frames.length < 2} title={ frames.length < 2 ? "Add at least 2 frames to play" : "" }> {isPlaying ? "Pause" : "Play"} </button> {/* Reverted Font Size */}
                  <label className="text-xs sm:text-sm text-gray-700"> FPS </label>
                  <select className="border rounded-lg px-2 py-1 text-xs sm:text-sm" value={fps} onChange={(e) => setFps(Number(e.target.value))} disabled={isPlaying}>
                      <option value={0.5}>0.5</option> <option value={1}>1</option> <option value={2}>2</option> <option value={4}>4</option>
                  </select>
              </div>
          </div>
      </div>
      {/* --- END CONTROLS --- */}


       <div className="mt-2 sm:mt-8 flex items-center justify-start gap-3"> {/* Privacy Toggle - Reduced top margin on mobile */}
        <label htmlFor="privacy-toggle" className="flex items-center cursor-pointer">
          <div className="relative"><input type="checkbox" id="privacy-toggle" className="sr-only" checked={isPrivate} onChange={() => setIsPrivate(!isPrivate)} /><div className={`block w-12 h-7 sm:w-14 sm:h-8 rounded-full transition-colors ${ isPrivate ? "bg-blue-600" : "bg-gray-400" }`}></div><div className={`dot absolute left-1 top-1 bg-white w-5 h-5 sm:w-6 sm:h-6 rounded-full transition-transform ${ isPrivate ? "transform translate-x-full" : "" }`}></div></div>
          <div className="ml-3 text-sm sm:text-base text-gray-700 font-medium"> Private Play <span className="hidden sm:inline text-sm text-gray-500 font-normal"> (only you can see it) </span> </div>
        </label>
      </div>
      <button onClick={handleSave} className="mt-6 w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"> Save Play </button>
    </div>
  );
}