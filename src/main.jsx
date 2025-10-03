import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App"; // Onboarding site
import BookingForm from "./BookingForm"; // New booking form

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Onboarding site */}
        <Route path="/" element={<App />} />

        {/* Booking form */}
        <Route path="/book/:businessId" element={<BookingForm />} />

        {/* Optional fallback */}
        <Route
          path="*"
          element={
            <h2 style={{ textAlign: "center", marginTop: "50px" }}>
              404 - Page Not Found
            </h2>
          }
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
