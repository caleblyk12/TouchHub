import { Link } from "react-router-dom";

export default function MyPlays() {
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <h2 className="text-2xl font-bold">My Plays</h2>
        <Link
          to="/plays/create"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Create Play
        </Link>
      </div>
      <p className="text-gray-600">Your plays will appear here.</p>
    </div>
  );
}
