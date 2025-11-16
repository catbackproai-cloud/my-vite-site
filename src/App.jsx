import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Trading Coach (MVP) — Minimal Input + Centered Layout + Per-Day Save
 * - Big centered screenshot drop area (drag/drop or click)
 * - Thought process textarea below
 * - Saves & loads per day via localStorage using key: tradeFeedback:YYYY-MM-DD
 *
 * Env: VITE_N8N_TRADE_FEEDBACK_WEBHOOK=https://<your-n8n-domain>/webhook/trade_feedback
 * Prop: selectedDay (YYYY-MM-DD) — passed from main.jsx date navigator
 */

const WEBHOOK_URL = import.meta.env.VITE_N8N_TRADE_FEEDBACK_WEBHOOK;

export default function App({ selectedDay = new Date().toISOString().slice(0, 10) }) {
  const [form, setForm] = useState({ strategyNotes: "", file: null });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Load saved result for the selected day
  useEffect(() => {
    try {
      const key = `tradeFeedback:${selectedDay}`;
      const saved = localStorage.getItem(key);
      setResult(saved ? JSON.parse(saved) : null);
      // Do NOT auto-fill file; always reset file on day change
      setForm((prev) => ({ ...prev, file: null }));
    } catch {
      setResult(null);
    }
  }, [selectedDay]);

  const isValid = useMemo(() => !!form.strategyNotes && !!form.file, [form]);
  const onChange = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    setResult(null);
    try {
      if (!WEBHOOK_URL) throw new Error("Missing VITE_N8N_TRADE_FEEDBACK_WEBHOOK");

      const fd = new FormData();
      fd.append("day", selectedDay); // <-- include the day
      fd.append("strategyNotes", form.strategyNotes);
      if (form.file) fd.append("screenshot", form.file);

      const res = await fetch(WEBHOOK_URL, { method: "POST", body: fd });
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const data = await res.json();

      setResult(data);

      // Save per-day and also keep a global "last" for convenience
      try {
        const key = `tradeFeedback:${selectedDay}`;
        localStorage.setItem(key, JSON.stringify(data));
        localStorage.setItem("lastTradeFeedback", JSON.stringify(data));
      } catch {}
    } catch (err) {
      setError(err.message || "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  // --- Drag & drop handlers for the big upload box ---
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
    header: {
      textAlign: "center",
      marginBottom: 16,
    },
    dayBadge: {
      display: "inline-block",
      fontSize: 12,
      opacity: 0.75,
      border: "1px solid #243043",
      borderRadius: 10,
      padding: "4px 10px",
      marginTop: 6,
    },
    title: {
      fontSize: 26,
      fontWeight: 800,
      margin: 0,
    },
    subtitle: { fontSize: 12, opacity: 0.7, marginTop: 6 },
    form: { display: "grid", gap: 14 },
    drop: {
      background: "#0d121a",
      border: "2px dashed #243043",
      borderRadius: 16,
      height: 280, // big box height
      display: "grid",
      placeItems: "center",
      textAlign: "center",
      padding: 16,
      cursor: "pointer",
      transition: "border-color .2s ease, background .2s ease",
    },
    dropActive: {
      borderColor: "#1b9aaa",
      background: "#0f1621",
    },
    dropTextMain: { fontWeight: 700, marginBottom: 6 },
    dropTextSub: { fontSize: 12, opacity: 0.7 },
    previewImg: {
      maxWidth: "100%",
      maxHeight: 240,
      borderRadius: 12,
      border: "1px solid #243043",
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
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Trade Coach (Personal)</h1>
          <div style={styles.subtitle}>
            Upload chart (screenshot) → then write your thought process → AI feedback
          </div>
          <div style={styles.dayBadge}>Day: {selectedDay} • saved per-day</div>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* BIG SCREENSHOT UPLOAD BOX (CENTERED) */}
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
                <div style={styles.dropTextSub}>or click to browse (.png / .jpg)</div>
              </div>
            ) : (
              <img src={URL.createObjectURL(form.file)} alt="preview" style={styles.previewImg} />
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => onChange("file", e.target.files?.[0] || null)}
              style={{ display: "none" }}
            />
          </div>

          {/* THOUGHT PROCESS TEXTBOX BELOW THE SCREENSHOT */}
          <div>
            <div style={styles.label}>Strategy / thought process — what setup were you taking?</div>
            <textarea
              value={form.strategyNotes}
              onChange={(e) => onChange("strategyNotes", e.target.value)}
              placeholder="Explain your idea: HTF bias, BOS/CHoCH, FVG fill, OB mitigation, session, target, risk plan, management rules..."
              required
              style={styles.textarea}
            />
          </div>

          <button disabled={!isValid || submitting} style={styles.button}>
            {submitting ? "Scoring…" : "Get Feedback"}
          </button>
        </form>

        {error && <div style={styles.error}>Error: {error}</div>}

        {result && <FeedbackCard data={result} />}
      </div>
    </div>
  );
}

function FeedbackCard({ data }) {
  // Expected response:
  // { id, timestamp, screenshotUrl, grade,
  //   feedback: { wentWrong[], doBetter[], learn[], verdict },
  //   inferred?: { market, direction, timeframe, session } }
  const { id, timestamp, screenshotUrl, grade, feedback, inferred } = data || {};

  const lineTop = [inferred?.market, inferred?.direction, inferred?.timeframe]
    .filter(Boolean)
    .join(" · ");

  const card = {
    background: "#121821",
    borderRadius: 16,
    boxShadow: "0 8px 30px rgba(0,0,0,.35)",
    padding: 16,
    marginTop: 20,
  };

  const pillar = {
    background: "#0d121a",
    border: "1px solid #243043",
    borderRadius: 12,
    padding: 12,
  };

  return (
    <div style={card}>
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr", alignItems: "start" }}>
        {screenshotUrl && (
          <img
            src={screenshotUrl}
            alt="trade"
            style={{
              width: "100%",
              maxWidth: 420,
              borderRadius: 12,
              border: "1px solid #243043",
              justifySelf: "center",
            }}
          />
        )}

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
            <div>
              <div style={{ fontWeight: 800 }}>{lineTop || "Inferred details shown after scoring"}</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                {(inferred?.session ? inferred.session + " · " : "")}
                {timestamp ? new Date(timestamp).toLocaleString() : ""}
              </div>
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 900,
                lineHeight: 1,
                padding: "6px 12px",
                borderRadius: 12,
                border: "1px solid #243043",
              }}
            >
              {grade}
            </div>
          </div>

          {feedback?.verdict && <p style={{ marginTop: 12, opacity: 0.9 }}>{feedback.verdict}</p>}

          <div
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              marginTop: 12,
            }}
          >
            <Pillar title="Where it went wrong" items={feedback?.wentWrong} />
            <Pillar title="What to do better next time" items={feedback?.doBetter} />
            <Pillar title="What to learn" items={feedback?.learn} />
          </div>

          <div style={{ marginTop: 12, fontSize: 12, opacity: 0.6 }}>ID: {id}</div>
        </div>
      </div>
    </div>
  );
}

function Pillar({ title, items }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ background: "#0d121a", border: "1px solid #243043", borderRadius: 12, padding: 12 }}>
      <div style={{ fontWeight: 800, marginBottom: 6 }}>{title}</div>
      <ul style={{ paddingLeft: 18, margin: 0 }}>
        {items.map((it, i) => (
          <li key={i} style={{ margin: "6px 0" }}>
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
