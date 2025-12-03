import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import App from "./App.jsx"; // your Trade Coach portal
import LandingPage from "./LandingPage.jsx"; // marketing + signup
import "./index.css";

const MEMBER_KEY = "tc_member_id";

// -------- Workspace Guard --------
function WorkspaceGuard() {
  const navigate = useNavigate();

  // Pull stored member ID from localStorage
  const memberId = window.localStorage.getItem(MEMBER_KEY);

  // If missing -> redirect to landing page
  React.useEffect(() => {
    if (!memberId) {
      navigate("/", { replace: true });
    }
  }, [memberId, navigate]);

  // While redirecting, render nothing
  if (!memberId) return null;

  // User is authenticated → show the Trade Coach app
  return <App />;
}

// -------- Root App Wrapper --------
function Root() {
  return (
    <React.StrictMode>
      <BrowserRouter>
        <Routes>
          {/* Default route: landing page */}
          <Route path="/" element={<LandingPage />} />

          {/* Protected route */}
          <Route path="/workspace" element={<WorkspaceGuard />} />
        </Routes>
      </BrowserRouter>
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
