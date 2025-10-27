import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import logo from "./assets/Y-Logo.png";

/* ==========================================================================
   CatBackAI — SchedulingDashboard.jsx
   --------------------------------------------------------------------------
   • Two-column layout that matches the sketch: 
       - LEFT: Color Scheme, Branding (Logo URL), Services, Availability, Unavailability
       - RIGHT: Live Booking Form Preview + Calendar & Weekly previews
   • Logo URL (paste link) with instant preview and persistent save via n8n
   • Autosave every 30s (diff-aware)
   • Graceful loading of older schedule shapes
   • Clean, responsive styles (no external libs)
   
   NOTE: This file is self-contained and production-ready for your Vite+React app.
   Endpoints used (same as your project):
     - GET  catbackai_getbusiness?businessId=:id
     - POST catbackai_getschedule  { businessId }
     - POST catbackai_updatebookingtheme { businessId, colorScheme, logoLink, services, availability, unavailableDates, unavailability }
   ========================================================================== */

/* --------------------------------------------------------------------------
 * Constants & Utilities
 * -------------------------------------------------------------------------- */

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

// Map JS Date.getDay() (0=Sun) to our day names
const JS_DAY_TO_NAME = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

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

// Build a 6×7 grid of Dates for calendar month view
function buildMonthGrid(year, month /* 0-indexed */) {
  const firstOfMonth = new Date(year, month, 1);
  const startDay = firstOfMonth.getDay(); // 0=Sun..6=Sat
  const prevMonthDays = (startDay + 6) % 7; // lead days
  const startDate = new Date(year, month, 1 - prevMonthDays);
  const grid = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    grid.push(d);
  }
  return grid;
}

