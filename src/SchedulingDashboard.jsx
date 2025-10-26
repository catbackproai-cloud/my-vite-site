import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import logo from "./assets/Y-Logo.png";

/* -------------------------------------------------------------------------- */
/*                               Constants & Utils                            */
/* -------------------------------------------------------------------------- */

const DAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120, 150, 180];

// Map JS Date.getDay() (0=Sun) to our DAY_ORDER names
const JS_DAY_TO_NAME = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Helpers to parse "HH:mm" → minutes and back
function toMinutes(hhmm = "") {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":").map((n) => parseInt(n || "0", 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}
function toHHMM(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
  return `${pad(h)}:${pad(m)}`;
}

// Check if two [start,end] minute ranges overlap
function overlap(aStart, aEnd, bStart, bEnd) {
  if (aStart == null || aEnd == null || bStart == null || bEnd == null) return false;
  return aStart < bEnd && bStart < aEnd;
}

// Build an array of dates for a calendar month grid (6 rows x 7 cols typical)
function buildMonthGrid(year, month /* 0-indexed */) {
  const firstOfMonth = new Date(year, month, 1);
  const startDay = firstOfMonth.getDay(); // 0=Sun..6=Sat
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const grid = [];
  // leading days from previous month
  const prevMonthDays = (startDay + 6) % 7; // shift so Mon-Sun grid if needed; but we’ll keep Sun-Sat here
  const startDate = new Date(year, month, 1 - prevMonthDays);

  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    grid.push(d);
  }
  return grid;
}

