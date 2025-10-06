import Navbar from "../components/Navbar";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 p-4">
        <Outlet /> {/* child pages render here */}
      </main>
    </div>
  );
}