import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// ✅ Single source of truth for prod:
const PROD_WEBHOOK = "https://jacobtf007.app.n8n.cloud/webhook/trade_feedback";

// ✅ Env override if you ever want it later:
const WEBHOOK_URL =
  (import.meta?.env && import.meta.env.VITE_N8N_TRADE_FEEDBACK_WEBHOOK) ||
  PROD_WEBHOOK;

const MEMBER_LS_KEY = "tc_member_v1";
const LAST_DAY_KEY = "tradeCoach:lastDayWithData";

const CYAN = "#22d3ee";
const CYAN_SOFT = "#38bdf8";

const gradeColor = (grade) => {
  switch (grade) {
    case "A":
      return "#22c55e"; // green
    case "B":
      return "#4ade80"; // soft green
    case "C":
      return "#facc15"; // yellow
    case "D":
      return "#fb923c"; // orange
    case "F":
      return "#f97373"; // red
    default:
      return "#9ca3af"; // gray if missing
  }
};

function todayStr() {
  // LOCAL date, not UTC, so no “tomorrow” bug
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseLocalDateFromIso(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d); // local midnight, no timezone shift
}

/* ---------------- HELPERS ---------------- */

// Convert image file -> base64 data url (persists across reload)
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Make Drive links reliably render as <img src="">
function normalizeDriveUrl(url) {
  if (!url) return null;

  if (url.includes("drive.google.com/uc?id=")) return url;

  const m = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (m?.[1]) return `https://drive.google.com/uc?id=${m[1]}`;

  return url;
}

// ✅ Safe localStorage write: NEVER drop chats, only strip heavy image data
function safeSaveChats(key, chats) {
  try {
    const leanChats = chats.map(
      ({ localPreviewUrl, localDataUrl, ...rest }) => ({
        ...rest,
      })
    );

    localStorage.setItem(key, JSON.stringify(leanChats));
    localStorage.setItem("lastTradeChats", JSON.stringify(leanChats));
  } catch (e) {
    console.warn("Failed to save chats to localStorage", e);
  }
}

