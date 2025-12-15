import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/* =========================================================
   n8n Webhooks
   ========================================================= */

// ✅ Trade feedback (existing)
const PROD_TRADE_FEEDBACK =
  "https://jacobtf007.app.n8n.cloud/webhook/trade_feedback";
const WEBHOOK_URL =
  (import.meta?.env && import.meta.env.VITE_N8N_TRADE_FEEDBACK_WEBHOOK) ||
  PROD_TRADE_FEEDBACK;

// ✅ Member state (Sheets-backed)
const PROD_GET_STATE =
  "https://jacobtf007.app.n8n.cloud/webhook/tradecoach_get_state";
const PROD_SAVE_STATE =
  "https://jacobtf007.app.n8n.cloud/webhook/tradecoach_save_state";

const GET_STATE_URL =
  (import.meta?.env && import.meta.env.VITE_N8N_TRADECOACH_GET_STATE) ||
  PROD_GET_STATE;

const SAVE_STATE_URL =
  (import.meta?.env && import.meta.env.VITE_N8N_TRADECOACH_SAVE_STATE) ||
  PROD_SAVE_STATE;

/* =========================================================
   Local auth storage (member identity)
   ========================================================= */

const MEMBER_LS_KEY = "tc_member_v1";

/* =========================================================
   Defaults (THIS is what your sheet should start with)
   ========================================================= */

const DEFAULT_STATE = {
  version: 1,
  lastDay: "",
  chatsByDay: {},
  journalByDay: {},
  pnl: {},
};

const CYAN = "#22d3ee";
const CYAN_SOFT = "#38bdf8";

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
  const [y, m, d] = (iso || "").split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
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

