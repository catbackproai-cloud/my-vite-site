import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";            // your Trade Coach portal
import LandingPage from "./LandingPage.jsx"; // your marketing / signup page
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Default route: landing page */}
        <Route path="/" element={<LandingPage />} />

        {/* Portal route: Trade Coach workspace */}
        <Route path="/workspace" element={<App />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
