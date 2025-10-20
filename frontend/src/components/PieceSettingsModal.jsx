// src/components/PieceSettingsModal.jsx
import { useState, useEffect } from "react";

// Map size multipliers to readable labels and vice-versa
const sizeMap = {
    small: 0.75,
    medium: 1.0,
    large: 1.5,
};
const sizeValueToLabel = (value) => {
    if (value < 0.9) return 'small';
    if (value > 1.1) return 'large';
    return 'medium';
}

export default function PieceSettingsModal({
  piece,
  onClose,
  onDelete,
  onSave, // Expects onSave(pieceId, label, size)
}) {
  const [label, setLabel] = useState(piece?.label || "");
  const [sizeLabel, setSizeLabel] = useState(() => sizeValueToLabel(piece?.size));

  // Update state if the piece prop changes (e.g., opening modal for a different piece)
  useEffect(() => {
    setLabel(piece?.label || "");
    setSizeLabel(sizeValueToLabel(piece?.size));
  }, [piece]);

  if (!piece) return null;

  function handleSave() {
    // Pass label and the numeric size value
    onSave(piece.id, label, sizeMap[sizeLabel]);
    onClose();
  }

  function handleDelete() {
    if (window.confirm("Are you sure you want to delete this piece?")) {
      onDelete(piece.id);
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose} // Close on backdrop click
    >
      <div
        className="relative bg-blue-50 rounded-lg shadow-xl p-6 w-full max-w-xs sm:max-w-sm border-2 border-blue-200"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h3 className="text-lg sm:text-xl font-bold mb-4 text-blue-800">Piece Settings</h3>

        <div className="space-y-4">
          {/* Label Input */}
          <div>
            <label htmlFor={`piece-label-${piece.id}`} className="block text-sm font-medium text-gray-700"> Label </label>
            <input
              id={`piece-label-${piece.id}`}
              type="text"
              value={label}
              maxLength={7}
              onChange={(e) => setLabel(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
              placeholder="Max 7 chars"
            />
          </div>

          {/* Size Radio Buttons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1"> Size </label>
            <div className="flex justify-around items-center space-x-2 sm:space-x-4 bg-white p-2 rounded-md border border-gray-300 shadow-sm">
              {Object.keys(sizeMap).map((key) => (
                <label key={key} className="flex items-center space-x-1 sm:space-x-2 cursor-pointer text-xs sm:text-sm">
                  <input
                    type="radio"
                    name={`piece-size-${piece.id}`}
                    value={key}
                    checked={sizeLabel === key}
                    onChange={(e) => setSizeLabel(e.target.value)}
                    className="form-radio h-3 w-3 sm:h-4 sm:w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="capitalize">{key}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={handleDelete}
            className="px-3 sm:px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition duration-150 ease-in-out"
          >
            Delete Piece
          </button>
          <button
            onClick={handleSave}
            className="px-3 sm:px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition duration-150 ease-in-out"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}