function safeParseJSON(raw, fallback) {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function clampSymbol(s) {
  const v = String(s || "").trim();
  if (!v) return "";
  return v.slice(0, 14).toUpperCase();
}

function toMonthKey(iso) {
  return (iso || "").slice(0, 7);
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
 * Google Sheets cells have character limits.
 * So we DO NOT save base64 screenshot data (localDataUrl) to Sheets.
 * To preserve screenshots across devices, your trade_feedback webhook should upload to Drive
 * and return a screenshotUrl — then we save that URL.
 */
function leanChatsForSave(chats) {
  return (chats || []).map((c) => {
    const {
      localPreviewUrl, // blob URL (device-only)
      localDataUrl, // base64 (too big for Sheets)
      file, // File object
      pending, // transient
      ...rest
    } = c || {};
    return { ...rest, pending: false };
  });
}

function buildStateForSave({ lastDay, chatsByDay, journalByDay, pnl }) {
  const out = {
    version: 1,
    lastDay: lastDay || "",
    chatsByDay: {},
    journalByDay: journalByDay || {},
    pnl: pnl || {},
  };

  const cbd = chatsByDay || {};
  for (const iso in cbd) out.chatsByDay[iso] = leanChatsForSave(cbd[iso]);

  return out;
}

/* =========================================================
   APP
   ========================================================= */

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

  const [previewUrl, setPreviewUrl] = useState(null);

  // ⭐ member info (from localStorage) — WITH fallback to tc_member_id
  const [member, setMember] = useState(() => {
    try {
      const raw = localStorage.getItem(MEMBER_LS_KEY);
      if (raw) return JSON.parse(raw);

      const legacy = localStorage.getItem("tc_member_id");
      if (legacy) return { memberId: legacy };

      return null;
    } catch {
      return null;
    }
  });

  // ⭐ server-backed state
  const [stateLoading, setStateLoading] = useState(true);
  const [stateLoadError, setStateLoadError] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const [lastDay, setLastDay] = useState("");
  const [chatsByDay, setChatsByDay] = useState({});
  const [journalByDay, setJournalByDay] = useState({});
  const [pnl, setPnl] = useState({});

  // derived day: from server state or selectedDay
  const [day, setDay] = useState(selectedDay);

  // ⭐ header menu + profile modal state
  const [menuOpen, setMenuOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // ⭐ AI Calendar UI
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = parseLocalDateFromIso(selectedDay);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  // ⭐ P&L month calendar
  const [pnlMonth, setPnlMonth] = useState(() => {
    const d = parseLocalDateFromIso(todayStr());
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  // ⭐ P&L modal
  const [pnlModalOpen, setPnlModalOpen] = useState(false);
  const [pnlEditingIso, setPnlEditingIso] = useState(null);
  const [pnlEditSymbol, setPnlEditSymbol] = useState("");
  const [pnlEditPnl, setPnlEditPnl] = useState("");
  const [pnlEditRR, setPnlEditRR] = useState("");

  const todayIso = todayStr();

  /* =========================================================
     READ current day-specific data from server-backed maps
     ========================================================= */

  const chats = useMemo(
    () => (chatsByDay?.[day] ? chatsByDay[day] : []),
    [chatsByDay, day]
  );

  const journal = useMemo(() => {
    const j = journalByDay?.[day];
    return {
      notes: j?.notes || "",
      learned: j?.learned || "",
      improve: j?.improve || "",
    };
  }, [journalByDay, day]);

  const setChatsForDay = (iso, nextChats) => {
    setChatsByDay((prev) => ({ ...(prev || {}), [iso]: nextChats || [] }));
    setDirty(true);
  };

  const setJournalForDay = (iso, partial) => {
    setJournalByDay((prev) => {
      const base = prev?.[iso] || { notes: "", learned: "", improve: "" };
      return { ...(prev || {}), [iso]: { ...base, ...(partial || {}) } };
    });
    setDirty(true);
  };

  const setPnlEntry = (iso, entryOrNull) => {
    setPnl((prev) => {
      const copy = { ...(prev || {}) };
      if (!entryOrNull) delete copy[iso];
      else copy[iso] = entryOrNull;
      return copy;
    });
    setDirty(true);
  };

  /* =========================================================
     LOAD MEMBER STATE from SHEETS (per memberId)
     FIX: Use FormData (avoids CORS preflight)
     ========================================================= */

  async function loadState() {
    setStateLoading(true);
    setStateLoadError("");

    const memberId = String(member?.memberId || "").trim();

    if (!memberId) {
      setStateLoading(false);
      setStateLoadError("Missing member session. Please log in again.");
      return;
    }

    try {
      const fd = new FormData();
      fd.append("memberId", memberId);

      const res = await fetch(GET_STATE_URL, {
        method: "POST",
        body: fd,
      });

      const text = await res.text();
      const data = safeParseJSON(text, null);

      if (!res.ok) {
        throw new Error(
          data?.error || data?.message || `Get state failed (${res.status})`
        );
      }

      const remoteState =
        data?.state && typeof data.state === "object" ? data.state : null;

      const merged = {
        ...DEFAULT_STATE,
        ...(remoteState || {}),
        chatsByDay:
          remoteState?.chatsByDay &&
          typeof remoteState.chatsByDay === "object"
            ? remoteState.chatsByDay
            : {},
        journalByDay:
          remoteState?.journalByDay &&
          typeof remoteState.journalByDay === "object"
            ? remoteState.journalByDay
            : {},
        pnl:
          remoteState?.pnl && typeof remoteState.pnl === "object"
            ? remoteState.pnl
            : {},
      };

      const initial = merged.lastDay || selectedDay || todayStr();

      setLastDay(merged.lastDay || "");
      setChatsByDay(merged.chatsByDay || {});
      setJournalByDay(merged.journalByDay || {});
      setPnl(merged.pnl || {});
      setDay(initial);

      // reset calendar month to selected day
      try {
        const d = parseLocalDateFromIso(initial);
        setCalendarMonth({ year: d.getFullYear(), month: d.getMonth() });
      } catch {}

      setDirty(false);
    } catch (e) {
      setStateLoadError(e?.message || "Failed to load state");
    } finally {
      setStateLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (cancelled) return;
      await loadState();
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member?.memberId, selectedDay]);

  /* =========================================================
     SAVE MEMBER STATE to SHEETS (per memberId)
     FIX: Use FormData (avoids CORS preflight)
     ========================================================= */

  async function saveWorkspace() {
    setSaveMsg("");
    setSaving(true);

    const memberId = String(member?.memberId || "").trim();
    if (!memberId) {
      setSaving(false);
      setSaveMsg("Missing memberId (log in again).");
      return;
    }

    try {
      const stateToSave = buildStateForSave({
        lastDay: day || lastDay || "",
        chatsByDay,
        journalByDay,
        pnl,
      });

      const fd = new FormData();
      fd.append("memberId", memberId);
      fd.append("state", JSON.stringify(stateToSave));

      const res = await fetch(SAVE_STATE_URL, {
        method: "POST",
        body: fd,
      });

      const text = await res.text();
      const data = safeParseJSON(text, null);

      if (!res.ok) {
        throw new Error(
          data?.error || data?.message || `Save failed (${res.status})`
        );
      }

      setDirty(false);
      setLastDay(day || "");
      setSaveMsg("Saved ✅");
      setTimeout(() => setSaveMsg(""), 2500);
    } catch (e) {
      setSaveMsg(`Save failed: ${e?.message || "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     Calendar builders
     ========================================================= */

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

  const monthWeeks = buildMonthWeeks(calendarMonth);
  const calendarMonthLabel = new Date(
    calendarMonth.year,
    calendarMonth.month,
    1
  ).toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const pnlWeeks = buildMonthWeeks(pnlMonth);
  const pnlMonthLabel = new Date(
    pnlMonth.year,
    pnlMonth.month,
    1
  ).toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const formattedDayLabel = useMemo(() => {
    try {
      return parseLocalDateFromIso(day).toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return day || "";
    }
  }, [day]);

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
    setDirty(true); // lastDay changes
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

    // If all empty -> delete day
    if (!sym && !pnlTrim && !rrTrim) {
      setPnlEntry(pnlEditingIso, null);
      setPnlModalOpen(false);
      return;
    }

    const pnlNum = pnlTrim === "" ? null : Number(pnlTrim);
    const rrNum = rrTrim === "" ? null : Number(rrTrim);

    // Guard invalid numbers
    if (
      (pnlTrim !== "" && (!Number.isFinite(pnlNum) || Number.isNaN(pnlNum))) ||
      (rrTrim !== "" && (!Number.isFinite(rrNum) || Number.isNaN(rrNum)))
    ) {
      return;
    }

    if (pnlTrim === "") return; // require P&L

    setPnlEntry(pnlEditingIso, {
      symbol: sym,
      pnl: pnlNum ?? 0,
      rr: rrTrim === "" ? null : rrNum,
    });

    setPnlModalOpen(false);
  }

  function deletePnlEntry() {
    if (!pnlEditingIso) return;
    setPnlEntry(pnlEditingIso, null);
    setPnlModalOpen(false);
  }

  /* =========================================================
     Screenshot preview blob
     ========================================================= */

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

  /* =========================================================
     Submit trade (Trade feedback webhook)
     Also stores to chatsByDay[day] (member state)
     ========================================================= */

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

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!isValid || submitting) return;
    setSubmitting(true);

    try {
      if (!WEBHOOK_URL) throw new Error("No webhook URL configured.");

      // device-only preview for UI (NOT saved to Sheets)
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

      // append in state map
      setChatsForDay(day, [...(chats || []), tempChat]);

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

      // update chat item
      const next = (chatsByDay?.[day] || []).map((c) => {
        if (c.id !== tempId) return c;

        if (c.localPreviewUrl) {
          try {
            URL.revokeObjectURL(c.localPreviewUrl);
          } catch {}
        }

        return {
          ...c,
          pending: false,
          // If your webhook returns Drive URL, store it here:
          screenshotUrl: data?.screenshotUrl || c.screenshotUrl || null,
          analysis: data?.analysis || data || null,
          serverTimestamp: data?.timestamp || null,
          localPreviewUrl: c.localPreviewUrl,
          localDataUrl: c.localDataUrl,
        };
      });

      setChatsForDay(day, next);

      // clear form
      setForm((prev) => ({ ...prev, strategyNotes: "", file: null }));
      setPreviewUrl(null);
      setLastDay(day);
      setDirty(true);
    } catch (err) {
      setError(err?.message || "Submit failed");

      const prevChats = chatsByDay?.[day] || [];
      const copy = [...prevChats];
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
        setChatsForDay(day, copy);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleResetTrade() {
    setChatsForDay(day, []);
    setForm({ strategyNotes: "", file: null, timeframe: "", instrument: "" });
    setPreviewUrl(null);
    setError("");
    setDirty(true);
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

  /* =========================================================
     Derived (AI)
     ========================================================= */

  const analysis = lastChat?.analysis ?? {};
  const {
    grade,
    oneLineVerdict,
    whatWentRight = [],
    whatWentWrong = [],
    improvements = [],
    lessonLearned,
    confidence,
  } = analysis || {};

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

  /* =========================================================
     Derived (P&L)
     ========================================================= */

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

    // No entry
    if (typeof p !== "number" || !Number.isFinite(p)) {
      return {
        bg: isToday
          ? "radial-gradient(circle at top, rgba(34,211,238,0.16), rgba(2,6,23,0.95) 60%)"
          : "radial-gradient(circle at top, rgba(148,163,184,0.08), rgba(2,6,23,0.95) 60%)",
        border: isToday ? "rgba(34,211,238,0.55)" : "rgba(51,65,85,0.55)",
      };
    }

    if (p > 0) {
      return {
        bg: "radial-gradient(circle at top, rgba(34,197,94,0.18), rgba(2,6,23,0.95) 62%)",
        border: "rgba(34,197,94,0.55)",
      };
    }
    if (p < 0) {
      return {
        bg: "radial-gradient(circle at top, rgba(248,113,113,0.16), rgba(2,6,23,0.95) 62%)",
        border: "rgba(248,113,113,0.55)",
      };
    }
    return {
      bg: "radial-gradient(circle at top, rgba(250,204,21,0.14), rgba(2,6,23,0.95) 62%)",
      border: "rgba(250,204,21,0.5)",
    };
  }

  /* =========================================================
     Styles
     ========================================================= */

  const styles = {
    page: {
      minHeight: "100vh",
      background:
        "radial-gradient(circle at top, #0b1120 0, #020617 45%, #020617 100%)",
      color: "#e5e7eb",
      padding: "80px 16px 24px",
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
    pageInner: { position: "relative", zIndex: 1 },

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
        "linear-gradient(to right, rgba(15,23,42,0.96), rgba(8,25,43,0.96))",
      borderBottom: "1px solid rgba(15,23,42,0.9)",
      backdropFilter: "blur(20px)",
      zIndex: 70,
      boxShadow: "0 16px 60px rgba(15,23,42,0.9)",
      gap: 12,
    },
    siteHeaderTitle: {
      fontSize: 18,
      fontWeight: 800,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: "#f9fafb",
    },
    headerLeft: { display: "flex", alignItems: "center", gap: 10 },
    savePill: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 10px",
      borderRadius: 999,
      border: "1px solid rgba(51,65,85,0.9)",
      background:
        "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(15,23,42,0.6))",
      color: "#e5e7eb",
      fontSize: 12,
      fontWeight: 800,
      cursor: "pointer",
      userSelect: "none",
      boxShadow: "0 10px 30px rgba(15,23,42,0.9)",
      opacity: saving ? 0.75 : 1,
    },
    dotDirty: {
      width: 8,
      height: 8,
      borderRadius: 999,
      background: CYAN,
      boxShadow: "0 0 0 2px rgba(34,211,238,0.18)",
    },
    dotClean: {
      width: 8,
      height: 8,
      borderRadius: 999,
      background: "rgba(148,163,184,0.45)",
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
      background: "radial-gradient(circle at top left, #0f172a, #020617 80%)",
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
    menuItemDanger: { color: "#fecaca" },

    shell: {
      width: "100%",
      maxWidth: 1240,
      margin: "0 auto",
      display: "flex",
      gap: 16,
      alignItems: "stretch",
      flexWrap: "wrap",
    },

    sidebar: {
      width: 240,
      minWidth: 240,
      flex: "0 0 240px",
      background:
        "radial-gradient(circle at top left, rgba(2,6,23,1), rgba(2,6,23,0.92))",
      borderRadius: 20,
      border: "1px solid rgba(30,64,175,0.65)",
      boxShadow: "0 20px 60px rgba(15,23,42,0.95)",
      padding: 14,
      height: "fit-content",
      position: "sticky",
      top: 72,
      alignSelf: "flex-start",
    },
    sidebarTitle: {
      fontSize: 12,
      opacity: 0.75,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      marginBottom: 10,
      color: "#9ca3af",
    },
    navItem: (active) => ({
      padding: "10px 10px",
      borderRadius: 12,
      cursor: "pointer",
      fontSize: 13,
      color: active ? "#020617" : "#e5e7eb",
      background: active
        ? `linear-gradient(135deg, ${CYAN}, ${CYAN_SOFT})`
        : "transparent",
      border: active ? "1px solid transparent" : "1px solid rgba(51,65,85,0.6)",
      boxShadow: active ? "0 18px 55px rgba(34,211,238,0.25)" : "none",
      fontWeight: active ? 900 : 700,
      letterSpacing: active ? "0.02em" : "0",
      marginBottom: 8,
      transition:
        "transform .15s ease, box-shadow .15s ease, background .15s ease",
      userSelect: "none",
    }),
    navHint: {
      fontSize: 11,
      opacity: 0.75,
      color: "#9ca3af",
      marginTop: 10,
      lineHeight: 1.35,
    },

    content: { flex: "1 1 520px", minWidth: 0 },

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
      transition:
        "transform .16s ease, box-shadow .16s ease, border .16s ease",
      userSelect: "none",
    },
    datePillHover: {
      transform: "translateY(-1px)",
      boxShadow: "0 16px 50px rgba(15,23,42,0.95)",
      border: "1px solid rgba(34,211,238,0.85)",
    },
    datePillText: {
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    datePillIcon: { fontSize: 11, opacity: 0.9, marginLeft: 8 },

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
    calendarHeaderTitle: { fontWeight: 700 },
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
    weekdayCell: { textAlign: "center", padding: "4px 0" },
    calendarWeek: {
      display: "grid",
      gridTemplateColumns: "repeat(7, 1fr)",
      gap: 4,
      marginTop: 2,
    },
    dayCellEmpty: { padding: "6px 0", fontSize: 12 },
    dayCellBase: {
      padding: "6px 0",
      fontSize: 12,
      textAlign: "center",
      borderRadius: 8,
      cursor: "pointer",
      border: "1px solid transparent",
      color: "#e5e7eb",
      transition: "background .12s ease, border .12s ease, color .12s ease",
      userSelect: "none",
    },
    dayCellSelected: { background: CYAN, color: "#020617", borderColor: CYAN },
    dayCellToday: { borderColor: "rgba(34,211,238,0.6)" },

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
    statusPlaceholderText: { fontSize: 13, opacity: 0.8, color: "#9ca3af" },
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
    statusLabel: { fontSize: 13, fontWeight: 700, color: "#e5e7eb" },
    statusMeta: { fontSize: 11, opacity: 0.75, color: "#9ca3af" },
    gradePill: {
      fontSize: 14,
      fontWeight: 900,
      padding: "3px 10px",
      borderRadius: 999,
      background:
        "linear-gradient(135deg, rgba(34,211,238,0.05), rgba(56,189,248,0.12))",
      border: "1px solid rgba(148,163,184,0.9)",
      boxShadow:
        "0 0 0 1px rgba(15,23,42,0.9), 0 0 30px rgba(34,211,238,0.4)",
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
    smallMeta: { fontSize: 11, opacity: 0.7, marginTop: 8, color: "#9ca3af" },

    formSection: { marginTop: 10, display: "flex", flexDirection: "column", gap: 8 },
    composerRow: { display: "flex", gap: 10, alignItems: "stretch", flexWrap: "wrap" },
    composerLeft: { flex: "0 0 190px", minWidth: 150 },
    composerRight: { flex: "1 1 260px", minWidth: 260 },

    dropMini: {
      background:
        "radial-gradient(circle at top left, #020617, #020617 70%, #020617 100%)",
      border: "1px dashed rgba(51,65,85,0.95)",
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
      background: "radial-gradient(circle at top, rgba(34,211,238,0.12), #020617)",
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
    dropMiniLabel: { display: "flex", flexDirection: "column", gap: 3 },
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
    fieldRow: { display: "flex", gap: 8, marginBottom: 6, flexWrap: "wrap" },
    fieldHalf: { flex: "1 1 0", minWidth: 140 },

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
    },

    selectWrapper: { position: "relative", width: "100%" },
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
    journalTitle: { fontSize: 18, fontWeight: 800, color: "#f9fafb" },
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
    journalLabel: { fontSize: 12, opacity: 0.8, marginBottom: 4, color: "#9ca3af" },
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

    pnlShell: {
      width: "100%",
      maxWidth: 1100,
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
      gap: 12,
    },
    pnlTopRow: {
      display: "flex",
      gap: 12,
      flexWrap: "wrap",
      alignItems: "stretch",
    },
    pnlCard: {
      flex: "1 1 260px",
      minWidth: 260,
      background:
        "radial-gradient(circle at top left, #020617, #020617 60%, #020617 100%)",
      borderRadius: 18,
      border: "1px solid rgba(30,64,175,0.7)",
      boxShadow: "0 20px 60px rgba(15,23,42,0.95)",
      padding: 16,
      display: "flex",
      flexDirection: "column",
      gap: 6,
    },
    pnlCardLabel: { fontSize: 12, opacity: 0.75, color: "#9ca3af" },
    pnlCardValue: {
      fontSize: 24,
      fontWeight: 900,
      letterSpacing: "0.02em",
      color: "#f9fafb",
    },
    pnlCardSub: { fontSize: 12, opacity: 0.8, color: "#9ca3af" },

    pnlCalendarCard: {
      background:
        "radial-gradient(circle at top left, #020617, #020617 60%, #020617 100%)",
      borderRadius: 20,
      border: "1px solid rgba(30,64,175,0.7)",
      boxShadow: "0 20px 60px rgba(15,23,42,0.95)",
      padding: 16,
    },
    pnlCalHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
      gap: 8,
      flexWrap: "wrap",
    },
    pnlCalTitle: {
      fontSize: 16,
      fontWeight: 900,
      color: "#f9fafb",
      letterSpacing: "0.03em",
      textTransform: "uppercase",
    },
    pnlCalNav: { display: "flex", alignItems: "center", gap: 8 },
    pnlNavBtn: {
      width: 30,
      height: 30,
      borderRadius: 999,
      border: "1px solid rgba(55,65,81,0.9)",
      background: "#020617",
      color: "#e5e7eb",
      fontSize: 14,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    pnlMonthLabel: {
      fontSize: 13,
      fontWeight: 700,
      color: "#e5e7eb",
      opacity: 0.9,
      minWidth: 160,
      textAlign: "center",
    },
    pnlMonthMeta: { fontSize: 12, opacity: 0.8, color: "#9ca3af" },

    pnlWeekdayRow: {
      display: "grid",
      gridTemplateColumns: "repeat(7, 1fr)",
      gap: 8,
      fontSize: 11,
      opacity: 0.75,
      marginBottom: 8,
      color: "#9ca3af",
    },
    pnlWeek: {
      display: "grid",
      gridTemplateColumns: "repeat(7, 1fr)",
      gap: 8,
      marginTop: 8,
    },
    pnlCellEmpty: {
      height: 78,
      borderRadius: 14,
      border: "1px solid rgba(31,41,55,0.35)",
      opacity: 0.25,
    },

    pnlDayCell: (bg, borderColor) => ({
      height: 78,
      borderRadius: 14,
      border: `1px solid ${borderColor}`,
      background: bg,
      boxShadow: "0 10px 35px rgba(15,23,42,0.55)",
      padding: 10,
      cursor: "pointer",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      userSelect: "none",
      transition: "transform .12s ease, box-shadow .12s ease, border-color .12s ease",
    }),
    pnlDayTop: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    pnlDayNum: { fontSize: 12, fontWeight: 900, color: "#e5e7eb", opacity: 0.95 },
    pnlSymbolTag: {
      fontSize: 10,
      fontWeight: 900,
      letterSpacing: "0.06em",
      opacity: 0.95,
      padding: "2px 8px",
      borderRadius: 999,
      border: "1px solid rgba(255,255,255,0.18)",
      background: "rgba(2,6,23,0.35)",
      color: "#e5e7eb",
      whiteSpace: "nowrap",
      maxWidth: 120,
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    pnlDayMid: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: 8,
    },
    pnlPnlValue: {
      fontSize: 14,
      fontWeight: 900,
      letterSpacing: "0.02em",
      color: "#f9fafb",
    },
    pnlRRValue: { fontSize: 11, fontWeight: 800, opacity: 0.95, color: "#e5e7eb" },
    pnlNoEntry: { fontSize: 11, opacity: 0.75, color: "#9ca3af", fontWeight: 700 },

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
      maxWidth: 420,
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
    modalText: { fontSize: 12, opacity: 0.8, marginBottom: 12, textAlign: "center", color: "#9ca3af" },
    modalRow: { marginBottom: 10, fontSize: 13 },
    modalLabel: { fontWeight: 700, opacity: 0.9, color: "#e5e7eb", marginBottom: 4 },
    modalCloseBtn: {
      marginTop: 14,
      width: "100%",
      borderRadius: 999,
      border: "1px solid rgba(55,65,81,0.9)",
      padding: "8px 12px",
      fontSize: 13,
      fontWeight: 700,
      background: "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(15,23,42,0.7))",
      color: "#e5e7eb",
      cursor: "pointer",
    },
    modalBtnRow: { display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" },
    modalBtnPrimary: {
      flex: 1,
      borderRadius: 999,
      border: "none",
      padding: "10px 12px",
      fontSize: 13,
      fontWeight: 900,
      cursor: "pointer",
      color: "#020617",
      background: `linear-gradient(135deg, ${CYAN}, ${CYAN_SOFT})`,
      boxShadow: "0 18px 55px rgba(34,211,238,0.35)",
      minWidth: 140,
    },
    modalBtnGhost: {
      flex: 1,
      borderRadius: 999,
      border: "1px solid rgba(55,65,81,0.9)",
      padding: "10px 12px",
      fontSize: 13,
      fontWeight: 800,
      cursor: "pointer",
      background: "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(15,23,42,0.7))",
      color: "#e5e7eb",
      minWidth: 140,
    },
    modalBtnDanger: {
      flex: 1,
      borderRadius: 999,
      border: "1px solid rgba(248,113,113,0.6)",
      padding: "10px 12px",
      fontSize: 13,
      fontWeight: 900,
      cursor: "pointer",
      background: "rgba(127,29,29,0.85)",
      color: "#fee2e2",
      minWidth: 140,
    },
  };

  /* =========================================================
     UI components
     ========================================================= */

  const Sidebar = () => (
    <div style={styles.sidebar}>
      <div style={styles.sidebarTitle}>Navigation</div>

      <div
        style={styles.navItem(activePage === PAGES.AI)}
        onClick={() => {
          setActivePage(PAGES.AI);
          setShowCalendar(false);
        }}
      >
        AI feedback + journal
      </div>

      <div
        style={styles.navItem(activePage === PAGES.PNL)}
        onClick={() => {
          setActivePage(PAGES.PNL);
          setShowCalendar(false);
        }}
      >
        P&amp;L calendar
      </div>

      <div style={styles.navHint}>
        P&amp;L is manual (paper-friendly). Click a day to enter:
        <br />
        <strong>Symbol</strong>, <strong>$ P&amp;L</strong>, and <strong>RR</strong>.
        <br />
        <br />
        <strong>IMPORTANT:</strong> Click <strong>Save</strong> (top bar) to sync
        across devices.
      </div>
    </div>
  );

  /* =========================================================
     Render
     ========================================================= */

  if (stateLoading) {
    return (
      <div style={{ ...styles.page, paddingTop: 80 }}>
        <div style={styles.pageGlow} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto" }}>
          <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 10 }}>
            Loading your workspace…
          </div>
          <div style={{ opacity: 0.8, color: "#9ca3af" }}>
            Fetching your saved data for <strong>{member?.memberId || "—"}</strong>
          </div>
        </div>
      </div>
    );
  }

  if (stateLoadError) {
    return (
      <div style={{ ...styles.page, paddingTop: 80 }}>
        <div style={styles.pageGlow} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto" }}>
          <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 10, color: "#fee2e2" }}>
            Couldn’t load your workspace
          </div>
          <div style={{ ...styles.error, maxWidth: 700 }}>{stateLoadError}</div>
          <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" style={styles.modalBtnPrimary} onClick={loadState}>
              Reload
            </button>
            <button type="button" style={styles.modalBtnDanger} onClick={handleLogout}>
              Log out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 🔹 GLOBAL HEADER */}
      <div style={styles.siteHeader}>
        <div style={styles.headerLeft}>
          <div style={styles.siteHeaderTitle}>MaxTradeAI</div>

          <button
            type="button"
            style={styles.savePill}
            onClick={saveWorkspace}
            disabled={saving}
            title="Saves your workspace to Google Sheets so it works on any device"
          >
            <span style={dirty ? styles.dotDirty : styles.dotClean} />
            {saving ? "Saving…" : dirty ? "Save" : "Saved"}
            {saveMsg ? <span style={{ marginLeft: 8, opacity: 0.85 }}>{saveMsg}</span> : null}
          </button>
        </div>

        <div style={styles.siteHeaderActions}>
          <span style={styles.workspaceTag}>Personal workspace</span>
          <button
            type="button"
            style={{ ...styles.menuButton, ...(menuBtnHover ? styles.menuButtonHover : {}) }}
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
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(15,23,42,0.95)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                Profile
              </div>

              <div
                style={{ ...styles.menuItem, ...styles.menuItemDanger }}
                onClick={handleLogout}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(127,29,29,0.9)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
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
          <div style={styles.shell}>
            <Sidebar />

            <div style={styles.content}>
              {/* DATE DROPDOWN (only on AI page) */}
              {activePage === PAGES.AI && (
                <div style={styles.dateRow}>
                  <div
                    style={{ ...styles.datePill, ...(dateHover ? styles.datePillHover : {}) }}
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
                    <div style={styles.calendarPanel}>
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
                              <div key={di} style={style} onClick={() => handlePickDate(cell.iso)}>
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
                <div style={styles.mainShell}>
                  {/* LEFT: TRADE COACH */}
                  <div style={styles.leftCol}>
                    <div style={styles.coachCard}>
                      <div style={styles.coachHeaderRow}>
                        <div>
                          <div style={styles.coachTitle}>Trade Coach</div>
                          <div style={styles.coachSub}>
                            Upload chart → choose pair & timeframe → explain your idea → AI feedback.
                            <br />
                            <strong>
                              The more detail you give (bias, liquidity, session, entry, stop, target, emotions), the more accurate your AI feedback will be.
                            </strong>
                          </div>
                        </div>
                        <div style={styles.dayBadge}>Day: {day}</div>
                      </div>

                      {/* STATUS BOX */}
                      <div style={styles.statusBox}>
                        <div style={styles.statusGlow} />
                        <div style={{ ...styles.statusContent, ...statusAnimatedStyle }}>
                          {!lastChat && (
                            <>
                              <div style={styles.statusPlaceholderTitle}>Status…</div>
                              <p style={styles.statusPlaceholderText}>
                                Add a screenshot + your thought process below, then press “Get feedback” to see your trade graded here.
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
                                      color: "#020617",
                                    }}
                                  >
                                    {grade}
                                  </span>
                                )}
                              </div>

                              {typeof confidence === "number" && (
                                <div style={styles.statusMeta}>{Math.round(confidence * 100)}% confident</div>
                              )}

                              {imgSrc && <img src={imgSrc} alt="Trade screenshot" style={styles.statusImg} />}

                              {oneLineVerdict && <div style={{ opacity: 0.96, fontSize: 13 }}>{oneLineVerdict}</div>}

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
                                  <div style={{ opacity: 0.96, fontSize: 13, color: "#d1d5db" }}>{lessonLearned}</div>
                                </>
                              )}

                              {(lastChat.serverTimestamp || lastChat.timestamp) && (
                                <div style={styles.smallMeta}>
                                  {new Date(lastChat.serverTimestamp || lastChat.timestamp).toLocaleString()}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* FORM */}
                      <form onSubmit={hasCompletedTrade ? undefined : handleSubmit} style={styles.formSection}>
                        <div style={styles.composerRow}>
                          <div style={styles.composerLeft}>
                            <div
                              style={{ ...styles.dropMini, ...(dragActive ? styles.dropMiniActive : {}) }}
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
                                  <img src={previewUrl} alt="preview" style={styles.previewThumb} />
                                  <div style={styles.dropMiniLabel}>
                                    <span style={styles.dropMiniTitle}>Screenshot added</span>
                                    <span style={styles.dropMiniHint}>Click to replace • drag a new chart here</span>
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
                                  <span style={styles.dropMiniTitle}>+ Add screenshot</span>
                                  <span style={styles.dropMiniHint}>Click or drag chart here (.png / .jpg)</span>
                                </div>
                              )}

                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={(e) => onChange("file", e.target.files?.[0] || null)}
                                style={{ display: "none" }}
                              />
                            </div>
                          </div>

                          <div style={styles.composerRight}>
                            <div style={styles.fieldRow}>
                              <div style={styles.fieldHalf}>
                                <div style={styles.label}>What were you trading?</div>
                                <input
                                  type="text"
                                  style={styles.input}
                                  placeholder="e.g. NASDAQ, S&P 500, GBP/USD, XAU/USD"
                                  value={form.instrument}
                                  onChange={(e) => onChange("instrument", e.target.value)}
                                />
                              </div>
                              <div style={styles.fieldHalf}>
                                <div style={styles.label}>Timeframe</div>
                                <div style={styles.selectWrapper}>
                                  <select
                                    style={styles.select}
                                    value={form.timeframe}
                                    onChange={(e) => onChange("timeframe", e.target.value)}
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
                              Strategy / thought process — what setup were you taking?
                            </div>
                            <textarea
                              value={form.strategyNotes}
                              onChange={(e) => onChange("strategyNotes", e.target.value)}
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
                            ...(btnHover && !buttonDisabled ? styles.buttonHover : {}),
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
                                Tip: define VITE_N8N_TRADE_FEEDBACK_WEBHOOK in .env.local and in
                                your deploy env.
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
                            Your personal notes for this day. Saved in your workspace state (memberId-based).
                          </div>
                        </div>
                        <div style={styles.journalBadge}>Entry for {day}</div>
                      </div>

                      <div>
                        <div style={styles.journalLabel}>Notes</div>
                        <textarea
                          style={styles.journalTextareaBig}
                          value={journal.notes}
                          onChange={(e) => setJournalForDay(day, { notes: e.target.value })}
                          placeholder="Text here..."
                        />
                      </div>

                      <div>
                        <div style={styles.journalLabel}>What did you learn today?</div>
                        <textarea
                          style={styles.journalTextareaSmall}
                          value={journal.learned}
                          onChange={(e) => setJournalForDay(day, { learned: e.target.value })}
                          placeholder="Key lessons, patterns, or rules you want to remember."
                        />
                      </div>

                      <div>
                        <div style={styles.journalLabel}>What do you need to improve?</div>
                        <textarea
                          style={styles.journalTextareaSmall}
                          value={journal.improve}
                          onChange={(e) => setJournalForDay(day, { improve: e.target.value })}
                          placeholder="Risk, discipline, entries, exits, patience, etc."
                        />
                      </div>

                      <div style={styles.journalHintRow}>
                        <span>
                          This is memberId-based. Click <strong>Save</strong> to sync across devices.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ===================== PAGE: P&L CALENDAR ===================== */}
              {activePage === PAGES.PNL && (
                <div style={styles.pnlShell}>
                  <div style={styles.pnlTopRow}>
                    <div style={styles.pnlCard}>
                      <div style={styles.pnlCardLabel}>All-time P&amp;L ($)</div>
                      <div style={styles.pnlCardValue}>
                        {fmtMoneySigned(Number(allTimeStats.pnlSum.toFixed(2)))}
                      </div>
                      <div style={styles.pnlCardSub}>Manual entries • synced by memberId</div>
                    </div>

                    <div style={styles.pnlCard}>
                      <div style={styles.pnlCardLabel}>All-time Avg RR</div>
                      <div style={styles.pnlCardValue}>
                        {allTimeStats.avgRR == null ? "—" : fmtRR(allTimeStats.avgRR)}
                      </div>
                      <div style={styles.pnlCardSub}>
                        Based on {allTimeStats.rrCount} day{allTimeStats.rrCount === 1 ? "" : "s"} with RR entered
                      </div>
                    </div>
                  </div>

                  <div style={styles.pnlCalendarCard}>
                    <div style={styles.pnlCalHeader}>
                      <div>
                        <div style={styles.pnlCalTitle}>P&amp;L Calendar</div>
                        <div style={styles.pnlMonthMeta}>
                          {pnlMonthLabel}: <strong>{fmtMoneySigned(Number(monthStats.pnlSum.toFixed(2)))}</strong> • Avg RR:{" "}
                          <strong>{monthStats.avgRR == null ? "—" : fmtRR(monthStats.avgRR)}</strong>
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

                          const entry = allEntries?.[cell.iso];
                          const theme = cellThemeForIso(cell.iso);

                          const hasPnl = typeof entry?.pnl === "number" && Number.isFinite(entry.pnl);
                          const symbol = clampSymbol(entry?.symbol || "");
                          const rr = typeof entry?.rr === "number" && Number.isFinite(entry.rr) ? entry.rr : null;

                          return (
                            <div
                              key={di}
                              style={styles.pnlDayCell(theme.bg, theme.border)}
                              onClick={() => openPnlModal(cell.iso)}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "translateY(-1px)";
                                e.currentTarget.style.boxShadow = "0 16px 50px rgba(15,23,42,0.75)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "translateY(0)";
                                e.currentTarget.style.boxShadow = "0 10px 35px rgba(15,23,42,0.55)";
                              }}
                              title="Click to add / edit"
                            >
                              <div style={styles.pnlDayTop}>
                                <span style={styles.pnlDayNum}>{cell.day}</span>
                                <span style={styles.pnlSymbolTag}>{symbol || "—"}</span>
                              </div>

                              {!hasPnl ? (
                                <div style={styles.pnlNoEntry}>No entry</div>
                              ) : (
                                <div style={styles.pnlDayMid}>
                                  <span style={styles.pnlPnlValue}>
                                    {fmtMoneySigned(Number(entry.pnl.toFixed(2)))}
                                  </span>
                                  <span style={styles.pnlRRValue}>{rr == null ? "—" : fmtRR(rr)}</span>
                                </div>
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

      {/* PROFILE MODAL */}
      {showProfile && (
        <div style={styles.overlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalTitle}>Profile</div>
            <div style={styles.modalText}>Basic info for your MaxTradeAI workspace.</div>

            <div style={styles.modalRow}>
              <div style={styles.modalLabel}>Member ID</div>
              <div style={{ opacity: 0.95 }}>{member?.memberId || "—"}</div>
            </div>

            <div style={{ ...styles.modalRow, marginTop: 12 }}>
              <div style={styles.modalLabel}>State webhooks</div>
              <div style={{ fontSize: 12, opacity: 0.8, color: "#9ca3af", lineHeight: 1.4 }}>
                GET: <span style={{ opacity: 0.95, color: "#e5e7eb" }}>{GET_STATE_URL}</span>
                <br />
                SAVE: <span style={{ opacity: 0.95, color: "#e5e7eb" }}>{SAVE_STATE_URL}</span>
              </div>
            </div>

            <button type="button" style={styles.modalCloseBtn} onClick={() => setShowProfile(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* P&L EDIT MODAL */}
      {pnlModalOpen && (
        <div style={styles.overlay} onClick={() => setPnlModalOpen(false)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>Edit Day</div>
            <div style={styles.modalText}>
              {pnlEditingIso
                ? parseLocalDateFromIso(pnlEditingIso).toLocaleDateString(undefined, {
                    weekday: "long",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : ""}
            </div>

            <div style={styles.modalRow}>
              <div style={styles.modalLabel}>Symbol (what was traded)</div>
              <input
                type="text"
                value={pnlEditSymbol}
                onChange={(e) => setPnlEditSymbol(e.target.value)}
                placeholder="Ex: NQ, ES, GBPUSD, XAUUSD"
                style={styles.input}
              />
            </div>

            <div style={styles.modalRow}>
              <div style={styles.modalLabel}>P&amp;L for the day ($)</div>
              <input
                type="number"
                step="0.01"
                value={pnlEditPnl}
                onChange={(e) => setPnlEditPnl(e.target.value)}
                placeholder="Ex: 120, -45.50, 0"
                style={styles.input}
              />
              <div style={{ fontSize: 11, opacity: 0.75, marginTop: 6, color: "#9ca3af" }}>
                Tip: Leave everything blank to delete the day.
              </div>
            </div>

            <div style={styles.modalRow}>
              <div style={styles.modalLabel}>RR ratio (optional)</div>
              <input
                type="number"
                step="0.01"
                value={pnlEditRR}
                onChange={(e) => setPnlEditRR(e.target.value)}
                placeholder="Ex: 2, 1.5, 0.8"
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
                Delete day
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
