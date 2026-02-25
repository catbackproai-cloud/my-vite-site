// src/LandingPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const STRIPE_PAYMENT_URL = "https://buy.stripe.com/8x2bJ14jB1QXbGkaS4gQE03";

const MEMBER_LS_KEY = "tc_member_v1";

// ✅ Login webhook (Member ID → verify in Google Sheet)
const LOGIN_WEBHOOK_URL =
  import.meta?.env?.VITE_N8N_TRADECOACH_LOGIN ||
  "https://jacobtf007.app.n8n.cloud/webhook/tradecoach_login";

// ✅ Pricing (single source of truth for all copy)
const PRICE_DISPLAY = "$19.99";
const BILLING_PERIOD = "monthly";
const PRICE_SHORT = `${PRICE_DISPLAY}/${BILLING_PERIOD}`;
const PRICE_CTA = `Get access for ${PRICE_SHORT}`;
const PRICE_CTA_LONG = `Get instant access for ${PRICE_SHORT} →`;
const PRICE_BUTTON = `Subscribe for ${PRICE_SHORT} →`;

function saveMemberToLocal(partial) {
  const base = {
    memberId: "",
    email: "",
    name: "",
    plan: "personal",
    createdAt: new Date().toISOString(),
  };

  const payload = { ...base, ...partial };

  try {
    localStorage.setItem(MEMBER_LS_KEY, JSON.stringify(payload));
  } catch (err) {
    console.error("Failed to save member to localStorage", err);
  }
}

