import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import BookingForm from "./BookingForm";
import DashboardPortal from "./DashboardPortal";
import SchedulingDashboard from "./SchedulingDashboard";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <Routes>
          {/* Public signup form */}
          <Route path="/" element={<App />} />

          {/* Client booking page */}
          <Route path="/book/:businessId" element={<BookingForm />} />

          {/* Business login page */}
          <Route path="/dashboard" element={<DashboardPortal />} />

          {/* Private dashboard after login */}
          <Route path="/dashboard/:businessId" element={<SchedulingDashboard />} />

          {/* 404 fallback */}
          <Route
            path="*"
            element={
              <div style={{ textAlign: "center", marginTop: 50 }}>
                <h2>404 — Page Not Found</h2>
                <a href="/" style={{ color: "#de8d2b" }}>
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
