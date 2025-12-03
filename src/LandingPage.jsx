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
      background: "#05070c",
      color: "#e7ecf2",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 16px",
      fontFamily:
        '-apple-system, BlinkMacSystemFont, system-ui, -system-ui, "SF Pro Text", sans-serif',
    },
    card: {
      width: "100%",
      maxWidth: 820,
      background: "#0d121a",
      borderRadius: 20,
      border: "1px solid #161f2b",
      boxShadow: "0 24px 70px rgba(0,0,0,0.65)",
      padding: "28px 28px 24px",
      display: "grid",
      gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 1fr)",
      gap: 24,
    },
    left: {},
    right: {
      background: "#05080f",
      borderRadius: 16,
      border: "1px dashed #252f40",
      padding: 16,
      display: "flex",
      flexDirection: "column",
      gap: 10,
      fontSize: 13,
    },
    badgeRow: {
      display: "flex",
      gap: 8,
      marginBottom: 10,
      flexWrap: "wrap",
    },
    badge: {
      fontSize: 11,
      padding: "4px 10px",
      borderRadius: 999,
      border: "1px solid #243043",
      background: "#05080f",
      textTransform: "uppercase",
      letterSpacing: 0.12,
      opacity: 0.9,
    },
    title: {
      fontSize: 32,
      fontWeight: 800,
      marginBottom: 6,
    },
    sub: {
      fontSize: 14,
      opacity: 0.8,
      maxWidth: 420,
      marginBottom: 20,
    },
    bullets: {
      listStyle: "none",
      padding: 0,
      margin: "0 0 20px",
      fontSize: 13,
      opacity: 0.9,
    },
    bullet: {
      display: "flex",
      gap: 8,
      marginBottom: 8,
    },
    bulletDot: {
      fontSize: 16,
      lineHeight: "18px",
    },
    ctaRow: {
      display: "flex",
      flexWrap: "wrap",
      gap: 10,
      alignItems: "center",
      marginBottom: 4,
    },
    primaryBtn: {
      borderRadius: 999,
      border: "none",
      background: "#1b9aaa",
      padding: "10px 18px",
      fontSize: 14,
      fontWeight: 700,
      cursor: "pointer",
      color: "#fff",
    },
    ghostBtn: {
      borderRadius: 999,
      border: "1px solid #243043",
      background: "transparent",
      padding: "9px 16px",
      fontSize: 13,
      cursor: "pointer",
      color: "#e7ecf2",
    },
    tinyHint: {
      fontSize: 11,
      opacity: 0.7,
      marginTop: 6,
    },
    price: {
      fontSize: 22,
      fontWeight: 800,
      marginBottom: 4,
    },
    priceSub: {
      fontSize: 12,
      opacity: 0.8,
      marginBottom: 12,
    },
    checkList: {
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
    memberHint: {
      fontSize: 11,
      opacity: 0.75,
      marginTop: 10,
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
      background: "#1b9aaa",
      color: "#fff",
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
    // at this point tc_member_v1 is already saved
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

      const data = await res.json(); // { memberId, name, email, plan?, createdAt? }
      const generatedId = data.memberId;

      if (!generatedId) {
        throw new Error("Server did not return a member ID.");
      }

      setMemberId(generatedId);

      // Save full member object for workspace
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

    // We only know the ID here; email/name can be populated later from n8n if you want.
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
        <div style={styles.card}>
          {/* LEFT: Marketing copy */}
          <div style={styles.left}>
            <div style={styles.badgeRow}>
              <span style={styles.badge}>Personal Trade Coach</span>
              <span style={styles.badge}>Journal + AI feedback</span>
            </div>

            <h1 style={styles.title}>Turn screenshots into trading lessons.</h1>
            <p style={styles.sub}>
              Upload your chart, explain your idea, and get structured feedback
              on what you did right, what you missed, and how to improve your
              next trade.
            </p>

            <ul style={styles.bullets}>
              <li style={styles.bullet}>
                <span style={styles.bulletDot}>•</span>
                <span>
                  See every trade graded like a coach is looking over your
                  shoulder.
                </span>
              </li>
              <li style={styles.bullet}>
                <span style={styles.bulletDot}>•</span>
                <span>
                  Daily journal built-in so you can track psychology and
                  execution.
                </span>
              </li>
              <li style={styles.bullet}>
                <span style={styles.bulletDot}>•</span>
                <span>
                  Built for ICT / liquidity-based traders, not random indicator
                  spam.
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
                Already have a member ID?
              </button>
            </div>

            <div style={styles.tinyHint}>
              You&apos;ll get a private portal where your trades and notes are
              saved per day.
            </div>
          </div>

          {/* RIGHT: pricing / what you get */}
          <div style={styles.right}>
            <div style={styles.price}>$XX / month</div>
            <div style={styles.priceSub}>
              One personal dashboard. Unlimited screenshots and notes.
            </div>

            <ul style={styles.checkList}>
              <li style={styles.checkItem}>
                <span style={styles.checkIcon}>✓</span>
                <span style={styles.checkText}>
                  AI feedback tailored to your strategy (BOS/CHoCH, FVGs, OBs,
                  sessions, etc.)
                </span>
              </li>
              <li style={styles.checkItem}>
                <span style={styles.checkIcon}>✓</span>
                <span style={styles.checkText}>
                  Daily journal saved per date so you can review any session.
                </span>
              </li>
              <li style={styles.checkItem}>
                <span style={styles.checkIcon}>✓</span>
                <span style={styles.checkText}>
                  Private portal – your trades & notes stay attached to your
                  member ID.
                </span>
              </li>
            </ul>

            <div style={styles.memberHint}>
              After purchase you&apos;ll receive a Member ID that unlocks your
              Trade Coach portal.
            </div>
          </div>
        </div>
      </div>

      {/* CHECKOUT / CREATE MEMBER MODAL */}
      {showCheckout && (
        <div style={styles.overlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalTitle}>
              Create your Trade Coach account
            </div>
            <div style={styles.modalText}>
              Enter your details and continue to payment. After purchase,
              you&apos;ll get a Member ID to unlock your portal.
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
                  Store this somewhere safe. You&apos;ll use it to log into
                  your Trade Coach portal.
                </div>
                <button
                  type="button"
                  style={{
                    ...styles.modalButtonPrimary,
                    marginTop: 10,
                  }}
                  onClick={openWorkspace}
                >
                  I saved it → go to my workspace
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
              Paste the Member ID you received after purchase to unlock your
              Trade Coach portal.
            </div>

            <form onSubmit={handleMemberPortalSubmit}>
              <input
                type="text"
                placeholder="Member ID (e.g. TC-ABC123)"
                value={memberPortalId}
                onChange={(e) => setMemberPortalId(e.target.value)}
                style={styles.input}
                required
              />

              {memberPortalError && (
                <div style={styles.modalError}>{memberPortalError}</div>
              )}

              <button type="submit" style={styles.modalButtonPrimary}>
                Continue to my workspace
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
