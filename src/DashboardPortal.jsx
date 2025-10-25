import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import logo from "./assets/Y-Logo.png";

export default function DashboardPortal() {
  const [businessId, setBusinessId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  /* ---------- AUTO-EXPIRE SESSION (1 HOUR) ---------- */
  useEffect(() => {
    const lastActive = sessionStorage.getItem("catback_lastActive");
    if (lastActive && Date.now() - parseInt(lastActive, 10) > 3600000) {
      sessionStorage.clear();
    }
  }, []);

  /* ---------- HANDLE LOGIN ---------- */
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(
        `https://jacobtf007.app.n8n.cloud/webhook/catbackai_verifylogin?businessId=${businessId}&pin=${pin}`
      );
      const data = await res.json();

      if (data.result === "ok") {
        // ✅ Save auth info
        sessionStorage.setItem("catback_token", businessId);
        sessionStorage.setItem("catback_lastActive", Date.now().toString());

        // ✅ Safari-safe redirect: allow storage to persist before navigation
        setTimeout(() => {
          window.location.href = `/dashboard/${businessId}`;
        }, 300);
      } else {
        setError("Invalid Business ID or PIN");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Error verifying credentials. Please try again.");
    }
  };

  /* ---------- UI ---------- */
  return (
    <div
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        minHeight: "100vh",
        background: "linear-gradient(180deg, #fff7ef 0%, #f8f8f8 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        padding: "20px",
      }}
    >
      <Helmet>
        <title>CatBackAI Dashboard Login</title>
      </Helmet>

      <img src={logo} alt="CatBackAI Logo" style={{ width: 80, marginBottom: 10 }} />
      <h2 style={{ color: "#de8d2b" }}>Business Dashboard</h2>

      <form onSubmit={handleLogin} style={{ maxWidth: 320, width: "100%" }}>
        <input
          type="text"
          placeholder="Business ID"
          value={businessId}
          onChange={(e) => setBusinessId(e.target.value)}
          style={{
            width: "100%",
            marginBottom: 10,
            padding: 8,
            borderRadius: 8,
            border: "1px solid #ccc",
          }}
          required
        />
        <input
          type="password"
          placeholder="Access PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          style={{
            width: "100%",
            marginBottom: 10,
            padding: 8,
            borderRadius: 8,
            border: "1px solid #ccc",
          }}
          required
        />
        <button
          type="submit"
          style={{
            background: "#de8d2b",
            color: "#fff",
            width: "100%",
            padding: "10px",
            border: "none",
            borderRadius: "8px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Log In
        </button>
      </form>

      {error && <p style={{ color: "red", marginTop: 10 }}>{error}</p>}
    </div>
  );
}
