// src/pages/CommunityPlays.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

export default function CommunityPlays() {
  const [plays, setPlays] = useState([]);

  useEffect(() => {
    async function fetchPublic() {
      const { data } = await api.get("/plays/community");
      setPlays(data);
    }
    fetchPublic();
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <div className="text-center">
          <h2 className="text-3xl font-bold mb-4 text-blue-700">Community Plays</h2>
          <p className="text-gray-600 mb-8">
            Explore public plays shared by others. Click one to view.
          </p>
      </div>

      {plays.length === 0 ? (
        <div className="bg-white rounded-2xl shadow p-6 text-gray-500 text-center">
          No public plays yet.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plays.map((p) => (
            <Link
              key={p.id}
              to={`/plays/${p.id}`}
              className="block bg-white rounded-xl shadow p-4 hover:bg-blue-50 transition min-h-[100px] overflow-hidden"
            >
              <h3 className="text-lg font-bold text-gray-800 truncate text-center">{p.title}</h3>
              <p className="text-sm text-gray-500 truncate text-center">{p.description}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
