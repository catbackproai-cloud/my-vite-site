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

  useEffect(() => {
    async function fetchBusiness() {
      try {
        const res = await fetch(
          `https://jacobtf007.app.n8n.cloud/webhook/catbackai_getbusiness?businessId=${businessId}`
        );
        if (!res.ok) throw new Error("Failed to fetch business info");

        const data = await res.json();
        if (!data || !data.business) throw new Error("Business not found");

        setBusiness(data.business);

        // 👇 detect where your “Services Offered” lives
        const raw =
          data.business["Services Offered"] ||
          data.business["servicesOffered"] ||
          data.business["services"] ||
          data.business["Services"] ||
          "[]";

        // try to parse JSON if possible, otherwise fallback to comma-separated string
        let parsed = [];
        if (typeof raw === "string") {
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = raw.split(",").map((s) => s.trim());
          }
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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

      alert(`✅ Booking submitted for ${business?.BusinessName}!`);
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

  if (loading)
    return <p style={{ textAlign: "center" }}>Loading business info…</p>;
  if (error)
    return <p style={{ color: "red", textAlign: "center" }}>{error}</p>;

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
      {/* Logo */}
      {business?.["LogoLink"] && (
        <div style={{ textAlign: "center", marginBottom: "1rem" }}>
          <img
            src={business["LogoLink"]}
            alt="Business Logo"
            style={{ maxWidth: "120px", borderRadius: "8px" }}
          />
        </div>
      )}

      {/* Business Name */}
      <h1
        style={{
          color: "#de8d2b",
          textAlign: "center",
          marginBottom: "16px",
        }}
      >
        {business?.BusinessName || "Business"}
      </h1>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        style={{
          background: "#fff4eb",
          padding: "20px",
          borderRadius: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {/* Service dropdown */}
        <label>
          Service
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
              <option key={i} value={s.name || s.Service || s}>
                {s.name || s.Service || s}
              </option>
            ))}
          </select>
        </label>

        {/* Date & Time */}
        <label>
          Date
          <input
            type="date"
            name="preferredDate"
            value={formData.preferredDate}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Time
          <input
            type="time"
            name="preferredTime"
            value={formData.preferredTime}
            onChange={handleChange}
            required
          />
        </label>

        {/* Name */}
        <label>
          Name
          <input
            name="clientName"
            value={formData.clientName}
            onChange={handleChange}
            required
          />
        </label>

        {/* Email / Phone */}
        <label>
          Email / Phone
          <input
            name="clientEmail"
            value={formData.clientEmail}
            onChange={handleChange}
            placeholder="Email or phone number"
            required
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
