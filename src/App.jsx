import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import logo from "./assets/Y-Logo.png"; // ✅ exact file name

function App() {
useEffect(() => {
  // === Hero AI overlay — same logic as your workflow embed, React-safe ===
  (function () {
    const NS = "cat_back"; // <-- put his namespace here
    const I = "https://bot.heroai.pro/?ns=" + encodeURIComponent(NS) + "&hideLauncher=1";

    // Inject CSS (includes display:none on the panel until clicked)
    const css =
      ".heroai-launcher{position:fixed;right:20px;bottom:20px;min-width:56px;height:56px;padding:0 18px;border:0;border-radius:999px;font-weight:700;box-shadow:0 12px 28px rgba(13,27,62,.15);cursor:pointer;z-index:2147483646;display:inline-flex;align-items:center;justify-content:center}"
      + ".heroai-iframe-wrap{position:fixed;right:20px;bottom:90px;width:380px;height:560px;display:none;border-radius:16px;overflow:hidden;box-shadow:0 18px 60px rgba(0,0,0,.22);z-index:2147483647}"
      + "@media(max-width:480px){.heroai-iframe-wrap{left:0;right:0;bottom:0;width:100vw;height:70vh;border-radius:16px 16px 0 0}}"
      + ".heroai-iframe{width:100%;height:100%;border:0}";
    const st = document.createElement("style");
    st.textContent = css;
    document.head.appendChild(st);

    // Build DOM
    const wrap = document.createElement("div");
    wrap.className = "heroai-iframe-wrap";
    const iframe = document.createElement("iframe");
    iframe.className = "heroai-iframe";
    iframe.src = I;
    iframe.title = "Hero AI Assistant";
    iframe.allow = "clipboard-read; clipboard-write";
    wrap.appendChild(iframe);
    document.body.appendChild(wrap);

    const btn = document.createElement("button");
    btn.className = "heroai-launcher";
    btn.textContent = "Chat";
    btn.style.background = "#0a4fd3";
    btn.style.color = "#fff";
    document.body.appendChild(btn);

    // Open/close logic
    let open = false;
    function setOpen(v) {
      open = v;
      wrap.style.display = v ? "block" : "none";
      if (v) {
        try { iframe.contentWindow.postMessage({ type: "HERO_CHAT_OPEN" }, "*"); } catch {}
      }
    }
    btn.addEventListener("click", () => setOpen(!open));

    // Pull label/colors from ns-config
    fetch("https://n8n.srv845865.hstgr.cloud/webhook/ns-config?ns=" + encodeURIComponent(NS) + "&_=" + Date.now(), {
      headers: { "cache-control": "no-cache" },
      credentials: "omit",
    })
      .then(r => r.json())
      .then(cfg => {
        const ui = cfg?.ui || {};
        const c  = cfg?.colors || {};
        btn.textContent = (ui.launcher_text || "Chat").trim();
        if (c.launcher_bg)   btn.style.background = String(c.launcher_bg).trim();
        if (c.launcher_text) btn.style.color      = String(c.launcher_text).trim();
      })
      .catch(() => {});

    // Cleanup (for hot reloads/navigation)
    return () => { try { btn.remove(); wrap.remove(); st.remove(); } catch {} };
  })();
}, []);
  const openChatbot = (topic) => {
 alert(`Chatbot opened for: ${topic}`);
 };

(function(){var NS="cat_back";
var I="https://bot.heroai.pro/?ns="+encodeURIComponent(NS);
function CSS(h){var s=document.createElement("style");s.textContent=h;document.head.appendChild(s);}
CSS(".heroai-launcher{position:fixed;right:20px;bottom:20px;min-width:56px;height:56px;padding:0 18px;border:0;border-radius:999px;font-weight:700;box-shadow:0 12px 28px rgba(13,27,62,.15);cursor:pointer;z-index:2147483646;display:inline-flex;align-items:center;justify-content:center}"+
".heroai-iframe-wrap{position:fixed;right:20px;bottom:90px;width:380px;height:560px;display:none;border-radius:16px;overflow:hidden;box-shadow:0 18px 60px rgba(0,0,0,.22);z-index:2147483647}"+
"@media(max-width:480px){.heroai-iframe-wrap{left:0;right:0;bottom:0;width:100vw;height:70vh;border-radius:16px 16px 0 0}}"+
".heroai-iframe{width:100%;height:100%;border:0}");
var wrap=document.createElement("div");wrap.className="heroai-iframe-wrap";
var iframe=document.createElement("iframe");iframe.className="heroai-iframe";iframe.src=I+"&hideLauncher=1";iframe.allow="clipboard-read; clipboard-write";
wrap.appendChild(iframe);document.body.appendChild(wrap);
var btn=document.createElement("button");btn.className="heroai-launcher";btn.textContent="Chat";btn.style.background="#0a4fd3";btn.style.color="#fff";document.body.appendChild(btn);
var open=false;function setOpen(v){open=v;wrap.style.display=v?"block":"none";if(v)try{iframe.contentWindow.postMessage({type:"HERO_CHAT_OPEN"},"*")}catch(e){}}
btn.addEventListener("click",function(){setOpen(!open)});
fetch("https://n8n.srv845865.hstgr.cloud/webhook/ns-config?ns="+encodeURIComponent(NS)+"&_="+Date.now(),{headers:{"cache-control":"no-cache"},credentials:"omit"})
.then(function(r){return r.json()}).then(function(cfg){var ui=cfg.ui||{},c=cfg.colors||{},label=(ui.launcher_text||"Chat").trim();btn.textContent=label;
if(c.launcher_bg)btn.style.background=String(c.launcher_bg).trim();
if(c.launcher_text)btn.style.color=String(c.launcher_text).trim();})
.catch(function(){});
})();

 /* ---------- signup form state ---------- */
 const [formData, setFormData] = useState({
 BusinessType: "",
 OwnerName: "",
 BusinessName: "",
 BusinessEmail: "",
 BusinessPhoneNumber: "",
 Address: "",
 LogoFile: null, // ✅ upload → Drive
 BusinessHours: "",
 Socials: "",
 LocationOfServices: "",
 Notes: "",
 Consent: false,
 BusinessId: "", // hidden, auto-handled
 });

 const [status, setStatus] = useState({
 done: false,
 error: "",
 businessId: "",
 bookingLink: "",
 });

 const [copied, setCopied] = useState(false);

 const handleChange = (e) => {
 const { name, value, type, checked, files } = e.target;
 if (type === "file") {
 setFormData((s) => ({ ...s, [name]: files[0] || null }));
 } else {
 setFormData((s) => ({
 ...s,
 [name]: type === "checkbox" ? checked : value,
 }));
 }
 };

 const handleSubmit = async (e) => {
 e.preventDefault();
 setStatus({ done: false, error: "", businessId: "", bookingLink: "" });

 try {
 const body = new FormData();
 Object.entries(formData).forEach(([key, value]) => {
 if (value !== null && value !== undefined) body.append(key, value);
 });

 const res = await fetch(
 "https://script.google.com/macros/s/AKfycbyszuOhZOPY3UUOa7bG1uhEA7Q_avOG7zs_t3u8CCCwpEQSo4QdfjkPhfcQefmbftBm/exec",
 { method: "POST", body }
 );

 const json = await res.json();
 if (!res.ok || json.result !== "ok") {
 throw new Error(json.message || "Server error");
 }

 setStatus({
 done: true,
 error: "",
 businessId: json.businessId,
 bookingLink: json.bookingLink, // ✅ returned by Apps Script (e.g. "/book/{id}")
 });
 } catch (err) {
 setStatus({
 done: false,
 error: "Could not submit: " + err.message,
 businessId: "",
 bookingLink: "",
 });
 }
 };

 const copyToClipboard = () => {
 if (status.bookingLink) {
 navigator.clipboard.writeText(status.bookingLink);
 } else {
 navigator.clipboard.writeText(status.businessId);
 }
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 };

 return (
 <div
 className="mainLayout"
 style={{
 fontFamily:
 "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
 background: "linear-gradient(180deg, #fff7ef 0%, #f8f8f8 100%)",
 width: "100vw",
 minHeight: "100vh",
 }}
 >
 <Helmet>
 <style>{`
 :root { --brand:#de8d2b; }

 /* Global Resets / Helpers */
 * { box-sizing: border-box; }
 html, body, #root { height: 100%; }
 a { color: inherit; }
 .container { max-width: 1200px; margin: 0 auto; }
 .muted { color: #444; }
 .center { text-align: center; }

 /* Section titles black (explicit) */
 h2.sectionTitle {
 display: inline-block;
 padding-bottom: 6px;
 border-bottom: 3px solid var(--brand);
 margin-bottom: 24px;
 font-size: 24px;
 font-weight: 800;
 color: #000 !important;
 }

 /* Nav links */
 nav a {
 text-decoration: none;
 color: var(--brand);
 font-weight: 600;
 font-size: 16px;
 }
 nav a:hover { color: #c67412; }

 /* Buttons */
 .btnPrimary {
 background-color: var(--brand);
 color: #000;
 padding: 10px 22px;
 border-radius: 8px;
 font-weight: 700;
 border: none;
 cursor: pointer;
 font-size: 15px;
 transition: background 180ms ease;
 }
 .btnPrimary:hover { background-color: #c67412; }

 .btnHero {
 background-color: var(--brand);
 color: #000;
 padding: 20px 50px;
 border-radius: 14px;
 font-weight: 900;
 border: none;
 cursor: pointer;
 font-size: 22px;
 transition: background 180ms ease;
 }
 .btnHero:hover { background-color: #c67412; }

 .btnGhost {
 background: transparent;
 color: #000;
 padding: 10px 16px;
 border-radius: 8px;
 font-weight: 700;
 border: 2px solid var(--brand);
 cursor: pointer;
 font-size: 14px;
 transition: all 180ms ease;
 }
 .btnGhost:hover {
 background: #ffe9d0;
 border-color: #c67412;
 }

 /* Cards hover bg */
 .hoverCard {
 transition: background 160ms ease, transform 160ms ease, box-shadow 160ms ease;
 will-change: background;
 }
 .hoverCard:hover {
 background-color: #ffe9d0; /* soft orange */
 }

 /* Pricing card accent */
 .pricingCard {
 border: 2px solid #eee;
 transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease, background 160ms ease;
 }
 .pricingCard:hover {
 transform: translateY(-2px);
 border-color: var(--brand);
 box-shadow: 0 12px 30px rgba(0,0,0,0.08);
 background: #fffdf8;
 }

 /* Badges */
 .badge {
 display: inline-block;
 padding: 4px 10px;
 border-radius: 999px;
 font-weight: 800;
 font-size: 12px;
 background: #fff1e0;
 color: #7a4b0c;
 }
 `}</style>
 </Helmet>

 {/* NAVBAR */}
 <header
 style={{
 display: "flex",
 justifyContent: "space-between",
 alignItems: "center",
 padding: "20px 60px",
 background: "#fff",
 boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
 position: "sticky",
 top: 0,
 zIndex: 100,
 }}
 >
 <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
 <img src={logo} alt="CatBackAI Logo" style={{ width: 42, height: 42 }} />
 <span style={{ fontWeight: 900, fontSize: 22, color: "#000" }}>
 CatBackAI
 </span>
 </div>

 <nav style={{ display: "flex", gap: "40px", flex: 1, justifyContent: "center" }}>
 <a href="#who-we-are">Who We Are</a>
 <a href="#why-catbackai">Why CatBackAI</a>
 <a href="#pricing">Pricing</a>
 </nav>

 <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
 <a href="#login" style={{ fontWeight: 600, fontSize: 16 }}>Log In</a>
 <button className="btnPrimary" onClick={() => openChatbot("signup")}>
 Get Started
 </button>
 </div>
 </header>

 {/* HERO SECTION */}
 <section
 className="container"
 style={{
 display: "grid",
 gridTemplateColumns: "1fr 1fr",
 alignItems: "start",
 padding: "80px 60px",
 gap: "50px",
 }}
 >
 {/* Left column */}
 <div>
 <div className="badge" style={{ marginBottom: 12 }}>Built for service businesses</div>
 <h1
 style={{
 fontSize: 38,
 fontWeight: 900,
 marginBottom: 16,
 color: "#000",
 }}
 >
 Bring in more sales and maintain your customers
 </h1>
 <p style={{ fontSize: 18, color: "#333", marginBottom: 28 }}>
 CatBackAI helps you automate bookings, reduce no-shows, and grow
 lasting client relationships with smart follow-ups.
 </p>
 <div style={{ display: "flex", gap: "18px", flexWrap: "wrap" }}>
 <a className="btnHero" href="#signup-form">Get Started</a>
 <button className="btnGhost" onClick={() => openChatbot("demo")}>
 See a quick demo
 </button>
 </div>
 <ul style={{ marginTop: 22, color: "#333", fontSize: 15, lineHeight: 1.8 }}>
 <li>24/7 self-serve booking</li>
 <li>Automatic confirmations, reminders, and follow-ups</li>
 <li>Simple setup, no code required</li>
 </ul>
 </div>

 {/* Right column: SIGNUP FORM */}
 <div>
 {status.done ? (
 <div style={card}>
 <h3 style={title}>✅ Thanks for signing up!</h3>
 <p style={muted}><strong>Business ID:</strong> {status.businessId}</p>
 <p style={muted}>
 <strong>Booking Link:</strong>{" "}
 <a href={status.bookingLink} target="_blank" rel="noreferrer">
 {status.bookingLink}
 </a>
 </p>
 <button
 onClick={copyToClipboard}
 style={{
 ...btn,
 marginTop: "10px",
 background: copied ? "#4caf50" : "#de8d2b",
 color: copied ? "#fff" : "#000",
 }}
 >
 {copied ? "Copied!" : "Copy Booking Link"}
 </button>
 </div>
 ) : (
 <form onSubmit={handleSubmit} style={card} id="signup-form">
 <h3 style={title}>Business Onboarding</h3>

 <label style={label}>Business Type</label>
 <select
 name="BusinessType"
 value={formData.BusinessType}
 onChange={handleChange}
 required
 style={input}
 >
 <option value="">Select</option>
 <option>Auto Detailing</option>
 <option>Barber</option>
 <option>Nail Salon</option>
 <option>Spa</option>
 <option>Fitness</option>
 <option>Other</option>
 </select>

 <label style={label}>Owner Full Name</label>
 <input name="OwnerName" value={formData.OwnerName} onChange={handleChange} required style={input} />

 <label style={label}>Business Name</label>
 <input name="BusinessName" value={formData.BusinessName} onChange={handleChange} required style={input} />

 <label style={label}>Business Email</label>
 <input type="email" name="BusinessEmail" value={formData.BusinessEmail} onChange={handleChange} required style={input} />

 <label style={label}>Business Phone Number</label>
 <input type="tel" name="BusinessPhoneNumber" value={formData.BusinessPhoneNumber} onChange={handleChange} required style={input} />

 <label style={label}>Address</label>
 <input name="Address" value={formData.Address} onChange={handleChange} style={input} />

 <label style={label}>Upload Logo (optional)</label>
 <input type="file" name="LogoFile" accept="image/*" onChange={handleChange} style={input} />

 <label style={label}>Business Hours</label>
 <textarea name="BusinessHours" value={formData.BusinessHours} onChange={handleChange} rows={2} style={textarea} />

 <label style={label}>Socials</label>
 <textarea name="Socials" value={formData.Socials} onChange={handleChange} rows={2} style={textarea} />

 <label style={label}>Location of Services</label>
 <select name="LocationOfServices" value={formData.LocationOfServices} onChange={handleChange} required style={input}>
 <option value="">Select</option>
 <option>On-site</option>
 <option>Mobile</option>
 <option>Both</option>
 </select>

 <label style={label}>Requests / Notes</label>
 <textarea name="Notes" value={formData.Notes} onChange={handleChange} rows={3} style={textarea} />

 <label style={{ ...label, display: "flex", gap: 8, alignItems: "flex-start" }}>
 <input type="checkbox" name="Consent" checked={formData.Consent} onChange={handleChange} required />
 <span style={muted}>
 I acknowledge my clients may receive confirmations, reminders, and follow-ups from CatBackAI with opt-out instructions (Reply STOP).
 </span>
 </label>

 {status.error && <div style={errorBox}>{status.error}</div>}
 <button type="submit" style={btn}>Submit</button>
 </form>
 )}
 </div>
 </section>

 {/* WHO WE ARE */}
 <section id="who-we-are" className="container" style={{ padding: "60px 60px 20px" }}>
 <h2 className="sectionTitle">Who We Are</h2>
 <div
 style={{
 display: "grid",
 gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
 gap: 20,
 marginTop: 20,
 }}
 >
 <div style={{ ...card, minHeight: 140 }} className="hoverCard">
 <h3 style={title}>Focused on Results</h3>
 <p style={muted}>
 We’re a small team obsessed with helping service businesses book more jobs and retain more clients.
 </p>
 </div>
 <div style={{ ...card, minHeight: 140 }} className="hoverCard">
 <h3 style={title}>Fast Setup</h3>
 <p style={muted}>
 Most businesses can be onboarded in minutes. Just enter your info and you’ll get a booking link instantly.
 </p>
 </div>
 <div style={{ ...card, minHeight: 140 }} className="hoverCard">
 <h3 style={title}>Flexible & Growing</h3>
 <p style={muted}>
 Start with bookings and reminders. Add follow-ups and upsells when you’re ready.
 </p>
 </div>
 </div>
 </section>

 {/* WHY CATBACKAI */}
 <section id="why-catbackai" className="container" style={{ padding: "20px 60px 60px" }}>
 <h2 className="sectionTitle">Why CatBackAI</h2>
 <div
 style={{
 display: "grid",
 gridTemplateColumns: "1.3fr 1fr",
 gap: 40,
 alignItems: "center",
 }}
 >
 <div>
 <ul style={{ marginTop: 10, color: "#333", fontSize: 16, lineHeight: 1.9 }}>
 <li><strong>Stop losing leads</strong>—give customers a 24/7 way to book.</li>
 <li><strong>Reduce no-shows</strong> with confirmations and reminders via SMS/email.</li>
 <li><strong>Win more repeat business</strong> with follow-ups and review nudges.</li>
 <li><strong>See what’s working</strong> with simple tracking of bookings and outcomes.</li>
 </ul>
 <div style={{ marginTop: 18, display: "flex", gap: 12 }}>
 <a className="btnPrimary" href="#signup-form">Start Free</a>
 <button className="btnGhost" onClick={() => openChatbot("questions")}>
 Ask a question
 </button>
 </div>
 </div>
 <div style={{ ...card, padding: 24 }} className="hoverCard">
 <h3 style={{ ...title, marginBottom: 10 }}>How it works</h3>
 <ol style={{ color: "#333", lineHeight: 1.8, paddingLeft: 18 }}>
 <li>Enter your business details in the form.</li>
 <li>Get a unique booking link for clients.</li>
 <li>We handle confirmations, reminders, and follow-ups.</li>
 </ol>
 </div>
 </div>
 </section>

 {/* FEATURES SECTION */}
 <section className="container" style={{ padding: "60px", background: "#f9f9f9", borderRadius: 16 }}>
 <h2 className="sectionTitle">What CatBackAI Does</h2>
 <div
 style={{
 display: "grid",
 gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
 gap: "20px",
 marginTop: "20px",
 }}
 >
 <div style={card} className="hoverCard">
 <h3 style={title}>📅 Smart Scheduling</h3>
 <p style={muted}>
 Automated booking system so customers can schedule 24/7 — no missed calls or texts.
 </p>
 </div>
 <div style={card} className="hoverCard">
 <h3 style={title}>💬 SMS & Email Reminders</h3>
 <p style={muted}>
 Reduce no-shows with automatic appointment confirmations, reminders, and follow-ups.
 </p>
 </div>
 <div style={card} className="hoverCard">
 <h3 style={title}>📈 Customer Growth</h3>
 <p style={muted}>
 Build repeat business with personalized follow-up messages and upsell opportunities.
 </p>
 </div>
 </div>
 </section>

 {/* REVIEWS SECTION */}
 <section className="container" style={{ padding: "60px 60px 20px" }}>
 <h2 className="sectionTitle">Reviews</h2>
 <div
 style={{
 display: "grid",
 gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
 gap: "20px",
 marginTop: "20px",
 }}
 >
 <div style={card} className="hoverCard">
 <p style={muted}>
 "CatBackAI has doubled my appointments. No more missed calls and fewer no-shows!"
 </p>
 <p style={{ ...muted, fontWeight: "bold", color: "#de8d2b" }}>
 – Mike, Auto Detailer
 </p>
 </div>
 <div style={card} className="hoverCard">
 <p style={muted}>
 "Super easy setup, and my customers love the reminders. Worth every penny."
 </p>
 <p style={{ ...muted, fontWeight: "bold", color: "#de8d2b" }}>
 – Sarah, Mobile Detail Pro
 </p>
 </div>
 <div style={card} className="hoverCard">
 <p style={muted}>
 "I'm booking more repeat clients than ever. The follow-ups are a game changer."
 </p>
 <p style={{ ...muted, fontWeight: "bold", color: "#de8d2b" }}>
 – James, ShineWorks Detailing
 </p>
 </div>
 </div>
 </section>

 {/* PRICING */}
 <section id="pricing" className="container" style={{ padding: "20px 60px 80px" }}>
 <h2 className="sectionTitle">Pricing</h2>
 <p style={{ color: "#333", marginTop: 10 }}>
 Simple pricing with everything included. Upgrade or cancel anytime.
 </p>

 <div
 style={{
 display: "grid",
 gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
 gap: 24,
 marginTop: 24,
 }}
 >
 {/* Starter */}
 <div style={{ ...card, padding: 24 }} className="pricingCard">
 <div className="badge" style={{ marginBottom: 10 }}>Starter</div>
 <h3 style={{ ...title, fontSize: 22, marginBottom: 8 }}>$49/mo</h3>
 <ul style={{ color: "#333", lineHeight: 1.9, paddingLeft: 18 }}>
 <li>Online bookings</li>
 <li>SMS/email reminders</li>
 <li>Basic follow-ups</li>
 </ul>
 <a className="btnPrimary" href="#signup-form" style={{ marginTop: 12, display: "inline-block" }}>
 Start Starter
 </a>
 </div>

 {/* Growth */}
 <div style={{ ...card, padding: 24, border: "2px solid #f4c89a" }} className="pricingCard">
 <div className="badge" style={{ marginBottom: 10 }}>Most Popular</div>
 <h3 style={{ ...title, fontSize: 22, marginBottom: 8 }}>$99/mo</h3>
 <ul style={{ color: "#333", lineHeight: 1.9, paddingLeft: 18 }}>
 <li>Everything in Starter</li>
 <li>Advanced follow-ups & upsells</li>
 <li>Review nudges</li>
 </ul>
 <a className="btnPrimary" href="#signup-form" style={{ marginTop: 12, display: "inline-block" }}>
 Start Growth
 </a>
 </div>

 {/* Pro */}
 <div style={{ ...card, padding: 24 }} className="pricingCard">
 <div className="badge" style={{ marginBottom: 10 }}>Pro</div>
 <h3 style={{ ...title, fontSize: 22, marginBottom: 8 }}>$199/mo</h3>
 <ul style={{ color: "#333", lineHeight: 1.9, paddingLeft: 18 }}>
 <li>Everything in Growth</li>
 <li>Custom flows</li>
 <li>Priority support</li>
 </ul>
 <a className="btnPrimary" href="#signup-form" style={{ marginTop: 12, display: "inline-block" }}>
 Start Pro
 </a>
 </div>
 </div>
 </section>

 {/* FOOTER */}
 <footer
 style={{
 padding: "28px 60px",
 background: "#fff",
 borderTop: "1px solid #eee",
 marginTop: 20,
 }}
 >
 <div className="container" style={{ display: "flex", gap: 20, justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
 <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
 <img src={logo} alt="CatBackAI" style={{ width: 28, height: 28 }} />
 <strong style={{ fontSize: 16 }}>CatBackAI</strong>
 </div>
 <div style={{ color: "#666", fontSize: 14 }}>
 © {new Date().getFullYear()} CatBackAI — All rights reserved.
 </div>
 <div style={{ display: "flex", gap: 14 }}>
 <a href="#privacy" style={{ color: "#444", textDecoration: "none" }}>Privacy</a>
 <a href="#terms" style={{ color: "#444", textDecoration: "none" }}>Terms</a>
 <button className="btnGhost" onClick={() => openChatbot("support")}>Support</button>
 </div>
 </div>
 </footer>
 </div>
 );
}

/* ---------- styles ---------- */
const card = {
 background: "#fff",
 borderRadius: 12,
 padding: 20,
 boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
 display: "flex",
 flexDirection: "column",
 gap: 10,
};

const title = { margin: 0, fontWeight: 800, fontSize: 18, color: "#000" };

const label = { fontSize: 13, fontWeight: 700, color: "#111", marginTop: 4 };

const input = {
 fontSize: 14,
 padding: "10px 12px",
 borderRadius: 8,
 border: "1px solid #ddd",
};

const textarea = { ...input, minHeight: 64 };

const btn = {
 marginTop: 6,
 background: "#de8d2b",
 color: "#000",
 padding: "12px",
 border: "none",
 borderRadius: 10,
 fontWeight: 800,
 cursor: "pointer",
};

const muted = { color: "#444", fontSize: 13, lineHeight: 1.4 };

const errorBox = {
 background: "#ffecec",
 border: "1px solid #ffbcbc",
 color: "#9b0000",
 borderRadius: 8,
 padding: "8px 10px",
 fontSize: 13,
};

export default App;