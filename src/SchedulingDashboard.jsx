import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import logo from "./assets/Y-Logo.png";

export default function SchedulingDashboard() {
  const { businessId: routeId } = useParams();
  const navigate = useNavigate();

  /* ---------- STATE ---------- */
  const [business, setBusiness] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  // color scheme used by the PUBLIC booking form (not the dashboard itself)
  const [colorScheme, setColorScheme] = useState({
    header: "#de8d2b",
    text: "#000000",
    background: "#ffffff",
    accent: "#de8d2b",
  });

  // services: name, price, duration(min), description
  const [services, setServices] = useState([
    // { name: "", price: "", duration: "", description: "" }
  ]);

  // weekly availability (Deputy-like on/off with start & end)
  const [availability, setAvailability] = useState({
    Monday: { enabled: false, start: "", end: "" },
    Tuesday: { enabled: false, start: "", end: "" },
    Wednesday: { enabled: false, start: "", end: "" },
    Thursday: { enabled: false, start: "", end: "" },
    Friday: { enabled: false, start: "", end: "" },
    Saturday: { enabled: false, start: "", end: "" },
    Sunday: { enabled: false, start: "", end: "" },
  });

  // blackout dates (array of YYYY-MM-DD)
  const [unavailableDates, setUnavailableDates] = useState([]);

/* ---------- AUTH GUARD ---------- */
const [gateReady, setGateReady] = useState(false);

useEffect(() => {
  if (!routeId) return;

  const timer = setTimeout(() => {
    const lastActive = sessionStorage.getItem("catback_lastActive");

    // 🚫 invalid or missing token
    if (!token || token !== routeId) {
      sessionStorage.clear();
      navigate("/dashboard", { replace: true });
      return;
    }

    // ⏳ expired session
    if (lastActive && Date.now() - parseInt(lastActive, 10) > 3600000) {
      sessionStorage.clear();
      navigate("/dashboard", { replace: true });
      return;
    }

    // ✅ passed auth check
    setGateReady(true);

    // 🕓 refresh lastActive timestamp on user activity
    const bump = () => sessionStorage.setItem("catback_lastActive", Date.now().toString());
    window.addEventListener("mousemove", bump);
    window.addEventListener("keydown", bump);

    return () => {
      window.removeEventListener("mousemove", bump);
      window.removeEventListener("keydown", bump);
    };
  }, 250); // Safari buffer

  return () => clearTimeout(timer);
}, [routeId, navigate]);

// 🧭 show loading placeholder until verified
if (!gateReady) {
  return (
    <div
      style={{
        textAlign: "center",
        marginTop: "40vh",
        fontFamily: "Inter, system-ui, sans-serif",
        color: "#999",
      }}
    >
      Loading dashboard…
    </div>
  );
}

  /* ---------- FETCH BUSINESS + EXISTING THEME ---------- */
  useEffect(() => {
    if (routeId) fetchAllData(routeId);
  }, [routeId]);

  const fetchAllData = async (id) => {
    setLoading(true);
    setStatusMsg("");
    try {
      // business basics (and maybe stored ColorScheme JSON)
      const bizRes = await fetch(
        `https://jacobtf007.app.n8n.cloud/webhook/catbackai_getbusiness?businessId=${id}`
      );
      const bizData = await bizRes.json();
      if (!bizData?.business) throw new Error("Business not found");
      setBusiness(bizData.business);

      // load saved color scheme if present in sheet
      if (bizData.business.ColorScheme) {
        try {
          const parsed = JSON.parse(bizData.business.ColorScheme);
          if (parsed && typeof parsed === "object") setColorScheme(parsed);
        } catch {
          // ignore invalid json
        }
      }

      // load schedule/services/availability if you’re storing them separately
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
              price: s.price ?? s.Price ?? "",
              duration: s.duration ?? s.Duration ?? "",
              description: s.description ?? s.Description ?? "",
            }))
          );
        } else if (Array.isArray(schedJson.schedule)) {
          // older structure
          setServices(
            schedJson.schedule.map((s) => ({
              name: s.ServiceName || "",
              price: s.Price || "",
              duration: s.Duration || "",
              description: s.Description || "",
            }))
          );
        } else if (typeof schedJson.servicesCsv === "string") {
          setServices(
            schedJson.servicesCsv
              .split(",")
              .map((n) => ({ name: n.trim(), price: "", duration: "", description: "" }))
              .filter((x) => x.name)
          );
        }

        // availability
        if (schedJson.availability && typeof schedJson.availability === "object") {
          setAvailability((prev) => ({ ...prev, ...schedJson.availability }));
        }

        // blackout dates
        if (Array.isArray(schedJson.unavailableDates)) {
          setUnavailableDates(schedJson.unavailableDates);
        }
      }
    } catch (err) {
      setStatusMsg("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- SAVE ALL (BOOKING THEME + SCHEDULING) ---------- */
  const saveDashboard = async () => {
    setSaving(true);
    setStatusMsg("Saving your booking form settings...");
    const payload = {
      businessId: routeId,
      colorScheme,
      services,
      availability,
      unavailableDates,
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
    setServices((s) => [...s, { name: "", price: "", duration: "", description: "" }]);

  const updateService = (i, k, v) =>
    setServices((arr) => {
      const copy = [...arr];
      copy[i] = { ...copy[i], [k]: v };
      return copy;
    });

  const removeService = (i) =>
    setServices((arr) => arr.filter((_, idx) => idx !== i));

  const toggleDay = (day) =>
    setAvailability((prev) => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled },
    }));

  const updateDay = (day, key, val) =>
    setAvailability((prev) => ({ ...prev, [day]: { ...prev[day], [key]: val } }));

  const addBlackout = (d) => {
    if (!d) return;
    setUnavailableDates((list) => Array.from(new Set([...list, d])));
  };
  const removeBlackout = (i) =>
    setUnavailableDates((list) => list.filter((_, idx) => idx !== i));

  /* ---------- UI ---------- */
  return (
    <div
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#fafafa",
      }}
    >
      <Helmet>
        <title>CatBackAI | Booking Form Builder</title>
      </Helmet>

      {/* Header */}
      <header
        style={{
          background: "#de8d2b",
          color: "#fff",
          padding: "16px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <img src={logo} alt="CatBackAI" style={{ height: 40 }} />
          <strong>Dashboard</strong>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <a
            href={`/book/${routeId}`}
            style={{
              color: "#fff",
              textDecoration: "underline",
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,.4)",
            }}
          >
            View Booking Page
          </a>
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

      {/* Body */}
            <main style={{ maxWidth: 1050, margin: "0 auto", padding: "24px 16px", width: "100%" }}>
        {statusMsg && (
          <div
            style={{
              background: "#fff4eb",
              border: "1px solid #f4c89a",
              padding: 12,
              borderRadius: 10,
              marginBottom: 16,
            }}
          >
            {statusMsg}
          </div>
        )}

        {loading ? (
          <p>Loading…</p>
        ) : (
          <>
            {/* Business Summary */}
            {business && (
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #eee",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 18,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
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
            )}

            {/* Color Scheme */}
            <section style={{ marginBottom: 26 }}>
              <h2 style={{ color: "#de8d2b" }}>Color Scheme (Booking Form)</h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                  gap: 12,
                  background: "#fff",
                  border: "1px solid #eee",
                  borderRadius: 12,
                  padding: 16,
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
                        height: 40,
                        borderRadius: 8,
                        border: "1px solid #ddd",
                        background: "#fff",
                        cursor: "pointer",
                      }}
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Services */}
            <section style={{ marginBottom: 26 }}>
              <h2 style={{ color: "#de8d2b" }}>Services</h2>
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
                    />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <input
                        placeholder="Price (optional)"
                        value={s.price}
                        onChange={(e) => updateService(i, "price", e.target.value)}
                        style={fieldStyle}
                      />
                      <input
                        placeholder="Duration (mins)"
                        value={s.duration}
                        onChange={(e) => updateService(i, "duration", e.target.value)}
                        style={fieldStyle}
                      />
                    </div>
                    <textarea
                      placeholder="Description (optional)"
                      value={s.description}
                      onChange={(e) => updateService(i, "description", e.target.value)}
                      rows={2}
                      style={fieldStyle}
                    />
                    <button
                      type="button"
                      onClick={() => removeService(i)}
                      style={btnGhost}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addService} style={btnPrimary}>
                + Add Service
              </button>
            </section>

            {/* Availability */}
            <section style={{ marginBottom: 26 }}>
              <h2 style={{ color: "#de8d2b" }}>Availability (weekly)</h2>
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #eee",
                  borderRadius: 12,
                  padding: 12,
                  display: "grid",
                  gap: 10,
                }}
              >
                {Object.entries(availability).map(([day, data]) => (
                  <div
                    key={day}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "auto 120px 120px",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <label style={{ fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={data.enabled}
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
                ))}
              </div>
            </section>

            {/* Blackout Dates */}
            <section style={{ marginBottom: 26 }}>
              <h2 style={{ color: "#de8d2b" }}>Unavailable Dates (one-off)</h2>
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #eee",
                  borderRadius: 12,
                  padding: 12,
                  display: "grid",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", gap: 10 }}>
                  <input
                    type="date"
                    onChange={(e) => addBlackout(e.target.value)}
                    style={fieldStyle}
                  />
                </div>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {unavailableDates.map((d, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span>{d}</span>
                      <button type="button" onClick={() => removeBlackout(i)} style={btnGhostSmall}>
                        remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <button type="button" onClick={saveDashboard} disabled={saving} style={btnSave}>
              {saving ? "Saving…" : "Save All Changes"}
            </button>
          </>
        )}
      </main>

      {/* Footer spacer to avoid “getting shorter” feel and ensure full page height */}
      <footer style={{ padding: 16, textAlign: "center", color: "#888" }}>
        © {new Date().getFullYear()} CatBackAI
      </footer>
    </div>
  );
}

/* ---------- tiny style helpers ---------- */
const fieldStyle = {
  padding: "10px",
  borderRadius: 8,
  border: "1px solid #ccc",
  background: "#fff",
  width: "100%",
};
const btnPrimary = {
  marginTop: 10,
  background: "#de8d2b",
  color: "#fff",
  border: "none",
  padding: "10px 14px",
  borderRadius: 10,
  cursor: "pointer",
};
const btnGhost = {
  background: "transparent",
  color: "#c00",
  border: "1px solid #f3b3b3",
  padding: "6px 10px",
  borderRadius: 8,
  cursor: "pointer",
  width: "fit-content",
};
const btnGhostSmall = { ...btnGhost, padding: "2px 8px", fontSize: 12 };
const btnSave = {
  background: "#4caf50",
  color: "#fff",
  border: "none",
  padding: "12px 18px",
  borderRadius: 12,
  cursor: "pointer",
  width: "100%",
  maxWidth: 320,
  margin: "4px 0 26px",
};