export default function LandingPage({ onEnterApp }) {
  const navigate = useNavigate();

  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [memberId, setMemberId] = useState("");
  const [checkoutAgreed, setCheckoutAgreed] = useState(false);

  const [showMemberPortal, setShowMemberPortal] = useState(false);
  const [memberPortalId, setMemberPortalId] = useState("");
  const [memberPortalError, setMemberPortalError] = useState("");
  const [memberPortalLoading, setMemberPortalLoading] = useState(false);

  const [openFaq, setOpenFaq] = useState(null);

  // legal modals
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  // show success banner if coming back from Stripe redirect
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("checkout") === "success") {
        setCheckoutSuccess(true);
      }
    } catch (err) {
      console.error("Failed to parse query params", err);
    }
  }, []);

  const styles = {
    page: {
      minHeight: "100vh",
      background: "#020617",
      color: "#e5e7eb",
      fontFamily:
        '-apple-system, BlinkMacSystemFont, system-ui, -system-ui, "SF Pro Text", sans-serif',
      display: "flex",
      flexDirection: "column",
      width: "100%",
      maxWidth: "100%",
      overflowX: "hidden",
    },

    // TOP RIBBON + NAV
    ribbon: {
      background: "#020617",
      borderBottom: "1px solid rgba(34,211,238,0.35)",
      padding: "6px 16px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      fontSize: 12,
      color: "#f9fafb",
    },
    ribbonInner: {
      maxWidth: 1100,
      width: "100%",
      display: "flex",
      justifyContent: "space-between",
      gap: 12,
      alignItems: "center",
    },
    ribbonText: {
      opacity: 0.85,
    },
    ribbonStrong: {
      fontWeight: 700,
      color: "#22d3ee",
    },
    ribbonBtn: {
      borderRadius: 999,
      border: "none",
      padding: "6px 14px",
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer",
      background:
        "linear-gradient(135deg, #22d3ee, #0ea5e9, #0369a1 90%, #0f172a)",
      color: "#020617",
      boxShadow: "0 10px 30px rgba(15,23,42,0.85)",
      whiteSpace: "nowrap",
    },

    nav: {
      padding: "14px 16px 10px",
      display: "flex",
      justifyContent: "center",
      borderBottom: "1px solid rgba(15,23,42,0.9)",
      background:
        "radial-gradient(circle at top, #0f172a 0, #020617 55%, #020617 100%)",
      position: "sticky",
      top: 0,
      zIndex: 40,
      backdropFilter: "blur(18px)",
    },
    navInner: {
      maxWidth: 1100,
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    logoRow: {
      display: "flex",
      alignItems: "center",
      gap: 8,
    },
    logoMark: {
      width: 28,
      height: 28,
      borderRadius: 999,
      background:
        "conic-gradient(from 220deg, #22d3ee, #a5f3fc, #22d3ee, #0f172a)",
      boxShadow:
        "0 0 0 1px rgba(15,23,42,0.9), 0 0 20px rgba(34,211,238,0.55)",
    },
    logoTitle: {
      fontSize: 16,
      fontWeight: 800,
      letterSpacing: 0.1,
    },
    logoSub: {
      fontSize: 11,
      opacity: 0.7,
    },
    navRight: {
      display: "flex",
      gap: 12,
      alignItems: "center",
      fontSize: 12,
    },
    navPill: {
      padding: "4px 10px",
      borderRadius: 999,
      border: "1px solid rgba(51,65,85,0.9)",
      background: "rgba(15,23,42,0.9)",
      opacity: 0.9,
      whiteSpace: "nowrap",
    },
    navLink: {
      fontSize: 12,
      opacity: 0.8,
      cursor: "pointer",
      borderBottom: "1px solid transparent",
    },

    // GENERAL LAYOUT
    section: {
      padding: "40px 16px",
      display: "flex",
      justifyContent: "center",
    },
    sectionInner: {
      maxWidth: 1100,
      width: "100%",
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    },

    // HERO
    hero: {
      padding: "56px 16px 46px",
      background:
        "radial-gradient(circle at top, #0f172a 0%, #020617 45%, #020617 100%)",
      display: "flex",
      justifyContent: "center",
    },
    heroInner: {
      maxWidth: 1100,
      width: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      gap: 18,
    },
    heroEyebrow: {
      fontSize: 12,
      letterSpacing: 0.16,
      textTransform: "uppercase",
      opacity: 0.8,
      color: "#38bdf8",
    },
    heroHeadline: {
      fontSize: 38,
      lineHeight: 1.1,
      fontWeight: 900,
      maxWidth: 760,
      margin: 0,
    },
    heroHighlight: {
      color: "#22d3ee",
    },
    heroSub: {
      maxWidth: 640,
      fontSize: 14,
      opacity: 0.86,
      lineHeight: 1.55,
      margin: 0,
    },
    heroBtnRow: {
      display: "flex",
      flexWrap: "wrap",
      gap: 10,
      justifyContent: "center",
      marginTop: 6,
    },
    heroPrimaryBtn: {
      borderRadius: 999,
      border: "none",
      padding: "11px 22px",
      fontSize: 14,
      fontWeight: 800,
      cursor: "pointer",
      background:
        "linear-gradient(135deg, #22d3ee, #0ea5e9, #0284c7 90%, #0f172a)",
      color: "#020617",
      boxShadow:
        "0 18px 45px rgba(15,23,42,0.9), 0 0 20px rgba(34,211,238,0.55)",
      display: "flex",
      alignItems: "center",
      gap: 8,
    },
    heroSecondaryBtn: {
      borderRadius: 999,
      border: "1px solid rgba(148,163,184,0.9)",
      padding: "10px 18px",
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer",
      background: "rgba(15,23,42,0.95)",
      color: "#e5e7eb",
      display: "flex",
      alignItems: "center",
      gap: 6,
    },

    // LOGOS STRIP
    logosRow: {
      marginTop: 12,
      padding: "14px 0 2px",
      borderTop: "1px solid rgba(15,23,42,0.9)",
      borderBottom: "1px solid rgba(15,23,42,0.9)",
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 12,
      opacity: 0.9,
      fontSize: 11,
    },
    logoBadge: {
      padding: "6px 12px",
      borderRadius: 999,
      border: "1px solid rgba(51,65,85,0.9)",
      background:
        "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(8,47,73,0.95))",
    },

    // TITLES
    sectionTitle: {
      fontSize: 24,
      fontWeight: 900,
      marginBottom: 8,
      marginTop: 0,
    },
    sectionEyebrow: {
      fontSize: 11,
      letterSpacing: 0.16,
      textTransform: "uppercase",
      opacity: 0.8,
      color: "#38bdf8",
      marginBottom: 4,
    },
    sectionSub: {
      fontSize: 13,
      opacity: 0.78,
      maxWidth: 560,
      lineHeight: 1.6,
      marginTop: 0,
    },

    // CHECKLIST / WHAT YOU GET
    checklistGrid: {
      marginTop: 18,
      display: "flex",
      flexWrap: "wrap",
      gap: 16,
      justifyContent: "center",
      width: "100%",
    },
    checklistCol: {
      flex: "1 1 340px",
      minWidth: 280,
      borderRadius: 20,
      padding: 18,
      background: "rgba(15,23,42,0.97)",
      border: "1px solid rgba(30,64,175,0.8)",
      boxShadow: "0 18px 45px rgba(15,23,42,0.9)",
      textAlign: "left",
    },
    checklistTitle: {
      fontSize: 15,
      fontWeight: 900,
      marginBottom: 12,
      letterSpacing: 0.2,
    },

    // ✅ Cleaner comparison table
    compareHeaderRow: {
      display: "grid",
      gridTemplateColumns: "1fr 120px 120px",
      gap: 10,
      alignItems: "center",
      padding: "10px 12px",
      borderRadius: 14,
      background: "rgba(2,6,23,0.5)",
      border: "1px solid rgba(51,65,85,0.75)",
      marginBottom: 10,
    },
    compareHeaderLabel: {
      fontSize: 11,
      opacity: 0.8,
      textTransform: "uppercase",
      letterSpacing: 0.14,
      fontWeight: 800,
    },
    compareHeaderCol: {
      fontSize: 11,
      opacity: 0.9,
      fontWeight: 900,
      textAlign: "center",
    },
    compareRow: {
      display: "grid",
      gridTemplateColumns: "1fr 120px 120px",
      gap: 10,
      alignItems: "center",
      padding: "10px 12px",
      borderRadius: 14,
      background: "rgba(15,23,42,0.75)",
      border: "1px solid rgba(30,64,175,0.55)",
      marginBottom: 8,
    },
    compareLabel: {
      fontSize: 12,
      opacity: 0.9,
      lineHeight: 1.35,
      fontWeight: 600,
    },
    badgeYes: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      height: 26,
      borderRadius: 999,
      padding: "0 10px",
      fontSize: 12,
      fontWeight: 900,
      color: "#052e1a",
      background: "rgba(34,197,94,0.9)",
      border: "1px solid rgba(34,197,94,0.55)",
      boxShadow: "0 10px 24px rgba(15,23,42,0.55)",
    },
    badgeNo: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      height: 26,
      borderRadius: 999,
      padding: "0 10px",
      fontSize: 12,
      fontWeight: 900,
      color: "#fff1f2",
      background: "rgba(244,63,94,0.18)",
      border: "1px solid rgba(244,63,94,0.45)",
    },

    // FAQ
    faqList: {
      marginTop: 18,
      display: "flex",
      flexDirection: "column",
      gap: 10,
      alignItems: "center",
      width: "100%",
    },
    faqItem: {
      borderRadius: 14,
      overflow: "hidden",
      border: "1px solid rgba(30,64,175,0.8)",
      background:
        "linear-gradient(135deg, #0b1120, #0f172a, #0b1120 90%, #020617)",
      width: "100%",
      maxWidth: 680,
      textAlign: "left",
    },
    faqHeader: {
      padding: "10px 14px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      cursor: "pointer",
      fontSize: 13,
      fontWeight: 600,
    },
    faqIcon: {
      fontSize: 18,
      fontWeight: 700,
      marginLeft: 8,
    },
    faqBody: {
      padding: "0 14px 10px",
      fontSize: 12,
      background: "rgba(15,23,42,0.96)",
      borderTop: "1px solid rgba(30,64,175,0.7)",
    },

    // FINAL CTA
    finalCard: {
      marginTop: 18,
      borderRadius: 24,
      padding: "22px 18px 24px",
      background: "rgba(15,23,42,0.98)",
      border: "1px solid rgba(30,64,175,0.9)",
      textAlign: "center",
      boxShadow: "0 24px 70px rgba(15,23,42,0.95)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      width: "100%",
      maxWidth: 900,
    },
    finalHeadline: {
      fontSize: 22,
      fontWeight: 900,
      marginBottom: 8,
      marginTop: 0,
    },
    finalSub: {
      fontSize: 13,
      opacity: 0.86,
      maxWidth: 560,
      margin: "0 auto 14px",
      lineHeight: 1.6,
    },

    // FOOTER
    footer: {
      borderTop: "1px solid rgba(15,23,42,0.9)",
      padding: "18px 16px 22px",
      display: "flex",
      justifyContent: "center",
      fontSize: 11,
      color: "#9ca3af",
    },
    footerInner: {
      maxWidth: 1100,
      width: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 10,
      textAlign: "center",
    },
    footerLinks: {
      display: "flex",
      gap: 14,
      flexWrap: "wrap",
      justifyContent: "center",
    },
    footerLink: {
      cursor: "pointer",
      textDecoration: "underline",
      textDecorationStyle: "dotted",
    },

    // ✅ P&L CALENDAR STYLES
    pnlGridWrap: {
      width: "100%",
      maxWidth: 940,
      marginTop: 18,
      borderRadius: 22,
      background: "rgba(15,23,42,0.97)",
      border: "1px solid rgba(30,64,175,0.85)",
      boxShadow: "0 18px 45px rgba(15,23,42,0.9)",
      padding: 16,
      boxSizing: "border-box",
      textAlign: "left",
    },
    pnlTopRow: {
      display: "flex",
      flexWrap: "wrap",
      gap: 14,
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    pnlSummaryRow: {
      marginTop: 14,
      display: "flex",
      flexWrap: "wrap",
      gap: 12,
      justifyContent: "center",
    },
    pnlSummaryCard: {
      flex: "1 1 220px",
      minWidth: 210,
      borderRadius: 18,
      padding: 14,
      background:
        "linear-gradient(135deg, rgba(2,6,23,0.85), rgba(15,23,42,0.95))",
      border: "1px solid rgba(51,65,85,0.85)",
      boxShadow: "0 12px 30px rgba(15,23,42,0.8)",
    },
    pnlSummaryLabel: {
      fontSize: 11,
      opacity: 0.8,
      textTransform: "uppercase",
      letterSpacing: 0.14,
    },
    pnlSummaryValue: {
      marginTop: 6,
      fontSize: 20,
      fontWeight: 950,
      color: "#e5e7eb",
    },
    pnlSummarySub: {
      marginTop: 6,
      fontSize: 11,
      opacity: 0.78,
      lineHeight: 1.4,
    },
    pnlDow: {
      fontSize: 11,
      opacity: 0.85,
      textAlign: "center",
      padding: "6px 0",
      borderRadius: 10,
      border: "1px solid rgba(30,64,175,0.55)",
      background: "rgba(2,6,23,0.55)",
    },
    pnlCalendar: {
      display: "grid",
      gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
      gap: 8,
    },
    pnlCell: (tone) => {
      let bg = "rgba(2,6,23,0.6)";
      let border = "1px solid rgba(30,64,175,0.55)";

      if (tone === "pos") {
        bg =
          "linear-gradient(135deg, rgba(34,197,94,0.22), rgba(2,6,23,0.65))";
        border = "1px solid rgba(34,197,94,0.45)";
      } else if (tone === "neg") {
        bg =
          "linear-gradient(135deg, rgba(244,63,94,0.22), rgba(2,6,23,0.65))";
        border = "1px solid rgba(244,63,94,0.45)";
      } else if (tone === "flat") {
        bg =
          "linear-gradient(135deg, rgba(56,189,248,0.18), rgba(2,6,23,0.65))";
        border = "1px solid rgba(56,189,248,0.4)";
      } else if (tone === "off") {
        bg = "rgba(2,6,23,0.35)";
        border = "1px dashed rgba(51,65,85,0.65)";
      }

      return {
        borderRadius: 16,
        padding: 10,
        minHeight: 78,
        background: bg,
        border,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      };
    },
    pnlCellDay: {
      fontSize: 11,
      opacity: 0.78,
      fontWeight: 800,
    },
    pnlCellValue: {
      fontSize: 14,
      fontWeight: 950,
      letterSpacing: 0.1,
    },
    pnlCellRR: {
      marginTop: 2,
      fontSize: 11,
      opacity: 0.82,
    },

    // MODALS
    overlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      zIndex: 80,
      boxSizing: "border-box",
    },
    modalCard: {
      width: "100%",
      maxWidth: 420,
      background: "#020617",
      borderRadius: 18,
      border: "1px solid rgba(30,64,175,0.9)",
      boxShadow: "0 24px 70px rgba(15,23,42,0.95)",
      padding: 20,
      fontSize: 13,
      boxSizing: "border-box",
      color: "#e5e7eb",
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 800,
      marginBottom: 6,
      textAlign: "center",
    },
    modalText: {
      fontSize: 12,
      opacity: 0.8,
      marginBottom: 12,
      textAlign: "center",
      lineHeight: 1.5,
    },
    modalButtonPrimary: {
      width: "100%",
      borderRadius: 10,
      border: "none",
      padding: "9px 12px",
      fontSize: 13,
      fontWeight: 700,
      background:
        "linear-gradient(130deg, #22d3ee, #0ea5e9, #0284c7 90%, #0f172a)",
      color: "#020617",
      cursor: "pointer",
      marginTop: 4,
    },
    modalButtonSecondary: {
      width: "100%",
      borderRadius: 10,
      border: "1px solid rgba(30,64,175,0.9)",
      padding: "8px 12px",
      fontSize: 12,
      fontWeight: 500,
      background: "transparent",
      color: "#e5e7eb",
      cursor: "pointer",
      marginTop: 8,
    },
    modalError: {
      fontSize: 11,
      color: "#fecaca",
      marginTop: 6,
      textAlign: "center",
      lineHeight: 1.4,
    },
    idBox: {
      marginTop: 10,
      padding: 10,
      borderRadius: 10,
      background: "#020617",
      border: "1px dashed rgba(30,64,175,0.9)",
      fontSize: 12,
      textAlign: "center",
      wordBreak: "break-all",
    },
    idLabel: {
      fontWeight: 700,
      marginBottom: 4,
      display: "block",
    },
    idValue: {
      fontFamily: "monospace",
      fontSize: 13,
      color: "#22d3ee",
    },
    idHint: {
      marginTop: 6,
      fontSize: 11,
      opacity: 0.8,
      lineHeight: 1.4,
    },

    // Legal modal body
    legalBody: {
      maxHeight: "60vh",
      overflowY: "auto",
      fontSize: 12,
      lineHeight: 1.5,
      textAlign: "left",
      marginTop: 8,
      paddingRight: 4,
    },
    legalHeading: {
      fontWeight: 700,
      marginTop: 8,
      marginBottom: 4,
      fontSize: 13,
    },

    // Terms checkbox
    checkboxRow: {
      display: "flex",
      alignItems: "flex-start",
      gap: 8,
      marginTop: 6,
      marginBottom: 4,
      fontSize: 11,
      lineHeight: 1.4,
      textAlign: "left",
    },
    checkboxInput: {
      marginTop: 2,
    },
    checkboxLabel: {
      opacity: 0.9,
    },
    checkboxLink: {
      color: "#22d3ee",
      textDecoration: "underline",
      textDecorationStyle: "dotted",
      cursor: "pointer",
    },
  };

  function openWorkspace() {
    if (onEnterApp) {
      onEnterApp();
    } else {
      navigate("/workspace");
    }
  }

  async function handleCheckoutSubmit(e) {
    e.preventDefault();
    setCheckoutError("");

    if (!checkoutAgreed) {
      setCheckoutError(
        "Please confirm that you've read and agree to the Terms of Use and Privacy Policy before continuing."
      );
      return;
    }

    try {
      setCheckoutLoading(true);

      // keep any prior local member info (no name/email collected here)
      saveMemberToLocal({ plan: "personal" });

      // 🚀 send user directly to Stripe Payment Link (subscription)
      window.location.href = STRIPE_PAYMENT_URL;
    } catch (err) {
      console.error(err);
      setCheckoutError("Something went wrong redirecting to Stripe.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  // ✅ MEMBER ID LOGIN (validated by n8n + Google Sheets)
  async function handleMemberPortalSubmit(e) {
    e.preventDefault();
    setMemberPortalError("");

    const trimmed = memberPortalId.trim();
    if (!trimmed) {
      setMemberPortalError("Please enter your Member ID.");
      return;
    }

    try {
      setMemberPortalLoading(true);

      const res = await fetch(LOGIN_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: trimmed }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setMemberPortalError(
          data?.error || "Member ID not found. Please check and try again."
        );
        return;
      }

      // ✅ Save EXACT member returned by sheet (prevents wrong account login)
      const m = data.member || {};
      saveMemberToLocal({
        memberId: (m.memberId || trimmed).toString().trim(),
        email: (m.email || "").toString().trim(),
        name: (m.name || "").toString().trim(),
        plan: (m.plan || "personal").toString().trim() || "personal",
      });

      openWorkspace();
    } catch (err) {
      console.error(err);
      setMemberPortalError("Login failed. Please try again in a moment.");
    } finally {
      setMemberPortalLoading(false);
    }
  }

  const faqs = [
    {
      q: "What exactly do I get when I join MaxTradeAI?",
      a: "You get a private portal where you upload trade screenshots, explain your thought process, and receive structured AI feedback plus a built-in daily journal view for every session.",
    },
    {
      q: "Do I need to be an advanced trader for this to help?",
      a: "No. The app is built for serious beginners and intermediate traders who want to practice ICT/liquidity concepts with feedback every day.",
    },
    {
      q: "How many trades can I submit?",
      a: "You can submit as many screenshots and journal entries as you want within your personal workspace.",
    },
    {
      q: "Does the AI understand BOS / CHoCH / FVG / liquidity?",
      a: "Yes. The prompts and training are built specifically around those concepts so it can talk in your language, not generic indicator spam.",
    },
  ];

  // ✅ P&L CALENDAR (Sundays blank, Sunday trades moved to Fridays)
  // Layout per week: Sun(off), Mon, Tue, Wed, Thu, Fri(includes moved Sunday), Sat(off)
  const pnlCells = [
    // Week 1
    { tone: "off", day: "", v: "—", rr: "" }, // Sun
    { tone: "pos", day: "Day 1", v: "+$210", rr: "1.8R" }, // Mon
    { tone: "neg", day: "Day 2", v: "-$95", rr: "0.7R" }, // Tue
    { tone: "flat", day: "Day 3", v: "$0", rr: "—" }, // Wed
    { tone: "pos", day: "Day 4", v: "+$140", rr: "1.5R" }, // Thu
    { tone: "pos", day: "Day 5", v: "+$85", rr: "1.2R" }, // Fri (moved Sunday → Friday)
    { tone: "off", day: "", v: "—", rr: "" }, // Sat

    // Week 2
    { tone: "off", day: "", v: "—", rr: "" }, // Sun
    { tone: "neg", day: "Day 8", v: "-$60", rr: "0.9R" }, // Mon
    { tone: "pos", day: "Day 9", v: "+$330", rr: "2.2R" }, // Tue
    { tone: "flat", day: "Day 10", v: "$0", rr: "—" }, // Wed
    { tone: "neg", day: "Day 11", v: "-$120", rr: "0.6R" }, // Thu
    { tone: "pos", day: "Day 12", v: "+$260", rr: "1.9R" }, // Fri (moved Sunday → Friday)
    { tone: "off", day: "", v: "—", rr: "" }, // Sat

    // Week 3
    { tone: "off", day: "", v: "—", rr: "" }, // Sun
    { tone: "pos", day: "Day 15", v: "+$110", rr: "1.4R" }, // Mon
    { tone: "neg", day: "Day 16", v: "-$70", rr: "0.8R" }, // Tue
    { tone: "pos", day: "Day 17", v: "+$180", rr: "1.6R" }, // Wed
    { tone: "pos", day: "Day 18", v: "+$95", rr: "1.1R" }, // Thu
    { tone: "pos", day: "Day 19", v: "+$220", rr: "1.7R" }, // Fri (moved Sunday → Friday)
    { tone: "off", day: "", v: "—", rr: "" }, // Sat

    // Week 4
    { tone: "off", day: "", v: "—", rr: "" }, // Sun
    { tone: "flat", day: "Day 22", v: "$0", rr: "—" }, // Mon
    { tone: "neg", day: "Day 23", v: "-$130", rr: "0.7R" }, // Tue
    { tone: "pos", day: "Day 24", v: "+$145", rr: "1.3R" }, // Wed
    { tone: "pos", day: "Day 25", v: "+$305", rr: "2.0R" }, // Thu
    { tone: "pos", day: "Day 26", v: "+$125", rr: "1.2R" }, // Fri (moved Sunday → Friday)
    { tone: "off", day: "", v: "—", rr: "" }, // Sat
  ];

  const compareRows = [
    { label: "Trade screenshot review (not generic chat)", mt: true, other: false },
    { label: "Structured daily journal tied to sessions", mt: true, other: false },
    { label: "Speaks BOS / CHoCH / FVG / liquidity", mt: true, other: false },
    { label: "Everything stays in one private portal", mt: true, other: false },
  ];

  return (
    <>
      <div style={styles.page}>
        {/* TOP RIBBON */}
        <div style={styles.ribbon}>
          <div style={styles.ribbonInner}>
            <span style={styles.ribbonText}>
              <span style={styles.ribbonStrong}>Monthly access · {PRICE_SHORT}</span>{" "}
              for your private portal.
            </span>
            <button
              style={styles.ribbonBtn}
              onClick={() => {
                setCheckoutError("");
                setMemberId("");
                setCheckoutAgreed(false);
                setShowCheckout(true);
              }}
            >
              {PRICE_CTA}
            </button>
          </div>
        </div>

        {/* NAV */}
        <div style={styles.nav}>
          <div style={styles.navInner}>
            <div style={styles.logoRow}>
              <div style={styles.logoMark} />
              <div>
                <div style={styles.logoTitle}>MaxTradeAI</div>
                <div style={styles.logoSub}>AI trade review · liquidity &amp; ICT focused</div>
              </div>
            </div>
            <div style={styles.navRight}>
              <span style={styles.navPill}>Built for ICT traders</span>
              <span
                style={styles.navLink}
                onClick={() => {
                  let existingId = "";
                  try {
                    const raw = localStorage.getItem(MEMBER_LS_KEY);
                    if (raw) {
                      const parsed = JSON.parse(raw);
                      existingId = parsed.memberId || "";
                    }
                  } catch {
                    // ignore
                  }
                  setMemberPortalId(existingId);
                  setMemberPortalError("");
                  setShowMemberPortal(true);
                }}
              >
                Already have a Member ID?
              </span>
            </div>
          </div>
        </div>

        {/* SUCCESS BANNER AFTER STRIPE REDIRECT */}
        {checkoutSuccess && (
          <div
            style={{
              background: "#022c22",
              borderBottom: "1px solid #16a34a",
              color: "#bbf7d0",
              padding: "10px 16px",
              textAlign: "center",
              fontSize: 12,
            }}
          >
            Subscription confirmed ✅ Check your email for your MaxTradeAI Member ID, then click
            &quot;Enter Member ID&quot; to open your portal.
          </div>
        )}

        {/* HERO */}
        <section style={styles.hero}>
          <div style={styles.heroInner}>
            <div style={styles.heroEyebrow}>Real feedback, not hype</div>

            <h1 style={styles.heroHeadline}>
              Turn every screenshot into{" "}
              <span style={styles.heroHighlight}>a trade you actually learn from.</span>
            </h1>

            <p style={styles.heroSub}>
              Upload a chart screenshot, write what you were thinking, and get a clean,
              ICT-aware review you can improve from.
            </p>

            <div style={styles.heroBtnRow}>
              <button
                style={styles.heroPrimaryBtn}
                onClick={() => {
                  setCheckoutError("");
                  setMemberId("");
                  setCheckoutAgreed(false);
                  setShowCheckout(true);
                }}
              >
                {PRICE_CTA_LONG}
              </button>

              <button
                style={styles.heroSecondaryBtn}
                onClick={() => {
                  let existingId = "";
                  try {
                    const raw = localStorage.getItem(MEMBER_LS_KEY);
                    if (raw) {
                      const parsed = JSON.parse(raw);
                      existingId = parsed.memberId || "";
                    }
                  } catch {
                    // ignore
                  }
                  setMemberPortalId(existingId);
                  setMemberPortalError("");
                  setShowMemberPortal(true);
                }}
              >
                Enter Member ID
              </button>
            </div>

            {/* logos strip */}
            <div style={styles.logosRow}>
              <span style={styles.logoBadge}>NASDAQ / S&amp;P / US30</span>
              <span style={styles.logoBadge}>GBP/USD · EUR/USD · XAU/USD</span>
              <span style={styles.logoBadge}>Crypto pairs</span>
              <span style={styles.logoBadge}>ICT / liquidity concepts</span>
            </div>
          </div>
        </section>

        {/* AI REPORT PREVIEW (kept) */}
        <section style={styles.section}>
          <div style={styles.sectionInner}>
            <div style={styles.sectionEyebrow}>How it looks</div>
            <h2 style={styles.sectionTitle}>A clean, structured report for each trade.</h2>
            <p style={styles.sectionSub}>
              Clear wins, clear mistakes, and clear next steps — so you know exactly what to fix.
            </p>

            {/* simple preview card (same idea, lighter code) */}
            <div
              style={{
                marginTop: 18,
                maxWidth: 520,
                width: "100%",
                borderRadius: 22,
                background: "#0e1016",
                border: "1px solid rgba(148,163,184,0.55)",
                padding: 18,
                boxShadow: "0 18px 45px rgba(15,23,42,0.9)",
                textAlign: "left",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#f9fafb" }}>
                    Trade Coach AI
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
                    Gold Futures · 5m
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                    Confidence: 75%
                  </div>
                </div>
                <div
                  style={{
                    height: 36,
                    width: 36,
                    borderRadius: 999,
                    background: "#facc15",
                    color: "#020617",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    fontSize: 16,
                    boxShadow: "0 10px 30px rgba(0,0,0,0.7)",
                  }}
                >
                  A-F
                </div>
              </div>

              {[
                { title: "What went right", bars: ["78%", "58%"] },
                { title: "What went wrong", bars: ["82%", "68%", "46%"] },
                { title: "Improvements", bars: ["74%", "60%"] },
                { title: "Lesson learned", bars: ["70%"] },
              ].map((sec) => (
                <div key={sec.title} style={{ marginTop: 14 }}>
                  <div
                    style={{
                      fontSize: 10,
                      textTransform: "uppercase",
                      letterSpacing: 0.16,
                      color: "#cbd5f5",
                      fontWeight: 800,
                    }}
                  >
                    {sec.title}
                  </div>
                  <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                    {sec.bars.map((w, i) => (
                      <div
                        key={i}
                        style={{
                          height: 8,
                          borderRadius: 999,
                          background: "rgba(148,163,184,0.22)",
                          width: w,
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 14, fontSize: 10, color: "#6b7280", textAlign: "right" }}>
                Example preview — real reports include full text.
              </div>
            </div>
          </div>
        </section>

        {/* ✅ P&L CALENDAR (fixed Sundays → Fridays) */}
        <section style={styles.section}>
          <div style={styles.sectionInner}>
            <div style={styles.sectionEyebrow}>Track performance</div>
            <h2 style={styles.sectionTitle}>The P&amp;L calendar shows the truth.</h2>
            <p style={styles.sectionSub}>
              Log <strong>profit/loss</strong> and <strong>risk-to-reward</strong> daily, then spot
              patterns instantly.
            </p>

            <div style={styles.pnlGridWrap}>
              <div style={styles.pnlTopRow}>
                <div>
                  <div style={{ fontWeight: 950, fontSize: 14 }}>Your month at a glance</div>
                  <div style={{ fontSize: 12, opacity: 0.82, marginTop: 3, lineHeight: 1.45 }}>
                    Green = profitable. Red = losing. Blue = break-even. Weekends stay blank.
                  </div>
                </div>
                <div style={{ fontSize: 12, opacity: 0.85 }}>
                  <span style={{ color: "#22d3ee", fontWeight: 950 }}>Tip:</span> Solid R:R but
                  negative P&amp;L usually means entries/invalidations need work. Low R:R usually
                  means trade management is the leak.
                </div>
              </div>

              <div style={styles.pnlSummaryRow}>
                <div style={styles.pnlSummaryCard}>
                  <div style={styles.pnlSummaryLabel}>Total P&amp;L (month)</div>
                  <div style={styles.pnlSummaryValue}>+$1,055</div>
                  <div style={styles.pnlSummarySub}>Auto-calculated from your daily entries.</div>
                </div>
                <div style={styles.pnlSummaryCard}>
                  <div style={styles.pnlSummaryLabel}>Avg R:R</div>
                  <div style={styles.pnlSummaryValue}>1.7R</div>
                  <div style={styles.pnlSummarySub}>
                    Catch “small win / big loss” behavior early.
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                    gap: 8,
                    marginBottom: 6,
                  }}
                >
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <div key={d} style={styles.pnlDow}>
                      {d}
                    </div>
                  ))}
                </div>

                <div style={styles.pnlCalendar}>
                  {pnlCells.map((c, idx) => (
                    <div key={idx} style={styles.pnlCell(c.tone)}>
                      <div style={styles.pnlCellDay}>{c.day || ""}</div>
                      <div>
                        <div style={styles.pnlCellValue}>{c.v}</div>
                        <div style={styles.pnlCellRR}>{c.rr}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 12, fontSize: 12, opacity: 0.85, lineHeight: 1.55 }}>
                  <strong>How you’ll use it:</strong> after trading, enter your day’s result and
                  R:R, then compare it to your screenshot + journal.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WHAT YOU GET / CLEANER COMPARISON */}
        <section style={styles.section}>
          <div style={styles.sectionInner}>
            <div style={styles.sectionEyebrow}>Inside your portal</div>
            <h2 style={styles.sectionTitle}>Everything you need — in one place.</h2>
            <p style={styles.sectionSub}>
              Upload, review, journal, track. Simple workflow. Clear improvement.
            </p>

            <div style={styles.checklistGrid}>
              <div style={styles.checklistCol}>
                <div style={styles.checklistTitle}>What you get</div>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, lineHeight: 1.7 }}>
                  <li>AI feedback that grades every trade you upload.</li>
                  <li>Clear breakdown of what you did well vs. what you missed.</li>
                  <li>Actionable “next time” improvements to practice.</li>
                  <li>Built-in daily journal for psychology, discipline, and rules.</li>
                  <li>Private Member ID workspace tied to your trades.</li>
                </ul>
              </div>

              <div style={styles.checklistCol}>
                <div style={styles.checklistTitle}>Comparison</div>

                <div style={styles.compareHeaderRow}>
                  <div style={styles.compareHeaderLabel}>Feature</div>
                  <div style={styles.compareHeaderCol}>MaxTradeAI</div>
                  <div style={styles.compareHeaderCol}>Others</div>
                </div>

                {compareRows.map((r) => (
                  <div key={r.label} style={styles.compareRow}>
                    <div style={styles.compareLabel}>{r.label}</div>
                    <div style={{ textAlign: "center" }}>
                      <span style={styles.badgeYes}>{r.mt ? "✓" : "—"}</span>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <span style={r.other ? styles.badgeYes : styles.badgeNo}>
                        {r.other ? "✓" : "✕"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ (kept) */}
        <section style={styles.section}>
          <div style={styles.sectionInner}>
            <div style={styles.sectionEyebrow}>FAQs</div>
            <h2 style={styles.sectionTitle}>Get answers before you start.</h2>
            <p style={styles.sectionSub}>
              Quick answers to the most common questions before subscribing.
            </p>

            <div style={styles.faqList}>
              {faqs.map((item, idx) => {
                const open = openFaq === idx;
                return (
                  <div key={idx} style={styles.faqItem}>
                    <div
                      style={styles.faqHeader}
                      onClick={() => setOpenFaq((prev) => (prev === idx ? null : idx))}
                    >
                      <span>{item.q}</span>
                      <span style={styles.faqIcon}>{open ? "−" : "+"}</span>
                    </div>
                    {open && (
                      <div style={styles.faqBody}>
                        <p style={{ marginTop: 8, marginBottom: 8, lineHeight: 1.6 }}>{item.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section style={styles.section}>
          <div style={styles.sectionInner}>
            <div style={styles.finalCard}>
              <div style={styles.sectionEyebrow}>Ready to start?</div>
              <h2 style={styles.finalHeadline}>Start improving — one screenshot at a time.</h2>
              <p style={styles.finalSub}>
                Get instant access for <strong>{PRICE_SHORT}</strong>. Subscribe, receive your
                Member ID, then log in on any device.
              </p>

              <button
                style={styles.heroPrimaryBtn}
                onClick={() => {
                  setCheckoutError("");
                  setMemberId("");
                  setCheckoutAgreed(false);
                  setShowCheckout(true);
                }}
              >
                {PRICE_BUTTON}
              </button>

              <div style={{ fontSize: 11, opacity: 0.7, maxWidth: 520, marginTop: 10 }}>
                Contact Us: orbitalbiz1@gmail.com
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={styles.footer}>
          <div style={styles.footerInner}>
            <span>© {new Date().getFullYear()} MaxTradeAI. All rights reserved.</span>
            <div style={styles.footerLinks}>
              <span style={styles.footerLink} onClick={() => setShowPrivacy(true)}>
                Privacy Policy
              </span>
              <span style={styles.footerLink} onClick={() => setShowTerms(true)}>
                Terms of Use
              </span>
              <span style={styles.footerLink} onClick={() => setShowDisclaimer(true)}>
                Disclaimer
              </span>
            </div>
            <div style={{ fontSize: 11, opacity: 0.7, maxWidth: 700, marginTop: 4 }}>
              Educational use only. Nothing on this site or in the app is financial advice. AI can
              be inaccurate, and you are responsible for any trades you place.
            </div>
          </div>
        </footer>
      </div>

      {/* CHECKOUT MODAL */}
      {showCheckout && (
        <div style={styles.overlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalTitle}>Continue to Stripe</div>
            <div style={styles.modalText}>
              You&apos;ll enter your details directly in Stripe Checkout.
              <br />
              This is a <strong>{PRICE_SHORT}</strong> subscription for access to your portal.
              <br />
              <br />
              <strong style={{ fontSize: 12 }}>
                Important: Enter your email in Stripe so you can receive your Member ID.
              </strong>
            </div>

            <form onSubmit={handleCheckoutSubmit}>
              {/* Terms / Privacy checkbox */}
              <label style={styles.checkboxRow}>
                <input
                  type="checkbox"
                  style={styles.checkboxInput}
                  checked={checkoutAgreed}
                  onChange={(e) => setCheckoutAgreed(e.target.checked)}
                />
                <span style={styles.checkboxLabel}>
                  I agree to the{" "}
                  <span
                    style={styles.checkboxLink}
                    onClick={(event) => {
                      event.preventDefault();
                      setShowTerms(true);
                    }}
                  >
                    Terms of Use
                  </span>{" "}
                  and{" "}
                  <span
                    style={styles.checkboxLink}
                    onClick={(event) => {
                      event.preventDefault();
                      setShowPrivacy(true);
                    }}
                  >
                    Privacy Policy
                  </span>
                  .
                </span>
              </label>

              {checkoutError && <div style={styles.modalError}>{checkoutError}</div>}

              <button
                type="submit"
                disabled={checkoutLoading}
                style={{
                  ...styles.modalButtonPrimary,
                  opacity: checkoutLoading ? 0.7 : 1,
                  cursor: checkoutLoading ? "default" : "pointer",
                }}
              >
                {checkoutLoading ? "Redirecting…" : `Subscribe ${PRICE_SHORT} with Stripe →`}
              </button>
            </form>

            {memberId && (
              <div style={styles.idBox}>
                <span style={styles.idLabel}>Your Member ID:</span>
                <span style={styles.idValue}>{memberId}</span>
                <div style={styles.idHint}>
                  Save this somewhere safe — you&apos;ll use it to log in on any device.
                </div>
                <button
                  type="button"
                  style={{ ...styles.modalButtonPrimary, marginTop: 10 }}
                  onClick={openWorkspace}
                >
                  I saved it → go to my portal
                </button>
              </div>
            )}

            <button
              type="button"
              style={styles.modalButtonSecondary}
              onClick={() => setShowCheckout(false)}
            >
              Cancel for now
            </button>
          </div>
        </div>
      )}

      {/* MEMBER ID LOGIN MODAL */}
      {showMemberPortal && (
        <div style={styles.overlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalTitle}>Enter your Member ID</div>
            <div style={styles.modalText}>
              Paste the Member ID you received after purchase to unlock your portal.
            </div>

            <form onSubmit={handleMemberPortalSubmit}>
              <input
                type="text"
                placeholder="Member ID (e.g. MTC-ABC123)"
                value={memberPortalId}
                onChange={(e) => setMemberPortalId(e.target.value)}
                style={{
                  width: "100%",
                  borderRadius: 10,
                  border: "1px solid rgba(30,64,175,0.9)",
                  background: "#020617",
                  color: "#e5e7eb",
                  padding: "8px 10px",
                  fontSize: 13,
                  marginBottom: 8,
                  boxSizing: "border-box",
                }}
                required
              />

              {memberPortalError && <div style={styles.modalError}>{memberPortalError}</div>}

              <button
                type="submit"
                disabled={memberPortalLoading}
                style={{
                  ...styles.modalButtonPrimary,
                  opacity: memberPortalLoading ? 0.7 : 1,
                  cursor: memberPortalLoading ? "default" : "pointer",
                }}
              >
                {memberPortalLoading ? "Checking..." : "Continue to my portal"}
              </button>
            </form>

            <button
              type="button"
              style={styles.modalButtonSecondary}
              onClick={() => setShowMemberPortal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* PRIVACY POLICY MODAL */}
      {showPrivacy && (
        <div style={styles.overlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalTitle}>Privacy Policy</div>
            <div style={styles.modalText}>How MaxTradeAI handles your information.</div>
            <div style={styles.legalBody}>
              <div style={styles.legalHeading}>1. Information You Provide</div>
              <p>
                When you use MaxTradeAI, you may upload screenshots, enter notes, and provide basic
                details like your name and email. This information is used to generate AI feedback
                and maintain your personal workspace.
              </p>

              <div style={styles.legalHeading}>2. How We Use Your Data</div>
              <p>
                We use your data to operate and improve the app, generate educational feedback on
                your trades, and keep your journal and trade history organized. We do not sell your
                personal data.
              </p>

              <div style={styles.legalHeading}>3. AI & Third-Party Services</div>
              <p>
                Your charts and notes may be processed by third-party AI providers solely for the
                purpose of generating feedback. We take reasonable steps to protect this data, but
                no system is 100% secure.
              </p>

              <div style={styles.legalHeading}>4. Storage & Security</div>
              <p>
                Some information may be stored locally in your browser or on our servers. We aim to
                use reasonable security measures, but you should avoid uploading highly sensitive
                personal or financial account information.
              </p>

              <div style={styles.legalHeading}>5. Your Choices</div>
              <p>
                You can stop using the app at any time. If you&apos;d like your data removed from
                our systems, you can contact us and we will make reasonable efforts to delete it,
                where technically and legally possible.
              </p>

              <div style={styles.legalHeading}>6. Changes to This Policy</div>
              <p>
                We may update this Privacy Policy over time. If we make material changes, we&apos;ll
                update the effective date and may provide a brief notice in the app.
              </p>
            </div>
            <button type="button" style={styles.modalButtonSecondary} onClick={() => setShowPrivacy(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* TERMS OF USE MODAL */}
      {showTerms && (
        <div style={styles.overlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalTitle}>Terms of Use</div>
            <div style={styles.modalText}>Please read this before relying on MaxTradeAI.</div>
            <div style={styles.legalBody}>
              <div style={styles.legalHeading}>1. Educational Purpose Only</div>
              <p>
                MaxTradeAI is provided for educational and informational purposes only. It does not
                provide financial, investment, legal, tax, or professional advice of any kind.
              </p>

              <div style={styles.legalHeading}>2. No Financial Advice</div>
              <p>
                Nothing generated by the app should be interpreted as a recommendation to buy,
                sell, or hold any security, currency, or financial instrument. You are solely
                responsible for any trades you choose to place.
              </p>

              <div style={styles.legalHeading}>3. AI-Generated Content</div>
              <p>
                Feedback in MaxTradeAI is generated using AI models based on the screenshots and
                notes you provide. AI can misunderstand charts, miss important details, or generate
                inaccurate or incomplete information. You should never treat AI feedback as
                guaranteed truth.
              </p>

              <div style={styles.legalHeading}>4. User Responsibility</div>
              <p>
                By using this app, you agree that you are responsible for providing accurate
                information, managing your own risk, and verifying any ideas before acting on them.
                You trade at your own risk.
              </p>

              <div style={styles.legalHeading}>5. Limitation of Liability</div>
              <p>
                To the fullest extent permitted by law, MaxTradeAI and its operators are not liable
                for any direct, indirect, incidental, or consequential losses or damages arising
                from your use of the app, including trading losses, missed opportunities, or
                emotional stress.
              </p>

              <div style={styles.legalHeading}>6. No Warranties</div>
              <p>
                The app is provided &quot;as is&quot; and &quot;as available&quot; without warranties
                of any kind, whether express or implied.
              </p>

              <div style={styles.legalHeading}>7. Changes to Terms</div>
              <p>
                We may update these Terms of Use over time. Continued use of this app after changes
                means you accept the updated terms.
              </p>
            </div>
            <button type="button" style={styles.modalButtonSecondary} onClick={() => setShowTerms(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* DISCLAIMER MODAL */}
      {showDisclaimer && (
        <div style={styles.overlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalTitle}>Disclaimer</div>
            <div style={styles.modalText}>AI can be wrong. Trading always involves risk.</div>
            <div style={styles.legalBody}>
              <div style={styles.legalHeading}>1. No Guarantees</div>
              <p>
                MaxTradeAI cannot guarantee accuracy of any AI-generated feedback, nor can it
                guarantee profits, improvement, or specific outcomes. All trading involves risk,
                and you may lose money.
              </p>

              <div style={styles.legalHeading}>2. AI Limitations</div>
              <p>
                Even with detailed notes and clear screenshots, AI can misinterpret context, miss
                key points, or provide feedback that you disagree with. Treat AI feedback as an
                extra opinion, not a signal service or rulebook.
              </p>

              <div style={styles.legalHeading}>3. Your Decisions</div>
              <p>
                Any trades you place are your decisions and your responsibility. You should always
                use your own judgment and risk management.
              </p>

              <div style={styles.legalHeading}>4. Educational Framing</div>
              <p>
                Think of MaxTradeAI like a practice tool or training partner. Its role is to help
                you reflect on your process, not to tell you exactly what to do in the markets.
              </p>
            </div>
            <button type="button" style={styles.modalButtonSecondary} onClick={() => setShowDisclaimer(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
