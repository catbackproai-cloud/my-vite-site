import { useState, useEffect } from "react";

export default function SchedulingDashboard() {
  const [businessId, setBusinessId] = useState("");
  const [business, setBusiness] = useState(null);
  const [hours, setHours] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const fetchBusinessData = async () => {
    if (!businessId) return alert("Enter Business ID first!");
    setLoading(true);
    setStatusMsg("");

    try {
      // 1️⃣ Fetch business info
      const bizRes = await fetch(
        `https://jacobtf007.app.n8n.cloud/webhook/catbackai_getbusiness?businessId=${businessId}`
      );
      const bizData = await bizRes.json();
      if (!bizData.business) throw new Error("Business not found.");
      setBusiness(bizData.business);

      // 2️⃣ Fetch hours (replace with your Apps Script URL)
      const hoursRes = await fetch(
        `https://script.google.com/macros/s/YOUR_APPS_SCRIPT_URL/exec?action=getHours&businessId=${businessId}`
      );
      const hoursJson = await hoursRes.json();
      setHours(hoursJson.hours || []);

      // 3️⃣ Fetch bookings
      const bookRes = await fetch(
        `https://script.google.com/macros/s/YOUR_APPS_SCRIPT_URL/exec?action=getBookings&businessId=${businessId}`
      );
      const bookJson = await bookRes.json();
      setBookings(bookJson.bookings || []);
    } catch (err) {
      setStatusMsg("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const addHourSlot = () => {
    setHours([
      ...hours,
      { Date: "", StartTime: "", EndTime: "", Status: "Available" },
    ]);
  };

  const handleHourChange = (index, field, value) => {
    const updated = [...hours];
    updated[index][field] = value;
    setHours(updated);
  };

  const saveHours = async () => {
    try {
      setStatusMsg("Saving...");
      const res = await fetch(
        "https://jacobtf007.app.n8n.cloud/webhook/catbackai_addschedule",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ businessId, hours }),
        }
      );
      if (!res.ok) throw new Error("Save failed");
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
        maxWidth: "900px",
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
          {business.LogoLink && (
            <img
              src={business.LogoLink}
              alt="Logo"
              style={{ width: "60px", borderRadius: "8px" }}
            />
          )}
          <p>
            <strong>ID:</strong> {business.BusinessId}
          </p>
          <p>
            <strong>Services:</strong> {business.ServicesOffered}
          </p>
        </div>
      )}

      {business && (
        <>
          <h3>Manage Availability</h3>
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
                <th style={{ padding: "8px" }}>Date</th>
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

      {bookings.length > 0 && (
        <>
          <h3 style={{ marginTop: 40 }}>Recent Bookings</h3>
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