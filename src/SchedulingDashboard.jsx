import { useState, useEffect } from "react";

export default function SchedulingDashboard() {
  const [businessId, setBusinessId] = useState("");
  const [business, setBusiness] = useState(null);
  const [services, setServices] = useState([]);
  const [hours, setHours] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  // -------------- LOAD BUSINESS DATA --------------
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
      setServices(bizData.services || []);
      setHours(bizData.hours || []);
      setBookings(bizData.bookings || []);
    } catch (err) {
      setStatusMsg("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // -------------- SERVICE MANAGEMENT --------------
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

  // -------------- AVAILABILITY (HOURS) --------------
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

  return (
    <div
      style={{
        fontFamily:
          "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        padding: "40px",
        maxWidth: "950px",
        margin: "0 auto",
      }}
    >
      <h1 style={{ color: "#de8d2b", fontWeight: "900" }}>Scheduling Dashboard</h1>

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

      {/* ---------------- BUSINESS CARD ---------------- */}
      {business && (
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
            <strong>Services Offered:</strong>{" "}
            {business.ServicesOffered || "None yet"}
          </p>
        </div>
      )}

      {/* ---------------- SERVICES SECTION ---------------- */}
      {business && (
        <>
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
                onChange={(e) => handleServiceChange(i, "name", e.target.value)}
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
                onChange={(e) => handleServiceChange(i, "price", e.target.value)}
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
              <p>Days Available:</p>
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <label key={day} style={{ marginRight: 10 }}>
                  <input
                    type="checkbox"
                    checked={s.daysAvailable.includes(day)}
                    onChange={(e) => {
                      const updated = e.target.checked
                        ? [...s.daysAvailable, day]
                        : s.daysAvailable.filter((d) => d !== day);
                      handleServiceChange(i, "daysAvailable", updated);
                    }}
                  />{" "}
                  {day}
                </label>
              ))}
              <div>
                <label>Start:</label>
                <input
                  type="time"
                  value={s.startTime}
                  onChange={(e) =>
                    handleServiceChange(i, "startTime", e.target.value)
                  }
                />
                <label>End:</label>
                <input
                  type="time"
                  value={s.endTime}
                  onChange={(e) =>
                    handleServiceChange(i, "endTime", e.target.value)
                  }
                />
              </div>
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
        </>
      )}

      {/* ---------------- HOURS TABLE ---------------- */}
      {business && (
        <>
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
        </>
      )}

      {/* ---------------- BOOKINGS ---------------- */}
      {bookings.length > 0 && (
        <>
          <h3 style={{ marginTop: 40, color: "#de8d2b" }}>Recent Bookings</h3>
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
    </div>
  );
}