import React, { useMemo, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// Helpers
function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function fmt(d) {
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
function isoDay(d) {
  return startOfDay(d).toISOString().slice(0, 10); // YYYY-MM-DD
}

function DateNav({ date, setDate }) {
  const label = useMemo(() => fmt(date), [date]);

  function shiftDays(n) {
    const next = new Date(date);
    next.setDate(next.getDate() + n);
    setDate(startOfDay(next));
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === "ArrowLeft") shiftDays(-1);
      if (e.key === "ArrowRight") shiftDays(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [date]);

  const bar = {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: "14px 0",
    fontSize: 14,
    color: "rgba(231,236,242,.85)",
  };
  const btn = {
    background: "transparent",
    color: "rgba(231,236,242,.8)",
    border: "1px solid #243043",
    borderRadius: 12,
    padding: "6px 10px",
    cursor: "pointer",
  };
  const note = {
    fontSize: 11,
    opacity: 0.65,
    marginTop: 4,
    textAlign: "center",
  };

  return (
    <div style={{ display: "grid", placeItems: "center", marginBottom: 6 }}>
      <div style={bar}>
        <button onClick={() => shiftDays(-1)} style={btn} aria-label="Previous day">
          ←
        </button>
        <div style={{ minWidth: 260, textAlign: "center", fontWeight: 700 }}>
          {label}
        </div>
        <button onClick={() => shiftDays(1)} style={btn} aria-label="Next day">
          →
        </button>
      </div>
      <div style={note}>Any saved information for each day will be saved for that day.</div>
    </div>
  );
}

function Root() {
  const [date, setDate] = useState(() => startOfDay(new Date()));
  const dayKey = useMemo(() => isoDay(date), [date]);

  return (
    <React.StrictMode>
      <DateNav date={date} setDate={setDate} />
      <App selectedDay={dayKey} />
    </React.StrictMode>
  );
}

createRoot(document.getElementById("root")).render(<Root />);
