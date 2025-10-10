// src/pages/MyPlays.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

// SVG Icons for actions
const ViewIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const DeleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

export default function MyPlays() {
  const [plays, setPlays] = useState([]);

  async function fetchPlays() {
    const { data } = await api.get("/plays/me");
    setPlays(data);
  }

  async function deletePlay(id) {
    if (window.confirm("Delete this play?")) {
      await api.delete(`/plays/${id}`);
      fetchPlays();
    }
  }

  useEffect(() => {
    fetchPlays();
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <div className="text-center mb-6">
        <h2 className="text-3xl sm:text-4xl font-bold text-blue-700">My Plays</h2>
      </div>

      {plays.length === 0 ? (
        <div className="bg-white rounded-2xl shadow p-6 text-gray-500 text-center">
          You haven’t created any plays yet. Get started by creating one!
        </div>
      ) : null}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Create New Play Card */}
        <Link
          to="/plays/create"
          className="bg-white rounded-xl shadow p-4 flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-300 hover:border-blue-500 hover:text-blue-600 transition group min-h-[140px]"
        >
          <PlusIcon />
          <span className="font-semibold text-gray-600 group-hover:text-blue-600">Create New Play</span>
        </Link>
        
        {/* Existing Play Cards */}
        {plays.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-xl shadow p-4 flex flex-col items-center text-center"
          >
            <div className="flex-1 min-w-0 mb-3">
              <h3 className="text-base sm:text-lg font-bold text-gray-800 truncate">{p.title}</h3>
              <p className="text-xs sm:text-sm text-gray-500 truncate">{p.description}</p>
            </div>
            <div className="flex justify-center items-center flex-shrink-0 gap-2 sm:gap-3 mt-auto">
              <Link to={`/plays/${p.id}`} className="text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-gray-100" title="View">
                <ViewIcon />
              </Link>
              <Link to={`/plays/${p.id}/edit`} className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-gray-100" title="Edit">
                <EditIcon />
              </Link>
              <button onClick={() => deletePlay(p.id)} className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-gray-100" title="Delete">
                <DeleteIcon />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