// Format date to YYYY-MM-DD
function fmtYMD(date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/* -------------------------------------------------------------------------- */
/*                               Main Component                               */
/* -------------------------------------------------------------------------- */

export default function SchedulingDashboard() {
  const { businessId: routeId } = useParams();
  const navigate = useNavigate();

  /* ---------- STATE ---------- */
  const [business, setBusiness] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const [colorScheme, setColorScheme] = useState({
    header: "#de8d2b",
    text: "#000000",
    background: "#ffffff",
    accent: "#de8d2b",
  });

  // services: name, price (required), duration(min dropdown), description
  const [services, setServices] = useState([]);

  // availability: per day -> { enabled, start, end } (single range)
  const [availability, setAvailability] = useState(
    DAY_ORDER.reduce((acc, d) => {
      acc[d] = { enabled: false, start: "09:00", end: "17:00" };
      return acc;
    }, {})
  );

  // blackout dates (array of YYYY-MM-DD)
  const [unavailableDates, setUnavailableDates] = useState([]);

  // partial-day unavailability: [{ date, start, end, allDay }]
  const [unavailability, setUnavailability] = useState([]);

  // calendar preview month/year
  const today = new Date();
  const [monthCursor, setMonthCursor] = useState({ y: today.getFullYear(), m: today.getMonth() });

  // for smooth scroll to day section
  const dayRefs = useRef({});
  DAY_ORDER.forEach((d) => {
    if (!dayRefs.current[d]) dayRefs.current[d] = { current: null };
  });

  // Auto-save interval ref (to clear on unmount)
  const autosaveRef = useRef(null);

  /* ---------- AUTH GUARD ---------- */
  useEffect(() => {
    if (!routeId) return;

    const token = sessionStorage.getItem("catback_token");
    const lastActive = sessionStorage.getItem("catback_lastActive");

    if (!token || token !== routeId) {
      sessionStorage.clear();
      setTimeout(() => navigate("/dashboard", { replace: true }), 0);
      return;
    }

    if (lastActive && Date.now() - parseInt(lastActive, 10) > 3600000) {
      sessionStorage.clear();
      setTimeout(() => navigate("/dashboard", { replace: true }), 0);
      return;
    }

    const updateActivity = () =>
      sessionStorage.setItem("catback_lastActive", Date.now().toString());
    window.addEventListener("mousemove", updateActivity);
    window.addEventListener("keydown", updateActivity);
    return () => {
      window.removeEventListener("mousemove", updateActivity);
      window.removeEventListener("keydown", updateActivity);
    };
  }, [routeId, navigate]);

  /* ---------- FETCH BUSINESS + EXISTING THEME ---------- */
  useEffect(() => {
    if (routeId) fetchAllData(routeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId]);

  const fetchAllData = async (id) => {
    setLoading(true);
    setStatusMsg("");
    try {
      // business + saved ColorScheme
      const bizRes = await fetch(
        `https://jacobtf007.app.n8n.cloud/webhook/catbackai_getbusiness?businessId=${id}`
      );
      const bizData = await bizRes.json();
      if (!bizData?.business) throw new Error("Business not found");
      setBusiness(bizData.business);

      if (bizData.business.ColorScheme) {
        try {
          const parsed = JSON.parse(bizData.business.ColorScheme);
          if (parsed && typeof parsed === "object") setColorScheme((p) => ({ ...p, ...parsed }));
        } catch {
          /* ignore invalid json */
        }
      }

      // schedule/services/availability
      const schedRes = await fetch(
        "https://jacobtf007.app.n8n.cloud/webhook/catbackai_getschedule",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ businessId: id }),
        }
      );
      const schedJson = await schedRes.json();

      if (schedJson?.result === "ok") {
        // services
        if (Array.isArray(schedJson.services)) {
          setServices(
            schedJson.services.map((s) => ({
              name: s.name || s.ServiceName || "",
              price: (s.price ?? s.Price ?? "").toString(),
              duration: (s.duration ?? s.Duration ?? "60").toString(),
              description: s.description ?? s.Description ?? "",
            }))
          );
        }

        // availability
        if (schedJson.availability && typeof schedJson.availability === "object") {
          // Gracefully upgrade older shape {enabled,start,end} and also accept old ranges
          const next = { ...availability };
          for (const day of DAY_ORDER) {
            const raw = schedJson.availability[day];
            if (!raw) continue;

            // If it already matches our single-range shape
            if (typeof raw?.start === "string" || typeof raw?.end === "string") {
              next[day] = {
                enabled: !!raw.enabled && !!(raw.start && raw.end),
                start: raw.start || "09:00",
                end: raw.end || "17:00",
              };
              continue;
            }

            // If it's an older "ranges" array, adopt the FIRST range
            if (Array.isArray(raw?.ranges) && raw.ranges.length > 0) {
              const first = raw.ranges[0] || {};
              next[day] = {
                enabled: !!raw.enabled && !!(first.start && first.end),
                start: first.start || "09:00",
                end: first.end || "17:00",
              };
              continue;
            }

            // fallback
            next[day] = { enabled: false, start: "09:00", end: "17:00" };
          }
          setAvailability(next);
        }

        // blackout dates
        if (Array.isArray(schedJson.unavailableDates)) {
          setUnavailableDates(schedJson.unavailableDates);
        }

        // partial-day unavailability (new)
        if (Array.isArray(schedJson.unavailability)) {
          setUnavailability(
            schedJson.unavailability.map((u) => ({
              date: u.date || "",
              start: u.start || "",
              end: u.end || "",
              allDay: !!u.allDay,
            }))
          );
        }
      }
    } catch (err) {
      setStatusMsg("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- SAVE ALL + AUTOSAVE (30s) ---------- */
  const lastSavedPayloadRef = useRef(null);

  const saveDashboard = async (opts = { silent: false }) => {
    // if user is typing we still save silently if triggered by autosave
    if (!opts.silent) setSaving(true);
    if (!opts.silent) setStatusMsg("Saving your booking form settings...");

    // basic validation: services -> price required, duration numeric or empty
    for (const s of services) {
      if (!s.name?.trim()) {
        if (!opts.silent) {
          setSaving(false);
          setStatusMsg("⚠️ Each service needs a name.");
        }
        return false;
      }
      if (s.price === "" || isNaN(Number(s.price))) {
        if (!opts.silent) {
          setSaving(false);
          setStatusMsg("⚠️ Price is required and must be a number for each service.");
        }
        return false;
      }
    }

    const payload = {
      businessId: routeId,
      colorScheme,
      services: services.map((s) => ({
        ...s,
        price: Number(s.price),
        duration: s.duration ? Number(s.duration) : "",
      })),
      availability,
      unavailableDates,
      unavailability,
    };

    // Skip network if nothing changed since last save (for autosave)
    const payloadString = JSON.stringify(payload);
    if (opts.silent && lastSavedPayloadRef.current === payloadString) {
      return true; // no-op
    }

    try {
      const res = await fetch(
        "https://jacobtf007.app.n8n.cloud/webhook/catbackai_updatebookingtheme",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payloadString,
        }
      );
      if (!res.ok) throw new Error(await res.text());
      lastSavedPayloadRef.current = payloadString;
      if (!opts.silent) setStatusMsg("✅ Saved! Your booking page will use these settings.");
      return true;
    } catch (err) {
      if (!opts.silent) setStatusMsg("❌ " + err.message);
      return false;
    } finally {
      if (!opts.silent) setSaving(false);
    }
  };

  // Auto-save every 30s
  useEffect(() => {
    if (autosaveRef.current) clearInterval(autosaveRef.current);
    autosaveRef.current = setInterval(() => {
      // silent autosave
      saveDashboard({ silent: true });
    }, 30000);
    return () => {
      if (autosaveRef.current) clearInterval(autosaveRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId, colorScheme, services, availability, unavailableDates, unavailability]);

  /* ---------- HANDLERS ---------- */
  const hexOk = (c) => /^#[0-9A-Fa-f]{6}$/.test(c);
  const setColor = (field, value) => {
    if (hexOk(value)) {
      setColorScheme((p) => ({ ...p, [field]: value }));
      setStatusMsg("");
    } else setStatusMsg("⚠️ Use valid hex (e.g., #000000).");
  };

  const addService = () =>
    setServices((s) => [...s, { name: "", price: "", duration: "60", description: "" }]);

  const updateService = (i, k, v) =>
    setServices((arr) => {
      const copy = [...arr];
      copy[i] = { ...copy[i], [k]: v };
      return copy;
    });

  const removeService = (i) => setServices((arr) => arr.filter((_, idx) => idx !== i));

  const toggleDay = (day) =>
    setAvailability((prev) => {
      const enabled = !prev[day].enabled;
      return {
        ...prev,
        [day]: {
          ...prev[day],
          enabled,
        },
      };
    });

  const updateDay = (day, key, val) =>
    setAvailability((prev) => ({
      ...prev,
      [day]: { ...prev[day], [key]: val },
    }));

  const addBlackout = (d) => {
    if (!d) return;
    setUnavailableDates((list) => Array.from(new Set([...list, d])));
  };

  const removeBlackout = (i) =>
    setUnavailableDates((list) => list.filter((_, idx) => idx !== i));

  const addUnavailability = (entry) => {
    if (!entry.date) return;
    // if allDay is on, clear times
    const clean = entry.allDay ? { ...entry, start: "", end: "" } : entry;
    setUnavailability((list) => [...list, clean]);
  };

  const removeUnavailability = (i) =>
    setUnavailability((list) => list.filter((_, idx) => idx !== i));

  const bookingUrl = useMemo(() => `https://catbackai.com/book/${routeId}`, [routeId]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setStatusMsg("🔗 Booking link copied!");
      setTimeout(() => setStatusMsg(""), 2000);
    } catch {
      setStatusMsg("⚠️ Copy failed. You can select and copy the text manually.");
    }
  };

  // Derived: quick lookups for previews
  const unavailableDateSet = useMemo(() => new Set(unavailableDates), [unavailableDates]);

  const unavailabilityByDate = useMemo(() => {
    const map = {};
    for (const u of unavailability) {
      if (!u.date) continue;
      if (!map[u.date]) map[u.date] = [];
      map[u.date].push(u);
    }
    return map;
  }, [unavailability]);

  /* ---------- UI ---------- */
  return (
    <div
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#f7f7f8",
      }}
    >
      <Helmet>
        <title>CatBackAI | Booking Form Builder</title>
      </Helmet>

      {/* Header */}
      <header
        style={{
          background: colorScheme.header,
          color: "#fff",
          padding: "14px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <img src={logo} alt="CatBackAI" style={{ height: 36 }} />
          <strong style={{ fontSize: 18 }}>Scheduling Dashboard</strong>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              background: "rgba(255,255,255,.15)",
              border: "1px solid rgba(255,255,255,.35)",
              borderRadius: 10,
              padding: "6px 10px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 12, opacity: 0.9 }}>Public:</span>
            <input
              value={bookingUrl}
              readOnly
              style={{
                background: "transparent",
                color: "#fff",
                border: "none",
                outline: "none",
                width: 230,
                fontSize: 12,
              }}
            />
            <button
              onClick={copyLink}
              style={{
                background: "#fff",
                color: colorScheme.header,
                border: "none",
                borderRadius: 8,
                padding: "6px 8px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Copy
            </button>
          </div>

          <button
            onClick={() => {
              sessionStorage.clear();
              navigate("/dashboard");
            }}
            style={{
              background: "transparent",
              color: "#fff",
              border: "1px solid rgba(255,255,255,.6)",
              padding: "8px 12px",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Log Out
          </button>
        </div>
      </header>

      {/* Status banner */}
      {statusMsg && (
        <div
          style={{
            background: "#fff4eb",
            border: "1px solid #f4c89a",
            padding: 12,
            borderRadius: 10,
            margin: "16px auto 0",
            maxWidth: 1080,
            width: "100%",
          }}
        >
          {statusMsg}
        </div>
      )}

      {/* Body */}
      <main style={{ maxWidth: 1080, margin: "14px auto 120px", padding: "0 16px", width: "100%" }}>
        {loading ? (
          <p>Loading…</p>
        ) : (
          <>
            {/* Business Summary */}
            {business && (
              <Card>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {business.LogoLink && (
                    <img
                      src={business.LogoLink}
                      alt="Logo"
                      style={{ height: 48, width: 48, objectFit: "cover", borderRadius: 8 }}
                    />
                  )}
                  <div>
                    <div style={{ fontWeight: 700 }}>{business.BusinessName}</div>
                    <div style={{ fontSize: 12, color: "#666" }}>
                      Public booking: catbackai.com/book/{routeId}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Color Scheme */}
            <Card title="Color Scheme (Booking Form)" accent={colorScheme.accent}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                  gap: 12,
                }}
              >
                {["header", "text", "background", "accent"].map((key) => (
                  <div key={key} style={{ display: "grid", gap: 6 }}>
                    <label style={{ textTransform: "capitalize", fontWeight: 600 }}>{key}</label>
                    <input
                      type="color"
                      value={colorScheme[key]}
                      onChange={(e) => setColor(key, e.target.value)}
                      style={{
                        width: "100%",
                        height: 42,
                        borderRadius: 10,
                        border: "1px solid #ddd",
                        background: "#fff",
                        cursor: "pointer",
                      }}
                    />
                  </div>
                ))}
              </div>
            </Card>

            {/* Live Preview (Form) */}
            <Card title="Live Booking Form Preview" accent={colorScheme.accent}>
              <div
                style={{
                  border: "1px solid #eee",
                  borderRadius: 12,
                  overflow: "hidden",
                  background: colorScheme.background,
                  color: colorScheme.text,
                  transition: "all 0.2s ease",
                }}
              >
                <div
                  style={{
                    background: colorScheme.header,
                    color: "#fff",
                    padding: "16px 20px",
                    fontWeight: "bold",
                    fontSize: 18,
                  }}
                >
                  Booking Form Example
                </div>
                <div style={{ padding: 16, display: "grid", gap: 10 }}>
                  <input
                    type="text"
                    placeholder="Your Name"
                    style={{
                      ...fieldStyle,
                      color: colorScheme.text,
                      background: "#fff",
                      borderColor: "#ddd",
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Phone Number"
                    style={{
                      ...fieldStyle,
                      color: colorScheme.text,
                      background: "#fff",
                      borderColor: "#ddd",
                    }}
                  />
                  <select
                    style={{
                      ...fieldStyle,
                      color: colorScheme.text,
                      background: "#fff",
                      borderColor: "#ddd",
                      WebkitTextFillColor: colorScheme.text,
                    }}
                  >
                    <option style={{ color: colorScheme.text }}>Select a Service</option>
                    {services.map((s, i) => (
                      <option key={i} style={{ color: colorScheme.text }}>
                        {s.name} — ${s.price}
                        {s.duration ? ` (${s.duration} min)` : ""}
                      </option>
                    ))}
                  </select>
                  <button
                    style={{
                      background: colorScheme.accent,
                      border: "none",
                      borderRadius: 10,
                      padding: "12px 14px",
                      color: "#fff",
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    Book Now
                  </button>
                </div>
              </div>
            </Card>

            {/* Services */}
            <Card title="Services" accent={colorScheme.accent}>
              <div style={{ display: "grid", gap: 12 }}>
                {services.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      background: "#fff",
                      border: "1px solid #eee",
                      borderRadius: 12,
                      padding: 12,
                      display: "grid",
                      gap: 10,
                    }}
                  >
                    <input
                      placeholder="Service name"
                      value={s.name}
                      onChange={(e) => updateService(i, "name", e.target.value)}
                      style={fieldStyle}
                      required
                    />
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "160px 1fr",
                        gap: 10,
                        alignItems: "center",
                      }}
                    >
                      <input
                        type="number"
                        min="0"
                        placeholder="Price"
                        value={s.price}
                        onChange={(e) => updateService(i, "price", e.target.value)}
                        style={fieldStyle}
                        required
                      />
                      <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 10 }}>
                        <select
                          value={s.duration || "60"}
                          onChange={(e) => updateService(i, "duration", e.target.value)}
                          style={fieldStyle}
                        >
                          {DURATION_OPTIONS.map((m) => (
                            <option key={m} value={m}>
                              {m} min
                            </option>
                          ))}
                        </select>
                        <input
                          placeholder="Description (optional)"
                          value={s.description}
                          onChange={(e) => updateService(i, "description", e.target.value)}
                          style={fieldStyle}
                        />
                      </div>
                    </div>

                    <button type="button" onClick={() => removeService(i)} style={btnGhost}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <button type="button" onClick={addService} style={btnPrimary(colorScheme.accent)}>
                + Add Service
              </button>
            </Card>

            {/* Availability (single time range per day) */}
            <Card title="Availability (weekly)" accent={colorScheme.accent}>
              <div style={{ display: "grid", gap: 12 }}>
                {DAY_ORDER.map((day) => {
                  const data = availability[day];
                  return (
                    <div
                      key={day}
                      ref={(el) => (dayRefs.current[day] = el)}
                      style={{
                        background: "#fff",
                        border: "1px solid #eee",
                        borderRadius: 10,
                        padding: 12,
                        display: "grid",
                        gridTemplateColumns: "auto 140px 140px",
                        gap: 10,
                        alignItems: "center",
                      }}
                    >
                      <label style={{ fontWeight: 700 }}>
                        <input
                          type="checkbox"
                          checked={!!data.enabled}
                          onChange={() => toggleDay(day)}
                          style={{ marginRight: 8 }}
                        />
                        {day}
                      </label>

                      <input
                        type="time"
                        disabled={!data.enabled}
                        value={data.start}
                        onChange={(e) => updateDay(day, "start", e.target.value)}
                        style={fieldStyle}
                      />
                      <input
                        type="time"
                        disabled={!data.enabled}
                        value={data.end}
                        onChange={(e) => updateDay(day, "end", e.target.value)}
                        style={fieldStyle}
                      />
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Unavailable Dates (all-day) */}
            <Card title="Unavailable Dates (one-off)" accent={colorScheme.accent}>
              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ display: "flex", gap: 10 }}>
                  <input type="date" onChange={(e) => addBlackout(e.target.value)} style={fieldStyle} />
                </div>
                {!!unavailableDates.length && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {unavailableDates.map((d, i) => (
                      <span
                        key={d + i}
                        style={{
                          background: "#fff",
                          border: "1px solid #ddd",
                          borderRadius: 999,
                          padding: "6px 10px",
                          fontSize: 12,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        {d}
                        <button
                          type="button"
                          onClick={() => removeBlackout(i)}
                          style={{
                            border: "none",
                            background: "transparent",
                            color: "#c00",
                            cursor: "pointer",
                            fontWeight: 700,
                          }}
                          aria-label={`Remove ${d}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Add Unavailability (partial-day blocks) */}
            <Card title="Add Unavailability (specific times)" accent={colorScheme.accent}>
              <AddUnavailabilityForm onAdd={addUnavailability} accent={colorScheme.accent} />
              <div style={{ marginTop: 16 }}>
                {unavailability.length > 0 ? (
                  unavailability.map((u, i) => (
                    <div
                      key={`${u.date}-${i}`}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        background: "#fff",
                        border: "1px solid #eee",
                        borderRadius: 8,
                        padding: "8px 12px",
                        marginBottom: 6,
                      }}
                    >
                      <span style={{ fontSize: 14 }}>
                        🗓️ <strong>{u.date}</strong>{" "}
                        — {u.allDay ? "All Day" : `${u.start || "--"} → ${u.end || "--"}`}
                      </span>
                      <button
                        onClick={() => removeUnavailability(i)}
                        style={btnGhostSmall}
                        aria-label="remove unavailability"
                      >
                        ×
                      </button>
                    </div>
                  ))
                ) : (
                  <p style={{ color: "#777", fontSize: 14, margin: 0 }}>
                    No unavailability added yet.
                  </p>
                )}
              </div>
            </Card>

            {/* ------------------------- Previews (Below) ------------------------ */}
            <Card title="Calendar Preview" accent={colorScheme.accent}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {/* Calendly-style Month Preview */}
                <MonthPreview
                  colorScheme={colorScheme}
                  monthCursor={monthCursor}
                  setMonthCursor={setMonthCursor}
                  availability={availability}
                  unavailableDateSet={unavailableDateSet}
                  unavailabilityByDate={unavailabilityByDate}
                  onPickDay={(dateObj) => {
                    const name = JS_DAY_TO_NAME[dateObj.getDay()];
                    const el = dayRefs.current[name];
                    if (el && el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                />

                {/* Deputy-style Weekly Preview */}
                <WeeklyPreview
                  colorScheme={colorScheme}
                  availability={availability}
                  unavailabilityByDate={unavailabilityByDate}
                  unavailableDateSet={unavailableDateSet}
                />
              </div>
            </Card>
          </>
        )}
      </main>

      {/* Sticky Save Bar */}
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          background: "#fff",
          borderTop: "1px solid #eee",
          padding: "12px 16px",
          display: "flex",
          justifyContent: "center",
          zIndex: 50,
        }}
      >
        <button type="button" onClick={() => saveDashboard({ silent: false })} disabled={saving} style={btnSave}>
          {saving ? "Saving…" : "Save All Changes"}
        </button>
      </div>

      <footer style={{ padding: 16, textAlign: "center", color: "#888", marginBottom: 60 }}>
        © {new Date().getFullYear()} CatBackAI
      </footer>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                            AddUnavailability Form                          */
/* -------------------------------------------------------------------------- */

function AddUnavailabilityForm({ onAdd, accent }) {
  const [form, setForm] = useState({ date: "", start: "", end: "", allDay: false });

  const handleAdd = () => {
    if (!form.date) return;
    if (!form.allDay && (!form.start || !form.end)) return;
    onAdd(form);
    setForm({ date: "", start: "", end: "", allDay: false });
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px auto auto", gap: 10, alignItems: "center" }}>
      <div>
        <label style={labelStyle}>Date</label>
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          style={fieldStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>From</label>
        <input
          type="time"
          value={form.start}
          disabled={form.allDay}
          onChange={(e) => setForm({ ...form, start: e.target.value })}
          style={fieldStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>To</label>
        <input
          type="time"
          value={form.end}
          disabled={form.allDay}
          onChange={(e) => setForm({ ...form, end: e.target.value })}
          style={fieldStyle}
        />
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input
          type="checkbox"
          checked={form.allDay}
          onChange={(e) => setForm({ ...form, allDay: e.target.checked })}
        />
        All Day
      </label>

      <button onClick={handleAdd} style={miniButton(accent)}>
        + Add
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Month Preview                                */
/* -------------------------------------------------------------------------- */

function MonthPreview({
  colorScheme,
  monthCursor,
  setMonthCursor,
  availability,
  unavailableDateSet,
  unavailabilityByDate,
  onPickDay,
}) {
  const { y, m } = monthCursor;
  const grid = useMemo(() => buildMonthGrid(y, m), [y, m]);

  const goPrev = () => {
    const nm = m - 1;
    if (nm < 0) setMonthCursor({ y: y - 1, m: 0 });
    else setMonthCursor({ y, m: nm });
  };
  const goNext = () => {
    const nm = m + 1;
    if (nm > 11) setMonthCursor({ y: y + 1, m: 11 });
    else setMonthCursor({ y, m: nm });
  };

  return (
    <div
      style={{
        border: "1px solid #eee",
        borderRadius: 12,
        background: "#fff",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background: colorScheme.header,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 12px",
        }}
      >
        <button
          onClick={goPrev}
          style={{
            background: "rgba(255,255,255,.2)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "6px 10px",
            cursor: "pointer",
          }}
        >
          ‹
        </button>
        <div style={{ fontWeight: 700 }}>
          {new Date(y, m, 1).toLocaleString(undefined, { month: "long", year: "numeric" })}
        </div>
        <button
          onClick={goNext}
          style={{
            background: "rgba(255,255,255,.2)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "6px 10px",
            cursor: "pointer",
          }}
        >
          ›
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "8px 8px 0 8px", color: "#666", fontSize: 12 }}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} style={{ textAlign: "center", padding: "6px 0" }}>
            {d}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, padding: 8 }}>
        {grid.map((dateObj, idx) => {
          const sameMonth = dateObj.getMonth() === m;
          const ymd = fmtYMD(dateObj);
          const dowName = JS_DAY_TO_NAME[dateObj.getDay()];
          const dayAvail = availability[dowName] || { enabled: false };

          const allDayUnavailable = unavailableDateSet.has(ymd);
          const dayUnavailability = unavailabilityByDate[ymd] || [];

            // determine tile color
          let bg = "#fff";
          let label = "";

          // is working day?
          if (sameMonth && dayAvail.enabled) {
            bg = "#fff";
            label = "Available";
          } else {
            bg = "#fafafa"; // not working
            label = "Off";
          }

          // if any unavailability exists: mark gray
          let hasPartial = false;
          for (const u of dayUnavailability) {
            hasPartial = true;
            if (u.allDay) {
              // full-day unavailability
              bg = "#eee"; // gray for unavailable
              label = "Unavailable (All Day)";
              break;
            }
          }
          if (!allDayUnavailable && hasPartial) {
            bg = "#f1f1f1"; // lighter gray for partial
            if (label === "Available") label = "Partial Unavailable";
          }

          // blackout date overrides
          if (allDayUnavailable) {
            bg = "#eee";
            label = "Unavailable";
          }

          const color = sameMonth ? "#111" : "#aaa";
          const border = sameMonth ? "1px solid #eee" : "1px dashed #f0f0f0";

          return (
            <button
              key={ymd + idx}
              onClick={() => onPickDay(dateObj)}
              style={{
                aspectRatio: "1 / 1",
                border,
                borderRadius: 10,
                background: bg,
                color,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "space-between",
                padding: 8,
              }}
              title={`${ymd} — ${label}`}
            >
              <span style={{ fontWeight: 700, opacity: sameMonth ? 1 : 0.6 }}>{dateObj.getDate()}</span>
              <span style={{ fontSize: 10, color: "#777" }}>{sameMonth ? label : ""}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Weekly Preview                               */
/* -------------------------------------------------------------------------- */

function WeeklyPreview({ colorScheme, availability, unavailabilityByDate, unavailableDateSet }) {
  // Build next 7 days starting today, show bars for availability vs unavailability
  const start = new Date();
  const days = [...Array(7)].map((_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });

  // Render a 24h horizontal (0..24) with an orange bar for available range, gray overlays for unavailability
  return (
    <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 10 }}>Next 7 Days</div>

      <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", rowGap: 16, columnGap: 12 }}>
        {days.map((d) => {
          const ymd = fmtYMD(d);
          const dowName = JS_DAY_TO_NAME[d.getDay()];
          const avail = availability[dowName] || { enabled: false };
          const dayUnavailability = unavailabilityByDate[ymd] || [];
          const isBlackout = unavailableDateSet.has(ymd);

          // layout constants
          const totalMinutes = 24 * 60; // 1440
          const toPercent = (min) => `${(min / totalMinutes) * 100}%`;

          // base availability bar
          const availStart = avail.enabled ? toMinutes(avail.start) : null;
          const availEnd = avail.enabled ? toMinutes(avail.end) : null;

          return (
            <div key={ymd} style={{ display: "contents" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ fontWeight: 700 }}>{d.toLocaleDateString(undefined, { weekday: "short" })}</div>
                <div style={{ color: "#777", fontSize: 12 }}>{ymd}</div>
              </div>

              <div
                style={{
                  position: "relative",
                  height: 26,
                  borderRadius: 999,
                  background: "#f3f3f3",
                  overflow: "hidden",
                }}
                title="24-hour day timeline"
              >
                {/* availability bar */}
                {avail.enabled && availStart != null && availEnd != null && (
                  <div
                    style={{
                      position: "absolute",
                      left: toPercent(availStart),
                      width: toPercent(Math.max(0, availEnd - availStart)),
                      top: 2,
                      bottom: 2,
                      background: colorScheme.accent,
                      opacity: 0.9,
                      borderRadius: 999,
                    }}
                    title={`Available ${avail.start} - ${avail.end}`}
                  />
                )}

                {/* blackout overrides: whole bar gray overlay */}
                {isBlackout && (
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: 2,
                      bottom: 2,
                      background: "#d9d9d9", // gray
                      opacity: 0.9,
                    }}
                    title="Unavailable (All Day)"
                  />
                )}

                {/* unavailability overlays (gray) */}
                {dayUnavailability.map((u, i) => {
                  if (u.allDay) {
                    return (
                      <div
                        key={i}
                        style={{
                          position: "absolute",
                          left: 0,
                          right: 0,
                          top: 2,
                          bottom: 2,
                          background: "#d9d9d9",
                          opacity: 0.9,
                        }}
                        title="Unavailable (All Day)"
                      />
                    );
                  }
                  const s = toMinutes(u.start);
                  const e = toMinutes(u.end);
                  if (s == null || e == null) return null;

                  // draw gray block — if it overlaps orange, it visually “blocks” it
                  return (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        left: toPercent(s),
                        width: toPercent(Math.max(0, e - s)),
                        top: 2,
                        bottom: 2,
                        background: "#e5e5e5", // partial gray
                        opacity: 1,
                      }}
                      title={`Unavailable ${u.start} - ${u.end}`}
                    />
                  );
                })}

                {/* hour ticks */}
                {[0, 6, 12, 18, 24].map((h) => (
                  <div
                    key={h}
                    style={{
                      position: "absolute",
                      left: toPercent(h * 60),
                      top: 0,
                      bottom: 0,
                      width: 1,
                      background: "rgba(0,0,0,.06)",
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 10, color: "#777", fontSize: 12 }}>
        Orange = available; Gray = unavailable/blocked
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Card                                      */
/* -------------------------------------------------------------------------- */

function Card({ title, accent = "#de8d2b", children }) {
  return (
    <section
      style={{
        background: "#fff",
        border: "1px solid #eaeaea",
        borderRadius: 16,
        padding: 16,
        marginBottom: 18,
        boxShadow: "0 1px 2px rgba(0,0,0,.04)",
      }}
    >
      {title && (
        <h2 style={{ color: accent, margin: "4px 0 12px", fontSize: 20, fontWeight: 700 }}>
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Style Helpers                                 */
/* -------------------------------------------------------------------------- */

const labelStyle = {
  display: "block",
  fontSize: 12,
  color: "#666",
  marginBottom: 6,
};

const fieldStyle = {
  padding: "10px",
  borderRadius: 10,
  border: "1px solid #ccc",
  background: "#fff",
  width: "100%",
  outline: "none",
};

const btnPrimary = (accent) => ({
  marginTop: 10,
  background: accent,
  color: "#fff",
  border: "none",
  padding: "10px 14px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 600,
});

const miniButton = (accent) => ({
  background: "transparent",
  color: accent,
  border: `1px solid ${accent}`,
  padding: "6px 10px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 600,
});

const btnGhost = {
  background: "transparent",
  color: "#c00",
  border: "1px solid #f3b3b3",
  padding: "6px 10px",
  borderRadius: 10,
  cursor: "pointer",
  width: "fit-content",
  fontWeight: 600,
};

const btnGhostSmall = { ...btnGhost, padding: "4px 8px", fontSize: 12 };

const btnSave = {
  background: "#4caf50",
  color: "#fff",
  border: "none",
  padding: "12px 18px",
  borderRadius: 12,
  cursor: "pointer",
  width: "100%",
  maxWidth: 360,
  fontWeight: 700,
};
