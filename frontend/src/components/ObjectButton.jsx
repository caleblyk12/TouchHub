// src/components/ObjectButton.jsx
const colorClass = {
  blue: "bg-blue-600 hover:bg-blue-700 text-white",
  red: "bg-red-600 hover:bg-red-700 text-white",
  green: "bg-green-600 hover:bg-green-700 text-white",
  yellow: "bg-amber-500 hover:bg-amber-600 text-black",
};

export default function ObjectButton({ color, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`${colorClass[color] || "bg-gray-600 hover:bg-gray-700 text-white"} 
                  px-4 py-2 rounded-lg font-semibold transition w-full sm:w-auto`}
    >
      {label}
    </button>
  );
}

