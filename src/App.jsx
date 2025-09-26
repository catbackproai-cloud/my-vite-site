import { Helmet } from "react-helmet";
import logo from "./assets/logo.png";
import { useMemo, useState } from "react";

function App() {
  const daysOfWeek = useMemo(
    () => ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
    []
  );

  const defaultHours = () =>
    daysOfWeek.reduce((acc, d) => {
      acc[d] = { openTime: "", openPeriod: "AM", closeTime: "", closePeriod: "PM", closed: true };
      return acc;
    }, {});

  const [formData, setFormData] = useState({
    name: "",
    businessName: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
    hours: defaultHours(),
    logoFile: null,
    services: [{ service: "", price: "", description: "", length: "" }],
  });

  /* ---------- helpers ---------- */
  const handleChange = (e) => setFormData((s) => ({ ...s, [e.target.name]: e.target.value }));
  const handleFileChange = (e) => setFormData((s) => ({ ...s, logoFile: e.target.files?.[0] ?? null }));

  const toggleDay = (day) =>
    setFormData((s) => ({ ...s, hours: { ...s.hours, [day]: { ...s.hours[day], closed: !s.hours[day].closed } } }));

  const formatTimeInput = (value) => {
    if (!value) return "";
    let digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length === 3 || digits.length === 4) {
      digits = digits.slice(0, digits.length - 2) + ":" + digits.slice(-2);
    }
    return digits;
  };

  const setHourField = (day, field, value) =>
    setFormData((s) => ({ ...s, hours: { ...s.hours, [day]: { ...s.hours[day], [field]: formatTimeInput(value) } } }));

  const setPeriodField = (day, field, value) =>
    setFormData((s) => ({ ...s, hours: { ...s.hours, [day]: { ...s.hours[day], [field]: value } } }));

  const handleRowMouseDown = (day, e) => {
    const tag = e.target.tagName;
    const interactive = ["INPUT","SELECT","TEXTAREA","BUTTON","OPTION"].includes(tag);
    if (!interactive) toggleDay(day);
  };

  // Services handlers
  const handleServiceChange = (index, field, value) => {
    setFormData((s) => {
      const updated = [...s.services];
      updated[index][field] = value;
      return { ...s, services: updated };
    });
  };

  const addService = () => {
    setFormData((s) => ({
      ...s,
      services: [...s.services, { service: "", price: "", description: "", length: "" }],
    }));
  };

  /* ---------- submit ---------- */
  const handleSubmit = (e) => {
    e.preventDefault();

    // snapshot current state BEFORE clearing
    const current = formData;

    // Prepare FormData payload
    const scriptURL =
      "https://script.google.com/macros/s/AKfycbyj5HT_tVpK9mg-YwZa6wL3V183806KMfXTTJKxxh_-XM2idv55csoHzkFuqWIDpyOIbQ/exec";
    const fd = new FormData();
    fd.append("name", current.name);
    fd.append("businessName", current.businessName);
    fd.append("email", current.email);
    fd.append("phone", current.phone);
    fd.append("address", current.address);
    fd.append("notes", current.notes);
    fd.append("hours", JSON.stringify(current.hours));
    fd.append("services", JSON.stringify(current.services));

    // ⚡ Show popup instantly
    alert("✅ Form submitted!");

    // Clear UI immediately
    setFormData({
      name: "",
      businessName: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
      hours: defaultHours(),
      logoFile: null,
      services: [{ service: "", price: "", description: "", length: "" }],
    });
    e.target.reset();

    // If logo exists → convert to Base64 before sending
    if (current.logoFile) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        fd.append("logoFile", reader.result.split(",")[1]); // Base64 only
        try {
          await fetch(scriptURL, { method: "POST", body: fd });
        } catch (err) {
          console.error("❌ Error submitting form:", err);
        }
      };
      reader.readAsDataURL(current.logoFile);
      return; // don’t run the fetch twice
    }

    // If no logo, submit right away
    fetch(scriptURL, { method: "POST", body: fd }).catch((err) =>
      console.error("❌ Error submitting form:", err)
    );
  };

  return (
    <div className="mainLayout"
      style={{
        fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        backgroundColor: "#f8f8f8",
        width: "100vw",
        minHeight: "100vh",
        display: "flex",
      }}
    >
      <Helmet>
        <style>{`
          input, select, textarea { background:#fff; color:#000; }
          input::placeholder { color:#888; }
          select:disabled, input:disabled { background:#f0f0f0; color:#666; }

          .hoverCard { transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease; border:1px solid #eee; }
          .hoverCard:hover { transform: translateY(-4px); box-shadow:0 6px 16px rgba(222,141,43,0.35); border-color:#de8d2b; }
          .rowHover { transition: background .2s ease, border .2s ease, box-shadow .2s ease; }
          .rowHover:hover { background:#fff7ef; border-color:#de8d2b; box-shadow:0 2px 10px rgba(222,141,43,0.15); }

          @media (max-width: 900px) {
            .mainLayout { flex-direction: column; }
            .rightPanel { margin: 20px; width: auto; height: auto; }
          }
        `}</style>
      </Helmet>

      {/* LEFT SIDE */}
      <div style={{ flex: 3, padding: "40px", overflowY: "auto" }}>
        <header style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
          <img src={logo} alt="CatBackAI Logo" style={{ width: 50, height: 50, marginRight: 12 }} />
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#000" }}>CatBackAI</h1>
        </header>

        <p style={{ fontSize: 18, marginBottom: 40, color: "#333" }}>
          Increase your bookings. <br /> Increase your revenue.
        </p>

        {/* Features */}
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20, textAlign:"center", color:"#000" }}>What CatBackAI Does</h2>
        <div style={{ display: "grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginBottom: 40 }}>
          <div style={cardStyle} className="hoverCard"><div style={iconStyle}>📅</div><h3 style={cardTitle}>Smart Scheduling</h3><p style={cardText}>Automated booking system so customers can schedule 24/7 — no missed calls or texts.</p></div>
          <div style={cardStyle} className="hoverCard"><div style={iconStyle}>💬</div><h3 style={cardTitle}>SMS & Email Reminders</h3><p style={cardText}>Reduce no-shows with automatic appointment confirmations, reminders, and follow-ups.</p></div>
          <div style={cardStyle} className="hoverCard"><div style={iconStyle}>📈</div><h3 style={cardTitle}>Customer Growth</h3><p style={cardText}>Build repeat business with personalized follow-up messages and upsell opportunities.</p></div>
        </div>

        {/* Reviews */}
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20, textAlign:"center", color:"#000" }}>Reviews</h2>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(250px, 1fr))", gap: 20 }}>
          <div style={reviewCard} className="hoverCard"><p style={reviewText}>"CatBackAI has doubled my appointments. No more missed calls and fewer no-shows!"</p><div style={reviewAuthor}>– Mike, Auto Detailer</div></div>
          <div style={reviewCard} className="hoverCard"><p style={reviewText}>"Super easy setup, and my customers love the reminders. Worth every penny."</p><div style={reviewAuthor}>– Sarah, Mobile Detail Pro</div></div>
          <div style={reviewCard} className="hoverCard"><p style={reviewText}>"I’m booking more repeat clients than ever. The follow-ups are a game changer."</p><div style={reviewAuthor}>– James, ShineWorks Detailing</div></div>
        </div>
      </div>

      {/* RIGHT SIDE FORM */}
      <div className="rightPanel"
        style={{ flex: 1, background: "#fff", padding: 24, borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,.15)", margin: 40, height: "calc(100vh - 80px)", display: "flex", flexDirection: "column" }}
      >
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16, color:"#000" }}>Business Signup</h2>
        <form onSubmit={handleSubmit} style={{ overflowY: "auto" }}>
          <input name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" required style={inputStyle} />
          <input name="businessName" value={formData.businessName} onChange={handleChange} placeholder="Business Name" required style={inputStyle} />
          <input name="email" value={formData.email} onChange={handleChange} type="email" placeholder="Business Email" required style={inputStyle} />
          <input name="phone" value={formData.phone} onChange={handleChange} type="tel" placeholder="Phone Number" required style={inputStyle} />
          <input name="address" value={formData.address} onChange={handleChange} placeholder="Address / Location" required style={inputStyle} />

          {/* Notes / Special Requests */}
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Notes / Special Requests"
            style={{ ...inputStyle, height:"80px", resize:"vertical" }}
          />

          {/* Services */}
          <div style={{ marginTop: 20, marginBottom: 10, fontWeight: 700, fontSize: "16px", color:"#000" }}>Services & Pricing</div>
          {formData.services.map((srv, i) => (
            <div key={i} style={{ marginBottom: 12, border:"1px solid #ddd", borderRadius:8, padding:12 }}>
              <input type="text" placeholder="Service Name" value={srv.service} onChange={(e) => handleServiceChange(i, "service", e.target.value)} style={inputStyle} />
              <input type="text" placeholder="Price (e.g. $50)" value={srv.price} onChange={(e) => handleServiceChange(i, "price", e.target.value)} style={inputStyle} />
              <input type="text" placeholder="Length (e.g. 1 hour)" value={srv.length} onChange={(e) => handleServiceChange(i, "length", e.target.value)} style={inputStyle} />
              <textarea placeholder="Service Description" value={srv.description} onChange={(e) => handleServiceChange(i, "description", e.target.value)} style={{ ...inputStyle, height:"60px", resize:"vertical" }} />
            </div>
          ))}
          <button type="button" onClick={addService} style={{ ...buttonStyle, background:"#555", marginBottom:16 }}>+ Add Service</button>

          {/* Business Hours */}
          <div style={{ marginTop: 20, marginBottom: 10, fontWeight: 700, fontSize: "16px", color:"#000" }}>Business Hours</div>
          {daysOfWeek.map((day) => {
            const d = formData.hours[day];
            return (
              <div key={day}
                style={{ ...rowStyle, border: d.closed ? "1px solid #ddd" : "2px solid #de8d2b", background: d.closed ? "#fafafa" : "#fff" }}
                className="rowHover"
                onMouseDown={(e) => handleRowMouseDown(day, e)}
              >
                <label style={{ display: "flex", alignItems: "center", gap: 8, color:"#000", cursor:"pointer" }}
                  onMouseDown={(e) => { e.stopPropagation(); toggleDay(day); }}>
                  <input type="checkbox" checked={!d.closed} readOnly style={{ pointerEvents: "none" }} />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{day}</span>
                </label>

                <div style={timeGroupWrap(d.closed)} onMouseDown={(e) => e.stopPropagation()}>
                  <input type="text" placeholder="09:00" value={d.openTime} onChange={(e) => setHourField(day, "openTime", e.target.value)} disabled={d.closed} style={timeBoxLeft} inputMode="numeric" />
                  <select value={d.openPeriod} onChange={(e) => setPeriodField(day, "openPeriod", e.target.value)} disabled={d.closed} style={ampmRight}><option>AM</option><option>PM</option></select>
                </div>

                <div style={{ textAlign: "center", color:"#000" }}>to</div>

                <div style={timeGroupWrap(d.closed)} onMouseDown={(e) => e.stopPropagation()}>
                  <input type="text" placeholder="05:00" value={d.closeTime} onChange={(e) => setHourField(day, "closeTime", e.target.value)} disabled={d.closed} style={timeBoxLeft} inputMode="numeric" />
                  <select value={d.closePeriod} onChange={(e) => setPeriodField(day, "closePeriod", e.target.value)} disabled={d.closed} style={ampmRight}><option>AM</option><option>PM</option></select>
                </div>
              </div>
            );
          })}

          <div style={{ marginTop: 16, fontWeight: 700, color:"#000" }}>Business Logo (Optional)</div>
          <input type="file" accept="image/*" onChange={handleFileChange} style={inputStyle} />
          <button type="submit" style={buttonStyle}>Submit</button>
        </form>
      </div>
    </div>
  );
}

