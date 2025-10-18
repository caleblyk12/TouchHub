import { Link } from "react-router-dom";
import logo from "../assets/TouchHub.png"; // Import your logo

export default function Start() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white text-center px-6 py-12">
      {/* Logo image with responsive sizing */}
      <img
        src={logo}
        alt="TouchHub Logo"
        className="w-48 sm:w-64 h-auto mb-4 sm:mb-6" // Adjusted bottom margin: mb-4 for mobile, sm:mb-6 for desktop
      />

      {/* Tagline text - smaller and responsive */}
      <p className="text-gray-700 text-sm sm:text-base max-w-md mb-8 sm:mb-10 leading-relaxed"> {/* Smaller text, adjusted bottom margin */}
        Play visualisation and sharing, made quick, simple and portable
      </p>

      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <Link
          to="/login"
          className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white text-lg font-semibold rounded-xl shadow hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50" // Added focus styles
        >
          Login
        </Link>
        <Link
          to="/register"
          className="w-full sm:w-auto px-8 py-3 bg-white border-2 border-blue-600 text-blue-700 text-lg font-semibold rounded-xl hover:bg-blue-50 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50" // Added focus styles
        >
          Register
        </Link>
      </div>
    </div>
  );
}