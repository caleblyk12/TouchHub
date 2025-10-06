import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Start from "../pages/Start";
import Home from "../pages/Home";
import MyPlays from "../pages/MyPlays";
import CommunityPlays from "../pages/CommunityPlays";
import CreatePlay from "../pages/CreatePlay";
import Login from "../pages/Login";
import Register from "../pages/Register";

const router = createBrowserRouter([
  { path: "/", element: <Start /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  {
    element: <MainLayout />,
    children: [
      { path: "home", element: <Home /> },
      { path: "plays/me", element: <MyPlays /> },
      { path: "plays/community", element: <CommunityPlays /> },
      { path: "plays/create", element: <CreatePlay /> },
      { path: "plays/:id", element: <div>Play Details (soon)</div> },
      { path: "plays/:id/edit", element: <div>Edit Play (soon)</div> },
    ],
  },
]);

export default router;
