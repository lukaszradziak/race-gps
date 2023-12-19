import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Settings } from "./routes/Settings.tsx";
import { Measure } from "./routes/Measure.tsx";
import { Root } from "./routes/Root.tsx";
import { Dyno } from "./routes/Dyno.tsx";
import "./styles/main.css";
import { DynoBrowser } from "./routes/DynoBrowser.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    errorElement: <div>404</div>,
    children: [
      {
        path: "/",
        element: <Measure />,
      },
      {
        path: "/dyno",
        element: <Dyno />,
      },
      {
        path: "/dyno-browser",
        element: <DynoBrowser />,
      },
      {
        path: "/settings",
        element: <Settings />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
