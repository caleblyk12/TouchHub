import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Start from "../pages/Start";
import Home from "../pages/Home";
import MyPlays from "../pages/MyPlays";
import CommunityPlays from "../pages/CommunityPlays";
import CreatePlay from "../pages/CreatePlay";
import EditPlay from "../pages/EditPlay";
import PlayDetails from "../pages/PlayDetails";
import Login from "../pages/Login";
import Register from "../pages/Register";
import ProtectedRoute from "../components/ProtectedRoute";

const router = createBrowserRouter([
  { path: "/", element: <Start /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  {
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: "home", element: <Home /> },
      { path: "plays/me", element: <MyPlays /> },
      { path: "plays/community", element: <CommunityPlays /> },
      { path: "plays/create", element: <CreatePlay /> },
      { path: "plays/:id", element: <PlayDetails /> },
      { path: "plays/:id/edit", element: <EditPlay /> },
    ],
  },
]);

export default router;


