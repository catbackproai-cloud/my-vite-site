// src/LandingPage.jsx
import { useEffect, useMemo, useState } from "react";
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

  // ✅ basic responsive hook (no libraries)
  const [isMobile, setIsMobile] = useState(() =>
    typeof window === "undefined" ? false : window.innerWidth < 720
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 720);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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

  const styles = useMemo(() => {
    return {
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
        borderBottom: "1px solid rgba(34,211,238,0.30)",
        padding: isMobile ? "8px 12px" : "6px 16px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: 12,
        color: "#f9fafb",
      },
      ribbonInner: {
        maxWidth: 1120,
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        alignItems: "center",
      },
      ribbonText: { opacity: 0.9, lineHeight: 1.25 },
      ribbonStrong: { fontWeight: 800, color: "#22d3ee" },
      ribbonBtn: {
        borderRadius: 999,
        border: "none",
        padding: "7px 14px",
        fontSize: 12,
        fontWeight: 800,
        cursor: "pointer",
        background:
          "linear-gradient(135deg, #22d3ee, #0ea5e9, #0369a1 90%, #0f172a)",
        color: "#020617",
        boxShadow: "0 14px 35px rgba(15,23,42,0.9)",
        whiteSpace: "nowrap",
      },

      nav: {
        padding: isMobile ? "12px 12px 10px" : "14px 16px 10px",
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
        maxWidth: 1120,
        width: "100%",
        display: "flex",
        alignItems: isMobile ? "flex-start" : "center",
        justifyContent: "space-between",
        gap: 12,
        flexDirection: isMobile ? "column" : "row",
      },
      logoRow: { display: "flex", alignItems: "center", gap: 10 },
      logoMark: {
        width: 30,
        height: 30,
        borderRadius: 999,
        background:
          "conic-gradient(from 220deg, #22d3ee, #a5f3fc, #22d3ee, #0f172a)",
        boxShadow:
          "0 0 0 1px rgba(15,23,42,0.9), 0 0 24px rgba(34,211,238,0.55)",
        flex: "0 0 auto",
      },
      logoTitle: {
        fontSize: 16,
        fontWeight: 900,
        letterSpacing: 0.1,
      },
      logoSub: { fontSize: 11, opacity: 0.72 },
      navRight: {
        display: "flex",
        gap: 10,
        alignItems: "center",
        fontSize: 12,
        width: isMobile ? "100%" : "auto",
        justifyContent: isMobile ? "space-between" : "flex-end",
      },
      navPill: {
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid rgba(51,65,85,0.9)",
        background: "rgba(15,23,42,0.9)",
        opacity: 0.95,
        whiteSpace: "nowrap",
        display: isMobile ? "none" : "inline-flex",
      },
      navLinkBtn: {
        borderRadius: 999,
        border: "1px solid rgba(148,163,184,0.45)",
        background: "rgba(15,23,42,0.92)",
        color: "#e5e7eb",
        padding: "9px 12px",
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer",
        width: isMobile ? "calc(50% - 6px)" : "auto",
      },
      navPrimaryBtn: {
        borderRadius: 999,
        border: "none",
        background:
          "linear-gradient(135deg, #22d3ee, #0ea5e9, #0284c7 90%, #0f172a)",
        color: "#020617",
        padding: "9px 12px",
        fontSize: 12,
        fontWeight: 900,
        cursor: "pointer",
        boxShadow: "0 16px 40px rgba(15,23,42,0.9)",
        width: isMobile ? "calc(50% - 6px)" : "auto",
      },

      // GENERAL LAYOUT
      section: {
        padding: isMobile ? "34px 12px" : "42px 16px",
        display: "flex",
        justifyContent: "center",
      },
      sectionInner: {
        maxWidth: 1120,
        width: "100%",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      },

      // HERO
      hero: {
        padding: isMobile ? "44px 12px 34px" : "62px 16px 48px",
        background:
          "radial-gradient(circle at top, #0f172a 0%, #020617 45%, #020617 100%)",
        display: "flex",
        justifyContent: "center",
      },
      heroInner: {
        maxWidth: 1120,
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
        opacity: 0.85,
        color: "#38bdf8",
      },
      heroHeadline: {
        fontSize: "clamp(30px, 5.2vw, 46px)",
        lineHeight: 1.08,
        fontWeight: 950,
        maxWidth: 760,
        margin: 0,
      },
      heroHighlight: { color: "#22d3ee" },
      heroSub: {
        maxWidth: 680,
        fontSize: isMobile ? 14 : 15,
        opacity: 0.88,
        lineHeight: 1.55,
        margin: 0,
      },
      heroBtnRow: {
        display: "flex",
        flexWrap: "wrap",
        gap: 10,
        justifyContent: "center",
        marginTop: 6,
        width: "100%",
      },
      heroPrimaryBtn: {
        borderRadius: 999,
        border: "none",
        padding: isMobile ? "12px 16px" : "12px 22px",
        fontSize: 14,
        fontWeight: 900,
        cursor: "pointer",
        background:
          "linear-gradient(135deg, #22d3ee, #0ea5e9, #0284c7 90%, #0f172a)",
        color: "#020617",
        boxShadow:
          "0 18px 48px rgba(15,23,42,0.92), 0 0 20px rgba(34,211,238,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        minWidth: isMobile ? "100%" : 260,
      },
      heroSecondaryBtn: {
        borderRadius: 999,
        border: "1px solid rgba(148,163,184,0.75)",
        padding: isMobile ? "11px 16px" : "11px 18px",
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
        background: "rgba(15,23,42,0.95)",
        color: "#e5e7eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        minWidth: isMobile ? "100%" : 200,
      },
      heroTertiary: { fontSize: 11, opacity: 0.78, marginTop: 6 },

      // LOGOS STRIP
      logosRow: {
        marginTop: 10,
        padding: "14px 0 4px",
        borderTop: "1px solid rgba(15,23,42,0.9)",
        borderBottom: "1px solid rgba(15,23,42,0.9)",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 10,
        opacity: 0.9,
        fontSize: 11,
      },
      logoBadge: {
        padding: "7px 12px",
        borderRadius: 999,
        border: "1px solid rgba(51,65,85,0.9)",
        background:
          "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(8,47,73,0.95))",
      },

      // STATS
      statsGrid: {
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))",
        gap: 14,
        marginTop: 18,
        width: "100%",
      },
      statCard: {
        padding: "16px 18px",
        borderRadius: 18,
        background:
          "linear-gradient(135deg, rgba(15,118,110,0.85), rgba(2,132,199,0.9), rgba(15,118,110,0.85))",
        boxShadow: "0 18px 50px rgba(15,23,42,0.92)",
        border: "1px solid rgba(34,211,238,0.22)",
        textAlign: "left",
      },
      statNumber: { fontSize: 20, fontWeight: 950, marginBottom: 4 },
      statLabel: { fontSize: 12, opacity: 0.9 },

      // TITLES
      sectionTitle: {
        fontSize: "clamp(20px, 3.4vw, 28px)",
        fontWeight: 950,
        marginBottom: 8,
      },
      sectionEyebrow: {
        fontSize: 11,
        letterSpacing: 0.16,
        textTransform: "uppercase",
        opacity: 0.85,
        color: "#38bdf8",
        marginBottom: 4,
      },
      sectionSub: {
        fontSize: 13,
        opacity: 0.8,
        maxWidth: 560,
        lineHeight: 1.55,
      },

      // PROBLEMS
      problemsGrid: {
        marginTop: 20,
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))",
        gap: 14,
        width: "100%",
      },
      problemCard: {
        borderRadius: 22,
        padding: "18px 18px 20px",
        background:
          "linear-gradient(135deg, rgba(11,17,32,0.96), rgba(15,23,42,0.96), rgba(2,6,23,0.98))",
        color: "#e5e7eb",
        boxShadow: "0 18px 45px rgba(15,23,42,0.92)",
        border: "1px solid rgba(30,64,175,0.55)",
        textAlign: "left",
      },
      problemTag: {
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: 0.14,
        padding: "4px 8px",
        borderRadius: 999,
        border: "1px solid rgba(148,163,184,0.55)",
        marginBottom: 10,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "rgba(15,23,42,0.75)",
      },
      problemTitle: { fontSize: 15, fontWeight: 900, marginBottom: 8 },
      problemText: { fontSize: 12, opacity: 0.9, lineHeight: 1.55 },

      // CHECKLIST / WHAT YOU GET
      checklistGrid: {
        marginTop: 18,
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
        gap: 14,
        width: "100%",
      },
      checklistCol: {
        borderRadius: 20,
        padding: 18,
        background: "rgba(15,23,42,0.92)",
        border: "1px solid rgba(30,64,175,0.65)",
        boxShadow: "0 18px 45px rgba(15,23,42,0.92)",
        textAlign: "left",
      },
      checklistTitle: { fontSize: 15, fontWeight: 900, marginBottom: 10 },
      checklistItemRow: {
        display: "flex",
        justifyContent: "space-between",
        gap: 10,
        fontSize: 12,
        padding: "10px 10px",
        borderRadius: 14,
        background: "rgba(2,6,23,0.55)",
        border: "1px solid rgba(30,64,175,0.55)",
        marginBottom: 8,
      },
      checklistLabel: { opacity: 0.9 },
      checklistChecks: {
        display: "flex",
        gap: 10,
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: 0.12,
        whiteSpace: "nowrap",
      },
      checklistYes: { color: "#22c55e", fontWeight: 800 },
      checklistNo: { color: "#fb7185", fontWeight: 800 },

      // TESTIMONIALS
      testimonialGrid: {
        marginTop: 18,
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))",
        gap: 14,
        width: "100%",
      },
      testimonialCard: {
        borderRadius: 20,
        padding: 16,
        background:
          "linear-gradient(135deg, rgba(11,17,32,0.96), rgba(15,23,42,0.96), rgba(2,6,23,0.98))",
        boxShadow: "0 18px 45px rgba(15,23,42,0.92)",
        border: "1px solid rgba(30,64,175,0.55)",
        fontSize: 12,
        textAlign: "left",
        lineHeight: 1.55,
      },
      testimonialName: { marginTop: 10, fontWeight: 800, fontSize: 12 },

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
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid rgba(30,64,175,0.65)",
        background:
          "linear-gradient(135deg, rgba(11,17,32,0.96), rgba(15,23,42,0.96), rgba(2,6,23,0.98))",
        width: "100%",
        maxWidth: 720,
        textAlign: "left",
      },
      faqHeader: {
        padding: "12px 14px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 800,
      },
      faqIcon: { fontSize: 18, fontWeight: 900, marginLeft: 8, opacity: 0.9 },
      faqBody: {
        padding: "0 14px 12px",
        fontSize: 12,
        background: "rgba(2,6,23,0.55)",
        borderTop: "1px solid rgba(30,64,175,0.45)",
        lineHeight: 1.55,
      },

      // FINAL CTA
      finalCard: {
        marginTop: 18,
        borderRadius: 24,
        padding: "22px 18px 24px",
        background: "rgba(15,23,42,0.92)",
        border: "1px solid rgba(30,64,175,0.75)",
        textAlign: "center",
        boxShadow: "0 24px 70px rgba(15,23,42,0.95)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
      },
      finalHeadline: { fontSize: 22, fontWeight: 950, marginBottom: 8 },
      finalSub: {
        fontSize: 13,
        opacity: 0.88,
        maxWidth: 620,
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
        maxWidth: 1120,
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
        background: "rgba(0,0,0,0.74)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 80,
        boxSizing: "border-box",
      },
      modalCard: {
        width: "100%",
        maxWidth: 460,
        background: "rgba(2,6,23,0.96)",
        borderRadius: 18,
        border: "1px solid rgba(30,64,175,0.75)",
        boxShadow: "0 24px 70px rgba(15,23,42,0.95)",
        padding: 20,
        fontSize: 13,
        boxSizing: "border-box",
        color: "#e5e7eb",
      },
      modalTitle: {
        fontSize: 18,
        fontWeight: 900,
        marginBottom: 6,
        textAlign: "center",
      },
      modalText: {
        fontSize: 12,
        opacity: 0.85,
        marginBottom: 12,
        textAlign: "center",
        lineHeight: 1.55,
      },
      modalButtonPrimary: {
        width: "100%",
        borderRadius: 12,
        border: "none",
        padding: "10px 12px",
        fontSize: 13,
        fontWeight: 900,
        background:
          "linear-gradient(130deg, #22d3ee, #0ea5e9, #0284c7 90%, #0f172a)",
        color: "#020617",
        cursor: "pointer",
        marginTop: 6,
        boxShadow: "0 16px 40px rgba(15,23,42,0.9)",
      },
      modalButtonSecondary: {
        width: "100%",
        borderRadius: 12,
        border: "1px solid rgba(30,64,175,0.75)",
        padding: "9px 12px",
        fontSize: 12,
        fontWeight: 700,
        background: "transparent",
        color: "#e5e7eb",
        cursor: "pointer",
        marginTop: 10,
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
        padding: 12,
        borderRadius: 12,
        background: "rgba(2,6,23,0.6)",
        border: "1px dashed rgba(34,211,238,0.55)",
        fontSize: 12,
        textAlign: "center",
        wordBreak: "break-word",
      },
      idLabel: { fontWeight: 900, marginBottom: 4, display: "block" },
      idValue: {
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        fontSize: 13,
        color: "#22d3ee",
      },
      idHint: { marginTop: 8, fontSize: 11, opacity: 0.82, lineHeight: 1.45 },

      // AI REPORT PREVIEW
      previewCard: {
        marginTop: 20,
        maxWidth: 520,
        width: "100%",
        borderRadius: 22,
        background: "rgba(2,6,23,0.55)",
        border: "1px solid rgba(148,163,184,0.35)",
        padding: 18,
        boxShadow: "0 18px 45px rgba(15,23,42,0.92)",
        textAlign: "left",
      },
      previewHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
      },
      previewTitle: { fontSize: 18, fontWeight: 900, color: "#f9fafb" },
      previewMeta: { fontSize: 12, color: "#9ca3af" },
      previewMetaSpacer: { marginTop: 2 },
      previewGradeBadge: {
        height: 38,
        width: 38,
        borderRadius: 999,
        background: "linear-gradient(180deg, #fde68a, #f59e0b)",
        color: "#020617",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 950,
        fontSize: 14,
        boxShadow: "0 12px 34px rgba(0,0,0,0.6)",
        flex: "0 0 auto",
      },
      previewSections: {
        marginTop: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      },
      previewSectionTitle: {
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: 0.16,
        color: "#cbd5f5",
        fontWeight: 900,
      },
      previewBars: { marginTop: 7, display: "flex", flexDirection: "column", gap: 5 },
      previewBar: (width) => ({
        height: 8,
        borderRadius: 999,
        background:
          "linear-gradient(90deg, rgba(34,211,238,0.75), rgba(14,165,233,0.25))",
        width,
      }),
      previewFooter: {
        marginTop: 14,
        fontSize: 10,
        color: "#6b7280",
        textAlign: "right",
      },

      // P&L VISUAL (mini calendar)
      pnlGridWrap: {
        width: "100%",
        maxWidth: 860,
        marginTop: 16,
        borderRadius: 22,
        background:
          "linear-gradient(135deg, rgba(2,6,23,0.55), rgba(15,23,42,0.75))",
        border: "1px solid rgba(30,64,175,0.55)",
        boxShadow: "0 18px 45px rgba(15,23,42,0.92)",
        padding: isMobile ? 14 : 16,
        textAlign: "left",
      },
      pnlTopRow: {
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "stretch" : "center",
        justifyContent: "space-between",
        gap: 10,
        marginBottom: 12,
      },
      pnlSummaryRow: {
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))",
        gap: 10,
      },
      pnlSummaryCard: {
        borderRadius: 16,
        padding: 12,
        background: "rgba(2,6,23,0.55)",
        border: "1px solid rgba(148,163,184,0.25)",
      },
      pnlSummaryLabel: {
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: 0.14,
        opacity: 0.8,
        marginBottom: 6,
        fontWeight: 900,
        color: "#a5b4fc",
      },
      pnlSummaryValue: { fontSize: 18, fontWeight: 950 },
      pnlSummarySub: { fontSize: 12, opacity: 0.82, marginTop: 2, lineHeight: 1.45 },

      pnlCalendar: {
        marginTop: 12,
        display: "grid",
        gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
        gap: 8,
      },
      pnlDow: {
        fontSize: 10,
        opacity: 0.75,
        textTransform: "uppercase",
        letterSpacing: 0.12,
        textAlign: "center",
        paddingBottom: 4,
      },
      pnlCell: (tone) => {
        let bg = "rgba(148,163,184,0.10)";
        let border = "rgba(148,163,184,0.20)";
        let glow = "transparent";
        if (tone === "win") {
          bg = "rgba(34,197,94,0.16)";
          border = "rgba(34,197,94,0.28)";
          glow = "rgba(34,197,94,0.12)";
        }
        if (tone === "loss") {
          bg = "rgba(251,113,133,0.14)";
          border = "rgba(251,113,133,0.24)";
          glow = "rgba(251,113,133,0.10)";
        }
        if (tone === "flat") {
          bg = "rgba(56,189,248,0.10)";
          border = "rgba(56,189,248,0.20)";
          glow = "rgba(56,189,248,0.08)";
        }
        return {
          borderRadius: 14,
          padding: "10px 10px",
          background: bg,
          border: `1px solid ${border}`,
          minHeight: 64,
          boxShadow: `0 10px 26px ${glow}`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          overflow: "hidden",
        };
      },
      pnlCellDay: { fontSize: 11, opacity: 0.8, fontWeight: 900 },
      pnlCellValue: { fontSize: 12, fontWeight: 900, marginTop: 6 },
      pnlCellRR: { fontSize: 10, opacity: 0.8 },

      // Legal modal body
      legalBody: {
        maxHeight: "60vh",
        overflowY: "auto",
        fontSize: 12,
        lineHeight: 1.55,
        textAlign: "left",
        marginTop: 8,
        paddingRight: 4,
      },
      legalHeading: { fontWeight: 900, marginTop: 10, marginBottom: 4, fontSize: 13 },

      // Terms checkbox
      checkboxRow: {
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        marginTop: 6,
        marginBottom: 6,
        fontSize: 11,
        lineHeight: 1.45,
        textAlign: "left",
      },
      checkboxInput: { marginTop: 2 },
      checkboxLabel: { opacity: 0.92 },
      checkboxLink: {
        color: "#22d3ee",
        textDecoration: "underline",
        textDecorationStyle: "dotted",
        cursor: "pointer",
        fontWeight: 900,
      },
    };
  }, [isMobile]);

  function openWorkspace() {
    if (onEnterApp) onEnterApp();
    else navigate("/workspace");
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

      // keep any prior local member info, but do not collect name/email here anymore
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

  function handleMemberPortalSubmit(e) {
    e.preventDefault();
    setMemberPortalError("");

    const trimmed = memberPortalId.trim();
    if (!trimmed) {
      setMemberPortalError("Please enter your Member ID.");
      return;
    }

    saveMemberToLocal({ memberId: trimmed, email: "", name: "" });
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
      q: "What’s the P&L Calendar for?",
      a: "It’s the accountability layer. You log your daily P&L and R:R so you can connect performance to execution. It helps you spot overtrading, revenge days, and whether your best days share a pattern.",
    },
    {
      q: "Does the AI understand BOS / CHoCH / FVG / liquidity?",
      a: "Yes. The prompts and training are built specifically around those concepts so it can talk in your language, not generic indicator spam.",
    },
  ];

  // Mini P&L mock data (just for the landing page graphic)
  const pnlDays = useMemo(() => {
    // 28 cells for a clean mini-month (4 weeks)
    // tone: win/loss/flat/neutral
    const cells = [
      { d: 1, v: "+$120", rr: "RR 2.1", tone: "win" },
      { d: 2, v: "−$40", rr: "RR 0.8", tone: "loss" },
      { d: 3, v: "+$80", rr: "RR 1.6", tone: "win" },
      { d: 4, v: "Flat", rr: "RR 1.0", tone: "flat" },
      { d: 5, v: "−$65", rr: "RR 0.9", tone: "loss" },
      { d: 6, v: "+$140", rr: "RR 2.4", tone: "win" },
      { d: 7, v: "+$55", rr: "RR 1.3", tone: "win" },

      { d: 8, v: "−$30", rr: "RR 0.7", tone: "loss" },
      { d: 9, v: "+$95", rr: "RR 1.8", tone: "win" },
      { d: 10, v: "+$60", rr: "RR 1.4", tone: "win" },
      { d: 11, v: "Flat", rr: "RR 1.0", tone: "flat" },
      { d: 12, v: "−$90", rr: "RR 0.6", tone: "loss" },
      { d: 13, v: "+$170", rr: "RR 2.6", tone: "win" },
      { d: 14, v: "+$40", rr: "RR 1.2", tone: "win" },

      { d: 15, v: "−$25", rr: "RR 0.8", tone: "loss" },
      { d: 16, v: "+$110", rr: "RR 2.0", tone: "win" },
      { d: 17, v: "+$70", rr: "RR 1.5", tone: "win" },
      { d: 18, v: "Flat", rr: "RR 1.0", tone: "flat" },
      { d: 19, v: "−$45", rr: "RR 0.9", tone: "loss" },
      { d: 20, v: "+$130", rr: "RR 2.2", tone: "win" },
      { d: 21, v: "+$20", rr: "RR 1.1", tone: "win" },

      { d: 22, v: "−$60", rr: "RR 0.7", tone: "loss" },
      { d: 23, v: "+$85", rr: "RR 1.7", tone: "win" },
      { d: 24, v: "+$50", rr: "RR 1.3", tone: "win" },
      { d: 25, v: "Flat", rr: "RR 1.0", tone: "flat" },
      { d: 26, v: "−$35", rr: "RR 0.8", tone: "loss" },
      { d: 27, v: "+$160", rr: "RR 2.5", tone: "win" },
      { d: 28, v: "+$75", rr: "RR 1.6", tone: "win" },
    ];
    return cells;
  }, []);

  function openCheckout() {
    setCheckoutError("");
    setMemberId("");
    setCheckoutAgreed(false);
    setShowCheckout(true);
  }

  function openMemberIdModal() {
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
  }

  return (
    <>
      {/* tiny CSS helpers (safe, responsive, improves tap feel) */}
      <style>{`
        * { box-sizing: border-box; }
        button { -webkit-tap-highlight-color: transparent; }
        @media (max-width: 420px) {
          .ribbonHideMobile { display:none !important; }
        }
      `}</style>

      <div style={styles.page}>
        {/* TOP RIBBON */}
        <div style={styles.ribbon}>
          <div style={styles.ribbonInner}>
            <span style={styles.ribbonText} className="ribbonHideMobile">
              <span style={styles.ribbonStrong}>
                Monthly access · {PRICE_SHORT}:
              </span>{" "}
              your private portal + AI feedback + daily journal + P&amp;L calendar.
            </span>
            <button style={styles.ribbonBtn} onClick={openCheckout}>
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
              <span style={styles.navPill}>Screenshot + journal traders</span>
              <button style={styles.navLinkBtn} onClick={openMemberIdModal}>
                Enter Member ID
              </button>
              <button style={styles.navPrimaryBtn} onClick={openCheckout}>
                {PRICE_SHORT}
              </button>
            </div>
          </div>
        </div>

        {/* SUCCESS BANNER AFTER STRIPE REDIRECT */}
        {checkoutSuccess && (
          <div
            style={{
              background: "rgba(2,44,34,0.9)",
              borderBottom: "1px solid rgba(34,197,94,0.6)",
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
            <div style={styles.heroEyebrow}>Real feedback, not random signals</div>

            <h1 style={styles.heroHeadline}>
              Turn every screenshot into{" "}
              <span style={styles.heroHighlight}>a trade you actually learn from.</span>
            </h1>

            <p style={styles.heroSub}>
              MaxTradeAI is your private workspace for trade screenshots, AI feedback,
              a daily journal, and a P&amp;L calendar. Upload your chart, explain your
              idea, and get a breakdown like a coach is sitting next to you — for
              NASDAQ, indices, FX, and gold.
            </p>

            <div
              style={{
                width: "100%",
                maxWidth: 820,
                marginTop: 4,
                padding: "10px 12px",
                borderRadius: 16,
                border: "1px solid rgba(34,211,238,0.22)",
                background: "rgba(2,6,23,0.40)",
                fontSize: 11,
                opacity: 0.86,
                lineHeight: 1.45,
              }}
            >
              <strong>Important:</strong> Educational use only — not financial advice.
              AI can be wrong or incomplete, and you are fully responsible for your
              trading decisions.
            </div>

            <div style={styles.heroBtnRow}>
              <button style={styles.heroPrimaryBtn} onClick={openCheckout}>
                {PRICE_CTA_LONG}
              </button>
              <button style={styles.heroSecondaryBtn} onClick={openMemberIdModal}>
                Enter Member ID
              </button>
            </div>

            <div style={styles.heroTertiary}>
              {PRICE_SHORT} subscription. Your trades stay organized per day — with
              results tracked, not just screenshots saved.
            </div>

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
            <div style={styles.sectionEyebrow}>The results speak for themselves</div>

            <div style={{ maxWidth: 760 }}>
              <h2 style={styles.sectionTitle}>Study your own data like a professional.</h2>
              <p style={styles.sectionSub}>
                Every trade, note, and lesson is saved to your personal timeline.
                Stop guessing and start reviewing execution day by day — with the
                P&amp;L calendar making patterns obvious.
              </p>
              <div style={{ fontSize: 12, opacity: 0.78, marginTop: 10 }}>
                Traders use MaxTradeAI to <strong>grade trades</strong>, <strong>journal daily</strong>,
                and <strong>track P&amp;L + R:R</strong> — for {PRICE_SHORT}.
              </div>
            </div>

            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={styles.statNumber}>200+</div>
                <div style={styles.statLabel}>sessions reviewed by AI</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statNumber}>A–F</div>
                <div style={styles.statLabel}>grade scale for each submission</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statNumber}>ICT / TJR / SMC</div>
                <div style={styles.statLabel}>
                  BOS, CHoCH, FVG, OB, liquidity sweeps
                </div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statNumber}>P&amp;L + R:R</div>
                <div style={styles.statLabel}>see totals + averages per month</div>
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
              Screenshots in random folders, scattered notes, and no performance tracking
              makes it impossible to improve fast. MaxTradeAI ties it all together.
            </p>

            <div style={styles.problemsGrid}>
              <div style={styles.problemCard}>
                <div style={styles.problemTag}>
                  <span>●</span>
                  <span>Problem #1</span>
                </div>
                <div style={styles.problemTitle}>
                  &ldquo;I don&apos;t know why my trades keep failing.&rdquo;
                </div>
                <div style={styles.problemText}>
                  Get a clear breakdown of what went right, what went wrong, and what to
                  do next time — based on your screenshot + your plan.
                </div>
              </div>

              <div style={styles.problemCard}>
                <div style={styles.problemTag}>
                  <span>●</span>
                  <span>Problem #2</span>
                </div>
                <div style={styles.problemTitle}>
                  &ldquo;I forget what happened on my past trades.&rdquo;
                </div>
                <div style={styles.problemText}>
                  Your journal saves daily so you can jump between dates and see your
                  progress (and your mistakes) without digging through camera roll.
                </div>
              </div>

              <div style={styles.problemCard}>
                <div style={styles.problemTag}>
                  <span>●</span>
                  <span>Problem #3</span>
                </div>
                <div style={styles.problemTitle}>
                  &ldquo;Nothing ties back to rules or results.&rdquo;
                </div>
                <div style={styles.problemText}>
                  The P&amp;L calendar connects performance to execution. You&apos;ll see
                  what your best days have in common — and what your worst days share.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AI REPORT PREVIEW SECTION */}
        <section style={styles.section}>
          <div style={styles.sectionInner}>
            <div style={styles.sectionEyebrow}>How your feedback looks</div>
            <h2 style={styles.sectionTitle}>A clean, structured report for each trade.</h2>

            <div style={styles.previewCard}>
              <div style={styles.previewHeader}>
                <div>
                  <div style={styles.previewTitle}>Trade Coach AI</div>
                  <div style={{ ...styles.previewMeta, ...styles.previewMetaSpacer }}>
                    Gold Futures · 5m
                  </div>
                  <div style={{ ...styles.previewMeta, ...styles.previewMetaSpacer }}>
                    Confidence: 75%
                  </div>
                </div>
                <div style={styles.previewGradeBadge}>A–F</div>
              </div>

              <div style={styles.previewSections}>
                <div>
                  <div style={styles.previewSectionTitle}>What went right</div>
                  <div style={styles.previewBars}>
                    <div style={styles.previewBar("82%")} />
                    <div style={styles.previewBar("58%")} />
                  </div>
                </div>

                <div>
                  <div style={styles.previewSectionTitle}>What went wrong</div>
                  <div style={styles.previewBars}>
                    <div style={styles.previewBar("86%")} />
                    <div style={styles.previewBar("72%")} />
                    <div style={styles.previewBar("48%")} />
                  </div>
                </div>

                <div>
                  <div style={styles.previewSectionTitle}>Improvements</div>
                  <div style={styles.previewBars}>
                    <div style={styles.previewBar("80%")} />
                    <div style={styles.previewBar("64%")} />
                  </div>
                </div>

                <div>
                  <div style={styles.previewSectionTitle}>Lesson learned</div>
                  <div style={styles.previewBars}>
                    <div style={styles.previewBar("74%")} />
                  </div>
                </div>
              </div>

              <div style={styles.previewFooter}>
                Example preview — your real reports show full text inside the app.
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
            <div style={styles.sectionEyebrow}>Inside your MaxTradeAI portal</div>
            <h2 style={styles.sectionTitle}>
              Everything you need to self-coach trades — in one place.
            </h2>

            <div style={styles.checklistGrid}>
              <div style={styles.checklistCol}>
                <div style={styles.checklistTitle}>What you get</div>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, lineHeight: 1.6 }}>
                  <li>AI feedback that grades every trade you upload.</li>
                  <li>Breakdown of what you executed well vs. what you missed.</li>
                  <li>Clear “next time, do this” suggestions so you know what to practice.</li>
                  <li>Daily journal section for psychology, discipline, and rules.</li>
                  <li>
                    P&amp;L calendar to track <strong>results + R:R</strong> and build consistency.
                  </li>
                  <li>Private Member ID workspace tied to your trades — not anyone else’s.</li>
                </ul>
              </div>

              <div style={styles.checklistCol}>
                <div style={styles.checklistTitle}>MaxTradeAI vs the usual</div>

                <div style={styles.checklistItemRow}>
                  <span style={styles.checklistLabel}>Actually reviews your trades</span>
                  <div style={styles.checklistChecks}>
                    <span style={styles.checklistYes}>MaxTrade ✓</span>
                    <span style={styles.checklistNo}>Random group ✕</span>
                  </div>
                </div>

                <div style={styles.checklistItemRow}>
                  <span style={styles.checklistLabel}>Journal stays tied to the date</span>
                  <div style={styles.checklistChecks}>
                    <span style={styles.checklistYes}>MaxTrade ✓</span>
                    <span style={styles.checklistNo}>Notes app ✕</span>
                  </div>
                </div>

                <div style={styles.checklistItemRow}>
                  <span style={styles.checklistLabel}>Understands liquidity concepts</span>
                  <div style={styles.checklistChecks}>
                    <span style={styles.checklistYes}>MaxTrade ✓</span>
                    <span style={styles.checklistNo}>Generic AI ✕</span>
                  </div>
                </div>

                <div style={styles.checklistItemRow}>
                  <span style={styles.checklistLabel}>Tracks P&amp;L + R:R patterns</span>
                  <div style={styles.checklistChecks}>
                    <span style={styles.checklistYes}>MaxTrade ✓</span>
                    <span style={styles.checklistNo}>Camera roll ✕</span>
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
              What traders say after switching to structured review.
            </h2>
            <p style={styles.sectionSub}>
              The goal is simple: stop repeating the same mistakes and build a process
              that holds up day after day.
            </p>

            <div style={styles.testimonialGrid}>
              <div style={styles.testimonialCard}>
                &ldquo;Instead of having no clue why my stop loss was hit, I get a clear
                grade and a list of mistakes to fix. I’m finally building confidence in my
                setups.&rdquo;
                <div style={styles.testimonialName}>— Index &amp; FX trader</div>
              </div>
              <div style={styles.testimonialCard}>
                &ldquo;The P&amp;L calendar made it obvious which days I was revenge trading.
                Fixing that alone changed my whole month.&rdquo;
                <div style={styles.testimonialName}>— NAS100 day trader</div>
              </div>
              <div style={styles.testimonialCard}>
                &ldquo;The AI speaks in BOS / CHoCH / FVG language, so it feels like someone
                who actually trades liquidity is reviewing my charts.&rdquo;
                <div style={styles.testimonialName}>— ICT-focused trader</div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section style={styles.section}>
          <div style={styles.sectionInner}>
            <div style={styles.sectionEyebrow}>FAQs</div>
            <h2 style={styles.sectionTitle}>Get answers before you start.</h2>
            <p style={styles.sectionSub}>
              Common questions traders ask before getting instant access.
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
                        <p style={{ marginTop: 10, marginBottom: 4 }}>{item.a}</p>
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
                Improve one screenshot at a time — and prove it with your calendar.
              </h2>
              <p style={styles.finalSub}>
                Get instant access for <strong>{PRICE_SHORT}</strong>. Upload your next
                trade, explain your idea, and get structured feedback — then log your
                result and R:R to build real consistency.
              </p>

              <button style={styles.heroPrimaryBtn} onClick={openCheckout}>
                {PRICE_BUTTON}
              </button>

              <div style={{ fontSize: 11, opacity: 0.76, maxWidth: 560, marginTop: 12, lineHeight: 1.5 }}>
                MaxTradeAI does not guarantee profits or outcomes. AI feedback is fallible.
                Always use your own judgment and risk management.
                <br />
                <br />
                Contact: orbitalbiz1@gmail.com
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
            <div style={{ fontSize: 11, opacity: 0.7, maxWidth: 760, marginTop: 4, lineHeight: 1.45 }}>
              Educational use only. Nothing on this site or in the app is financial advice.
              AI-generated feedback can be inaccurate or incomplete, and you are responsible
              for any trades you place.
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
              You&apos;ll enter your details directly in Stripe Checkout. This is a{" "}
              <strong>{PRICE_SHORT}</strong> subscription for access to your portal.
              <br />
              <br />
              <span style={{ fontSize: 11, opacity: 0.86 }}>
                By continuing, you acknowledge MaxTradeAI is educational only, AI can make
                mistakes, and you are responsible for your own decisions.
              </span>
            </div>

            <form onSubmit={handleCheckoutSubmit}>
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
                  opacity: checkoutLoading ? 0.75 : 1,
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
                placeholder="Member ID (e.g. MT-ABC123)"
                value={memberPortalId}
                onChange={(e) => setMemberPortalId(e.target.value)}
                style={{
                  width: "100%",
                  borderRadius: 12,
                  border: "1px solid rgba(30,64,175,0.75)",
                  background: "rgba(2,6,23,0.65)",
                  color: "#e5e7eb",
                  padding: "10px 12px",
                  fontSize: 13,
                  marginBottom: 10,
                  outline: "none",
                }}
                required
              />

              {memberPortalError && <div style={styles.modalError}>{memberPortalError}</div>}

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
            <div style={styles.modalText}>How MaxTradeAI handles your information.</div>
            <div style={styles.legalBody}>
              <div style={styles.legalHeading}>1. Information You Provide</div>
              <p>
                When you use MaxTradeAI, you may upload screenshots, enter notes, and
                provide basic details like your name and email. This information is used
                to generate AI feedback and maintain your personal workspace.
              </p>

              <div style={styles.legalHeading}>2. How We Use Your Data</div>
              <p>
                We use your data to operate the app, generate educational feedback on your
                trades, and keep your journal and history organized. We do not sell your data.
              </p>

              <div style={styles.legalHeading}>3. AI & Third-Party Services</div>
              <p>
                Your charts and notes may be processed by third-party AI providers solely for
                generating feedback. We take reasonable steps to protect data, but no system
                is 100% secure.
              </p>

              <div style={styles.legalHeading}>4. Storage & Security</div>
              <p>
                Some information may be stored locally in your browser or on our servers. Avoid
                uploading highly sensitive personal or financial account information.
              </p>

              <div style={styles.legalHeading}>5. Your Choices</div>
              <p>
                You can stop using the app at any time. If you&apos;d like data removed, contact
                us and we&apos;ll make reasonable efforts to delete it where technically and legally possible.
              </p>

              <div style={styles.legalHeading}>6. Changes to This Policy</div>
              <p>
                We may update this policy over time. If we make material changes, we&apos;ll update
                the effective date and may provide notice in the app.
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
                MaxTradeAI is for educational and informational purposes only. It does not provide
                financial, investment, legal, tax, or professional advice of any kind.
              </p>

              <div style={styles.legalHeading}>2. No Financial Advice</div>
              <p>
                Nothing in the app should be interpreted as a recommendation to buy, sell, or hold
                any security, currency, or financial instrument. You are solely responsible for trades you place.
              </p>

              <div style={styles.legalHeading}>3. AI-Generated Content</div>
              <p>
                Feedback is generated using AI based on the screenshots and notes you provide. AI can misunderstand
                charts, miss details, or generate inaccurate information. Never treat AI feedback as guaranteed truth.
              </p>

              <div style={styles.legalHeading}>4. User Responsibility</div>
              <p>
                You are responsible for providing accurate info, managing risk, and verifying ideas before acting.
                You trade at your own risk.
              </p>

              <div style={styles.legalHeading}>5. Limitation of Liability</div>
              <p>
                To the fullest extent permitted by law, MaxTradeAI and its operators are not liable for losses or damages
                arising from your use of the app, including trading losses or missed opportunities.
              </p>

              <div style={styles.legalHeading}>6. No Warranties</div>
              <p>
                The app is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind.
              </p>

              <div style={styles.legalHeading}>7. Changes to Terms</div>
              <p>
                We may update these terms over time. Continued use after changes means you accept the updated terms.
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
                MaxTradeAI cannot guarantee accuracy of AI-generated feedback, nor can it guarantee profits,
                improvement, or outcomes. You may lose money trading.
              </p>

              <div style={styles.legalHeading}>2. AI Limitations</div>
              <p>
                Even with clear screenshots, AI can misinterpret context or miss key points. Treat feedback as an
                extra opinion — not a signal service or rulebook.
              </p>

              <div style={styles.legalHeading}>3. Your Decisions</div>
              <p>
                Trades you place are your decisions and responsibility. Use your own judgment and risk management.
              </p>

              <div style={styles.legalHeading}>4. Educational Framing</div>
              <p>
                Think of MaxTradeAI like a practice tool. It helps you reflect on process — not tell you exactly
                what to do in markets.
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
