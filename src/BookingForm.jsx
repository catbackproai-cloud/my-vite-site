// src/BookingForm.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

/**
 * Apps Script endpoint:
 *  - GET  ?action=getBusiness&businessId=XXX  -> { result:"ok", business:{...} }
 *  - POST action=createBooking (FormData)     -> { result:"ok" }
 */
const API_BASE =
  "https://script.google.com/macros/s/AKfycbzMCNOKgUd1fJQ4nOiad-aHFj-m9oS9paoVvXFjM02xxwkCkMd7DqUXK8-QgkQKv5mS/exec";

/* -------------------- helpers -------------------- */

// Format minutes (e.g., 12 * 60 + 30) to 12h time like "12:30 PM"
function minutesTo12h(mins) {
  let h = Math.floor(mins / 60);
  const m = mins % 60;
  const am = h < 12;
  const period = am ? "AM" : "PM";
  h = h % 12;
  if (h === 0) h = 12;
  const mm = m.toString().padStart(2, "0");
  return `${h}:${mm} ${period}`;
}

// Parse "HH:MM" + "AM/PM" into minutes since 00:00
function parseToMinutes(hhmm, period) {
  if (!hhmm) return null;
  const [hStr, mStr = "0"] = hhmm.split(":");
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10) || 0;
  if (period) {
    const p = period.toUpperCase();
    if (p === "PM" && h !== 12) h += 12;
    if (p === "AM" && h === 12) h = 0;
  }
  if (!period && h >= 24) h = h % 24;
  return h * 60 + m;
}

// Generate slots inside [open, close)
function generateSlots(openMins, closeMins, stepMins = 30, serviceDuration = 0) {
  const slots = [];
  if (
    openMins == null ||
    closeMins == null ||
    isNaN(openMins) ||
    isNaN(closeMins) ||
    openMins >= closeMins
  ) {
    return slots;
  }
  const lastStart = serviceDuration
    ? closeMins - serviceDuration
    : closeMins - stepMins;

  for (let t = openMins; t <= lastStart; t += stepMins) {
    slots.push(minutesTo12h(t));
  }
  return slots;
}

