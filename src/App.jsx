import { useState } from "react";
import logo from "./assets/logo.png";

function App() {
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const remindersChecked = e.target.reminders.checked;

    if (!remindersChecked) {
      setError(
        "You must agree to receive appointment confirmations and reminders."
      );
      return;
    }

    setError(""); // clear errors if all good

    // ✅ Handle form submission here (send to backend/n8n/etc.)
    alert("Form submitted successfully!");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        backgroundColor: "#f8f8f8",
        display: "flex",
        justifyContent: "center",
        padding: "40px 0",
      }}
    >
      {/* Centered container */}
      <div
        style={{
          maxWidth: "400px",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        {/* Header with logo + brand name */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "20px",
          }}
        >
          <img
            src={logo}
            alt="CatBackAI Logo"
            style={{ width: "40px", height: "40px", marginRight: "10px" }}
          />
          <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#000" }}>
            CatBackAI
          </h1>
        </header>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "20px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
          }}
        >
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "600",
              marginBottom: "20px",
              color: "#000",
            }}
          >
            Book Your Appointment
          </h2>

          {/* Full Name */}
          <div style={{ marginBottom: "15px" }}>
            <label
              htmlFor="name"
              style={{ display: "block", marginBottom: "5px", color: "#000" }}
            >
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                textAlign: "center",
                backgroundColor: "#fff",
                color: "#000",
              }}
              placeholder="Enter your name"
              required
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: "15px" }}>
            <label
              htmlFor="email"
              style={{ display: "block", marginBottom: "5px", color: "#000" }}
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                textAlign: "center",
                backgroundColor: "#fff",
                color: "#000",
              }}
              placeholder="Enter your email"
              required
            />
          </div>

          {/* Phone Number */}
          <div style={{ marginBottom: "15px" }}>
            <label
              htmlFor="phone"
              style={{ display: "block", marginBottom: "5px", color: "#000" }}
            >
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                textAlign: "center",
                backgroundColor: "#fff",
                color: "#000",
              }}
              placeholder="(555) 123-4567"
              required
            />
          </div>

          {/* Mandatory reminders opt-in (required) */}
          <div style={{ marginBottom: "12px", textAlign: "left" }}>
            <input
              type="checkbox"
              id="reminders"
              name="reminders"
              style={{ marginRight: "8px" }}
            />
            <label htmlFor="reminders" style={{ color: "#000" }}>
              I agree to receive appointment confirmations and follow-up
              reminders via SMS/email.
            </label>
          </div>

          {/* Optional marketing opt-in */}
          <div style={{ marginBottom: "16px", textAlign: "left" }}>
            <input
              type="checkbox"
              id="marketing"
              name="marketing"
              style={{ marginRight: "8px" }}
            />
            <label htmlFor="marketing" style={{ color: "#000" }}>
              I want to receive special offers and updates.
            </label>
          </div>

          {/* Error message if reminders not checked */}
          {error && (
            <p style={{ color: "red", fontSize: "13px", marginBottom: "12px" }}>
              {error}
            </p>
          )}

          {/* Compliance disclosure */}
          <p
            style={{
              fontSize: "12.5px",
              color: "#333",
              marginBottom: "18px",
              lineHeight: "1.45",
              textAlign: "left",
            }}
          >
            By submitting this form, you consent to receive messages from{" "}
            <strong>CatBackAI</strong> related to your appointment. Message &
            data rates may apply. Message frequency varies. Reply{" "}
            <strong>STOP</strong> to unsubscribe, <strong>HELP</strong> for help.
            See our Privacy Policy below.
          </p>

          {/* Submit Button */}
          <button
            type="submit"
            style={{
              backgroundColor: "#2563eb",
              color: "white",
              padding: "10px",
              width: "100%",
              borderRadius: "6px",
              fontWeight: "600",
              cursor: "pointer",
              border: "none",
            }}
          >
            Submit
          </button>

          {/* Privacy Policy Link */}
          <p style={{ fontSize: "12px", color: "#666", marginTop: "15px" }}>
            Read our{" "}
            <a
              href="/privacy.html"
              style={{ color: "#2563eb", textDecoration: "underline" }}
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Policy
            </a>
          </p>
        </form>
      </div>

      {/* Floating Chatbot */}
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          width: "350px",
          height: "500px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          borderRadius: "8px",
          overflow: "hidden",
          zIndex: 1000,
          background: "#fff",
        }}
      >
        <iframe
          src="https://chat.heroai.pro/?ns=cat_back&title=Cat%20Back%20AI%20Assistant&primary=%23fbf6e7&secondary=%23fbf6e7&calendly=https%3A%2F%2Fcalendly.com%2Fcatbackproai%2Ffull-car-detailing&open=true&hideLauncher=true"
          style={{ width: "100%", height: "100%", border: "0" }}
          title="CatBack AI Assistant"
        ></iframe>
      </div>
    </div>
  );
}

export default App;
