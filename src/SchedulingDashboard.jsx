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
  }, [routeId, navigate]);

  /* ---------- FETCH BUSINESS ---------- */
  useEffect(() => {
    if (routeId) fetchAllData(routeId);
  }, [routeId]);

  const fetchAllData = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://jacobtf007.app.n8n.cloud/webhook/catbackai_getbusiness?businessId=${id}`
      );
      const data = await res.json();
      if (!data.business) throw new Error("Business not found.");
      setBusiness(data.business);

      // Load saved theme if available
      if (data.business.ColorScheme) {
        try {
          const parsed = JSON.parse(data.business.ColorScheme);
          setColorScheme(parsed);
        } catch {
          /* ignore if old format */
        }
      }
    } catch (err) {
      setStatusMsg("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- SAVE DASHBOARD (BOOKING THEME + SERVICES) ---------- */
  const saveDashboard = async () => {
    setSaving(true);
    setStatusMsg("Saving your settings...");

    const payload = {
      businessId: routeId,
      services,
      availability,
      unavailableDates,
      colorScheme,
    };

    try {
      // 🔥 new webhook just for booking form customization
      const res = await fetch(
        "https://jacobtf007.app.n8n.cloud/webhook/catbackai_updatebookingtheme",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error(await res.text());
      setStatusMsg("✅ Booking form customization saved!");
    } catch (err) {
      setStatusMsg("❌ " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleColorChange = (field, value) => {
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      setColorScheme((prev) => ({ ...prev, [field]: value }));
      setStatusMsg("");
    } else {
      setStatusMsg("⚠️ Invalid color format. Please use hex (#000000).");
    }
  };

  const handleAddService = () =>
    setServices([...services, { name: "", price: "", duration: "", description: "" }]);

  /* ---------- RENDER ---------- */
  return (
    <div
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        minHeight: "100vh",
        background: "#fff",
      }}
    >
      <Helmet>
        <title>CatBackAI | Booking Form Customization</title>
      </Helmet>

      {/* HEADER */}
      <header
        style={{
          background: "#de8d2b",
          color: "#fff",
          padding: "20px 30px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={logo} alt="CatBackAI Logo" style={{ height: 40 }} />
          <h1 style={{ fontWeight: 800, fontSize: 20 }}>Dashboard</h1>
        </div>
        <button
          onClick={() => {
            localStorage.clear();
            navigate("/dashboard");
          }}
          style={{
            border: "1px solid #fff",
            borderRadius: 8,
            padding: "8px 16px",
            background: "transparent",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Log Out
        </button>
      </header>

      {/* MAIN */}
      <main
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "40px 20px",
        }}
      >
        {statusMsg && (
          <p
            style={{
              background: "#fff4eb",
              border: "1px solid #f4c89a",
              padding: "10px",
              borderRadius: 8,
              marginBottom: 20,
            }}
          >
            {statusMsg}
          </p>
        )}

        <h2 style={{ color: "#de8d2b", fontWeight: 700 }}>
          Booking Form Customization
        </h2>

        {/* COLOR SCHEME */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
            marginBottom: 30,
          }}
        >
          {["header", "text", "background", "accent"].map((key) => (
            <div key={key}>
              <label
                style={{
                  textTransform: "capitalize",
                  fontWeight: 500,
                  display: "block",
                  marginBottom: 6,
                }}
              >
                {key} color:
              </label>
              <input
                type="color"
                value={colorScheme[key]}
                onChange={(e) => handleColorChange(key, e.target.value)}
                style={{
                  width: "100%",
                  height: 40,
                  borderRadius: 6,
                  border: "1px solid #ddd",
                  cursor: "pointer",
                }}
              />
            </div>
          ))}
        </div>

        <button
          onClick={saveDashboard}
          disabled={saving}
          style={{
            background: "#4caf50",
            color: "#fff",
            padding: "10px 16px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
          }}
        >
          {saving ? "Saving..." : "Save Booking Form Settings"}
        </button>
      </main>
    </div>
  );
}