export default function App({
  selectedDay = todayStr(), // ✅ use LOCAL today as default
}) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    strategyNotes: "",
    file: null,
    timeframe: "",
    instrument: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const [chats, setChats] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);

  // ⭐ member info (from localStorage)
  const [member, setMember] = useState(() => {
    try {
      const raw = localStorage.getItem(MEMBER_LS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  // initial day = last day with data (if any) else selectedDay
  const initialDay = (() => {
    try {
      const saved = localStorage.getItem(LAST_DAY_KEY);
      return saved || selectedDay;
    } catch {
      return selectedDay;
    }
  })();

  // ⭐ header menu + profile modal state
  const [menuOpen, setMenuOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // ⭐ DAY + CALENDAR STATE
  const [day, setDay] = useState(initialDay); // internal selected day
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = parseLocalDateFromIso(initialDay);
    return { year: d.getFullYear(), month: d.getMonth() }; // 0-index
  });

  // ⭐ JOURNAL STATE (3 fields)
  const [journal, setJournal] = useState({
    notes: "",
    learned: "",
    improve: "",
  });

  const todayIso = todayStr();

  const isValid = useMemo(
    () =>
      !!form.strategyNotes &&
      !!form.file &&
      !!form.timeframe &&
      !!form.instrument,
    [form]
  );

  // latest trade for this day (we only SHOW this one)
  const lastChat = chats.length ? chats[chats.length - 1] : null;
  const isPending = !!lastChat?.pending;
  const hasCompletedTrade = !!(lastChat && !lastChat.pending);

  const buttonDisabled =
    !hasCompletedTrade && (!isValid || submitting || isPending);

  // Build calendar weeks for dropdown
  function buildMonthWeeks() {
    const { year, month } = calendarMonth;
    const first = new Date(year, month, 1);
    const startDow = first.getDay(); // 0-6, Sun-Sat
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const weeks = [];
    let currentDay = 1 - startDow; // may start negative for leading blanks

    for (let w = 0; w < 6; w++) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        if (currentDay < 1 || currentDay > daysInMonth) {
          week.push(null);
        } else {
          const m = String(month + 1).padStart(2, "0");
          const dStr = String(currentDay).padStart(2, "0");
          const iso = `${year}-${m}-${dStr}`;
          week.push({ day: currentDay, iso });
        }
        currentDay++;
      }
      weeks.push(week);
    }
    return weeks;
  }

  const monthWeeks = buildMonthWeeks();
  const calendarMonthLabel = new Date(
    calendarMonth.year,
    calendarMonth.month,
    1
  ).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const formattedDayLabel = parseLocalDateFromIso(day).toLocaleDateString(
    undefined,
    {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );

  function goToPrevMonth() {
    setCalendarMonth((prev) => {
      const d = new Date(prev.year, prev.month - 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  function goToNextMonth() {
    setCalendarMonth((prev) => {
      const d = new Date(prev.year, prev.month + 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  function handlePickDate(iso) {
    setDay(iso);
    setShowCalendar(false);
  }

  const onChange = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  /* ---------------- STYLES ---------------- */

  const styles = {
    page: {
      minHeight: "100vh",
      background:
        "radial-gradient(circle at top, #0b1120 0, #020617 45%, #020617 100%)",
      color: "#e5e7eb",
      padding: "80px 16px 24px", // top padding to clear fixed header
      boxSizing: "border-box",
      fontFamily:
        '-apple-system, BlinkMacSystemFont, system-ui, "SF Pro Text", sans-serif',
      position: "relative",
      overflowX: "hidden",
    },
    pageGlow: {
      position: "fixed",
      top: 40,
      left: "50%",
      transform: "translateX(-50%)",
      width: 520,
      height: 520,
      background: "radial-gradient(circle, rgba(34,211,238,0.25), transparent)",
      filter: "blur(40px)",
      opacity: 0.8,
      pointerEvents: "none",
      zIndex: 0,
    },
    pageInner: {
      position: "relative",
      zIndex: 1,
    },

    // 🔹 GLOBAL FIXED HEADER
    siteHeader: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      height: 56,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 32px",
      background:
        "linear-gradient(to right, rgba(15,23,42,0.96), rgba(8,25,43,0.96))",
      borderBottom: "1px solid rgba(15,23,42,0.9)",
      backdropFilter: "blur(20px)",
      zIndex: 70,
      boxShadow: "0 16px 60px rgba(15,23,42,0.9)",
    },
    siteHeaderTitle: {
      fontSize: 18,
      fontWeight: 800,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: "#f9fafb",
    },
    siteHeaderActions: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      fontSize: 12,
      opacity: 0.85,
      position: "relative",
      color: "#9ca3af",
    },
    workspaceTag: {
      padding: "4px 10px",
      borderRadius: 999,
      border: "1px solid rgba(148,163,184,0.5)",
      background:
        "linear-gradient(135deg, rgba(15,23,42,0.9), rgba(15,23,42,0.5))",
    },
    menuButton: {
      width: 30,
      height: 30,
      borderRadius: 999,
      border: "1px solid rgba(51,65,85,0.9)",
      background:
        "radial-gradient(circle at 0 0, rgba(34,211,238,0.18), #020617)",
      color: "#e5e7eb",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      fontSize: 18,
      padding: 0,
      boxShadow: "0 10px 30px rgba(15,23,42,0.9)",
      transition: "transform .18s ease, box-shadow .18s ease",
    },
    menuButtonHover: {
      transform: "translateY(-1px)",
      boxShadow: "0 14px 40px rgba(15,23,42,0.95)",
    },
    menuDropdown: {
      position: "absolute",
      top: 36,
      right: 0,
      background:
        "radial-gradient(circle at top left, #0f172a, #020617 80%)",
      borderRadius: 14,
      border: "1px solid rgba(51,65,85,0.9)",
      boxShadow: "0 20px 60px rgba(15,23,42,0.95)",
      padding: 6,
      minWidth: 170,
      zIndex: 80,
    },
    menuItem: {
      padding: "8px 10px",
      borderRadius: 8,
      fontSize: 13,
      cursor: "pointer",
      color: "#e5e7eb",
      transition: "background .15s ease, transform .12s ease",
    },
    menuItemDanger: {
      color: "#fecaca",
    },

    // 🔹 DATE DROPDOWN ROW
    dateRow: {
      width: "100%",
      maxWidth: 1100,
      margin: "0 auto 20px",
      display: "flex",
      justifyContent: "center",
      position: "relative",
    },
    datePill: {
      minWidth: 260,
      padding: "9px 16px",
      borderRadius: 999,
      background:
        "linear-gradient(#020617,#020617) padding-box, linear-gradient(135deg, rgba(34,211,238,0.5), rgba(56,189,248,0.25)) border-box",
      border: "1px solid transparent",
      fontSize: 13,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      cursor: "pointer",
      boxShadow: "0 12px 40px rgba(15,23,42,0.9)",
      color: "#e5e7eb",
      transition: "transform .16s ease, box-shadow .16s ease, border .16s ease",
    },
    datePillHover: {
      transform: "translateY(-1px)",
      boxShadow: "0 16px 50px rgba(15,23,42,0.95)",
      border:
        "1px solid rgba(34,211,238,0.85)",
    },
    datePillText: {
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    datePillIcon: {
      fontSize: 11,
      opacity: 0.9,
      marginLeft: 8,
    },

    calendarPanel: {
      position: "absolute",
      top: "115%",
      zIndex: 60,
      background:
        "radial-gradient(circle at top, #020617, #020617 55%, #020617 100%)",
      borderRadius: 18,
      border: "1px solid rgba(51,65,85,0.9)",
      padding: 12,
      boxShadow: "0 20px 70px rgba(15,23,42,0.95)",
      width: 320,
    },
    calendarHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
      fontSize: 13,
      color: "#e5e7eb",
    },
    calendarHeaderTitle: {
      fontWeight: 700,
    },
    calendarNavBtn: {
      width: 26,
      height: 26,
      borderRadius: 999,
      border: "1px solid rgba(55,65,81,0.9)",
      background: "#020617",
      color: "#e5e7eb",
      fontSize: 13,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    weekdayRow: {
      display: "grid",
      gridTemplateColumns: "repeat(7, 1fr)",
      gap: 4,
      fontSize: 11,
      opacity: 0.7,
      marginBottom: 4,
      color: "#9ca3af",
    },
    weekdayCell: {
      textAlign: "center",
      padding: "4px 0",
    },
    calendarWeek: {
      display: "grid",
      gridTemplateColumns: "repeat(7, 1fr)",
      gap: 4,
      marginTop: 2,
    },
    dayCellEmpty: {
      padding: "6px 0",
      fontSize: 12,
    },
    dayCellBase: {
      padding: "6px 0",
      fontSize: 12,
      textAlign: "center",
      borderRadius: 8,
      cursor: "pointer",
      border: "1px solid transparent",
      color: "#e5e7eb",
      transition: "background .12s ease, border .12s ease, color .12s ease",
    },
    dayCellSelected: {
      background: CYAN,
      color: "#020617",
      borderColor: CYAN,
    },
    dayCellToday: {
      borderColor: "rgba(34,211,238,0.6)",
    },

    // 🔹 MAIN 2/3 – 1/3 LAYOUT
    mainShell: {
      width: "100%",
      maxWidth: 1100,
      margin: "0 auto",
      display: "flex",
      gap: 16,
      alignItems: "stretch",
      flexWrap: "wrap",
    },
    leftCol: {
      flex: "2 1 360px",
      display: "flex",
      flexDirection: "column",
      gap: 12,
    },
    rightCol: {
      flex: "1 1 260px",
      display: "flex",
      flexDirection: "column",
      gap: 12,
    },

    coachCard: {
      background:
        "radial-gradient(circle at top left, #020617, #020617 60%, #020617 100%)",
      borderRadius: 20,
      boxShadow: "0 20px 60px rgba(15,23,42,0.95)",
      padding: 20,
      display: "flex",
      flexDirection: "column",
      gap: 12,
      minHeight: 0,
      border: "1px solid rgba(30,64,175,0.7)",
    },
    coachHeaderRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      gap: 8,
    },
    coachTitle: {
      fontSize: 20,
      fontWeight: 800,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      color: "#f9fafb",
    },
    coachSub: {
      fontSize: 12,
      opacity: 0.75,
      marginTop: 4,
      maxWidth: 380,
      color: "#9ca3af",
    },
    dayBadge: {
      fontSize: 11,
      opacity: 0.9,
      border: "1px solid rgba(55,65,81,0.9)",
      borderRadius: 999,
      padding: "4px 10px",
      whiteSpace: "nowrap",
      alignSelf: "flex-start",
      color: "#e5e7eb",
      background:
        "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(15,23,42,0.6))",
    },

    // 🔹 STATUS BOX
    statusBox: {
      marginTop: 4,
      background:
        "radial-gradient(circle at top left, #020617, #020617 70%, #020617 100%)",
      borderRadius: 18,
      border: "1px solid rgba(31,41,55,0.9)",
      padding: 16,
      minHeight: 230,
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      gap: 8,
      position: "relative",
      overflow: "hidden",
    },
    statusGlow: {
      position: "absolute",
      inset: 0,
      opacity: 0.26,
      background:
        "radial-gradient(circle at top center, rgba(34,211,238,0.28), transparent 55%)",
      pointerEvents: "none",
    },
    statusContent: {
      position: "relative",
      zIndex: 1,
      transition: "opacity .22s ease, transform .22s ease",
    },
    statusPlaceholderTitle: {
      fontSize: 16,
      fontWeight: 700,
      marginBottom: 4,
      color: "#e5e7eb",
    },
    statusPlaceholderText: {
      fontSize: 13,
      opacity: 0.8,
      color: "#9ca3af",
    },
    statusHeaderRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 8,
      marginBottom: 6,
    },
    statusHeaderLeft: {
      display: "flex",
      flexDirection: "column",
      gap: 2,
      fontSize: 12,
    },
    statusLabel: {
      fontSize: 13,
      fontWeight: 700,
      color: "#e5e7eb",
    },
    statusMeta: {
      fontSize: 11,
      opacity: 0.75,
      color: "#9ca3af",
    },
    gradePill: {
      fontSize: 14,
      fontWeight: 900,
      padding: "3px 10px",
      borderRadius: 999,
      background:
        "linear-gradient(135deg, rgba(34,211,238,0.05), rgba(56,189,248,0.12))",
      border: "1px solid rgba(148,163,184,0.9)",
      boxShadow: "0 0 0 1px rgba(15,23,42,0.9), 0 0 30px rgba(34,211,238,0.4)",
    },
    statusImg: {
      width: "100%",
      maxWidth: 340,
      borderRadius: 12,
      border: "1px solid rgba(30,64,175,0.9)",
      marginBottom: 8,
      marginTop: 6,
      alignSelf: "flex-start",
      boxShadow: "0 20px 60px rgba(15,23,42,0.95)",
    },
    sectionTitle: {
      fontWeight: 800,
      marginTop: 8,
      marginBottom: 4,
      fontSize: 13,
      color: "#e5e7eb",
    },
    ul: {
      margin: 0,
      paddingLeft: 18,
      opacity: 0.95,
      fontSize: 13,
      color: "#d1d5db",
    },
    smallMeta: {
      fontSize: 11,
      opacity: 0.7,
      marginTop: 8,
      color: "#9ca3af",
    },

    // 🔹 FORM BELOW STATUS
    formSection: {
      marginTop: 10,
      display: "flex",
      flexDirection: "column",
      gap: 8,
    },
    composerRow: {
      display: "flex",
      gap: 10,
      alignItems: "stretch",
      flexWrap: "wrap",
    },
    composerLeft: {
      flex: "0 0 190px",
      minWidth: 150,
    },
    composerRight: {
      flex: "1 1 260px",
      minWidth: 260,
    },

    dropMini: {
      background:
        "radial-gradient(circle at top left, #020617, #020617 70%, #020617 100%)",
      border:
        "1px dashed rgba(51,65,85,0.95)",
      borderRadius: 14,
      padding: 10,
      height: "100%",
      minHeight: 90,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      cursor: "pointer",
      fontSize: 12,
      color: "rgba(226,232,240,0.9)",
      transition:
        "border-color .2s ease, background .2s ease, box-shadow .2s ease, transform .15s ease",
      position: "relative",
      boxSizing: "border-box",
      boxShadow: "0 16px 40px rgba(15,23,42,0.9)",
    },
    dropMiniActive: {
      borderColor: CYAN,
      background:
        "radial-gradient(circle at top, rgba(34,211,238,0.12), #020617)",
      transform: "translateY(-1px)",
      boxShadow: "0 20px 60px rgba(15,23,42,0.95)",
    },
    previewThumb: {
      maxWidth: 88,
      maxHeight: 66,
      borderRadius: 10,
      border: "1px solid rgba(31,41,55,0.9)",
      objectFit: "cover",
    },
    dropMiniLabel: {
      display: "flex",
      flexDirection: "column",
      gap: 3,
    },
    dropMiniTitle: { fontWeight: 700, fontSize: 12 },
    dropMiniHint: { fontSize: 11, opacity: 0.8, color: "#9ca3af" },
    miniCloseBtn: {
      position: "absolute",
      top: 7,
      right: 7,
      width: 20,
      height: 20,
      borderRadius: "9999px",
      border: "none",
      background: "rgba(15,23,42,0.95)",
      color: "#f9fafb",
      fontSize: 12,
      fontWeight: 800,
      lineHeight: "18px",
      textAlign: "center",
      cursor: "pointer",
      boxShadow: "0 0 0 1px rgba(148,163,184,0.7)",
    },

    label: { fontSize: 12, opacity: 0.8, marginBottom: 4, color: "#9ca3af" },

    fieldRow: {
      display: "flex",
      gap: 8,
      marginBottom: 6,
      flexWrap: "wrap",
    },
    fieldHalf: {
      flex: "1 1 0",
      minWidth: 140,
    },

    input: {
      width: "100%",
      background:
        "radial-gradient(circle at top left, #020617, #020617 70%, #020617 100%)",
      border: "1px solid rgba(31,41,55,0.9)",
      borderRadius: 12,
      color: "#e5e7eb",
      padding: "8px 11px",
      fontSize: 13,
      outline: "none",
      boxSizing: "border-box",
      transition:
        "border-color .15s ease, box-shadow .15s ease, background .15s ease",
    },

    // wrapper + select + arrow so it matches text field with a custom caret
    selectWrapper: {
      position: "relative",
      width: "100%",
    },
    select: {
      width: "100%",
      background:
        "radial-gradient(circle at top left, #020617, #020617 70%, #020617 100%)",
      border: "1px solid rgba(31,41,55,0.9)",
      borderRadius: 12,
      color: "#e5e7eb",
      padding: "8px 30px 8px 11px",
      fontSize: 13,
      outline: "none",
      boxSizing: "border-box",
      appearance: "none",
      WebkitAppearance: "none",
      MozAppearance: "none",
      transition:
        "border-color .15s ease, box-shadow .15s ease, background .15s ease",
    },
    selectArrow: {
      position: "absolute",
      right: 10,
      top: "50%",
      transform: "translateY(-50%)",
      fontSize: 10,
      pointerEvents: "none",
      opacity: 0.7,
      color: "#9ca3af",
    },

    textarea: {
      width: "100%",
      minHeight: 90,
      background:
        "radial-gradient(circle at top left, #020617, #020617 70%, #020617 100%)",
      border: "1px solid rgba(31,41,55,0.9)",
      borderRadius: 14,
      color: "#e5e7eb",
      padding: "10px 12px",
      outline: "none",
      resize: "vertical",
      fontSize: 14,
      boxSizing: "border-box",
      transition:
        "border-color .15s ease, box-shadow .15s ease, background .15s ease",
    },

    button: {
      marginTop: 4,
      width: "100%",
      background: buttonDisabled
        ? "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(15,23,42,0.95))"
        : `linear-gradient(135deg, ${CYAN}, ${CYAN_SOFT})`,
      color: "#020617",
      border: "none",
      borderRadius: 999,
      padding: "11px 16px",
      fontWeight: 800,
      cursor: buttonDisabled ? "not-allowed" : "pointer",
      opacity: buttonDisabled ? 0.7 : 1,
      fontSize: 14,
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      boxShadow: buttonDisabled
        ? "0 0 0 rgba(15,23,42,0.9)"
        : "0 18px 55px rgba(34,211,238,0.45)",
      transition:
        "background .18s ease, opacity .18s ease, transform .18s ease, box-shadow .18s ease",
    },
    buttonHover: {
      transform: "translateY(-1px)",
      boxShadow: "0 22px 70px rgba(34,211,238,0.6)",
    },
    error: {
      marginTop: 6,
      padding: 10,
      borderRadius: 12,
      background: "rgba(127,29,29,0.9)",
      color: "#fee2e2",
      whiteSpace: "pre-wrap",
      fontSize: 12,
      border: "1px solid rgba(248,113,113,0.7)",
    },
    hint: { marginTop: 4, fontSize: 11, opacity: 0.75, color: "#fecaca" },

    // 🔹 JOURNAL
    journalCard: {
      background:
        "radial-gradient(circle at top right, #020617, #020617 70%, #020617 100%)",
      borderRadius: 20,
      boxShadow: "0 20px 60px rgba(15,23,42,0.95)",
      padding: 20,
      display: "flex",
      flexDirection: "column",
      gap: 10,
      minHeight: 0,
      border: "1px solid rgba(30,64,175,0.9)",
    },
    journalHeaderRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      gap: 8,
    },
    journalTitle: {
      fontSize: 18,
      fontWeight: 800,
      color: "#f9fafb",
    },
    journalSub: {
      fontSize: 11,
      opacity: 0.8,
      marginTop: 4,
      maxWidth: 260,
      color: "#9ca3af",
    },
    journalBadge: {
      fontSize: 11,
      padding: "4px 8px",
      borderRadius: 999,
      border: "1px solid rgba(55,65,81,0.9)",
      background:
        "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(15,23,42,0.6))",
      opacity: 0.95,
      whiteSpace: "nowrap",
      color: "#e5e7eb",
    },
    journalLabel: {
      fontSize: 12,
      opacity: 0.8,
      marginBottom: 4,
      color: "#9ca3af",
    },
    journalTextareaBig: {
      width: "100%",
      minHeight: 140,
      background:
        "radial-gradient(circle at top left, #020617, #020617 70%, #020617 100%)",
      border: "1px solid rgba(31,41,55,0.9)",
      borderRadius: 14,
      color: "#e5e7eb",
      padding: "10px 12px",
      outline: "none",
      resize: "vertical",
      fontSize: 14,
      boxSizing: "border-box",
    },
    journalTextareaSmall: {
      width: "100%",
      minHeight: 70,
      background:
        "radial-gradient(circle at top left, #020617, #020617 70%, #020617 100%)",
      border: "1px solid rgba(31,41,55,0.9)",
      borderRadius: 14,
      color: "#e5e7eb",
      padding: "8px 10px",
      outline: "none",
      resize: "vertical",
      fontSize: 13,
      boxSizing: "border-box",
    },
    journalHintRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      fontSize: 11,
      opacity: 0.8,
      marginTop: 6,
      color: "#9ca3af",
    },

    // 🔹 PROFILE MODAL
    overlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(15,23,42,0.85)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 90,
      padding: 16,
      backdropFilter: "blur(14px)",
    },
    modalCard: {
      width: "100%",
      maxWidth: 380,
      background:
        "radial-gradient(circle at top, #020617, #020617 60%, #020617 100%)",
      borderRadius: 20,
      border: "1px solid rgba(30,64,175,0.9)",
      padding: 20,
      boxShadow: "0 24px 80px rgba(15,23,42,0.98)",
      fontSize: 13,
      color: "#e5e7eb",
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 800,
      marginBottom: 6,
      textAlign: "center",
      color: "#f9fafb",
    },
    modalText: {
      fontSize: 12,
      opacity: 0.8,
      marginBottom: 12,
      textAlign: "center",
      color: "#9ca3af",
    },
    modalRow: {
      marginBottom: 8,
      fontSize: 13,
    },
    modalLabel: {
      fontWeight: 700,
      opacity: 0.9,
      color: "#e5e7eb",
    },
    modalValue: {
      opacity: 0.95,
      color: "#e5e7eb",
    },
    modalCloseBtn: {
      marginTop: 14,
      width: "100%",
      borderRadius: 999,
      border: "1px solid rgba(55,65,81,0.9)",
      padding: "8px 12px",
      fontSize: 13,
      fontWeight: 500,
      background:
        "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(15,23,42,0.7))",
      color: "#e5e7eb",
      cursor: "pointer",
    },
  };

  /* ---------------- EFFECTS ---------------- */

  // Screenshot preview blob
  useEffect(() => {
    if (!form.file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(form.file);
    setPreviewUrl(url);
    return () => {
      try {
        URL.revokeObjectURL(url);
      } catch {}
    };
  }, [form.file]);

  // Load saved chats per day
  useEffect(() => {
    try {
      const key = `tradeChats:${day}`;
      const saved = localStorage.getItem(key);
      setChats(saved ? JSON.parse(saved) : []);
      setForm((prev) => ({ ...prev, file: null }));
      setPreviewUrl(null);
      setError("");
    } catch {
      setChats([]);
    }
  }, [day]);

  // Persist chats per day + mark last day with data
  useEffect(() => {
    const key = `tradeChats:${day}`;
    safeSaveChats(key, chats);

    if (chats && chats.length > 0) {
      try {
        localStorage.setItem(LAST_DAY_KEY, day);
      } catch {
        // ignore
      }
    }
  }, [chats, day]);

  // 🔹 Load journal per day (v2 object, fallback to legacy string)
  useEffect(() => {
    try {
      const keyV2 = `tradeJournalV2:${day}`;
      const rawV2 = localStorage.getItem(keyV2);
      if (rawV2) {
        const parsed = JSON.parse(rawV2);
        setJournal({
          notes: parsed.notes || "",
          learned: parsed.learned || "",
          improve: parsed.improve || "",
        });
        return;
      }

      // legacy single-string journal
      const legacyKey = `tradeJournal:${day}`;
      const legacy = localStorage.getItem(legacyKey);
      if (legacy) {
        setJournal({
          notes: legacy,
          learned: "",
          improve: "",
        });
        return;
      }

      setJournal({ notes: "", learned: "", improve: "" });
    } catch {
      setJournal({ notes: "", learned: "", improve: "" });
    }
  }, [day]);

  // 🔹 Persist journal per day + mark last day with data
  useEffect(() => {
    try {
      const keyV2 = `tradeJournalV2:${day}`;
      localStorage.setItem(keyV2, JSON.stringify(journal));

      const hasJournal =
        (journal.notes || "").trim() ||
        (journal.learned || "").trim() ||
        (journal.improve || "").trim();

      if (hasJournal) {
        localStorage.setItem(LAST_DAY_KEY, day);
      }
    } catch {
      // ignore
    }
  }, [journal, day]);

  /* ---------------- HANDLERS ---------------- */

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!isValid || submitting) return;

    setSubmitting(true);

    try {
      if (!WEBHOOK_URL) throw new Error("No webhook URL configured.");

      const localDataUrl = await fileToDataUrl(form.file);
      const localPreviewUrl = form.file
        ? URL.createObjectURL(form.file)
        : null;

      const tempId = `tmp-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;
      const tempChat = {
        id: tempId,
        timestamp: new Date().toISOString(),
        userNotes: form.strategyNotes,
        screenshotUrl: null,
        localPreviewUrl,
        localDataUrl,
        pending: true,
        analysis: null,
        timeframe: form.timeframe,
        instrument: form.instrument,
      };

      setChats((prev) => [...prev, tempChat]);

      const fd = new FormData();
      fd.append("day", day);
      fd.append("strategyNotes", form.strategyNotes);
      fd.append("timeframe", form.timeframe);
      fd.append("instrument", form.instrument);
      if (form.file) fd.append("screenshot", form.file);

      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        body: fd,
      });

      const text = await res.text();

      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        throw new Error(
          `Non-JSON response (${res.status}): ${text?.slice(0, 200)}`
        );
      }

      if (!res.ok) {
        throw new Error(
          data?.message || data?.error || `Server responded ${res.status}`
        );
      }

      setChats((prev) =>
        prev.map((c) => {
          if (c.id !== tempId) return c;

          if (c.localPreviewUrl) {
            try {
              URL.revokeObjectURL(c.localPreviewUrl);
            } catch {}
          }

          return {
            ...c,
            pending: false,
            screenshotUrl: null, // no backend screenshot URL anymore
            analysis: data?.analysis || data || null,
            serverTimestamp: data?.timestamp || null,
            localPreviewUrl: c.localPreviewUrl,
            localDataUrl: c.localDataUrl,
          };
        })
      );

      // keep timeframe + instrument so they don't have to re-fill
      setForm((prev) => ({
        ...prev,
        strategyNotes: "",
        file: null,
      }));
      setPreviewUrl(null);
    } catch (err) {
      setError(err?.message || "Submit failed");

      setChats((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last?.pending) {
          copy[copy.length - 1] = {
            ...last,
            pending: false,
            analysis: {
              grade: "N/A",
              oneLineVerdict: "Upload failed. Try again.",
              whatWentRight: [],
              whatWentWrong: [],
              improvements: [],
              lessonLearned: "",
              confidence: 0,
            },
          };
        }
        return copy;
      });
    } finally {
      setSubmitting(false);
    }
  }

  function handleResetTrade() {
    // Clear current trade status + form so user can start a fresh one
    setChats([]);
    setForm({
      strategyNotes: "",
      file: null,
      timeframe: "",
      instrument: "",
    });
    setPreviewUrl(null);
    setError("");
  }

  // Drag & drop helpers
  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDrop(e) {
    preventDefaults(e);
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith("image/")) {
      onChange("file", file);
    }
    setDragActive(false);
  }

  function handleLogout() {
    try {
      localStorage.removeItem(MEMBER_LS_KEY);
      localStorage.removeItem("tc_member_id"); // legacy cleanup
    } catch {
      // ignore
    }
    setMember(null);
    setMenuOpen(false);
    navigate("/"); // back to landing page
  }

  /* ---------------- RENDER ---------------- */

  const analysis = lastChat?.analysis ?? {};
  const {
    grade,
    oneLineVerdict,
    whatWentRight = [],
    whatWentWrong = [],
    improvements = [],
    lessonLearned,
    confidence,
  } = analysis;

  const imgSrc =
    normalizeDriveUrl(lastChat?.screenshotUrl) ||
    lastChat?.localDataUrl ||
    lastChat?.localPreviewUrl ||
    null;

  const primaryButtonLabel = hasCompletedTrade
    ? "Submit another trade"
    : submitting || isPending
    ? "Uploading…"
    : "Get feedback";

  const statusAnimatedStyle = lastChat
    ? {
        opacity: 1,
        transform: "translateY(0)",
      }
    : {
        opacity: 1,
        transform: "translateY(0)",
      };

  const [menuBtnHover, setMenuBtnHover] = useState(false);
  const [btnHover, setBtnHover] = useState(false);
  const [dateHover, setDateHover] = useState(false);

  return (
    <>
      {/* 🔹 GLOBAL HEADER (fixed, very top of site) */}
      <div style={styles.siteHeader}>
        <div style={styles.siteHeaderTitle}>MaxTradeAI</div>
        <div style={styles.siteHeaderActions}>
          <span style={styles.workspaceTag}>Personal workspace</span>
          <button
            type="button"
            style={{
              ...styles.menuButton,
              ...(menuBtnHover ? styles.menuButtonHover : {}),
            }}
            onClick={() => setMenuOpen((open) => !open)}
            onMouseEnter={() => setMenuBtnHover(true)}
            onMouseLeave={() => setMenuBtnHover(false)}
          >
            ⋯
          </button>

          {menuOpen && (
            <div style={styles.menuDropdown}>
              <div
                style={styles.menuItem}
                onClick={() => {
                  setShowProfile(true);
                  setMenuOpen(false);
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(15,23,42,0.95)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                Profile
              </div>
              <div
                style={{ ...styles.menuItem, ...styles.menuItemDanger }}
                onClick={handleLogout}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(127,29,29,0.9)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                Log out
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PAGE CONTENT */}
      <div style={styles.page}>
        <div style={styles.pageGlow} />
        <div style={styles.pageInner}>
          {/* 🔹 DATE DROPDOWN */}
          <div style={styles.dateRow}>
            <div
              style={{
                ...styles.datePill,
                ...(dateHover ? styles.datePillHover : {}),
              }}
              onClick={() => {
                setShowCalendar((open) => !open);
                if (!showCalendar) {
                  const d = parseLocalDateFromIso(day);
                  setCalendarMonth({
                    year: d.getFullYear(),
                    month: d.getMonth(),
                  });
                }
              }}
              onMouseEnter={() => setDateHover(true)}
              onMouseLeave={() => setDateHover(false)}
            >
              <div style={styles.datePillText}>{formattedDayLabel}</div>
              <div style={styles.datePillIcon}>
                {showCalendar ? "▲" : "▼"}
              </div>
            </div>

            {showCalendar && (
              <div style={styles.calendarPanel}>
                <div style={styles.calendarHeader}>
                  <button
                    type="button"
                    style={styles.calendarNavBtn}
                    onClick={goToPrevMonth}
                  >
                    ‹
                  </button>
                  <div style={styles.calendarHeaderTitle}>
                    {calendarMonthLabel}
                  </div>
                  <button
                    type="button"
                    style={styles.calendarNavBtn}
                    onClick={goToNextMonth}
                  >
                    ›
                  </button>
                </div>

                <div style={styles.weekdayRow}>
                  {["S", "M", "T", "W", "T", "F", "S"].map((w) => (
                    <div key={w} style={styles.weekdayCell}>
                      {w}
                    </div>
                  ))}
                </div>

                {monthWeeks.map((week, wi) => (
                  <div key={wi} style={styles.calendarWeek}>
                    {week.map((cell, di) => {
                      if (!cell) {
                        return <div key={di} style={styles.dayCellEmpty} />;
                      }
                      const isSelected = cell.iso === day;
                      const isToday = cell.iso === todayIso;

                      let style = { ...styles.dayCellBase };
                      if (isSelected) {
                        style = { ...style, ...styles.dayCellSelected };
                      } else if (isToday) {
                        style = { ...style, ...styles.dayCellToday };
                      }

                      return (
                        <div
                          key={di}
                          style={style}
                          onClick={() => handlePickDate(cell.iso)}
                        >
                          {cell.day}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 🔹 2/3 – 1/3 LAYOUT */}
          <div style={styles.mainShell}>
            {/* LEFT: TRADE COACH */}
            <div style={styles.leftCol}>
              <div style={styles.coachCard}>
                <div style={styles.coachHeaderRow}>
                  <div>
                    <div style={styles.coachTitle}>Trade Coach</div>
                    <div style={styles.coachSub}>
                      Upload chart → choose pair & timeframe → explain your idea
                      → AI feedback.
                    </div>
                  </div>
                  <div style={styles.dayBadge}>Day: {day}</div>
                </div>

                {/* STATUS BOX */}
                <div style={styles.statusBox}>
                  <div style={styles.statusGlow} />
                  <div
                    style={{
                      ...styles.statusContent,
                      ...statusAnimatedStyle,
                    }}
                  >
                    {!lastChat && (
                      <>
                        <div style={styles.statusPlaceholderTitle}>
                          Status…
                        </div>
                        <p style={styles.statusPlaceholderText}>
                          Add a screenshot + your thought process below, then
                          press &ldquo;Get feedback&rdquo; to see your trade
                          graded here.
                        </p>
                      </>
                    )}

                    {lastChat && isPending && (
                      <>
                        <div style={styles.statusPlaceholderTitle}>
                          Trade Coach analyzing…
                        </div>
                        <p style={styles.statusPlaceholderText}>
                          Hold on a second while your trade is graded and broken
                          down.
                        </p>
                      </>
                    )}

                    {lastChat && !isPending && (
                      <>
                        <div style={styles.statusHeaderRow}>
                          <div style={styles.statusHeaderLeft}>
                            <span style={styles.statusLabel}>
                              Trade Coach AI
                            </span>
                            {(lastChat.instrument || lastChat.timeframe) && (
                              <span style={styles.statusMeta}>
                                {lastChat.instrument && (
                                  <span>{lastChat.instrument}</span>
                                )}
                                {lastChat.instrument &&
                                  lastChat.timeframe && <span> • </span>}
                                {lastChat.timeframe && (
                                  <span>{lastChat.timeframe}</span>
                                )}
                              </span>
                            )}
                          </div>
                          {grade && (
                            <span
                              style={{
                                ...styles.gradePill,
                                backgroundColor: gradeColor(grade),
                                color: "#020617",
                              }}
                            >
                              {grade}
                            </span>
                          )}
                        </div>

                        {typeof confidence === "number" && (
                          <div style={styles.statusMeta}>
                            {Math.round(confidence * 100)}% confident
                          </div>
                        )}

                        {imgSrc && (
                          <img
                            src={imgSrc}
                            alt="Trade screenshot"
                            style={styles.statusImg}
                          />
                        )}

                        {oneLineVerdict && (
                          <div style={{ opacity: 0.96, fontSize: 13 }}>
                            {oneLineVerdict}
                          </div>
                        )}

                        {whatWentRight.length > 0 && (
                          <>
                            <div style={styles.sectionTitle}>
                              What went right
                            </div>
                            <ul style={styles.ul}>
                              {whatWentRight.map((x, i) => (
                                <li key={i}>{x}</li>
                              ))}
                            </ul>
                          </>
                        )}

                        {whatWentWrong.length > 0 && (
                          <>
                            <div style={styles.sectionTitle}>
                              What went wrong
                            </div>
                            <ul style={styles.ul}>
                              {whatWentWrong.map((x, i) => (
                                <li key={i}>{x}</li>
                              ))}
                            </ul>
                          </>
                        )}

                        {improvements.length > 0 && (
                          <>
                            <div style={styles.sectionTitle}>Improvements</div>
                            <ul style={styles.ul}>
                              {improvements.map((x, i) => (
                                <li key={i}>{x}</li>
                              ))}
                            </ul>
                          </>
                        )}

                        {lessonLearned && (
                          <>
                            <div style={styles.sectionTitle}>
                              Lesson learned
                            </div>
                            <div
                              style={{
                                opacity: 0.96,
                                fontSize: 13,
                                color: "#d1d5db",
                              }}
                            >
                              {lessonLearned}
                            </div>
                          </>
                        )}

                        {(lastChat.serverTimestamp || lastChat.timestamp) && (
                          <div style={styles.smallMeta}>
                            {new Date(
                              lastChat.serverTimestamp || lastChat.timestamp
                            ).toLocaleString()}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* FORM AREA */}
                <form
                  onSubmit={hasCompletedTrade ? undefined : handleSubmit}
                  style={styles.formSection}
                >
                  <div style={styles.composerRow}>
                    <div style={styles.composerLeft}>
                      <div
                        style={{
                          ...styles.dropMini,
                          ...(dragActive ? styles.dropMiniActive : {}),
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        onDragEnter={(e) => {
                          preventDefaults(e);
                          setDragActive(true);
                        }}
                        onDragOver={preventDefaults}
                        onDragLeave={(e) => {
                          preventDefaults(e);
                          setDragActive(false);
                        }}
                        onDrop={handleDrop}
                      >
                        {previewUrl ? (
                          <>
                            <img
                              src={previewUrl}
                              alt="preview"
                              style={styles.previewThumb}
                            />
                            <div style={styles.dropMiniLabel}>
                              <span style={styles.dropMiniTitle}>
                                Screenshot added
                              </span>
                              <span style={styles.dropMiniHint}>
                                Click to replace • drag a new chart here
                              </span>
                            </div>
                            <button
                              type="button"
                              style={styles.miniCloseBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                onChange("file", null);
                              }}
                            >
                              ×
                            </button>
                          </>
                        ) : (
                          <div style={styles.dropMiniLabel}>
                            <span style={styles.dropMiniTitle}>
                              + Add screenshot
                            </span>
                            <span style={styles.dropMiniHint}>
                              Click or drag chart here (.png / .jpg)
                            </span>
                          </div>
                        )}

                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            onChange("file", e.target.files?.[0] || null)
                          }
                          style={{ display: "none" }}
                        />
                      </div>
                    </div>

                    <div style={styles.composerRight}>
                      {/* Instrument + timeframe */}
                      <div style={styles.fieldRow}>
                        <div style={styles.fieldHalf}>
                          <div style={styles.label}>
                            What were you trading?
                          </div>
                          <input
                            type="text"
                            style={styles.input}
                            placeholder="e.g. NASDAQ, S&P 500, GBP/USD, XAU/USD"
                            value={form.instrument}
                            onChange={(e) =>
                              onChange("instrument", e.target.value)
                            }
                          />
                        </div>
                        <div style={styles.fieldHalf}>
                          <div style={styles.label}>Timeframe</div>
                          <div style={styles.selectWrapper}>
                            <select
                              style={styles.select}
                              value={form.timeframe}
                              onChange={(e) =>
                                onChange("timeframe", e.target.value)
                              }
                            >
                              <option value="">Select timeframe</option>
                              <option value="1m">1m</option>
                              <option value="3m">3m</option>
                              <option value="5m">5m</option>
                              <option value="15m">15m</option>
                              <option value="30m">30m</option>
                              <option value="1H">1H</option>
                              <option value="2H">2H</option>
                              <option value="4H">4H</option>
                              <option value="Daily">Daily</option>
                            </select>
                            <span style={styles.selectArrow}>▾</span>
                          </div>
                        </div>
                      </div>

                      <div style={styles.label}>
                        Strategy / thought process — what setup were you
                        taking?
                      </div>
                      <textarea
                        value={form.strategyNotes}
                        onChange={(e) =>
                          onChange("strategyNotes", e.target.value)
                        }
                        placeholder="Explain your idea: HTF bias, BOS/CHoCH, FVG/OB, liquidity grab, session, target, risk plan, management rules..."
                        required
                        style={styles.textarea}
                      />
                    </div>
                  </div>

                  <button
                    type={hasCompletedTrade ? "button" : "submit"}
                    disabled={buttonDisabled}
                    style={{
                      ...styles.button,
                      ...(btnHover && !buttonDisabled
                        ? styles.buttonHover
                        : {}),
                    }}
                    onClick={hasCompletedTrade ? handleResetTrade : undefined}
                    onMouseEnter={() => !buttonDisabled && setBtnHover(true)}
                    onMouseLeave={() => setBtnHover(false)}
                  >
                    {primaryButtonLabel}
                  </button>

                  {error && (
                    <div style={styles.error}>
                      Error: {error}
                      {!WEBHOOK_URL && (
                        <div style={styles.hint}>
                          Tip: define VITE_N8N_TRADE_FEEDBACK_WEBHOOK in
                          .env.local and in your deploy env.
                        </div>
                      )}
                    </div>
                  )}
                </form>
              </div>
            </div>

            {/* RIGHT: JOURNAL */}
            <div style={styles.rightCol}>
              <div style={styles.journalCard}>
                <div style={styles.journalHeaderRow}>
                  <div>
                    <div style={styles.journalTitle}>Journal</div>
                    <div style={styles.journalSub}>
                      Your personal notes for this day. Saved automatically for
                      each date you select.
                    </div>
                  </div>
                  <div style={styles.journalBadge}>Entry for {day}</div>
                </div>

                <div>
                  <div style={styles.journalLabel}>Notes</div>
                  <textarea
                    style={styles.journalTextareaBig}
                    value={journal.notes}
                    onChange={(e) =>
                      setJournal((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    placeholder="Text here..."
                  />
                </div>

                <div>
                  <div style={styles.journalLabel}>
                    What did you learn today?
                  </div>
                  <textarea
                    style={styles.journalTextareaSmall}
                    value={journal.learned}
                    onChange={(e) =>
                      setJournal((prev) => ({
                        ...prev,
                        learned: e.target.value,
                      }))
                    }
                    placeholder="Key lessons, patterns, or rules you want to remember."
                  />
                </div>

                <div>
                  <div style={styles.journalLabel}>
                    What do you need to improve?
                  </div>
                  <textarea
                    style={styles.journalTextareaSmall}
                    value={journal.improve}
                    onChange={(e) =>
                      setJournal((prev) => ({
                        ...prev,
                        improve: e.target.value,
                      }))
                    }
                    placeholder="Risk, discipline, entries, exits, patience, etc."
                  />
                </div>

                <div style={styles.journalHintRow}>
                  <span>
                    Auto-saved per day — switch dates above to see past
                    entries.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PROFILE MODAL */}
      {showProfile && (
        <div style={styles.overlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalTitle}>Profile</div>
            <div style={styles.modalText}>
              Basic info for your MaxTradeAI workspace.
            </div>

            <div style={styles.modalRow}>
              <div style={styles.modalLabel}>Member ID</div>
              <div style={styles.modalValue}>{member?.memberId || "—"}</div>
            </div>

            <button
              type="button"
              style={styles.modalCloseBtn}
              onClick={() => setShowProfile(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
