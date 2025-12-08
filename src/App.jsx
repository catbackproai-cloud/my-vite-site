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


const gradeColor = (grade) => {
  switch (grade) {
    case "A":
      return "#2ecc71"; // green
    case "B":
      return "#7bd67b"; // soft green
    case "C":
      return "#f1c40f"; // yellow
    case "D":
      return "#e67e22"; // orange
    case "F":
      return "#e74c3c"; // red
    default:
      return "#bdc3c7"; // gray if missing
  }
};

function todayStr() {
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
  selectedDay = new Date().toISOString().slice(0, 10),
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

  // ⭐ header menu + profile modal state
  const [menuOpen, setMenuOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
// ⭐ DAY + CALENDAR STATE
const [day, setDay] = useState(() => {
  try {
    const saved = localStorage.getItem(LAST_DAY_KEY);
    return saved || selectedDay; // fallback to today / prop
  } catch {
    return selectedDay;
  }
}); // internal selected day

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
      background: "#0b0f14",
      color: "#e7ecf2",
      padding: "80px 16px 24px", // top padding to clear fixed header
      boxSizing: "border-box",
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
      background: "rgba(7,11,16,0.96)",
      borderBottom: "1px solid #151e2a",
      backdropFilter: "blur(16px)",
      zIndex: 70,
    },
    siteHeaderTitle: {
      fontSize: 18,
      fontWeight: 800,
    },
    siteHeaderActions: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      fontSize: 12,
      opacity: 0.8,
      position: "relative",
    },
    menuButton: {
      width: 28,
      height: 28,
      borderRadius: 999,
      border: "1px solid #243043",
      background: "#0d121a",
      color: "#e7ecf2",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      fontSize: 18,
      padding: 0,
    },
    menuDropdown: {
      position: "absolute",
      top: 36,
      right: 0,
      background: "#121821",
      borderRadius: 12,
      border: "1px solid #243043",
      boxShadow: "0 16px 50px rgba(0,0,0,0.6)",
      padding: 6,
      minWidth: 160,
      zIndex: 80,
    },
    menuItem: {
      padding: "8px 10px",
      borderRadius: 8,
      fontSize: 13,
      cursor: "pointer",
    },
    menuItemDanger: {
      color: "#ff9ba8",
    },

    // 🔹 DATE DROPDOWN ROW
    dateRow: {
      width: "100%",
      maxWidth: 1100,
      margin: "0 auto 16px",
      display: "flex",
      justifyContent: "center",
      position: "relative",
    },
    datePill: {
      minWidth: 260,
      padding: "8px 14px",
      borderRadius: 999,
      background: "#121821",
      border: "1px solid #243043",
      fontSize: 13,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      cursor: "pointer",
      boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
    },
    datePillText: {
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    datePillIcon: {
      fontSize: 12,
      opacity: 0.8,
      marginLeft: 8,
    },

    calendarPanel: {
      position: "absolute",
      top: "115%",
      zIndex: 60,
      background: "#121821",
      borderRadius: 16,
      border: "1px solid #243043",
      padding: 12,
      boxShadow: "0 18px 50px rgba(0,0,0,0.7)",
      width: 320,
    },
    calendarHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
      fontSize: 13,
    },
    calendarHeaderTitle: {
      fontWeight: 700,
    },
    calendarNavBtn: {
      width: 26,
      height: 26,
      borderRadius: 999,
      border: "1px solid #243043",
      background: "transparent",
      color: "#e7ecf2",
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
    },
    dayCellSelected: {
      background: "#1b9aaa",
      color: "#fff",
      borderColor: "#1b9aaa",
    },
    dayCellToday: {
      borderColor: "#1b9aaa88",
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
      background: "#121821",
      borderRadius: 16,
      boxShadow: "0 8px 30px rgba(0,0,0,.35)",
      padding: 18,
      display: "flex",
      flexDirection: "column",
      gap: 12,
      minHeight: 0,
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
    },
    coachSub: {
      fontSize: 12,
      opacity: 0.7,
      marginTop: 4,
      maxWidth: 360,
    },
    dayBadge: {
      fontSize: 11,
      opacity: 0.8,
      border: "1px solid #243043",
      borderRadius: 999,
      padding: "4px 10px",
      whiteSpace: "nowrap",
      alignSelf: "flex-start",
    },

    // 🔹 STATUS BOX
    statusBox: {
      marginTop: 4,
      background: "#0d121a",
      borderRadius: 14,
      border: "1px solid #243043",
      padding: 14,
      minHeight: 230,
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      gap: 8,
    },
    statusPlaceholderTitle: {
      fontSize: 16,
      fontWeight: 700,
      marginBottom: 4,
    },
    statusPlaceholderText: {
      fontSize: 13,
      opacity: 0.75,
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
    },
    statusMeta: {
      fontSize: 11,
      opacity: 0.7,
    },
    gradePill: {
      fontSize: 14,
      fontWeight: 900,
      padding: "2px 8px",
      borderRadius: 8,
      background: "#1b9aaa22",
    },
    statusImg: {
      width: "100%",
      maxWidth: 320,
      borderRadius: 10,
      border: "1px solid #243043",
      marginBottom: 6,
      marginTop: 4,
      alignSelf: "flex-start",
    },
    sectionTitle: { fontWeight: 800, marginTop: 6, marginBottom: 4 },
    ul: { margin: 0, paddingLeft: 18, opacity: 0.95, fontSize: 13 },
    smallMeta: { fontSize: 11, opacity: 0.6, marginTop: 6 },

    // 🔹 FORM BELOW STATUS
    formSection: {
      marginTop: 8,
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
      flex: "0 0 180px",
      minWidth: 150,
    },
    composerRight: {
      flex: "1 1 260px",
      minWidth: 260,
    },

    dropMini: {
      background: "#0d121a",
      border: "1px dashed #243043",
      borderRadius: 12,
      padding: 10,
      height: "100%",
      minHeight: 80,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      cursor: "pointer",
      fontSize: 12,
      color: "rgba(231,236,242,0.8)",
      transition: "border-color .2s ease, background .2s ease",
      position: "relative",
      boxSizing: "border-box",
    },
    dropMiniActive: {
      borderColor: "#1b9aaa",
      background: "#0f1621",
    },
    previewThumb: {
      maxWidth: 80,
      maxHeight: 60,
      borderRadius: 8,
      border: "1px solid #243043",
      objectFit: "cover",
    },
    dropMiniLabel: {
      display: "flex",
      flexDirection: "column",
      gap: 2,
    },
    dropMiniTitle: { fontWeight: 700, fontSize: 12 },
    dropMiniHint: { fontSize: 11, opacity: 0.75 },
    miniCloseBtn: {
      position: "absolute",
      top: 6,
      right: 6,
      width: 20,
      height: 20,
      borderRadius: "9999px",
      border: "none",
      background: "rgba(0,0,0,0.7)",
      color: "#fff",
      fontSize: 12,
      fontWeight: 800,
      lineHeight: "18px",
      textAlign: "center",
      cursor: "pointer",
    },

    label: { fontSize: 12, opacity: 0.7, marginBottom: 4 },

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
      background: "#0d121a",
      border: "1px solid #243043",
      borderRadius: 10,
      color: "#e7ecf2",
      padding: "8px 10px",
      fontSize: 13,
      outline: "none",
      boxSizing: "border-box",
    },
    select: {
      width: "100%",
      background: "#0d121a",
      border: "1px solid #243043",
      borderRadius: 10,
      color: "#e7ecf2",
      padding: "8px 10px",
      fontSize: 13,
      outline: "none",
      boxSizing: "border-box",
      appearance: "none",
  WebkitAppearance: "none",
  MozAppearance: "none",
  selectArrow: {
  position: "absolute",
  right: 10,
  top: "50%",
  transform: "translateY(-50%)",
  fontSize: 10,
  pointerEvents: "none",
  opacity: 0.7,
},
    },

    textarea: {
      width: "100%",
      minHeight: 90,
      background: "#0d121a",
      border: "1px solid #243043",
      borderRadius: 12,
      color: "#e7ecf2",
      padding: "10px 12px",
      outline: "none",
      resize: "vertical",
      fontSize: 14,
      boxSizing: "border-box",
    },

    button: {
      marginTop: 2,
      width: "100%",
      background: buttonDisabled ? "#1b9aaa88" : "#1b9aaa",
      color: "#fff",
      border: "none",
      borderRadius: 12,
      padding: "10px 14px",
      fontWeight: 800,
      cursor: buttonDisabled ? "not-allowed" : "pointer",
      opacity: buttonDisabled ? 0.6 : 1,
      fontSize: 14,
      transition: "background .15s ease, opacity .15s ease",
    },
    error: {
      marginTop: 4,
      padding: 10,
      borderRadius: 12,
      background: "#2b1620",
      color: "#ffd0d7",
      whiteSpace: "pre-wrap",
      fontSize: 12,
    },
    hint: { marginTop: 4, fontSize: 11, opacity: 0.7 },

    // 🔹 JOURNAL
    journalCard: {
      background: "#121821",
      borderRadius: 16,
      boxShadow: "0 8px 30px rgba(0,0,0,.35)",
      padding: 18,
      display: "flex",
      flexDirection: "column",
      gap: 10,
      minHeight: 0,
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
    },
    journalSub: {
      fontSize: 11,
      opacity: 0.75,
      marginTop: 4,
      maxWidth: 260,
    },
    journalBadge: {
      fontSize: 11,
      padding: "4px 8px",
      borderRadius: 999,
      border: "1px solid #243043",
      background: "#0b1018",
      opacity: 0.9,
      whiteSpace: "nowrap",
    },
    journalLabel: {
      fontSize: 12,
      opacity: 0.75,
      marginBottom: 4,
    },
    journalTextareaBig: {
      width: "100%",
      minHeight: 140,
      background: "#05080d",
      border: "1px solid #243043",
      borderRadius: 12,
      color: "#e7ecf2",
      padding: "10px 12px",
      outline: "none",
      resize: "vertical",
      fontSize: 14,
      boxSizing: "border-box",
    },
    journalTextareaSmall: {
      width: "100%",
      minHeight: 70,
      background: "#05080d",
      border: "1px solid #243043",
      borderRadius: 12,
      color: "#e7ecf2",
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
      opacity: 0.75,
      marginTop: 4,
    },

    // 🔹 PROFILE MODAL
    overlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.65)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 90,
      padding: 16,
    },
    modalCard: {
      width: "100%",
      maxWidth: 380,
      background: "#121821",
      borderRadius: 16,
      border: "1px solid #243043",
      padding: 18,
      boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
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
    modalRow: {
      marginBottom: 8,
      fontSize: 13,
    },
    modalLabel: {
      fontWeight: 700,
      opacity: 0.9,
    },
    modalValue: {
      opacity: 0.9,
    },
    modalCloseBtn: {
      marginTop: 12,
      width: "100%",
      borderRadius: 10,
      border: "1px solid #243043",
      padding: "8px 12px",
      fontSize: 13,
      fontWeight: 500,
      background: "transparent",
      color: "#e7ecf2",
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

  // Persist chats per day
  useEffect(() => {
    const key = `tradeChats:${day}`;
    safeSaveChats(key, chats);
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

  // 🔹 Persist journal per day
  useEffect(() => {
    try {
      const keyV2 = `tradeJournalV2:${day}`;
      localStorage.setItem(keyV2, JSON.stringify(journal));
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

  return (
    <>
      {/* 🔹 GLOBAL HEADER (fixed, very top of site) */}
      <div style={styles.siteHeader}>
        <div style={styles.siteHeaderTitle}>Trade Coach Portal</div>
        <div style={styles.siteHeaderActions}>
          <span>Personal workspace</span>
          <button
            type="button"
            style={styles.menuButton}
            onClick={() => setMenuOpen((open) => !open)}
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
                  (e.currentTarget.style.background = "#1a2432")
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
                  (e.currentTarget.style.background = "#2b1620")
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
        {/* 🔹 DATE DROPDOWN */}
        <div style={styles.dateRow}>
          <div
            style={styles.datePill}
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
          >
            <div style={styles.datePillText}>{formattedDayLabel}</div>
            <div style={styles.datePillIcon}>{showCalendar ? "▲" : "▼"}</div>
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
                {!lastChat && (
                  <>
                    <div style={styles.statusPlaceholderTitle}>Status…</div>
                    <p style={styles.statusPlaceholderText}>
                      Add a screenshot + your thought process below, then press
                      &ldquo;Get feedback&rdquo; to see your trade graded here.
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
                        <span style={styles.statusLabel}>Trade Coach AI</span>
                        {(lastChat.instrument || lastChat.timeframe) && (
                          <span style={styles.statusMeta}>
                            {lastChat.instrument && (
                              <span>{lastChat.instrument}</span>
                            )}
                            {lastChat.instrument && lastChat.timeframe && (
                              <span> • </span>
                            )}
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
                            color: "#0b0f14",
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
                      <div style={{ opacity: 0.95, fontSize: 13 }}>
                        {oneLineVerdict}
                      </div>
                    )}

                    {whatWentRight.length > 0 && (
                      <>
                        <div style={styles.sectionTitle}>What went right</div>
                        <ul style={styles.ul}>
                          {whatWentRight.map((x, i) => (
                            <li key={i}>{x}</li>
                          ))}
                        </ul>
                      </>
                    )}

                    {whatWentWrong.length > 0 && (
                      <>
                        <div style={styles.sectionTitle}>What went wrong</div>
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
                        <div style={styles.sectionTitle}>Lesson learned</div>
                        <div style={{ opacity: 0.95, fontSize: 13 }}>
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
                      </div>
                    </div>

                    <div style={styles.label}>
                      Strategy / thought process — what setup were you taking?
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
                  style={styles.button}
                  onClick={hasCompletedTrade ? handleResetTrade : undefined}
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

      {/* PROFILE MODAL */}
      {showProfile && (
        <div style={styles.overlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalTitle}>Profile</div>
            <div style={styles.modalText}>
              Basic info for your Trade Coach portal.
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
