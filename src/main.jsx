import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import App from "./App.jsx"; // your Trade Coach portal
import LandingPage from "./LandingPage.jsx"; // marketing + signup
import "./index.css";

// 🔑 SINGLE SOURCE OF TRUTH FOR MEMBER STORAGE
const MEMBER_LS_KEY = "tc_member_v1";

// Helper to read member from localStorage (JSON or legacy string)
function loadMemberFromStorage() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(MEMBER_LS_KEY);
    if (!raw) return null;

    // New format: JSON object
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return parsed;
      }
    } catch {
      // Ignore and fall through to legacy string case
    }

    // Legacy: stored as plain memberId string
    return { memberId: raw };
  } catch {
    return null;
  }
}

// -------- Workspace Guard --------
function WorkspaceGuard() {
  const navigate = useNavigate();

  const [member] = React.useState(() => loadMemberFromStorage());

  React.useEffect(() => {
    if (!member || !member.memberId) {
      navigate("/", { replace: true });
    }
  }, [member, navigate]);

  // While redirecting, render nothing
  if (!member || !member.memberId) return null;

  // User is "authenticated" → show the Trade Coach app
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
