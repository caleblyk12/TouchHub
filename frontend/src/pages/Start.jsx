import { Link } from "react-router-dom";

export default function Start() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white text-center px-6 py-12">
      <h1 className="text-4xl sm:text-6xl font-extrabold text-blue-700 mb-4 drop-shadow-sm">
        TouchHub
      </h1>
      <p className="text-gray-700 text-base sm:text-lg max-w-md mb-10 leading-relaxed">
        Plan, animate, and share your Touch Rugby plays — all in one place.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <Link
          to="/login"
          className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white text-lg font-semibold rounded-xl shadow hover:bg-blue-700 transition"
        >
          Login
        </Link>
        <Link
          to="/register"
          className="w-full sm:w-auto px-8 py-3 bg-white border-2 border-blue-600 text-blue-700 text-lg font-semibold rounded-xl hover:bg-blue-50 transition"
        >
          Register
        </Link>
      </div>
    </div>
  );
}