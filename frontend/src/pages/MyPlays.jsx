import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-3xl sm:text-4xl font-bold text-blue-700">My Plays</h2>
        <Link
          to="/plays/create"
          className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-xl text-lg font-semibold shadow hover:bg-blue-700 transition text-center"
        >
          + Create Play
        </Link>
      </div>

      {plays.length === 0 ? (
        <div className="bg-white rounded-2xl shadow p-6 text-gray-500 text-center">
          You haven’t created any plays yet.
        </div>
      ) : (
        <div className="grid gap-4">
          {plays.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-xl shadow p-4 flex justify-between items-center"
            >
              <div>
                <h3 className="text-lg font-bold text-gray-800">{p.title}</h3>
                <p className="text-sm text-gray-500">{p.description}</p>
              </div>
              <div className="flex gap-3">
                <Link
                  to={`/plays/${p.id}/edit`}
                  className="text-blue-600 hover:underline"
                >
                  Edit
                </Link>
                <button
                  onClick={() => deletePlay(p.id)}
                  className="text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

