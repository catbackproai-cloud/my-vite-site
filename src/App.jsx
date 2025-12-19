// src/App.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// ✅ Firestore
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

// ✅ Single source of truth for prod:
const PROD_WEBHOOK = "https://jacobtf007.app.n8n.cloud/webhook/trade_feedback";

// ✅ Env override if you ever want it later:
const WEBHOOK_URL =
  (import.meta?.env && import.meta.env.VITE_N8N_TRADE_FEEDBACK_WEBHOOK) ||
  PROD_WEBHOOK;

const MEMBER_LS_KEY = "tc_member_v1";

// ⭐ P&L Calendar storage (manual entry) (base key; final key is namespaced per member)
const PNL_KEY_BASE = "mtai_pnl_v2";

/* =========================
   VISUAL THEME (NEW)
   (no behavior changes)
   ========================= */

const CYAN = "#22d3ee";
const CYAN_SOFT = "#38bdf8";

// extra theme accents
const INDIGO = "#3b82f6";
const VIOLET = "#a78bfa";
const BG_TOP = "#07101f";
const BG_MID = "#030817";
const BG_DEEP = "#020617";

const gradeColor = (grade) => {
  switch (grade) {
    case "A":
      return "#22c55e";
    case "B":
      return "#4ade80";
    case "C":
      return "#facc15";
    case "D":
      return "#fb923c";
    case "F":
      return "#f97373";
    default:
      return "#9ca3af";
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
  return new Date(y, m - 1, d);
}

/* ---------------- HELPERS ---------------- */

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function normalizeDriveUrl(url) {
  if (!url) return null;
  if (url.includes("drive.google.com/uc?id=")) return url;
  const m = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (m?.[1]) return `https://drive.google.com/uc?id=${m[1]}`;
  return url;
}

function safeSaveChats(key, chats) {
  try {
    // keep storage lean (no local image blobs)
    const leanChats = chats.map(({ localPreviewUrl, localDataUrl, ...rest }) => ({
      ...rest,
    }));
    localStorage.setItem(key, JSON.stringify(leanChats));
    localStorage.setItem("lastTradeChats", JSON.stringify(leanChats));
  } catch (e) {
    console.warn("Failed to save chats to localStorage", e);
  }
}

function safeParseJSON(raw, fallback) {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function toMonthKey(iso) {
  return (iso || "").slice(0, 7); // "YYYY-MM"
}

function clampSymbol(s) {
  const v = String(s || "").trim();
  if (!v) return "";
  return v.slice(0, 14).toUpperCase();
}

const moneyFmt = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

function fmtMoneySigned(n) {
  if (typeof n !== "number" || Number.isNaN(n)) return "—";
  const abs = Math.abs(n);
  const base = moneyFmt.format(abs);
  return n > 0 ? `+${base}` : n < 0 ? `-${base}` : moneyFmt.format(0);
}

function fmtRR(n) {
  if (typeof n !== "number" || Number.isNaN(n)) return "—";
  return `${Number(n.toFixed(2))}R`;
}

/**
 * IMPORTANT:
 * Firestore documents have a ~1MB limit.
 * So we DO NOT store local image data URLs in Firestore.
 */
function chatsForFirestore(chats) {
  return (chats || []).map((c) => {
    const { localPreviewUrl, localDataUrl, ...rest } = c || {};
    return rest;
  });
}

export default function App({ selectedDay = todayStr() }) {
  const navigate = useNavigate();

  // ⭐ Pages (sidebar)
  const PAGES = { AI: "ai", PNL: "pnl" };
  const [activePage, setActivePage] = useState(PAGES.AI);

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

  // ✅ Firestore refs (per member)
  const memberId = member?.memberId || null;

  // ✅ Namespaced local keys so users on the same device never see each other's data
  const scope = memberId || "anon";
  const LAST_DAY_KEY = `tradeCoach:lastDayWithData:${scope}`;
  const PNL_KEY = `${PNL_KEY_BASE}:${scope}`;
  const dayChatsKey = (iso) => `tradeChats:${scope}:${iso}`;
  const dayJournalKeyV2 = (iso) => `tradeJournalV2:${scope}:${iso}`;

  // initial day = last day with data (for THIS member) else selectedDay
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

  // ⭐ DAY + CALENDAR STATE (AI page)
  const [day, setDay] = useState(initialDay);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = parseLocalDateFromIso(initialDay);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  // ⭐ JOURNAL STATE
  const [journal, setJournal] = useState({
    notes: "",
    learned: "",
    improve: "",
  });

  // ⭐ P&L CALENDAR STATE (manual)
  const [pnlMonth, setPnlMonth] = useState(() => {
    const d = parseLocalDateFromIso(todayStr());
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const [pnl, setPnl] = useState(() => {
    const raw =
      typeof window !== "undefined" ? localStorage.getItem(PNL_KEY) : null;
    return safeParseJSON(raw, {});
  });

  const [pnlModalOpen, setPnlModalOpen] = useState(false);
  const [pnlEditingIso, setPnlEditingIso] = useState(null);
  const [pnlEditSymbol, setPnlEditSymbol] = useState("");
  const [pnlEditPnl, setPnlEditPnl] = useState("");
  const [pnlEditRR, setPnlEditRR] = useState("");

  const todayIso = todayStr();

  const isValid = useMemo(
    () =>
      !!form.strategyNotes &&
      !!form.file &&
      !!form.timeframe &&
      !!form.instrument,
    [form]
  );

  const lastChat = chats.length ? chats[chats.length - 1] : null;
  const isPending = !!lastChat?.pending;
  const hasCompletedTrade = !!(lastChat && !lastChat.pending);

  const buttonDisabled = !hasCompletedTrade && (!isValid || submitting || isPending);

  // Debounce timers for Firestore writes
  const dayWriteTimerRef = useRef(null);
  const pnlWriteTimerRef = useRef(null);

  /* ---------------- MOBILE CSS (refined visuals + no overlap) ---------------- */
  const ResponsiveCSS = () => (
    <style>{`
      * { -webkit-tap-highlight-color: transparent; }
      html, body { max-width: 100%; overflow-x: hidden; }

      body {
        text-rendering: geometricPrecision;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      .mt-shell { display:flex; gap:16px; align-items:stretch; flex-wrap:wrap; }
      .mt-content { flex: 1 1 520px; min-width: 0; }
      .mt-safeWrap { min-width:0; overflow-wrap:anywhere; word-break:break-word; }

      .mt-calPanel { max-width: min(92vw, 340px); width: min(92vw, 340px); }

      .mt-cardHover {
        transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
      }
      .mt-cardHover:hover {
        transform: translateY(-2px);
      }

      ::-webkit-scrollbar { width: 10px; height: 10px; }
      ::-webkit-scrollbar-thumb {
        background: rgba(148,163,184,0.18);
        border: 1px solid rgba(148,163,184,0.12);
        border-radius: 999px;
      }
      ::-webkit-scrollbar-track { background: rgba(2,6,23,0.35); }

      @media (max-width: 980px) {
        .mt-shell { flex-direction: column; }
        .mt-sidebar { width: 100% !important; min-width: 0 !important; flex: 1 1 auto !important; position: relative !important; top: auto !important; }
      }
      @media (max-width: 860px) {
        .mt-mainShell { flex-direction: column; }
        .mt-leftCol, .mt-rightCol { flex: 1 1 auto !important; min-width: 0 !important; }
      }
      @media (max-width: 520px) {
        .mt-headerTitle { font-size: 14px !important; letter-spacing: .08em !important; }
        .mt-workspaceTag { display: none !important; }
        .mt-page { padding: 74px 12px 18px !important; }
        .mt-coachCard, .mt-journalCard, .mt-pnlCalendarCard { padding: 14px !important; border-radius: 18px !important; }
        .mt-sidebar { padding: 12px !important; border-radius: 18px !important; }
        .mt-datePill { min-width: 0 !important; width: 100% !important; }
      }
    `}</style>
  );

  /* ---------------- WHEN MEMBER CHANGES: LOAD THEIR LOCAL DEFAULTS ---------------- */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LAST_DAY_KEY);
      setDay(saved || selectedDay);
      setShowCalendar(false);
      const d = parseLocalDateFromIso(saved || selectedDay);
      setCalendarMonth({ year: d.getFullYear(), month: d.getMonth() });
    } catch {
      setDay(selectedDay);
    }

    try {
      const raw = localStorage.getItem(PNL_KEY);
      setPnl(safeParseJSON(raw, {}));
    } catch {
      setPnl({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  /* ---------------- FIRESTORE: LOAD PNL ON LOGIN ---------------- */
  useEffect(() => {
    if (!memberId) return;

    (async () => {
      try {
        const ref = doc(db, "users", memberId, "meta", "pnl");
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data() || {};
          if (data?.pnl && typeof data.pnl === "object") {
            setPnl(data.pnl);
            try {
              localStorage.setItem(PNL_KEY, JSON.stringify(data.pnl));
            } catch {}
          } else {
            setPnl({});
            try {
              localStorage.setItem(PNL_KEY, JSON.stringify({}));
            } catch {}
          }
        } else {
          setPnl({});
          try {
            localStorage.setItem(PNL_KEY, JSON.stringify({}));
          } catch {}
        }
      } catch (e) {
        console.error("❌ Firestore PNL load error:", e?.code, e?.message, e);
      }
    })();
  }, [memberId, PNL_KEY]);

  /* ---------------- FIRESTORE: LOAD DAY DATA (CHATS + JOURNAL) ---------------- */
  useEffect(() => {
    // Always load local first
    try {
      const saved = localStorage.getItem(dayChatsKey(day));
      setChats(saved ? JSON.parse(saved) : []);
    } catch {
      setChats([]);
    }

    try {
      const rawV2 = localStorage.getItem(dayJournalKeyV2(day));
      if (rawV2) {
        const parsed = JSON.parse(rawV2);
        setJournal({
          notes: parsed.notes || "",
          learned: parsed.learned || "",
          improve: parsed.improve || "",
        });
      } else {
        setJournal({ notes: "", learned: "", improve: "" });
      }
    } catch {
      setJournal({ notes: "", learned: "", improve: "" });
    }

    // Clear form preview on day change
    setForm((prev) => ({ ...prev, file: null }));
    setPreviewUrl(null);
    setError("");

    if (!memberId) return;

    (async () => {
      try {
        const ref = doc(db, "users", memberId, "days", day);
        const snap = await getDoc(ref);
        if (!snap.exists()) return;

        const data = snap.data() || {};
        if (Array.isArray(data.chats)) {
          setChats(data.chats);
          try {
            localStorage.setItem(dayChatsKey(day), JSON.stringify(data.chats));
          } catch {}
        }

        if (data.journal && typeof data.journal === "object") {
          const j = data.journal || {};
          const jPayload = {
            notes: j.notes || "",
            learned: j.learned || "",
            improve: j.improve || "",
          };
          setJournal(jPayload);
          try {
            localStorage.setItem(dayJournalKeyV2(day), JSON.stringify(jPayload));
          } catch {}
        }
      } catch (e) {
        console.error("❌ Firestore day load error:", e?.code, e?.message, e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, memberId, scope]);

  // Build calendar weeks
  function buildMonthWeeks(monthState) {
    const { year, month } = monthState;
    const first = new Date(year, month, 1);
    const startDow = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const weeks = [];
    let currentDay = 1 - startDow;

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

  // AI date dropdown calendar
  const monthWeeks = buildMonthWeeks(calendarMonth);
  const calendarMonthLabel = new Date(
    calendarMonth.year,
    calendarMonth.month,
    1
  ).toLocaleDateString(undefined, { month: "long", year: "numeric" });

  // P&L month calendar
  const pnlWeeks = buildMonthWeeks(pnlMonth);
  const pnlMonthLabel = new Date(pnlMonth.year, pnlMonth.month, 1).toLocaleDateString(
    undefined,
    { month: "long", year: "numeric" }
  );

  const formattedDayLabel = parseLocalDateFromIso(day).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

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

  function pnlPrevMonth() {
    setPnlMonth((prev) => {
      const d = new Date(prev.year, prev.month - 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }
  function pnlNextMonth() {
    setPnlMonth((prev) => {
      const d = new Date(prev.year, prev.month + 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  const onChange = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  function openPnlModal(iso) {
    const existing = pnl?.[iso];
    setPnlEditingIso(iso);
    setPnlEditSymbol(existing?.symbol || "");
    setPnlEditPnl(
      typeof existing?.pnl === "number" && Number.isFinite(existing.pnl)
        ? String(existing.pnl)
        : ""
    );
    setPnlEditRR(
      typeof existing?.rr === "number" && Number.isFinite(existing.rr)
        ? String(existing.rr)
        : ""
    );
    setPnlModalOpen(true);
  }

  function savePnlEntry() {
    if (!pnlEditingIso) return;

    const sym = clampSymbol(pnlEditSymbol);
    const pnlTrim = (pnlEditPnl || "").trim();
    const rrTrim = (pnlEditRR || "").trim();

    // delete if all empty
    if (!sym && !pnlTrim && !rrTrim) {
      setPnl((prev) => {
        const copy = { ...(prev || {}) };
        delete copy[pnlEditingIso];
        return copy;
      });
      setPnlModalOpen(false);
      return;
    }

    const pnlNum = pnlTrim === "" ? null : Number(pnlTrim);
    const rrNum = rrTrim === "" ? null : Number(rrTrim);

    if (
      (pnlTrim !== "" && (!Number.isFinite(pnlNum) || Number.isNaN(pnlNum))) ||
      (rrTrim !== "" && (!Number.isFinite(rrNum) || Number.isNaN(rrNum)))
    ) {
      return;
    }

    if (pnlTrim === "") return; // require pnl

    setPnl((prev) => ({
      ...(prev || {}),
      [pnlEditingIso]: {
        symbol: sym,
        pnl: pnlNum ?? 0,
        rr: rrTrim === "" ? null : rrNum,
      },
    }));
    setPnlModalOpen(false);
  }

  function deletePnlEntry() {
    if (!pnlEditingIso) return;
    setPnl((prev) => {
      const copy = { ...(prev || {}) };
      delete copy[pnlEditingIso];
      return copy;
    });
    setPnlModalOpen(false);
  }

  /* ---------------- STYLES (refreshed look only) ---------------- */

  const styles = {
    page: {
      minHeight: "100vh",
      background: `
        radial-gradient(1200px 700px at 50% -10%, rgba(34,211,238,0.24), transparent 60%),
        radial-gradient(900px 520px at 10% 15%, rgba(59,130,246,0.14), transparent 55%),
        radial-gradient(900px 520px at 90% 25%, rgba(167,139,250,0.12), transparent 60%),
        linear-gradient(180deg, ${BG_TOP} 0%, ${BG_MID} 38%, ${BG_DEEP} 100%)
      `,
      color: "#e5e7eb",
      padding: "80px 16px 24px",
      boxSizing: "border-box",
      fontFamily:
        '-apple-system, BlinkMacSystemFont, system-ui, "SF Pro Text", Inter, sans-serif',
      position: "relative",
      overflowX: "hidden",
    },
    pageGlow: {
      position: "fixed",
      top: 24,
      left: "50%",
      transform: "translateX(-50%)",
      width: 780,
      height: 780,
      background:
        "radial-gradient(circle, rgba(34,211,238,0.17), rgba(59,130,246,0.10), transparent 62%)",
      filter: "blur(50px)",
      opacity: 0.95,
      pointerEvents: "none",
      zIndex: 0,
    },
    pageGrid: {
      position: "fixed",
      inset: 0,
      backgroundImage:
        "linear-gradient(rgba(148,163,184,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.05) 1px, transparent 1px)",
      backgroundSize: "48px 48px",
      maskImage: "radial-gradient(circle at 50% 10%, black 0%, transparent 62%)",
      opacity: 0.55,
      pointerEvents: "none",
      zIndex: 0,
    },
    pageInner: { position: "relative", zIndex: 1 },

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
      padding: "0 16px",
      background:
        "linear-gradient(90deg, rgba(2,6,23,0.75), rgba(8,25,43,0.62), rgba(2,6,23,0.70))",
      borderBottom: "1px solid rgba(148,163,184,0.10)",
      backdropFilter: "blur(22px)",
      WebkitBackdropFilter: "blur(22px)",
      zIndex: 70,
      boxShadow: "0 18px 70px rgba(2,6,23,0.8)",
      gap: 12,
    },
    siteHeaderTitleRow: { display: "flex", alignItems: "center", gap: 10 },
    brandDot: {
      width: 10,
      height: 10,
      borderRadius: 999,
      background: `linear-gradient(135deg, ${CYAN}, ${VIOLET})`,
      boxShadow:
        "0 0 0 5px rgba(34,211,238,0.12), 0 14px 45px rgba(34,211,238,0.25)",
      flex: "0 0 auto",
    },
    siteHeaderTitle: {
      fontSize: 18,
      fontWeight: 900,
      letterSpacing: "0.10em",
      textTransform: "uppercase",
      color: "#f9fafb",
    },
    siteHeaderActions: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      fontSize: 12,
      opacity: 0.9,
      position: "relative",
      color: "#9ca3af",
    },
    workspaceTag: {
      padding: "5px 10px",
      borderRadius: 999,
      border: "1px solid rgba(148,163,184,0.16)",
      background:
        "linear-gradient(135deg, rgba(2,6,23,0.55), rgba(15,23,42,0.35))",
      color: "rgba(226,232,240,0.85)",
    },
    menuButton: {
      width: 34,
      height: 34,
      borderRadius: 999,
      border: "1px solid rgba(148,163,184,0.16)",
      background:
        "radial-gradient(circle at 20% 20%, rgba(34,211,238,0.22), rgba(2,6,23,0.92) 60%)",
      color: "#e5e7eb",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      fontSize: 18,
      padding: 0,
      boxShadow: "0 14px 50px rgba(2,6,23,0.9)",
      transition:
        "transform .18s ease, box-shadow .18s ease, border-color .18s ease",
    },
    menuButtonHover: {
      transform: "translateY(-1px)",
      borderColor: "rgba(34,211,238,0.35)",
      boxShadow: "0 18px 65px rgba(2,6,23,0.95)",
    },
    menuDropdown: {
      position: "absolute",
      top: 40,
      right: 0,
      background:
        "radial-gradient(120% 120% at 10% 0%, rgba(34,211,238,0.10), rgba(2,6,23,0.96) 55%)",
      borderRadius: 16,
      border: "1px solid rgba(148,163,184,0.14)",
      boxShadow: "0 24px 80px rgba(2,6,23,0.95)",
      padding: 8,
      minWidth: 180,
      zIndex: 80,
      backdropFilter: "blur(10px)",
    },
    menuItem: {
      padding: "10px 10px",
      borderRadius: 10,
      fontSize: 13,
      cursor: "pointer",
      color: "#e5e7eb",
      transition: "background .15s ease, transform .12s ease",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      userSelect: "none",
    },
    menuItemDanger: { color: "#fecaca" },

    // 🔹 SHELL
    shell: {
      width: "100%",
      maxWidth: 1240,
      margin: "0 auto",
      display: "flex",
      gap: 16,
      alignItems: "stretch",
      flexWrap: "wrap",
    },

    // 🔹 SIDEBAR
    sidebar: {
      width: 248,
      minWidth: 248,
      flex: "0 0 248px",
      background:
        "radial-gradient(120% 120% at 0% 0%, rgba(34,211,238,0.08), rgba(2,6,23,0.92) 55%)",
      borderRadius: 22,
      border: "1px solid rgba(148,163,184,0.12)",
      boxShadow: "0 24px 80px rgba(2,6,23,0.92)",
      padding: 14,
      height: "fit-content",
      position: "sticky",
      top: 72,
      alignSelf: "flex-start",
      overflow: "hidden",
    },
    sidebarTopGlow: {
      position: "absolute",
      top: -140,
      left: -140,
      width: 280,
      height: 280,
      borderRadius: 999,
      background: "radial-gradient(circle, rgba(34,211,238,0.18), transparent 70%)",
      filter: "blur(26px)",
      pointerEvents: "none",
    },
    sidebarTitle: {
      fontSize: 12,
      opacity: 0.78,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      marginBottom: 12,
      color: "rgba(148,163,184,0.92)",
      fontWeight: 800,
      position: "relative",
      zIndex: 1,
    },
    navItem: (active) => ({
      padding: "11px 12px",
      borderRadius: 14,
      cursor: "pointer",
      fontSize: 13,
      color: active ? "#07101f" : "rgba(226,232,240,0.92)",
      background: active
        ? `linear-gradient(135deg, ${CYAN}, ${CYAN_SOFT})`
        : "linear-gradient(135deg, rgba(148,163,184,0.06), rgba(2,6,23,0))",
      border: active
        ? "1px solid rgba(34,211,238,0.45)"
        : "1px solid rgba(148,163,184,0.10)",
      boxShadow: active
        ? "0 18px 60px rgba(34,211,238,0.26)"
        : "0 10px 35px rgba(2,6,23,0.65)",
      fontWeight: active ? 900 : 800,
      letterSpacing: active ? "0.02em" : "0",
      marginBottom: 10,
      transition:
        "transform .15s ease, box-shadow .15s ease, background .15s ease, border-color .15s ease",
      userSelect: "none",
      position: "relative",
      overflow: "hidden",
    }),
    navItemAccent: (active) => ({
      position: "absolute",
      left: 10,
      top: "50%",
      transform: "translateY(-50%)",
      width: 8,
      height: 8,
      borderRadius: 999,
      background: active ? "#07101f" : "rgba(34,211,238,0.55)",
      boxShadow: active
        ? "0 0 0 6px rgba(7,16,31,0.10)"
        : "0 0 0 6px rgba(34,211,238,0.08)",
      pointerEvents: "none",
    }),
    navItemText: { paddingLeft: 16 },
    navHint: {
      fontSize: 11,
      opacity: 0.8,
      color: "rgba(148,163,184,0.90)",
      marginTop: 12,
      lineHeight: 1.45,
      position: "relative",
      zIndex: 1,
    },

    content: { flex: "1 1 520px", minWidth: 0 },

    // 🔹 DATE DROPDOWN ROW
    dateRow: {
      width: "100%",
      maxWidth: 1100,
      margin: "0 auto 22px",
      display: "flex",
      justifyContent: "center",
      position: "relative",
    },
    datePill: {
      minWidth: 260,
      padding: "10px 16px",
      borderRadius: 999,
      background:
        "linear-gradient(rgba(2,6,23,0.70), rgba(2,6,23,0.70)) padding-box, linear-gradient(135deg, rgba(34,211,238,0.45), rgba(167,139,250,0.18)) border-box",
      border: "1px solid transparent",
      fontSize: 13,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      cursor: "pointer",
      boxShadow: "0 18px 60px rgba(2,6,23,0.85)",
      color: "#e5e7eb",
      transition: "transform .16s ease, box-shadow .16s ease, border .16s ease",
      userSelect: "none",
      width: "100%",
      maxWidth: 540,
      backdropFilter: "blur(12px)",
    },
    datePillHover: {
      transform: "translateY(-1px)",
      boxShadow: "0 22px 70px rgba(2,6,23,0.92)",
      border: "1px solid rgba(34,211,238,0.65)",
    },
    datePillText: {
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      fontWeight: 800,
      letterSpacing: "0.01em",
    },
    datePillIcon: { fontSize: 11, opacity: 0.9, marginLeft: 8 },

    calendarPanel: {
      position: "absolute",
      top: "118%",
      zIndex: 60,
      background:
        "radial-gradient(120% 120% at 0% 0%, rgba(34,211,238,0.10), rgba(2,6,23,0.94) 55%)",
      borderRadius: 18,
      border: "1px solid rgba(148,163,184,0.14)",
      padding: 12,
      boxShadow: "0 24px 80px rgba(2,6,23,0.95)",
      width: 330,
      backdropFilter: "blur(14px)",
    },
    calendarHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
      fontSize: 13,
      color: "#e5e7eb",
    },
    calendarHeaderTitle: { fontWeight: 900, letterSpacing: "0.02em" },
    calendarNavBtn: {
      width: 28,
      height: 28,
      borderRadius: 999,
      border: "1px solid rgba(148,163,184,0.14)",
      background: "rgba(2,6,23,0.75)",
      color: "#e5e7eb",
      fontSize: 14,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 10px 30px rgba(2,6,23,0.8)",
    },
    weekdayRow: {
      display: "grid",
      gridTemplateColumns: "repeat(7, 1fr)",
      gap: 4,
      fontSize: 11,
      opacity: 0.75,
      marginBottom: 4,
      color: "#9ca3af",
      fontWeight: 800,
    },
    weekdayCell: { textAlign: "center", padding: "4px 0" },
    calendarWeek: {
      display: "grid",
      gridTemplateColumns: "repeat(7, 1fr)",
      gap: 6,
      marginTop: 4,
    },
    dayCellEmpty: { padding: "6px 0", fontSize: 12 },
    dayCellBase: {
      padding: "7px 0",
      fontSize: 12,
      textAlign: "center",
      borderRadius: 10,
      cursor: "pointer",
      border: "1px solid rgba(148,163,184,0.10)",
      color: "#e5e7eb",
      transition:
        "background .12s ease, border .12s ease, color .12s ease, transform .12s ease",
      userSelect: "none",
      background: "rgba(2,6,23,0.55)",
      boxShadow: "0 10px 26px rgba(2,6,23,0.65)",
    },
    dayCellSelected: {
      background: `linear-gradient(135deg, ${CYAN}, ${CYAN_SOFT})`,
      color: "#07101f",
      borderColor: "rgba(34,211,238,0.65)",
      fontWeight: 900,
    },
    dayCellToday: { borderColor: "rgba(34,211,238,0.55)" },

    // 🔹 MAIN LAYOUT
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
      minWidth: 0,
    },
    rightCol: {
      flex: "1 1 260px",
      display: "flex",
      flexDirection: "column",
      gap: 12,
      minWidth: 0,
    },

    coachCard: {
      background:
        "radial-gradient(120% 120% at 0% 0%, rgba(34,211,238,0.08), rgba(2,6,23,0.92) 60%)",
      borderRadius: 22,
      boxShadow: "0 28px 90px rgba(2,6,23,0.92)",
      padding: 20,
      display: "flex",
      flexDirection: "column",
      gap: 12,
      minHeight: 0,
      border: "1px solid rgba(148,163,184,0.12)",
      minWidth: 0,
      backdropFilter: "blur(10px)",
      position: "relative",
      overflow: "hidden",
    },
    cardTopSheen: {
      position: "absolute",
      top: -80,
      right: -120,
      width: 280,
      height: 280,
      borderRadius: 999,
      background: "radial-gradient(circle, rgba(167,139,250,0.14), transparent 70%)",
      filter: "blur(18px)",
      pointerEvents: "none",
    },
    coachHeaderRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      gap: 8,
      flexWrap: "wrap",
      minWidth: 0,
      position: "relative",
      zIndex: 1,
    },
    coachTitle: {
      fontSize: 20,
      fontWeight: 950,
      letterSpacing: "0.10em",
      textTransform: "uppercase",
      color: "#f9fafb",
    },
    coachSub: {
      fontSize: 12,
      opacity: 0.86,
      marginTop: 6,
      maxWidth: 560,
      color: "rgba(148,163,184,0.95)",
      lineHeight: 1.45,
    },
    dayBadge: {
      fontSize: 11,
      opacity: 0.95,
      border: "1px solid rgba(148,163,184,0.16)",
      borderRadius: 999,
      padding: "5px 10px",
      whiteSpace: "nowrap",
      alignSelf: "flex-start",
      color: "rgba(226,232,240,0.92)",
      background:
        "linear-gradient(135deg, rgba(2,6,23,0.55), rgba(15,23,42,0.35))",
      boxShadow: "0 10px 30px rgba(2,6,23,0.75)",
    },

    // 🔹 STATUS BOX
    statusBox: {
      marginTop: 4,
      background:
        "radial-gradient(120% 120% at 0% 0%, rgba(59,130,246,0.08), rgba(2,6,23,0.92) 60%)",
      borderRadius: 20,
      border: "1px solid rgba(148,163,184,0.12)",
      padding: 16,
      minHeight: 240,
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      gap: 8,
      position: "relative",
      overflow: "hidden",
      minWidth: 0,
      boxShadow: "0 22px 70px rgba(2,6,23,0.85)",
      backdropFilter: "blur(8px)",
    },
    statusGlow: {
      position: "absolute",
      inset: 0,
      opacity: 0.24,
      background:
        "radial-gradient(700px 260px at 50% 0%, rgba(34,211,238,0.30), transparent 55%)",
      pointerEvents: "none",
    },
    statusContent: {
      position: "relative",
      zIndex: 1,
      transition: "opacity .22s ease, transform .22s ease",
      minWidth: 0,
    },
    statusPlaceholderTitle: {
      fontSize: 16,
      fontWeight: 900,
      marginBottom: 4,
      color: "#e5e7eb",
      letterSpacing: "0.01em",
    },
    statusPlaceholderText: {
      fontSize: 13,
      opacity: 0.85,
      color: "rgba(148,163,184,0.95)",
    },
    statusHeaderRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 8,
      marginBottom: 6,
      flexWrap: "wrap",
      minWidth: 0,
    },
    statusHeaderLeft: {
      display: "flex",
      flexDirection: "column",
      gap: 2,
      fontSize: 12,
      minWidth: 0,
    },
    statusLabel: {
      fontSize: 13,
      fontWeight: 950,
      color: "#e5e7eb",
      letterSpacing: "0.02em",
    },
    statusMeta: {
      fontSize: 11,
      opacity: 0.82,
      color: "rgba(148,163,184,0.95)",
    },
    gradePill: {
      fontSize: 14,
      fontWeight: 950,
      padding: "4px 10px",
      borderRadius: 999,
      background:
        "linear-gradient(135deg, rgba(34,211,238,0.10), rgba(56,189,248,0.16))",
      border: "1px solid rgba(148,163,184,0.16)",
      boxShadow:
        "0 0 0 1px rgba(2,6,23,0.85), 0 0 35px rgba(34,211,238,0.28)",
      whiteSpace: "nowrap",
      letterSpacing: "0.03em",
    },
    statusImg: {
      width: "100%",
      maxWidth: 360,
      borderRadius: 14,
      border: "1px solid rgba(148,163,184,0.14)",
      marginBottom: 10,
      marginTop: 8,
      alignSelf: "flex-start",
      boxShadow: "0 26px 90px rgba(2,6,23,0.92)",
    },
    sectionTitle: {
      fontWeight: 950,
      marginTop: 10,
      marginBottom: 6,
      fontSize: 13,
      color: "rgba(226,232,240,0.95)",
      letterSpacing: "0.01em",
    },
    ul: {
      margin: 0,
      paddingLeft: 18,
      opacity: 0.98,
      fontSize: 13,
      color: "rgba(226,232,240,0.92)",
      lineHeight: 1.5,
    },
    smallMeta: {
      fontSize: 11,
      opacity: 0.78,
      marginTop: 10,
      color: "rgba(148,163,184,0.95)",
    },

    // 🔹 FORM BELOW STATUS
    formSection: {
      marginTop: 10,
      display: "flex",
      flexDirection: "column",
      gap: 8,
      position: "relative",
      zIndex: 1,
    },
    composerRow: { display: "flex", gap: 10, alignItems: "stretch", flexWrap: "wrap" },
    composerLeft: { flex: "0 0 200px", minWidth: 150 },
    composerRight: { flex: "1 1 260px", minWidth: 260 },

    dropMini: {
      background:
        "radial-gradient(120% 120% at 0% 0%, rgba(34,211,238,0.10), rgba(2,6,23,0.90) 60%)",
      border: "1px dashed rgba(148,163,184,0.22)",
      borderRadius: 16,
      padding: 12,
      height: "100%",
      minHeight: 96,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      cursor: "pointer",
      fontSize: 12,
      color: "rgba(226,232,240,0.92)",
      transition:
        "border-color .2s ease, background .2s ease, box-shadow .2s ease, transform .15s ease",
      position: "relative",
      boxSizing: "border-box",
      boxShadow: "0 18px 55px rgba(2,6,23,0.85)",
      minWidth: 0,
      backdropFilter: "blur(10px)",
      overflow: "hidden",
    },
    dropMiniActive: {
      borderColor: "rgba(34,211,238,0.65)",
      background:
        "radial-gradient(120% 120% at 0% 0%, rgba(34,211,238,0.16), rgba(2,6,23,0.88) 60%)",
      transform: "translateY(-1px)",
      boxShadow: "0 24px 80px rgba(2,6,23,0.95)",
    },
    previewThumb: {
      maxWidth: 92,
      maxHeight: 70,
      borderRadius: 12,
      border: "1px solid rgba(148,163,184,0.16)",
      objectFit: "cover",
      boxShadow: "0 16px 55px rgba(2,6,23,0.85)",
    },
    dropMiniLabel: { display: "flex", flexDirection: "column", gap: 3, minWidth: 0 },
    dropMiniTitle: { fontWeight: 950, fontSize: 12, letterSpacing: "0.01em" },
    dropMiniHint: { fontSize: 11, opacity: 0.85, color: "rgba(148,163,184,0.95)" },
    miniCloseBtn: {
      position: "absolute",
      top: 8,
      right: 8,
      width: 22,
      height: 22,
      borderRadius: "9999px",
      border: "1px solid rgba(148,163,184,0.16)",
      background: "rgba(2,6,23,0.70)",
      color: "#f9fafb",
      fontSize: 12,
      fontWeight: 950,
      lineHeight: "18px",
      textAlign: "center",
      cursor: "pointer",
      boxShadow: "0 12px 40px rgba(2,6,23,0.9)",
    },

    label: {
      fontSize: 12,
      opacity: 0.9,
      marginBottom: 4,
      color: "rgba(148,163,184,0.95)",
      fontWeight: 800,
    },
    fieldRow: { display: "flex", gap: 8, marginBottom: 6, flexWrap: "wrap" },
    fieldHalf: { flex: "1 1 0", minWidth: 140 },

    input: {
      width: "100%",
      background:
        "linear-gradient(rgba(2,6,23,0.75), rgba(2,6,23,0.75)) padding-box, linear-gradient(135deg, rgba(148,163,184,0.14), rgba(34,211,238,0.14)) border-box",
      border: "1px solid transparent",
      borderRadius: 14,
      color: "#e5e7eb",
      padding: "9px 12px",
      fontSize: 13,
      outline: "none",
      boxSizing: "border-box",
      transition: "border-color .15s ease, box-shadow .15s ease, transform .12s ease",
      boxShadow: "0 14px 45px rgba(2,6,23,0.75)",
      backdropFilter: "blur(10px)",
    },

    selectWrapper: { position: "relative", width: "100%" },
    select: {
      width: "100%",
      background:
        "linear-gradient(rgba(2,6,23,0.75), rgba(2,6,23,0.75)) padding-box, linear-gradient(135deg, rgba(148,163,184,0.14), rgba(34,211,238,0.14)) border-box",
      border: "1px solid transparent",
      borderRadius: 14,
      color: "#e5e7eb",
      padding: "9px 32px 9px 12px",
      fontSize: 13,
      outline: "none",
      boxSizing: "border-box",
      appearance: "none",
      WebkitAppearance: "none",
      MozAppearance: "none",
      transition: "border-color .15s ease, box-shadow .15s ease, transform .12s ease",
      boxShadow: "0 14px 45px rgba(2,6,23,0.75)",
      backdropFilter: "blur(10px)",
    },
    selectArrow: {
      position: "absolute",
      right: 12,
      top: "50%",
      transform: "translateY(-50%)",
      fontSize: 10,
      pointerEvents: "none",
      opacity: 0.75,
      color: "rgba(148,163,184,0.95)",
    },

    textarea: {
      width: "100%",
      minHeight: 92,
      background:
        "linear-gradient(rgba(2,6,23,0.75), rgba(2,6,23,0.75)) padding-box, linear-gradient(135deg, rgba(148,163,184,0.14), rgba(34,211,238,0.14)) border-box",
      border: "1px solid transparent",
      borderRadius: 16,
      color: "#e5e7eb",
      padding: "11px 12px",
      outline: "none",
      resize: "vertical",
      fontSize: 14,
      boxSizing: "border-box",
      transition: "border-color .15s ease, box-shadow .15s ease, transform .12s ease",
      boxShadow: "0 16px 55px rgba(2,6,23,0.80)",
      backdropFilter: "blur(10px)",
      lineHeight: 1.45,
    },

    button: {
      marginTop: 6,
      width: "100%",
      background: buttonDisabled
        ? "linear-gradient(135deg, rgba(148,163,184,0.10), rgba(2,6,23,0.75))"
        : `linear-gradient(135deg, ${CYAN}, ${CYAN_SOFT})`,
      color: "#07101f",
      border: "1px solid rgba(34,211,238,0.18)",
      borderRadius: 999,
      padding: "12px 16px",
      fontWeight: 950,
      cursor: buttonDisabled ? "not-allowed" : "pointer",
      opacity: buttonDisabled ? 0.75 : 1,
      fontSize: 14,
      letterSpacing: "0.10em",
      textTransform: "uppercase",
      boxShadow: buttonDisabled ? "none" : "0 22px 75px rgba(34,211,238,0.42)",
      transition: "transform .18s ease, box-shadow .18s ease, filter .18s ease",
      position: "relative",
      overflow: "hidden",
    },
    buttonHover: {
      transform: "translateY(-1px)",
      boxShadow: "0 28px 92px rgba(34,211,238,0.55)",
    },
    error: {
      marginTop: 6,
      padding: 10,
      borderRadius: 14,
      background: "rgba(127,29,29,0.85)",
      color: "#fee2e2",
      whiteSpace: "pre-wrap",
      fontSize: 12,
      border: "1px solid rgba(248,113,113,0.55)",
      boxShadow: "0 16px 60px rgba(2,6,23,0.85)",
    },
    hint: { marginTop: 6, fontSize: 11, opacity: 0.82, color: "#fecaca" },

    // 🔹 JOURNAL
    journalCard: {
      background:
        "radial-gradient(120% 120% at 0% 0%, rgba(167,139,250,0.08), rgba(2,6,23,0.92) 60%)",
      borderRadius: 22,
      boxShadow: "0 28px 90px rgba(2,6,23,0.92)",
      padding: 20,
      display: "flex",
      flexDirection: "column",
      gap: 10,
      minHeight: 0,
      border: "1px solid rgba(148,163,184,0.12)",
      minWidth: 0,
      backdropFilter: "blur(10px)",
      position: "relative",
      overflow: "hidden",
    },
    journalSheen: {
      position: "absolute",
      top: -90,
      left: -120,
      width: 300,
      height: 300,
      borderRadius: 999,
      background: "radial-gradient(circle, rgba(34,211,238,0.10), transparent 70%)",
      filter: "blur(18px)",
      pointerEvents: "none",
    },
    journalHeaderRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      gap: 8,
      flexWrap: "wrap",
      position: "relative",
      zIndex: 1,
    },
    journalTitle: { fontSize: 18, fontWeight: 950, color: "#f9fafb", letterSpacing: "0.02em" },
    journalSub: {
      fontSize: 11,
      opacity: 0.86,
      marginTop: 6,
      maxWidth: 380,
      color: "rgba(148,163,184,0.95)",
      lineHeight: 1.45,
    },
    journalBadge: {
      fontSize: 11,
      padding: "5px 10px",
      borderRadius: 999,
      border: "1px solid rgba(148,163,184,0.14)",
      background: "linear-gradient(135deg, rgba(2,6,23,0.55), rgba(15,23,42,0.35))",
      opacity: 0.95,
      whiteSpace: "nowrap",
      color: "rgba(226,232,240,0.92)",
      boxShadow: "0 12px 40px rgba(2,6,23,0.8)",
    },
    journalLabel: { fontSize: 12, opacity: 0.9, marginBottom: 4, color: "rgba(148,163,184,0.95)", fontWeight: 800 },
    journalTextareaBig: {
      width: "100%",
      minHeight: 140,
      background:
        "linear-gradient(rgba(2,6,23,0.75), rgba(2,6,23,0.75)) padding-box, linear-gradient(135deg, rgba(148,163,184,0.14), rgba(167,139,250,0.14)) border-box",
      border: "1px solid transparent",
      borderRadius: 16,
      color: "#e5e7eb",
      padding: "11px 12px",
      outline: "none",
      resize: "vertical",
      fontSize: 14,
      boxSizing: "border-box",
      boxShadow: "0 16px 55px rgba(2,6,23,0.80)",
      backdropFilter: "blur(10px)",
      lineHeight: 1.45,
    },
    journalTextareaSmall: {
      width: "100%",
      minHeight: 72,
      background:
        "linear-gradient(rgba(2,6,23,0.75), rgba(2,6,23,0.75)) padding-box, linear-gradient(135deg, rgba(148,163,184,0.14), rgba(167,139,250,0.14)) border-box",
      border: "1px solid transparent",
      borderRadius: 16,
      color: "#e5e7eb",
      padding: "10px 12px",
      outline: "none",
      resize: "vertical",
      fontSize: 13,
      boxSizing: "border-box",
      boxShadow: "0 16px 55px rgba(2,6,23,0.80)",
      backdropFilter: "blur(10px)",
      lineHeight: 1.45,
    },

    // 🔹 P&L CALENDAR PAGE
    pnlShell: { width: "100%", maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12, minWidth: 0 },
    pnlTopRow: { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "stretch" },
    pnlCard: {
      flex: "1 1 260px",
      minWidth: 260,
      background:
        "radial-gradient(120% 120% at 0% 0%, rgba(34,211,238,0.10), rgba(2,6,23,0.92) 60%)",
      borderRadius: 20,
      border: "1px solid rgba(148,163,184,0.12)",
      boxShadow: "0 28px 90px rgba(2,6,23,0.92)",
      padding: 16,
      display: "flex",
      flexDirection: "column",
      gap: 6,
      minWidth: 0,
      backdropFilter: "blur(10px)",
      position: "relative",
      overflow: "hidden",
    },
    pnlCardSheen: {
      position: "absolute",
      top: -120,
      right: -140,
      width: 320,
      height: 320,
      borderRadius: 999,
      background: "radial-gradient(circle, rgba(59,130,246,0.12), transparent 70%)",
      filter: "blur(18px)",
      pointerEvents: "none",
    },
    pnlCardLabel: { fontSize: 12, opacity: 0.82, color: "rgba(148,163,184,0.95)", fontWeight: 800, position: "relative", zIndex: 1 },
    pnlCardValue: { fontSize: 26, fontWeight: 950, letterSpacing: "0.01em", color: "#f9fafb", position: "relative", zIndex: 1 },
    pnlCardSub: { fontSize: 12, opacity: 0.86, color: "rgba(148,163,184,0.95)", position: "relative", zIndex: 1 },

    pnlCalendarCard: {
      background:
        "radial-gradient(120% 120% at 0% 0%, rgba(167,139,250,0.08), rgba(2,6,23,0.92) 60%)",
      borderRadius: 22,
      border: "1px solid rgba(148,163,184,0.12)",
      boxShadow: "0 28px 90px rgba(2,6,23,0.92)",
      padding: 16,
      minWidth: 0,
      backdropFilter: "blur(10px)",
      position: "relative",
      overflow: "hidden",
    },
    pnlCalendarSheen: {
      position: "absolute",
      top: -140,
      left: -140,
      width: 320,
      height: 320,
      borderRadius: 999,
      background: "radial-gradient(circle, rgba(34,211,238,0.12), transparent 70%)",
      filter: "blur(18px)",
      pointerEvents: "none",
    },
    pnlCalHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
      gap: 8,
      flexWrap: "wrap",
      position: "relative",
      zIndex: 1,
    },
    pnlCalTitle: {
      fontSize: 16,
      fontWeight: 950,
      color: "#f9fafb",
      letterSpacing: "0.10em",
      textTransform: "uppercase",
    },
    pnlCalNav: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
    pnlNavBtn: {
      width: 32,
      height: 32,
      borderRadius: 999,
      border: "1px solid rgba(148,163,184,0.14)",
      background: "rgba(2,6,23,0.70)",
      color: "#e5e7eb",
      fontSize: 14,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 12px 40px rgba(2,6,23,0.85)",
    },
    pnlMonthLabel: {
      fontSize: 13,
      fontWeight: 900,
      color: "#e5e7eb",
      opacity: 0.92,
      minWidth: 160,
      textAlign: "center",
      letterSpacing: "0.02em",
    },
    pnlMonthMeta: {
      fontSize: 12,
      opacity: 0.86,
      color: "rgba(148,163,184,0.95)",
      lineHeight: 1.45,
    },

    pnlWeekdayRow: {
      display: "grid",
      gridTemplateColumns: "repeat(7, 1fr)",
      gap: 8,
      fontSize: 11,
      opacity: 0.78,
      marginBottom: 8,
      color: "rgba(148,163,184,0.95)",
      fontWeight: 900,
      position: "relative",
      zIndex: 1,
    },
    pnlWeek: {
      display: "grid",
      gridTemplateColumns: "repeat(7, 1fr)",
      gap: 8,
      marginTop: 8,
      position: "relative",
      zIndex: 1,
    },
    pnlCellEmpty: {
      height: 80,
      borderRadius: 16,
      border: "1px solid rgba(148,163,184,0.08)",
      opacity: 0.25,
      background: "rgba(2,6,23,0.35)",
    },

    pnlDayCell: (bg, borderColor) => ({
      height: 80,
      borderRadius: 16,
      border: `1px solid ${borderColor}`,
      background: bg,
      boxShadow: "0 14px 50px rgba(2,6,23,0.80)",
      padding: 10,
      cursor: "pointer",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      userSelect: "none",
      transition: "transform .12s ease, box-shadow .12s ease, border-color .12s ease",
      minWidth: 0,
      overflow: "hidden",
      backdropFilter: "blur(10px)",
    }),
    pnlDayTop: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, minWidth: 0 },
    pnlDayNum: { fontSize: 12, fontWeight: 950, color: "#e5e7eb", opacity: 0.95 },
    pnlSymbolTag: {
      fontSize: 10,
      fontWeight: 950,
      letterSpacing: "0.10em",
      opacity: 0.95,
      padding: "2px 8px",
      borderRadius: 999,
      border: "1px solid rgba(148,163,184,0.14)",
      background: "rgba(2,6,23,0.35)",
      color: "rgba(226,232,240,0.92)",
      whiteSpace: "nowrap",
      maxWidth: 120,
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    pnlDayMid: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, minWidth: 0 },
    pnlPnlValue: { fontSize: 14, fontWeight: 950, letterSpacing: "0.01em", color: "#f9fafb" },
    pnlRRValue: { fontSize: 11, fontWeight: 900, opacity: 0.95, color: "rgba(226,232,240,0.92)" },
    pnlNoEntry: { fontSize: 11, opacity: 0.8, color: "rgba(148,163,184,0.95)", fontWeight: 900 },

    // 🔹 MODALS
    overlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(2,6,23,0.78)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 90,
      padding: 16,
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
    },
    modalCard: {
      width: "100%",
      maxWidth: 440,
      background:
        "radial-gradient(120% 120% at 0% 0%, rgba(34,211,238,0.10), rgba(2,6,23,0.94) 60%)",
      borderRadius: 22,
      border: "1px solid rgba(148,163,184,0.14)",
      padding: 20,
      boxShadow: "0 30px 110px rgba(2,6,23,0.98)",
      fontSize: 13,
      color: "#e5e7eb",
      position: "relative",
      overflow: "hidden",
      backdropFilter: "blur(12px)",
    },
    modalSheen: {
      position: "absolute",
      top: -120,
      right: -140,
      width: 320,
      height: 320,
      borderRadius: 999,
      background: "radial-gradient(circle, rgba(167,139,250,0.14), transparent 70%)",
      filter: "blur(18px)",
      pointerEvents: "none",
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 950,
      marginBottom: 6,
      textAlign: "center",
      color: "#f9fafb",
      letterSpacing: "0.02em",
      position: "relative",
      zIndex: 1,
    },
    modalText: {
      fontSize: 12,
      opacity: 0.86,
      marginBottom: 12,
      textAlign: "center",
      color: "rgba(148,163,184,0.95)",
      lineHeight: 1.45,
      position: "relative",
      zIndex: 1,
    },
    modalRow: { marginBottom: 10, fontSize: 13, position: "relative", zIndex: 1 },
    modalLabel: { fontWeight: 900, opacity: 0.9, color: "#e5e7eb", marginBottom: 4 },
    modalCloseBtn: {
      marginTop: 14,
      width: "100%",
      borderRadius: 999,
      border: "1px solid rgba(148,163,184,0.14)",
      padding: "10px 12px",
      fontSize: 13,
      fontWeight: 900,
      background: "rgba(2,6,23,0.65)",
      color: "#e5e7eb",
      cursor: "pointer",
      boxShadow: "0 16px 60px rgba(2,6,23,0.9)",
      position: "relative",
      zIndex: 1,
    },
    modalBtnRow: { display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap", position: "relative", zIndex: 1 },
    modalBtnPrimary: {
      flex: 1,
      borderRadius: 999,
      border: "1px solid rgba(34,211,238,0.18)",
      padding: "11px 12px",
      fontSize: 13,
      fontWeight: 950,
      cursor: "pointer",
      color: "#07101f",
      background: `linear-gradient(135deg, ${CYAN}, ${CYAN_SOFT})`,
      boxShadow: "0 22px 75px rgba(34,211,238,0.40)",
      minWidth: 140,
      letterSpacing: "0.06em",
    },
    modalBtnGhost: {
      flex: 1,
      borderRadius: 999,
      border: "1px solid rgba(148,163,184,0.14)",
      padding: "11px 12px",
      fontSize: 13,
      fontWeight: 950,
      cursor: "pointer",
      background: "rgba(2,6,23,0.65)",
      color: "#e5e7eb",
      minWidth: 140,
      boxShadow: "0 16px 60px rgba(2,6,23,0.9)",
    },
    modalBtnDanger: {
      flex: 1,
      borderRadius: 999,
      border: "1px solid rgba(248,113,113,0.45)",
      padding: "11px 12px",
      fontSize: 13,
      fontWeight: 950,
      cursor: "pointer",
      background: "rgba(127,29,29,0.78)",
      color: "#fee2e2",
      minWidth: 140,
      boxShadow: "0 18px 70px rgba(2,6,23,0.92)",
      letterSpacing: "0.04em",
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

  // Persist chats per day + mark last day with data (LOCAL, per-member)
  useEffect(() => {
    const key = dayChatsKey(day);
    safeSaveChats(key, chats);

    if (chats && chats.length > 0) {
      try {
        localStorage.setItem(LAST_DAY_KEY, day);
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chats, day, scope]);

  // Persist journal per day + mark last day with data (LOCAL, per-member)
  useEffect(() => {
    try {
      localStorage.setItem(dayJournalKeyV2(day), JSON.stringify(journal));

      const hasJournal =
        (journal.notes || "").trim() ||
        (journal.learned || "").trim() ||
        (journal.improve || "").trim();

      if (hasJournal) localStorage.setItem(LAST_DAY_KEY, day);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journal, day, scope]);

  // Persist P&L calendar (LOCAL, per-member)
  useEffect(() => {
    try {
      localStorage.setItem(PNL_KEY, JSON.stringify(pnl || {}));
    } catch {}
  }, [pnl, PNL_KEY]);

  /* ---------------- FIRESTORE: SAVE DAY DATA (DEBOUNCED) ---------------- */
  useEffect(() => {
    if (!memberId) return;
    if (chats?.length && chats[chats.length - 1]?.pending) return;

    if (dayWriteTimerRef.current) clearTimeout(dayWriteTimerRef.current);

    dayWriteTimerRef.current = setTimeout(async () => {
      try {
        const ref = doc(db, "users", memberId, "days", day);

        await setDoc(
          ref,
          {
            day,
            updatedAt: serverTimestamp(),
            chats: chatsForFirestore(chats),
            journal: {
              notes: journal?.notes || "",
              learned: journal?.learned || "",
              improve: journal?.improve || "",
            },
          },
          { merge: true }
        );
      } catch (e) {
        console.error("❌ Firestore save day error:", e?.code, e?.message, e);
      }
    }, 650);

    return () => {
      if (dayWriteTimerRef.current) clearTimeout(dayWriteTimerRef.current);
    };
  }, [memberId, day, chats, journal]);

  /* ---------------- FIRESTORE: SAVE PNL (DEBOUNCED) ---------------- */
  useEffect(() => {
    if (!memberId) return;

    if (pnlWriteTimerRef.current) clearTimeout(pnlWriteTimerRef.current);

    pnlWriteTimerRef.current = setTimeout(async () => {
      try {
        const ref = doc(db, "users", memberId, "meta", "pnl");
        await setDoc(ref, { updatedAt: serverTimestamp(), pnl: pnl || {} }, { merge: true });
      } catch (e) {
        console.error("❌ Firestore save pnl error:", e?.code, e?.message, e);
      }
    }, 650);

    return () => {
      if (pnlWriteTimerRef.current) clearTimeout(pnlWriteTimerRef.current);
    };
  }, [memberId, pnl]);

  /* ---------------- HANDLERS ---------------- */

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!isValid || submitting) return;
    setSubmitting(true);

    try {
      if (!WEBHOOK_URL) throw new Error("No webhook URL configured.");

      const localDataUrl = await fileToDataUrl(form.file);
      const localPreviewUrl = form.file ? URL.createObjectURL(form.file) : null;

      const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
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

      const res = await fetch(WEBHOOK_URL, { method: "POST", body: fd });
      const text = await res.text();

      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        throw new Error(`Non-JSON response (${res.status}): ${text?.slice(0, 200)}`);
      }

      if (!res.ok) {
        throw new Error(data?.message || data?.error || `Server responded ${res.status}`);
      }

      setChats((prev) =>
        prev.map((c) => {
          if (c.id !== tempId) return c;

          return {
            ...c,
            pending: false,
            screenshotUrl: null,
            analysis: data?.analysis || data || null,
            serverTimestamp: data?.timestamp || null,
            localPreviewUrl: c.localPreviewUrl,
            localDataUrl: c.localDataUrl,
          };
        })
      );

      setForm((prev) => ({ ...prev, strategyNotes: "", file: null }));
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
    setChats([]);
    setForm({ strategyNotes: "", file: null, timeframe: "", instrument: "" });
    setPreviewUrl(null);
    setError("");
  }

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
      localStorage.removeItem("tc_member_id");
    } catch {}
    setMember(null);
    setMenuOpen(false);
    navigate("/");
  }

  /* ---------------- DERIVED (AI) ---------------- */

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

  const statusAnimatedStyle = { opacity: 1, transform: "translateY(0)" };

  const [menuBtnHover, setMenuBtnHover] = useState(false);
  const [btnHover, setBtnHover] = useState(false);
  const [dateHover, setDateHover] = useState(false);

  /* ---------------- DERIVED (P&L) ---------------- */

  const allEntries = pnl || {};

  const allTimeStats = useMemo(() => {
    let pnlSum = 0;
    let rrSum = 0;
    let rrCount = 0;

    for (const iso in allEntries) {
      const entry = allEntries?.[iso];
      const p = entry?.pnl;
      const rr = entry?.rr;

      if (typeof p === "number" && Number.isFinite(p)) pnlSum += p;

      if (typeof rr === "number" && Number.isFinite(rr)) {
        rrSum += rr;
        rrCount += 1;
      }
    }

    return {
      pnlSum,
      avgRR: rrCount ? rrSum / rrCount : null,
      rrCount,
    };
  }, [allEntries]);

  const monthKey = useMemo(() => {
    const m = String(pnlMonth.month + 1).padStart(2, "0");
    return `${pnlMonth.year}-${m}`;
  }, [pnlMonth]);

  const monthStats = useMemo(() => {
    let pnlSum = 0;
    let rrSum = 0;
    let rrCount = 0;

    for (const iso in allEntries) {
      if (toMonthKey(iso) !== monthKey) continue;
      const entry = allEntries?.[iso];
      const p = entry?.pnl;
      const rr = entry?.rr;

      if (typeof p === "number" && Number.isFinite(p)) pnlSum += p;

      if (typeof rr === "number" && Number.isFinite(rr)) {
        rrSum += rr;
        rrCount += 1;
      }
    }

    return {
      pnlSum,
      avgRR: rrCount ? rrSum / rrCount : null,
      rrCount,
    };
  }, [allEntries, monthKey]);

  function cellThemeForIso(iso) {
    const entry = allEntries?.[iso];
    const p = entry?.pnl;
    const isToday = iso === todayIso;

    if (typeof p !== "number" || !Number.isFinite(p)) {
      return {
        bg: isToday
          ? "radial-gradient(120% 120% at 0% 0%, rgba(34,211,238,0.16), rgba(2,6,23,0.85) 60%)"
          : "radial-gradient(120% 120% at 0% 0%, rgba(148,163,184,0.08), rgba(2,6,23,0.85) 60%)",
        border: isToday ? "rgba(34,211,238,0.45)" : "rgba(148,163,184,0.12)",
      };
    }

    if (p > 0) {
      return {
        bg: "radial-gradient(120% 120% at 0% 0%, rgba(34,197,94,0.20), rgba(2,6,23,0.88) 62%)",
        border: "rgba(34,197,94,0.45)",
      };
    }
    if (p < 0) {
      return {
        bg: "radial-gradient(120% 120% at 0% 0%, rgba(248,113,113,0.18), rgba(2,6,23,0.88) 62%)",
        border: "rgba(248,113,113,0.42)",
      };
    }
    return {
      bg: "radial-gradient(120% 120% at 0% 0%, rgba(250,204,21,0.16), rgba(2,6,23,0.88) 62%)",
      border: "rgba(250,204,21,0.40)",
    };
  }

  /* ---------------- RENDER ---------------- */

  const Sidebar = () => (
    <div className="mt-sidebar mt-safeWrap mt-cardHover" style={styles.sidebar}>
      <div style={styles.sidebarTopGlow} />
      <div style={styles.sidebarTitle}>Navigation</div>

      <div
        style={styles.navItem(activePage === PAGES.AI)}
        onClick={() => {
          setActivePage(PAGES.AI);
          setShowCalendar(false);
        }}
      >
        <span style={styles.navItemAccent(activePage === PAGES.AI)} />
        <div style={styles.navItemText}>AI feedback + journal</div>
      </div>

      <div
        style={styles.navItem(activePage === PAGES.PNL)}
        onClick={() => {
          setActivePage(PAGES.PNL);
          setShowCalendar(false);
        }}
      >
        <span style={styles.navItemAccent(activePage === PAGES.PNL)} />
        <div style={styles.navItemText}>P&amp;L calendar</div>
      </div>

      <div style={styles.navHint}>
        P&amp;L is manual. Click a day to enter:
        <br />
        <strong>Symbol</strong>, <strong>$ P&amp;L</strong>, and <strong>RR</strong>.
      </div>
    </div>
  );

  return (
    <>
      <ResponsiveCSS />

      {/* 🔹 GLOBAL HEADER */}
      <div style={styles.siteHeader}>
        <div className="mt-headerTitle" style={styles.siteHeaderTitleRow}>
          <span style={styles.brandDot} />
          <div style={styles.siteHeaderTitle}>MaxTradeAI</div>
        </div>

        <div style={styles.siteHeaderActions}>
          <span className="mt-workspaceTag" style={styles.workspaceTag}>
            Personal workspace
          </span>

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
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(148,163,184,0.10)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span>Profile</span>
                <span style={{ opacity: 0.7 }}>›</span>
              </div>

              <div
                style={{ ...styles.menuItem, ...styles.menuItemDanger }}
                onClick={handleLogout}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(127,29,29,0.70)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span>Log out</span>
                <span style={{ opacity: 0.7 }}>⎋</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PAGE CONTENT */}
      <div className="mt-page" style={styles.page}>
        <div style={styles.pageGlow} />
        <div style={styles.pageGrid} />
        <div style={styles.pageInner}>
          <div className="mt-shell" style={styles.shell}>
            <Sidebar />

            <div className="mt-content" style={styles.content}>
              {/* DATE DROPDOWN (AI page) */}
              {activePage === PAGES.AI && (
                <div style={styles.dateRow}>
                  <div
                    className="mt-datePill mt-safeWrap"
                    style={{
                      ...styles.datePill,
                      ...(dateHover ? styles.datePillHover : {}),
                    }}
                    onClick={() => {
                      setShowCalendar((open) => !open);
                      if (!showCalendar) {
                        const d = parseLocalDateFromIso(day);
                        setCalendarMonth({ year: d.getFullYear(), month: d.getMonth() });
                      }
                    }}
                    onMouseEnter={() => setDateHover(true)}
                    onMouseLeave={() => setDateHover(false)}
                  >
                    <div style={styles.datePillText}>{formattedDayLabel}</div>
                    <div style={styles.datePillIcon}>{showCalendar ? "▲" : "▼"}</div>
                  </div>

                  {showCalendar && (
                    <div className="mt-calPanel" style={styles.calendarPanel}>
                      <div style={styles.calendarHeader}>
                        <button type="button" style={styles.calendarNavBtn} onClick={goToPrevMonth}>
                          ‹
                        </button>
                        <div style={styles.calendarHeaderTitle}>{calendarMonthLabel}</div>
                        <button type="button" style={styles.calendarNavBtn} onClick={goToNextMonth}>
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
                            if (!cell) return <div key={di} style={styles.dayCellEmpty} />;
                            const isSelected = cell.iso === day;
                            const isToday = cell.iso === todayIso;

                            let style = { ...styles.dayCellBase };
                            if (isSelected) style = { ...style, ...styles.dayCellSelected };
                            else if (isToday) style = { ...style, ...styles.dayCellToday };

                            return (
                              <div
                                key={di}
                                style={style}
                                onClick={() => handlePickDate(cell.iso)}
                                onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
                                onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
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
              )}

              {/* ===================== PAGE: AI FEEDBACK + JOURNAL ===================== */}
              {activePage === PAGES.AI && (
                <div className="mt-mainShell" style={styles.mainShell}>
                  <div className="mt-leftCol" style={styles.leftCol}>
                    <div className="mt-coachCard mt-cardHover" style={styles.coachCard}>
                      <div style={styles.cardTopSheen} />

                      <div style={styles.coachHeaderRow}>
                        <div className="mt-safeWrap">
                          <div style={styles.coachTitle}>Trade Coach</div>
                          <div style={styles.coachSub}>
                            Upload chart → choose pair &amp; timeframe → explain your idea → AI feedback.
                            <br />
                            <strong>
                              The more detail you give (bias, liquidity, session, entry, stop, target,
                              emotions), the more accurate your AI feedback will be.
                            </strong>
                          </div>
                        </div>
                        <div style={styles.dayBadge}>Day: {day}</div>
                      </div>

                      <div style={styles.statusBox}>
                        <div style={styles.statusGlow} />
                        <div style={{ ...styles.statusContent, ...statusAnimatedStyle }}>
                          {!lastChat && (
                            <>
                              <div style={styles.statusPlaceholderTitle}>Status…</div>
                              <p style={styles.statusPlaceholderText}>
                                Add a screenshot + your thought process below, then press “Get feedback”
                                to see your trade graded here.
                              </p>
                            </>
                          )}

                          {lastChat && isPending && (
                            <>
                              <div style={styles.statusPlaceholderTitle}>Trade Coach analyzing…</div>
                              <p style={styles.statusPlaceholderText}>
                                Hold on a second while your trade is graded and broken down.
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
                                      {lastChat.instrument && <span>{lastChat.instrument}</span>}
                                      {lastChat.instrument && lastChat.timeframe && <span> • </span>}
                                      {lastChat.timeframe && <span>{lastChat.timeframe}</span>}
                                    </span>
                                  )}
                                </div>
                                {grade && (
                                  <span
                                    style={{
                                      ...styles.gradePill,
                                      backgroundColor: gradeColor(grade),
                                      color: "#07101f",
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
                                <img src={imgSrc} alt="Trade screenshot" style={styles.statusImg} />
                              )}

                              {oneLineVerdict && (
                                <div
                                  className="mt-safeWrap"
                                  style={{ opacity: 0.98, fontSize: 13, lineHeight: 1.5 }}
                                >
                                  {oneLineVerdict}
                                </div>
                              )}

                              {whatWentRight.length > 0 && (
                                <>
                                  <div style={styles.sectionTitle}>What went right</div>
                                  <ul style={styles.ul}>
                                    {whatWentRight.map((x, i) => (
                                      <li key={i} className="mt-safeWrap">
                                        {x}
                                      </li>
                                    ))}
                                  </ul>
                                </>
                              )}

                              {whatWentWrong.length > 0 && (
                                <>
                                  <div style={styles.sectionTitle}>What went wrong</div>
                                  <ul style={styles.ul}>
                                    {whatWentWrong.map((x, i) => (
                                      <li key={i} className="mt-safeWrap">
                                        {x}
                                      </li>
                                    ))}
                                  </ul>
                                </>
                              )}

                              {improvements.length > 0 && (
                                <>
                                  <div style={styles.sectionTitle}>Improvements</div>
                                  <ul style={styles.ul}>
                                    {improvements.map((x, i) => (
                                      <li key={i} className="mt-safeWrap">
                                        {x}
                                      </li>
                                    ))}
                                  </ul>
                                </>
                              )}

                              {lessonLearned && (
                                <>
                                  <div style={styles.sectionTitle}>Lesson learned</div>
                                  <div
                                    className="mt-safeWrap"
                                    style={{ fontSize: 13, opacity: 0.94, lineHeight: 1.5 }}
                                  >
                                    {lessonLearned}
                                  </div>
                                </>
                              )}

                              <div style={styles.smallMeta}>
                                Saved to your account (member: {memberId || "anon"}) • {day}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* ===================== COMPOSER (UPLOAD + INPUTS) ===================== */}
                      <form onSubmit={handleSubmit} style={styles.formSection}>
                        <div className="mt-safeWrap" style={styles.composerRow}>
                          {/* LEFT: drop zone */}
                          <div style={styles.composerLeft}>
                            <div
                              style={{
                                ...styles.dropMini,
                                ...(dragActive ? styles.dropMiniActive : {}),
                              }}
                              onDragEnter={(e) => {
                                preventDefaults(e);
                                setDragActive(true);
                              }}
                              onDragOver={(e) => {
                                preventDefaults(e);
                                setDragActive(true);
                              }}
                              onDragLeave={(e) => {
                                preventDefaults(e);
                                setDragActive(false);
                              }}
                              onDrop={handleDrop}
                              onClick={() => fileInputRef.current?.click()}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  fileInputRef.current?.click();
                                }
                              }}
                              aria-label="Upload screenshot"
                            >
                              {previewUrl ? (
                                <>
                                  <img src={previewUrl} alt="Preview" style={styles.previewThumb} />
                                  <div style={styles.dropMiniLabel}>
                                    <div style={styles.dropMiniTitle}>Screenshot ready</div>
                                    <div style={styles.dropMiniHint}>Tap to replace</div>
                                  </div>
                                  <button
                                    type="button"
                                    style={styles.miniCloseBtn}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      onChange("file", null);
                                      setPreviewUrl(null);
                                    }}
                                    aria-label="Remove screenshot"
                                  >
                                    ×
                                  </button>
                                </>
                              ) : (
                                <div style={styles.dropMiniLabel}>
                                  <div style={styles.dropMiniTitle}>Drop screenshot</div>
                                  <div style={styles.dropMiniHint}>or tap to upload</div>
                                </div>
                              )}

                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                style={{ display: "none" }}
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f && f.type.startsWith("image/")) onChange("file", f);
                                }}
                              />
                            </div>
                          </div>

                          {/* RIGHT: fields */}
                          <div style={styles.composerRight}>
                            <div style={styles.fieldRow}>
                              <div style={styles.fieldHalf}>
                                <div style={styles.label}>Instrument</div>
                                <div style={styles.selectWrapper}>
                                  <select
                                    value={form.instrument}
                                    onChange={(e) => onChange("instrument", e.target.value)}
                                    style={styles.select}
                                  >
                                    <option value="">Select…</option>
                                    <option value="EURUSD">EURUSD</option>
                                    <option value="GBPUSD">GBPUSD</option>
                                    <option value="USDJPY">USDJPY</option>
                                    <option value="XAUUSD">XAUUSD (Gold)</option>
                                    <option value="ES">ES (S&amp;P)</option>
                                    <option value="NQ">NQ (Nasdaq)</option>
                                    <option value="MES">MES</option>
                                    <option value="MNQ">MNQ</option>
                                    <option value="Other">Other</option>
                                  </select>
                                  <span style={styles.selectArrow}>▼</span>
                                </div>
                              </div>

                              <div style={styles.fieldHalf}>
                                <div style={styles.label}>Timeframe</div>
                                <div style={styles.selectWrapper}>
                                  <select
                                    value={form.timeframe}
                                    onChange={(e) => onChange("timeframe", e.target.value)}
                                    style={styles.select}
                                  >
                                    <option value="">Select…</option>
                                    <option value="1m">1m</option>
                                    <option value="3m">3m</option>
                                    <option value="5m">5m</option>
                                    <option value="15m">15m</option>
                                    <option value="30m">30m</option>
                                    <option value="1H">1H</option>
                                    <option value="2H">2H</option>
                                    <option value="4H">4H</option>
                                    <option value="D">Daily</option>
                                  </select>
                                  <span style={styles.selectArrow}>▼</span>
                                </div>
                              </div>
                            </div>

                            <div style={{ marginTop: 6 }}>
                              <div style={styles.label}>Strategy notes (what you saw + why you took it)</div>
                              <textarea
                                value={form.strategyNotes}
                                onChange={(e) => onChange("strategyNotes", e.target.value)}
                                placeholder="Example: London sweep → FVG reclaim → targeted NY low… Entry, stop, target, what session, what you felt, etc."
                                style={styles.textarea}
                              />
                            </div>

                            <button
                              type="submit"
                              style={{
                                ...styles.button,
                                ...(btnHover && !buttonDisabled ? styles.buttonHover : {}),
                              }}
                              disabled={buttonDisabled}
                              onMouseEnter={() => setBtnHover(true)}
                              onMouseLeave={() => setBtnHover(false)}
                            >
                              {primaryButtonLabel}
                            </button>

                            {!hasCompletedTrade && (
                              <div style={styles.hint}>
                                Finish one full submission first. (Screenshot + instrument + timeframe + notes)
                              </div>
                            )}

                            {!!error && <div style={styles.error}>{error}</div>}

                            {(chats?.length > 0 || form.strategyNotes || form.file) && (
                              <button
                                type="button"
                                onClick={handleResetTrade}
                                style={{
                                  marginTop: 10,
                                  width: "100%",
                                  borderRadius: 999,
                                  border: "1px solid rgba(148,163,184,0.14)",
                                  padding: "10px 12px",
                                  fontSize: 12,
                                  fontWeight: 900,
                                  background: "rgba(2,6,23,0.55)",
                                  color: "rgba(226,232,240,0.92)",
                                  cursor: "pointer",
                                  boxShadow: "0 16px 55px rgba(2,6,23,0.85)",
                                  letterSpacing: "0.06em",
                                  textTransform: "uppercase",
                                }}
                              >
                                Reset this day
                              </button>
                            )}
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Journal */}
                  <div className="mt-rightCol" style={styles.rightCol}>
                    <div className="mt-journalCard mt-cardHover" style={styles.journalCard}>
                      <div style={styles.journalSheen} />

                      <div style={styles.journalHeaderRow}>
                        <div className="mt-safeWrap">
                          <div style={styles.journalTitle}>Journal</div>
                          <div style={styles.journalSub}>
                            Keep it simple. Short notes → better consistency.
                          </div>
                        </div>
                        <div style={styles.journalBadge}>{day}</div>
                      </div>

                      <div>
                        <div style={styles.journalLabel}>Notes (what happened)</div>
                        <textarea
                          value={journal.notes}
                          onChange={(e) => setJournal((p) => ({ ...p, notes: e.target.value }))}
                          placeholder="What did price do? What was your plan? Did you follow it?"
                          style={styles.journalTextareaBig}
                        />
                      </div>

                      <div>
                        <div style={styles.journalLabel}>What you learned</div>
                        <textarea
                          value={journal.learned}
                          onChange={(e) => setJournal((p) => ({ ...p, learned: e.target.value }))}
                          placeholder="One lesson only."
                          style={styles.journalTextareaSmall}
                        />
                      </div>

                      <div>
                        <div style={styles.journalLabel}>Improve tomorrow</div>
                        <textarea
                          value={journal.improve}
                          onChange={(e) => setJournal((p) => ({ ...p, improve: e.target.value }))}
                          placeholder="One change only."
                          style={styles.journalTextareaSmall}
                        />
                      </div>

                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
                        <button
                          type="button"
                          onClick={() => setJournal({ notes: "", learned: "", improve: "" })}
                          style={{
                            flex: 1,
                            borderRadius: 999,
                            border: "1px solid rgba(148,163,184,0.14)",
                            padding: "10px 12px",
                            fontSize: 12,
                            fontWeight: 900,
                            background: "rgba(2,6,23,0.55)",
                            color: "rgba(226,232,240,0.92)",
                            cursor: "pointer",
                            boxShadow: "0 16px 55px rgba(2,6,23,0.85)",
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            minWidth: 140,
                          }}
                        >
                          Clear journal
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const iso = todayStr();
                            setDay(iso);
                            setActivePage(PAGES.AI);
                            setShowCalendar(false);
                            const d = parseLocalDateFromIso(iso);
                            setCalendarMonth({ year: d.getFullYear(), month: d.getMonth() });
                          }}
                          style={{
                            flex: 1,
                            borderRadius: 999,
                            border: "1px solid rgba(34,211,238,0.18)",
                            padding: "10px 12px",
                            fontSize: 12,
                            fontWeight: 950,
                            background: `linear-gradient(135deg, ${CYAN}, ${CYAN_SOFT})`,
                            color: "#07101f",
                            cursor: "pointer",
                            boxShadow: "0 22px 75px rgba(34,211,238,0.38)",
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            minWidth: 140,
                          }}
                        >
                          Jump to today
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ===================== PAGE: P&L CALENDAR ===================== */}
              {activePage === PAGES.PNL && (
                <div style={styles.pnlShell}>
                  <div style={styles.pnlTopRow}>
                    <div style={styles.pnlCard} className="mt-cardHover">
                      <div style={styles.pnlCardSheen} />
                      <div style={styles.pnlCardLabel}>All-time P&amp;L</div>
                      <div style={styles.pnlCardValue}>{fmtMoneySigned(allTimeStats.pnlSum)}</div>
                      <div style={styles.pnlCardSub}>
                        Avg RR:{" "}
                        <strong>
                          {typeof allTimeStats.avgRR === "number" ? fmtRR(allTimeStats.avgRR) : "—"}
                        </strong>{" "}
                        • Trades w/ RR: {allTimeStats.rrCount}
                      </div>
                    </div>

                    <div style={styles.pnlCard} className="mt-cardHover">
                      <div style={styles.pnlCardSheen} />
                      <div style={styles.pnlCardLabel}>This month</div>
                      <div style={styles.pnlCardValue}>{fmtMoneySigned(monthStats.pnlSum)}</div>
                      <div style={styles.pnlCardSub}>
                        Avg RR:{" "}
                        <strong>
                          {typeof monthStats.avgRR === "number" ? fmtRR(monthStats.avgRR) : "—"}
                        </strong>{" "}
                        • Trades w/ RR: {monthStats.rrCount}
                      </div>
                    </div>
                  </div>

                  <div style={styles.pnlCalendarCard} className="mt-cardHover">
                    <div style={styles.pnlCalendarSheen} />

                    <div style={styles.pnlCalHeader}>
                      <div>
                        <div style={styles.pnlCalTitle}>P&amp;L Calendar</div>
                        <div style={styles.pnlMonthMeta}>
                          Click a day to add <strong>Symbol</strong>, <strong>$ P&amp;L</strong>,{" "}
                          and optional <strong>RR</strong>.
                        </div>
                      </div>

                      <div style={styles.pnlCalNav}>
                        <button type="button" style={styles.pnlNavBtn} onClick={pnlPrevMonth}>
                          ‹
                        </button>
                        <div style={styles.pnlMonthLabel}>{pnlMonthLabel}</div>
                        <button type="button" style={styles.pnlNavBtn} onClick={pnlNextMonth}>
                          ›
                        </button>
                      </div>
                    </div>

                    <div style={styles.pnlWeekdayRow}>
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((w) => (
                        <div key={w} style={{ textAlign: "center" }}>
                          {w}
                        </div>
                      ))}
                    </div>

                    {pnlWeeks.map((week, wi) => (
                      <div key={wi} style={styles.pnlWeek}>
                        {week.map((cell, di) => {
                          if (!cell) return <div key={di} style={styles.pnlCellEmpty} />;

                          const iso = cell.iso;
                          const entry = allEntries?.[iso];
                          const theme = cellThemeForIso(iso);

                          const pnlVal =
                            typeof entry?.pnl === "number" && Number.isFinite(entry.pnl)
                              ? fmtMoneySigned(entry.pnl)
                              : null;

                          const rrVal =
                            typeof entry?.rr === "number" && Number.isFinite(entry.rr)
                              ? fmtRR(entry.rr)
                              : null;

                          return (
                            <div
                              key={di}
                              style={styles.pnlDayCell(theme.bg, theme.border)}
                              onClick={() => openPnlModal(iso)}
                              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
                              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                            >
                              <div style={styles.pnlDayTop}>
                                <div style={styles.pnlDayNum}>{cell.day}</div>
                                {entry?.symbol ? (
                                  <div style={styles.pnlSymbolTag}>{entry.symbol}</div>
                                ) : (
                                  <div style={{ ...styles.pnlSymbolTag, opacity: 0.35 }}>—</div>
                                )}
                              </div>

                              {pnlVal ? (
                                <div style={styles.pnlDayMid}>
                                  <div style={styles.pnlPnlValue}>{pnlVal}</div>
                                  <div style={styles.pnlRRValue}>{rrVal || " "}</div>
                                </div>
                              ) : (
                                <div style={styles.pnlNoEntry}>No entry</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===================== P&L MODAL ===================== */}
      {pnlModalOpen && (
        <div
          style={styles.overlay}
          onClick={() => setPnlModalOpen(false)}
          role="presentation"
        >
          <div
            style={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div style={styles.modalSheen} />
            <div style={styles.modalTitle}>Edit P&amp;L</div>
            <div style={styles.modalText}>
              {pnlEditingIso || "—"} • leave all fields empty to delete.
            </div>

            <div style={styles.modalRow}>
              <div style={styles.modalLabel}>Symbol</div>
              <input
                value={pnlEditSymbol}
                onChange={(e) => setPnlEditSymbol(e.target.value)}
                placeholder="e.g. MNQ / EURUSD"
                style={styles.input}
              />
            </div>

            <div style={styles.modalRow}>
              <div style={styles.modalLabel}>$ P&amp;L (required)</div>
              <input
                value={pnlEditPnl}
                onChange={(e) => setPnlEditPnl(e.target.value)}
                placeholder="e.g. 120 or -75"
                inputMode="decimal"
                style={styles.input}
              />
            </div>

            <div style={styles.modalRow}>
              <div style={styles.modalLabel}>RR (optional)</div>
              <input
                value={pnlEditRR}
                onChange={(e) => setPnlEditRR(e.target.value)}
                placeholder="e.g. 2 or 1.5"
                inputMode="decimal"
                style={styles.input}
              />
            </div>

            <div style={styles.modalBtnRow}>
              <button type="button" style={styles.modalBtnGhost} onClick={() => setPnlModalOpen(false)}>
                Cancel
              </button>
              <button type="button" style={styles.modalBtnPrimary} onClick={savePnlEntry}>
                Save
              </button>
            </div>

            <div style={styles.modalBtnRow}>
              <button type="button" style={styles.modalBtnDanger} onClick={deletePnlEntry}>
                Delete entry
              </button>
            </div>

            <button type="button" style={styles.modalCloseBtn} onClick={() => setPnlModalOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* ===================== PROFILE MODAL ===================== */}
      {showProfile && (
        <div
          style={styles.overlay}
          onClick={() => setShowProfile(false)}
          role="presentation"
        >
          <div
            style={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div style={styles.modalSheen} />
            <div style={styles.modalTitle}>Profile</div>
            <div style={styles.modalText}>This app saves per memberId.</div>

            <div style={styles.modalRow}>
              <div style={styles.modalLabel}>Member</div>
              <div className="mt-safeWrap" style={{ opacity: 0.92 }}>
                {member?.name ? <div><strong>{member.name}</strong></div> : null}
                {member?.email ? <div>{member.email}</div> : null}
                <div style={{ marginTop: 6, opacity: 0.85 }}>
                  memberId: <strong>{memberId || "anon"}</strong>
                </div>
              </div>
            </div>

            <div style={styles.modalRow}>
              <div style={styles.modalLabel}>Storage scope</div>
              <div style={{ opacity: 0.86 }}>
                <div>Chats key: <strong>{`tradeChats:${scope}:{YYYY-MM-DD}`}</strong></div>
                <div>Journal key: <strong>{`tradeJournalV2:${scope}:{YYYY-MM-DD}`}</strong></div>
                <div>P&amp;L key: <strong>{PNL_KEY}</strong></div>
              </div>
            </div>

            <div style={styles.modalBtnRow}>
              <button type="button" style={styles.modalBtnGhost} onClick={() => setShowProfile(false)}>
                Close
              </button>
              <button
                type="button"
                style={styles.modalBtnDanger}
                onClick={() => {
                  setShowProfile(false);
                  handleLogout();
                }}
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
