import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import logo from "./assets/Y-Logo.png";

export default function SchedulingDashboard() {
  const { businessId: routeId } = useParams();
  const navigate = useNavigate();

  const [business, setBusiness] = useState(null);
  const [services, setServices] = useState([]);
  const [statusMsg, setStatusMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ---------------- AUTH GUARD ---------------- */
  useEffect(() => {
    const token = localStorage.getItem("catback_token");
    if (!token || token !== routeId) {
      alert("Please log in first.");
      navigate("/dashboard");
      return;
    }

    // 🕒 Auto logout after 30 minutes of inactivity or on tab close
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

    // Track activity
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

  /* ---------------- FETCH BUSINESS + SCHEDULE ---------------- */
  useEffect(() => {
    if (routeId) fetchAllData(routeId);
  }, [routeId]);

  const fetchAllData = async (id) => {
    setLoading(true);
    setStatusMsg("");

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
            duration: s.Duration || "",
            price: s.Price || "",
            day: s.Day || "",
            start: s.StartTime || "",
            end: s.EndTime || "",
            description: s.Description || "",
          }))
        );
      } else {
        setServices([]);
      }
    } catch (err) {
      setStatusMsg("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- SAVE SCHEDULE ---------------- */
  const saveSchedule = async () => {
    if (!routeId) return alert("Missing Business ID.");
    setSaving(true);
    setStatusMsg("Saving schedule...");

    try {
      const payload = {
        businessId: routeId,
        services: services.map((s) => ({
          ServiceName: s.name,
          Duration: s.duration,
          Price: s.price,
          Day: s.day,
          StartTime: s.start,
          EndTime: s.end,
          Description: s.description,
        })),
      };

      const res = await fetch(
        "https://jacobtf007.app.n8n.cloud/webhook/catbackai_updateschedule",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error(await res.text());
      setStatusMsg("✅ Schedule saved successfully!");
    } catch (err) {
      setStatusMsg("❌ " + err.message);
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- RENDER ---------------- */
  return (
    <div
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        background: "linear-gradient(180deg, #fff7ef 0%, #f8f8f8 100%)",
        minHeight: "100vh",
        paddingBottom: "80px",
      }}
    >
      <Helmet>
        <title>Scheduling Dashboard | CatBackAI</title>
      </Helmet>

      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 40px",
          background: "#fff",
          borderBottom: "1px solid #eee",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={logo} alt="CatBackAI Logo" style={{ height: 40 }} />
          <h1 style={{ color: "#de8d2b", fontWeight: 900, fontSize: 20 }}>
            Scheduling Dashboard
          </h1>
        </div>
        <button
          onClick={() => {
            localStorage.clear();
            navigate("/dashboard");
          }}
          style={{
            background: "transparent",
            border: "none",
            color: "#de8d2b",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Log Out
        </button>
      </header>

      <div style={{ padding: 40, maxWidth: 950, margin: "0 auto" }}>
        {loading && <p>Loading data…</p>}
        {statusMsg && (
          <p
            style={{
              background: "#fff4eb",
              border: "1px solid #f4c89a",
              padding: "10px",
              borderRadius: "8px",
              marginTop: "10px",
            }}
          >
            {statusMsg}
          </p>
        )}

        {business && (
          <div
            style={{
              background: "#fff4eb",
              padding: 20,
              borderRadius: 12,
              marginBottom: 30,
            }}
          >
            <h2>{business.BusinessName}</h2>
            <img
              src={business.LogoFile || business.LogoLink || logo}
              alt="Logo"
              style={{ width: 60, borderRadius: 8 }}
            />
            <p>
              <strong>ID:</strong> {business.BusinessId}
            </p>
            <p>
              <strong>Public Booking:</strong>{" "}
              <a
                href={`/book/${business.BusinessId}`}
                style={{ color: "#de8d2b" }}
              >
                catbackai.com/book/{business.BusinessId}
              </a>
            </p>
          </div>
        )}

        {business && (
          <>
            <h3 style={{ color: "#de8d2b" }}>Your Services & Hours</h3>

            {services.map((s, i) => (
              <div
                key={i}
                style={{
                  background: "#fff",
                  borderRadius: 10,
                  padding: 16,
                  marginBottom: 12,
                  border: "1px solid #ddd",
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
              </div>
            ))}

            <button
              onClick={saveSchedule}
              disabled={saving}
              style={{
                background: "#4caf50",
                color: "#fff",
                border: "none",
                padding: "10px 16px",
                borderRadius: "8px",
                cursor: "pointer",
                marginTop: 10,
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Saving..." : "Save Schedule"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
