import { useEffect, useMemo, useRef, useState } from "react";

// ✅ Single source of truth for prod:
const PROD_WEBHOOK = "https://jacobtf007.app.n8n.cloud/webhook/tradecoach_signup";

// ✅ Env override if you ever want it later:
const WEBHOOK_URL =
  (import.meta?.env && import.meta.env.VITE_N8N_TRADE_FEEDBACK_WEBHOOK) ||
  PROD_WEBHOOK;

// ⭐ signup / login webhook (email-based)
const SIGNUP_WEBHOOK =
  import.meta.env?.VITE_N8N_TRADECOACH_SIGNUP ||
  "https://jacobtf007.app.n8n.cloud/webhook/tradecoach_signup";

// ⭐ localStorage keys
const LS_USER_KEY = "tc_user_v1";
const LS_USAGE_KEY = "tc_usage_v1";

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
  const [form, setForm] = useState({ strategyNotes: "", file: null });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const [chats, setChats] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);
  const chatEndRef = useRef(null);
  const chatWrapRef = useRef(null);

  // ⭐ logged-in user
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  // ⭐ usage tracking
  const [usage, setUsage] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_USAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return { anonUsed: false, lastDate: null, countToday: 0 };
  });

  // ⭐ auth / paywall / profile
  const [showSignup, setShowSignup] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authMode, setAuthMode] = useState("signup"); // "signup" | "login"
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // ⭐ DAY + CALENDAR STATE
  const [day, setDay] = useState(selectedDay); // internal selected day
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date(selectedDay);
    return { year: d.getFullYear(), month: d.getMonth() }; // 0-index
  });

  // ⭐ TAB + JOURNAL STATE
  const [activeTab, setActiveTab] = useState("coach"); // "coach" | "journal"
  const [journalText, setJournalText] = useState("");

  const todayIso = todayStr();

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
    // when the day changes, chats & journal use the useEffects below
  }

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
      setError("");
    } catch {
      setChats([]);
    }
  }, [day]);

  // Persist chats
  useEffect(() => {
    const key = `tradeChats:${day}`;
    safeSaveChats(key, chats);
  }, [chats, day]);

  // 🔹 Load journal per day
  useEffect(() => {
    try {
      const key = `tradeJournal:${day}`;
      const saved = localStorage.getItem(key);
      setJournalText(saved || "");
    } catch {
      setJournalText("");
    }
  }, [day]);

  // 🔹 Persist journal per day
  useEffect(() => {
    try {
      const key = `tradeJournal:${day}`;
      localStorage.setItem(key, journalText || "");
    } catch {
      // ignore
    }
  }, [journalText, day]);

  // Auto-scroll
  useEffect(() => {
    if (!chats.length) return;
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [chats.length, chats]);

  // Persist user + usage
  useEffect(() => {
    try {
      localStorage.setItem(LS_USER_KEY, JSON.stringify(user));
    } catch {}
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_USAGE_KEY, JSON.stringify(usage));
    } catch {}
  }, [usage]);

  const isValid = useMemo(
    () => !!form.strategyNotes && !!form.file,
    [form]
  );
  const onChange = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  // Gating logic
  function canSubmitNow() {
    const today = todayStr();

    if (!user) {
      if (!usage.anonUsed) {
        return { allowed: true, reason: "firstAnon" };
      }
      return { allowed: false, reason: "needSignup" };
    }

    const isPro = user.plan === "pro";
    if (isPro) return { allowed: true, reason: "pro" };

    if (usage.lastDate === today && (usage.countToday || 0) >= 1) {
      return { allowed: false, reason: "limitReached" };
    }

    return { allowed: true, reason: "freeWithinLimit" };
  }

  // Signup / login
  async function handleAuthSubmit(e) {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    try {
      const res = await fetch(SIGNUP_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authForm),
      });

      if (!res.ok) throw new Error("Signup/login failed");

      const data = await res.json(); // { userId, name, email, plan? }
      setUser({
        userId: data.userId,
        name: data.name,
        email: data.email,
        plan: data.plan || "free",
      });
      setShowSignup(false);
      setProfileDropdownOpen(false);
    } catch (err) {
      console.error(err);
      setAuthError("Could not sign you in. Check details and try again.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!isValid || submitting) return;

    const gate = canSubmitNow();
    if (!gate.allowed) {
      if (gate.reason === "needSignup") {
        setAuthMode("signup");
        setAuthForm({ name: "", email: "", password: "" });
        setAuthError("");
        setShowSignup(true);
      } else if (gate.reason === "limitReached") {
        setShowPaywall(true);
      }
      return;
    }

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
      };

      setChats((prev) => [...prev, tempChat]);

      const fd = new FormData();
      fd.append("day", day);
      fd.append("strategyNotes", form.strategyNotes);
      fd.append("userId", user?.userId || "");
      fd.append("userEmail", user?.email || "");
      fd.append(
        "userPlan",
        user?.plan || (gate.reason === "firstAnon" ? "anon" : "free")
      );
      if (form.file) fd.append("screenshot", form.file);

      console.log("[Trade Coach] POSTing to", WEBHOOK_URL);
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        body: fd,
      });

      const text = await res.text();
      console.log(
        "[Trade Coach] status",
        res.status,
        "body:",
        text?.slice(0, 200)
      );

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
            screenshotUrl: normalizeDriveUrl(data?.screenshotUrl) || null,
            analysis: data?.analysis || data || null,
            serverTimestamp: data?.timestamp || null,
            localPreviewUrl: null,
            localDataUrl: null,
          };
        })
      );

      const today = todayStr();
      setUsage((prev) => {
        if (!user && gate.reason === "firstAnon") {
          return { anonUsed: true, lastDate: today, countToday: 1 };
        }

        if (user && user.plan !== "pro") {
          if (prev.lastDate === today) {
            return {
              ...prev,
              lastDate: today,
              countToday: (prev.countToday || 0) + 1,
            };
          }
          return {
            ...prev,
            lastDate: today,
            countToday: 1,
          };
        }

        return { ...prev, lastDate: today };
      });

      setForm({ strategyNotes: "", file: null });
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

  const styles = {
    page: {
      minHeight: "100vh",
      background: "#0b0f14",
      color: "#e7ecf2",
      display: "grid",
      placeItems: "center",
      padding: "80px 12px 24px", // top padding to clear fixed header
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
    },
    headerButtonGhost: {
      background: "transparent",
      border: "1px solid #243043",
      color: "#e7ecf2",
      padding: "6px 14px",
      borderRadius: 999,
      fontSize: 13,
      cursor: "pointer",
    },
    headerButtonPrimary: {
      background: "#1b9aaa",
      border: "none",
      color: "#fff",
      padding: "6px 14px",
      borderRadius: 999,
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer",
    },
    userBadge: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 10px",
      borderRadius: 999,
      border: "1px solid #243043",
      background: "#0d121a",
      cursor: "pointer",
      fontSize: 13,
    },
    avatar: {
      width: 24,
      height: 24,
      borderRadius: "999px",
      background: "#1b9aaa33",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 12,
      fontWeight: 700,
    },
    dropdownMenu: {
      position: "absolute",
      top: 38,
      right: 0,
      background: "#121821",
      borderRadius: 10,
      border: "1px solid #243043",
      minWidth: 160,
      boxShadow: "0 14px 40px rgba(0,0,0,0.5)",
      padding: 6,
      zIndex: 80,
    },
    dropdownItem: {
      padding: "8px 10px",
      fontSize: 13,
      cursor: "pointer",
      borderRadius: 8,
    },
    dropdownItemMuted: {
      fontSize: 11,
      opacity: 0.7,
      padding: "4px 10px",
    },

    // 🔹 DATE DROPDOWN ROW (sits in the "gap" under header, above chat card)
    dateRow: {
      width: "100%",
      maxWidth: 760,
      margin: "0 auto 12px",
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

    card: {
      width: "100%",
      maxWidth: 760,
      background: "#121821",
      borderRadius: 16,
      boxShadow: "0 8px 30px rgba(0,0,0,.35)",
      padding: 20,
      display: "flex",
      flexDirection: "column",
      gap: 12,
      maxHeight: "90vh",
      position: "relative",
    },
    header: { textAlign: "center" },
    dayBadge: {
      display: "inline-block",
      fontSize: 12,
      opacity: 0.75,
      border: "1px solid #243043",
      borderRadius: 10,
      padding: "4px 10px",
      marginTop: 6,
    },
    planBadge: {
      display: "inline-block",
      fontSize: 11,
      opacity: 0.8,
      borderRadius: 999,
      padding: "4px 10px",
      marginTop: 6,
      background: "#0d121a",
      border: "1px solid #243043",
    },
    title: { fontSize: 26, fontWeight: 800, margin: 0 },
    subtitle: { fontSize: 12, opacity: 0.7, marginTop: 6 },

    // 🔹 TAB STRIP (Chrome-style)
    tabRow: {
      marginTop: 16,
      marginBottom: 4,
      display: "flex",
      alignItems: "flex-end",
      gap: 6,
      borderBottom: "1px solid #243043",
    },
    tab: {
      padding: "6px 14px",
      borderRadius: "10px 10px 0 0",
      background: "#0d121a",
      border: "1px solid #243043",
      borderBottom: "1px solid #243043",
      fontSize: 13,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: 6,
      color: "rgba(231,236,242,0.8)",
      transform: "translateY(1px)",
    },
    tabActive: {
      background: "#121821",
      borderBottomColor: "#121821",
      color: "#ffffff",
      boxShadow: "0 -2px 12px rgba(0,0,0,0.45)",
      zIndex: 2,
    },
    tabLabel: {
      fontWeight: 600,
      whiteSpace: "nowrap",
    },
    tabBadge: {
      fontSize: 10,
      padding: "2px 6px",
      borderRadius: 999,
      border: "1px solid #243043",
      background: "#0b1018",
      textTransform: "uppercase",
      letterSpacing: 0.4,
      opacity: 0.8,
    },

    chatShell: {
      display: "flex",
      flexDirection: "column",
      gap: 10,
      flex: "1 1 auto",
    },

    chatWindow: {
      flex: "1 1 auto",
      minHeight: 220,
      maxHeight: 420,
      background: "#0d121a",
      borderRadius: 14,
      border: "1px solid #243043",
      padding: 12,
      display: "grid",
      gap: 10,
      overflowY: "auto",
      scrollBehavior: "smooth",
    },

    composer: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      marginTop: 4,
    },
    composerRow: {
      display: "flex",
      gap: 10,
      alignItems: "stretch",
    },
    composerLeft: {
      flex: "0 0 25%",
      minWidth: 150,
    },
    composerRight: {
      flex: "1 1 75%",
    },

    dropMini: {
      background: "#0d121a",
      border: "1px dashed #243043",
      borderRadius: 12,
      padding: 10,
      height: "100%",
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
    label: { fontSize: 12, opacity: 0.7, marginBottom: 4 },

    button: {
      marginTop: 2,
      width: "100%",
      background: "#1b9aaa",
      color: "#fff",
      border: "none",
      borderRadius: 12,
      padding: "10px 14px",
      fontWeight: 800,
      cursor: isValid && !submitting ? "pointer" : "not-allowed",
      opacity: isValid && !submitting ? 1 : 0.5,
      fontSize: 14,
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
    hint: { marginTop: 6, fontSize: 11, opacity: 0.7 },

    // 🔹 JOURNAL
    journalShell: {
      flex: "1 1 auto",
      background: "#0d121a",
      borderRadius: 14,
      border: "1px solid #243043",
      padding: 14,
      display: "flex",
      flexDirection: "column",
      gap: 10,
      minHeight: 240,
    },
    journalHeaderRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      gap: 8,
    },
    journalTitle: {
      fontSize: 15,
      fontWeight: 700,
    },
    journalSub: {
      fontSize: 11,
      opacity: 0.75,
      marginTop: 4,
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
    journalTextarea: {
      width: "100%",
      minHeight: 170,
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
    journalHintRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      fontSize: 11,
      opacity: 0.75,
    },
    journalHint: {
      fontSize: 11,
      opacity: 0.75,
    },

    bubbleRow: {
      display: "flex",
      gap: 10,
      alignItems: "flex-start",
    },
    bubbleUser: {
      marginLeft: "auto",
      background: "#1a2432",
      border: "1px solid #243043",
      color: "#e7ecf2",
      padding: "10px 12px",
      borderRadius: "14px 14px 2px 14px",
      maxWidth: "80%",
      whiteSpace: "pre-wrap",
      fontSize: 13,
    },
    bubbleAI: {
      marginRight: "auto",
      background: "#111820",
      border: "1px solid #243043",
      color: "#e7ecf2",
      padding: "10px 12px",
      borderRadius: "14px 14px 14px 2px",
      maxWidth: "80%",
      whiteSpace: "pre-wrap",
      fontSize: 13,
    },
    bubbleHeader: {
      fontWeight: 800,
      marginBottom: 6,
      display: "flex",
      alignItems: "center",
      gap: 8,
    },
    gradePill: {
      fontSize: 14,
      fontWeight: 900,
      padding: "2px 8px",
      borderRadius: 8,
      background: "#1b9aaa22",
    },
    sectionTitle: { fontWeight: 800, marginTop: 8, marginBottom: 4 },
    ul: { margin: 0, paddingLeft: 18, opacity: 0.95 },
    smallMeta: { fontSize: 11, opacity: 0.6, marginTop: 6 },
    emptyState: {
      fontSize: 12,
      opacity: 0.7,
      textAlign: "center",
      padding: "8px 0",
    },

    overlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.65)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 90,
      padding: "16px",
    },
    modalCard: {
      width: "100%",
      maxWidth: 420,
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
    input: {
      width: "100%",
      borderRadius: 10,
      border: "1px solid #243043",
      background: "#0d121a",
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
  };

  const userInitials =
    user?.name?.trim()?.split(" ")?.map((p) => p[0])?.join("")?.toUpperCase() ||
    "U";

  return (
    <>
      {/* 🔹 GLOBAL HEADER (fixed, very top of site) */}
      <div style={styles.siteHeader}>
        <div style={styles.siteHeaderTitle}>Trade Coach</div>

        <div style={styles.siteHeaderActions}>
          {!user && (
            <>
              <button
                style={styles.headerButtonGhost}
                onClick={() => {
                  setAuthMode("login");
                  setAuthForm({ name: "", email: "", password: "" });
                  setAuthError("");
                  setShowSignup(true);
                }}
              >
                Sign In
              </button>
              <button
                style={styles.headerButtonPrimary}
                onClick={() => {
                  setAuthMode("signup");
                  setAuthForm({ name: "", email: "", password: "" });
                  setAuthError("");
                  setShowSignup(true);
                }}
              >
                Sign Up
              </button>
            </>
          )}

          {user && (
            <div style={{ position: "relative" }}>
              <div
                style={styles.userBadge}
                onClick={() =>
                  setProfileDropdownOpen((open) => !open)
                }
              >
                <div style={styles.avatar}>{userInitials}</div>
                <div>
                  <div style={{ fontSize: 12 }}>{user.name}</div>
                  <div style={{ fontSize: 10, opacity: 0.7 }}>
                    {user.plan === "pro" ? "Pro" : "Free"}
                  </div>
                </div>
              </div>

              {profileDropdownOpen && (
                <div style={styles.dropdownMenu}>
                  <div style={styles.dropdownItemMuted}>
                    Signed in as
                    <br />
                    <span style={{ fontSize: 11 }}>{user.email}</span>
                  </div>
                  <div
                    style={{
                      ...styles.dropdownItem,
                      marginTop: 4,
                    }}
                    onClick={() => {
                      setShowProfile(true);
                      setProfileDropdownOpen(false);
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
                    style={{
                      ...styles.dropdownItem,
                      color: "#ff9ba8",
                    }}
                    onClick={() => {
                      localStorage.removeItem(LS_USER_KEY);
                      setUser(null);
                      setProfileDropdownOpen(false);
                    }}
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
          )}
        </div>
      </div>

      {/* PAGE CONTENT */}
      <div style={styles.page}>
        {/* 🔹 DATE DROPDOWN IN THE GAP (below header, above card) */}
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
                      return (
                        <div
                          key={di}
                          style={styles.dayCellEmpty}
                        />
                      );
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

        {/* MAIN CARD */}
        <div style={styles.card}>
          <div style={styles.header}>
            <h1 style={styles.title}>Trade Coach (Personal)</h1>
            <div style={styles.subtitle}>
              Upload chart (screenshot) → then write your thought process → AI
              feedback
            </div>
            <div style={styles.dayBadge}>
              Day: {day} • saved per-day
            </div>
            {user && (
              <div style={styles.planBadge}>
                {user.plan === "pro"
                  ? "Pro plan • unlimited feedback"
                  : "Free plan • 1 feedback per day"}
              </div>
            )}
          </div>

          {/* 🔹 TAB STRIP ABOVE THE BOX */}
          <div style={styles.tabRow}>
            <div
              style={{
                ...styles.tab,
                ...(activeTab === "coach" ? styles.tabActive : {}),
              }}
              onClick={() => setActiveTab("coach")}
            >
              <span style={styles.tabLabel}>Trade Coach</span>
              <span style={styles.tabBadge}>AI</span>
            </div>
            <div
              style={{
                ...styles.tab,
                ...(activeTab === "journal" ? styles.tabActive : {}),
              }}
              onClick={() => setActiveTab("journal")}
            >
              <span style={styles.tabLabel}>Journal</span>
              <span style={styles.tabBadge}>Daily</span>
            </div>
          </div>

          {/* 🔹 TAB CONTENT */}
          {activeTab === "coach" ? (
            <>
              <div style={styles.chatShell}>
                {/* SCROLLABLE CHAT WINDOW */}
                <div
                  ref={chatWrapRef}
                  style={{
                    ...styles.chatWindow,
                    ...(dragActive ? styles.dropMiniActive : {}),
                  }}
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
                  {chats.length === 0 && (
                    <div style={styles.emptyState}>
                      No trades yet. Upload a chart + notes below to get
                      feedback.
                    </div>
                  )}

                  {chats.map((chat) => (
                    <ChatTurn key={chat.id} chat={chat} styles={styles} />
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {/* COMPOSER */}
                <form onSubmit={handleSubmit} style={styles.composer}>
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
                                Click to replace • drag new chart here
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
                      <div style={styles.label}>
                        Strategy / thought process — what setup were you
                        taking?
                      </div>
                      <textarea
                        value={form.strategyNotes}
                        onChange={(e) =>
                          onChange("strategyNotes", e.target.value)
                        }
                        placeholder="Explain your idea: HTF bias, BOS/CHoCH, FVG fill, OB mitigation, session, target, risk plan, management rules..."
                        required
                        style={styles.textarea}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!isValid || submitting}
                    style={styles.button}
                  >
                    {submitting ? "Uploading…" : "Get Feedback"}
                  </button>
                </form>
              </div>

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
            </>
          ) : (
            <div style={styles.journalShell}>
              <div style={styles.journalHeaderRow}>
                <div>
                  <div style={styles.journalTitle}>Daily Journal</div>
                  <div style={styles.journalSub}>
                    Capture how today felt, what you learned, and how you&apos;ll
                    improve next session.
                  </div>
                </div>
                <div style={styles.journalBadge}>Saved for {day}</div>
              </div>

              <textarea
                style={styles.journalTextarea}
                value={journalText}
                onChange={(e) => setJournalText(e.target.value)}
                placeholder="Prompts: What did I do well today? What tilted me? Did I follow my plan? What is one thing I will do better next session?"
              />

              <div style={styles.journalHintRow}>
                <span style={styles.journalHint}>
                  Auto-saved per day — switch dates above like normal to see past
                  entries.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AUTH MODAL */}
      {showSignup && (
        <div style={styles.overlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalTitle}>
              {authMode === "signup" ? "Create your free account" : "Sign in"}
            </div>
            <div style={styles.modalText}>
              {authMode === "signup"
                ? "Get 1 free AI trade review per day."
                : "Sign in with your email and password."}
            </div>
            <form onSubmit={handleAuthSubmit}>
              {authMode === "signup" && (
                <input
                  type="text"
                  required
                  placeholder="Name"
                  value={authForm.name}
                  onChange={(e) =>
                    setAuthForm((f) => ({ ...f, name: e.target.value }))
                  }
                  style={styles.input}
                />
              )}
              <input
                type="email"
                required
                placeholder="Email"
                value={authForm.email}
                onChange={(e) =>
                  setAuthForm((f) => ({ ...f, email: e.target.value }))
                }
                style={styles.input}
              />
              <input
                type="password"
                required
                placeholder="Password"
                value={authForm.password}
                onChange={(e) =>
                  setAuthForm((f) => ({ ...f, password: e.target.value }))
                }
                style={styles.input}
              />
              {authError && (
                <div style={styles.modalError}>{authError}</div>
              )}
              <button
                type="submit"
                disabled={authLoading}
                style={{
                  ...styles.modalButtonPrimary,
                  opacity: authLoading ? 0.7 : 1,
                  cursor: authLoading ? "default" : "pointer",
                }}
              >
                {authLoading
                  ? authMode === "signup"
                    ? "Creating account..."
                    : "Signing you in..."
                  : authMode === "signup"
                  ? "Create account"
                  : "Sign in"}
              </button>
            </form>
            <button
              type="button"
              style={styles.modalButtonSecondary}
              onClick={() => setShowSignup(false)}
            >
              Cancel for now
            </button>

            <div
              style={{
                marginTop: 10,
                fontSize: 12,
                textAlign: "center",
                opacity: 0.8,
              }}
            >
              {authMode === "signup" ? (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    style={{
                      background: "none",
                      border: "none",
                      color: "#1b9aaa",
                      cursor: "pointer",
                      padding: 0,
                      fontSize: 12,
                    }}
                    onClick={() => {
                      setAuthMode("login");
                      setAuthError("");
                    }}
                  >
                    Sign in instead
                  </button>
                </>
              ) : (
                <>
                  New here?{" "}
                  <button
                    type="button"
                    style={{
                      background: "none",
                      border: "none",
                      color: "#1b9aaa",
                      cursor: "pointer",
                      padding: 0,
                      fontSize: 12,
                    }}
                    onClick={() => {
                      setAuthMode("signup");
                      setAuthError("");
                    }}
                  >
                    Create an account
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PAYWALL MODAL */}
      {showPaywall && (
        <div style={styles.overlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalTitle}>Daily limit reached</div>
            <div style={styles.modalText}>
              You&apos;ve used your free AI review for today. Upgrade to Pro for
              unlimited feedback and full trade history.
            </div>
            <button
              type="button"
              style={styles.modalButtonPrimary}
              onClick={() => {
                // TODO: wire to Stripe / payment link
              }}
            >
              Upgrade to Pro
            </button>
            <button
              type="button"
              style={styles.modalButtonSecondary}
              onClick={() => setShowPaywall(false)}
            >
              Maybe later
            </button>
          </div>
        </div>
      )}

      {/* PROFILE MODAL */}
      {showProfile && user && (
        <div style={styles.overlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalTitle}>Profile</div>
            <div style={styles.modalText}>
              Basic info for your Trade Coach account.
            </div>
            <div
              style={{
                fontSize: 13,
                lineHeight: 1.6,
                marginBottom: 12,
              }}
            >
              <div>
                <strong>Name:</strong> {user.name}
              </div>
              <div>
                <strong>Email:</strong> {user.email}
              </div>
              <div>
                <strong>Plan:</strong>{" "}
                {user.plan === "pro" ? "Pro (paid)" : "Free"}
              </div>
            </div>
            <div
              style={{
                fontSize: 11,
                opacity: 0.7,
                marginBottom: 10,
              }}
            >
              Later you can add password reset and plan upgrades here.
            </div>
            <button
              type="button"
              style={styles.modalButtonSecondary}
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

/* ---------------- CHAT TURN ---------------- */

function ChatTurn({ chat, styles }) {
  const analysis = chat.analysis ?? {};
  const {
    grade,
    oneLineVerdict,
    whatWentRight = [],
    whatWentWrong = [],
    improvements = [],
    lessonLearned,
    confidence,
  } = analysis;

  const initialImg =
    normalizeDriveUrl(chat.screenshotUrl) ||
    chat.localDataUrl ||
    chat.localPreviewUrl ||
    null;

  const [imgSrc, setImgSrc] = useState(initialImg);

  useEffect(() => {
    const next =
      normalizeDriveUrl(chat.screenshotUrl) ||
      chat.localDataUrl ||
      chat.localPreviewUrl ||
      null;
    setImgSrc(next);
  }, [chat.screenshotUrl, chat.localDataUrl, chat.localPreviewUrl]);

  function handleImgError() {
    if (chat.localDataUrl && imgSrc !== chat.localDataUrl) {
      setImgSrc(chat.localDataUrl);
      return;
    }
    if (chat.localPreviewUrl && imgSrc !== chat.localPreviewUrl) {
      setImgSrc(chat.localPreviewUrl);
      return;
    }
    setImgSrc(null);
  }

  return (
    <>
      {/* USER MESSAGE */}
      <div style={styles.bubbleRow}>
        <div style={styles.bubbleUser}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>You</div>

          {imgSrc && (
            <img
              src={imgSrc}
              onError={handleImgError}
              alt="uploaded trade"
              style={{
                width: "100%",
                maxWidth: 320,
                borderRadius: 10,
                border: "1px solid #243043",
                marginBottom: 8,
              }}
            />
          )}

          <div>{chat.userNotes}</div>

          <div style={styles.smallMeta}>
            {new Date(chat.timestamp).toLocaleString()}
          </div>
        </div>
      </div>

      {/* AI MESSAGE */}
      <div style={styles.bubbleRow}>
        <div style={styles.bubbleAI}>
          <div style={styles.bubbleHeader}>
            <span>Trade Coach AI</span>
            {grade && <span style={styles.gradePill}>{grade}</span>}
            {typeof confidence === "number" && (
              <span style={{ fontSize: 12, opacity: 0.7 }}>
                ({Math.round(confidence * 100)}% confident)
              </span>
            )}
          </div>

          {chat.pending ? (
            <div style={{ opacity: 0.9 }}>Analyzing trade…</div>
          ) : (
            <>
              {oneLineVerdict && (
                <div style={{ opacity: 0.95 }}>{oneLineVerdict}</div>
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
                  <div style={{ opacity: 0.95 }}>{lessonLearned}</div>
                </>
              )}

              {(chat.serverTimestamp || chat.timestamp) && (
                <div style={styles.smallMeta}>
                  {new Date(
                    chat.serverTimestamp || chat.timestamp
                  ).toLocaleString()}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
