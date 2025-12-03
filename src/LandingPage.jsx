export default function LandingPage({ onEnterApp }) {
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
    // simple mobile tweak
    "@media (max-width: 768px)": {},
  };

  return (
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
            Upload your chart, explain your idea, and get structured feedback on
            what you did right, what you missed, and how to improve your next
            trade.
          </p>

          <ul style={styles.bullets}>
            <li style={styles.bullet}>
              <span style={styles.bulletDot}>•</span>
              <span>See every trade graded like a coach is looking over your shoulder.</span>
            </li>
            <li style={styles.bullet}>
              <span style={styles.bulletDot}>•</span>
              <span>Daily journal built-in so you can track psychology and execution.</span>
            </li>
            <li style={styles.bullet}>
              <span style={styles.bulletDot}>•</span>
              <span>Built for ICT / liquidity-based traders, not random indicator spam.</span>
            </li>
          </ul>

          <div style={styles.ctaRow}>
            <button
              style={styles.primaryBtn}
              onClick={() => {
                // TODO: hook to checkout
                // For now we just drop them into the app:
                onEnterApp?.();
              }}
            >
              Get started → open my portal
            </button>

            <button
              style={styles.ghostBtn}
              onClick={() => {
                // If someone already has a member ID, they can jump straight in
                onEnterApp?.();
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
                AI feedback tailored to your strategy (BOS/CHoCH, FVGs, OBs, sessions, etc.)
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
                Private portal – your trades & notes stay attached to your member ID.
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
  );
}