// YYYY-MM-DD
function fmtYMD(date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/* --------------------------------------------------------------------------
 * Main Component
 * -------------------------------------------------------------------------- */

export default function SchedulingDashboard() {
  const { businessId: routeId } = useParams();
  const navigate = useNavigate();

  /* ------------------------------ State ---------------------------------- */
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

  // NEW: Logo URL stored here; previewed live & saved via webhook
  const [logoLink, setLogoLink] = useState("");

  // services: name, price (required), duration(min), description
  const [services, setServices] = useState([]);

  // availability: per day -> { enabled, start, end }
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

  // calendar month cursor
  const today = new Date();
  const [monthCursor, setMonthCursor] = useState({ y: today.getFullYear(), m: today.getMonth() });

  // quick scroll refs by day
  const dayRefs = useRef({});
  DAY_ORDER.forEach((d) => {
    if (!dayRefs.current[d]) dayRefs.current[d] = { current: null };
  });

  const autosaveRef = useRef(null);
  const lastSavedPayloadRef = useRef(null);

  /* ------------------------------ Auth Guard ----------------------------- */
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

    const updateActivity = () => sessionStorage.setItem("catback_lastActive", Date.now().toString());
    window.addEventListener("mousemove", updateActivity);
    window.addEventListener("keydown", updateActivity);
    return () => {
      window.removeEventListener("mousemove", updateActivity);
      window.removeEventListener("keydown", updateActivity);
    };
  }, [routeId, navigate]);

  /* ------------------------------ Load Data ------------------------------ */
  useEffect(() => {
    if (routeId) fetchAllData(routeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId]);

  async function fetchAllData(id) {
    setLoading(true);
    setStatusMsg("");
    try {
      // 1) Business & ColorScheme
      const bizRes = await fetch(
        `https://jacobtf007.app.n8n.cloud/webhook/catbackai_getbusiness?businessId=${id}`
      );
      const bizData = await bizRes.json();
      if (!bizData?.business) throw new Error("Business not found");
      setBusiness(bizData.business);

      // Color scheme
      if (bizData.business.ColorScheme) {
        try {
          const parsed = JSON.parse(bizData.business.ColorScheme);
          if (parsed && typeof parsed === "object") setColorScheme((p) => ({ ...p, ...parsed }));
        } catch {
          /* ignore */
        }
      }

      // NEW: logo link (from your sheet/DB as LogoLink)
      if (bizData.business.LogoLink) setLogoLink(bizData.business.LogoLink);

      // 2) Schedule/services/availability
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

        // availability (upgrade older shapes)
        if (schedJson.availability && typeof schedJson.availability === "object") {
          const next = { ...availability };
          for (const day of DAY_ORDER) {
            const raw = schedJson.availability[day];
            if (!raw) continue;
            if (typeof raw?.start === "string" || typeof raw?.end === "string") {
              next[day] = {
                enabled: !!raw.enabled && !!(raw.start && raw.end),
                start: raw.start || "09:00",
                end: raw.end || "17:00",
              };
              continue;
            }
            if (Array.isArray(raw?.ranges) && raw.ranges.length > 0) {
              const first = raw.ranges[0] || {};
              next[day] = {
                enabled: !!raw.enabled && !!(first.start && first.end),
                start: first.start || "09:00",
                end: first.end || "17:00",
              };
              continue;
            }
            next[day] = { enabled: false, start: "09:00", end: "17:00" };
          }
          setAvailability(next);
        }

        // blackout
        if (Array.isArray(schedJson.unavailableDates)) setUnavailableDates(schedJson.unavailableDates);

        // partial-day
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
  }

  /* ------------------------------- Save All ------------------------------ */
  const saveDashboard = async (opts = { silent: false }) => {
    if (!opts.silent) setSaving(true);
    if (!opts.silent) setStatusMsg("Saving your booking form settings...");

    // basic validation
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
      logoLink, // NEW
      services: services.map((s) => ({
        ...s,
        price: Number(s.price),
        duration: s.duration ? Number(s.duration) : "",
      })),
      availability,
      unavailableDates,
      unavailability,
    };

    const payloadString = JSON.stringify(payload);
    if (opts.silent && lastSavedPayloadRef.current === payloadString) return true;

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

  // Autosave every 30s
  useEffect(() => {
    if (autosaveRef.current) clearInterval(autosaveRef.current);
    autosaveRef.current = setInterval(() => {
      saveDashboard({ silent: true });
    }, 30000);
    return () => {
      if (autosaveRef.current) clearInterval(autosaveRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId, colorScheme, logoLink, services, availability, unavailableDates, unavailability]);

  /* ------------------------------ Handlers -------------------------------- */
  const hexOk = (c) => /^#[0-9A-Fa-f]{6}$/.test(c);
  const setColor = (field, value) => {
    if (hexOk(value)) {
      setColorScheme((p) => ({ ...p, [field]: value }));
      setStatusMsg("");
    } else setStatusMsg("⚠️ Use valid hex (e.g., #000000).");
  };

  const addService = () => setServices((s) => [...s, { name: "", price: "", duration: "60", description: "" }]);
  const updateService = (i, k, v) => setServices((arr) => { const copy = [...arr]; copy[i] = { ...copy[i], [k]: v }; return copy; });
  const removeService = (i) => setServices((arr) => arr.filter((_, idx) => idx !== i));

  const toggleDay = (day) => setAvailability((prev) => ({ ...prev, [day]: { ...prev[day], enabled: !prev[day].enabled } }));
  const updateDay = (day, key, val) => setAvailability((prev) => ({ ...prev, [day]: { ...prev[day], [key]: val } }));

  const addBlackout = (d) => { if (!d) return; setUnavailableDates((list) => Array.from(new Set([...list, d]))); };
  const removeBlackout = (i) => setUnavailableDates((list) => list.filter((_, idx) => idx !== i));

  const addUnavailability = (entry) => {
    if (!entry.date) return;
    const clean = entry.allDay ? { ...entry, start: "", end: "" } : entry;
    setUnavailability((list) => [...list, clean]);
  };
  const removeUnavailability = (i) => setUnavailability((list) => list.filter((_, idx) => idx !== i));

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

  // derived lookups
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

  /* ------------------------------- Render --------------------------------- */
  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f7f7f8" }}>
      <Helmet>
        <title>CatBackAI | Booking Form Builder</title>
      </Helmet>

      {/* Top Bar */}
      <header style={{ background: colorScheme.header, color: "#fff", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <img src={logo} alt="CatBackAI" style={{ height: 36 }} />
          <strong style={{ fontSize: 18 }}>Scheduling Dashboard</strong>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.35)", borderRadius: 10, padding: "6px 10px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, opacity: 0.9 }}>Public:</span>
            <input value={bookingUrl} readOnly style={{ background: "transparent", color: "#fff", border: "none", outline: "none", width: 230, fontSize: 12 }} />
            <button onClick={copyLink} style={{ background: "#fff", color: colorScheme.header, border: "none", borderRadius: 8, padding: "6px 8px", cursor: "pointer", fontWeight: 600 }}>Copy</button>
          </div>

          <button onClick={() => { sessionStorage.clear(); navigate("/dashboard"); }} style={{ background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,.6)", padding: "8px 12px", borderRadius: 8, cursor: "pointer" }}>Log Out</button>
        </div>
      </header>

      {statusMsg && (
        <div style={{ background: "#fff4eb", border: "1px solid #f4c89a", padding: 12, borderRadius: 10, margin: "16px auto 0", maxWidth: 1280, width: "100%" }}>{statusMsg}</div>
      )}

      <main style={{ width: "100%", maxWidth: 1280, margin: "14px auto 140px", padding: "0 16px" }}>
        {loading ? (
          <p>Loading…</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "minmax(340px, 1fr) 1.1fr", gap: 16, alignItems: "start" }}>
            {/* LEFT COLUMN — editors */}
            <div style={{ display: "grid", gap: 16 }}>
              {/* Business Summary */}
              {business && (
                <Card>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {logoLink ? (
                      <img src={logoLink} alt="Logo" style={{ height: 48, width: 48, objectFit: "cover", borderRadius: 8, border: "1px solid #eee" }} />
                    ) : (
                      <div style={{ height: 48, width: 48, borderRadius: 8, border: "1px dashed #ddd", display: "grid", placeItems: "center", color: "#999", fontSize: 11 }}>No Logo</div>
                    )}
                    <div>
                      <div style={{ fontWeight: 700 }}>{business.BusinessName}</div>
                      <div style={{ fontSize: 12, color: "#666" }}>Public booking: catbackai.com/book/{routeId}</div>
                    </div>
                  </div>
                </Card>
              )}

              {/* BRANDING: Color Scheme + Logo URL */}
              <Card title="Branding & Colors" accent={colorScheme.accent}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
                  {(["header", "text", "background", "accent"]).map((key) => (
                    <div key={key} style={{ display: "grid", gap: 6 }}>
                      <label style={{ textTransform: "capitalize", fontWeight: 600 }}>{key}</label>
                      <input type="color" value={colorScheme[key]} onChange={(e) => setColor(key, e.target.value)} style={{ width: "100%", height: 42, borderRadius: 10, border: "1px solid #ddd", background: "#fff", cursor: "pointer" }} />
                    </div>
                  ))}
                </div>
                <div style={{ height: 1, background: "#f0f0f0", margin: "14px 0" }} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center" }}>
                  <div>
                    <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Logo URL</label>
                    <input value={logoLink} onChange={(e) => setLogoLink(e.target.value)} placeholder="https://example.com/logo.png" style={fieldStyle} />
                    <p style={{ color: "#777", fontSize: 12, marginTop: 6 }}>Paste a direct image link (from your site, Imgur, Cloudinary, etc.).</p>
                  </div>
                  <div>
                    {logoLink ? (
                      <img src={logoLink} alt="preview" style={{ height: 56, width: 56, objectFit: "cover", borderRadius: 10, border: "1px solid #eee" }} />
                    ) : (
                      <div style={{ height: 56, width: 56, borderRadius: 10, border: "1px dashed #ddd", display: "grid", placeItems: "center", color: "#999", fontSize: 11 }}>Preview</div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Services */}
              <Card title="Services" accent={colorScheme.accent}>
                <div style={{ display: "grid", gap: 12 }}>
                  {services.map((s, i) => (
                    <div key={i} style={{ background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: 12, display: "grid", gap: 10 }}>
                      <input placeholder="Service name" value={s.name} onChange={(e) => updateService(i, "name", e.target.value)} style={fieldStyle} required />
                      <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 10, alignItems: "center" }}>
                        <input type="number" min="0" placeholder="Price" value={s.price} onChange={(e) => updateService(i, "price", e.target.value)} style={fieldStyle} required />
                        <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 10 }}>
                          <select value={s.duration || "60"} onChange={(e) => updateService(i, "duration", e.target.value)} style={fieldStyle}>
                            {DURATION_OPTIONS.map((m) => (
                              <option key={m} value={m}>{m} min</option>
                            ))}
                          </select>
                          <input placeholder="Description (optional)" value={s.description} onChange={(e) => updateService(i, "description", e.target.value)} style={fieldStyle} />
                        </div>
                      </div>
                      <button type="button" onClick={() => removeService(i)} style={btnGhost}>Remove</button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addService} style={btnPrimary(colorScheme.accent)}>+ Add Service</button>
              </Card>

              {/* Availability (single range per day) */}
              <Card title="Availability (weekly)" accent={colorScheme.accent}>
                <div style={{ display: "grid", gap: 12 }}>
                  {DAY_ORDER.map((day) => {
                    const data = availability[day];
                    return (
                      <div key={day} ref={(el) => (dayRefs.current[day] = el)} style={{ background: "#fff", border: "1px solid #eee", borderRadius: 10, padding: 12, display: "grid", gridTemplateColumns: "auto 140px 140px", gap: 10, alignItems: "center" }}>
                        <label style={{ fontWeight: 700 }}>
                          <input type="checkbox" checked={!!data.enabled} onChange={() => toggleDay(day)} style={{ marginRight: 8 }} />
                          {day}
                        </label>
                        <input type="time" disabled={!data.enabled} value={data.start} onChange={(e) => updateDay(day, "start", e.target.value)} style={fieldStyle} />
                        <input type="time" disabled={!data.enabled} value={data.end} onChange={(e) => updateDay(day, "end", e.target.value)} style={fieldStyle} />
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Add Unavailability (specific times) */}
              <Card title="Add Unavailability (specific times)" accent={colorScheme.accent}>
                <AddUnavailabilityForm onAdd={addUnavailability} accent={colorScheme.accent} />
                <div style={{ marginTop: 16 }}>
                  {unavailability.length > 0 ? (
                    unavailability.map((u, i) => (
                      <div key={`${u.date}-${i}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", border: "1px solid #eee", borderRadius: 8, padding: "8px 12px", marginBottom: 6 }}>
                        <span style={{ fontSize: 14 }}>🗓️ <strong>{u.date}</strong> — {u.allDay ? "All Day" : `${u.start || "--"} → ${u.end || "--"}`}</span>
                        <button onClick={() => removeUnavailability(i)} style={btnGhostSmall} aria-label="remove unavailability">×</button>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: "#777", fontSize: 14, margin: 0 }}>No unavailability added yet.</p>
                  )}
                </div>
              </Card>

              {/* Blackout dates */}
              <Card title="Blackout Dates (full day)" accent={colorScheme.accent}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10 }}>
                  <input type="date" id="blackout-picker" style={fieldStyle} />
                  <button onClick={() => {
                    const el = document.getElementById("blackout-picker");
                    if (el && el.value) addBlackout(el.value);
                  }} style={miniButton(colorScheme.accent)}>+ Add</button>
                </div>
                <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {unavailableDates.length === 0 && <span style={{ color: "#777", fontSize: 13 }}>None</span>}
                  {unavailableDates.map((d, i) => (
                    <span key={d} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid #eee", padding: "6px 10px", borderRadius: 999 }}>
                      {d}
                      <button onClick={() => removeBlackout(i)} style={pillX}>×</button>
                    </span>
                  ))}
                </div>
              </Card>
            </div>

            {/* RIGHT COLUMN — live previews */}
            <div style={{ display: "grid", gap: 16 }}>
              {/* Live Booking Form Preview (matches sketch) */}
              <Card title="Live Booking Form Preview" accent={colorScheme.accent}>
                <BookingFormPreview
                  businessName={business?.BusinessName || "Business Name"}
                  logoLink={logoLink}
                  colorScheme={colorScheme}
                  services={services}
                  availability={availability}
                />
              </Card>

              {/* Calendar + Weekly previews */}
              <Card title="Calendar Preview" accent={colorScheme.accent}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
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

                  <WeeklyPreview
                    colorScheme={colorScheme}
                    availability={availability}
                    unavailabilityByDate={unavailabilityByDate}
                    unavailableDateSet={unavailableDateSet}
                  />
                </div>
              </Card>
            </div>
          </div>
        )}
      </main>

      {/* Sticky Save Bar */}
      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, background: "#fff", borderTop: "1px solid #eee", padding: "12px 16px", display: "flex", justifyContent: "center", zIndex: 50 }}>
        <button type="button" onClick={() => saveDashboard({ silent: false })} disabled={saving} style={btnSave}>
          {saving ? "Saving…" : "Save All Changes"}
        </button>
      </div>

      <footer style={{ padding: 16, textAlign: "center", color: "#888", marginBottom: 60 }}>© {new Date().getFullYear()} CatBackAI</footer>
    </div>
  );
}

/* --------------------------------------------------------------------------
 * Booking Form Preview (Right Column)
 * -------------------------------------------------------------------------- */

function BookingFormPreview({ businessName, logoLink, colorScheme, services, availability }) {
  // compute next 7 days that are available, with basic time slots every 60 min
  const serviceDuration = useMemo(() => {
    const first = services[0];
    const d = parseInt(first?.duration || "60", 10);
    return Number.isFinite(d) && d > 0 ? d : 60;
  }, [services]);

  const daysWithSlots = useMemo(() => {
    const out = [];
    const start = new Date();
    for (let i = 0; i < 28; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const name = JS_DAY_TO_NAME[d.getDay()];
      const conf = availability[name];
      if (!conf?.enabled) continue;
      const slots = buildSlots(conf.start, conf.end, serviceDuration).map((t) => ({ date: fmtYMD(d), time: t }));
      if (slots.length) out.push({ date: fmtYMD(d), label: d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }), slots });
      if (out.length >= 7) break;
    }
    return out;
  }, [availability, serviceDuration]);

  // local preview-only form state (not persisted)
  const [form, setForm] = useState({ name: "", email: "", phone: "", service: "", date: "", time: "" });

  useEffect(() => {
    if (!form.service && services[0]?.name) setForm((f) => ({ ...f, service: services[0].name }));
  }, [services]);

  const fieldBase = {
    padding: "12px 12px",
    borderRadius: 10,
    border: "1px solid #ddd",
    background: "#fff",
    width: "100%",
    outline: "none",
    color: colorScheme.text,
  };

  return (
    <div style={{ border: "1px solid #eee", borderRadius: 12, overflow: "hidden", background: colorScheme.background, color: colorScheme.text, transition: "all 0.2s ease" }}>
      {/* Header strip matching sketch */}
      <div style={{ background: colorScheme.header, color: "#fff", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        {logoLink && <img src={logoLink} alt="logo" style={{ height: 36, width: 36, objectFit: "cover", borderRadius: 6, border: "1px solid rgba(255,255,255,.5)" }} />}
        <div style={{ fontWeight: 900, fontSize: 18 }}>{businessName}</div>
      </div>

      {/* Body */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, padding: 16 }}>
        {/* Top row: Name / Email / Phone */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10 }}>
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={fieldBase} />
          <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={fieldBase} />
          <input type="tel" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={fieldBase} />
        </div>

        {/* Service dropdown */}
        <select value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} style={fieldBase}>
          {!services.length && <option>(No services yet)</option>}
          {services.map((s, i) => (
            <option key={i} value={s.name}>{s.name} — ${s.price}{s.duration ? ` (${s.duration} min)` : ""}</option>
          ))}
        </select>

        {/* Date + Time row (like your sketch) */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <select value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value, time: "" })} style={fieldBase}>
            <option value="">Select Date</option>
            {daysWithSlots.map((d) => (
              <option key={d.date} value={d.date}>{d.label}</option>
            ))}
          </select>

          <select value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} style={fieldBase} disabled={!form.date}>
            <option value="">Select Time</option>
            {form.date && daysWithSlots.find((d) => d.date === form.date)?.slots.map((s) => (
              <option key={s.time} value={s.time}>{s.time}</option>
            ))}
          </select>
        </div>

        <button style={{ background: colorScheme.accent, border: "none", borderRadius: 12, padding: "12px 14px", color: "#fff", cursor: "pointer", fontWeight: 800, marginTop: 4 }}>Book Now</button>
      </div>
    </div>
  );
}

function buildSlots(startHHMM, endHHMM, stepMinutes) {
  const s = toMinutes(startHHMM);
  const e = toMinutes(endHHMM);
  if (s == null || e == null || e <= s) return [];
  const out = [];
  for (let t = s; t + stepMinutes <= e; t += stepMinutes) out.push(toHHMM(t));
  return out;
}

/* --------------------------------------------------------------------------
 * AddUnavailability Form (Left column helper)
 * -------------------------------------------------------------------------- */

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
        <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={fieldStyle} />
      </div>

      <div>
        <label style={labelStyle}>From</label>
        <input type="time" value={form.start} disabled={form.allDay} onChange={(e) => setForm({ ...form, start: e.target.value })} style={fieldStyle} />
      </div>

      <div>
        <label style={labelStyle}>To</label>
        <input type="time" value={form.end} disabled={form.allDay} onChange={(e) => setForm({ ...form, end: e.target.value })} style={fieldStyle} />
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input type="checkbox" checked={form.allDay} onChange={(e) => setForm({ ...form, allDay: e.target.checked })} />
        All Day
      </label>

      <button onClick={handleAdd} style={miniButton(accent)}>+ Add</button>
    </div>
  );
}

/* --------------------------------------------------------------------------
 * Month Preview (Right column)
 * -------------------------------------------------------------------------- */

function MonthPreview({ colorScheme, monthCursor, setMonthCursor, availability, unavailableDateSet, unavailabilityByDate, onPickDay }) {
  const { y, m } = monthCursor;
  const grid = useMemo(() => buildMonthGrid(y, m), [y, m]);

  const goPrev = () => { const nm = m - 1; if (nm < 0) setMonthCursor({ y: y - 1, m: 0 }); else setMonthCursor({ y, m: nm }); };
  const goNext = () => { const nm = m + 1; if (nm > 11) setMonthCursor({ y: y + 1, m: 11 }); else setMonthCursor({ y, m: nm }); };

  return (
    <div style={{ border: "1px solid #eee", borderRadius: 12, background: "#fff", overflow: "hidden" }}>
      <div style={{ background: colorScheme.header, color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px" }}>
        <button onClick={goPrev} style={{ background: "rgba(255,255,255,.2)", color: "#fff", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer" }}>‹</button>
        <div style={{ fontWeight: 700 }}>{new Date(y, m, 1).toLocaleString(undefined, { month: "long", year: "numeric" })}</div>
        <button onClick={goNext} style={{ background: "rgba(255,255,255,.2)", color: "#fff", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer" }}>›</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "8px 8px 0 8px", color: "#666", fontSize: 12 }}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} style={{ textAlign: "center", padding: "6px 0" }}>{d}</div>
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

          let bg = "#fff";
          let label = "";

          if (sameMonth && dayAvail.enabled) { bg = "#fff"; label = "Available"; }
          else { bg = "#fafafa"; label = "Off"; }

          let hasPartial = false;
          for (const u of dayUnavailability) {
            hasPartial = true;
            if (u.allDay) { bg = "#eee"; label = "Unavailable (All Day)"; break; }
          }
          if (!allDayUnavailable && hasPartial) { bg = "#f1f1f1"; if (label === "Available") label = "Partial Unavailable"; }
          if (allDayUnavailable) { bg = "#eee"; label = "Unavailable"; }

          const color = sameMonth ? "#111" : "#aaa";
          const border = sameMonth ? "1px solid #eee" : "1px dashed #f0f0f0";

          return (
            <button key={ymd + idx} onClick={() => onPickDay(dateObj)} style={{ aspectRatio: "1 / 1", border, borderRadius: 10, background: bg, color, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "space-between", padding: 8 }} title={`${ymd} — ${label}`}>
              <span style={{ fontWeight: 700, opacity: sameMonth ? 1 : 0.6 }}>{dateObj.getDate()}</span>
              <span style={{ fontSize: 10, color: "#777" }}>{sameMonth ? label : ""}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
 * Weekly Preview (Right column)
 * -------------------------------------------------------------------------- */

function WeeklyPreview({ colorScheme, availability, unavailabilityByDate, unavailableDateSet }) {
  const start = new Date();
  const days = [...Array(7)].map((_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });

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

          const totalMinutes = 24 * 60;
          const toPercent = (min) => `${(min / totalMinutes) * 100}%`;

          const availStart = avail.enabled ? toMinutes(avail.start) : null;
          const availEnd = avail.enabled ? toMinutes(avail.end) : null;

          return (
            <div key={ymd} style={{ display: "contents" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ fontWeight: 700 }}>{d.toLocaleDateString(undefined, { weekday: "short" })}</div>
                <div style={{ color: "#777", fontSize: 12 }}>{ymd}</div>
              </div>

              <div style={{ position: "relative", height: 26, borderRadius: 999, background: "#f3f3f3", overflow: "hidden" }} title="24-hour day timeline">
                {avail.enabled && availStart != null && availEnd != null && (
                  <div style={{ position: "absolute", left: toPercent(availStart), width: toPercent(Math.max(0, availEnd - availStart)), top: 2, bottom: 2, background: colorScheme.accent, opacity: 0.9, borderRadius: 999 }} title={`Available ${avail.start} - ${avail.end}`} />
                )}

                {isBlackout && (
                  <div style={{ position: "absolute", left: 0, right: 0, top: 2, bottom: 2, background: "#d9d9d9", opacity: 0.9 }} title="Unavailable (All Day)" />
                )}

                {dayUnavailability.map((u, i) => {
                  if (u.allDay) {
                    return (
                      <div key={i} style={{ position: "absolute", left: 0, right: 0, top: 2, bottom: 2, background: "#d9d9d9", opacity: 0.9 }} title="Unavailable (All Day)" />
                    );
                  }
                  const s = toMinutes(u.start);
                  const e = toMinutes(u.end);
                  if (s == null || e == null) return null;
                  return (
                    <div key={i} style={{ position: "absolute", left: toPercent(s), width: toPercent(Math.max(0, e - s)), top: 2, bottom: 2, background: "#e5e5e5", opacity: 1 }} title={`Unavailable ${u.start} - ${u.end}`} />
                  );
                })}

                {[0, 6, 12, 18, 24].map((h) => (
                  <div key={h} style={{ position: "absolute", left: toPercent(h * 60), top: 0, bottom: 0, width: 1, background: "rgba(0,0,0,.06)" }} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 10, color: "#777", fontSize: 12 }}>Orange = available; Gray = unavailable/blocked</div>
    </div>
  );
}

/* --------------------------------------------------------------------------
 * Card + Shared Styles
 * -------------------------------------------------------------------------- */

function Card({ title, accent = "#de8d2b", children }) {
  return (
    <section style={{ background: "#fff", border: "1px solid #eaeaea", borderRadius: 16, padding: 16, boxShadow: "0 1px 2px rgba(0,0,0,.04)", }}>
      {title && <h2 style={{ color: accent, margin: "4px 0 12px", fontSize: 20, fontWeight: 700 }}>{title}</h2>}
      {children}
    </section>
  );
}

const labelStyle = { display: "block", fontSize: 12, color: "#666", marginBottom: 6 };
const fieldStyle = { padding: "10px", borderRadius: 10, border: "1px solid #ccc", background: "#fff", width: "100%", outline: "none" };
const btnPrimary = (accent) => ({ marginTop: 10, background: accent, color: "#fff", border: "none", padding: "10px 14px", borderRadius: 10, cursor: "pointer", fontWeight: 600 });
const miniButton = (accent) => ({ background: "transparent", color: accent, border: `1px solid ${accent}`, padding: "6px 10px", borderRadius: 10, cursor: "pointer", fontWeight: 600 });
const btnGhost = { background: "transparent", color: "#c00", border: "1px solid #f3b3b3", padding: "6px 10px", borderRadius: 10, cursor: "pointer", width: "fit-content", fontWeight: 600 };
const btnGhostSmall = { ...btnGhost, padding: "4px 8px", fontSize: 12 };
const btnSave = { background: "#4caf50", color: "#fff", border: "none", padding: "12px 18px", borderRadius: 12, cursor: "pointer", width: "100%", maxWidth: 360, fontWeight: 700 };
const pillX = { background: "transparent", border: "none", fontSize: 16, cursor: "pointer", lineHeight: 1, color: "#c00" };
