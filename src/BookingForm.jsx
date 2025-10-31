import { useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

/** Helper: format HH:MM to minutes */
const toMin = (hhmm) => {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":").map((x) => parseInt(x, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};
/** Helper: minutes to HH:MM */
const toHHMM = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};
/** Helper: weekday name (Monday..Sunday) */
const weekdayName = (dateStr) =>
  new Date(dateStr + "T00:00:00").toLocaleDateString(undefined, { weekday: "long" });

export default function BookingForm() {
  const { businessId } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [business, setBusiness] = useState(null);
  const [theme, setTheme] = useState({
    header: "#de8d2b",
    text: "#000000",
    background: "#ffffff",
    accent: "#de8d2b",
  });

  // services array: { name, price, duration, description }
  const [services, setServices] = useState([]);

  // availability map: { Monday: {enabled,start,end}, ... }
  const [availability, setAvailability] = useState({});
  const [unavailableDates, setUnavailableDates] = useState([]);

  const [form, setForm] = useState({
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    serviceRequested: "",
    preferredDate: "",
    preferredTime: "",
    paymentMethod: "",
  });

  /* -------- Fetch data (business + schedule) -------- */
  useEffect(() => {
    async function load() {
      try {
        // business (contains ColorScheme)
        const bizRes = await fetch(
          `https://jacobtf007.app.n8n.cloud/webhook/catbackai_getbusiness?businessId=${businessId}`
        );
        if (!bizRes.ok) throw new Error("Failed to load business");
        const bizJson = await bizRes.json();
        if (!bizJson?.business) throw new Error("Business not found");
        const b = bizJson.business;

        // sanitize possible "Google Sheets '=' prefix"
        Object.keys(b).forEach((k) => {
          if (typeof b[k] === "string") b[k] = b[k].replace(/^=+/, "").trim();
        });

        // theme
        if (b.ColorScheme) {
          try {
            const parsed = JSON.parse(b.ColorScheme);
            if (parsed && typeof parsed === "object") setTheme((t) => ({ ...t, ...parsed }));
          } catch {
            // ignore invalid json
          }
        }
        setBusiness(b);

// ✅ Directly parse merged schedule/theme from business record
if (b.Services) {
  try {
    const parsed = JSON.parse(b.Services);
    if (Array.isArray(parsed)) setServices(parsed);
  } catch {}
}

if (b.Availability) {
  try {
    const parsed = JSON.parse(b.Availability);
    if (parsed && typeof parsed === "object") setAvailability(parsed);
  } catch {}
}

if (b.Unavailability) {
  try {
    const parsed = JSON.parse(b.Unavailability);
    if (Array.isArray(parsed)) {
      const datesOnly = parsed.map((u) => u.date).filter(Boolean);
      setUnavailableDates(datesOnly);
    }
  } catch {}
}

      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [businessId]);

  /* -------- Available time slots based on selected date & service -------- */
  const slots = useMemo(() => {
    // Need: selected date, service duration, availability for that weekday, not a blackout day
    if (!form.preferredDate || !form.serviceRequested) return [];
    if (unavailableDates.includes(form.preferredDate)) return [];

    const day = weekdayName(form.preferredDate); // "Monday", etc.
    const dayCfg = availability?.[day];
    if (!dayCfg?.enabled || !dayCfg.start || !dayCfg.end) return [];

    const durationMin = parseInt(
      services.find((s) => s.name === form.serviceRequested)?.duration || "0",
      10
    );
    if (!durationMin || Number.isNaN(durationMin)) return [];

    const startMin = toMin(dayCfg.start);
    const endMin = toMin(dayCfg.end);
    if (startMin == null || endMin == null || endMin <= startMin) return [];

    const list = [];
    for (let t = startMin; t + durationMin <= endMin; t += durationMin) {
      list.push(toHHMM(t));
    }
    return list;
  }, [form.preferredDate, form.serviceRequested, availability, services, unavailableDates]);

  /* -------- Handlers -------- */
  const setFormField = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value, ...(name === "serviceRequested" ? { preferredTime: "" } : {}) }));
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (!form.serviceRequested || !form.preferredDate || !form.preferredTime) {
        alert("Please select a service, date, and time.");
        return;
      }
      const payload = { businessId, ...form };
      const res = await fetch(
        "https://jacobtf007.app.n8n.cloud/webhook/catbackai_createbooking",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error(await res.text());
      await res.json();
      alert(`✅ Booking submitted for ${business?.BusinessName || "this business"}!`);
      setForm({
        clientName: "",
        clientPhone: "",
        clientEmail: "",
        serviceRequested: "",
        preferredDate: "",
        preferredTime: "",
        paymentMethod: "",
      });
    } catch (err) {
      alert(`❌ ${err.message}`);
    }
  };

  /* -------- UI -------- */
  if (loading) return <p style={{ textAlign: "center" }}>Loading…</p>;
  if (error) return <p style={{ color: "red", textAlign: "center" }}>{error}</p>;

  const logoUrl =
    business?.LogoLink ||
    business?.LinkToLogo ||
    business?.LinktoLogo ||
    business?.LogoFile ||
    "";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        background: theme.background,
        color: theme.text,
        padding: "24px 16px",
        fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: 620 }}>
        {/* Header like your sketch */}
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo"
              style={{
                width: 64,
                height: 64,
                objectFit: "contain",
                borderRadius: 10,
                background: "#fff",
                border: "1px solid #eee",
              }}
            />
          ) : null}
        </div>
        <h1
          style={{
            textAlign: "center",
            marginTop: 0,
            marginBottom: 18,
            fontWeight: 900,
            color: theme.header,
          }}
        >
          {business?.BusinessName || "Business"}
        </h1>

        {/* Form card */}
        <form
          onSubmit={submit}
          style={{
            background: "#ffffff",
            border: "1px solid #eee",
            borderRadius: 14,
            padding: 18,
            boxShadow: "0 4px 20px rgba(0,0,0,.04)",
          }}
        >
          {/* Service */}
          <label style={labelStyle}>
            <div style={labelText}>Service</div>
            <select
              name="serviceRequested"
              value={form.serviceRequested}
              onChange={setFormField}
              required
              style={inputStyle}
            >
              <option value="">Select service</option>
              {services.map((s, i) => (
                <option key={i} value={s.name}>
                  {s.name}
                  {s.duration ? ` • ${s.duration} min` : ""}
                  {s.price ? ` • ${s.price}` : ""}
                </option>
              ))}
            </select>
          </label>

          {/* Date */}
          <label style={labelStyle}>
            <div style={labelText}>Date</div>
            <input
              type="date"
              name="preferredDate"
              value={form.preferredDate}
              onChange={setFormField}
              required
              style={inputStyle}
            />
          </label>

          {/* Time (calculated slots) */}
          <label style={labelStyle}>
            <div style={labelText}>
              Time
              <span style={{ fontWeight: 400, color: "#666", marginLeft: 6 }}>
                {form.preferredDate ? `(${weekdayName(form.preferredDate)})` : ""}
              </span>
            </div>
            <select
              name="preferredTime"
              value={form.preferredTime}
              onChange={setFormField}
              required
              style={inputStyle}
              disabled={slots.length === 0}
            >
              <option value="">
                {form.preferredDate
                  ? slots.length
                    ? "Select a time"
                    : "No times available"
                  : "Select a date first"}
              </option>
              {slots.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          {/* Name */}
          <label style={labelStyle}>
            <div style={labelText}>Name</div>
            <input
              name="clientName"
              value={form.clientName}
              onChange={setFormField}
              required
              style={inputStyle}
            />
          </label>

          {/* Contact */}
          <label style={labelStyle}>
            <div style={labelText}>Email / Phone</div>
            <input
              name="clientEmail"
              value={form.clientEmail}
              onChange={setFormField}
              required
              placeholder="you@example.com or (555) 555-5555"
              style={inputStyle}
            />
          </label>

          {/* Payment — simple choices like sketch */}
          <fieldset style={{ border: "none", padding: 0, margin: "4px 0 8px" }}>
            <legend style={{ ...labelText, marginBottom: 8 }}>Payment</legend>
            <label style={{ display: "block", marginBottom: 6 }}>
              <input
                type="radio"
                name="paymentMethod"
                value="Cash"
                checked={form.paymentMethod === "Cash"}
                onChange={setFormField}
              />{" "}
              Cash
            </label>
            <label style={{ display: "block" }}>
              <input
                type="radio"
                name="paymentMethod"
                value="Venmo / CashApp / Zelle"
                checked={form.paymentMethod === "Venmo / CashApp / Zelle"}
                onChange={setFormField}
              />{" "}
              Venmo / CashApp / Zelle / etc
            </label>
          </fieldset>

          <button
            type="submit"
            style={{
              background: theme.accent,
              color: "#fff",
              border: "none",
              padding: "12px 16px",
              borderRadius: 12,
              cursor: "pointer",
              fontWeight: 700,
              width: "100%",
              marginTop: 12,
            }}
          >
            Submit Booking
          </button>
        </form>

        {/* Spacer keeps page from feeling “short” on tall screens */}
        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}

/* Small style tokens */
const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #cfcfcf",
  background: "#fff",
};
const labelStyle = { display: "block", marginBottom: 12 };
const labelText = { fontWeight: 700, marginBottom: 6 };
