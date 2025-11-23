import { useEffect, useMemo, useRef, useState } from "react";

// ✅ Single source of truth for prod:
const PROD_WEBHOOK = "https://jacobtf007.app.n8n.cloud/webhook/trade_feedback";

// ✅ Env override if you ever want it later:
const WEBHOOK_URL =
  (import.meta?.env && import.meta.env.VITE_N8N_TRADE_FEEDBACK_WEBHOOK) ||
  PROD_WEBHOOK;

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

  // already a direct uc?id=
  if (url.includes("drive.google.com/uc?id=")) return url;

  // turn /file/d/FILEID/view into uc?id=FILEID
  const m = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (m?.[1]) return `https://drive.google.com/uc?id=${m[1]}`;

  return url;
}

export default function App({
  selectedDay = new Date().toISOString().slice(0, 10),
}) {
  const [form, setForm] = useState({ strategyNotes: "", file: null });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // ✅ Chat history per-day
  const [chats, setChats] = useState([]);

  // ✅ Form preview URL (avoid regenerating per-render)
  const [previewUrl, setPreviewUrl] = useState(null);

  // Create / cleanup blob URL for the form preview
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

  // Load saved chats for the selected day
  useEffect(() => {
    try {
      const key = `tradeChats:${selectedDay}`;
      const saved = localStorage.getItem(key);
      setChats(saved ? JSON.parse(saved) : []);
      setForm((prev) => ({ ...prev, file: null }));
      setError("");
    } catch {
      setChats([]);
    }
  }, [selectedDay]);

  // Persist chats whenever they change
  useEffect(() => {
    try {
      const key = `tradeChats:${selectedDay}`;
      localStorage.setItem(key, JSON.stringify(chats));
      localStorage.setItem("lastTradeChats", JSON.stringify(chats));
    } catch {
      /* ignore storage errors */
    }
  }, [chats, selectedDay]);

  const isValid = useMemo(() => !!form.strategyNotes && !!form.file, [form]);
  const onChange = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (!WEBHOOK_URL) throw new Error("No webhook URL configured.");

      // ✅ Persistent fallback image (survives reload)
      const localDataUrl = await fileToDataUrl(form.file);

      // Local preview URL for instant UX (dies on refresh)
      const localPreviewUrl = form.file
        ? URL.createObjectURL(form.file)
        : null;

      // Create a temp chat entry (pending)
      const tempId = `tmp-${Date.now()}`;
      const tempChat = {
        id: tempId,
        timestamp: new Date().toISOString(),
        userNotes: form.strategyNotes,

        // show local preview immediately, replaced later with Drive URL
        screenshotUrl: null,
        localPreviewUrl,
        localDataUrl, // ✅ persistent fallback
        pending: true,
        analysis: null,
      };

      setChats((prev) => [...prev, tempChat]);

      // Build multipart/form-data
      const fd = new FormData();
      fd.append("day", selectedDay);
      fd.append("strategyNotes", form.strategyNotes);
      if (form.file) fd.append("screenshot", form.file); // must be 'screenshot'

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

      // ✅ Update the pending chat with real Drive screenshot + analysis
      setChats((prev) =>
        prev.map((c) => {
          if (c.id !== tempId) return c;

          // Revoke local object URL once replaced (prevent memory leak)
          // We still keep localDataUrl for fallback forever.
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
          };
        })
      );

      // Reset form (but DO NOT wipe chats)
      setForm({ strategyNotes: "", file: null });
    } catch (err) {
      setError(err?.message || "Submit failed");
      // If submission failed, mark last pending bubble as not pending + error note
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

  // Drag & drop
  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  function handleDrop(e) {
    preventDefaults(e);
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith("image/")) onChange("file", file);
  }

  const styles = {
    page: {
      minHeight: "100vh",
      background: "#0b0f14",
      color: "#e7ecf2",
      display: "grid",
      placeItems: "center",
      padding: "24px 12px",
    },
    card: {
      width: "100%",
      maxWidth: 760,
      background: "#121821",
      borderRadius: 16,
      boxShadow: "0 8px 30px rgba(0,0,0,.35)",
      padding: 20,
    },
    header: { textAlign: "center", marginBottom: 16 },
    dayBadge: {
      display: "inline-block",
      fontSize: 12,
      opacity: 0.75,
      border: "1px solid #243043",
      borderRadius: 10,
      padding: "4px 10px",
      marginTop: 6,
    },
    title: { fontSize: 26, fontWeight: 800, margin: 0 },
    subtitle: { fontSize: 12, opacity: 0.7, marginTop: 6 },
    form: { display: "grid", gap: 14 },
    drop: {
      background: "#0d121a",
      border: "2px dashed #243043",
      borderRadius: 16,
      height: 280,
      display: "grid",
      placeItems: "center",
      textAlign: "center",
      padding: 16,
      cursor: "pointer",
      transition: "border-color .2s ease, background .2s ease",
      position: "relative",
    },
    dropActive: { borderColor: "#1b9aaa", background: "#0f1621" },
    dropTextMain: { fontWeight: 700, marginBottom: 6 },
    dropTextSub: { fontSize: 12, opacity: 0.7 },
    previewImg: {
      maxWidth: "100%",
      maxHeight: 240,
      borderRadius: 12,
      border: "1px solid #243043",
      display: "block",
    },
    closeBtn: {
      position: "absolute",
      top: 8,
      right: 8,
      background: "rgba(0,0,0,0.6)",
      color: "#fff",
      border: "none",
      borderRadius: "9999px",
      width: 24,
      height: 24,
      lineHeight: "22px",
      textAlign: "center",
      cursor: "pointer",
      fontWeight: 800,
      fontSize: 14,
      opacity: 0.9,
    },
    textarea: {
      width: "100%",
      minHeight: 160,
      background: "#0d121a",
      border: "1px solid #243043",
      borderRadius: 12,
      color: "#e7ecf2",
      padding: "10px 12px",
      outline: "none",
      resize: "vertical",
    },
    label: { fontSize: 12, opacity: 0.7, marginBottom: 6 },
    button: {
      marginTop: 4,
      width: "100%",
      background: "#1b9aaa",
      color: "#fff",
      border: "none",
      borderRadius: 12,
      padding: "12px 16px",
      fontWeight: 800,
      cursor: "pointer",
      opacity: isValid && !submitting ? 1 : 0.5,
    },
    error: {
      marginTop: 12,
      padding: 12,
      borderRadius: 12,
      background: "#2b1620",
      color: "#ffd0d7",
      whiteSpace: "pre-wrap",
    },
    hint: { marginTop: 10, fontSize: 12, opacity: 0.7 },

    // Chat styling
    chatWrap: {
      marginTop: 18,
      background: "#0d121a",
      border: "1px solid #243043",
      borderRadius: 14,
      padding: 14,
      display: "grid",
      gap: 12,
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
    },
    bubbleHeader: {
      fontWeight: 800,
      marginBottom: 6,
      display: "flex",
      alignItems: "center",
      gap: 8,
    },
    gradePill: {
      fontSize: 16,
      fontWeight: 900,
      padding: "2px 8px",
      borderRadius: 8,
      background: "#1b9aaa22",
      border: "1px solid #1b9aaa55",
    },
    sectionTitle: { fontWeight: 800, marginTop: 8, marginBottom: 4 },
    ul: { margin: 0, paddingLeft: 18, opacity: 0.95 },
    smallMeta: { fontSize: 11, opacity: 0.6, marginTop: 6 },
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Trade Coach (Personal)</h1>
          <div style={styles.subtitle}>
            Upload chart (screenshot) → then write your thought process → AI
            feedback
          </div>
          <div style={styles.dayBadge}>
            Day: {selectedDay} • saved per-day
          </div>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* BIG SCREENSHOT UPLOAD BOX */}
          <div
            style={{ ...styles.drop, ...(dragActive ? styles.dropActive : {}) }}
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
            onDrop={(e) => {
              handleDrop(e);
              setDragActive(false);
            }}
          >
            {!form.file ? (
              <div>
                <div style={styles.dropTextMain}>Drop chart screenshot here</div>
                <div style={styles.dropTextSub}>
                  or click to browse (.png / .jpg)
                </div>
              </div>
            ) : (
              <>
                <img
                  src={previewUrl || ""}
                  alt="preview"
                  style={styles.previewImg}
                />
                <button
                  type="button"
                  aria-label="Remove screenshot"
                  title="Remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange("file", null);
                  }}
                  style={styles.closeBtn}
                >
                  ×
                </button>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => onChange("file", e.target.files?.[0] || null)}
              style={{ display: "none" }}
            />
          </div>

          {/* THOUGHT PROCESS TEXTBOX */}
          <div>
            <div style={styles.label}>
              Strategy / thought process — what setup were you taking?
            </div>
            <textarea
              value={form.strategyNotes}
              onChange={(e) => onChange("strategyNotes", e.target.value)}
              placeholder="Explain your idea: HTF bias, BOS/CHoCH, FVG fill, OB mitigation, session, target, risk plan, management rules..."
              required
              style={styles.textarea}
            />
          </div>

          <button disabled={!isValid || submitting} style={styles.button}>
            {submitting ? "Uploading…" : "Get Feedback"}
          </button>
        </form>

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

        {/* ✅ ChatGPT-style history below form */}
        {chats.length > 0 && (
          <div style={styles.chatWrap}>
            {chats.map((chat) => (
              <ChatTurn key={chat.id} chat={chat} styles={styles} />
            ))}
          </div>
        )}
      </div>
    </div>
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

  // ✅ START with Drive URL if present, but FALL BACK if it fails to load.
  const initialImg =
    normalizeDriveUrl(chat.screenshotUrl) ||
    chat.localDataUrl ||
    chat.localPreviewUrl ||
    null;

  const [imgSrc, setImgSrc] = useState(initialImg);

  // If chat changes (new response), reset image src to latest best option
  useEffect(() => {
    const next =
      normalizeDriveUrl(chat.screenshotUrl) ||
      chat.localDataUrl ||
      chat.localPreviewUrl ||
      null;
    setImgSrc(next);
  }, [chat.screenshotUrl, chat.localDataUrl, chat.localPreviewUrl]);

  function handleImgError() {
    // If Drive fails, force fallback to localDataUrl (always works)
    if (chat.localDataUrl && imgSrc !== chat.localDataUrl) {
      setImgSrc(chat.localDataUrl);
      return;
    }
    // If no dataUrl, fall back to previewUrl (same session only)
    if (chat.localPreviewUrl && imgSrc !== chat.localPreviewUrl) {
      setImgSrc(chat.localPreviewUrl);
      return;
    }
    // Otherwise clear to avoid broken icon
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
