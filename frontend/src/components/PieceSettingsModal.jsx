// src/components/PieceSettingsModal.jsx
import { useState, useEffect } from "react";

export default function PieceSettingsModal({
  piece,
  onClose,
  onDelete,
  onSave,
}) {
  const [label, setLabel] = useState(piece?.label || "");

  useEffect(() => {
    setLabel(piece?.label || "");
  }, [piece]);

  if (!piece) return null;

  function handleSave() {
    onSave(piece.id, label);
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
      onClick={onClose}
    >
      <div
        className="relative bg-blue-50 rounded-lg shadow-xl p-6 w-full max-w-xs sm:max-w-sm border-2 border-blue-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <h3 className="text-lg sm:text-xl font-bold mb-4 text-blue-800">Piece Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Label
            </label>
            <input
              type="text"
              value={label}
              maxLength={7}
              onChange={(e) => setLabel(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
              placeholder="Max 7 characters"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={handleDelete}
            className="px-3 sm:px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
          >
            Delete
          </button>
          <button
            onClick={handleSave}
            className="px-3 sm:px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}