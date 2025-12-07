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

  const styles = {
    page: {
      minHeight: "100vh",
      background:
        "radial-gradient(circle at top, #162238 0, #05070c 55%, #020308 100%)",
      color: "#e7ecf2",
      display: "flex",
      alignItems: "stretch",
      justifyContent: "center",
      padding: "32px 16px 40px",
      fontFamily:
        '-apple-system, BlinkMacSystemFont, system-ui, -system-ui, "SF Pro Text", sans-serif',
      boxSizing: "border-box",
    },
    shell: {
      width: "100%",
      maxWidth: 1120,
      display: "flex",
      flexDirection: "column",
      gap: 18,
    },

    // NAV
    nav: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "4px 8px 0",
      marginBottom: 4,
    },
    logoRow: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontSize: 14,
      fontWeight: 800,
      letterSpacing: 0.4,
    },
    logoDot: {
      width: 22,
      height: 22,
      borderRadius: 999,
      background:
        "conic-gradient(from 210deg, #1b9aaa, #38d5ff, #1b9aaa, #1b9aaa)",
      boxShadow: "0 0 0 1px rgba(0,0,0,0.7), 0 0 16px rgba(27,154,170,0.65)",
    },
    logoSub: {
      fontSize: 11,
      fontWeight: 500,
      opacity: 0.7,
    },
    navRight: {
      display: "flex",
      gap: 10,
      alignItems: "center",
      fontSize: 12,
      opacity: 0.85,
    },
    badgeTiny: {
      padding: "3px 8px",
      borderRadius: 999,
      border: "1px solid #243043",
      background: "rgba(7,12,20,0.7)",
    },

    // HERO CARD
    heroCard: {
      width: "100%",
      background: "rgba(7,12,20,0.96)",
      borderRadius: 22,
      border: "1px solid rgba(36,48,67,0.9)",
      boxShadow: "0 32px 90px rgba(0,0,0,0.75)",
      padding: "26px 26px 22px",
      display: "grid",
      gridTemplateColumns: "minmax(0, 1.55fr) minmax(0, 1.1fr)",
      gap: 26,
      boxSizing: "border-box",
    },
    heroLeft: {
      display: "flex",
      flexDirection: "column",
      gap: 14,
      justifyContent: "center",
    },
    heroRight: {
      background:
        "linear-gradient(140deg, #05080f 0%, #05080f 55%, #071321 100%)",
      borderRadius: 18,
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
      gap: 8,
      marginBottom: 4,
      flexWrap: "wrap",
    },
    badge: {
      fontSize: 11,
      padding: "4px 10px",
      borderRadius: 999,
      border: "1px solid #243043",
      background: "rgba(5,8,15,0.9)",
      textTransform: "uppercase",
      letterSpacing: 0.12,
      opacity: 0.9,
    },

    title: {
      fontSize: 34,
      fontWeight: 900,
      letterSpacing: -0.5,
      marginBottom: 4,
    },
    titleAccent: {
      fontWeight: 900,
      background:
        "linear-gradient(120deg, #ffffff, #e3f8ff, #76e4ff, #ffffff 90%)",
      WebkitBackgroundClip: "text",
      color: "transparent",
    },
    sub: {
      fontSize: 14,
      opacity: 0.83,
      maxWidth: 460,
      marginBottom: 6,
    },

    featureList: {
      listStyle: "none",
      padding: 0,
      margin: "4px 0 12px",
      fontSize: 13,
      opacity: 0.9,
      display: "flex",
      flexDirection: "column",
      gap: 6,
    },
    featureItem: {
      display: "flex",
      gap: 8,
      alignItems: "flex-start",
    },
    featureDot: {
      fontSize: 15,
      lineHeight: "19px",
      color: "#1b9aaa",
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
      borderImage: "linear-gradient(120deg,#46d6ff,#1b9aaa) 1",
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

    // RIGHT: PRICING / VALUE
    priceTag: {
      fontSize: 22,
      fontWeight: 900,
      marginBottom: 4,
    },
    priceLabel: {
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 0.12,
      opacity: 0.7,
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
      margin: "4px 0 6px",
    },
    miniHeading: {
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 0.14,
      opacity: 0.7,
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
      color: "#1b9aaa",
    },
    checkText: {
      fontSize: 13,
      opacity: 0.9,
    },
    tinyMuted: {
      fontSize: 11,
      opacity: 0.7,
      marginTop: 8,
    },
    tagRow: {
      display: "flex",
      flexWrap: "wrap",
      gap: 6,
      marginTop: 4,
    },
    tagPill: {
      padding: "3px 8px",
      borderRadius: 999,
      border: "1px solid #243043",
      fontSize: 11,
      opacity: 0.85,
    },

    // HOW IT WORKS / COMPARISON
    lowerRow: {
      display: "grid",
      gridTemplateColumns: "minmax(0, 1.5fr) minmax(0, 1.1fr)",
      gap: 16,
      marginTop: 6,
    },
    lowerCard: {
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
      marginBottom: 6,
    },
    lowerBig: {
      fontSize: 16,
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
      gap: 10,
      alignItems: "flex-start",
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
    },
    stepText: {
      fontSize: 13,
      opacity: 0.9,
    },

    compareGrid: {
      display: "grid",
      gridTemplateColumns: "minmax(0, 1fr)",
      gap: 6,
      marginTop: 6,
    },
    compareRow: {
      display: "flex",
      justifyContent: "space-between",
      gap: 8,
      fontSize: 12,
      padding: "8px 10px",
      borderRadius: 12,
      border: "1px solid #151f2b",
      background: "#05080f",
    },
    compareLabel: {
      opacity: 0.8,
    },
    compareChecks: {
      display: "flex",
      gap: 10,
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 0.12,
    },
    compareYes: {
      color: "#3ad1ff",
    },
    compareNo: {
      color: "#ff9ba8",
      opacity: 0.9,
    },

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
          {/* NAV */}
          <div style={styles.nav}>
            <div style={styles.logoRow}>
              <div style={styles.logoDot} />
              <div>
                <div>Max Trade Coach</div>
                <div style={styles.logoSub}>AI trade review · daily journal</div>
              </div>
            </div>
            <div style={styles.navRight}>
              <span style={styles.badgeTiny}>Built for ICT / liquidity traders</span>
            </div>
          </div>

          {/* HERO */}
          <div style={styles.heroCard}>
            {/* LEFT: STORY + CTA */}
            <div style={styles.heroLeft}>
              <div style={styles.badgeRow}>
                <span style={styles.badge}>Personal trade coach</span>
                <span style={styles.badge}>Screenshot → feedback → plan</span>
              </div>

              <h1 style={styles.title}>
                Turn every chart into a{" "}
                <span style={styles.titleAccent}>trading lesson.</span>
              </h1>

              <p style={styles.sub}>
                Max Trade Coach is your private workspace for trade screenshots,
                AI feedback, and a daily journal. Upload a chart, explain what
                you were thinking, and get a breakdown like a coach is sitting
                next to you.
              </p>

              <ul style={styles.featureList}>
                <li style={styles.featureItem}>
                  <span style={styles.featureDot}>●</span>
                  <span>
                    <strong>AI that speaks your language:</strong> BOS/CHoCH,
                    FVGs, OBs, liquidity sweeps, sessions, risk, and execution
                    — not random indicator spam.
                  </span>
                </li>
                <li style={styles.featureItem}>
                  <span style={styles.featureDot}>●</span>
                  <span>
                    <strong>Every day saved to a timeline:</strong> trades +
                    notes are tied to your date and Member ID so you can review
                    any session in seconds.
                  </span>
                </li>
                <li style={styles.featureItem}>
                  <span style={styles.featureDot}>●</span>
                  <span>
                    <strong>Built for self-coached traders:</strong> not a
                    signal group, not a course — a tool that forces you to
                    think, journal, and improve.
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
                You get a private portal where screenshots, feedback, and
                journal entries are saved per day — so you can study your own
                data, not someone else&apos;s.
              </div>
            </div>

            {/* RIGHT: VALUE / PRICING / WHY IT’S BETTER */}
            <div style={styles.heroRight}>
              <div>
                <div style={styles.priceLabel}>Max Trade Coach</div>
                <div style={styles.priceTag}>$XX / month</div>
                <div style={styles.priceSub}>
                  One personal workspace. Unlimited screenshot reviews and
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
                      AI feedback that grades your trade, highlights what you
                      did well, and calls out execution mistakes.
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
                  <span style={styles.tagPill}>NASDAQ / S&amp;P / US30</span>
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
                      zero structure, you never review them.
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
                Max Trade Coach is built for traders who actually want to get
                better — not just hunt the next &quot;alpha call.&quot;
              </div>
            </div>
          </div>

          {/* LOWER ROW: HOW IT WORKS + COMPARISON CHECKLIST */}
          <div style={styles.lowerRow}>
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
                    <strong>Journal the day:</strong> log what you learned,
                    where you tilted, and one improvement for the next session.
                  </div>
                </li>
              </ul>
            </div>

            {/* COMPARISON CHECKLIST */}
            <div style={styles.lowerCard}>
              <div style={styles.lowerTitle}>Why traders upgrade</div>
              <div style={styles.lowerBig}>
                Max Trade Coach vs everything else.
              </div>

              <div style={styles.compareGrid}>
                <div style={styles.compareRow}>
                  <span style={styles.compareLabel}>
                    Actually reviews <strong>your</strong> trades
                  </span>
                  <div style={styles.compareChecks}>
                    <span style={styles.compareYes}>Max: ✓</span>
                    <span style={styles.compareNo}>Signals: ✕</span>
                  </div>
                </div>

                <div style={styles.compareRow}>
                  <span style={styles.compareLabel}>
                    Structured daily journal attached to screenshots
                  </span>
                  <div style={styles.compareChecks}>
                    <span style={styles.compareYes}>Max: ✓</span>
                    <span style={styles.compareNo}>Photos app: ✕</span>
                  </div>
                </div>

                <div style={styles.compareRow}>
                  <span style={styles.compareLabel}>
                    Understands BOS / CHoCH / FVG / liquidity
                  </span>
                  <div style={styles.compareChecks}>
                    <span style={styles.compareYes}>Max: ✓</span>
                    <span style={styles.compareNo}>Notion / notes: ✕</span>
                  </div>
                </div>

                <div style={styles.compareRow}>
                  <span style={styles.compareLabel}>
                    Keeps everything in a single private portal
                  </span>
                  <div style={styles.compareChecks}>
                    <span style={styles.compareYes}>Max: ✓</span>
                    <span style={styles.compareNo}>Random files: ✕</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
