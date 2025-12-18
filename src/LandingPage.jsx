import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const STRIPE_PAYMENT_URL =
  "https://buy.stripe.com/5kQ28r5nFgLR6m03pCgQE02";

const MEMBER_LS_KEY = "tc_member_v1";

// ✅ Pricing (single source of truth for all copy)
const PRICE_DISPLAY = "$24.99";
const BILLING_PERIOD = "month";
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
      gap: 20,
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
      maxWidth: 680,
    },
    heroHighlight: {
      color: "#22d3ee",
    },
    heroSub: {
      maxWidth: 620,
      fontSize: 14,
      opacity: 0.86,
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
    heroTertiary: {
      fontSize: 11,
      opacity: 0.75,
      marginTop: 6,
    },

    // LOGOS STRIP
    logosRow: {
      marginTop: 10,
      padding: "16px 0 4px",
      borderTop: "1px solid rgba(15,23,42,0.9)",
      borderBottom: "1px solid rgba(15,23,42,0.9)",
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 16,
      opacity: 0.85,
      fontSize: 11,
    },
    logoBadge: {
      padding: "6px 12px",
      borderRadius: 999,
      border: "1px solid rgba(51,65,85,0.9)",
      background:
        "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(8,47,73,0.95))",
    },

    // STATS
    statsGrid: {
      display: "flex",
      flexWrap: "wrap",
      gap: 16,
      marginTop: 18,
      justifyContent: "center",
    },
    statCard: {
      flex: "1 1 180px",
      minWidth: 160,
      padding: "16px 18px",
      borderRadius: 18,
      background:
        "linear-gradient(135deg, #0f766e, #0284c7, #0f766e 90%, #0b1120)",
      boxShadow: "0 18px 50px rgba(15,23,42,0.9)",
    },
    statNumber: {
      fontSize: 20,
      fontWeight: 900,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      opacity: 0.9,
    },

    // TITLES
    sectionTitle: {
      fontSize: 24,
      fontWeight: 900,
      marginBottom: 8,
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
      maxWidth: 520,
    },

    // PROBLEMS
    problemsGrid: {
      marginTop: 20,
      display: "flex",
      flexWrap: "wrap",
      gap: 14,
      justifyContent: "center",
    },
    problemCard: {
      flex: "1 1 220px",
      minWidth: 220,
      borderRadius: 22,
      padding: "18px 18px 20px",
      background:
        "linear-gradient(135deg, #0b1120, #0f172a, #0b1120 90%, #020617)",
      color: "#e5e7eb",
      boxShadow: "0 18px 45px rgba(15,23,42,0.9)",
      border: "1px solid rgba(30,64,175,0.7)",
    },
    problemTag: {
      fontSize: 10,
      textTransform: "uppercase",
      letterSpacing: 0.14,
      padding: "4px 8px",
      borderRadius: 999,
      border: "1px solid rgba(148,163,184,0.7)",
      marginBottom: 10,
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      background: "rgba(15,23,42,0.9)",
    },
    problemTitle: {
      fontSize: 15,
      fontWeight: 800,
      marginBottom: 8,
    },
    problemText: {
      fontSize: 12,
      opacity: 0.9,
    },

    // CHECKLIST / WHAT YOU GET
    checklistGrid: {
      marginTop: 18,
      display: "flex",
      flexWrap: "wrap",
      gap: 16,
      justifyContent: "center",
    },
    checklistCol: {
      flex: "1 1 260px",
      minWidth: 240,
      borderRadius: 20,
      padding: 18,
      background: "rgba(15,23,42,0.97)",
      border: "1px solid rgba(30,64,175,0.8)",
      boxShadow: "0 18px 45px rgba(15,23,42,0.9)",
      textAlign: "left",
    },
    checklistTitle: {
      fontSize: 15,
      fontWeight: 800,
      marginBottom: 8,
    },
    checklistItemRow: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: 12,
      padding: "8px 10px",
      borderRadius: 12,
      background: "rgba(15,23,42,0.96)",
      border: "1px solid rgba(30,64,175,0.8)",
      marginBottom: 6,
    },
    checklistLabel: {
      opacity: 0.86,
    },
    checklistChecks: {
      display: "flex",
      gap: 8,
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 0.14,
    },
    checklistYes: {
      color: "#22c55e",
    },
    checklistNo: {
      color: "#fb7185",
    },

    // TESTIMONIALS
    testimonialGrid: {
      marginTop: 18,
      display: "flex",
      flexWrap: "wrap",
      gap: 16,
      justifyContent: "center",
    },
    testimonialCard: {
      flex: "1 1 260px",
      minWidth: 220,
      borderRadius: 20,
      padding: 16,
      background:
        "linear-gradient(135deg, #0b1120, #0f172a, #0b1120 90%, #020617)",
      boxShadow: "0 18px 45px rgba(15,23,42,0.9)",
      border: "1px solid rgba(30,64,175,0.7)",
      fontSize: 12,
      textAlign: "left",
    },
    testimonialName: {
      marginTop: 10,
      fontWeight: 700,
      fontSize: 12,
    },

    // FAQ
    faqList: {
      marginTop: 18,
      display: "flex",
      flexDirection: "column",
      gap: 10,
      alignItems: "center",
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
    },
    finalHeadline: {
      fontSize: 22,
      fontWeight: 900,
      marginBottom: 8,
    },
    finalSub: {
      fontSize: 13,
      opacity: 0.86,
      maxWidth: 560,
      margin: "0 auto 14px",
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
      marginTop: 4,
      textAlign: "center",
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
    },

    // AI REPORT PREVIEW
    previewCard: {
      marginTop: 20,
      maxWidth: 480,
      marginLeft: "auto",
      marginRight: "auto",
      borderRadius: 20,
      background: "#0e1016",
      border: "1px solid rgba(148,163,184,0.6)",
      padding: 18,
      boxShadow: "0 18px 45px rgba(15,23,42,0.9)",
      textAlign: "left",
    },
    previewHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    previewTitle: {
      fontSize: 18,
      fontWeight: 700,
      color: "#f9fafb",
    },
    previewMeta: {
      fontSize: 12,
      color: "#9ca3af",
    },
    previewMetaSpacer: {
      marginTop: 2,
    },
    previewGradeBadge: {
      height: 36,
      width: 36,
      borderRadius: 999,
      background: "#facc15",
      color: "#020617",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 800,
      fontSize: 18,
      boxShadow: "0 10px 30px rgba(0,0,0,0.7)",
    },
    previewSections: {
      marginTop: 18,
      display: "flex",
      flexDirection: "column",
      gap: 12,
    },
    previewSectionTitle: {
      fontSize: 10,
      textTransform: "uppercase",
      letterSpacing: 0.16,
      color: "#cbd5f5",
    },
    previewBars: {
      marginTop: 6,
      display: "flex",
      flexDirection: "column",
      gap: 4,
    },
    previewBar: (width) => ({
      height: 8,
      borderRadius: 999,
      background: "rgba(148,163,184,0.25)",
      width,
    }),
    previewFooter: {
      marginTop: 14,
      fontSize: 10,
      color: "#6b7280",
      textAlign: "right",
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

      // OPTIONAL: keep any prior local member info, but do not collect name/email here anymore
      saveMemberToLocal({
        plan: "personal",
      });

      // 🚀 send user directly to Stripe Payment Link (subscription)
      window.location.href = STRIPE_PAYMENT_URL;
    } catch (err) {
      console.error(err);
      setCheckoutError("Something went wrong redirecting to Stripe.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  function handleMemberPortalSubmit(e) {
    e.preventDefault();
    setMemberPortalError("");

    const trimmed = memberPortalId.trim();
    if (!trimmed) {
      setMemberPortalError("Please enter your Member ID.");
      return;
    }

    saveMemberToLocal({
      memberId: trimmed,
      email: "",
      name: "",
    });

    openWorkspace();
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
  // ✅ demo data for the P&L calendar graphic (prevents blank screen)
  const pnlDays = [
    { d: 1, tone: "pos", v: "+$210", rr: "1.8R" },
    { d: 2, tone: "neg", v: "-$95", rr: "0.7R" },
    { d: 3, tone: "flat", v: "$0", rr: "—" },
    { d: 4, tone: "pos", v: "+$140", rr: "1.5R" },
    { d: 5, tone: "neg", v: "-$60", rr: "0.9R" },
    { d: 6, tone: "pos", v: "+$330", rr: "2.2R" },
    { d: 7, tone: "pos", v: "+$85", rr: "1.2R" },
    { d: 8, tone: "flat", v: "$0", rr: "—" },
    { d: 9, tone: "neg", v: "-$120", rr: "0.6R" },
    { d: 10, tone: "pos", v: "+$260", rr: "1.9R" },
    { d: 11, tone: "pos", v: "+$110", rr: "1.4R" },
    { d: 12, tone: "neg", v: "-$70", rr: "0.8R" },
    { d: 13, tone: "pos", v: "+$180", rr: "1.6R" },
    { d: 14, tone: "pos", v: "+$95", rr: "1.1R" },
    { d: 15, tone: "flat", v: "$0", rr: "—" },
    { d: 16, tone: "pos", v: "+$220", rr: "1.7R" },
    { d: 17, tone: "neg", v: "-$130", rr: "0.7R" },
    { d: 18, tone: "pos", v: "+$145", rr: "1.3R" },
    { d: 19, tone: "pos", v: "+$305", rr: "2.0R" },
    { d: 20, tone: "neg", v: "-$55", rr: "0.9R" },
    { d: 21, tone: "pos", v: "+$125", rr: "1.2R" },
    { d: 22, tone: "flat", v: "$0", rr: "—" },
    { d: 23, tone: "pos", v: "+$90", rr: "1.0R" },
    { d: 24, tone: "neg", v: "-$80", rr: "0.8R" },
    { d: 25, tone: "pos", v: "+$175", rr: "1.5R" },
    { d: 26, tone: "pos", v: "+$240", rr: "1.8R" },
    { d: 27, tone: "neg", v: "-$110", rr: "0.6R" },
    { d: 28, tone: "pos", v: "+$160", rr: "1.4R" },
  ];

  return (
    <>
      <div style={styles.page}>
        {/* TOP RIBBON */}
        <div style={styles.ribbon}>
          <div style={styles.ribbonInner}>
            <span style={styles.ribbonText}>
              <span style={styles.ribbonStrong}>
                Monthly access · {PRICE_SHORT}:
              </span>{" "}
              get your private portal + AI feedback + daily journal.
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
                <div style={styles.logoSub}>
                  AI trade review · liquidity &amp; ICT focused
                </div>
              </div>
            </div>
            <div style={styles.navRight}>
              <span style={styles.navPill}>
                Built for screenshot + journal traders
              </span>
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
            Subscription confirmed ✅ Check your email for your MaxTradeAI Member
            ID, then click &quot;Enter Member ID&quot; to open your portal.
          </div>
        )}

        {/* HERO */}
        <section style={styles.hero}>
          <div style={styles.heroInner}>
            <div style={styles.heroEyebrow}>
              Real feedback, not random signals
            </div>
            <h1 style={styles.heroHeadline}>
              Turn every screenshot into{" "}
              <span style={styles.heroHighlight}>
                a trade you actually learn from.
              </span>
            </h1>
            <p style={styles.heroSub}>
              MaxTradeAI is your private workspace for trade screenshots, AI
              feedback, and a daily journal. Upload your chart, explain your
              idea, and get a breakdown like a coach is sitting next to you —
              for NASDAQ, indices, FX, and gold.
            </p>

            {/* disclaimer under hero */}
            <div
              style={{
                fontSize: 11,
                opacity: 0.7,
                maxWidth: 640,
                marginTop: 6,
              }}
            >
              <strong>Important:</strong> MaxTradeAI is for educational and
              informational purposes only. It does not provide financial or
              investment advice. AI-generated feedback can be inaccurate or
              incomplete, and you are fully responsible for your own trading
              decisions.
            </div>

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

            <div style={styles.heroTertiary}>
              {PRICE_SHORT} subscription access. Your trades stay organized per
              day — not buried in camera roll folders or Discord chats.
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

        {/* RESULTS / STATS */}
        <section style={styles.section}>
          <div style={styles.sectionInner}>
            <div style={styles.sectionEyebrow}>
              The results speak for themselves
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div>
                <h2 style={styles.sectionTitle}>
                  Study your own data like a professional.
                </h2>
                <p style={styles.sectionSub}>
                  Every trade, note, and lesson is saved to your personal
                  timeline. Stop guessing, stop relying on random calls, and
                  start reviewing your own execution day by day.
                </p>
              </div>
              <div style={{ fontSize: 12, opacity: 0.75, maxWidth: 520 }}>
                Traders use MaxTradeAI to{" "}
                <strong>grade trades, journal daily,</strong> and build rules
                they actually follow — for {PRICE_SHORT}.
              </div>
            </div>

            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={styles.statNumber}>200+</div>
                <div style={styles.statLabel}>sessions reviewed by AI</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statNumber}>A-F</div>
                <div style={styles.statLabel}>
                  grade scale for each trade you submit
                </div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statNumber}>ICT, TJR, SMC</div>
                <div style={styles.statLabel}>
                  common setups and strategies understood: BOS, CHoCH, FVG, OB,
                  liquidity sweeps
                </div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statNumber}>Unlimited</div>
                <div style={styles.statLabel}>Trade submissions daily</div>
              </div>
            </div>
          </div>
        </section>

        {/* HIDDEN PROBLEMS */}
        <section style={styles.section}>
          <div style={styles.sectionInner}>
            <div style={styles.sectionEyebrow}>
              The hidden problems stopping you from improving faster
            </div>
            <h2 style={styles.sectionTitle}>
              You don&apos;t need more signals — you need structured review.
            </h2>
            <p style={styles.sectionSub}>
              Most traders never build a system for reviewing their trades.
              Screenshots live in random folders, notes are scattered, and
              nothing connects back to the exact session they traded.
            </p>

            <div style={styles.problemsGrid}>
              <div style={styles.problemCard}>
                <div style={styles.problemTag}>
                  <span>●</span>
                  <span>Problem #1</span>
                </div>
                <div style={styles.problemTitle}>
                  &ldquo;I don't know why my trades keep failing.&rdquo;
                </div>
                <div style={styles.problemText}>
                  MaxTradeAI will serve as your mentor, being an extra set of
                  eyes on your moves in the charts.
                </div>
              </div>

              <div style={styles.problemCard}>
                <div style={styles.problemTag}>
                  <span>●</span>
                  <span>Problem #2</span>
                </div>
                <div style={styles.problemTitle}>
                  &ldquo;I keep forgetting what happened with my past
                  trades.&rdquo;
                </div>
                <div style={styles.problemText}>
                  Your journal in MaxTradeAI saves daily, allowing you to go
                  back and forth between dates to view your progress.
                </div>
              </div>

              <div style={styles.problemCard}>
                <div style={styles.problemTag}>
                  <span>●</span>
                  <span>Problem #3</span>
                </div>
                <div style={styles.problemTitle}>
                  &ldquo;Nothing ties back to ICT/liquidity rules.&rdquo;
                </div>
                <div style={styles.problemText}>
                  Generic journaling apps don&apos;t understand BOS / CHoCH /
                  FVG / liquidity sweeps. You end up translating concepts
                  instead of getting direct feedback on your setup.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AI REPORT PREVIEW SECTION */}
        <section style={styles.section}>
          <div style={styles.sectionInner}>
            <div style={styles.sectionEyebrow}>How your feedback looks</div>
            <h2 style={styles.sectionTitle}>
              A clean, structured report for each trade.
            </h2>

            <div style={styles.previewCard}>
              <div style={styles.previewHeader}>
                <div>
                  <div style={styles.previewTitle}>Trade Coach AI</div>
                  <div
                    style={{
                      ...styles.previewMeta,
                      ...styles.previewMetaSpacer,
                    }}
                  >
                    Gold Futures · 5m
                  </div>
                  <div
                    style={{
                      ...styles.previewMeta,
                      ...styles.previewMetaSpacer,
                    }}
                  >
                    Confidence: 75%
                  </div>
                </div>
                <div style={styles.previewGradeBadge}>A-F</div>
              </div>

              <div style={styles.previewSections}>
                <div>
                  <div style={styles.previewSectionTitle}>What went right</div>
                  <div style={styles.previewBars}>
                    <div style={styles.previewBar("80%")} />
                    <div style={styles.previewBar("60%")} />
                  </div>
                </div>

                <div>
                  <div style={styles.previewSectionTitle}>What went wrong</div>
                  <div style={styles.previewBars}>
                    <div style={styles.previewBar("85%")} />
                    <div style={styles.previewBar("70%")} />
                    <div style={styles.previewBar("50%")} />
                  </div>
                </div>

                <div>
                  <div style={styles.previewSectionTitle}>Improvements</div>
                  <div style={styles.previewBars}>
                    <div style={styles.previewBar("80%")} />
                    <div style={styles.previewBar("65%")} />
                  </div>
                </div>

                <div>
                  <div style={styles.previewSectionTitle}>Lesson learned</div>
                  <div style={styles.previewBars}>
                    <div style={styles.previewBar("75%")} />
                  </div>
                </div>
              </div>

              <div style={styles.previewFooter}>
                Example AI trade report preview — your real reports show full
                text here.
              </div>
            </div>
          </div>
        </section>

            {/* ✅ P&L CALENDAR (UPGRADED) */}
        <section style={styles.section}>
          <div style={styles.sectionInner}>
            <div style={styles.sectionEyebrow}>Track performance, not just ideas</div>
            <h2 style={styles.sectionTitle}>The P&amp;L calendar shows the truth.</h2>
            <p style={styles.sectionSub}>
              Log <strong>profit/loss</strong> and <strong>risk-to-reward</strong> daily,
              then see patterns instantly: overtrading days, revenge days, and which
              setups create your best results.
            </p>

            <div style={styles.pnlGridWrap}>
              <div style={styles.pnlTopRow}>
                <div>
                  <div style={{ fontWeight: 950, fontSize: 14 }}>
                    Your month at a glance
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.82, marginTop: 3, lineHeight: 1.45 }}>
                    Green days = profitable. Red days = losing. Blue/flat = break-even.
                    The goal is to make your <strong>process</strong> consistent so the
                    calendar turns consistently green over time.
                  </div>
                </div>
                <div style={{ fontSize: 12, opacity: 0.85 }}>
                  <span style={{ color: "#22d3ee", fontWeight: 950 }}>Tip:</span>{" "}
                  If your avg R:R is solid but P&amp;L is negative, your entries/invalidations
                  need work. If avg R:R is low, your trade management is likely the leak.
                </div>
              </div>

              <div style={styles.pnlSummaryRow}>
                <div style={styles.pnlSummaryCard}>
                  <div style={styles.pnlSummaryLabel}>Total P&amp;L (month)</div>
                  <div style={styles.pnlSummaryValue}>+$1,055</div>
                  <div style={styles.pnlSummarySub}>
                    See your real total automatically based on daily entries.
                  </div>
                </div>
                <div style={styles.pnlSummaryCard}>
                  <div style={styles.pnlSummaryLabel}>Avg R:R</div>
                  <div style={styles.pnlSummaryValue}>1.7R</div>
                  <div style={styles.pnlSummarySub}>
                    Averages help you catch “small win / big loss” behavior early.
                  </div>
                </div>
                <div style={styles.pnlSummaryCard}>
                  <div style={styles.pnlSummaryLabel}>Consistency Score</div>
                  <div style={styles.pnlSummaryValue}>7.8/10</div>
                  <div style={styles.pnlSummarySub}>
                    Built from streaks + discipline. (In-app score can be customized later.)
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
                  {pnlDays.map((c) => (
                    <div key={c.d} style={styles.pnlCell(c.tone)}>
                      <div style={styles.pnlCellDay}>Day {c.d}</div>
                      <div>
                        <div style={styles.pnlCellValue}>{c.v}</div>
                        <div style={styles.pnlCellRR}>{c.rr}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 12, fontSize: 12, opacity: 0.85, lineHeight: 1.55 }}>
                  <strong>How you’ll use it:</strong> after trading, enter your day’s result
                  and R:R, then compare it to your screenshot + journal. Over time you’ll
                  spot the exact sessions, timeframes, and behaviors that print… and the ones
                  that bleed.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WHAT YOU GET / VS EVERYTHING ELSE */}
        <section style={styles.section}>
          <div style={styles.sectionInner}>
            <div style={styles.sectionEyebrow}>
              Inside your MaxTradeAI portal
            </div>
            <h2 style={styles.sectionTitle}>
              Everything you need to self-coach trades — in one place.
            </h2>

            <div style={styles.checklistGrid}>
              <div style={styles.checklistCol}>
                <div style={styles.checklistTitle}>What you get</div>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13 }}>
                  <li>AI feedback that grades every trade you upload.</li>
                  <li>
                    Breakdown of what you executed well vs. what you missed.
                  </li>
                  <li>
                    Clear &quot;next time, do this&quot; suggestions so you
                    know what to practice.
                  </li>
                  <li>
                    Daily journal section built-in for psychology, discipline,
                    and rules.
                  </li>
                  <li>
                    Private Member ID workspace tied to your trades — not
                    anyone else&apos;s.
                  </li>
                </ul>
              </div>

              <div style={styles.checklistCol}>
                <div style={styles.checklistTitle}>MaxTradeAI</div>

                <div style={styles.checklistItemRow}>
                  <span style={styles.checklistLabel}>
                    Actually reviews your trades
                  </span>
                  <div style={styles.checklistChecks}>
                    <span style={styles.checklistYes}>MaxTrade: ✓</span>
                    <span style={styles.checklistNo}>TradingView: ✕</span>
                  </div>
                </div>

                <div style={styles.checklistItemRow}>
                  <span style={styles.checklistLabel}>
                    Structured daily journal to log your daily progress
                  </span>
                  <div style={styles.checklistChecks}>
                    <span style={styles.checklistYes}>MaxTrade: ✓</span>
                    <span style={styles.checklistNo}>Other AI: ✕</span>
                  </div>
                </div>

                <div style={styles.checklistItemRow}>
                  <span style={styles.checklistLabel}>
                    Understands BOS / CHoCH / FVG / liquidity
                  </span>
                  <div style={styles.checklistChecks}>
                    <span style={styles.checklistYes}>MaxTrade: ✓</span>
                    <span style={styles.checklistNo}>Basic AI: ✕</span>
                  </div>
                </div>

                <div style={styles.checklistItemRow}>
                  <span style={styles.checklistLabel}>
                    Keeps everything in a single private portal
                  </span>
                  <div style={styles.checklistChecks}>
                    <span style={styles.checklistYes}>MaxTrade: ✓</span>
                    <span style={styles.checklistNo}>Others: ✕</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section style={styles.section}>
          <div style={styles.sectionInner}>
            <div style={styles.sectionEyebrow}>Real results</div>
            <h2 style={styles.sectionTitle}>
              See what traders are saying about structured review.
            </h2>
            <p style={styles.sectionSub}>
              These are the kinds of outcomes traders report when they finally
              stop relying on screenshots alone and start tracking trades with
              feedback and rules.
            </p>

            <div style={styles.testimonialGrid}>
              <div style={styles.testimonialCard}>
                &ldquo;Instead of having no clue why my stop loss was hit, I now
                get a clear grade and a list of mistakes to fix. I&apos;m
                finally building confidence in my setups.&rdquo;
                <div style={styles.testimonialName}>— Index &amp; FX trader</div>
              </div>
              <div style={styles.testimonialCard}>
                &ldquo;The daily journal tied to each day forced me to be honest
                about my rules and emotions. I actually know why I won or lost a
                trade now.&rdquo;
                <div style={styles.testimonialName}>— NAS100 day trader</div>
              </div>
              <div style={styles.testimonialCard}>
                &ldquo;The AI speaks in BOS / CHoCH / FVG language, so it feels
                like someone who actually trades liquidity is reviewing my
                charts.&rdquo;
                <div style={styles.testimonialName}>— ICT-focused trader</div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section style={styles.section}>
          <div style={styles.sectionInner}>
            <div style={styles.sectionEyebrow}>FAQs</div>
            <h2 style={styles.sectionTitle}>
              Get answers before you start your portal.
            </h2>
            <p style={styles.sectionSub}>
              The most common questions traders ask before getting instant
              access to MaxTradeAI.
            </p>

            <div style={styles.faqList}>
              {faqs.map((item, idx) => {
                const open = openFaq === idx;
                return (
                  <div key={idx} style={styles.faqItem}>
                    <div
                      style={styles.faqHeader}
                      onClick={() =>
                        setOpenFaq((prev) => (prev === idx ? null : idx))
                      }
                    >
                      <span>{item.q}</span>
                      <span style={styles.faqIcon}>{open ? "−" : "+"}</span>
                    </div>
                    {open && (
                      <div style={styles.faqBody}>
                        <p style={{ marginTop: 8, marginBottom: 8 }}>
                          {item.a}
                        </p>
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
              <div style={styles.sectionEyebrow}>Ready to start today?</div>
              <h2 style={styles.finalHeadline}>
                Start building real trading improvement — one screenshot at a
                time.
              </h2>
              <p style={styles.finalSub}>
                Get instant access to your MaxTradeAI portal for{" "}
                <strong>{PRICE_SHORT}</strong>. Upload your next trade, explain
                your idea, and see how different it feels to get a structured,
                ICT-aware breakdown instead of a random emoji-filled comment.
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

              {/* brief legal note under final CTA */}
              <div
                style={{
                  fontSize: 11,
                  opacity: 0.7,
                  maxWidth: 520,
                  marginTop: 10,
                }}
              >
                MaxTradeAI does not guarantee profits or specific outcomes. AI
                feedback is fallible and may miss or misinterpret information
                you provide. Always use your own judgment and risk management.
                <br />
                <br />
                Contact Us: orbitalbiz1@gmail.com
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={styles.footer}>
          <div style={styles.footerInner}>
            <span>
              © {new Date().getFullYear()} MaxTradeAI. All rights reserved.
            </span>
            <div style={styles.footerLinks}>
              <span
                style={styles.footerLink}
                onClick={() => setShowPrivacy(true)}
              >
                Privacy Policy
              </span>
              <span
                style={styles.footerLink}
                onClick={() => setShowTerms(true)}
              >
                Terms of Use
              </span>
              <span
                style={styles.footerLink}
                onClick={() => setShowDisclaimer(true)}
              >
                Disclaimer
              </span>
            </div>
            <div
              style={{
                fontSize: 11,
                opacity: 0.7,
                maxWidth: 700,
                marginTop: 4,
              }}
            >
              Educational use only. Nothing on this site or in the app is
              financial advice. AI-generated feedback can be inaccurate or
              incomplete, and you are responsible for any trades you place.
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
              You&apos;ll enter your details directly in Stripe Checkout. This is
              a <strong>{PRICE_SHORT}</strong> subscription for access to your
              portal.
              <br />
              <br />
              <span style={{ fontSize: 11, opacity: 0.8 }}>
                By continuing, you acknowledge that MaxTradeAI is for
                educational use only, that AI can make mistakes, and that you
                are fully responsible for your own trading decisions.
              </span>
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
                  I have read and agree to the{" "}
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
                  , and I understand that MaxTradeAI is educational only and not
                  financial advice.
                </span>
              </label>

              {checkoutError && (
                <div style={styles.modalError}>{checkoutError}</div>
              )}

              <button
                type="submit"
                disabled={checkoutLoading}
                style={{
                  ...styles.modalButtonPrimary,
                  opacity: checkoutLoading ? 0.7 : 1,
                  cursor: checkoutLoading ? "default" : "pointer",
                }}
              >
                {checkoutLoading
                  ? "Redirecting…"
                  : `Subscribe ${PRICE_SHORT} with Stripe →`}
              </button>
            </form>

            {memberId && (
              <div style={styles.idBox}>
                <span style={styles.idLabel}>Your Member ID:</span>
                <span style={styles.idValue}>{memberId}</span>
                <div style={styles.idHint}>
                  Save this somewhere safe — you&apos;ll use it to log into Max
                  Trade Coach on any device.
                </div>
                <button
                  type="button"
                  style={{
                    ...styles.modalButtonPrimary,
                    marginTop: 10,
                  }}
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
              Paste the Member ID you received after purchase to unlock your Max
              Trade Coach portal.
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

              {memberPortalError && (
                <div style={styles.modalError}>{memberPortalError}</div>
              )}

              <button type="submit" style={styles.modalButtonPrimary}>
                Continue to my portal
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
            <div style={styles.modalText}>
              How MaxTradeAI handles your information.
            </div>
            <div style={styles.legalBody}>
              <div style={styles.legalHeading}>1. Information You Provide</div>
              <p>
                When you use MaxTradeAI, you may upload screenshots, enter
                notes, and provide basic details like your name and email. This
                information is used to generate AI feedback and maintain your
                personal workspace.
              </p>

              <div style={styles.legalHeading}>2. How We Use Your Data</div>
              <p>
                We use your data to operate and improve the app, generate
                educational feedback on your trades, and keep your journal and
                trade history organized. We do not sell your personal data.
              </p>

              <div style={styles.legalHeading}>3. AI & Third-Party Services</div>
              <p>
                Your charts and notes may be processed by third-party AI
                providers solely for the purpose of generating feedback. We take
                reasonable steps to protect this data, but no system is 100%
                secure.
              </p>

              <div style={styles.legalHeading}>4. Storage & Security</div>
              <p>
                Some information may be stored locally in your browser or on our
                servers. We aim to use reasonable security measures, but you
                should avoid uploading highly sensitive personal or financial
                account information.
              </p>

              <div style={styles.legalHeading}>5. Your Choices</div>
              <p>
                You can stop using the app at any time. If you&apos;d like your
                data removed from our systems, you can contact us and we will
                make reasonable efforts to delete it, where technically and
                legally possible.
              </p>

              <div style={styles.legalHeading}>6. Changes to This Policy</div>
              <p>
                We may update this Privacy Policy over time. If we make material
                changes, we&apos;ll update the effective date and may provide
                a brief notice in the app.
              </p>
            </div>
            <button
              type="button"
              style={styles.modalButtonSecondary}
              onClick={() => setShowPrivacy(false)}
            >
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
            <div style={styles.modalText}>
              Please read this before relying on MaxTradeAI.
            </div>
            <div style={styles.legalBody}>
              <div style={styles.legalHeading}>1. Educational Purpose Only</div>
              <p>
                MaxTradeAI is provided for educational and informational
                purposes only. It does not provide financial, investment, legal,
                tax, or professional advice of any kind.
              </p>

              <div style={styles.legalHeading}>2. No Financial Advice</div>
              <p>
                Nothing generated by the app should be interpreted as a
                recommendation to buy, sell, or hold any security, currency, or
                financial instrument. You are solely responsible for any trades
                you choose to place.
              </p>

              <div style={styles.legalHeading}>3. AI-Generated Content</div>
              <p>
                Feedback in MaxTradeAI is generated using AI models based on the
                screenshots and notes you provide. AI can misunderstand charts,
                miss important details, or generate inaccurate or incomplete
                information. You should never treat AI feedback as guaranteed
                truth.
              </p>

              <div style={styles.legalHeading}>4. User Responsibility</div>
              <p>
                By using this app, you agree that you are responsible for:
                providing accurate information, managing your own risk, and
                verifying any ideas before acting on them. You trade at your own
                risk.
              </p>

              <div style={styles.legalHeading}>5. Limitation of Liability</div>
              <p>
                To the fullest extent permitted by law, MaxTradeAI and its
                operators are not liable for any direct, indirect, incidental,
                or consequential losses or damages arising from your use of the
                app, including trading losses, missed opportunities, or emotional
                stress.
              </p>

              <div style={styles.legalHeading}>6. No Warranties</div>
              <p>
                The app is provided &quot;as is&quot; and &quot;as available&quot;
                without warranties of any kind, whether express or implied.
              </p>

              <div style={styles.legalHeading}>7. Changes to Terms</div>
              <p>
                We may update these Terms of Use over time. Continued use of the
                app after changes means you accept the updated terms.
              </p>
            </div>
            <button
              type="button"
              style={styles.modalButtonSecondary}
              onClick={() => setShowTerms(false)}
            >
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
            <div style={styles.modalText}>
              AI can be wrong. Trading always involves risk.
            </div>
            <div style={styles.legalBody}>
              <div style={styles.legalHeading}>1. No Guarantees</div>
              <p>
                MaxTradeAI cannot guarantee accuracy of any AI-generated
                feedback, nor can it guarantee profits, improvement, or specific
                outcomes. All trading involves risk, and you may lose money.
              </p>

              <div style={styles.legalHeading}>2. AI Limitations</div>
              <p>
                Even with detailed notes and clear screenshots, AI can
                misinterpret context, miss key points, or provide feedback that
                you disagree with. Treat AI feedback as an extra opinion, not a
                signal service or rulebook.
              </p>

              <div style={styles.legalHeading}>3. Your Decisions</div>
              <p>
                Any trades you place are your decisions and your responsibility.
                You should always use your own judgment, risk management, and,
                where appropriate, consult a qualified financial professional.
              </p>

              <div style={styles.legalHeading}>4. Educational Framing</div>
              <p>
                Think of MaxTradeAI like a practice tool or training partner.
                Its role is to help you reflect on your process, not to tell you
                exactly what to do in the markets.
              </p>
            </div>
            <button
              type="button"
              style={styles.modalButtonSecondary}
              onClick={() => setShowDisclaimer(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