/* ---------- styles ---------- */
const inputStyle = { display:"block", width:"100%", padding:"10px 12px", marginBottom:"12px", borderRadius:"8px", border:"1px solid #dcdcdc", fontSize:14, outline:"none", backgroundColor:"#fff", color:"#000" };
const rowStyle = { display:"grid", gridTemplateColumns:"140px 1fr 28px 1fr", alignItems:"center", gap:"12px", marginBottom:"10px", borderRadius:8, padding:"10px", cursor:"pointer" };
const timeGroupWrap = (disabled) => ({ display:"flex", alignItems:"center", opacity: disabled ? 0.5 : 1 });
const timeBoxLeft = { width:"88px", padding:"8px 10px", border:"1px solid #dcdcdc", borderRight:"0", borderTopLeftRadius:8, borderBottomLeftRadius:8, textAlign:"center", fontSize:14, backgroundColor:"#fff", color:"#000" };
const ampmRight = { width:"72px", padding:"8px 10px", border:"1px solid #dcdcdc", borderTopRightRadius:8, borderBottomRightRadius:8, fontSize:14, appearance:"menulist", backgroundColor:"#fff", color:"#000" };
const buttonStyle = { background:"#de8d2b", color:"#fff", fontWeight:800, padding:"12px 20px", border:"none", borderRadius:"8px", width:"100%", cursor:"pointer", marginTop:16 };
const cardStyle = { background:"#fff", borderRadius:12, padding:"20px", textAlign:"center", boxShadow:"0 2px 6px rgba(0,0,0,0.08)" };
const iconStyle = { fontSize:"28px", marginBottom:"12px", color:"#de8d2b" };
const cardTitle = { fontSize:"16px", fontWeight:700, marginBottom:"8px", color:"#000" };
const cardText  = { fontSize:"14px", color:"#444", lineHeight:"1.5" };
const reviewCard = { background:"#fff", borderRadius:12, padding:"20px", boxShadow:"0 2px 6px rgba(0,0,0,0.08)", display:"flex", flexDirection:"column", justifyContent:"space-between" };
const reviewText   = { fontSize:"14px", color:"#333", fontStyle:"italic", marginBottom:"12px" };
const reviewAuthor = { fontSize:"13px", fontWeight:600, color:"#de8d2b", textAlign:"right" };

export default App;

