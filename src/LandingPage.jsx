import { useState } from "react";
import { useNavigate } from "react-router-dom";

const CREATE_MEMBER_WEBHOOK =
  import.meta.env?.VITE_N8N_TRADECOACH_CREATE_MEMBER ||
  "https://jacobtf007.app.n8n.cloud/webhook/tradecoach_create_member";

const MEMBER_LS_KEY = "tc_member_v1";

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
  const [checkoutForm, setCheckoutForm] = useState({ name: "", email: "" });
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [memberId, setMemberId] = useState("");

  const [showMemberPortal, setShowMemberPortal] = useState(false);
  const [memberPortalId, setMemberPortalId] = useState("");
  const [memberPortalError, setMemberPortalError] = useState("");

  const currentYear = new Date().getFullYear();
  const isMobile =
    typeof window !== "undefined" ? window.innerWidth <= 768 : false;

  const styles = {
    // PAGE
    page: {
      minHeight: "100vh",
      background:
        "radial-gradient(circle at top, #18253d 0, #05070c 55%, #020308 100%)",
      color: "#e7ecf2",
      display: "flex",
      alignItems: "stretch",
      justifyContent: "center",
      padding: "24px 16px 32px",
      fontFamily:
        '-apple-system, BlinkMacSystemFont, system-ui, -system-ui, "SF Pro Text", sans-serif',
      boxSizing: "border-box",
    },
    shell: {
      width: "100%",
      maxWidth: 1160,
      display: "flex",
      flexDirection: "column",
      gap: 20,
    },

    // HEADER / NAV
    nav: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "4px 4px 0",
      marginBottom: 4,
    },
    logoRow: {
      display: "flex",
      alignItems: "center",
      gap: 10,
    },
    logoDot: {
      width: 26,
      height: 26,
      borderRadius: 999,
      background:
        "conic-gradient(from 210deg, #1b9aaa, #38d5ff, #1b9aaa, #1b9aaa)",
      boxShadow: "0 0 0 1px rgba(0,0,0,0.7), 0 0 16px rgba(27,154,170,0.7)",
    },
    logoTextMain: {
      fontSize: 16,
      fontWeight: 900,
      letterSpacing: 0.4,
    },
    logoSub: {
      fontSize: 11,
      fontWeight: 500,
      opacity: 0.7,
    },
    navLinks: {
      display: "flex",
      alignItems: "center",
      gap: 18,
      fontSize: 12,
      opacity: 0.9,
    },
    navLink: {
      cursor: "pointer",
      opacity: 0.8,
      borderBottom: "1px solid transparent",
      paddingBottom: 2,
      transition: "opacity 0.18s ease, border-color 0.18s ease",
    },
    navCTA: {
      borderRadius: 999,
      border: "none",
      background:
        "linear-gradient(135deg, #1b9aaa, #30d3ff, #1b9aaa 80%, #158593)",
      padding: "7px 16px",
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer",
      color: "#05080c",
      boxShadow:
        "0 10px 22px rgba(0,0,0,0.8), 0 0 14px rgba(48,211,255,0.4)",
      display: "flex",
      alignItems: "center",
      gap: 6,
    },

    // HERO WRAPPER (like Tier11)
    heroSection: {
      width: "100%",
      background: "rgba(7,12,20,0.96)",
      borderRadius: 26,
      border: "1px solid rgba(36,48,67,0.9)",
      boxShadow: "0 32px 90px rgba(0,0,0,0.75)",
      padding: isMobile ? 18 : 26,
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      gap: isMobile ? 22 : 30,
      boxSizing: "border-box",
    },
    heroLeft: {
      flex: 1.4,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      gap: 14,
    },
    heroRight: {
      flex: 1,
      background:
        "linear-gradient(140deg, #05080f 0%, #05080f 55%, #071321 100%)",
      borderRadius: 20,
      border: "1px solid #243043",
      padding: 18,
      display: "flex",
      flexDirection: "column",
      gap: 12,
      fontSize: 13,
      boxShadow: "0 18px 60px rgba(0,0,0,0.7)",
    },

    badgeRow: {
      display: "flex",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 2,
    },
    badge: {
      fontSize: 11,
      padding: "4px 10px",
      borderRadius: 999,
      border: "1px solid #243043",
      background: "rgba(5,8,15,0.9)",
      textTransform: "uppercase",
      letterSpacing: 0.14,
      opacity: 0.9,
    },
    heroHeadline: {
      fontSize: isMobile ? 26 : 34,
      fontWeight: 900,
      letterSpacing: -0.4,
      lineHeight: 1.1,
    },
    heroAccent: {
      fontWeight: 900,
      background:
        "linear-gradient(120deg, #ffffff, #e3f8ff, #76e4ff, #ffffff 90%)",
      WebkitBackgroundClip: "text",
      color: "transparent",
    },
    heroSub: {
      fontSize: 14,
      opacity: 0.85,
      maxWidth: 520,
    },

    featureList: {
      listStyle: "none",
      padding: 0,
      margin: "4px 0 10px",
      fontSize: 13,
      display: "flex",
      flexDirection: "column",
      gap: 6,
    },
    featureItem: {
      display: "flex",
      alignItems: "flex-start",
      gap: 8,
    },
    featureBullet: {
      fontSize: 15,
      lineHeight: "19px",
      color: "#1b9aaa",
      marginTop: 1,
    },

    ctaRow: {
      display: "flex",
      flexWrap: "wrap",
      gap: 10,
      alignItems: "center",
      marginTop: 6,
    },
    primaryBtn: {
      borderRadius: 999,
      border: "none",
      background:
        "linear-gradient(135deg, #1b9aaa, #30d3ff, #1b9aaa 80%, #158593)",
      padding: "10px 20px",
      fontSize: 14,
      fontWeight: 800,
      cursor: "pointer",
      color: "#05080c",
      boxShadow:
        "0 12px 30px rgba(0,0,0,0.8), 0 0 20px rgba(48,211,255,0.5)",
      display: "flex",
      alignItems: "center",
      gap: 8,
    },
    ghostBtn: {
      borderRadius: 999,
      border: "1px solid #243043",
      background: "transparent",
      padding: "9px 16px",
      fontSize: 13,
      cursor: "pointer",
      color: "#e7ecf2",
      display: "flex",
      alignItems: "center",
      gap: 6,
    },
    ctaHint: {
      fontSize: 11,
      opacity: 0.7,
      marginTop: 4,
    },

    // RIGHT: PRICING / WHAT YOU GET
    priceLabel: {
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 0.14,
      opacity: 0.7,
    },
    priceTag: {
      fontSize: 22,
      fontWeight: 900,
      margin: "2px 0 4px",
    },
    priceSub: {
      fontSize: 12,
      opacity: 0.8,
      marginBottom: 10,
    },
    rightDivider: {
      height: 1,
      width: "100%",
      background: "linear-gradient(90deg, transparent, #243043, transparent)",
      margin: "6px 0 8px",
    },
    miniHeading: {
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 0.16,
      opacity: 0.75,
      marginBottom: 4,
    },
    checklist: {
      listStyle: "none",
      padding: 0,
      margin: 0,
      display: "flex",
      flexDirection: "column",
      gap: 6,
    },
    checkItem: {
      display: "flex",
      alignItems: "flex-start",
      gap: 8,
    },
    checkIcon: {
      fontSize: 13,
      lineHeight: "18px",
      color: "#4dd4ff",
      marginTop: 1,
    },
    checkText: {
      fontSize: 13,
      opacity: 0.9,
    },
    tagRow: {
      display: "flex",
      flexWrap: "wrap",
      gap: 6,
      marginTop: 6,
    },
    tagPill: {
      padding: "3px 8px",
      borderRadius: 999,
      border: "1px solid #243043",
      fontSize: 11,
      opacity: 0.85,
    },
    tinyMuted: {
      fontSize: 11,
      opacity: 0.7,
      marginTop: 6,
    },

    // LOWER ROW (HOW IT WORKS + COMPARISON)
    lowerRow: {
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      gap: 18,
      marginTop: 6,
    },
    lowerCard: {
      flex: 1,
      background: "rgba(7,11,18,0.98)",
      borderRadius: 18,
      border: "1px solid #161f2b",
      padding: 16,
      fontSize: 13,
      boxShadow: "0 18px 60px rgba(0,0,0,0.55)",
    },
    lowerTitle: {
      fontSize: 13,
      textTransform: "uppercase",
      letterSpacing: 0.16,
      opacity: 0.75,
      marginBottom: 4,
    },
    lowerBig: {
      fontSize: 17,
      fontWeight: 700,
      marginBottom: 8,
    },
    stepList: {
      listStyle: "none",
      padding: 0,
      margin: 0,
      display: "flex",
      flexDirection: "column",
      gap: 6,
    },
    stepItem: {
      display: "flex",
      alignItems: "flex-start",
      gap: 10,
    },
    stepBadge: {
      width: 20,
      height: 20,
      borderRadius: 999,
      border: "1px solid #243043",
      background: "#05080f",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 11,
      opacity: 0.85,
      marginTop: 1,
    },
    stepText: {
      fontSize: 13,
      opacity: 0.9,
    },

    // COMPARISON CHECKLIST – more polished
    compareGrid: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      marginTop: 8,
    },
    compareRow: {
      display: "flex",
      justifyContent: "space-between",
      gap: 10,
      padding: "8px 10px",
      borderRadius: 12,
      border: "1px solid #1c2736",
      background:
        "linear-gradient(135deg, rgba(5,8,15,0.96), rgba(12,21,33,0.96))",
      alignItems: "center",
    },
    compareLabelWrap: {
      maxWidth: "60%",
      fontSize: 12,
      opacity: 0.9,
    },
    compareChecks: {
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
      gap: 2,
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 0.12,
      minWidth: 120,
    },
    compareYes: {
      color: "#4de2ff",
      display: "flex",
      justifyContent: "flex-end",
      gap: 4,
    },
    compareNo: {
      color: "#ff9ba8",
      opacity: 0.9,
      display: "flex",
      justifyContent: "flex-end",
      gap: 4,
    },

    // FOOTER
    footer: {
      marginTop: 18,
      paddingTop: 14,
      borderTop: "1px solid rgba(21,31,43,0.8)",
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      alignItems: isMobile ? "flex-start" : "center",
      justifyContent: "space-between",
      gap: 10,
      fontSize: 11,
      opacity: 0.7,
    },
    footerLinks: {
      display: "flex",
      flexWrap: "wrap",
      gap: 10,
    },
    footerLink: {
      cursor: "pointer",
      textDecoration: "underline",
      textDecorationThickness: 0.6,
    },

    // MODALS
    overlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px",
      zIndex: 80,
      boxSizing: "border-box",
    },
    modalCard: {
      width: "100%",
      maxWidth: 420,
      background: "#111823",
      borderRadius: 16,
      border: "1px solid #252f40",
      boxShadow: "0 24px 70px rgba(0,0,0,0.8)",
      padding: 20,
      fontSize: 13,
      boxSizing: "border-box",
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
    input: {
      width: "100%",
      borderRadius: 10,
      border: "1px solid #243043",
      background: "#05080f",
      color: "#e7ecf2",
      padding: "8px 10px",
      fontSize: 13,
      marginBottom: 8,
      boxSizing: "border-box",
    },
    modalButtonPrimary: {
      width: "100%",
      borderRadius: 10,
      border: "none",
      padding: "9px 12px",
      fontSize: 13,
      fontWeight: 700,
      background:
        "linear-gradient(130deg, #1b9aaa, #30d3ff, #1b9aaa 90%, #158593)",
      color: "#05080c",
      cursor: "pointer",
      marginTop: 4,
    },
    modalButtonSecondary: {
      width: "100%",
      borderRadius: 10,
      border: "1px solid #243043",
      padding: "8px 12px",
      fontSize: 12,
      fontWeight: 500,
      background: "transparent",
      color: "#e7ecf2",
      cursor: "pointer",
      marginTop: 8,
    },
    modalError: {
      fontSize: 11,
      color: "#ff9ba8",
      marginTop: 4,
      textAlign: "center",
    },
    idBox: {
      marginTop: 10,
      padding: 10,
      borderRadius: 10,
      background: "#05080f",
      border: "1px dashed #243043",
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
    },
    idHint: {
      marginTop: 6,
      fontSize: 11,
      opacity: 0.8,
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
    setCheckoutLoading(true);

    try {
      if (!checkoutForm.name || !checkoutForm.email) {
        throw new Error("Please enter your name and email.");
      }

      const res = await fetch(CREATE_MEMBER_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: checkoutForm.name,
          email: checkoutForm.email,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Create member failed:", res.status, text);
        throw new Error("Could not create your member ID. Try again.");
      }

      const data = await res.json();
      const generatedId = data.memberId;

      if (!generatedId) {
        throw new Error("Server did not return a member ID.");
      }

      setMemberId(generatedId);

      saveMemberToLocal({
        memberId: generatedId,
        email: data.email || checkoutForm.email,
        name: data.name || checkoutForm.name,
        plan: data.plan || "personal",
        createdAt: data.createdAt || new Date().toISOString(),
      });
    } catch (err) {
      console.error(err);
      setCheckoutError(err?.message || "Something went wrong.");
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

  return (
    <>
      <div style={styles.page}>
        <div style={styles.shell}>
          {/* HEADER / NAV */}
          <div style={styles.nav}>
            <div style={styles.logoRow}>
              <div style={styles.logoDot} />
              <div>
                <div style={styles.logoTextMain}>Max Trade Coach</div>
                <div style={styles.logoSub}>
                  AI trade review · daily journal for ICT / liquidity traders
                </div>
              </div>
            </div>

            <div style={styles.navLinks}>
              <span style={styles.navLink}>Product</span>
              <span style={styles.navLink}>How it works</span>
              <span style={styles.navLink}>Pricing</span>
              <button
                style={styles.navCTA}
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
                Member login →
              </button>
            </div>
          </div>

          {/* HERO SECTION */}
          <section style={styles.heroSection}>
            {/* LEFT: TEXT + CTA */}
            <div style={styles.heroLeft}>
              <div style={styles.badgeRow}>
                <span style={styles.badge}>Built for day traders</span>
                <span style={styles.badge}>Screenshots · feedback · journal</span>
              </div>

              <h1 style={styles.heroHeadline}>
                Unlock your trading potential{" "}
                <span style={styles.heroAccent}>
                  with a personal AI trade coach.
                </span>
              </h1>

              <p style={styles.heroSub}>
                Max Trade Coach is your private workspace for trade screenshots,
                AI feedback, and a daily journal. Upload a chart, explain what
                you were thinking, and get a breakdown like a mentor is sitting
                next to you.
              </p>

              <ul style={styles.featureList}>
                <li style={styles.featureItem}>
                  <span style={styles.featureBullet}>●</span>
                  <span>
                    <strong>Understands Smart Money concepts:</strong> BOS / CHoCH,
                    FVGs, OBs, liquidity sweeps, sessions, risk and execution —
                    not random indicator spam.
                  </span>
                </li>
                <li style={styles.featureItem}>
                  <span style={styles.featureBullet}>●</span>
                  <span>
                    <strong>Every session saved to a timeline:</strong> trades +
                    notes are tied to your date and Member ID so you can review
                    any session in seconds.
                  </span>
                </li>
                <li style={styles.featureItem}>
                  <span style={styles.featureBullet}>●</span>
                  <span>
                    <strong>Built for self-coached traders:</strong> not a signal
                    group, not a course — a tool that forces you to think,
                    journal, and improve.
                  </span>
                </li>
              </ul>

              <div style={styles.ctaRow}>
                <button
                  style={styles.primaryBtn}
                  onClick={() => {
                    setCheckoutForm({ name: "", email: "" });
                    setCheckoutError("");
                    setMemberId("");
                    setShowCheckout(true);
                  }}
                >
                  Get started → open my portal
                </button>

                <button
                  style={styles.ghostBtn}
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
                </button>
              </div>

              <div style={styles.ctaHint}>
                You get a private portal where screenshots, feedback, and journal
                entries are saved per day — so you can study your own data, not
                someone else&apos;s.
              </div>
            </div>

            {/* RIGHT: PRICING + WHAT YOU GET + WHY NOT JUST... */}
            <aside style={styles.heroRight}>
              <div>
                <div style={styles.priceLabel}>Membership</div>
                <div style={styles.priceTag}>$XX / month</div>
                <div style={styles.priceSub}>
                  One personal workspace. Unlimited screenshot reviews and daily
                  journal entries.
                </div>
              </div>

              <div style={styles.rightDivider} />

              <div>
                <div style={styles.miniHeading}>What you get</div>
                <ul style={styles.checklist}>
                  <li style={styles.checkItem}>
                    <span style={styles.checkIcon}>✓</span>
                    <span style={styles.checkText}>
                      AI feedback that grades your trade, highlights what you did
                      well, and calls out execution mistakes.
                    </span>
                  </li>
                  <li style={styles.checkItem}>
                    <span style={styles.checkIcon}>✓</span>
                    <span style={styles.checkText}>
                      Daily journal built-in — track psychology, discipline, and
                      rules for each session.
                    </span>
                  </li>
                  <li style={styles.checkItem}>
                    <span style={styles.checkIcon}>✓</span>
                    <span style={styles.checkText}>
                      Private Member ID workspace — your trades stay organized,
                      not lost in your camera roll or Discord.
                    </span>
                  </li>
                </ul>

                <div style={styles.tagRow}>
                  <span style={styles.tagPill}>NASDAQ · S&amp;P · US30</span>
                  <span style={styles.tagPill}>GBP/USD · XAU/USD · FX</span>
                  <span style={styles.tagPill}>Crypto pairs</span>
                </div>
              </div>

              <div style={styles.rightDivider} />

              <div>
                <div style={styles.miniHeading}>Why not just use…</div>
                <ul style={styles.checklist}>
                  <li style={styles.checkItem}>
                    <span style={styles.checkIcon}>✕</span>
                    <span style={styles.checkText}>
                      <strong>Random Discord signals:</strong> no context, no
                      journaling, no accountability.
                    </span>
                  </li>
                  <li style={styles.checkItem}>
                    <span style={styles.checkIcon}>✕</span>
                    <span style={styles.checkText}>
                      <strong>Plain screenshot folders:</strong> zero notes,
                      zero structure — you never review them.
                    </span>
                  </li>
                  <li style={styles.checkItem}>
                    <span style={styles.checkIcon}>✕</span>
                    <span style={styles.checkText}>
                      <strong>Generic journaling apps:</strong> they don&apos;t
                      see your chart or understand BOS / FVG / liquidity.
                    </span>
                  </li>
                </ul>
              </div>

              <div style={styles.tinyMuted}>
                Max Trade Coach is for traders who actually want to get better —
                not just hunt the next &quot;alpha call.&quot;
              </div>
            </aside>
          </section>

          {/* LOWER ROW: HOW IT WORKS + COMPARISON */}
          <section style={styles.lowerRow}>
            {/* HOW IT WORKS */}
            <div style={styles.lowerCard}>
              <div style={styles.lowerTitle}>How Max Trade Coach works</div>
              <div style={styles.lowerBig}>
                Four simple steps every time you trade.
              </div>
              <ul style={styles.stepList}>
                <li style={styles.stepItem}>
                  <div style={styles.stepBadge}>1</div>
                  <div style={styles.stepText}>
                    <strong>Upload a screenshot</strong> of the chart you traded
                    (entry, TP, SL — or the setup you&apos;re considering).
                  </div>
                </li>
                <li style={styles.stepItem}>
                  <div style={styles.stepBadge}>2</div>
                  <div style={styles.stepText}>
                    <strong>Tell the coach what you saw:</strong> pair,
                    timeframe, session, liquidity sweep, FVG/OB, bias, target,
                    and risk plan.
                  </div>
                </li>
                <li style={styles.stepItem}>
                  <div style={styles.stepBadge}>3</div>
                  <div style={styles.stepText}>
                    <strong>Get graded feedback:</strong> Max Trade Coach
                    returns a grade, what went right/wrong, and what to focus on
                    next time.
                  </div>
                </li>
                <li style={styles.stepItem}>
                  <div style={styles.stepBadge}>4</div>
                  <div style={styles.stepText}>
                    <strong>Journal the day:</strong> log what you learned, where
                    you tilted, and one improvement for the next session.
                  </div>
                </li>
              </ul>
            </div>

            {/* COMPARISON CHECKLIST – MORE PROFESSIONAL */}
            <div style={styles.lowerCard}>
              <div style={styles.lowerTitle}>Why traders upgrade</div>
              <div style={styles.lowerBig}>
                Max Trade Coach vs everything else.
              </div>

              <div style={styles.compareGrid}>
                <div style={styles.compareRow}>
                  <div style={styles.compareLabelWrap}>
                    Actually reviews <strong>your</strong> trades
                  </div>
                  <div style={styles.compareChecks}>
                    <div style={styles.compareYes}>
                      <span>Max Trade Coach</span>
                      <span>✓</span>
                    </div>
                    <div style={styles.compareNo}>
                      <span>Signal groups</span>
                      <span>✕</span>
                    </div>
                  </div>
                </div>

                <div style={styles.compareRow}>
                  <div style={styles.compareLabelWrap}>
                    Structured daily journal attached to screenshots
                  </div>
                  <div style={styles.compareChecks}>
                    <div style={styles.compareYes}>
                      <span>Max Trade Coach</span>
                      <span>✓</span>
                    </div>
                    <div style={styles.compareNo}>
                      <span>Photos app</span>
                      <span>✕</span>
                    </div>
                  </div>
                </div>

                <div style={styles.compareRow}>
                  <div style={styles.compareLabelWrap}>
                    Understands BOS / CHoCH / FVG / liquidity concepts
                  </div>
                  <div style={styles.compareChecks}>
                    <div style={styles.compareYes}>
                      <span>Max Trade Coach</span>
                      <span>✓</span>
                    </div>
                    <div style={styles.compareNo}>
                      <span>Notion / notes</span>
                      <span>✕</span>
                    </div>
                  </div>
                </div>

                <div style={styles.compareRow}>
                  <div style={styles.compareLabelWrap}>
                    Keeps everything in a single private portal
                  </div>
                  <div style={styles.compareChecks}>
                    <div style={styles.compareYes}>
                      <span>Max Trade Coach</span>
                      <span>✓</span>
                    </div>
                    <div style={styles.compareNo}>
                      <span>Random files &amp; chats</span>
                      <span>✕</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* FOOTER / LEGAL */}
          <footer style={styles.footer}>
            <div>
              © {currentYear} Max Trade Coach. All rights reserved. Nothing on
              this site is financial advice. Trading involves risk and you can
              lose money.
            </div>
            <div style={styles.footerLinks}>
              <span style={styles.footerLink}>Privacy Policy</span>
              <span style={styles.footerLink}>Terms of Use</span>
              <span style={styles.footerLink}>Risk Disclosure</span>
              <span style={styles.footerLink}>Contact</span>
            </div>
          </footer>
        </div>
      </div>

      {/* CHECKOUT / CREATE MEMBER MODAL */}
      {showCheckout && (
        <div style={styles.overlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalTitle}>Create your Max Trade Coach ID</div>
            <div style={styles.modalText}>
              Enter your details and continue to payment. After purchase,
              you&apos;ll receive a Member ID that unlocks your private portal.
            </div>

            <form onSubmit={handleCheckoutSubmit}>
              <input
                type="text"
                placeholder="Name"
                value={checkoutForm.name}
                onChange={(e) =>
                  setCheckoutForm((f) => ({ ...f, name: e.target.value }))
                }
                style={styles.input}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={checkoutForm.email}
                onChange={(e) =>
                  setCheckoutForm((f) => ({ ...f, email: e.target.value }))
                }
                style={styles.input}
                required
              />

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
                  ? "Processing…"
                  : "Pay with Stripe & generate Member ID"}
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
                style={styles.input}
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
    </>
  );
}
