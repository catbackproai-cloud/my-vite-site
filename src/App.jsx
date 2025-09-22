import { useState } from "react";
import { Helmet } from "react-helmet";
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
      {/* Inject HeroAI embed */}
      <Helmet>
        <style>{`
          #heroai-chat-btn{position:fixed;right:16px;bottom:16px;z-index:999999;background:#de8d2b;color:#fff;border:0;border-radius:999px;padding:12px 16px;font:700 14px/1.1 Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.18);cursor:pointer}
          #heroai-chat-panel{position:fixed;right:16px;bottom:64px;z-index:999998;width:min(420px,92vw);height:min(70vh,560px);background:#fff;border:1px solid #e8edff;border-radius:20px;overflow:hidden;box-shadow:0 22px 60px rgba(0,0,0,.25);margin-bottom:max(0px,env(safe-area-inset-bottom));display:none;box-sizing:border-box}
          #heroai-chat-iframe{width:100%;height:100%;border:0;display:block}
          .heroai-topbar{display:flex;align-items:center;gap:10px;padding:10px 12px;background:#fbf6e7;color:#fff;border-bottom:1px solid rgba(0,0,0,.06)}
          .heroai-topbar img{height:24px;display:block}
          .heroai-topbar .t{font:600 14px/1 Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
          .heroai-footer{padding:8px 10px;text-align:center;background:#fff;border-top:1px solid #eef2ff}
          .heroai-footer a{font:600 12px/1 Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#de8d2b;text-decoration:underline}
          @media (max-width:420px){#heroai-chat-panel{height:80vh;width:94vw;right:3vw;bottom:72px}}
        `}</style>

        <script type="text/javascript">{`
          (function(){
            var root = document.getElementById("heroai-chat-root") || document.body;

            // Launcher button (starts CLOSED)
            var b=document.createElement("button");
            b.id="heroai-chat-btn"; b.type="button"; b.textContent="Chat";
            b.setAttribute("aria-label","Open chat");

            // Panel
            var p=document.createElement("div");
            p.id="heroai-chat-panel"; p.setAttribute("role","dialog"); p.setAttribute("aria-label","Hero AI Chat");

            // Topbar
            var top=document.createElement("div"); top.className="heroai-topbar";
            var title=document.createElement("div"); title.className="t"; title.textContent="Cat Back AI";
            top.appendChild(title);

            // Iframe
            var f=document.createElement("iframe");
            f.id="heroai-chat-iframe"; f.title="Hero AI Assistant";
            f.loading="lazy"; f.referrerPolicy="no-referrer-when-downgrade";
            f.src="https://bot.heroai.pro/?ns=cat_back&hideLauncher=true";

            // Footer
            var foot=document.createElement("div"); foot.className="heroai-footer";
            var a=document.createElement("a"); a.href="https://heroai.pro"; a.target="_blank"; a.rel="noopener"; a.textContent="Powered with Hero";
            foot.appendChild(a);

            // Compose panel
            p.appendChild(top);
            p.appendChild(f);
            p.appendChild(foot);

            function open(){p.style.display="block"; b.textContent="Close"; b.setAttribute("aria-label","Close chat");}
            function close(){p.style.display="none";  b.textContent="Chat";  b.setAttribute("aria-label","Open chat");}
            function toggle(){(p.style.display==="block") ? close() : open();}

            b.addEventListener("click",toggle);
            window.addEventListener("keydown",function(e){ if(e.key==="Escape") close(); });

            root.appendChild(p);
            root.appendChild(b);
          })();
        `}</script>
      </Helmet>

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
              backgroundColor: "#de8d2b",
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
              style={{ color: "#de8d2b", textDecoration: "underline" }}
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
