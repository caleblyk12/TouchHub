import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/TouchHub.png"; // Import the logo

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(!menuOpen);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav className="bg-white shadow-md px-4 py-3">
      {/* Top bar */}
      <div className="flex justify-between items-center">
        {/* Logo */}
        <Link to="/home" className="flex items-center">
          <img src={logo} alt="TouchHub Logo" className="h-8 w-auto" />
        </Link>

        {/* Welcome message for mobile view */}
        {user && (
          <div className="sm:hidden text-sm text-gray-600">
            Hi, <b>{user.username}</b>
          </div>
        )}

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
        <div className="hidden sm:flex items-center gap-6">
          <NavLink to="/home" label="Home" />
          <NavLink to="/plays/community" label="Community" />

          {user ? (
            <>
              <NavLink to="/plays/me" label="My Plays" />
              <span className="text-gray-600">Hi, <b>{user.username}</b></span>
              <button
                onClick={handleLogout}
                className="text-red-600 font-medium hover:underline"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" label="Login" />
              <NavLink to="/register" label="Register" />
            </>
          )}
        </div>
      </div>

      {/* Mobile dropdown */}
      <div
        className={`${
          menuOpen ? "max-h-60 opacity-100 mt-3" : "max-h-0 opacity-0"
        } overflow-hidden transition-all duration-300 sm:hidden`}
      >
        <div className="flex flex-col space-y-2 border-t border-gray-200 pt-3">
          <NavLink to="/home" label="Home" onClick={() => setMenuOpen(false)} />
          <NavLink to="/plays/community" label="Community" onClick={() => setMenuOpen(false)} />

          {user ? (
            <>
              <NavLink to="/plays/me" label="My Plays" onClick={() => setMenuOpen(false)} />
              <button
                onClick={() => { setMenuOpen(false); handleLogout(); }}
                className="text-left text-red-600 font-medium"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" label="Login" onClick={() => setMenuOpen(false)} />
              <NavLink to="/register" label="Register" onClick={() => setMenuOpen(false)} />
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({ to, label, onClick }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`font-medium transition-colors ${
        isActive ? "text-blue-600" : "text-gray-700 hover:text-blue-600"
      }`}
    >
      {label}
    </Link>
  );
}