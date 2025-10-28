import { useState, useEffect } from "react"; // 🔁 redeploy trigger
import { Helmet } from "react-helmet-async";
import logo from "./assets/Y-Logo.png"; // ✅ exact file name
import { useNavigate } from "react-router-dom";

function App() {
  const env = useClientEnv(); // <-- adds body classes for CSS
  const openChatbot = (topic) => {
    alert(`Chatbot opened for: ${topic}`);
  }
  const navigate = useNavigate();
;

  /* ---------- signup form state ---------- */
  const [formData, setFormData] = useState({
    BusinessType: "",
    OtherBusinessType: "",
    OwnerName: "",
    BusinessName: "",
    BusinessEmail: "",
    BusinessPhoneNumber: "",
    Notes: "",
    Consent: false,
    BusinessId: "", // hidden, auto-handled
  });

  const [status, setStatus] = useState({
    done: false,
    error: "",
    businessId: "",
  });

  // ✅ New: non-breaking enhancements
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedDraftAt, setSavedDraftAt] = useState("");

  useEffect(() => {
    try {
      const toSave = { ...formData };
      localStorage.setItem(
        "catbackai_onboarding_draft",
        JSON.stringify(toSave)
      );
      setSavedDraftAt(new Date().toLocaleTimeString());
    } catch (e) {
      // ignore
    }
  }, [formData]);

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

  // ✅ simple validation + completion meter
  const requiredFields = [
    "BusinessType",
    "OwnerName",
    "BusinessName",
    "BusinessEmail",
    "BusinessPhoneNumber",
    
    "Consent",
  ];
  const completedCount = requiredFields.filter((f) =>
    f === "Consent" ? !!formData[f] : String(formData[f] || "").trim() !== ""
  ).length;
  const completionPct = Math.round(
    (completedCount / requiredFields.length) * 100
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ done: false, error: "", businessId: "", bookingLink: "" });

    // quick client-side validation
    for (const f of requiredFields) {
      if (f !== "Consent" && String(formData[f] || "").trim() === "") {
        setStatus((s) => ({ ...s, error: `Please fill the required field: ${f}` }));
        return;
      }
      if (f === "Consent" && !formData.Consent) {
        setStatus((s) => ({ ...s, error: "Please check the consent box." }));
        return;
      }
    }

    setSubmitting(true);
    console.log("🟠 Submitting form data to n8n (raw formData):", formData);
    const payload = { ...formData };
    console.log("🟠 Final payload to n8n:", payload);

    try {
      const res = await fetch(
        "https://jacobtf007.app.n8n.cloud/webhook/catbackai_signup",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const text = await res.text();
      console.log("🟢 Raw response text:", text);

      // ✅ Graceful JSON parsing or plain-text fallback
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        if (text.toLowerCase().includes("ok") || text.toLowerCase().includes("success")) {
          json = {
            result: "ok",
            businessId: text.match(/[0-9a-f-]{8,}/)?.[0] || "pending",
          };
        } else {
          throw new Error("Server returned non-JSON response: " + text.slice(0, 200));
        }
      }

      if (!res.ok || json.result !== "ok") {
        throw new Error(json.message || "Server error");
      }

      // ✅ Success (Hybrid approval: no public link until approved)
      setStatus({
        done: true,
        error: "",
        businessId: json.businessId,
        bookingLink: json.bookingLink || "",
      });

      console.log("✅ Signup success:", json);
      localStorage.removeItem("catbackai_onboarding_draft");
    } catch (err) {
      console.error("❌ CatBackAI signup error:", err);
      setStatus({
        done: false,
        error: "Could not submit: " + err.message,
        businessId: "",
        bookingLink: "",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    if (status.bookingLink) {
      navigator.clipboard.writeText(status.bookingLink);
    } else if (status.businessId) {
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

          /* New: subtle progress bar */
          .progressOuter { width: 100%; height: 8px; background:#f1f1f1; border-radius:999px; overflow:hidden; }
          .progressInner { height: 100%; background: var(--brand); }

          /* New: FAQ accordion */
          details.faq { border:1px solid #eee; border-radius:12px; padding:12px 16px; background:#fff; }
          details.faq + details.faq { margin-top:12px; }
          details.faq summary { cursor:pointer; font-weight:800; color:#111; }

          /* New: floating chat bubble */
          .chatBubble { position: fixed; right: 20px; bottom: 20px; z-index: 999; }

        `}</style>
        {/* ✅ SEO/OG basics */}
        <title>CatBackAI — Bookings, Reminders & Follow‑ups</title>
        <meta
          name="description"
          content="Automate bookings, confirmations, reminders, and follow‑ups for service businesses with CatBackAI."
        />
        <meta property="og:title" content="CatBackAI" />
        <meta
          property="og:description"
          content="Smart bookings and reminders for service businesses."
        />
        <meta property="og:image" content={logo} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "CatBackAI",
          applicationCategory: "BusinessApplication",
          offers: { "@type": "Offer", price: "49", priceCurrency: "USD" },
        })}</script>
      </Helmet>

{/* DYNAMIC HEADER */}
<header id="site-header">
  <div className="logo">
    <img src={logo} alt="CatBackAI Logo" />
    <span className="brand-name">CatBackAI</span>
  </div>

  {/* Hamburger for mobile */}
  <button
    id="menu-toggle"
    onClick={() => document.body.classList.toggle("menu-open")}
    aria-label="Toggle menu"
  >
    ☰
  </button>

  {/* Desktop Navigation */}
  <nav className="main-nav">
    <a href="#who-we-are">Who We Are</a>
    <a href="#why-catbackai">Why CatBackAI</a>
    <a href="#features">Features</a>
    <a href="#reviews">Reviews</a>
    <a href="#pricing">Pricing</a>
    <a href="#faq">FAQ</a>
    <a href="#contact">Contact</a>
  </nav>

  {/* Slide-out mobile menu */}
  <div className="mobile-menu">
    <a href="#who-we-are" onClick={() => document.body.classList.remove("menu-open")}>Who We Are</a>
    <a href="#why-catbackai" onClick={() => document.body.classList.remove("menu-open")}>Why CatBackAI</a>
    <a href="#features" onClick={() => document.body.classList.remove("menu-open")}>Features</a>
    <a href="#reviews" onClick={() => document.body.classList.remove("menu-open")}>Reviews</a>
    <a href="#pricing" onClick={() => document.body.classList.remove("menu-open")}>Pricing</a>
    <a href="#faq" onClick={() => document.body.classList.remove("menu-open")}>FAQ</a>
    <a href="#contact" onClick={() => document.body.classList.remove("menu-open")}>Contact</a>

    <button
      onClick={() => {
        document.body.classList.remove("menu-open");
        navigate("/dashboard");
      }}
      className="mobile-login"
    >
      Log In
    </button>
  </div>

  {/* Desktop login button */}
  <div className="nav-right">
    <button className="login-btn" onClick={() => navigate("/dashboard")}>
      Log In
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
          <div className="badge" style={{ marginBottom: 12 }}>
            Built for service businesses
          </div>
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
            <a className="btnHero" href="#signup-form">
              Get Started
            </a>
          </div>
          <ul
            style={{ marginTop: 22, color: "#333", fontSize: 15, lineHeight: 1.8 }}
          >
            <li>24/7 self-serve booking</li>
            <li>Automatic confirmations, reminders, and follow-ups</li>
            <li>Simple setup, no code required</li>
          </ul>
        </div>

        {/* Right column: SIGNUP FORM */}
        <div>
          {status.done ? (
            <div style={card}>
              <h3 style={title}>✅ Signup Received</h3>
              <p style={muted}>
                <strong>Your Business ID:</strong> {status.businessId}
              </p>
              <p style={muted}>
                Your business is now <strong>pending approval</strong>. Once approved, you’ll
                automatically receive your unique booking link by email or SMS.
              </p>
              <p style={muted}>
                Keep this ID safe — it identifies your account for setup and support.
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
                {copied ? "Copied!" : "Copy Business ID"}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={card} id="signup-form">
              <h3 style={title}>Business Onboarding</h3>

              {/* ✅ New: inline progress bar */}
              <div
                className="progressOuter"
                aria-label="Form completion"
                title={`Completion: ${completionPct}%`}
              >
                <div
                  className="progressInner"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
              <p style={{ ...muted, marginTop: 6 }}>{completionPct}% complete</p>

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

              {/* ✅ Conditional field for 'Other' business type */}
              {formData.BusinessType === "Other" && (
                <>
                  <label style={label}>Please specify your business type</label>
                  <input
                    name="OtherBusinessType"
                    value={formData.OtherBusinessType || ""}
                    onChange={handleChange}
                    placeholder="e.g. Tattoo Artist, Landscaping, etc."
                    style={input}
                    required
                  />
                </>
              )}

              <label style={label}>Owner Full Name</label>
              <input
                name="OwnerName"
                value={formData.OwnerName}
                onChange={handleChange}
                required
                style={input}
              />

              <label style={label}>Business Name</label>
              <input
                name="BusinessName"
                value={formData.BusinessName}
                onChange={handleChange}
                required
                style={input}
              />

              <label style={label}>Business Email</label>
              <input
                type="email"
                name="BusinessEmail"
                value={formData.BusinessEmail}
                onChange={handleChange}
                required
                style={input}
              />

              <label style={label}>Business Phone Number</label>
              <input
                type="tel"
                name="BusinessPhoneNumber"
                value={formData.BusinessPhoneNumber}
                onChange={handleChange}
                required
                style={input}
              />
              <label style={label}>Requests / Notes</label>
              <textarea
                name="Notes"
                value={formData.Notes}
                onChange={handleChange}
                rows={3}
                style={textarea}
              />

              <label
                style={{ ...label, display: "flex", gap: 8, alignItems: "flex-start" }}
              >
                <input
                  type="checkbox"
                  name="Consent"
                  checked={formData.Consent}
                  onChange={handleChange}
                  required
                />
                <span style={muted}>
                  I acknowledge my clients may receive confirmations, reminders, and
                  follow-ups from CatBackAI with opt-out instructions (Reply STOP).
                </span>
              </label>

              {status.error && <div style={errorBox}>{status.error}</div>}
              <button
                type="submit"
                style={{ ...btn, opacity: submitting ? 0.7 : 1 }}
                disabled={submitting}
              >
                {submitting ? "Submitting…" : "Submit"}
              </button>
              {savedDraftAt && (
                <p style={{ ...muted, marginTop: 8 }}>Draft saved: {savedDraftAt}</p>
              )}
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
              Most businesses can be onboarded in minutes. You’ll get a business ID instantly and your booking link once approved.
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
            <div style={{ marginTop: 18 }}>
              <a className="btnPrimary" href="#signup-form">Start Free</a>
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
      <section id="features" className="container" style={{ padding: "60px", background: "#f9f9f9", borderRadius: 16 }}>
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
          {/* ✅ Added feature tiles */}
          <div style={card} className="hoverCard">
            <h3 style={title}>🔗 Easy Integration</h3>
            <p style={muted}>Works smoothly with Sheets / Apps Script-based workflows you already use.</p>
          </div>
          <div style={card} className="hoverCard">
            <h3 style={title}>🧠 AI Assist</h3>
            <p style={muted}>Smart prompts to help convert inquiries into confirmed bookings.</p>
          </div>
          <div style={card} className="hoverCard">
            <h3 style={title}>🔒 Consent & Compliance</h3>
            <p style={muted}>Built-in consent language and STOP instructions for peace of mind.</p>
          </div>
        </div>
      </section>

      {/* TRUST BAR / LOGOS */}
      <section className="container" style={{ padding: "10px 60px 0" }}>
        <div style={{ ...card, alignItems: "center" }} className="hoverCard">
          <p style={{ ...muted, margin: 0 }}>Trusted by solo operators & growing teams</p>
          <div
            style={{
              display: "flex",
              gap: 24,
              flexWrap: "wrap",
              marginTop: 8,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div className="badge">Detailers</div>
            <div className="badge">Barbers</div>
            <div className="badge">Nail Techs</div>
            <div className="badge">Fitness</div>
            <div className="badge">Home Services</div>
            <div className="badge">and more</div>
          </div>
        </div>
      </section>

      {/* REVIEWS SECTION */}
      <section id="reviews" className="container" style={{ padding: "60px 60px 20px" }}>
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
      <section id="pricing" className="container" style={{ padding: "20px 60px 20px" }}>
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

      {/* CTA STRIP */}
      <section className="container" style={{ padding: "30px 60px 60px" }}>
        <div style={{ ...card, alignItems: "center", textAlign: "center" }} className="hoverCard">
          <h3 style={{ ...title, fontSize: 22 }}>Ready to try CatBackAI?</h3>
          <p style={{ ...muted, marginTop: 8 }}>
            Create your booking link in minutes. No credit card required.
          </p>
          <a href="#signup-form" className="btnHero" style={{ marginTop: 12 }}>
            Create My Link
          </a>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="container" style={{ padding: "0 60px 60px" }}>
        <h2 className="sectionTitle">FAQ</h2>
        <details className="faq">
          <summary>Do I need any coding?</summary>
          <p style={muted}>
            No. Paste your info in the form and you’ll get a booking link automatically.
          </p>
        </details>
        <details className="faq">
          <summary>Can I use my own number/email?</summary>
          <p style={muted}>
            Yes. You can configure sending identity later. We also include opt-out language (Reply STOP).
          </p>
        </details>
        <details className="faq">
          <summary>Does this work for mobile-only businesses?</summary>
          <p style={muted}>Absolutely. Choose “Mobile” or “Both” under Location of Services.</p>
        </details>
        <details className="faq">
          <summary>Can I export my data?</summary>
          <p style={muted}>
            Your data lives in our database, so it’s already portable and exportable.
          </p>
        </details>
      </section>

      {/* CONTACT */}
      <section id="contact" className="container" style={{ padding: "0 60px 60px" }}>
        <h2 className="sectionTitle">Contact</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={{ ...card }} className="hoverCard">
            <h3 style={title}>Partnerships</h3>
            <p style={muted}>
              Interested in bringing CatBackAI to your industry? Let’s talk.
            </p>
            <button className="btnGhost" onClick={() => openChatbot("partnerships")}>
              Partner with us
            </button>
          </div>
        </div>
      </section>

      {/* LEGAL ANCHORS so the footer links work */}
      <section id="privacy" className="container" style={{ padding: "0 60px 20px" }}>
        <h2 className="sectionTitle">Privacy</h2>
        <p style={muted}>
          We only message your clients after they book and consent. You can request data export or deletion any time.
        </p>
      </section>
      <section id="terms" className="container" style={{ padding: "0 60px 40px" }}>
        <h2 className="sectionTitle">Terms</h2>
        <p style={muted}>
          Use CatBackAI responsibly. Messaging must include opt-out instructions. Don’t spam. That’s it.
        </p>
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
        <div
          className="container"
          style={{
            display: "flex",
            gap: 20,
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={logo} alt="CatBackAI" style={{ width: 28, height: 28 }} />
            <strong style={{ fontSize: 16 }}>CatBackAI</strong>
          </div>
          <div style={{ color: "#666", fontSize: 14 }}>
            © {new Date().getFullYear()} CatBackAI — All rights reserved.
          </div>
          <div style={{ display: "flex", gap: 14 }}>
            <a href="#privacy" style={{ color: "#444", textDecoration: "none" }}>
              Privacy
            </a>
            <a href="#terms" style={{ color: "#444", textDecoration: "none" }}>
              Terms
            </a>
            <button className="btnGhost" onClick={() => openChatbot("support")}>
              Support
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ---------- styles (kept original + extended) ---------- */
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
function useClientEnv() {
  const [env, setEnv] = useState({
    isTouch: false,
    isMobile: false,
    isIOS: false,
    isAndroid: false,
    isSafari: false,
    isChrome: false,
    isFirefox: false,
    isEdge: false,
    isDesktop: true,
  });

  useEffect(() => {
    const ua = navigator.userAgent || "";
    const vendor = navigator.vendor || "";
    const isTouch =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia("(pointer: coarse)").matches;

    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/.test(ua);

    const isSafari =
      /^Apple/.test(vendor) &&
      /Safari/.test(ua) &&
      !/CriOS|FxiOS|EdgiOS|Chrome|Chromium/.test(ua);

    const isChrome = /Chrome|Chromium|CriOS/.test(ua) && !/Edg/.test(ua);
    const isFirefox = /Firefox|FxiOS/.test(ua);
    const isEdge = /Edg|EdgiOS|EdgA/.test(ua);

    const isMobile =
      isTouch ||
      /Mobi|Android|iPhone|iPad|iPod/.test(ua) ||
      window.matchMedia("(max-width: 820px)").matches;

    const isDesktop = !isMobile;

    const flags = {
      isTouch,
      isMobile,
      isIOS,
      isAndroid,
      isSafari,
      isChrome,
      isFirefox,
      isEdge,
      isDesktop,
    };

    setEnv(flags);

    // expose as classes on <body> for CSS targeting
    const cls = [
      flags.isDesktop ? "env-desktop" : "env-mobile",
      flags.isIOS && "env-ios",
      flags.isAndroid && "env-android",
      flags.isSafari && "env-safari",
      flags.isChrome && "env-chrome",
      flags.isFirefox && "env-firefox",
      flags.isEdge && "env-edge",
      flags.isTouch && "env-touch",
    ]
      .filter(Boolean)
      .join(" ");

    document.body.classList.add(...cls.split(" "));
    return () => {
      cls.split(" ").forEach(c => document.body.classList.remove(c));
    };
  }, []);

  return env;
}

export default App;