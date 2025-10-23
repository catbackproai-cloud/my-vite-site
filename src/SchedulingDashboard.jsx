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
  const [hours, setHours] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [statusMsg, setStatusMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (routeId) fetchBusinessData();
  }, [routeId]);

  /* ------------------ FETCH BUSINESS + DATA ------------------ */
  const fetchBusinessData = async () => {
    if (!businessId) return alert("Enter Business ID first!");
    setLoading(true);
    setStatusMsg("");

    try {
      const bizRes = await fetch(
        `https://jacobtf007.app.n8n.cloud/webhook/catbackai_getbusiness?businessId=${businessId}`
      );
      const bizData = await bizRes.json();
      if (!bizData.business) throw new Error("Business not found.");

      setBusiness(bizData.business);

      // Fetch stored services
      const servicesRes = await fetch(
        `https://jacobtf007.app.n8n.cloud/webhook/catbackai_getservices?businessId=${businessId}`
      );
      const servicesJson = await servicesRes.json();
      setServices(servicesJson.services || []);

      // Fetch stored hours
      const hoursRes = await fetch(
        `https://jacobtf007.app.n8n.cloud/webhook/catbackai_getschedule?businessId=${businessId}`
      );
      const hoursJson = await hoursRes.json();
      setHours(hoursJson.hours || []);

      // Fetch recent bookings
      const bookingsRes = await fetch(
        `https://jacobtf007.app.n8n.cloud/webhook/catbackai_getbookings?businessId=${businessId}`
      );
      const bookingsJson = await bookingsRes.json();
      setBookings(bookingsJson.bookings || []);
    } catch (err) {
      setStatusMsg("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ------------------ SERVICE MANAGEMENT ------------------ */
  const addService = () => {
    setServices([
      ...services,
      {
        name: "",
        duration: "",
        price: "",
        description: "",
        daysAvailable: [],
        startTime: "",
        endTime: "",
      },
    ]);
  };

  const handleServiceChange = (i, field, value) => {
    const updated = [...services];
    updated[i][field] = value;
    setServices(updated);
  };

  const saveServices = async () => {
    try {
      setStatusMsg("Saving services...");
      const res = await fetch(
        "https://jacobtf007.app.n8n.cloud/webhook/catbackai_addservice",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ businessId, services }),
        }
      );
      if (!res.ok) throw new Error("Failed to save services");
      setStatusMsg("✅ Services saved successfully!");
    } catch (err) {
      setStatusMsg("❌ " + err.message);
    }
  };

  /* ------------------ SCHEDULE (AVAILABILITY) ------------------ */
  const addHourSlot = () => {
    setHours([
      ...hours,
      { Date: "", StartTime: "", EndTime: "", Status: "Available" },
    ]);
  };

  const handleHourChange = (i, field, val) => {
    const updated = [...hours];
    updated[i][field] = val;
    setHours(updated);
  };

  const saveHours = async () => {
    try {
      setStatusMsg("Saving schedule...");
      const res = await fetch(
        "https://jacobtf007.app.n8n.cloud/webhook/catbackai_addschedule",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ businessId, hours }),
        }
      );
      if (!res.ok) throw new Error("Failed to save schedule");
      setStatusMsg("✅ Schedule saved successfully!");
    } catch (err) {
      setStatusMsg("❌ " + err.message);
    }
  };

  /* ------------------ RENDER ------------------ */
  return (
    <div
      style={{
        fontFamily:
          "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        background: "linear-gradient(180deg, #fff7ef 0%, #f8f8f8 100%)",
        minHeight: "100vh",
        paddingBottom: "60px",
      }}
    >
      <Helmet>
        <title>Scheduling Dashboard | CatBackAI</title>
      </Helmet>

      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 40px",
          backgroundColor: "#fff",
          borderBottom: "1px solid #eee",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img src={logo} alt="CatBackAI Logo" style={{ height: "40px" }} />
          <h1 style={{ color: "#de8d2b", fontWeight: "900", fontSize: "20px" }}>
            Scheduling Dashboard
          </h1>
        </div>

        <a
          href="/"
          style={{
            textDecoration: "none",
            color: "#de8d2b",
            fontWeight: "600",
          }}
        >
          Home
        </a>
      </header>

      <div style={{ padding: "40px", maxWidth: "950px", margin: "0 auto" }}>
        {!business && (
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
                marginRight: "10px",
              }}
            />
            <button
              onClick={fetchBusinessData}
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

        {statusMsg && <p>{statusMsg}</p>}

        {business && (
          <>
            <div
              style={{
                background: "#fff4eb",
                padding: "20px",
                borderRadius: "12px",
                marginBottom: "30px",
              }}
            >
              <h2>{business.BusinessName}</h2>
              <img
                src={business.LogoLink || "https://via.placeholder.com/60"}
                alt="Logo"
                style={{ width: "60px", borderRadius: "8px" }}
              />
              <p>
                <strong>ID:</strong> {business.BusinessId}
              </p>
              <p>
                <strong>Scheduling Link:</strong>{" "}
                <a
                  href={`/scheduling/${business.BusinessId}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#de8d2b" }}
                >
                  catbackai.com/scheduling/{business.BusinessId}
                </a>
              </p>
            </div>

            {/* --- Services Section --- */}
            <h3 style={{ color: "#de8d2b" }}>Services</h3>
            {services.map((s, i) => (
              <div
                key={i}
                style={{
                  background: "#fff",
                  borderRadius: "10px",
                  padding: "16px",
                  marginBottom: "12px",
                  border: "1px solid #ddd",
                }}
              >
                <input
                  placeholder="Service Name"
                  value={s.name}
                  onChange={(e) =>
                    handleServiceChange(i, "name", e.target.value)
                  }
                  style={{ width: "100%", marginBottom: 8 }}
                />
                <input
                  placeholder="Duration (minutes)"
                  type="number"
                  value={s.duration}
                  onChange={(e) =>
                    handleServiceChange(i, "duration", e.target.value)
                  }
                  style={{ width: "48%", marginRight: "4%" }}
                />
                <input
                  placeholder="Price ($)"
                  type="number"
                  value={s.price}
                  onChange={(e) =>
                    handleServiceChange(i, "price", e.target.value)
                  }
                  style={{ width: "48%" }}
                />
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
                  }}
                />
              </div>
            ))}
            <button
              onClick={addService}
              style={{
                background: "#de8d2b",
                color: "#fff",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                marginTop: "10px",
                cursor: "pointer",
              }}
            >
              + Add Service
            </button>
            <button
              onClick={saveServices}
              style={{
                background: "#4caf50",
                color: "#fff",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                marginLeft: "10px",
                cursor: "pointer",
              }}
            >
              Save Services
            </button>

            {/* --- Availability --- */}
            <h3 style={{ color: "#de8d2b", marginTop: "30px" }}>
              Manage Availability
            </h3>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                background: "#fff",
                borderRadius: "12px",
                overflow: "hidden",
              }}
            >
              <thead>
                <tr style={{ background: "#de8d2b", color: "#fff" }}>
                  <th>Date</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {hours.map((h, i) => (
                  <tr key={i}>
                    <td>
                      <input
                        type="date"
                        value={h.Date}
                        onChange={(e) =>
                          handleHourChange(i, "Date", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="time"
                        value={h.StartTime}
                        onChange={(e) =>
                          handleHourChange(i, "StartTime", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="time"
                        value={h.EndTime}
                        onChange={(e) =>
                          handleHourChange(i, "EndTime", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <select
                        value={h.Status}
                        onChange={(e) =>
                          handleHourChange(i, "Status", e.target.value)
                        }
                      >
                        <option>Available</option>
                        <option>Booked</option>
                        <option>Unavailable</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              onClick={addHourSlot}
              style={{
                background: "#de8d2b",
                color: "#fff",
                padding: "10px 18px",
                borderRadius: "8px",
                border: "none",
                marginTop: "10px",
                cursor: "pointer",
              }}
            >
              + Add Slot
            </button>
            <button
              onClick={saveHours}
              style={{
                background: "#4caf50",
                color: "#fff",
                padding: "10px 18px",
                borderRadius: "8px",
                border: "none",
                marginLeft: "10px",
                cursor: "pointer",
              }}
            >
              Save Schedule
            </button>

            {/* --- Bookings --- */}
            {bookings.length > 0 && (
              <>
                <h3 style={{ marginTop: 40, color: "#de8d2b" }}>
                  Recent Bookings
                </h3>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    background: "#fff",
                    borderRadius: "12px",
                    overflow: "hidden",
                  }}
                >
                  <thead>
                    <tr style={{ background: "#de8d2b", color: "#fff" }}>
                      <th>Client</th>
                      <th>Service</th>
                      <th>Date</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b, i) => (
                      <tr key={i}>
                        <td>{b.ClientName}</td>
                        <td>{b.Service}</td>
                        <td>{b.PreferredDate}</td>
                        <td>{b.PreferredTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
