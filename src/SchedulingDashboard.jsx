import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import logo from "./assets/Y-Logo.png";

export default function SchedulingDashboard() {
  const { businessId: routeId } = useParams();
  const navigate = useNavigate();

  /* ---------- STATE ---------- */
  const [activeTab, setActiveTab] = useState("customize");
  const [business, setBusiness] = useState(null);
  const [services, setServices] = useState([]);
  const [availability, setAvailability] = useState({
    Monday: { enabled: false, start: "", end: "" },
    Tuesday: { enabled: false, start: "", end: "" },
    Wednesday: { enabled: false, start: "", end: "" },
    Thursday: { enabled: false, start: "", end: "" },
    Friday: { enabled: false, start: "", end: "" },
    Saturday: { enabled: false, start: "", end: "" },
    Sunday: { enabled: false, start: "", end: "" },
  });
  const [unavailableDates, setUnavailableDates] = useState([]);
  const [colorScheme, setColorScheme] = useState({
    header: "#de8d2b",
    text: "#000000",
    background: "#ffffff",
    accent: "#de8d2b",
  });
  const [statusMsg, setStatusMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ---------- AUTH GUARD ---------- */
  useEffect(() => {
    const token = localStorage.getItem("catback_token");
    if (!token || token !== routeId) {
      alert("Please log in first.");
      navigate("/dashboard");
      return;
    }

    const logout = () => {
      localStorage.removeItem("catback_token");
      localStorage.removeItem("catback_lastActive");
      navigate("/dashboard");
    };

    const checkInactivity = setInterval(() => {
      const lastActive = localStorage.getItem("catback_lastActive");
      if (lastActive && Date.now() - parseInt(lastActive) > 30 * 60 * 1000) {
        alert("Session expired. Please log in again.");
        logout();
      }
    }, 60000);

    const updateActivity = () => {
      localStorage.setItem("catback_lastActive", Date.now().toString());
    };

    window.addEventListener("click", updateActivity);
    window.addEventListener("keydown", updateActivity);
    window.addEventListener("beforeunload", logout);

    return () => {
      clearInterval(checkInactivity);
      window.removeEventListener("click", updateActivity);
      window.removeEventListener("keydown", updateActivity);
      window.removeEventListener("beforeunload", logout);
    };
  }, [routeId, navigate]);

  /* ---------- FETCH BUSINESS + SCHEDULE ---------- */
  useEffect(() => {
    if (routeId) fetchAllData(routeId);
  }, [routeId]);

  const fetchAllData = async (id) => {
    setLoading(true);
    try {
      const bizRes = await fetch(
        `https://jacobtf007.app.n8n.cloud/webhook/catbackai_getbusiness?businessId=${id}`
      );
      const bizData = await bizRes.json();
      if (!bizData.business) throw new Error("Business not found.");
      setBusiness(bizData.business);

      const schedRes = await fetch(
        "https://jacobtf007.app.n8n.cloud/webhook/catbackai_getschedule",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ businessId: id }),
        }
      );
      const schedJson = await schedRes.json();

      if (schedJson.result === "ok" && Array.isArray(schedJson.schedule)) {
        setServices(
          schedJson.schedule.map((s) => ({
            name: s.ServiceName || "",
            price: s.Price || "",
            duration: s.Duration || "",
            description: s.Description || "",
          }))
        );
      }
    } catch (err) {
      setStatusMsg("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- SAVE ALL DATA ---------- */
  const saveDashboard = async () => {
    setSaving(true);
    setStatusMsg("Saving all changes...");

    const payload = {
      businessId: routeId,
      services,
      availability,
      unavailableDates,
      colorScheme,
    };

    try {
      const res = await fetch(
        "https://jacobtf007.app.n8n.cloud/webhook/catbackai_updateschedule",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error(await res.text());
      setStatusMsg("✅ Dashboard saved successfully!");
    } catch (err) {
      setStatusMsg("❌ " + err.message);
    } finally {
      setSaving(false);
    }
  };

  /* ---------- UI COMPONENTS ---------- */

  const TabButton = ({ id, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        background: activeTab === id ? "#de8d2b" : "transparent",
        color: activeTab === id ? "#fff" : "#de8d2b",
        border: "1px solid #de8d2b",
        borderRadius: 8,
        padding: "8px 16px",
        cursor: "pointer",
        fontWeight: 600,
        transition: "all 0.2s ease-in-out",
      }}
    >
      {label}
    </button>
  );

  const handleAddService = () =>
    setServices([...services, { name: "", price: "", duration: "", description: "" }]);

  const handleColorChange = (field, value) => {
    // Fix Safari invalid color error by validating hex format
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      setColorScheme((prev) => ({ ...prev, [field]: value }));
      setStatusMsg("");
    } else {
      setStatusMsg("⚠️ Invalid color format. Please use hex (#000000).");
    }
  };

  const handleAvailabilityToggle = (day) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled },
    }));
  };

  /* ---------- RENDER ---------- */
  return (
    <div
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        background: colorScheme.background,
        color: colorScheme.text,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Helmet>
        <title>CatBackAI Dashboard | Scheduling</title>
      </Helmet>

      {/* HEADER */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 24px",
          background: colorScheme.header,
          color: "#fff",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={logo} alt="CatBackAI Logo" style={{ height: 40 }} />
          <h1 style={{ fontWeight: 800, fontSize: 20 }}>Dashboard</h1>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 8,
          }}
        >
          <TabButton id="customize" label="Customize" />
          <TabButton id="calendar" label="Calendar" />
          <TabButton id="account" label="Account" />
          <button
            onClick={() => {
              localStorage.clear();
              navigate("/dashboard");
            }}
            style={{
              background: "transparent",
              border: "1px solid #fff",
              color: "#fff",
              borderRadius: 8,
              padding: "8px 16px",
              cursor: "pointer",
            }}
          >
            Log Out
          </button>
        </div>
      </header>

      {/* MAIN BODY */}
      <main
        style={{
          padding: "5vw",
          flexGrow: 1,
          maxWidth: 1000,
          margin: "0 auto",
        }}
      >
        {statusMsg && (
          <p
            style={{
              background: "#fff4eb",
              border: "1px solid #f4c89a",
              padding: "10px",
              borderRadius: "8px",
              marginBottom: 20,
              fontSize: "0.95rem",
            }}
          >
            {statusMsg}
          </p>
        )}

        {activeTab === "customize" && (
          <>
            <h2 style={{ color: "#de8d2b", fontSize: "1.3rem" }}>
              Business Customization
            </h2>

            {/* COLOR SCHEME */}
            <div
              style={{
                marginBottom: 30,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 12,
              }}
            >
              {["header", "text", "background", "accent"].map((key) => (
                <div key={key} style={{ display: "flex", alignItems: "center" }}>
                  <label
                    style={{
                      flex: 1,
                      textTransform: "capitalize",
                      fontWeight: 500,
                      fontSize: "0.95rem",
                    }}
                  >
                    {key}:
                  </label>
                  <input
                    type="color"
                    value={colorScheme[key]}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                    style={{
                      width: 40,
                      height: 30,
                      border: "none",
                      cursor: "pointer",
                      background: "transparent",
                    }}
                  />
                </div>
              ))}
            </div>

            {/* SERVICES */}
            <h3 style={{ color: "#de8d2b" }}>Services</h3>
            {services.map((s, i) => (
              <div
                key={i}
                style={{
                  background: "#fff",
                  border: "1px solid #ddd",
                  borderRadius: 10,
                  padding: 16,
                  marginBottom: 10,
                }}
              >
                <input
                  placeholder="Service Name"
                  value={s.name}
                  onChange={(e) => {
                    const updated = [...services];
                    updated[i].name = e.target.value;
                    setServices(updated);
                  }}
                  style={{
                    width: "100%",
                    marginBottom: 8,
                    padding: "8px",
                    borderRadius: 6,
                    border: "1px solid #ccc",
                  }}
                />
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                  }}
                >
                  <input
                    placeholder="Price"
                    value={s.price}
                    onChange={(e) => {
                      const updated = [...services];
                      updated[i].price = e.target.value;
                      setServices(updated);
                    }}
                    style={{
                      padding: 8,
                      borderRadius: 6,
                      border: "1px solid #ccc",
                    }}
                  />
                  <input
                    placeholder="Duration (mins)"
                    value={s.duration}
                    onChange={(e) => {
                      const updated = [...services];
                      updated[i].duration = e.target.value;
                      setServices(updated);
                    }}
                    style={{
                      padding: 8,
                      borderRadius: 6,
                      border: "1px solid #ccc",
                    }}
                  />
                </div>
              </div>
            ))}
            <button
              onClick={handleAddService}
              style={{
                background: "#de8d2b",
                color: "#fff",
                border: "none",
                padding: "10px 16px",
                borderRadius: 8,
                cursor: "pointer",
                marginBottom: 20,
              }}
            >
              + Add Service
            </button>

            {/* AVAILABILITY */}
            <h3 style={{ marginTop: 20, color: "#de8d2b" }}>Availability</h3>
            {Object.entries(availability).map(([day, data]) => (
              <div key={day} style={{ marginBottom: 8 }}>
                <label style={{ fontWeight: 500 }}>
                  <input
                    type="checkbox"
                    checked={data.enabled}
                    onChange={() => handleAvailabilityToggle(day)}
                    style={{ marginRight: 8 }}
                  />
                  {day}
                </label>
                {data.enabled && (
                  <span>
                    <input
                      type="time"
                      value={data.start}
                      onChange={(e) =>
                        setAvailability((prev) => ({
                          ...prev,
                          [day]: { ...data, start: e.target.value },
                        }))
                      }
                      style={{ marginLeft: 10 }}
                    />
                    <input
                      type="time"
                      value={data.end}
                      onChange={(e) =>
                        setAvailability((prev) => ({
                          ...prev,
                          [day]: { ...data, end: e.target.value },
                        }))
                      }
                      style={{ marginLeft: 10 }}
                    />
                  </span>
                )}
              </div>
            ))}

            {/* UNAVAILABLE DATES */}
            <div style={{ marginTop: 20 }}>
              <h4 style={{ color: "#de8d2b" }}>Unavailable Dates</h4>
              <input
                type="date"
                onChange={(e) =>
                  setUnavailableDates([...unavailableDates, e.target.value])
                }
                style={{
                  padding: 6,
                  border: "1px solid #ccc",
                  borderRadius: 6,
                }}
              />
              <ul>
                {unavailableDates.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>

            <button
              onClick={saveDashboard}
              disabled={saving}
              style={{
                marginTop: 30,
                background: "#4caf50",
                color: "#fff",
                padding: "10px 16px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                width: "100%",
                maxWidth: 250,
              }}
            >
              {saving ? "Saving..." : "Save All Changes"}
            </button>
          </>
        )}

        {activeTab === "calendar" && (
          <div>
            <h2 style={{ color: "#de8d2b" }}>Calendar (Coming Soon)</h2>
            <p>
              This tab will show booked appointments, similar to Calendly’s
              timeline view.
            </p>
          </div>
        )}

        {activeTab === "account" && (
          <div>
            <h2 style={{ color: "#de8d2b" }}>Account Settings</h2>
            <p>Business ID: {business?.BusinessId}</p>
            <p>Email: {business?.BusinessEmail}</p>
            <p>Access PIN: Stored securely</p>
          </div>
        )}
      </main>

      <footer
        style={{
          background: "#f7f7f7",
          borderTop: "1px solid #eee",
          textAlign: "center",
          padding: "12px 0",
          fontSize: "0.85rem",
          color: "#999",
        }}
      >
        © {new Date().getFullYear()} CatBackAI
      </footer>
    </div>
  );
}