import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import WhiteboardCanvas from "../components/WhiteboardCanvas";
import ObjectButton from "../components/ObjectButton";
import PieceSettingsModal from "../components/PieceSettingsModal";
import { useMotionValue, animate } from "framer-motion";

const lerp = (a, b, t) => a + (b - a) * t;
const epsilon = 0.001; // Small tolerance for floating point comparison

// Feather Icons Skip Back/Forward (Blue)
const PrevIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="inline mr-1 text-blue-600 h-5 w-5">
        <polygon points="19 20 9 12 19 4 19 20"></polygon>
        <line x1="5" y1="19" x2="5" y2="5"></line>
    </svg>
);

const NextIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="inline ml-1 text-blue-600 h-5 w-5">
        <polygon points="5 4 15 12 5 20 5 4"></polygon>
        <line x1="19" y1="5" x2="19" y2="19"></line>
    </svg>
);


export default function EditPlay() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loaded, setLoaded] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  const [frames, setFrames] = useState([{ frame_number: 1, pieces: [] }]);
  const [fps, setFps] = useState(1);
  const [selectedPiece, setSelectedPiece] = useState(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const animationProgress = useMotionValue(0);
  const [sliderValue, setSliderValue] = useState(0);
  const [interpolatedPieces, setInterpolatedPieces] = useState([]);

  useEffect(() => {
     (async () => {
      try {
        const { data } = await api.get(`/plays/${id}`);
        setTitle(data.title);
        setDescription(data.description || "");
        setIsPrivate(data.is_private || false);
        const f = data.frame_data?.length
          ? data.frame_data.map((fr, i) => ({
              frame_number: i + 1,
              // Ensure size defaults to 1.0 and opacity to 1.0 if missing from loaded data
              pieces: (fr.pieces || []).map(p => ({...p, size: p.size || 1.0, opacity: p.opacity !== undefined ? p.opacity : 1.0 })),
            }))
          : [{ frame_number: 1, pieces: [] }];
        setFrames(f);
        if (f.length > 0) {
          setInterpolatedPieces(f[0].pieces);
        }
        if (data.frame_data?.[0]?.duration) {
          const loadedFps = 1 / data.frame_data[0].duration;
          setFps(loadedFps > 0 ? loadedFps : 1);
        }
        setLoaded(true);
      } catch {
        alert("Failed to load play");
        navigate("/plays/me");
      }
    })();
  }, [id, navigate]);

  const updateInterpolatedPieces = useCallback(
    (latestProgress) => {
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
            // Carry over size and opacity during interpolation
            return { ...p1, x: lerp(p1.x, p2.x, t), y: lerp(p1.y, p2.y, t), size: p1.size, opacity: p1.opacity };
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
      kind === "team1" ? "blue" 
      : kind === "team2" ? "red" 
      : kind === "team3" ? "green" 
      : kind === "team4" ? "purple" // New Team 4
      : "yellow"; // Default for 'ball' or 'cone'
    
    const type = kind === "cone" ? "cone" : (kind === "ball" ? "ball" : "player"); // New cone type
    
    const newObj = {
      id: Math.round(Date.now() + Math.random()), type, color, x: 0.5, y: 0.5,
      rotation: 0, size: 1.0, label: null, opacity: 1.0, // Default opacity 1.0
    };

    const currentIdx = Math.round(animationProgress.get()); // Get current frame index
    
    setFrames((prev) => {
      const newFrames = structuredClone(prev);
      
      // ONLY add to the current frame
      if (newFrames[currentIdx]) {
          newFrames[currentIdx].pieces.push(structuredClone(newObj)); 
          setInterpolatedPieces(newFrames[currentIdx].pieces); // Update visuals immediately
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
          pieces: f.pieces.map(p => ({...p, size: p.size || 1.0, opacity: p.opacity !== undefined ? p.opacity : 1.0 })) // Ensure size/opacity defaults are saved
      })),
      is_private: isPrivate,
    };
    await api.put(`/plays/${id}`, payload);
    navigate("/plays/me");
  }

  if (!loaded)
    return <div className="text-center text-gray-500 mt-10">Loading…</div>;

  function handlePieceSettings(piece) { setSelectedPiece(piece); }
  
  function handleDeletePiece(pieceId) {
    const currentFrameIdx = Math.round(animationProgress.get()); // Get current frame index
    setFrames((prev) => {
       const newFrames = structuredClone(prev); // Must clone to modify frame-by-frame
       
       // ONLY delete from the current frame
       if (newFrames[currentFrameIdx]) {
           newFrames[currentFrameIdx].pieces = newFrames[currentFrameIdx].pieces.filter((p) => p.id !== pieceId);
           setInterpolatedPieces(newFrames[currentFrameIdx].pieces); // Update visuals immediately
       }

       return newFrames;
    });
  }

  function handleUpdatePieceSettings(pieceId, label, size, opacity) {
      const currentFrameIdx = Math.round(animationProgress.get()); // Get the index of the current frame
      setFrames((prev) => {
      const newFrames = prev.map((frame, i) => {
        if (i === currentFrameIdx) { // Only update the current frame's pieces array
            return {
                ...frame,
                pieces: frame.pieces.map((p) =>
                    p.id === pieceId ? { ...p, label, size, opacity } : p // Apply frame-specific settings
                ),
            };
        }
        return frame; // Return all other frames as is
      });
       
       // Update visual representation immediately
       if (newFrames[currentFrameIdx]) {
           const updatedPiece = newFrames[currentFrameIdx].pieces.find(p => p.id === pieceId);
           if (updatedPiece) {
               setInterpolatedPieces(currentPieces =>
                   currentPieces.map(cp => cp.id === pieceId ? updatedPiece : cp)
               );
           } else {
               setInterpolatedPieces(newFrames[currentFrameIdx].pieces);
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
      <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-blue-700"> Edit Play </h2>
      <input type="text" placeholder="Play title…" className="border rounded-lg w-full p-2 sm:p-3 mb-4 text-base sm:text-lg focus:ring-2 focus:ring-blue-500" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea placeholder="Add a description (optional)..." className="border rounded-lg w-full p-2 sm:p-3 mb-4 text-sm sm:text-lg focus:ring-2 focus:ring-blue-500" value={description} onChange={(e) => setDescription(e.target.value)} rows="2" />
       {/* Updated Object Buttons for cone and team 4 - Now 3 columns on mobile */}
       <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2 sm:gap-3 mb-4">
        <ObjectButton color="blue" label="Team 1" onClick={() => addPiece("team1")}/>
        <ObjectButton color="red" label="Team 2" onClick={() => addPiece("team2")}/>
        <ObjectButton color="green" label="Team 3" onClick={() => addPiece("team3")}/>
        <ObjectButton color="purple" label="Team 4" onClick={() => addPiece("team4")} /> {/* New Team 4 */}
        <ObjectButton color="yellow" label="Ball" onClick={() => addPiece("ball")} />
        <ObjectButton color="yellow" label="Cone" onClick={() => addPiece("cone")} /> {/* New Cone (Yellow) */}
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
          {/* Row 1: Slider (with Knobs) */}
          <div className="flex items-center gap-3">
              <span className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">
                  Frame {Math.floor(sliderValue) + 1} / {frames.length}
              </span>
              
              {/* Container for slider and knobs */}
              <div className="relative w-full align-middle">
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

                  {/* NEW: Frame Knobs Container */}
                  {frames.length > 1 && (
                      <div className="frame-knobs-container">
                          {frames.map((frame, index) => {
                              // sliderValue is 0 for frame 1 (index 0), 1 for frame 2 (index 1)
                              // A knob is 'passed' if the sliderValue is >= its index.
                              const isPassed = sliderValue >= index;
                              
                              // Calculate position for each knob
                              const percent = (index / (frames.length - 1)) * 100;
                              
                              return (
                                  <div
                                      key={frame.frame_number || index}
                                      className={`frame-knob ${isPassed ? "passed" : ""}`}
                                      style={{ left: `${percent}%` }}
                                  />
                              );
                          })}
                      </div>
                  )}
              </div>
          </div>

          {/* Row 2: Buttons - Responsive Layout */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">

              {/* Group 1: Frame Nav (Always first, full width row on mobile) */}
              <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto order-1">
                 <button onClick={prevFrame} className="flex items-center justify-center flex-1 sm:flex-none px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-sm sm:text-base font-semibold" disabled={isPlaying}><PrevIcon /> Prev Frame</button>
                 <button onClick={nextFrame} className="flex items-center justify-center flex-1 sm:flex-none px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-sm sm:text-base font-semibold" disabled={isPlaying}>Next Frame <NextIcon /></button>
              </div>

              {/* Group 2: Frame Edit (Second row on mobile, middle group on desktop) */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-center order-2 sm:order-2">
                  <button onClick={() => addFrame(true)} className="flex-1 sm:flex-none px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm sm:text-base font-semibold"> + New Frame </button>
                  <button onClick={deleteFrame} className="flex-1 sm:flex-none px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm sm:text-base font-semibold" disabled={frames.length === 1}> Delete Frame </button>
              </div>

              {/* Group 3: Play/Speed (Third row on mobile, right group on desktop) */}
              <div className="flex items-center justify-start sm:justify-end gap-2 sm:gap-3 mt-4 sm:mt-0 w-full sm:w-auto order-3 sm:order-3">
                  <button onClick={handlePlayToggle} className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-sm sm:text-base font-semibold" disabled={frames.length < 2} title={ frames.length < 2 ? "Add at least 2 frames to play" : "" }> {isPlaying ? "Pause" : "Play"} </button>
                  <label className="text-xs sm:text-sm text-gray-700"> FPS </label>
                  <select className="border rounded-lg px-2 py-1 text-xs sm:text-sm" value={fps} onChange={(e) => setFps(Number(e.target.value))} disabled={isPlaying}>
                      <option value={0.5}>0.5</option> <option value={1}>1</option> <option value={2}>2</option> <option value={4}>4</option>
                  </select>
              </div>
          </div>
      </div>
      {/* --- END CONTROLS --- */}


      {/* Reduced top margin on mobile for Privacy Toggle */}
       <div className="mt-2 sm:mt-8 flex items-center justify-start gap-3">
        <label htmlFor="privacy-toggle" className="flex items-center cursor-pointer">
          <div className="relative"><input type="checkbox" id="privacy-toggle" className="sr-only" checked={isPrivate} onChange={() => setIsPrivate(!isPrivate)} /><div className={`block w-12 h-7 sm:w-14 sm:h-8 rounded-full transition-colors ${ isPrivate ? "bg-blue-600" : "bg-gray-400" }`}></div><div className={`dot absolute left-1 top-1 bg-white w-5 h-5 sm:w-6 sm:h-6 rounded-full transition-transform ${ isPrivate ? "transform translate-x-full" : "" }`}></div></div>
          <div className="ml-3 text-sm sm:text-base text-gray-700 font-medium"> Private Play <span className="hidden sm:inline text-sm text-gray-500 font-normal"> (only you can see it) </span> </div>
        </label>
      </div>
      <button onClick={handleSave} className="mt-6 w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"> Save Changes </button>
    </div>
  );
}