import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const API_BASE =
  "https://script.google.com/macros/s/AKfycbzXqqmaffpYuLEdKd_RAKEG6eXTzIn126c-ysEie4SjTRJQ_MkodmORdWf_xLKVG0B-/exec";

function BookingForm() {
  const { businessId } = useParams();

  const [business, setBusiness] = useState(null);
  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    serviceName: "",
    servicePrice: "",
    serviceDuration: "",
    date: "",
    time: "",
    notes: "",
    consent: false,
  });

  const [status, setStatus] = useState({ done: false, error: "" });
  const [submitting, setSubmitting] = useState(false);

  /* ---------- Load business data ---------- */
  useEffect(() => {
    if (!businessId) return;
    fetch(`${API_BASE}?action=getbusiness&businessId=${businessId}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.result === "ok") setBusiness(json.business);
        else throw new Error(json.message || "Business not found");
      })
      .catch((err) =>
        setStatus({ done: false, error: "Failed to load business: " + err.message })
      );
  }, [businessId]);

  /* ---------- Form Handlers ---------- */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((s) => ({
      ...s,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus({ done: false, error: "" });

    try {
      const body = new URLSearchParams();
      Object.entries(formData).forEach(([key, val]) => body.append(key, val));
      body.append("businessId", businessId);
      body.append("action", "createbooking");

      const res = await fetch(API_BASE, { method: "POST", body });
      const json = await res.json();

      if (!res.ok || json.result !== "ok") {
        throw new Error(json.message || "Error submitting booking");
      }

      setStatus({ done: true, error: "" });
    } catch (err) {
      setStatus({ done: false, error: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (!business) {
    return <p style={{ padding: 40 }}>Loading business info...</p>;
  }

  return (
    <div
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        background: "linear-gradient(180deg, #fff7ef 0%, #f8f8f8 100%)",
        minHeight: "100vh",
        padding: "40px",
      }}
    >
      <h1 style={{ fontWeight: 900, fontSize: 32, color: "#000" }}>
        Book with {business.BusinessName}
      </h1>
      <p style={{ color: "#444" }}>{business.BusinessType}</p>

      {status.done ? (
        <div
          style={{
            background: "#fff",
            padding: 24,
            borderRadius: 12,
            maxWidth: 500,
            marginTop: 24,
          }}
        >
          <h3>✅ Booking Submitted!</h3>
          <p>We’ll send confirmation and reminders to your contact info.</p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          style={{
            background: "#fff",
            padding: 24,
            borderRadius: 12,
            maxWidth: 600,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginTop: 24,
          }}
        >
          <label>
            Name
            <input
              name="clientName"
              value={formData.clientName}
              onChange={handleChange}
              required
              style={input}
            />
          </label>
          <label>
            Email
            <input
              type="email"
              name="clientEmail"
              value={formData.clientEmail}
              onChange={handleChange}
              required
              style={input}
            />
          </label>
          <label>
            Phone
            <input
              name="clientPhone"
              value={formData.clientPhone}
              onChange={handleChange}
              required
              style={input}
            />
          </label>

          {/* Service options pulled from sheet */}
          <label>
            Service
            <select
              name="serviceName"
              value={formData.serviceName}
              onChange={handleChange}
              required
              style={input}
            >
              <option value="">Select service</option>
              {business.services &&
                Array.isArray(business.services) &&
                business.services.map((s, i) => (
                  <option key={i} value={s.name}>
                    {s.name} — ${s.price}
                  </option>
                ))}
            </select>
          </label>

          <label>
            Date
            <DatePicker
              selected={formData.date ? new Date(formData.date) : null}
              onChange={(d) =>
                setFormData((s) => ({ ...s, date: d ? d.toISOString().split("T")[0] : "" }))
              }
              minDate={new Date()}
              dateFormat="yyyy-MM-dd"
              placeholderText="Select date"
              required
              style={input}
            />
          </label>

          <label>
            Time
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              required
              style={input}
            />
          </label>

          <label>
            Notes
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              style={textarea}
            />
          </label>

          <label style={{ display: "flex", gap: 8 }}>
            <input
              type="checkbox"
              name="consent"
              checked={formData.consent}
              onChange={handleChange}
              required
            />
            <span style={{ fontSize: 13, color: "#444" }}>
              I agree to receive confirmations, reminders, and follow-ups from {business.BusinessName}.
            </span>
          </label>

          {status.error && (
            <div style={errorBox}>⚠️ {status.error}</div>
          )}

          <button
            type="submit"
            style={{
              ...btn,
              opacity: submitting ? 0.7 : 1,
            }}
            disabled={submitting}
          >
            {submitting ? "Submitting…" : "Book Appointment"}
          </button>
        </form>
      )}
    </div>
  );
}

/* ---------- styling helpers ---------- */
const input = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #ddd",
  fontSize: 14,
};
const textarea = { ...input, minHeight: 60 };
const btn = {
  background: "#de8d2b",
  color: "#000",
  padding: "12px",
  border: "none",
  borderRadius: 10,
  fontWeight: 800,
  cursor: "pointer",
  fontSize: 16,
};
const errorBox = {
  background: "#ffecec",
  border: "1px solid #ffbcbc",
  color: "#9b0000",
  borderRadius: 8,
  padding: "8px 10px",
  fontSize: 13,
};

export default BookingForm;
