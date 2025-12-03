import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// Helpers
function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function isoDay(d) {
  return startOfDay(d).toISOString().slice(0, 10); // YYYY-MM-DD
}

function Root() {
  // Just compute today's day key once and pass it into the app
  const [date] = useState(() => startOfDay(new Date()));
  const dayKey = useMemo(() => isoDay(date), [date]);

  return (
    <React.StrictMode>
      <App selectedDay={dayKey} />
    </React.StrictMode>
  );
}

createRoot(document.getElementById("root")).render(<Root />);
