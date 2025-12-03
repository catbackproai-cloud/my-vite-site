// main.jsx
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import LandingPage from "./LandingPage.jsx";
import App from "./App.jsx";

const MEMBER_KEY = "tc_member_id";

// Simple guard component
function WorkspaceGuard() {
  const navigate = useNavigate();

  const memberId = window.localStorage.getItem(MEMBER_KEY);

  // If no member id, kick them back to landing
  if (!memberId) {
    navigate("/", { replace: true });
    return null; // nothing while redirecting
  }

  // If they DO have one, show the portal
  return <App />;
}

export default function Root() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/workspace" element={<WorkspaceGuard />} />
      </Routes>
    </BrowserRouter>
  );
}
