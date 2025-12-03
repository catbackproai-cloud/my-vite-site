import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import LandingPage from "./LandingPage.jsx";
import "./index.css";

function Root() {
  // Decide initial view:
  // if user already has an account saved, go straight to the app,
  // otherwise show the landing page.
  const [view, setView] = useState(() => {
    try {
      const raw = localStorage.getItem("tc_user_v1");
      return raw ? "app" : "landing";
    } catch {
      return "landing";
    }
  });

  if (view === "landing") {
    return <LandingPage onEnterApp={() => setView("app")} />;
  }

  return <App />;
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
