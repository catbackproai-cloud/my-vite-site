import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";

export default function BookingForm() {
  const { businessId } = useParams();

  const [business, setBusiness] = useState(null);
  const [services, setServices] = useState([]);
  const [theme, setTheme] = useState({
    header: "#de8d2b",
    text: "#000",
    background: "#fff",
    accent: "#de8d2b",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    serviceRequested: "",
    preferredDate: "",
    preferredTime: "",
    paymentMethod: "",
  });

  useEffect(() => {
    async function fetchBusiness() {
      try {
        const res = await fetch(
          `https://jacobtf007.app.n8n.cloud/webhook/catbackai_getbusiness?businessId=${businessId}`
        );
        const data = await res.json();

        if (!data.business) throw new Error("Business not found");
        const b = data.business;

        // Apply theme if available
        if (b.ColorScheme) {
          try {
            const parsed = JSON.parse(b.ColorScheme);
            setTheme(parsed);
          } catch {}
        }

        setBusiness(b);

        // Parse services
        const raw = b.ServicesOffered || b.services || "";
        const parsed =
          typeof raw === "string"
            ? raw.split(",").map((s) => s.trim()).filter(Boolean)
            : Array.isArray(raw)
            ? raw
            : [];
        setServices(parsed);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchBusiness();
  }, [businessId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { businessId, ...formData };
    try {
      const res = await fetch(
        "https://jacobtf007.app.n8n.cloud/webhook/catbackai_createbooking",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error("Booking failed");
      alert(`✅ Booking submitted for ${business?.BusinessName}`);
      setFormData({
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

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  const logoUrl =
    business?.LogoLink ||
    business?.LinkToLogo ||
    business?.LogoFile ||
    "";

  return (
    <div
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        padding: "24px",
        maxWidth: 600,
        margin: "0 auto",
        background: theme.background,
        color: theme.text,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          marginBottom: 20,
        }}
      >
        {logoUrl && (
          <img
            src={logoUrl}
            alt={`${business.BusinessName} logo`}
            style={{
              maxWidth: 60,
              height: 60,
              borderRadius: 8,
              objectFit: "contain",
            }}
          />
        )}
        <h1 style={{ color: theme.header, fontWeight: 900 }}>
          {business?.BusinessName}
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          background: theme.accent + "15", // accent tinted
          padding: 20,
          borderRadius: 12,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <label>
          <strong>Service</strong>
          <select
            name="serviceRequested"
            value={formData.serviceRequested}
            onChange={handleChange}
            required
            style={{
              padding: 8,
              borderRadius: 6,
              border: "1px solid #ccc",
              width: "100%",
            }}
          >
            <option value="">Select service</option>
            {services.map((s, i) => (
              <option key={i} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label>
          <strong>Date</strong>
          <input
            type="date"
            name="preferredDate"
            value={formData.preferredDate}
            onChange={handleChange}
            required
            style={{
              padding: 8,
              borderRadius: 6,
              border: "1px solid #ccc",
              width: "100%",
            }}
          />
        </label>

        <label>
          <strong>Time</strong>
          <input
            type="time"
            name="preferredTime"
            value={formData.preferredTime}
            onChange={handleChange}
            required
            style={{
              padding: 8,
              borderRadius: 6,
              border: "1px solid #ccc",
              width: "100%",
            }}
          />
        </label>

        <label>
          <strong>Your Name</strong>
          <input
            name="clientName"
            value={formData.clientName}
            onChange={handleChange}
            required
            style={{
              padding: 8,
              borderRadius: 6,
              border: "1px solid #ccc",
              width: "100%",
            }}
          />
        </label>

        <label>
          <strong>Contact Info</strong>
          <input
            name="clientEmail"
            value={formData.clientEmail}
            onChange={handleChange}
            placeholder="Email or phone"
            required
            style={{
              padding: 8,
              borderRadius: 6,
              border: "1px solid #ccc",
              width: "100%",
            }}
          />
        </label>

        <button
          type="submit"
          style={{
            background: theme.accent,
            color: "#fff",
            padding: "10px 20px",
            borderRadius: 8,
            border: "none",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Submit Booking
        </button>
      </form>
    </div>
  );
}