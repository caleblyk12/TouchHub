// src/pages/PlayDetails.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import WhiteboardCanvas from "../components/WhiteboardCanvas";
import { useAuth } from "../context/AuthContext";
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


export default function PlayDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [play, setPlay] = useState(null);
  const [frames, setFrames] = useState([{ frame_number: 1, pieces: [] }]);
  const [fps, setFps] = useState(1);
  const [loaded, setLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const animationProgress = useMotionValue(0);
  const [sliderValue, setSliderValue] = useState(0);
  const [interpolatedPieces, setInterpolatedPieces] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/plays/${id}`);
        setPlay(data);
        const f = data.frame_data?.length
          ? data.frame_data.map((fr, i) => ({
              frame_number: i + 1,
              // Ensure size defaults to 1.0 and opacity to 1.0 if missing from loaded data
              pieces: (fr.pieces || []).map(p => ({...p, size: p.size || 1.0, opacity: p.opacity !== undefined ? p.opacity : 1.0 })),
            }))
          : [{ frame_number: 1, pieces: [] }];
        setFrames(f);
        if (f.length > 0) {
          setInterpolatedPieces(f[0].pieces); // Set initial pieces
        }
        if (data.frame_data?.[0]?.duration) {
          const loadedFps = 1 / data.frame_data[0].duration;
          setFps(loadedFps > 0 ? loadedFps : 1);
        }
        setLoaded(true);
      } catch {
        alert("Play not found");
        navigate("/plays/community");
      }
    })();
  }, [id, navigate]);

  const updateInterpolatedPieces = useCallback(
    (latestProgress) => {
       if (!frames.length) return;

      const currentIdx = Math.floor(latestProgress);
      const nextIdx = Math.min(frames.length - 1, Math.ceil(latestProgress));
      const t = latestProgress % 1; // Interpolation factor (0.0 to 1.0)

      setSliderValue(latestProgress); // Update the slider's visual position

      if (currentIdx === nextIdx || t === 0) {
        if (frames[currentIdx]) {
          setInterpolatedPieces(frames[currentIdx].pieces);
        }
        return;
      }

      const currentPieces = frames[currentIdx]?.pieces || [];
      const nextPieces = frames[nextIdx]?.pieces || [];
      // Create a map for efficient lookups
      const nextPiecesById = new Map(nextPieces.map((p) => [p.id, p]));

      const newPieces = currentPieces.map((p1) => {
        const p2 = nextPiecesById.get(p1.id);
        // If piece doesn't exist in next frame, just hold its position
        if (!p2) return p1;

        // Return the new, interpolated piece, carrying over size and opacity
        return {
          ...p1,
          x: lerp(p1.x, p2.x, t),
          y: lerp(p1.y, p2.y, t),
          size: p1.size, // Ensure size is carried over
          opacity: p1.opacity // Ensure opacity is carried over
        };
      });

      setInterpolatedPieces(newPieces);
    },
    [frames]
  );

  useEffect(() => {
    if (frames.length > 0) {
      setInterpolatedPieces(frames[0].pieces);
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
          if (currentProgress >= frames.length - 1) {
              currentProgress = 0;
              animationProgress.set(0);
          }
          const totalFrames = frames.length - 1;
          const frameDuration = 1 / fps;
          const remainingProgress = totalFrames - currentProgress;
          const remainingDuration = remainingProgress * frameDuration;
          animate(animationProgress, totalFrames, {
              duration: remainingDuration,
              ease: "linear",
              onComplete: () => setIsPlaying(false),
          });
      } else {
          animationProgress.stop();
      }
  }


  // Calculate slider progress percentage
  const sliderProgressPercent = frames.length > 1 ? (sliderValue / (frames.length - 1)) * 100 : 0;

  const isOwner = user && play && user.id === play.owner_id;

  if (!loaded)
    return <div className="text-center text-gray-500 mt-10">Loading…</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-700 font-semibold mb-4"> <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg> Back </button>

      <h2 className="text-2xl sm:text-3xl font-bold text-blue-700">{play.title}</h2>
      {play.description && <p className="text-gray-600 mt-2 mb-4 text-sm sm:text-base">{play.description}</p>}

      <WhiteboardCanvas pieces={interpolatedPieces} /* No editing props */ />

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
                  type="range"
                  min="0"
                  max={frames.length > 1 ? frames.length - 1 : 0}
                  step={0.01}
                  value={sliderValue}
                  onChange={(e) => {
                  if (isPlaying) { animationProgress.stop(); setIsPlaying(false); }
                  const val = Number(e.target.value);
                  animationProgress.set(val);
                  updateInterpolatedPieces(val); // Update visuals immediately
                  }}
                  disabled={frames.length < 2}
                  className="timeline-slider w-full" // Apply custom class
                  style={{ '--progress': `${sliderProgressPercent}%` }} // Pass progress var
                  title="Scrub through animation"
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
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-center justify-between gap-3 sm:gap-4">
          {/* Left: Frame Nav (jumps) - Full width on mobile */}
          <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto order-1">
            <button
              onClick={() => {
                  const targetIdx = Math.max(0, Math.floor(animationProgress.get() - 0.01));
                  animationProgress.set(targetIdx);
                  updateInterpolatedPieces(targetIdx); // Update visuals immediately
              }}
              className="flex items-center justify-center flex-1 sm:flex-none px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-sm sm:text-base font-semibold"
              disabled={isPlaying}
            >
              <PrevIcon /> Frame {/* Updated Icon */}
            </button>
            <button
              onClick={() => {
                  const targetIdx = Math.min(frames.length - 1, Math.floor(animationProgress.get() + 1));
                  animationProgress.set(targetIdx);
                  updateInterpolatedPieces(targetIdx); // Update visuals immediately
              }}
              className="flex items-center justify-center flex-1 sm:flex-none px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-sm sm:text-base font-semibold"
              disabled={isPlaying}
            >
              Frame <NextIcon /> {/* Updated Icon */}
            </button>
          </div>

          {/* Middle: Play/Speed - Second row on mobile, left aligned */}
          <div className="flex items-center justify-start sm:justify-center gap-2 sm:gap-3 pt-2 sm:pt-0 w-full sm:w-auto order-2 sm:order-3">
            <button
              onClick={handlePlayToggle}
              className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-sm sm:text-base font-semibold"
              disabled={frames.length < 2}
            >
              {isPlaying ? "Pause" : "Play"}
            </button>
            <label className="text-xs sm:text-sm text-gray-700">FPS</label>
            <select
              className="border rounded-lg px-2 py-1 text-xs sm:text-sm"
              value={fps}
              onChange={(e) => setFps(Number(e.target.value))}
              disabled={isPlaying}
            >
              <option value={0.5}>0.5</option> <option value={1}>1</option> <option value={2}>2</option> <option value={4}>4</option>
            </select>
          </div>

          {/* Right: Edit Button - Last on mobile, middle on desktop */}
          <div className="flex items-center w-full sm:w-auto justify-end order-3 sm:order-2">
              {isOwner && (
                <Link
                  to={`/plays/${id}/edit`}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm sm:text-base text-center"
                >
                  Edit
                </Link>
              )}
          </div>
        </div>
      </div>
      {/* --- END CONTROLS --- */}
    </div>
  );
}