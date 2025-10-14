import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";

export default function BookingForm() {
  // Get the businessId from the URL: /book/{businessId}
  const { businessId } = useParams();

  // Store the business data loaded from n8n
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form data for clients booking an appointment
  const [formData, setFormData] = useState({
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    serviceRequested: "",
    preferredDate: "",
    preferredTime: "",
    notes: "",
  });

  // Fetch business details from n8n
  useEffect(() => {
    async function fetchBusiness() {
      try {
        const res = await fetch(
          `https://jacobtf007.app.n8n.cloud/webhook-test/catbackai_getbusiness`
        );
        if (!res.ok) throw new Error("Failed to fetch business info");
        const data = await res.json();
        if (data?.result === "ok" && data.business) {
          setBusiness(data.business);
        } else {
          throw new Error("Business not found");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchBusiness();
  }, [businessId]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Submit booking (you’ll connect this to n8n POST later)
  const handleSubmit = async (e) => {
    e.preventDefault();
    alert(`Booking submitted for ${business?.BusinessName}!`);
    // 🔜 Later this will POST to /catbackai_createbooking flow
  };

  // UI rendering
  if (loading) return <p style={{ textAlign: "center" }}>Loading business info…</p>;
  if (error) return <p style={{ color: "red", textAlign: "center" }}>{error}</p>;

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
      {/* Business header */}
      <h1 style={{ color: "#de8d2b", textAlign: "center" }}>
        Book with {business?.BusinessName || "Business"}
      </h1>
      <p style={{ textAlign: "center", marginBottom: "1rem" }}>
        {business?.BusinessType} • {business?.LocationOfServices}
      </p>

      {/* Optional logo */}
      {business?.["Link to Logo"] && (
        <div style={{ textAlign: "center", marginBottom: "1rem" }}>
          <img
            src={business["Link to Logo"]}
            alt="Business Logo"
            style={{ maxWidth: "150px", borderRadius: "8px" }}
          />
        </div>
      )}

      {/* Contact + hours */}
      <div
        style={{
          background: "#fff4eb",
          padding: "12px 18px",
          borderRadius: "10px",
          marginBottom: "24px",
        }}
      >
        <p>
          <strong>Email:</strong> {business?.BusinessEmail}
        </p>
        <p>
          <strong>Phone:</strong> {business?.BusinessPhoneNumber}
        </p>
        <p>
          <strong>Hours:</strong> {business?.BusinessHours || "N/A"}
        </p>
        <p>
          <strong>Address:</strong> {business?.["Address (If Applicable)"] || "—"}
        </p>
      </div>

      {/* Booking form */}
      <form onSubmit={handleSubmit}>
        <label>
          Name
          <input
            name="clientName"
            value={formData.clientName}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Phone
          <input
            name="clientPhone"
            value={formData.clientPhone}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Email
          <input
            type="email"
            name="clientEmail"
            value={formData.clientEmail}
            onChange={handleChange}
          />
        </label>

        <label>
          Service Requested
          <input
            name="serviceRequested"
            value={formData.serviceRequested}
            onChange={handleChange}
            placeholder="e.g. Deluxe Car Wash"
          />
        </label>

        <label>
          Preferred Date
          <input
            type="date"
            name="preferredDate"
            value={formData.preferredDate}
            onChange={handleChange}
          />
        </label>

        <label>
          Preferred Time
          <input
            type="time"
            name="preferredTime"
            value={formData.preferredTime}
            onChange={handleChange}
          />
        </label>

        <label>
          Notes
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
          />
        </label>

        <button
          type="submit"
          style={{
            background: "#de8d2b",
            color: "white",
            padding: "10px 20px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            marginTop: "10px",
            width: "100%",
          }}
        >
          Submit Booking
        </button>
      </form>
    </div>
  );
}
