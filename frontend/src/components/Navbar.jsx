import { useState } from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <nav className="bg-white shadow-md px-4 py-3">
      {/* Top bar */}
      <div className="flex justify-between items-center">
        {/* Logo */}
        <Link to="/home" className="text-2xl font-bold text-blue-600">
          TouchHub
        </Link>

        {/* Hamburger button */}
        <button
          onClick={toggleMenu}
          className="sm:hidden focus:outline-none"
          aria-label="Toggle menu"
        >
          <div className="space-y-1.5">
            <span className="block w-6 h-0.5 bg-gray-700"></span>
            <span className="block w-6 h-0.5 bg-gray-700"></span>
            <span className="block w-6 h-0.5 bg-gray-700"></span>
          </div>
        </button>

        {/* Desktop links */}
        <div className="hidden sm:flex space-x-6">
          <NavLink to="/home" label="Home" />
          <NavLink to="/plays/me" label="My Plays" />
          <NavLink to="/plays/community" label="Community" />
        </div>
      </div>

      {/* Mobile dropdown */}
      <div
        className={`${
          menuOpen ? "max-h-40 opacity-100 mt-3" : "max-h-0 opacity-0"
        } overflow-hidden transition-all duration-300 sm:hidden`}
      >
        <div className="flex flex-col space-y-2 border-t border-gray-200 pt-3">
          <NavLink to="/home" label="Home" onClick={() => setMenuOpen(false)} />
          <NavLink to="/plays/me" label="My Plays" onClick={() => setMenuOpen(false)} />
          <NavLink to="/plays/community" label="Community" onClick={() => setMenuOpen(false)} />
        </div>
      </div>
    </nav>
  );
}

/* Reusable link component */
function NavLink({ to, label, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
    >
      {label}
    </Link>
  );
}
