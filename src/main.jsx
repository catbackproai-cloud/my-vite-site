import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css"; // optional, keep if you have Tailwind or global styles

// Quick sanity check for required env var
if (!import.meta.env.VITE_N8N_TRADE_FEEDBACK_WEBHOOK) {
  console.warn(
    "[Trading Coach] Missing VITE_N8N_TRADE_FEEDBACK_WEBHOOK. Set it in your .env and restart dev server."
  );
}

function Root() {
  // Lightweight day awareness (pure client):
  const today = new Date();
  const label = today.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <React.StrictMode>
      {/* Optional banner; remove if you don't want it */}
      <div className="w-full text-center text-xs opacity-70 py-2 select-none">
        {label}
      </div>
      <App />
    </React.StrictMode>
  );
}

createRoot(document.getElementById("root")).render(<Root />);
