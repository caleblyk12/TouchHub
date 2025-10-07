// src/components/FrameControls.jsx
export default function FrameControls({ isPlaying, setIsPlaying, playbackSpeed, setPlaybackSpeed }) {
  return (
    <div className="flex flex-wrap gap-3 justify-center mt-6">
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition w-full sm:w-auto"
      >
        {isPlaying ? "Pause" : "Play"}
      </button>

      <div className="flex items-center gap-2 text-gray-700">
        <label className="font-medium">Speed:</label>
        <select
          value={playbackSpeed}
          onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
          className="border rounded-lg px-2 py-1 text-sm"
        >
          <option value={0.5}>0.5x</option>
          <option value={1}>1x</option>
          <option value={2}>2x</option>
          <option value={3}>3x</option>
        </select>
      </div>
    </div>
  );
}