// Normalize services from various shapes
function normalizeServices(business) {
  if (!business) return [];
  if (Array.isArray(business.services)) return business.services;

  const servicesJson =
    business["Services (JSON)"] ||
    business["services_json"] ||
    business["servicesJson"];
  if (typeof servicesJson === "string") {
    try {
      const parsed = JSON.parse(servicesJson);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return [];
}

// Normalize hours from various shapes
function normalizeHours(business) {
  if (!business) return null;
  if (business.hours && typeof business.hours === "object") return business.hours;

  const hoursJson =
    business["Hours (JSON)"] ||
    business["hours_json"] ||
    business["hoursJson"];
  if (typeof hoursJson === "string") {
    try {
      const parsed = JSON.parse(hoursJson);
      if (parsed && typeof parsed === "object") return parsed;
    } catch {}
  }
  return null;
}

// Map Date -> Weekday name used in hours JSON
function weekdayName(d) {
  return ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][d.getDay()];
}

/* -------------------- component -------------------- */

export default function BookingForm() {
  const { businessId } = useParams();

  // Business data
  const [loadingBiz, setLoadingBiz] = useState(true);
  const [bizError, setBizError] = useState("");
  const [business, setBusiness] = useState(null);

  // UI state
  const [services, setServices] = useState([]);
  const [hours, setHours] = useState(null);

  // Booking form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [serviceIdx, setServiceIdx] = useState("");
  const [date, setDate] = useState(null);
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(false);

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);

  const businessName =
    business?.BusinessName ||
    business?.businessName ||
    business?.name ||
    "Loading...";

  // Load business config
  useEffect(() => {
    let ignore = false;

    async function run() {
      try {
        setLoadingBiz(true);
        setBizError("");

        const url = `${API_BASE}?action=getBusiness&businessId=${encodeURIComponent(
          businessId || ""
        )}`;
        const res = await fetch(url, { method: "GET" });
        const json = await res.json();

        if (!res.ok || json.result !== "ok") {
          throw new Error(json.message || "Failed to load business");
        }

        if (ignore) return;
        const biz = json.business || json.data || json; // be lenient
        setBusiness(biz);

        const svcs = normalizeServices(biz);
        setServices(Array.isArray(svcs) ? svcs : []);

        const hrs = normalizeHours(biz);
        setHours(hrs);
      } catch (err) {
        if (!ignore) setBizError(err.message || "Could not load business");
      } finally {
        if (!ignore) setLoadingBiz(false);
      }
    }

    run();
    return () => {
      ignore = true;
    };
  }, [businessId]);

  // Compute slots whenever date, selected service, or hours change
  const slots = useMemo(() => {
    if (!date || !hours) return [];

    const day = weekdayName(date);
    const cfg = hours[day];
    if (!cfg || cfg.closed) return [];

    // Hours JSON shape: { openTime:"9:00", openPeriod:"AM", closeTime:"5:00", closePeriod:"PM", closed:false }
    const openMins = parseToMinutes(cfg.openTime, cfg.openPeriod);
    const closeMins = parseToMinutes(cfg.closeTime, cfg.closePeriod);

    const svc =
      serviceIdx !== "" && services[Number(serviceIdx)]
        ? services[Number(serviceIdx)]
        : null;

    const dur = svc?.duration ? Number(svc.duration) : 0;
    return generateSlots(openMins, closeMins, 30, dur); // step = 30m
  }, [date, hours, serviceIdx, services]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (!consent) {
      setSubmitError("Please agree to receive confirmations and reminders.");
      return;
    }
    if (!business || serviceIdx === "" || !date || !time) {
      setSubmitError("Please complete all required fields.");
      return;
    }

    const svc = services[Number(serviceIdx)];
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const dateISO = `${y}-${m}-${d}`; // YYYY-MM-DD

    try {
      setSubmitting(true);

      const body = new FormData();
      body.append("action", "createBooking");
      body.append("businessId", businessId);
      body.append("clientName", name);
      body.append("clientPhone", phone);
      body.append("clientEmail", email);
      body.append("serviceName", svc?.name ?? "");
      body.append("servicePrice", String(svc?.price ?? ""));
      body.append("serviceDuration", String(svc?.duration ?? ""));
      body.append("date", dateISO);
      body.append("time", time);
      body.append("notes", notes);
      body.append("consent", consent ? "true" : "false");

      const res = await fetch(API_BASE, { method: "POST", body });
      const json = await res.json();

      if (!res.ok || json.result !== "ok") {
        throw new Error(json.message || "Server error saving booking");
      }

      setDone(true);
    } catch (err) {
      setSubmitError(err.message || "Could not submit booking");
    } finally {
      setSubmitting(false);
    }
  };

  /* -------------------- UI -------------------- */

  const card = {
    background: "#fff",
    borderRadius: 12,
    padding: 24,
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  };

  const input = {
    width: "100%",
    fontSize: 14,
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #ddd",
  };

  const label = {
    fontSize: 13,
    fontWeight: 700,
    color: "#111",
    marginTop: 8,
    marginBottom: 6,
    display: "block",
  };

  const btn = {
    background: "#de8d2b",
    color: "#000",
    padding: "12px",
    border: "none",
    borderRadius: 10,
    fontWeight: 800,
    cursor: "pointer",
    width: "100%",
  };

  const muted = { color: "#444", fontSize: 13, lineHeight: 1.5 };

  const errorBox = {
    background: "#ffecec",
    border: "1px solid #ffbcbc",
    color: "#9b0000",
    borderRadius: 8,
    padding: "8px 10px",
    fontSize: 13,
    marginTop: 8,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fff",
        display: "flex",
        justifyContent: "center",
        padding: "60px 20px",
      }}
    >
      <div style={{ width: 560 }}>
        <h1 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 900, color: "#000" }}>
          Book an Appointment
        </h1>
        <p style={{ margin: "0 0 20px", color: "#111", fontWeight: 700 }}>
          Booking with: {loadingBiz ? "Loading..." : bizError ? "—" : businessName}
        </p>

        <div style={card}>
          {bizError && (
            <div style={errorBox}>
              Couldn’t load business details: {bizError}
            </div>
          )}

          {done ? (
            <div>
              <h3 style={{ marginTop: 0 }}>✅ Booking requested!</h3>
              <p style={muted}>
                You’ll receive a confirmation message shortly. Thanks!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label style={label}>Your Name</label>
              <input
                style={input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Your Name"
              />

              <label style={label}>Your Phone</label>
              <input
                style={input}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="Your Phone"
              />

              <label style={label}>Your Email</label>
              <input
                type="email"
                style={input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Your Email"
              />

              <label style={label}>Service</label>
              <select
                style={input}
                value={serviceIdx}
                onChange={(e) => {
                  setServiceIdx(e.target.value);
                  setTime(""); // reset time when service changes
                }}
                required
                disabled={loadingBiz || services.length === 0}
              >
                <option value="">
                  {loadingBiz ? "Loading services..." : "Select Service"}
                </option>
                {services.map((s, idx) => (
                  <option key={idx} value={idx}>
                    {s.name}
                    {s.price ? ` — $${s.price}` : ""}
                    {s.duration ? ` (${s.duration} min)` : ""}
                  </option>
                ))}
              </select>

              <label style={label}>Date</label>
              <div>
                <DatePicker
                  selected={date}
                  onChange={(d) => {
                    setDate(d);
                    setTime(""); // reset time on date change
                  }}
                  minDate={new Date()}
                  placeholderText="Select a date"
                  customInput={
                    <input style={{ ...input, cursor: "pointer" }} />
                  }
                />
              </div>

              <label style={label}>Start Time</label>
              <select
                style={input}
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                disabled={!date || !hours || (Array.isArray(slots) && slots.length === 0)}
              >
                <option value="">
                  {!date
                    ? "Pick a date first"
                    : !hours
                    ? "Loading hours..."
                    : slots.length === 0
                    ? "No slots available"
                    : "Select a start time"}
                </option>
                {slots.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              <label style={label}>Special requests</label>
              <textarea
                style={{ ...input, minHeight: 70 }}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything the business should know?"
              />

              <label
                style={{
                  ...label,
                  display: "flex",
                  gap: 8,
                  alignItems: "flex-start",
                  marginTop: 12,
                }}
              >
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                <span style={muted}>
                  I agree to receive booking confirmations and reminders.
                </span>
              </label>

              {submitError && <div style={errorBox}>{submitError}</div>}

              <button type="submit" style={{ ...btn, marginTop: 12 }} disabled={submitting}>
                {submitting ? "Submitting..." : "Confirm Booking"}
              </button>

              <p style={{ ...muted, marginTop: 10 }}>
                You’re booking with <strong>{businessName}</strong>.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
