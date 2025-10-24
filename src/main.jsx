import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import BookingForm from "./BookingForm";
import SchedulingDashboard from "./SchedulingDashboard"; // ✅ new import

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <Routes>
          {/* Home page (signup form) */}
          <Route path="/" element={<App />} />

          {/* Dynamic booking form */}
          <Route path="/book/:businessId" element={<BookingForm />} />

          {/* ✅ New scheduling dashboard */}
          <Route path="/dashboard" element={<SchedulingDashboard />} />

          {/* New Dashboard Login Portal */}
          <Route path="/dashboard" element={<DashboardPortal />} />

          {/* 404 fallback */}
          <Route
            path="*"
            element={
              <div
                style={{
                  textAlign: "center",
                  marginTop: "50px",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                <h2>404 — Page Not Found</h2>
                <a
                  href="/"
                  style={{ color: "#de8d2b", textDecoration: "none" }}
                >
                  Go back home
                </a>
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
