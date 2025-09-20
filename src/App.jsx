import logo from "./assets/logo.png";

function App() {
  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        backgroundColor: "#f8f8f8", // off-white full background
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Strict centered container */}
      <div
        style={{
          maxWidth: "400px",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        {/* Header with logo + name */}
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
                color: "#000", // input text black
              }}
              placeholder="Enter your name"
              required
            />
          </div>

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
                color: "#000", // input text black
              }}
              placeholder="Enter your email"
              required
            />
          </div>

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
                color: "#000", // input text black
              }}
              placeholder="(555) 123-4567"
              required
            />
          </div>

          <p
            style={{
              fontSize: "14px",
              color: "#333",
              marginBottom: "20px",
              lineHeight: "1.4",
            }}
          >
            By entering your information, you agree to receive appointment
            confirmations and follow-up text messages from{" "}
            <strong>CatBackAI</strong>. Message &amp; data rates may apply. Reply
            STOP to unsubscribe.
          </p>

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
            }}
          >
            Submit
          </button>

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
    </div>
  );
}

export default App;
