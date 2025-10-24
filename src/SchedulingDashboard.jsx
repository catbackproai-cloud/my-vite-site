// SchedulingDashboard.jsx
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import logo from "./assets/Y-Logo.png";

export default function SchedulingDashboard() {
  const { businessId: routeId } = useParams();
  const [businessId, setBusinessId] = useState(routeId || "");
  const [business, setBusiness] = useState(null);
  const [services, setServices] = useState([]);
  const [statusMsg, setStatusMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ---------------- FETCH BUSINESS + SCHEDULE ---------------- */
  useEffect(() => {
    if (routeId) fetchAllData(routeId);
  }, [routeId]);

  const fetchAllData = async (id) => {
    if (!id) return alert("Enter your Business ID first");
    setLoading(true);
    setStatusMsg("");

    try {
      // 1️⃣ Fetch business profile
      const bizRes = await fetch(
        `https://jacobtf007.app.n8n.cloud/webhook/catbackai_getbusiness?businessId=${id}`
      );
      const bizData = await bizRes.json();
      if (!bizData.business) throw new Error("Business not found.");
      setBusiness(bizData.business);

      // 2️⃣ Fetch existing schedule (services/hours)
      const schedRes = await fetch(
        `https://jacobtf007.app.n8n.cloud/webhook/catbackai_getschedule`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ businessId: id }),
        }
      );
      const schedJson = await schedRes.json();

      if (schedJson.result === "ok" && schedJson.schedule.length > 0) {
        // Flatten out to your internal structure
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

  /* ---------------- SERVICE MANAGEMENT ---------------- */
  const addService = () => {
    setServices([
      ...services,
      {
        name: "",
        duration: "",
        price: "",
        day: "",
        start: "",
        end: "",
        description: "",
      },
    ]);
  };

  const handleServiceChange = (i, field, val) => {
    const updated = [...services];
    updated[i][field] = val;
    setServices(updated);
  };

  const removeService = (i) => {
    setServices(services.filter((_, idx) => idx !== i));
  };

  const saveSchedule = async () => {
    if (!businessId) return alert("Missing Business ID.");
    setSaving(true);
    setStatusMsg("Saving schedule...");
    try {
      const payload = {
        businessId,
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

      const text = await res.text();
      if (!res.ok) throw new Error(text);
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
        fontFamily:
          "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
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
        <a
          href="/"
          style={{ textDecoration: "none", color: "#de8d2b", fontWeight: 600 }}
        >
          Home
        </a>
      </header>

      <div style={{ padding: "40px", maxWidth: 950, margin: "0 auto" }}>
        {/* --- Business Load --- */}
        {!routeId && (
          <div style={{ marginBottom: 20 }}>
            <input
              placeholder="Enter your Business ID"
              value={businessId}
              onChange={(e) => setBusinessId(e.target.value)}
              style={{
                padding: "8px 12px",
                border: "1px solid #ccc",
                borderRadius: "6px",
                width: "70%",
                marginRight: 10,
              }}
            />
            <button
              onClick={() => fetchAllData(businessId)}
              style={{
                background: "#de8d2b",
                color: "#fff",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Load Dashboard
            </button>
          </div>
        )}

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

        {/* --- SERVICES / SCHEDULE EDITOR --- */}
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
                  onChange={(e) =>
                    handleServiceChange(i, "name", e.target.value)
                  }
                  style={{
                    width: "100%",
                    marginBottom: 8,
                    padding: "8px",
                    borderRadius: 6,
                    border: "1px solid #ccc",
                  }}
                />
                <div style={{ display: "flex", gap: "4%" }}>
                  <input
                    type="number"
                    placeholder="Duration (min)"
                    value={s.duration}
                    onChange={(e) =>
                      handleServiceChange(i, "duration", e.target.value)
                    }
                    style={{ width: "48%", padding: "8px", borderRadius: 6 }}
                  />
                  <input
                    type="number"
                    placeholder="Price ($)"
                    value={s.price}
                    onChange={(e) =>
                      handleServiceChange(i, "price", e.target.value)
                    }
                    style={{ width: "48%", padding: "8px", borderRadius: 6 }}
                  />
                </div>

                <div style={{ display: "flex", gap: "4%", marginTop: 8 }}>
                  <select
                    value={s.day}
                    onChange={(e) =>
                      handleServiceChange(i, "day", e.target.value)
                    }
                    style={{ width: "32%", padding: "8px", borderRadius: 6 }}
                  >
                    <option value="">Day</option>
                    {[
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                      "Saturday",
                      "Sunday",
                    ].map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                  <input
                    type="time"
                    value={s.start}
                    onChange={(e) =>
                      handleServiceChange(i, "start", e.target.value)
                    }
                    style={{ width: "32%", padding: "8px", borderRadius: 6 }}
                  />
                  <input
                    type="time"
                    value={s.end}
                    onChange={(e) =>
                      handleServiceChange(i, "end", e.target.value)
                    }
                    style={{ width: "32%", padding: "8px", borderRadius: 6 }}
                  />
                </div>

                <textarea
                  placeholder="Description"
                  value={s.description}
                  onChange={(e) =>
                    handleServiceChange(i, "description", e.target.value)
                  }
                  style={{
                    width: "100%",
                    height: "60px",
                    marginTop: 8,
                    borderRadius: "8px",
                    padding: "8px",
                  }}
                />
                <button
                  onClick={() => removeService(i)}
                  style={{
                    marginTop: 8,
                    background: "#ff5a5a",
                    color: "#fff",
                    border: "none",
                    padding: "6px 12px",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  Remove
                </button>
              </div>
            ))}

            <button
              onClick={addService}
              style={{
                background: "#de8d2b",
                color: "#fff",
                border: "none",
                padding: "10px 16px",
                borderRadius: "8px",
                cursor: "pointer",
                marginTop: 10,
              }}
            >
              + Add Service
            </button>
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
                marginLeft: 10,
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
