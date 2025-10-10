// src/pages/PlayDetails.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import WhiteboardCanvas from "../components/WhiteboardCanvas";

export default function PlayDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [frames, setFrames] = useState([{ frame_number: 1, pieces: [] }]);
  const [idx, setIdx] = useState(0);
  const [secondsPerFrame, setSecondsPerFrame] = useState(1);
  const [loaded, setLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [justStartedPlaying, setJustStartedPlaying] = useState(false);


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
        if (data.frame_data?.[0]?.duration) setSecondsPerFrame(data.frame_data[0].duration);
        setLoaded(true);
      } catch {
        alert("Play not found");
        navigate("/plays/community");
      }
    })();
  }, [id, navigate]);

  /** Logic for advancing frames during playback. Plays once from first to last frame. */
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
    }
  }, [isPlaying, frames.length, secondsPerFrame]);

  const pieces = useMemo(() => frames[idx]?.pieces ?? [], [frames, idx]);

  /** * Target positions for smooth animation: positions of the *next* frame.
   * This enables smooth animation on the details page.
   */
  const targetPositionsById = useMemo(() => {
    if (!isPlaying || frames.length < 2 || justStartedPlaying) return null;
    const nextIdx = idx + 1;

    // Stop animation when the next frame is the end of the array
    if (nextIdx >= frames.length) return null;

    const nextFramePieces = frames[nextIdx]?.pieces ?? [];
    return nextFramePieces.reduce((acc, p) => {
      acc[p.id] = { x: p.x, y: p.y };
      return acc;
    }, {});
  }, [isPlaying, frames, idx, justStartedPlaying]);


  if (!loaded) return <div className="text-center text-gray-500 mt-10">Loading…</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      <h2 className="text-3xl font-bold mb-4 text-blue-700">{title}</h2>

      <WhiteboardCanvas
        pieces={pieces}
        // Read-only, so no onPositionChange prop is passed
        targetPositionsById={targetPositionsById} // Enables smooth animation
        frameDurationSec={secondsPerFrame}
      />

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIdx((i) => (i - 1 + frames.length) % frames.length)}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
            disabled={isPlaying} // Disable manual nav during playback
          >
            ◀ Prev
          </button>
          <div className="px-3 py-2 rounded-lg bg-gray-100 text-sm">Frame <b>{idx + 1}</b> / {frames.length}</div>
          <button
            onClick={() => setIdx((i) => (i + 1) % frames.length)}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
            disabled={isPlaying} // Disable manual nav during playback
          >
            Next ▶
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlaying((p) => !p)}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 w-full sm:w-auto"
            disabled={frames.length < 2}
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
          <label className="text-sm text-gray-700">Sec/frame</label>
          <select
            className="border rounded-lg px-2 py-1"
            value={secondsPerFrame}
            onChange={(e) => setSecondsPerFrame(Number(e.target.value))}
            disabled={isPlaying} // Disable changing speed during playback
          >
            <option value={0.25}>0.25</option>
            <option value={0.5}>0.5</option>
            <option value={1}>1</option>
            <option value={2}>2</option>
          </select>
        </div>

        <Link
          to={`/plays/${id}/edit`}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 w-full sm:w-auto text-center"
        >
          Edit
        </Link>
      </div>
    </div>
  );
}