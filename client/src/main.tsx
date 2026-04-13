import ReactDOM from "react-dom/client";
import "./i18n";
import React from "react";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen.ts";

const router = createRouter({
  routeTree,
  scrollRestoration: true,
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
