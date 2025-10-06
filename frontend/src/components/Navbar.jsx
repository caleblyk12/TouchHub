import { useState } from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <nav className="bg-white shadow-md px-4 py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center">
      {/* Logo + hamburger */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">TouchHub</h1>
        <button
          onClick={toggleMenu}
          className="sm:hidden focus:outline-none"
          aria-label="Toggle menu"
        >
          <div className="space-y-1">
            <span className="block w-6 h-0.5 bg-gray-700"></span>
            <span className="block w-6 h-0.5 bg-gray-700"></span>
            <span className="block w-6 h-0.5 bg-gray-700"></span>
          </div>
        </button>
      </div>

      {/* Links */}
      <div
        className={`${
          menuOpen ? "block" : "hidden"
        } sm:flex flex-col sm:flex-row mt-2 sm:mt-0 sm:space-x-4`}
      >
        <Link to="/home" onClick={() => setMenuOpen(false)} className="py-1 hover:text-blue-600">Home</Link>
        <Link to="/plays/me" onClick={() => setMenuOpen(false)} className="py-1 hover:text-blue-600">My Plays</Link>
        <Link to="/plays/community" onClick={() => setMenuOpen(false)} className="py-1 hover:text-blue-600">Community</Link>
      </div>
    </nav>
  );
}
