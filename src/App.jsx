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

// ✅ Safe localStorage write that trims data if quota is hit
// IMPORTANT: this never mutates the in-memory `chats` React state.
function safeSaveChats(key, chats) {
  // 1) try full save
  try {
    localStorage.setItem(key, JSON.stringify(chats));
    localStorage.setItem("lastTradeChats", JSON.stringify(chats));
    return;
  } catch {}

  // 2) remove localPreviewUrl (never needed after refresh) in what we SAVE
  let trimmed = chats.map((c) => {
    const { localPreviewUrl, ...rest } = c;
    return { ...rest, localPreviewUrl: null };
  });
  try {
    localStorage.setItem(key, JSON.stringify(trimmed));
    localStorage.setItem("lastTradeChats", JSON.stringify(trimmed));
    return;
  } catch {}

  // 3) keep localDataUrl only for newest 10 chats in what we SAVE
  const keepN = 10;
  trimmed = trimmed.map((c, i) => {
    const keep = i >= trimmed.length - keepN;
    return { ...c, localDataUrl: keep ? c.localDataUrl : null };
  });
  try {
    localStorage.setItem(key, JSON.stringify(trimmed));
    localStorage.setItem("lastTradeChats", JSON.stringify(trimmed));
    return;
  } catch {}

  // 4) drop oldest chats until it fits (only in what we write)
  let dropCount = 0;
  while (dropCount < trimmed.length) {
    const dropping = trimmed.slice(dropCount);
    try {
      localStorage.setItem(key, JSON.stringify(dropping));
      localStorage.setItem("lastTradeChats", JSON.stringify(dropping));
      return;
    } catch {
      dropCount++;
    }
  }

  // if all fails, give up on saving — but DO NOT touch `chats` in memory
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

  // ✅ Form preview URL (for the composer thumbnail)
  const [previewUrl, setPreviewUrl] = useState(null);

  // ✅ Auto-scroll anchor
  const chatEndRef = useRef(null);
  const chatWrapRef = useRef(null);

  // Create / cleanup blob URL for the preview thumbnail
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

  // Persist chats whenever they change (with quota protection)
  useEffect(() => {
    const key = `tradeChats:${selectedDay}`;
    safeSaveChats(key, chats);
  }, [chats, selectedDay]);

  // ✅ Auto-scroll whenever a new chat is added OR updated
  useEffect(() => {
    if (!chats.length) return;
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [chats.length, chats]);

  const isValid = useMemo(
    () => !!form.strategyNotes && !!form.file,
    [form]
  );
  const onChange = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!isValid || submitting) return;
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
        screenshotUrl: null, // will be Drive URL later
        localPreviewUrl,
        localDataUrl,
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

      // Reset composer (but DO NOT wipe chats)
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
      padding: "24px 12px",
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
    title: { fontSize: 26, fontWeight: 800, margin: 0 },
    subtitle: { fontSize: 12, opacity: 0.7, marginTop: 6 },

    // Shell around chat + composer
    chatShell: {
      display: "flex",
      flexDirection: "column",
      gap: 10,
      flex: "1 1 auto",
    },

    // Scrollable chat area
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

    // Composer at the bottom (row: 1/4 screenshot, 3/4 text)
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

    // Small screenshot box inside the composer
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

    // Chat bubbles
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
      border: "1px solid #1b9aaa55",
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
                No trades yet. Upload a chart + notes below to get feedback.
              </div>
            )}

            {chats.map((chat) => (
              <ChatTurn key={chat.id} chat={chat} styles={styles} />
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* COMPOSER (screenshot left, text right) */}
          <form onSubmit={handleSubmit} style={styles.composer}>
            <div style={styles.composerRow}>
              {/* LEFT: 1/4 screenshot picker */}
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
                      {/* X button to clear screenshot */}
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

              {/* RIGHT: 3/4 textarea */}
              <div style={styles.composerRight}>
                <div style={styles.label}>
                  Strategy / thought process — what setup were you taking?
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
                Tip: define VITE_N8N_TRADE_FEEDBACK_WEBHOOK in .env.local and in
                your deploy env.
              </div>
            )}
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
