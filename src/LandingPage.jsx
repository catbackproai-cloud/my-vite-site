import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({
    name: "",
    email: "",
  });
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [memberId, setMemberId] = useState("");

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

    // checkout overlay
    overlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 90,
      padding: 16,
    },
    modal: {
      width: "100%",
      maxWidth: 420,
      background: "#0d121a",
      borderRadius: 18,
      border: "1px solid #1b2535",
      padding: 20,
      boxShadow: "0 24px 70px rgba(0,0,0,0.7)",
      fontSize: 13,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 800,
      marginBottom: 4,
      textAlign: "center",
    },
    modalText: {
      fontSize: 12,
      opacity: 0.8,
      marginBottom: 14,
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
    modalPrimaryBtn: {
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
    modalSecondaryBtn: {
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
    memberIdBox: {
      marginTop: 12,
      padding: 10,
      borderRadius: 10,
      border: "1px dashed #243043",
      background: "#05080f",
      fontSize: 12,
    },
    memberIdLabel: {
      fontSize: 11,
      opacity: 0.75,
      marginBottom: 4,
    },
    memberIdValue: {
      fontFamily: "monospace",
      fontSize: 14,
      fontWeight: 700,
    },
  };

  const openWorkspace = () => {
    navigate("/workspace");
  };

  // This will be replaced with your real Stripe flow later.
  async function handleCheckoutSubmit(e) {
    e.preventDefault();
    setCheckoutError("");
    setCheckoutLoading(true);

    try {
      if (!checkoutForm.name || !checkoutForm.email) {
        throw new Error("Please enter your name and email.");
      }

      // TODO: call your backend to create a Stripe Checkout session
      // and redirect to Stripe. After successful payment, your backend
      // would generate + store the member ID and send it to the user.
      //
      // For now we simulate "payment success" + member ID creation.
      const generatedId =
        "TC-" + Math.random().toString(36).slice(2, 8).toUpperCase();

      setMemberId(generatedId);

      // Store locally so the portal can auto-detect it later if you want
      try {
        localStorage.setItem("tc_member_id", generatedId);
        localStorage.setItem("tc_member_email", checkoutForm.email);
        localStorage.setItem("tc_member_name", checkoutForm.name);
      } catch {
        // ignore storage errors
      }
    } catch (err) {
      setCheckoutError(err?.message || "Something went wrong.");
    } finally {
      setCheckoutLoading(false);
    }
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
                  setShowCheckout(true);
                  setCheckoutError("");
                }}
              >
                Get started → open my portal
              </button>

              <button
                style={styles.ghostBtn}
                onClick={openWorkspace}
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

      {/* CHECKOUT OVERLAY */}
      {showCheckout && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalTitle}>Create your Trade Coach account</div>
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
                style={{
                  ...styles.modalPrimaryBtn,
                  opacity: checkoutLoading ? 0.7 : 1,
                  cursor: checkoutLoading ? "default" : "pointer",
                }}
                disabled={checkoutLoading}
              >
                {checkoutLoading
                  ? "Processing..."
                  : "Pay with Stripe & generate Member ID"}
              </button>
            </form>

            {memberId && (
              <div style={styles.memberIdBox}>
                <div style={styles.memberIdLabel}>
                  Your Member ID (save this – you&apos;ll need it in the
                  portal):
                </div>
                <div style={styles.memberIdValue}>{memberId}</div>
                <div
                  style={{
                    fontSize: 11,
                    opacity: 0.75,
                    marginTop: 6,
                  }}
                >
                  Use this ID when you go to your workspace so the app can
                  unlock your private journal + AI feedback.
                </div>
                <button
                  type="button"
                  style={{
                    ...styles.modalSecondaryBtn,
                    marginTop: 8,
                  }}
                  onClick={openWorkspace}
                >
                  Go to my workspace
                </button>
              </div>
            )}

            <button
              type="button"
              style={styles.modalSecondaryBtn}
              onClick={() => setShowCheckout(false)}
            >
              Cancel for now
            </button>
          </div>
        </div>
      )}
    </>
  );
}
