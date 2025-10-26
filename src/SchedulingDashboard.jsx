import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import logo from "./assets/Y-Logo.png";

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

  // specific time blocks a.k.a. partial-day unavailability
  const [unavailability, setUnavailability] = useState([]); // [{ date, start, end, allDay }]

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
              duration: (s.duration ?? s.Duration ?? "").toString(),
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

  /* ---------- SAVE ALL ---------- */
  const saveDashboard = async () => {
    setSaving(true);
    setStatusMsg("Saving your booking form settings...");

    // basic validation: services -> price required, duration numeric or empty
    for (const s of services) {
      if (!s.name?.trim()) {
        setSaving(false);
        setStatusMsg("⚠️ Each service needs a name.");
        return;
      }
      if (s.price === "" || isNaN(Number(s.price))) {
        setSaving(false);
        setStatusMsg("⚠️ Price is required and must be a number for each service.");
        return;
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
      unavailability, // NEW
    };

    try {
      const res = await fetch(
        "https://jacobtf007.app.n8n.cloud/webhook/catbackai_updatebookingtheme",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error(await res.text());
      setStatusMsg("✅ Saved! Your booking page will use these settings.");
    } catch (err) {
      setStatusMsg("❌ " + err.message);
    } finally {
      setSaving(false);
    }
  };

  /* ---------- HANDLERS ---------- */
  const hexOk = (c) => /^#[0-9A-Fa-f]{6}$/.test(c);
  const setColor = (field, value) => {
    if (hexOk(value)) {
      setColorScheme((p) => ({ ...p, [field]: value }));
      setStatusMsg("");
    } else setStatusMsg("⚠️ Use valid hex (e.g., #000000).");
  };

  const addService = () =>
    setServices((s) => [...s, { name: "", price: "", duration: "30", description: "" }]);

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
          // Keep last start/end; if enabling first time, keep defaults already set
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
      <main style={{ maxWidth: 1080, margin: "14px auto 90px", padding: "0 16px", width: "100%" }}>
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

            {/* Live Preview */}
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
                      // force text color for Safari/Chrome
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

            {/* Blackout Dates */}
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
            <Card title="Add Unavailability" accent={colorScheme.accent}>
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
                      <span>
                        🗓️ {u.date} — {u.allDay ? "All Day" : `${u.start || "--"} → ${u.end || "--"}`}
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
        }}
      >
        <button type="button" onClick={saveDashboard} disabled={saving} style={btnSave}>
          {saving ? "Saving…" : "Save All Changes"}
        </button>
      </div>

      <footer style={{ padding: 16, textAlign: "center", color: "#888", marginBottom: 60 }}>
        © {new Date().getFullYear()} CatBackAI
      </footer>
    </div>
  );
}

/* ---------- Add Unavailability Inline Form ---------- */
function AddUnavailabilityForm({ onAdd, accent }) {
  const [form, setForm] = useState({ date: "", start: "", end: "", allDay: false });

  const handleAdd = () => {
    if (!form.date) return;
    if (!form.allDay && (!form.start || !form.end)) return;
    onAdd(form);
    setForm({ date: "", start: "", end: "", allDay: false });
  };

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
      <input
        type="date"
        value={form.date}
        onChange={(e) => setForm({ ...form, date: e.target.value })}
        style={fieldStyle}
      />
      <input
        type="time"
        value={form.start}
        disabled={form.allDay}
        onChange={(e) => setForm({ ...form, start: e.target.value })}
        style={fieldStyle}
      />
      <input
        type="time"
        value={form.end}
        disabled={form.allDay}
        onChange={(e) => setForm({ ...form, end: e.target.value })}
        style={fieldStyle}
      />
      <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 14 }}>
        <input
          type="checkbox"
          checked={form.allDay}
          onChange={(e) => setForm({ ...form, allDay: e.target.checked })}
        />
        All Day
      </label>
      <button onClick={handleAdd} style={miniButton(accent)}>
        + Add Unavailability
      </button>
    </div>
  );
}

/* ---------- Reusable Card ---------- */
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

/* ---------- tiny style helpers ---------- */
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
