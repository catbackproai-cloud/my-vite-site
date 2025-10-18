import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";

export default function BookingForm() {
  const { businessId } = useParams();

  const [business, setBusiness] = useState(null);
  const [services, setServices] = useState([]);
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

  // ✅ Fetch business info dynamically from n8n
  useEffect(() => {
  async function fetchBusiness() {
    try {
      const res = await fetch(
        `https://jacobtf007.app.n8n.cloud/webhook/catbackai_getbusiness?businessId=${businessId}`
      );

      if (!res.ok) throw new Error("Failed to fetch business info");
      const data = await res.json();

      if (data.result !== "ok" || !data.business) {
        throw new Error("Business not found or inactive");
      }

      const b = data.business;

      // 🧹 FIX: remove "=" or weird characters from Google Sheets exports
      Object.keys(b).forEach((key) => {
        if (typeof b[key] === "string") {
          b[key] = b[key].replace(/^=+/, "").trim();
        }
      });

      setBusiness(b);


        // Handle services field gracefully (array or comma-separated string)
        const raw = b.ServicesOffered || b.services || b["Services Offered"] || "";
        let parsed = [];

        if (typeof raw === "string") {
          parsed = raw
            .split(",")
            .map((s) => s.replace(/=+/g, "").trim())
            .filter(Boolean);
        } else if (Array.isArray(raw)) {
          parsed = raw;
        }

        setServices(parsed.filter(Boolean));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchBusiness();
  }, [businessId]);

  // ✅ Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Handle booking submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.serviceRequested || !formData.preferredDate || !formData.preferredTime) {
      alert("Please fill out all required fields.");
      return;
    }

    const payload = {
      businessId,
      ...formData,
    };

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

      await res.json();
      alert(`✅ Booking submitted for ${business?.BusinessName || "this business"}!`);

      // Reset form after submission
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

  // ✅ Loading / error states
  if (loading) {
    return <p style={{ textAlign: "center" }}>Loading business info…</p>;
  }

  if (error) {
    return (
      <p style={{ color: "red", textAlign: "center", padding: "20px" }}>
        {error}
      </p>
    );
  }

  // ✅ Determine logo URL (if any)
  const logoUrl =
  business?.LogoLink ||
  business?.LinkToLogo ||
  business?.LinktoLogo ||
  business?.LogoFile ||
  business?.Logo ||
  "";

  // ✅ Main booking form
  return (
    <div
      style={{
        fontFamily:
          "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        padding: "24px",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      {/* ✅ Business Header (logo + name side by side if logo exists) */}
<div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    marginBottom: "20px",
  }}
>
  {logoUrl && (
    <img
      src={logoUrl}
      alt={`${business.BusinessName || "Business"} logo`}
      style={{
        maxWidth: "60px",
        height: "60px",
        borderRadius: "8px",
        objectFit: "contain",
      }}
    />
  )}
  <h1
    style={{
      color: "#de8d2b",
      fontWeight: "900",
      fontSize: "28px",
      margin: 0,
    }}
  >
    {business?.BusinessName || "Business"}
  </h1>
</div>

      {/* Show logo only if URL is provided */}
      {logoUrl && (
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <img
            src={logoUrl}
            alt={`${business.BusinessName || "Business"} logo`}
            style={{
              maxWidth: "140px",
              borderRadius: "8px",
              objectFit: "contain",
            }}
          />
        </div>
      )}

      {/* Optional: Show Business Hours if available */}
      {business?.BusinessHours && (
        <p
          style={{
            textAlign: "center",
            marginBottom: "20px",
            color: "#444",
            fontSize: "14px",
          }}
        >
          Hours: {business.BusinessHours}
        </p>
      )}

      {/* Booking Form */}
      <form
        onSubmit={handleSubmit}
        style={{
          background: "#fff4eb",
          padding: "20px",
          borderRadius: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        {/* Service */}
        <label>
          <strong>Service</strong>
          <select
            name="serviceRequested"
            value={formData.serviceRequested}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #ccc",
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

        {/* Date */}
        <label>
          <strong>Date</strong>
          <input
            type="date"
            name="preferredDate"
            value={formData.preferredDate}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          />
        </label>

        {/* Time */}
        <label>
          <strong>Time</strong>
          <input
            type="time"
            name="preferredTime"
            value={formData.preferredTime}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          />
        </label>

        {/* Name */}
        <label>
          <strong>Your Name</strong>
          <input
            name="clientName"
            value={formData.clientName}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          />
        </label>

        {/* Contact */}
        <label>
          <strong>Email / Phone</strong>
          <input
            name="clientEmail"
            value={formData.clientEmail}
            onChange={handleChange}
            placeholder="Email or phone number"
            required
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          />
        </label>

        {/* Payment */}
        <fieldset style={{ border: "none", marginTop: "6px" }}>
          <legend style={{ fontWeight: "bold" }}>Payment</legend>
          <label style={{ display: "block" }}>
            <input
              type="radio"
              name="paymentMethod"
              value="Cash"
              checked={formData.paymentMethod === "Cash"}
              onChange={handleChange}
            />{" "}
            Cash
          </label>
          <label style={{ display: "block" }}>
            <input
              type="radio"
              name="paymentMethod"
              value="Venmo / CashApp / Zelle"
              checked={formData.paymentMethod === "Venmo / CashApp / Zelle"}
              onChange={handleChange}
            />{" "}
            Venmo / CashApp / Zelle / etc
          </label>
        </fieldset>

        {/* Submit */}
        <button
          type="submit"
          style={{
            background: "#de8d2b",
            color: "white",
            padding: "10px 20px",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
            marginTop: "12px",
          }}
        >
          Submit Booking
        </button>
      </form>
    </div>
  );
}
