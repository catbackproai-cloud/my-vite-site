import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";   // ⬅️ new
import App from "./App";
import BookingForm from "./BookingForm";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <HelmetProvider>          {/* ⬅️ wrap router */}
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/book/:businessId" element={<BookingForm />} />
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
    </HelmetProvider>
  </React.StrictMode>
);
